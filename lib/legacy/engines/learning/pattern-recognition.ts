/**
 * PatternRecognitionEngine
 * Detects learning patterns, knowledge gaps, and recurring errors to personalize the learning path.
 * Used in adaptive learning systems to optimize review schedules and content selection[3][4][5][6][7][8].
 */

export type LearningPattern = {
  id: string
  type: "knowledgeGap" | "mastery" | "errorPattern" | "recallPattern"
  description: string
  occurrences: number
  lastDetected: number
  examples: string[]
}

export class PatternRecognitionEngine {
  private patterns: Record<string, LearningPattern> = {}

  /**
   * Adds or updates a detected pattern.
   */
  public upsertPattern(pattern: LearningPattern): void {
    this.patterns[pattern.id] = {
      ...pattern,
      lastDetected: Date.now(),
      occurrences: (this.patterns[pattern.id]?.occurrences || 0) + 1,
    }
  }

  /**
   * Detects patterns from a batch of user responses or learning data.
   * Example: Find repeated errors or common knowledge gaps.
   */
  public detectPatterns(data: Array<{ content: string; correct: boolean }>): LearningPattern[] {
    const gapMap: Record<string, LearningPattern> = {}

    data.forEach((item, idx) => {
      if (!item.correct) {
        const key = `gap-${item.content.toLowerCase()}`
        if (!gapMap[key]) {
          gapMap[key] = {
            id: key,
            type: "knowledgeGap",
            description: `Repeated error on "${item.content}"`,
            occurrences: 1,
            lastDetected: Date.now(),
            examples: [item.content],
          }
        } else {
          gapMap[key].occurrences++
          gapMap[key].examples.push(item.content)
        }
      }
    })

    // Merge detected patterns into main patterns store
    Object.values(gapMap).forEach((pat) => this.upsertPattern(pat))

    return Object.values(gapMap)
  }

  /**
   * Returns all tracked patterns.
   */
  public getPatterns(): LearningPattern[] {
    return Object.values(this.patterns)
  }

  /**
   * Clears all tracked patterns.
   */
  public reset(): void {
    this.patterns = {}
  }
}
