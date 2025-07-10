/**
 * SystemConfiguration
 * Manages environment-specific settings, module configurations, API endpoints/keys, and feature flags.
 * Loads configuration from seed data and provides runtime overrides.
 */

type SystemConfigData = {
  environment: "development" | "production" | "test"
  version: string
  apiEndpoints: Record<string, string>
  featureFlags: Record<string, boolean>
  modules: Record<string, any>
  [key: string]: any
}

export class SystemConfiguration {
  private config: SystemConfigData = {
    environment: "production",
    version: "1.0.0",
    apiEndpoints: {},
    featureFlags: {},
    modules: {},
  }

  /**
   * Loads configuration from seed_system.json or other sources.
   */
  public async load(): Promise<void> {
    try {
      const response = await fetch("/seed_system.json")
      if (response.ok) {
        const data = await response.json()
        this.config = { ...this.config, ...data }
        console.log("✅ SystemConfiguration loaded from seed_system.json")
      } else {
        console.warn("⚠️ Could not load seed_system.json, using defaults")
      }
    } catch (error) {
      console.warn("⚠️ Error loading system configuration:", error)
    }
  }

  public get(key: string): any {
    return this.config[key]
  }

  public set(key: string, value: any): void {
    this.config[key] = value
  }

  public getAll(): SystemConfigData {
    return this.config
  }

  public getFeatureFlag(flag: string): boolean {
    return !!this.config.featureFlags?.[flag]
  }
}
