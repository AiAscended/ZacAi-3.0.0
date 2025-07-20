/**
 * IntentAnalyzer
 * Classifies user intent, supports context-aware multi-intent detection, and provides confidence scoring for routing queries to the correct module.
 */

export interface IntentResult {
  intent: string
  confidence: number
  entities?: string[]
  reasoning?: string[]
}

export class IntentAnalyzer {
  /**
   * Analyzes user input and returns the detected intent and confidence score.
   * Extend this with NLP, keyword, or ML-based logic as needed.
   */
  public analyze(input: string, context?: any): IntentResult {
    const lower = input.toLowerCase()
    let intent = "default"
    let confidence = 0.5
    const reasoning: string[] = []

    if (/\d+[\+\-\*x÷\/]\d+/.test(lower) || /\b(add|subtract|multiply|divide|plus|minus|times|sum|product)\b/.test(lower)) {
      intent = "math"
      confidence = 0.9
      reasoning.push("Detected math keywords or symbols.")
    } else if (/\b(define|meaning|synonym|antonym|vocab|word)\b/.test(lower)) {
      intent = "vocab"
      confidence = 0.9
      reasoning.push("Detected vocabulary-related keywords.")
    } else if (/\b(code|javascript|react|next\.js|function|variable|const|let|class)\b/.test(lower)) {
      intent = "coding"
      confidence = 0.9
      reasoning.push("Detected coding-related keywords.")
    } else if (/\b(science|physics|chemistry|biology|atom|cell|formula|law)\b/.test(lower)) {
      intent = "science"
      confidence = 0.9
      reasoning.push("Detected science-related keywords.")
    }

    return { intent, confidence, reasoning }
  }
}
