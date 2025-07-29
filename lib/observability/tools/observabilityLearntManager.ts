import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface ObservabilityConcept {
  description: string
  category?: string
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.observability)

async function loadAll(): Promise<Record<string, ObservabilityConcept>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, ObservabilityConcept>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllObservability(): Promise<Record<string, ObservabilityConcept>> {
  return loadAll()
}

export async function getObservability(key: string): Promise<ObservabilityConcept | undefined> {
  const all = await loadAll()
  return all[key]
}

export async function saveObservability(key: string, entry: ObservabilityConcept): Promise<void> {
  const all = await loadAll()
  all[key] = { ...entry, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("observability", "save", key, entry)
}

export async function deleteObservability(key: string): Promise<void> {
  const all = await loadAll()
  if (key in all) {
    delete all[key]
    await saveAll(all)
    await auditLogger.logChange("observability", "delete", key)
  }
}
