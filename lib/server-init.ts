// /lib/server-init.ts
import { initializeAgents } from './ai-engine/agents/init';

// A flag to ensure initialization only runs once in development (due to Next.js hot reloading)
// In production, this flag is not strictly necessary as the server starts once.
declare global {
  var __agentsInitialized: boolean | undefined;
}

if (process.env.NODE_ENV === 'production' || !global.__agentsInitialized) {
  console.log("[ServerInit] Initializing global AI agents...");
  initializeAgents();
  global.__agentsInitialized = true;
  console.log("[ServerInit] AI agents initialized.");
} else {
  console.log("[ServerInit] AI agents already initialized (HMR detected).");
}

// Export nothing, this file is loaded for its side effects.
