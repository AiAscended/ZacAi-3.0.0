import { detectAnomalies } from "./anomalyDetector"
import { runSelfAssessment } from "./selfAssessment"
import { runSelfHealing } from "./selfHealing"

export async function runSystemAgentLoop() {
  console.log("🧠 Running System Agent...")
  await runSelfAssessment()
  await detectAnomalies()
  await runSelfHealing()
  console.log("✅ Agent Tick Complete")
}

// Optional: trigger every X minutes (server-side)
