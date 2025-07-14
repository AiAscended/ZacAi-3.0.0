/**
 * ==========================================================
 * File: /lib/ai-engine/rate-limiter.ts
 * Project: ZacAI 3.0
 * Role: Rate Limiting Module
 * Description:
 *   - Controls the frequency of requests per user/session.
 *   - Prevents overload, abuse, and ensures fair usage.
 * Advanced Features:
 *   - Configurable limits and time windows.
 *   - Can be extended for distributed environments.
 * Future Enhancements:
 *   - Integrate with persistent stores or external rate-limiting services.
 * ==========================================================
 */

const userTimestamps: Record<string, number[]> = {};
const REQUEST_LIMIT = 100; // max requests
const WINDOW_MS = 60 * 1000; // per minute

/**
 * Checks if a user/session is within the allowed request rate.
 */
export function isRateLimited(userId: string): boolean {
  const now = Date.now();
  userTimestamps[userId] = (userTimestamps[userId] || []).filter(ts => now - ts < WINDOW_MS);
  if (userTimestamps[userId].length >= REQUEST_LIMIT) return true;
  userTimestamps[userId].push(now);
  return false;
}
