/**
 * DiagnosticsEngine
 * Provides self-diagnostic routines, debug information collection, system profiling, and error analysis.
 */

export class DiagnosticsEngine {
  private logs: string[] = []
  private errors: any[] = []
  private profilingData: Record<string, any> = {}

  public async initialize(): Promise<void> {
    this.logs = []
    this.errors = []
    this.profilingData = {}
    console.log("✅ DiagnosticsEngine initialized.")
  }

  public log(message: string): void {
    const entry = `[${new Date().toISOString()}] ${message}`
    this.logs.push(entry)
    console.log("📝 Diagnostics:", entry)
  }

  public logError(error: any): void {
    const entry = {
      time: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    this.errors.push(entry)
    console.error("❌ Diagnostics error:", entry)
  }

  public getLogs(): string[] {
    return this.logs
  }

  public getErrors(): any[] {
    return this.errors
  }

  public startProfiling(label: string): void {
    this.profilingData[label] = {
      start: performance.now(),
      end: null,
      duration: null,
    }
  }

  public endProfiling(label: string): void {
    if (this.profilingData[label] && this.profilingData[label].start) {
      this.profilingData[label].end = performance.now()
      this.profilingData[label].duration =
        this.profilingData[label].end - this.profilingData[label].start
      this.log(
        `Profiling "${label}": ${this.profilingData[label].duration.toFixed(2)} ms`
      )
    }
  }

  public getProfilingData(): Record<string, any> {
    return this.profilingData
  }

  public async shutdown(): Promise<void> {
    this.logs = []
    this.errors = []
    this.profilingData = {}
    console.log("🛑 DiagnosticsEngine shutdown complete.")
  }
}
