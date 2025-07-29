/**
 * LearningObjectivesManager
 * Manages learning objectives, outcomes, and mappings to content and assessments.
 * Enables alignment of adaptive sequencing with curriculum and competency frameworks.
 */

export interface LearningObjective {
  id: string
  description: string
  domain: string
  level: string
  tags?: string[]
  prerequisites?: string[]
  outcomes?: string[]
}

export class LearningObjectivesManager {
  private objectives: Record<string, LearningObjective> = {}

  /**
   * Adds or updates a learning objective.
   */
  public upsertObjective(objective: LearningObjective): void {
    this.objectives[objective.id] = objective
  }

  /**
   * Retrieves an objective by ID.
   */
  public getObjective(id: string): LearningObjective | undefined {
    return this.objectives[id]
  }

  /**
   * Returns all learning objectives.
   */
  public getAllObjectives(): LearningObjective[] {
    return Object.values(this.objectives)
  }

  /**
   * Maps objectives to content/assessment items by tags or outcomes.
   */
  public mapObjectivesToItems(items: { id: string; tags?: string[] }[]): Record<string, string[]> {
    const mapping: Record<string, string[]> = {}
    for (const obj of Object.values(this.objectives)) {
      mapping[obj.id] = items
        .filter(item => item.tags && obj.tags && item.tags.some(tag => obj.tags!.includes(tag)))
        .map(item => item.id)
    }
    return mapping
  }

  /**
   * Removes a learning objective by ID.
   */
  public removeObjective(id: string): void {
    delete this.objectives[id]
  }

  /**
   * Clears all objectives.
   */
  public reset(): void {
    this.objectives = {}
  }
}
