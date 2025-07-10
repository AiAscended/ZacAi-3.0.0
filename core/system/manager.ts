/**
 * SystemManager
 * Main orchestrator for ZacAi's core system.
 * Handles system initialization, module registration, lifecycle management, global error handling, and system state.
 */

import { StorageManager } from "../storage/manager"
import { HealthMonitor } from "./health"
import { DiagnosticsEngine } from "./diagnostics"
import { SystemConfiguration } from "./config"

export class SystemManager {
  private static instance: SystemManager
  private storageManager: StorageManager
  private healthMonitor: HealthMonitor
  private diagnosticsEngine: DiagnosticsEngine
  private config: SystemConfiguration
  private systemState: "initializing" | "ready" | "error" = "initializing"
  private registeredModules: Map<string, any> = new Map()

  private constructor() {
    this.storageManager = new StorageManager()
    this.healthMonitor = new HealthMonitor()
    this.diagnosticsEngine = new DiagnosticsEngine()
    this.config = new SystemConfiguration()
  }

  public static getInstance(): SystemManager {
    if (!SystemManager.instance) {
      SystemManager.instance = new SystemManager()
    }
    return SystemManager.instance
  }

  public async initialize(): Promise<void> {
    try {
      await this.config.load()
      await this.storageManager.initialize()
      await this.healthMonitor.initialize()
      await this.diagnosticsEngine.initialize()
      this.systemState = "ready"
      console.log("✅ SystemManager initialized. System is ready.")
    } catch (error) {
      this.systemState = "error"
      this.diagnosticsEngine.logError(error)
      console.error("❌ SystemManager initialization failed:", error)
    }
  }

  public registerModule(name: string, module: any): void {
    this.registeredModules.set(name, module)
    console.log(`📦 Registered module: ${name}`)
  }

  public getModule(name: string): any {
    return this.registeredModules.get(name)
  }

  public getState(): string {
    return this.systemState
  }

  public async shutdown(): Promise<void> {
    // Perform cleanup, save state, and gracefully shutdown modules
    try {
      for (const [name, module] of this.registeredModules) {
        if (typeof module.shutdown === "function") {
          await module.shutdown()
        }
      }
      await this.storageManager.shutdown()
      await this.healthMonitor.shutdown()
      await this.diagnosticsEngine.shutdown()
      this.systemState = "initializing"
      console.log("🛑 SystemManager shutdown complete.")
    } catch (error) {
      this.diagnosticsEngine.logError(error)
      console.error("❌ Error during shutdown:", error)
    }
  }
}
