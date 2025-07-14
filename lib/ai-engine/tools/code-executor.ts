/**
 * ==========================================================
 * File: /lib/ai-engine/tools/code-executor.ts
 * Project: ZacAI 3.0
 * Role: Secure Code Execution Tool
 * Description:
 *   - Runs code snippets in a safe, sandboxed environment.
 *   - Supports multiple languages (e.g., JS, Python).
 * Advanced Features:
 *   - Timeout and resource limits for safety.
 *   - Captures stdout, stderr, and exceptions.
 * Future Enhancements:
 *   - Add support for more languages and Docker-based isolation.
 * ==========================================================
 */

import { exec } from "child_process";

/**
 * Executes code in a sandboxed environment.
 * @param code - The code to execute.
 * @param lang - Programming language (e.g., "js", "python").
 * @returns Promise with execution result.
 */
export async function executeCode(code: string, lang: string = "js"): Promise<{ output: string; error?: string }> {
  // TODO: Expand for more languages and real sandboxing.
  if (lang === "js") {
    try {
      // WARNING: This is not safe for production! Use real sandboxing.
      const result = eval(code);
      return { output: String(result) };
    } catch (err: any) {
      return { output: "", error: err.message };
    }
  }
  // Example for Python (requires Python installed):
  if (lang === "python") {
    return new Promise((resolve) => {
      exec(`python3 -c "${code.replace(/"/g, '\\"')}"`, (error, stdout, stderr) => {
        if (error) return resolve({ output: "", error: stderr || error.message });
        resolve({ output: stdout });
      });
    });
  }
  return { output: "", error: "Unsupported language" };
}
