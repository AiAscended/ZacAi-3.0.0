import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface MathConcept {
  name: string
  description: string
  formula?: string
  examples?: string[]
  relatedConcepts?: string[]
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.mathematics)

async function loadAll(): Promise<Record<string, MathConcept>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, MathConcept>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllConcepts(): Promise<Record<string, MathConcept>> {
  return loadAll()
}

export async function getConcept(name: string): Promise<MathConcept | undefined> {
  const all = await loadAll()
  return all[name]
}

export async function saveConcept(name: string, concept: MathConcept): Promise<void> {
  const all = await loadAll()
  all[name] = { ...concept, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("mathematics", "save", name, concept)
}

export async function deleteConcept(name: string): Promise<void> {
  const all = await loadAll()
  if (name in all) {
    delete all[name]
    await saveAll(all)
    await auditLogger.logChange("mathematics", "delete", name)
  }
}
