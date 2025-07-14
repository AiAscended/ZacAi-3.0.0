/**
 * ==========================================================
 * File: /lib/coding/stream.ts
 * Project: ZacAI 3.0
 * Role: Streaming Code Output Utility
 * Description:
 *   - Streams code generation or explanation results in real time.
 *   - Supports chunked and progressive output for UX.
 * Advanced Features:
 *   - Integrates with WebSockets, SSE, or other protocols.
 *   - Can stream both code and explanations.
 * Future Enhancements:
 *   - Add support for collaborative coding sessions.
 * ==========================================================
 */

/**
 * Streams a code response in chunks.
 */
export async function* streamCodeResponse(fullText: string, chunkSize: number = 80) {
  for (let i = 0; i < fullText.length; i += chunkSize) {
    yield fullText.slice(i, i + chunkSize);
  }
}
