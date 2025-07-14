import fs from "fs/promises";
import path from "path";
import LRU from "lru-cache";
import * as vocab from "../vocabulary/engine";
import * as math from "../mathematics/engine";
import { fetchDocs } from "./api";
import { getLearntConcept, saveLearntConcept, validateConcept } from "./tools/learnt-manager";
import { semanticSearch } from "./tools/semantic-search";
import { runPlugins } from "./tools/plugin-manager";

// Config
const SEED_DIR = path.join(process.cwd(), "data/coding/");
const LEARNT_DIR = path.join(process.cwd(), "data/learnt/coding/");
const CACHE_MAX = 200;
const cache = new LRU<string, any>({ max: CACHE_MAX });

// Load domain-specific seed data dynamically
async function loadSeedData(domain: string): Promise<Record<string, any>> {
  try {
    const file = path.join(SEED_DIR, `${domain}_structure.json`);
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Stream large responses (for chat UIs or code blocks)
export async function* streamProcess(prompt: string, context: Record<string, any> = {}) {
  const result = await process(prompt, context);
  if (result && result.code && typeof result.code === "string") {
    for (let i = 0; i < result.code.length; i += 100) {
      yield result.code.slice(i, i + 100);
    }
  } else {
    yield JSON.stringify(result);
  }
}

// Main engine entry point
export async function process(
  prompt: string,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    const parsed = vocab.parsePrompt(prompt);
    const domain = parsed.domain || "general";
    const concept = parsed.concept || extractConcept(prompt);

    // Plugin pre-processing
    let pluginResult = await runPlugins("preProcess", { prompt, context, domain, concept });
    if (pluginResult?.handled) return pluginResult.result;

    if (cache.has(concept)) return { ...cache.get(concept), source: "cache" };

    const learnt = await getLearntConcept(domain, concept, LEARNT_DIR);
    if (learnt) {
      cache.set(concept, learnt);
      return { ...learnt, source: "learnt" };
    }

    const seedData = await loadSeedData(domain);
    if (seedData[concept]) {
      cache.set(concept, seedData[concept]);
      return { ...seedData[concept], source: "seed" };
    }

    const apiResult = await fetchDocs(domain, concept);
    if (apiResult && validateConcept(apiResult)) {
      await saveLearntConcept(domain, concept, apiResult, LEARNT_DIR);
      cache.set(concept, apiResult);
      return { ...apiResult, source: "api" };
    }

    const similar = await semanticSearch(concept, { domain, seedData, learntDir: LEARNT_DIR });
    if (similar) {
      return { ...similar, source: "semantic" };
    }

    if (!context.selfPrompted && parsed.related) {
      for (const rel of parsed.related) {
        const relResult = await process(rel, { ...context, selfPrompted: true });
        if (relResult && relResult.code) return relResult;
      }
    }

    if (parsed.needsMath && parsed.mathQuery) {
      const mathResult = await math.solve(parsed.mathQuery);
      return { mathResult, source: "math" };
    }

    pluginResult = await runPlugins("postProcess", { prompt, context, domain, concept });
    if (pluginResult?.handled) return pluginResult.result;

    logActivity("not_found", { prompt, domain, concept });
    return {
      error: "Concept not found",
      prompt,
      tried: ["cache", "learnt", "seed", "api", "semantic", "related", "math"],
      timestamp: Date.now(),
    };
  } catch (err: any) {
    logActivity("error", { error: err, prompt });
    return {
      error: err.message || "Unknown error",
      stack: err.stack,
      prompt,
      timestamp: Date.now(),
    };
  }
}

export async function batchProcess(
  prompts: string[],
  context: Record<string, any> = {}
): Promise<any[]> {
  return Promise.all(prompts.map((p) => process(p, context)));
}

function extractConcept(prompt: string): string {
  const match = prompt.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/);
  return match ? match[0] : prompt.trim();
}

function logActivity(event: string, details: any) {
  console.log(`[CodingEngine] ${event}`, details);
}
