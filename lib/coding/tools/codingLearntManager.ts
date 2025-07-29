import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface CodingSnippet {
  code: string
  language?: string
  notes?: string
  tags?: string[]
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.coding)

async function loadAll(): Promise<Record<string, CodingSnippet>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, CodingSnippet>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllSnippets(): Promise<Record<string, CodingSnippet>> {
  return loadAll()
}

export async function getSnippet(id: string): Promise<CodingSnippet | undefined> {
  const all = await loadAll()
  return all[id]
}

export async function saveSnippet(id: string, snippet: CodingSnippet): Promise<void> {
  const all = await loadAll()
  all[id] = { ...snippet, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("coding", "save", id, snippet)
}

export async function deleteSnippet(id: string): Promise<void> {
  const all = await loadAll()
  if (id in all) {
    delete all[id]
    await saveAll(all)
    await auditLogger.logChange("coding", "delete", id)
  }
}
