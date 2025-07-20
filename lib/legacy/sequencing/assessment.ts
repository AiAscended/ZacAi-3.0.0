/**
 * AdaptiveAssessmentEngine
 * Dynamically generates and sequences assessment items based on learner performance, mastery, and knowledge gaps.
 * Supports formative and summative assessment, auto-adjusting difficulty, and targeted feedback.
 */

export interface AssessmentItem {
  id: string
  type: "multiple-choice" | "short-answer" | "problem" | "essay"
  content: string
  difficulty: number
  tags?: string[]
  correctAnswer?: any
  feedback?: string
  [key: string]: any
}

export interface AssessmentSession {
  learnerId: string
  items: AssessmentItem[]
  responses: Record<string, any>
  currentIndex: number
  completed: boolean
  score: number
  mastery: Record<string, boolean>
  knowledgeGaps: string[]
}

export class AdaptiveAssessmentEngine {
  private items: AssessmentItem[] = []

  constructor(items: AssessmentItem[]) {
    this.items = items
  }

  /**
   * Generates a new assessment session for a learner.
   */
  public startSession(learnerId: string, initialGaps: string[] = []): AssessmentSession {
    // Select items matching knowledge gaps or randomize if none
    let sessionItems = this.items
    if (initialGaps.length > 0) {
      sessionItems = this.items.filter(item =>
        item.tags && item.tags.some(tag => initialGaps.includes(tag))
      )
    }
    // Sort by difficulty ascending for initial session
    sessionItems = [...sessionItems].sort((a, b) => a.difficulty - b.difficulty)
    return {
      learnerId,
      items: sessionItems.slice(0, 5),
      responses: {},
      currentIndex: 0,
      completed: false,
      score: 0,
      mastery: {},
      knowledgeGaps: initialGaps,
    }
  }

  /**
   * Records a response and updates the session state.
   */
  public recordResponse(session: AssessmentSession, itemId: string, response: any): void {
    session.responses[itemId] = response
    // Optionally, update mastery and knowledge gaps based on correctness
    const item = session.items.find(i => i.id === itemId)
    if (item) {
      const correct = response === item.correctAnswer
      if (item.tags) {
        item.tags.forEach(tag => {
          session.mastery[tag] = session.mastery[tag] || false
          if (correct) session.mastery[tag] = true
          else session.knowledgeGaps.push(tag)
        })
      }
      if (correct) session.score += item.difficulty
    }
    // Advance index or complete session
    if (session.currentIndex < session.items.length - 1) {
      session.currentIndex++
    } else {
      session.completed = true
    }
  }

  /**
   * Provides targeted feedback for the last answered item.
   */
  public getFeedback(session: AssessmentSession): string {
    const lastItem = session.items[session.currentIndex - 1]
    if (lastItem && lastItem.feedback) {
      return lastItem.feedback
    }
    return ""
  }

  /**
   * Returns the current item for the session.
   */
  public getCurrentItem(session: AssessmentSession): AssessmentItem | undefined {
    return session.items[session.currentIndex]
  }

  /**
   * Updates the assessment item pool.
   */
  public updateItems(newItems: AssessmentItem[]): void {
    this.items = newItems
  }
}
