import fs from "fs/promises";
import path from "path";

// Basic schema validation for grammar rules
export function validateGrammar(data: any): boolean {
  return typeof data === "object" && typeof data.rule === "string";
}

export async function getLearntGrammar(rule: string, learntPath: string) {
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    const learnt = JSON.parse(raw);
    return learnt[rule] || null;
  } catch {
    return null;
  }
}

export async function saveLearntGrammar(rule: string, data: any, learntPath: string) {
  let learnt: Record<string, any> = {};
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    learnt = JSON.parse(raw);
  } catch {}
  learnt[rule] = data;
  await fs.writeFile(learntPath, JSON.stringify(learnt, null, 2));
}
