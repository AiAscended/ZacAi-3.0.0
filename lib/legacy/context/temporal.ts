/**
 * TemporalContext
 * Manages time-based context, session management, context aging, and temporal patterns.
 */

export class TemporalContext {
  private sessionStart: number
  private sessionLastActive: number
  private sessionTimeout: number // milliseconds

  constructor(timeoutMinutes: number = 60) {
    this.sessionStart = Date.now()
    this.sessionLastActive = Date.now()
    this.sessionTimeout = timeoutMinutes * 60 * 1000
  }

  public updateActivity(): void {
    this.sessionLastActive = Date.now()
  }

  public getSessionDuration(): number {
    return Date.now() - this.sessionStart
  }

  public getLastActive(): number {
    return this.sessionLastActive
  }

  public isSessionExpired(): boolean {
    return Date.now() - this.sessionLastActive > this.sessionTimeout
  }

  public resetSession(): void {
    this.sessionStart = Date.now()
    this.sessionLastActive = Date.now()
  }

  /**
   * Returns a human-readable string for session duration.
   */
  public getSessionDurationString(): string {
    const ms = this.getSessionDuration()
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}
