/**
 * ContentSequencingEngine
 * Orchestrates dynamic, adaptive sequencing of learning content, questions, and activities based on learner model, performance, and system objectives.
 * Synthesized from adaptive learning research and industry best practices[2][3][4][5][6].
 */

type SequencingStrategy = "adaptive" | "linear" | "negotiation" | "custom"

export interface SequencingConfig {
  strategy: SequencingStrategy
  allowUserControl: boolean
  objectives: string[]
  [key: string]: any
}

export interface SequenceItem {
  id: string
  type: "lesson" | "activity" | "assessment" | "review"
  prerequisites?: string[]
  difficulty: number
  tags?: string[]
  completed?: boolean
  score?: number
  [key: string]: any
}

export interface LearnerState {
  id: string
  completedItems: string[]
  currentScore: number
  preferences?: Record<string, any>
  knowledgeGaps?: string[]
  [key: string]: any
}

export class ContentSequencingEngine {
  private config: SequencingConfig
  private items: SequenceItem[] = []

  constructor(config: SequencingConfig, items: SequenceItem[]) {
    this.config = config
    this.items = items
  }

  /**
   * Returns the next content item(s) based on the sequencing strategy and learner state.
   */
  public getNextItems(learner: LearnerState): SequenceItem[] {
    switch (this.config.strategy) {
      case "adaptive":
        return this.adaptiveSequence(learner)
      case "negotiation":
        return this.negotiationSequence(learner)
      case "linear":
        return this.linearSequence(learner)
      case "custom":
        return this.customSequence(learner)
      default:
        return []
    }
  }

  /**
   * Adaptive sequencing: selects next items based on learner performance, gaps, and objectives.
   */
  private adaptiveSequence(learner: LearnerState): SequenceItem[] {
    // Filter out completed items
    let candidates = this.items.filter(item => !learner.completedItems.includes(item.id))
    // Prioritize items targeting knowledge gaps
    if (learner.knowledgeGaps && learner.knowledgeGaps.length > 0) {
      candidates = candidates.filter(item =>
        item.tags && item.tags.some(tag => learner.knowledgeGaps!.includes(tag))
      )
    }
    // Sort by difficulty close to learner's current score (personalized challenge)
    candidates.sort((a, b) =>
      Math.abs(a.difficulty - learner.currentScore) - Math.abs(b.difficulty - learner.currentScore)
    )
    // Return top 1-3 items as next recommendations
    return candidates.slice(0, 3)
  }

  /**
   * Linear sequencing: returns the next unfinished item in order.
   */
  private linearSequence(learner: LearnerState): SequenceItem[] {
    const next = this.items.find(item => !learner.completedItems.includes(item.id))
    return next ? [next] : []
  }

  /**
   * Negotiation-based sequencing: blends system and user control for next steps.
   */
  private negotiationSequence(learner: LearnerState): SequenceItem[] {
    // System proposes, user can override if allowUserControl is true
    const systemProposed = this.adaptiveSequence(learner)
    if (this.config.allowUserControl && learner.preferences?.nextItemId) {
      const userChoice = this.items.find(item => item.id === learner.preferences!.nextItemId)
      if (userChoice && !learner.completedItems.includes(userChoice.id)) {
        return [userChoice]
      }
    }
    return systemProposed
  }

  /**
   * Custom sequencing: placeholder for organization-specific logic.
   */
  private customSequence(learner: LearnerState): SequenceItem[] {
    // Implement custom logic as needed
    return this.linearSequence(learner)
  }

  /**
   * Updates the sequencing configuration.
   */
  public updateConfig(newConfig: Partial<SequencingConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Updates the available content items.
   */
  public updateItems(newItems: SequenceItem[]): void {
    this.items = newItems
  }
}
