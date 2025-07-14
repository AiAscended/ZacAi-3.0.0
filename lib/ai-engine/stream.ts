/**
 * ==========================================================
 * File: /lib/ai-engine/stream.ts
 * Project: ZacAI 3.0
 * Role: Streaming Output Utility
 * Description:
 *   - Enables streaming output for chat, code, or large responses.
 *   - Supports real-time UX and progressive rendering.
 * Advanced Features:
 *   - Pluggable for different stream protocols (e.g., SSE, WebSockets).
 *   - Can be extended for multimodal streaming.
 * Future Enhancements:
 *   - Add support for backpressure and stream cancellation.
 * ==========================================================
 */

/**
 * Example: Streams a response in chunks.
 */
export async function* streamResponse(fullText: string, chunkSize: number = 100) {
  for (let i = 0; i < fullText.length; i += chunkSize) {
    yield fullText.slice(i, i + chunkSize);
  }
}
