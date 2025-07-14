import fs from "fs/promises";
import path from "path";
import LRU from "lru-cache";
import { getLearntGrammar, saveLearntGrammar, validateGrammar } from "./tools/learnt-manager";
import { fetchGrammarRule } from "./api";
import { semanticSearch } from "./tools/semantic-search";
import { runPlugins } from "./tools/plugin-manager";

// Config
const SEED_PATH = path.join(process.cwd(), "data/grammar/seed.json");
const LEARNT_PATH = path.join(process.cwd(), "data/learnt/grammar/learnt.json");
const CACHE_MAX = 100;
const cache = new LRU<string, any>({ max: CACHE_MAX });

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

    const rule = extractRule(prompt);

    if (cache.has(rule)) return { ...cache.get(rule), source: "cache" };

    const learnt = await getLearntGrammar(rule, LEARNT_PATH);
    if (learnt) {
      cache.set(rule, learnt);
      return { ...learnt, source: "learnt" };
    }

    const seedData = await loadSeedData();
    if (seedData[rule]) {
      cache.set(rule, seedData[rule]);
      return { ...seedData[rule], source: "seed" };
    }

    const apiResult = await fetchGrammarRule(rule);
    if (apiResult && validateGrammar(apiResult)) {
      await saveLearntGrammar(rule, apiResult, LEARNT_PATH);
      cache.set(rule, apiResult);
      return { ...apiResult, source: "api" };
    }

    const similar = await semanticSearch(rule, { seedData });
    if (similar) return { ...similar, source: "semantic" };

    pluginResult = await runPlugins("postProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    return {
      error: "Grammar rule not found",
      prompt,
      tried: ["cache", "learnt", "seed", "api", "semantic"],
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

function extractRule(prompt: string): string {
  // Customize for your grammar prompt style
  const match = prompt.match(/\b[a-zA-Z\s]+\b/);
  return match ? match[0].trim().toLowerCase() : prompt.trim();
}
