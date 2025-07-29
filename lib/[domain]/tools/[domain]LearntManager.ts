import fs from "fs/promises"
import path from "path"
import { DATA_PATHS } from "@/lib/constants"

const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.vocabulary) // adjust for each domain

export async function getAll(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function get(key: string): Promise<any | undefined> {
  const all = await getAll()
  return all[key]
}

export async function save(key: string, value: any): Promise<void> {
  const all = await getAll()
  all[key] = { ...value, updatedAt: Date.now() }
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2))
}

export async function update(key: string, patch: any): Promise<void> {
  const all = await getAll()
  all[key] = { ...(all[key] ?? {}), ...patch, updatedAt: Date.now() }
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2))
}

export async function deleteEntry(key: string): Promise<void> {
  const all = await getAll()
  delete all[key]
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2))
}
