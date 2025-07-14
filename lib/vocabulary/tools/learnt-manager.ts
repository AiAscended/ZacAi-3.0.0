import fs from "fs/promises";
import path from "path";

export function validateWord(data: any): boolean {
  return typeof data === "object" && typeof data.definition === "string";
}

export async function getLearntWord(word: string, learntPath: string) {
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    const learnt = JSON.parse(raw);
    return learnt[word] || null;
  } catch {
    return null;
  }
}

export async function saveLearntWord(word: string, data: any, learntPath: string) {
  let learnt: Record<string, any> = {};
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    learnt = JSON.parse(raw);
  } catch {}
  learnt[word] = data;
  await fs.writeFile(learntPath, JSON.stringify(learnt, null, 2));
}
