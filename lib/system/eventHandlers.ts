import { AuditRecord, SystemLogEntry } from "./types"
import { learnFromNewData } from "./knowledgeUpdater"
import { systemLearntManager } from "./systemLearntManager"

export async function onLogEntry(log: SystemLogEntry) {
  if (log.level === "error") {
    await learnFromNewData("logging", "errorPattern", log.message)
  }

  await systemLearntManager.log(log)
}

export async function onAudit(audit: AuditRecord) {
  await systemLearntManager.log({
    timestamp: audit.timestamp,
    level: "info",
    message: `AUDIT: ${audit.domain} ${audit.action} ${audit.key}`,
  })
}
