/**
 * SessionManager
 * Handles session initialization, storage, retrieval, and session-scoped metadata.
 * Ensures session continuity, context persistence, and supports multi-session workflows.
 */

export interface SessionData {
  sessionId: string
  userId?: string
  created: number
  lastUpdate?: number
  totalTokens?: number
  messages: Array<{
    role: "user" | "assistant"
    content: string
    token?: number
    timestamp?: number
  }>
  metadata?: Record<string, any>
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map()
  private activeSessionId: string | null = null

  constructor() {}

  /**
   * Initializes a new session or resumes an existing one.
   */
  public startSession(userId?: string): SessionData {
    const sessionId = this.generateSessionId()
    const now = Date.now()
    const session: SessionData = {
      sessionId,
      userId,
      created: now,
      lastUpdate: now,
      messages: [],
      metadata: {},
    }
    this.sessions.set(sessionId, session)
    this.activeSessionId = sessionId
    return session
  }

  /**
   * Retrieves a session by ID.
   */
  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Adds a message to the active session.
   */
  public addMessage(role: "user" | "assistant", content: string, token?: number): void {
    if (!this.activeSessionId) return
    const session = this.sessions.get(this.activeSessionId)
    if (!session) return
    const message = {
      role,
      content,
      token,
      timestamp: Date.now(),
    }
    session.messages.push(message)
    session.lastUpdate = Date.now()
  }

  /**
   * Gets messages from the active session.
   */
  public getActiveMessages(): SessionData["messages"] {
    if (!this.activeSessionId) return []
    const session = this.sessions.get(this.activeSessionId)
    return session ? session.messages : []
  }

  /**
   * Ends the current session.
   */
  public endSession(): void {
    this.activeSessionId = null
  }

  /**
   * Lists all session IDs.
   */
  public listSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Generates a unique session ID.
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
