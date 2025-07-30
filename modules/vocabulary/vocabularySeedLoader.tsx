import fs from "fs/promises";
import path from "path";

export interface VocabularyTerm {
  word: string;
  definition: string;
  partOfSpeech?: string;
  synonyms?: string[];
  usageExamples?: string[];
  frequency?: number;
  tags?: string[];
}

const SEED_DIR = path.resolve(process.cwd(), "data/seed/vocabulary");

export async function getSeedVocabularyTerms(): Promise<Record<string, VocabularyTerm>> {
  const combinedTerms: Record<string, VocabularyTerm> = {};
  try {
    const files = await fs.readdir(SEED_DIR);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(SEED_DIR, file), "utf-8");
        const parsed = JSON.parse(raw);
        // Optional: validation here e.g., zodSchema.parse(parsed)
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === "object" && value.word) {
            combinedTerms[key] = {
              word: value.word.trim(),
              definition: value.definition.trim(),
              partOfSpeech: value.partOfSpeech?.trim(),
              synonyms: Array.isArray(value.synonyms) ? value.synonyms : [],
              usageExamples: Array.isArray(value.usageExamples) ? value.usageExamples : [],
              frequency: typeof value.frequency === "number" ? value.frequency : 0,
              tags: Array.isArray(value.tags) ? value.tags : [],
            };
          } else {
            console.warn(`[vocabularySeedLoader] Skipping invalid entry ${key} in ${file}`);
          }
        });
      } catch (err) {
        console.error(`[vocabularySeedLoader] Failed to parse ${file}:`, err);
      }
    }
  } catch (dirError) {
    console.error("[vocabularySeedLoader] Failed to read seed directory:", dirError);
  }
  return combinedTerms;
}
