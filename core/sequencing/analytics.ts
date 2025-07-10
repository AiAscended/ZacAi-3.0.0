/**
 * SequencingAnalyticsEngine
 * Tracks and analyzes sequencing decisions, learner pathways, and adaptivity effectiveness.
 * Provides insights for optimizing content flow, engagement, and learning outcomes.
 */

export interface SequencingAnalytics {
  learnerId: string
  timestamp: number
  action: string
  itemId?: string
  details?: Record<string, any>
}

export class SequencingAnalyticsEngine {
  private logs: SequencingAnalytics[] = []

  /**
   * Records a sequencing-related event or action.
   */
  public logEvent(event: SequencingAnalytics): void {
    this.logs.push({
      ...event,
      timestamp: event.timestamp || Date.now(),
    })
  }

  /**
   * Returns all logs for a given learner.
   */
  public getLogsForLearner(learnerId: string): SequencingAnalytics[] {
    return this.logs.filter(log => log.learnerId === learnerId)
  }

  /**
   * Returns all logs.
   */
  public getAllLogs(): SequencingAnalytics[] {
    return [...this.logs]
  }

  /**
   * Clears all analytics logs.
   */
  public reset(): void {
    this.logs = []
  }
}
