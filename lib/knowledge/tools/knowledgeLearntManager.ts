import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface KnowledgeEntry {
  statement: string
  source?: string
  relatedTopics?: string[]
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.knowledge)

async function loadAll(): Promise<Record<string, KnowledgeEntry>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, KnowledgeEntry>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllKnowledge(): Promise<Record<string, KnowledgeEntry>> {
  return loadAll()
}

export async function getKnowledge(key: string): Promise<KnowledgeEntry | undefined> {
  const all = await loadAll()
  return all[key]
}

export async function saveKnowledge(key: string, entry: KnowledgeEntry): Promise<void> {
  const all = await loadAll()
  all[key] = { ...entry, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("knowledge", "save", key, entry)
}

export async function deleteKnowledge(key: string): Promise<void> {
  const all = await loadAll()
  if (key in all) {
    delete all[key]
    await saveAll(all)
    await auditLogger.logChange("knowledge", "delete", key)
  }
}
