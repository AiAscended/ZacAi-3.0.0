/**
 * AdaptiveLearningEngine
 * Implements adaptive learning strategies: spaced repetition, active recall, confidence-based review, and personalized content sequencing.
 * Inspired by leading adaptive learning systems and research[3][4][5][6][7][8].
 */

export interface AdaptiveLearningEntry {
  id: string
  content: any
  confidence: number
  lastReviewed: number
  reviewInterval: number // ms until next review
  reviewCount: number
  correctStreak: number
  incorrectStreak: number
}

export class AdaptiveLearningEngine {
  private entries: Record<string, AdaptiveLearningEntry> = {}

  /**
   * Adds or updates an entry in the adaptive learning system.
   */
  public upsertEntry(entry: AdaptiveLearningEntry): void {
    this.entries[entry.id] = entry
  }

  /**
   * Schedules the next review based on performance (spaced repetition).
   */
  public updateReview(entryId: string, correct: boolean): void {
    const entry = this.entries[entryId]
    if (!entry) return

    if (correct) {
      entry.correctStreak++
      entry.incorrectStreak = 0
      // Increase interval exponentially for correct answers
      entry.reviewInterval = Math.min(
        entry.reviewInterval * 2 || 60000,
        1000 * 60 * 60 * 24 * 30 // max: 30 days
      )
    } else {
      entry.incorrectStreak++
      entry.correctStreak = 0
      // Reset interval for incorrect answers
      entry.reviewInterval = 60000 // 1 minute
    }
    entry.lastReviewed = Date.now()
    entry.reviewCount++
    // Optionally, adjust confidence
    entry.confidence = Math.max(0, Math.min(1, entry.confidence + (correct ? 0.1 : -0.2)))
  }

  /**
   * Returns entries due for review (active recall).
   */
  public getDueEntries(): AdaptiveLearningEntry[] {
    const now = Date.now()
    return Object.values(this.entries).filter(
      (entry) => now - entry.lastReviewed >= entry.reviewInterval
    )
  }

  /**
   * Returns all entries, sorted by next review time.
   */
  public getAllEntries(): AdaptiveLearningEntry[] {
    return Object.values(this.entries).sort(
      (a, b) => a.lastReviewed + a.reviewInterval - (b.lastReviewed + b.reviewInterval)
    )
  }

  /**
   * Removes an entry from the adaptive system.
   */
  public removeEntry(entryId: string): void {
    delete this.entries[entryId]
  }

  /**
   * Resets the adaptive learning state.
   */
  public reset(): void {
    this.entries = {}
  }
}
