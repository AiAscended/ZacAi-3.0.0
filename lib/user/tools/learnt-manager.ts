import fs from "fs/promises";
import path from "path";

// User profile validation (customize as needed)
export function validateUserProfile(data: any): boolean {
  return typeof data === "object" && typeof data.name === "string";
}

export async function getLearntUser(userId: string, learntPath: string) {
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    const learnt = JSON.parse(raw);
    return learnt[userId] || null;
  } catch {
    return null;
  }
}

export async function saveLearntUser(userId: string, data: any, learntPath: string) {
  let learnt: Record<string, any> = {};
  try {
    const raw = await fs.readFile(learntPath, "utf-8");
    learnt = JSON.parse(raw);
  } catch {}
  learnt[userId] = data;
  await fs.writeFile(learntPath, JSON.stringify(learnt, null, 2));
}
