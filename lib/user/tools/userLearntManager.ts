import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface UserMemoryEntry {
  content: any
  updatedAt?: number
}

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.user)

async function loadAll(): Promise<Record<string, UserMemoryEntry>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, UserMemoryEntry>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllUserMemory(): Promise<Record<string, UserMemoryEntry>> {
  return loadAll()
}

export async function getUserMemory(key: string): Promise<UserMemoryEntry | undefined> {
  const all = await loadAll()
  return all[key]
}

export async function saveUserMemory(key: string, entry: UserMemoryEntry): Promise<void> {
  const all = await loadAll()
  all[key] = { ...entry, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("user-memory", "save", key, entry)
}

export async function deleteUserMemory(key: string): Promise<void> {
  const all = await loadAll()
  if (key in all) {
    delete all[key]
    await saveAll(all)
    await auditLogger.logChange("user-memory", "delete", key)
  }
}
