/**
 * AdaptiveLearningSystemArchitecture
 * Defines the high-level architecture for an adaptive learning system, integrating core modules and cloud-based collaboration.
 * Synthesized from current research and industry best practices[1][3][4][5][7].
 */

export interface AdaptiveLearningSystemConfig {
  stakeholders: string[]              // e.g. ["student", "instructor", "admin"]
  cloudLearningEcosystem: string[]    // e.g. ["chat", "forums", "video", "docs"]
  interactiveLearning: boolean
  databaseType: "cloud" | "local" | "hybrid"
  adaptiveModules: {
    domainKnowledge: boolean
    pedagogical: boolean
    studentModel: boolean
    expertModel: boolean
    communicationModel: boolean
  }
  activeLearningEnvironment: boolean
  [key: string]: any
}

export class AdaptiveLearningSystemArchitecture {
  private config: AdaptiveLearningSystemConfig

  constructor(config: AdaptiveLearningSystemConfig) {
    this.config = config
  }

  /**
   * Returns the current architecture configuration.
   */
  public getConfig(): AdaptiveLearningSystemConfig {
    return { ...this.config }
  }

  /**
   * Updates architecture settings.
   */
  public updateConfig(newConfig: Partial<AdaptiveLearningSystemConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Returns a summary of architecture elements.
   */
  public describeArchitecture(): string {
    return [
      `Stakeholders: ${this.config.stakeholders.join(", ")}`,
      `Cloud Learning Ecosystem: ${this.config.cloudLearningEcosystem.join(", ")}`,
      `Interactive Learning: ${this.config.interactiveLearning ? "Enabled" : "Disabled"}`,
      `Database Type: ${this.config.databaseType}`,
      `Adaptive Modules: ${Object.entries(this.config.adaptiveModules)
        .filter(([k, v]) => v)
        .map(([k]) => k)
        .join(", ")}`,
      `Active Learning Environment: ${this.config.activeLearningEnvironment ? "Yes" : "No"}`
    ].join("\n")
  }
}
