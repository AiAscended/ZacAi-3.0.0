/**
 * ==========================================================
 * File: /lib/ai-engine/safety.ts
 * Project: ZacAI 3.0
 * Role: Safety & Moderation Module
 * Description:
 *   - Provides content moderation, prompt sanitization, and guardrails.
 *   - Ensures compliance and prevents abuse.
 * Advanced Features:
 *   - Integrates with plugin system for custom moderation.
 *   - Can be extended for real-time monitoring and alerts.
 * Future Enhancements:
 *   - Add AI-powered toxicity and bias detection.
 * ==========================================================
 */

/**
 * Checks if a prompt contains unsafe content.
 */
export function isSafePrompt(prompt: string): boolean {
  // Simple keyword check (replace with advanced moderation as needed)
  const unsafeWords = ["hack", "exploit", "illegal"];
  return !unsafeWords.some(word => prompt.toLowerCase().includes(word));
}

/**
 * Sanitizes a prompt by removing or masking unsafe content.
 */
export function sanitizePrompt(prompt: string): string {
  // Replace unsafe words with asterisks
  const unsafeWords = ["hack", "exploit", "illegal"];
  let sanitized = prompt;
  unsafeWords.forEach(word => {
    const regex = new RegExp(word, "gi");
    sanitized = sanitized.replace(regex, "***");
  });
  return sanitized;
}
