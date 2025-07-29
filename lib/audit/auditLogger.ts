import fs from "fs/promises"
import path from "path"
import { DATA_PATHS } from "@/lib/constants"

export interface AuditEntry {
  id: string
  domain: string
  action: "add" | "update" | "delete"
  key: string
  timestamp: number
  user?: string
  oldValue?: any
  newValue?: any
}

async function readLog(): Promise<AuditEntry[]> {
  try {
    const raw = await fs.readFile(DATA_PATHS.audit, "utf-8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeLog(log: AuditEntry[]) {
  await fs.writeFile(DATA_PATHS.audit, JSON.stringify(log, null, 2))
}

const auditLogger = {
  async logChange(
    domain: string,
    action: "add" | "update" | "delete",
    key: string,
    newValue?: any,
    oldValue?: any,
    user?: string
  ) {
    const log = await readLog()
    const entry: AuditEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      domain,
      action,
      key,
      timestamp: Date.now(),
      user,
      newValue,
      oldValue,
    }
    log.push(entry)
    await writeLog(log)
  },

  async getAll(): Promise<AuditEntry[]> {
    return await readLog()
  },
}

export default auditLogger
