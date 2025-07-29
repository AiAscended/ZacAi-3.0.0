import fs from "fs/promises"
import path from "path"
import auditLogger from "@/lib/audit/auditLogger"
import { DATA_PATHS } from "@/lib/constants"

export interface GrammarRule {
  id: string                       // Unique rule identifier (e.g. "subject-verb-agreement")
  description: string              // Short, human-readable description
  rule: string                     // The actual grammatical rule or pattern (e.g. "Singular subjects take singular verbs")
  examples?: string[]              // Example sentences or patterns
  corrections?: string[]           // Typical corrections for common errors
  tags?: string[]                  // e.g. ["verb", "agreement"]
  updatedAt?: number
}

// JSON file path, defined by your central config for consistency
const DATA_FILE = path.resolve(process.cwd(), DATA_PATHS.grammar)

async function loadAll(): Promise<Record<string, GrammarRule>> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function saveAll(data: Record<string, GrammarRule>): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function getAllRules(): Promise<Record<string, GrammarRule>> {
  return loadAll()
}

export async function getRule(id: string): Promise<GrammarRule | undefined> {
  const all = await loadAll()
  return all[id]
}

export async function saveRule(id: string, rule: GrammarRule): Promise<void> {
  const all = await loadAll()
  all[id] = { ...rule, updatedAt: Date.now() }
  await saveAll(all)
  await auditLogger.logChange("grammar", "save", id, rule)
}

export async function deleteRule(id: string): Promise<void> {
  const all = await loadAll()
  if (id in all) {
    delete all[id]
    await saveAll(all)
    await auditLogger.logChange("grammar", "delete", id)
  }
}

// Optional: Incrementally record usage or corrections/fixes for a rule
export async function recordRuleUsage(id: string): Promise<void> {
  const all = await loadAll()
  if (all[id]) {
    all[id].updatedAt = Date.now() // Could add a usage counter if desired
    await saveAll(all)
    await auditLogger.logChange("grammar", "update", id, { usedAt: Date.now() })
  }
}
