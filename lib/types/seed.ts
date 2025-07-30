// /lib/types/seed.ts

// Vocabulary domain
export interface VocabularyTerm {
  word: string
  definition: string
  partOfSpeech?: string
  synonyms?: string[]
  usageExamples?: string[]
  frequency?: number
  tags?: string[]
}

// Mathematics domain
export interface MathConcept {
  name: string
  description: string
  formula?: string
  domain?: string             // e.g. "geometry", "algebra"
  tags?: string[]
  examples?: string[]
}

// Grammar domain
export interface GrammarRule {
  id: string
  rule: string
  description: string
  examples?: string[]
  corrections?: string[]
  tags?: string[]
}

// Coding domain
export interface CodeConcept {
  id: string
  concept: string
  code: string
  language?: string
  tags?: string[]
  explanation?: string
}

// Security domain
export interface SecurityEntry {
  id: string
  title: string
  vulnerability: string
  mitigation: string
  severity?: "low" | "medium" | "high" | "critical"
  tags?: string[]
}

// Observability domain
export interface ObservabilityConcept {
  id: string
  description: string
  category?: string
  metrics?: string[]
  tool?: string
  tags?: string[]
}

// Knowledge domain
export interface KnowledgeEntry {
  id: string
  statement: string
  source?: string
  domain?: string
  tags?: string[]
}

// User Memory domain (if applicable)
export interface UserMemoryEntry {
  key: string
  content: any
  updatedAt?: number
}

// System diagnostics or logs domain (optional, if you model system state as well)
export interface SystemLogEntry {
  timestamp: number
  level: "info" | "warn" | "error"
  message: string
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
  diagnostics: DiagnosticReport[]
  performance: PerformanceStats
  warnings: string[]
  maintenanceHistory: string[]
}

