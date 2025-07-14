/**
 * ==========================================================
 * File: /lib/ai-engine/explainability.ts
 * Project: ZacAI 3.0
 * Role: Explainability & Trace Generator
 * Description:
 *   - Generates detailed trace logs of AI decision steps.
 *   - Provides utilities for attaching explanations to responses.
 * ==========================================================
 */

interface TraceStep {
  step: string;
  info: any;
  timestamp: number;
}

let globalTrace: TraceStep[] = [];

/**
 * Adds a trace step to the global trace.
 * @param step Description of the step.
 * @param info Additional info or metadata.
 * @returns The trace step object.
 */
export function generateTraceStep(step: string, info: any): TraceStep {
  const traceStep = { step, info, timestamp: Date.now() };
  globalTrace.push(traceStep);
  return traceStep;
}

/**
 * Clears the global trace.
 */
export function clearTrace() {
  globalTrace = [];
}

/**
 * Generates a human-readable trace string from the collected steps.
 * @param steps Optional: array of trace steps. Defaults to global trace.
 * @returns A formatted string.
 */
export function generateTrace(steps?: TraceStep[]): string {
  const traceSteps = steps || globalTrace;
  return traceSteps
    .map((t, i) => `${i + 1}. [${new Date(t.timestamp).toISOString()}] ${t.step} - ${JSON.stringify(t.info)}`)
    .join('\n');
}

/**
 * Attaches explainability info to a response object.
 * @param response The AI response object.
 * @param explanation Text explanation or trace.
 * @returns The augmented response.
 */
export function attachExplanation(response: any, explanation: string): any {
  return {
    ...response,
    explanation,
  };
}
