/**
 * ConversationTracker
 * Manages message history, conversation threading, context extraction, and relevance scoring.
 */

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  contextTags?: string[]
  confidence?: number
  reasoning?: string[]
}

export class ConversationTracker {
  private messages: ConversationMessage[] = []

  public addMessage(message: ConversationMessage): void {
    this.messages.push(message)
  }

  public getRecentMessages(count: number = 10): ConversationMessage[] {
    return this.messages.slice(-count)
  }

  public getAllMessages(): ConversationMessage[] {
    return [...this.messages]
  }

  public clear(): void {
    this.messages = []
  }

  /**
   * Extracts context tags from recent conversation for context-aware modules.
   */
  public extractContextTags(limit: number = 10): string[] {
    const tags = new Set<string>()
    const recent = this.getRecentMessages(limit)
    for (const msg of recent) {
      if (msg.contextTags) {
        msg.contextTags.forEach((tag) => tags.add(tag))
      }
    }
    return Array.from(tags)
  }

  /**
   * Scores relevance of a message to current context using basic heuristics.
   */
  public scoreRelevance(message: ConversationMessage, currentContext: string[]): number {
    if (!message.contextTags || currentContext.length === 0) return 0
    let matches = 0
    for (const tag of message.contextTags) {
      if (currentContext.includes(tag)) matches++
    }
    return matches / currentContext.length
  }
}
