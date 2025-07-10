/**
 * ContextManager
 * Manages conversation context, context switching, persistence, and analytics.
 * Tracks active session context and provides context to engines and modules.
 */

export type ContextData = {
  sessionId: string
  userId?: string
  history: Array<{ role: "user" | "assistant"; message: string; timestamp: number }>
  currentModule?: string
  lastActive: number
  [key: string]: any
}

export class ContextManager {
  private context: ContextData

  constructor() {
    this.context = {
      sessionId: this.generateSessionId(),
      history: [],
      lastActive: Date.now(),
    }
  }

  public addMessage(role: "user" | "assistant", message: string): void {
    this.context.history.push({
      role,
      message,
      timestamp: Date.now(),
    })
    this.context.lastActive = Date.now()
  }

  public getHistory(limit = 20): ContextData["history"] {
    return this.context.history.slice(-limit)
  }

  public setCurrentModule(module: string): void {
    this.context.currentModule = module
  }

  public getCurrentModule(): string | undefined {
    return this.context.currentModule
  }

  public getSessionId(): string {
    return this.context.sessionId
  }

  public getContext(): ContextData {
    return this.context
  }

  public clearHistory(): void {
    this.context.history = []
  }

  public resetContext(): void {
    this.context = {
      sessionId: this.generateSessionId(),
      history: [],
      lastActive: Date.now(),
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
