/**
 * StorageManager
 * Unified storage interface for ZacAi.
 * Selects the best storage strategy (IndexedDB, localStorage) and manages data synchronization, persistence, quota, backup, and recovery.
 */

import { BrowserStorageManager } from "./browser"
import { LearntDataManager } from "./learnt-manager"

export class StorageManager {
  private browserStorage: BrowserStorageManager
  private learntManager: LearntDataManager

  constructor() {
    this.browserStorage = new BrowserStorageManager()
    this.learntManager = new LearntDataManager()
  }

  /**
   * Initialize all storage backends and optionally request persistent storage.
   */
  public async initialize(): Promise<void> {
    await this.browserStorage.initializeDB()
    await this.learntManager.initializeDB()
    await this.ensurePersistence()
  }

  /**
   * Request persistent storage if available and not already granted.
   * This helps prevent data eviction by the browser.
   */
  public async ensurePersistence(): Promise<void> {
    if (navigator.storage && navigator.storage.persist) {
      const persisted = await navigator.storage.persisted()
      if (!persisted) {
        const result = await navigator.storage.persist()
        if (result) {
          console.log("✅ Persistent storage granted by browser.")
        } else {
          console.warn("⚠️ Persistent storage request was denied or not supported.")
        }
      } else {
        console.log("✅ Storage is already persistent.")
      }
    } else {
      console.warn("⚠️ StorageManager.persist() not supported in this browser.")
    }
  }

  /**
   * Get storage usage and quota information.
   */
  public async getQuota(): Promise<{ quota: number; usage: number; percentUsed: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota, usage } = await navigator.storage.estimate()
      return {
        quota: quota || 0,
        usage: usage || 0,
        percentUsed: quota ? Math.round((usage / quota) * 10000) / 100 : 0,
      }
    }
    return { quota: 0, usage: 0, percentUsed: 0 }
  }

  /**
   * Unified clear all data in both browser and learnt storages.
   */
  public async clearAll(): Promise<void> {
    await this.browserStorage.clearAllData()
    await this.learntManager.clearAll()
    console.log("🗑️ All storage cleared (browser + learnt data).")
  }

  /**
   * Unified export of all data.
   */
  public async exportAll(): Promise<any> {
    const browserData = await this.browserStorage.exportAllData()
    const learntEntries = await this.learntManager.loadAllEntries()
    return {
      browser: browserData,
      learnt: learntEntries,
      exportDate: new Date().toISOString(),
    }
  }

  /**
   * Unified import for all data.
   */
  public async importAll(data: any): Promise<void> {
    if (data.browser) {
      await this.browserStorage.importAllData(data.browser)
    }
    if (data.learnt) {
      for (const entry of data.learnt) {
        await this.learntManager.saveEntry(entry)
      }
    }
    console.log("📥 All storage imported (browser + learnt data).")
  }

  /**
   * Graceful shutdown for all storage modules.
   */
  public async shutdown(): Promise<void> {
    // No-op for now; can close connections or flush caches if needed in future
    console.log("🛑 StorageManager shutdown complete.")
  }
}
