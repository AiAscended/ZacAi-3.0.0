import fs from "fs/promises";
import path from "path";
import LRU from "lru-cache";
import { getLearntWord, saveLearntWord, validateWord } from "./tools/learnt-manager";
import { fetchDefinition } from "./api";
import { semanticSearch } from "./tools/semantic-search";
import { runPlugins } from "./tools/plugin-manager";

// Config
const SEED_PATH = path.join(process.cwd(), "data/vocabulary/seed.json");
const LEARNT_PATH = path.join(process.cwd(), "data/learnt/vocabulary/learnt.json");
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

// Main engine
export async function process(
  prompt: string,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    // Plugin pre-processing
    let pluginResult = await runPlugins("preProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    const word = extractWord(prompt);

    if (cache.has(word)) return { ...cache.get(word), source: "cache" };

    const learnt = await getLearntWord(word, LEARNT_PATH);
    if (learnt) {
      cache.set(word, learnt);
      return { ...learnt, source: "learnt" };
    }

    const seedData = await loadSeedData();
    if (seedData[word]) {
      cache.set(word, seedData[word]);
      return { ...seedData[word], source: "seed" };
    }

    const apiResult = await fetchDefinition(word);
    if (apiResult && validateWord(apiResult)) {
      await saveLearntWord(word, apiResult, LEARNT_PATH);
      cache.set(word, apiResult);
      return { ...apiResult, source: "api" };
    }

    const similar = await semanticSearch(word, { seedData, learntPath: LEARNT_PATH });
    if (similar) return { ...similar, source: "semantic" };

    pluginResult = await runPlugins("postProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    return {
      error: "Word not found",
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

export async function batchProcess(
  prompts: string[],
  context: Record<string, any> = {}
): Promise<any[]> {
  return Promise.all(prompts.map((p) => process(p, context)));
}

function extractWord(prompt: string): string {
  // Simple word extraction (customize as needed)
  const match = prompt.match(/\b[a-zA-Z]+\b/);
  return match ? match[0].toLowerCase() : prompt.trim();
}
