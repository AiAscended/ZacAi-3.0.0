import fs from "fs/promises";
import path from "path";

// Example schema validation (replace with Ajv/Zod for strictness)
export function validateConcept(data: any): boolean {
  return typeof data === "object" && typeof data.description === "string";
}

export async function getLearntConcept(domain: string, concept: string, learntDir: string) {
  try {
    const file = path.join(learntDir, `${domain}_learnt.json`);
    const raw = await fs.readFile(file, "utf-8");
    const learnt = JSON.parse(raw);
    return learnt[concept] || null;
  } catch {
    return null;
  }
}

export async function saveLearntConcept(domain: string, concept: string, data: any, learntDir: string) {
  const file = path.join(learntDir, `${domain}_learnt.json`);
  let learnt: Record<string, any> = {};
  try {
    const raw = await fs.readFile(file, "utf-8");
    learnt = JSON.parse(raw);
  } catch {}
  learnt[concept] = data;
  await fs.writeFile(file, JSON.stringify(learnt, null, 2));
}
