import { systemLearntManager } from "./systemLearntManager"

export async function learnFromNewData(domain: string, key: string, data: any) {
  await systemLearntManager.updateKnowledge(`${domain}:${key}`, {
    source: "autonomous",
    value: data,
    learnedAt: Date.now(),
  })
}
