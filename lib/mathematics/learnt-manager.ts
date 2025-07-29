import fs from "fs/promises";
import path from "path";

export function validateMath(data: any): boolean {
  return typeof data === "object" && (typeof data.result === "number" || typeof data.fact === "string");
}

export async function getLearntMath(query: string, learntPath: string) {
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    const learnt = JSON.parse(raw);
    return learnt[query] || null;
  } catch {
    return null;
  }
}

export async function saveLearntMath(query: string, data: any, learntPath: string) {
  let learnt: Record<string, any> = {};
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    learnt = JSON.parse(raw);
  } catch {}
  learnt[query] = data;
  await fs.writeFile(learntPath, JSON.stringify(learnt, null, 2));
}
