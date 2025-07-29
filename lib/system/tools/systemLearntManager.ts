import fs from "fs/promises"
import path from "path"
import { SystemState, SystemLogEntry, DiagnosticReport } from "./types"

const DATA_FILE = path.resolve(process.cwd(), "data/learnt/system.json")

async function loadState(): Promise<SystemState> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8")
    return JSON.parse(raw)
  } catch {
    return {
      logs: [],
      audits: [],
      diagnostics: [],
      performance: {
        uptime: 0,
        averageResponseTime: 0,
        totalQueries: 0,
        successRate: 0,
      },
      knowledgeBase: {},
      warnings: [],
      maintenanceHistory: [],
    }
  }
}

async function saveState(state: SystemState): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2))
}

export const systemLearntManager = {
  getAll: loadState,
  saveAll: saveState,

  async log(entry: SystemLogEntry) {
    const state = await loadState()
    state.logs.push(entry)
    await saveState(state)
  },

  async reportDiagnostic(report: DiagnosticReport) {
    const state = await loadState()
    state.diagnostics.push(report)
    await saveState(state)
  },

  async updatePerformance(perf: Partial<SystemState["performance"]>) {
    const state = await loadState()
    state.performance = { ...state.performance, ...perf }
    await saveState(state)
  },

  async updateKnowledge(key: string, value: any) {
    const state = await loadState()
    state.knowledgeBase[key] = value
    await saveState(state)
  },
}
// System typically doesn't "learn" in the same way, but you can log system events or health checks here if needed.
