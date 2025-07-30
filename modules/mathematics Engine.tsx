import fs from "fs/promises";
import path from "path";
import LRU from "lru-cache";
import { getLearntMath, saveLearntMath, validateMath } from "./tools/learnt-manager";
import { fetchMathFact } from "./api";
import { semanticSearch } from "./tools/semantic-search";
import { runPlugins } from "./tools/plugin-manager";

// Config
const SEED_PATH = path.join(process.cwd(), "data/mathematics/seed.json");
const LEARNT_PATH = path.join(process.cwd(), "data/learnt/mathematics/learnt.json");
const CACHE_MAX = 200;
const cache = new LRU<string, any>({ max: CACHE_MAX });

// Load seed data
async function loadSeedData(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(SEED_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function process(
  prompt: string,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    let pluginResult = await runPlugins("preProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    const query = extractMathQuery(prompt);

    if (cache.has(query)) return { ...cache.get(query), source: "cache" };

    const learnt = await getLearntMath(query, LEARNT_PATH);
    if (learnt) {
      cache.set(query, learnt);
      return { ...learnt, source: "learnt" };
    }

    const seedData = await loadSeedData();
    if (seedData[query]) {
      cache.set(query, seedData[query]);
      return { ...seedData[query], source: "seed" };
    }

    const apiResult = await fetchMathFact(query);
    if (apiResult && validateMath(apiResult)) {
      await saveLearntMath(query, apiResult, LEARNT_PATH);
      cache.set(query, apiResult);
      return { ...apiResult, source: "api" };
    }

    const similar = await semanticSearch(query, { seedData });
    if (similar) return { ...similar, source: "semantic" };

    pluginResult = await runPlugins("postProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    // As a fallback, try to evaluate as a math expression
    try {
      // WARNING: Use a proper math parser for untrusted input in production!
      const result = eval(query);
      return { result, source: "eval" };
    } catch {}

    return {
      error: "Math fact not found",
      prompt,
      tried: ["cache", "learnt", "seed", "api", "semantic", "eval"],
      timestamp: Date.now(),
    };
  } catch (err: any) {
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

function extractMathQuery(prompt: string): string {
  // Extract math expression or keyword (customize as needed)
  return prompt.replace(/[^0-9+\-*/().]/g, "").trim() || prompt.trim();
}
