/**
 * UserContext
 * Tracks user preferences, personalization data, behavior patterns, and privacy controls.
 */

export interface UserPreferences {
  theme?: "light" | "dark"
  language?: string
  notifications?: boolean
  [key: string]: any
}

export interface UserProfile {
  userId: string
  preferences: UserPreferences
  behaviorPatterns?: Record<string, any>
  privacySettings?: Record<string, boolean>
  createdAt: number
  lastActive: number
}

export class UserContext {
  private profile: UserProfile

  constructor(userId: string) {
    this.profile = {
      userId,
      preferences: {},
      behaviorPatterns: {},
      privacySettings: {},
      createdAt: Date.now(),
      lastActive: Date.now(),
    }
  }

  public updatePreference(key: string, value: any): void {
    this.profile.preferences[key] = value
    this.profile.lastActive = Date.now()
  }

  public getPreference(key: string): any {
    return this.profile.preferences[key]
  }

  public updateBehavior(pattern: string, data: any): void {
    this.profile.behaviorPatterns = this.profile.behaviorPatterns || {}
    this.profile.behaviorPatterns[pattern] = data
    this.profile.lastActive = Date.now()
  }

  public getBehavior(pattern: string): any {
    return this.profile.behaviorPatterns?.[pattern]
  }

  public setPrivacySetting(key: string, value: boolean): void {
    this.profile.privacySettings = this.profile.privacySettings || {}
    this.profile.privacySettings[key] = value
    this.profile.lastActive = Date.now()
  }

  public getPrivacySetting(key: string): boolean | undefined {
    return this.profile.privacySettings?.[key]
  }

  public getProfile(): UserProfile {
    return this.profile
  }

  public updateLastActive(): void {
    this.profile.lastActive = Date.now()
  }
}
