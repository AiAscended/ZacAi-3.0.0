/**
 * LearningPathwaysEngine
 * Manages personalized learning pathways, tracks learner progress, and dynamically adjusts routes based on mastery, gaps, and preferences.
 * Integrates with sequencing, objectives, and assessment modules for end-to-end adaptivity.
 */

export interface LearningPathway {
  learnerId: string
  currentPath: string[]
  completed: string[]
  mastery: Record<string, boolean>
  knowledgeGaps: string[]
  preferences?: Record<string, any>
  updatedAt: number
}

export class LearningPathwaysEngine {
  private pathways: Record<string, LearningPathway> = {}

  /**
   * Initializes or updates a learner's pathway.
   */
  public upsertPathway(pathway: LearningPathway): void {
    this.pathways[pathway.learnerId] = {
      ...pathway,
      updatedAt: Date.now(),
    }
  }

  /**
   * Returns the pathway for a given learner.
   */
  public getPathway(learnerId: string): LearningPathway | undefined {
    return this.pathways[learnerId]
  }

  /**
   * Updates learner progress, mastery, and knowledge gaps.
   */
  public updateProgress(learnerId: string, completedId: string, masteryTags: string[], gapTags: string[]): void {
    const pathway = this.pathways[learnerId]
    if (!pathway) return

    if (!pathway.completed.includes(completedId)) {
      pathway.completed.push(completedId)
    }
    masteryTags.forEach(tag => {
      pathway.mastery[tag] = true
    })
    gapTags.forEach(tag => {
      if (!pathway.knowledgeGaps.includes(tag)) {
        pathway.knowledgeGaps.push(tag)
      }
    })
    pathway.updatedAt = Date.now()
  }

  /**
   * Dynamically adjusts the learning path based on updated mastery and gaps.
   */
  public adjustPathway(learnerId: string, nextIds: string[]): void {
    const pathway = this.pathways[learnerId]
    if (!pathway) return
    pathway.currentPath = nextIds
    pathway.updatedAt = Date.now()
  }

  /**
   * Removes a learner's pathway.
   */
  public removePathway(learnerId: string): void {
    delete this.pathways[learnerId]
  }

  /**
   * Returns all learning pathways.
   */
  public getAllPathways(): LearningPathway[] {
    return Object.values(this.pathways)
  }

  /**
   * Resets all pathways.
   */
  public reset(): void {
    this.pathways = {}
  }
}
