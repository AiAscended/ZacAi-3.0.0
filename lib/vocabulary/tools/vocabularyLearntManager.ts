import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface VocabularyEntry {
  word: string
  definition: string
  partOfSpeech?: string
  synonyms?: string[]
  usageExamples?: string[]
  frequency?: number
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.vocabulary)

async function loadAll(): Promise<Record<string, VocabularyEntry>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, VocabularyEntry>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllVocab(): Promise<Record<string, VocabularyEntry>> {
  return loadAll()
}

export async function getWord(word: string): Promise<VocabularyEntry | undefined> {
  const all = await loadAll()
  return all[word]
}

export async function saveWord(word: string, entry: VocabularyEntry): Promise<void> {
  const all = await loadAll()
  all[word] = { ...entry, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("vocabulary", "save", word, entry)
}

export async function deleteWord(word: string): Promise<void> {
  const all = await loadAll()
  if (word in all) {
    delete all[word]
    await saveAll(all)
    await auditLogger.logChange("vocabulary", "delete", word)
  }
}

// Increment usage frequency
export async function incrementFrequency(word: string): Promise<void> {
  const all = await loadAll()
  if (all[word]) {
    all[word].frequency = (all[word].frequency ?? 0) + 1
    all[word].updatedAt = Date.now()
    await saveAll(all)
    await auditLogger.logChange("vocabulary", "update", word, { frequency: all[word].frequency })
  }
}
