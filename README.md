# ZacAi-3.0.0
Modular ZacAi first version but named v3.0.0 as its the 3rd version of Zac Ai just the first time we've broken down all the code into modules and a more developer friendly modular structure!

/lib
  /ai-engine/
    orchestrator.ts   // Main orchestrator (see above)
    engine.ts         // Core AI/LLM model logic
    detectors.ts      // Domain detection and task decomposition
    aggregator.ts     // Aggregates sub-task results
  /coding/
    engine.ts         // Coding domain expert engine
  /mathematics/
    engine.ts         // Mathematics domain expert engine
  /vocabulary/
    engine.ts         // Vocabulary domain expert engine
  /grammar/
    engine.ts         // Grammar domain expert engine
  /user/
    engine.ts         // User profile/preferences engine
  /system/
    engine.ts         // System status/health engine
  /shared/
    plugin-manager.ts // Global plugin/hook system
    semantic-search.ts// Semantic retrieval for all domains
