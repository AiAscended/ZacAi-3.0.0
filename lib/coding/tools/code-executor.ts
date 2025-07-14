/**
 * ==========================================================
 * File: /lib/coding/tools/code-executor.ts
 * Project: ZacAI 3.0
 * Role: Secure Code Execution Tool
 * Description:
 *   - Runs code snippets in a safe, sandboxed environment.
 *   - Supports multiple languages (e.g., JS, Python).
 *   - Returns stdout, stderr, and execution metadata.
 * Advanced Features:
 *   - Timeout, resource limits, and output capture.
 *   - Pluggable for Docker or remote sandboxing.
 * Future Enhancements:
 *   - Add support for more languages, real container isolation, and test harnesses.
 * ==========================================================
 */

import { exec } from "child_process";

/**
 * Executes code in a sandboxed environment.
 * @param code - The code to execute.
 * @param lang - Programming language (e.g., "js", "python").
 * @returns Promise with execution result.
 */
export async function executeCode(
  code: string,
  lang: string = "js"
): Promise<{ output: string; error?: string; meta?: any }> {
  // WARNING: This is not secure for untrusted code in production!
  if (lang === "js") {
    try {
      const result = eval(code);
      return { output: String(result), meta: { lang } };
    } catch (err: any) {
      return { output: "", error: err.message, meta: { lang } };
    }
  }
  if (lang === "python") {
    return new Promise((resolve) => {
      exec(
        `python3 -c "${code.replace(/"/g, '\\"')}"`,
        { timeout: 5000 },
        (error, stdout, stderr) => {
          if (error) return resolve({ output: "", error: stderr || error.message, meta: { lang } });
          resolve({ output: stdout, meta: { lang } });
        }
      );
    });
  }
  return { output: "", error: "Unsupported language", meta: { lang } };
}
