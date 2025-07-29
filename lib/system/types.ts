export interface SystemLogEntry {
  timestamp: number
  level: "info" | "warn" | "error"
  message: string
}

export interface AuditRecord {
  action: "add" | "update" | "delete"
  key: string
  domain: string
  user?: string
  timestamp: number
}

export interface DiagnosticReport {
  component: string
  status: "healthy" | "degraded" | "failing"
  metrics?: Record<string, number>
  notes?: string
}

export interface PerformanceStats {
  uptime: number
  averageResponseTime: number
  totalQueries: number
  successRate: number
}

export interface SystemState {
  logs: SystemLogEntry[]
  audits: AuditRecord[]
  diagnostics: DiagnosticReport[]
  performance: PerformanceStats
  knowledgeBase: Record<string, any>
  warnings: string[]
  lastAssessment?: number
  maintenanceHistory: string[]
}
