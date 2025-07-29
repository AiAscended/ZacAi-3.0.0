import { systemLearntManager } from "./systemLearntManager"

export async function detectAnomalies(): Promise<string[]> {
  const state = await systemLearntManager.getAll()
  const warnings: string[] = []

  if (state.performance.successRate < 0.8) {
    warnings.push("⚠️ Success rate below 80%")
  }

  const recentErrors = state.logs.filter(
    (log) => log.level === "error" && log.timestamp > Date.now() - 60 * 60 * 1000
  )

  if (recentErrors.length > 10) {
    warnings.push("🚨 High error rate in the last hour")
  }

  for (const w of warnings) {
    await systemLearntManager.log({
      timestamp: Date.now(),
      level: "warn",
      message: w,
    })
    state.warnings.push(w)
  }

  await systemLearntManager.saveAll(state)
  return warnings
}
