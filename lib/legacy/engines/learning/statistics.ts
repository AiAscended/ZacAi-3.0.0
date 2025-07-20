/**
 * LearningStatisticsEngine
 * Tracks and analyzes learning outcomes, engagement, retention, and adaptivity for continuous improvement of the adaptive learning system.
 * Supports data-driven insights, reporting, and system optimization[3][4][5][7].
 */

export interface LearningStatistics {
  totalSessions: number
  totalLearners: number
  totalInteractions: number
  avgSessionLength: number
  avgScoreImprovement: number
  retentionRate: number
  engagementRate: number
  adaptivityScore: number
  satisfactionScore?: number
  lastUpdated: number
}

export class LearningStatisticsEngine {
  private stats: LearningStatistics = {
    totalSessions: 0,
    totalLearners: 0,
    totalInteractions: 0,
    avgSessionLength: 0,
    avgScoreImprovement: 0,
    retentionRate: 0,
    engagementRate: 0,
    adaptivityScore: 0,
    satisfactionScore: undefined,
    lastUpdated: Date.now(),
  }

  /**
   * Updates statistics based on new session or learner data.
   */
  public updateStats(data: Partial<LearningStatistics>): void {
    this.stats = {
      ...this.stats,
      ...data,
      lastUpdated: Date.now(),
    }
  }

  /**
   * Increments counters for sessions, learners, or interactions.
   */
  public increment(key: keyof Pick<LearningStatistics, "totalSessions" | "totalLearners" | "totalInteractions">, value = 1): void {
    if (typeof this.stats[key] === "number") {
      this.stats[key] += value
      this.stats.lastUpdated = Date.now()
    }
  }

  /**
   * Returns a snapshot of all tracked learning statistics.
   */
  public getStatistics(): LearningStatistics {
    return { ...this.stats }
  }

  /**
   * Resets all statistics.
   */
  public reset(): void {
    this.stats = {
      totalSessions: 0,
      totalLearners: 0,
      totalInteractions: 0,
      avgSessionLength: 0,
      avgScoreImprovement: 0,
      retentionRate: 0,
      engagementRate: 0,
      adaptivityScore: 0,
      satisfactionScore: undefined,
      lastUpdated: Date.now(),
    }
  }
}
