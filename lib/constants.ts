export const DOMAIN_NAMES = [
  "overview",
  "vocabulary",
  "maths",
  "coding",
  "user-memory",
  "chat-log",
  "diagnostics",
  "performance",
  "observability",
  "security",
  "knowledge",
  "training",
  "settings",
  "audit-log",
] as const

export type Domain = (typeof DOMAIN_NAMES)[number]

export const ROLES = ["admin", "editor", "viewer"] as const

export const DATA_PATHS = {
  vocabulary: "data/learnt/vocabulary.json",
  mathematics: "data/learnt/maths.json",
  coding: "data/learnt/coding.json",
  user: "data/learnt/user.json",
  audit: "data/audit/audit_log.json",
  knowledge: "data/learnt/knowledge.json",
  observability: "data/learnt/observability.json",
  security: "data/learnt/security.json",
  system: "data/learnt/system.json",
}
