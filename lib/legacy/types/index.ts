/**
 * Shared Types and Interfaces for ZacAi Core Modules
 * Includes vocab, maths, facts, coding, science, session, and learnt data structures.
 */

// --- Vocabulary ---

export interface VocabEntry {
  definition: string
  part_of_speech: string
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  phonetic: string
  frequency: number
  source: "seed" | "learnt"
  date_added: string
  last_used: string
  topics?: string[]
  notes?: string
}

// --- Mathematics ---

export interface MathEntry {
  operation: string
  symbols: string[]
  algorithm: string
  examples: string[]
  date_added: string
  last_used: string
  source: "seed" | "learnt"
  topics?: string[]
  notes?: string
}

// --- Coding ---

export interface CodingEntry {
  concept: string
  definition: string
  syntax: string
  examples: string[]
  docs_url?: string
  date_added: string
  last_used: string
  source: "seed" | "learnt"
  topics?: string[]
  notes?: string
}

// --- Science ---

export interface ScienceEntry {
  term: string
  definition: string
  formula?: string
  examples: string[]
  date_added: string
  last_used: string
  source: "seed" | "learnt"
  topics?: string[]
  notes?: string
}

// --- Facts ---

export interface FactEntry {
  topic: string
  fact: string
  category: string
  sources: string[]
  reliability: number
  lastVerified: string
  relatedFacts: string[]
  contradictions: string[]
  evidence: Array<{
    type: string
    source: string
    reliability: number
  }>
}

// --- Learnt Data Structure (Universal) ---

export interface LearntDataStructure {
  metadata: {
    version: string
    lastUpdated: string
    totalEntries: number
    learningRate: number
    confidenceThreshold: number
  }
  entries: {
    [entryId: string]: {
      content: any
      confidence: number
      source: string
      context: string
      timestamp: number
      usageCount: number
      lastUsed: number
      verified: boolean
      tags: string[]
      relationships: string[]
    }
  }
  patterns: {
    [patternId: string]: {
      type: string
      pattern: string
      confidence: number
      occurrences: number
      examples: string[]
    }
  }
  statistics: {
    learningVelocity: number
    accuracyRate: number
    retentionRate: number
    utilizationRate: number
  }
}
