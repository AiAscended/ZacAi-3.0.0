import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface SecurityConcept {
  title: string
  vulnerability: string
  mitigationNotes?: string
  affectedSystems?: string[]
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.security)

async function loadAll(): Promise<Record<string, SecurityConcept>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, SecurityConcept>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllSecurityConcepts(): Promise<Record<string, SecurityConcept>> {
  return loadAll()
}

export async function getSecurityConcept(key: string): Promise<SecurityConcept | undefined> {
  const all = await loadAll()
  return all[key]
}

export async function saveSecurityConcept(key: string, entry: SecurityConcept): Promise<void> {
  const all = await loadAll()
  all[key] = { ...entry, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("security", "save", key, entry)
}

export async function deleteSecurityConcept(key: string): Promise<void> {
  const all = await loadAll()
  if (key in all) {
    delete all[key]
    await saveAll(all)
    await auditLogger.logChange("security", "delete", key)
  }
}
