/**
 * PatternMatcher
 * Provides pattern matching and recognition for text, math, code, and science modules.
 * Supports both exact phrase and entity-based pattern matching, inspired by industry approaches[3][4][5].
 */

export interface PatternMatchResult {
  matched: boolean
  pattern: string
  entities?: Record<string, string>
  confidence: number
  reasoning?: string[]
}

type PatternDefinition = {
  pattern: string         // e.g. "define {word}", "add {num1} and {num2}"
  entities?: string[]     // e.g. ["word"], ["num1", "num2"]
  intent: string          // e.g. "vocab", "math"
  priority?: number       // higher = more preferred
}

export class PatternMatcher {
  private patterns: PatternDefinition[] = []

  public addPattern(patternDef: PatternDefinition): void {
    this.patterns.push(patternDef)
    // Sort by priority descending for matching order
    this.patterns.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * Attempts to match input against registered patterns.
   * Returns the best match with extracted entities and confidence score.
   */
  public match(input: string): PatternMatchResult {
    for (const patternDef of this.patterns) {
      const { pattern, entities } = patternDef
      // Convert pattern to regex by replacing {entity} with (.+)
      let regexStr = pattern.replace(/{(\w+)}/g, "(.+)")
      // Allow loose whitespace and case-insensitive matching
      const regex = new RegExp("^" + regexStr + "$", "i")
      const match = input.match(regex)
      if (match) {
        const entityValues: Record<string, string> = {}
        if (entities && entities.length > 0) {
          entities.forEach((ent, idx) => {
            entityValues[ent] = match[idx + 1]?.trim() || ""
          })
        }
        return {
          matched: true,
          pattern,
          entities: entityValues,
          confidence: 0.95,
          reasoning: [`Matched pattern "${pattern}" with entities: ${JSON.stringify(entityValues)}`],
        }
      }
    }
    // Fallback: no match
    return {
      matched: false,
      pattern: "",
      confidence: 0.1,
      reasoning: ["No pattern matched."],
    }
  }

  /**
   * Bulk load patterns for a module (e.g., math, vocab, coding).
   */
  public loadPatterns(patterns: PatternDefinition[]): void {
    patterns.forEach((p) => this.addPattern(p))
  }
}
