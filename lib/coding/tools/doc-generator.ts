/**
 * ==========================================================
 * File: /lib/coding/tools/doc-generator.ts
 * Project: ZacAI 3.0
 * Role: Documentation Generator
 * Description:
 *   - Auto-generates docstrings, README sections, and API docs from code.
 *   - Supports multiple languages and formats.
 * Advanced Features:
 *   - Summarizes code functionality and usage.
 *   - Integrates with LLM for natural language explanations.
 * Future Enhancements:
 *   - Add support for Markdown, HTML, and API spec formats.
 * ==========================================================
 */

import { infer } from "../../ai-engine/engine";

/**
 * Generates a docstring for a given code snippet using the LLM.
 */
export async function generateDocstring(code: string, lang: string = "js"): Promise<string> {
  const prompt = `Generate a detailed docstring for the following ${lang} code:\n${code}`;
  const { text } = await infer(prompt);
  return text.trim();
}

/**
 * Generates a README section for a code module.
 */
export async function generateReadmeSection(code: string, moduleName: string): Promise<string> {
  const prompt = `Write a README section describing the purpose, usage, and features of the module "${moduleName}" given the following code:\n${code}`;
  const { text } = await infer(prompt);
  return text.trim();
}
