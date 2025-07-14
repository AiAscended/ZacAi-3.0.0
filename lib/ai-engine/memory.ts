/**
 * ==========================================================
 * File: /lib/ai-engine/memory.ts
 * Project: ZacAI 3.0
 * Role: Global AI Memory Management
 * Description:
 *   - Manages and provides access to various types of AI memory:
 *     - Short-Term Memory: Context specific to the current conversation session.
 *     - Long-Term User Memory: User preferences, learned habits, and historical interaction summaries.
 *     - Project Memory: Knowledge tied to specific projects (e.g., codebases, design docs).
 *   - Designed to be extensible for different storage backends (file, Redis, Mongo, Vector DB).
 * Advanced Features:
 *   - Context chaining across turns and sessions.
 *   - Support for structured and unstructured memory elements.
 *   - Integrates with explainability to trace memory access.
 * ==========================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { generateTraceStep } from './explainability'; // Assuming explainability can generate simple trace steps

// --- Configuration ---
const MEMORY_BASE_DIR = path.join(process.cwd(), 'data/memory'); // Base directory for file-based memory
const SESSION_EXPIRATION_MS = 2 * 60 * 60 * 1000; // 2 hours for short-term session memory

// --- Type Definitions ---

/**
 * @interface InteractionRecord
 * @description Represents a single turn in a conversation.
 */
interface InteractionRecord {
  prompt: string;
  response: any;
  timestamp: number;
}

/**
 * @interface ShortTermMemory
 * @description Stores transient context for the current user session.
 */
interface ShortTermMemory {
  sessionId: string;
  lastActive: number;
  sessionHistory: InteractionRecord[];
  currentContext: Record<string, any>; // Dynamic context for the current turn/flow
}

/**
 * @interface LongTermUserMemory
 * @description Stores persistent user preferences, learned behaviors, and cumulative history.
 */
interface LongTermUserMemory {
  userId: string;
  preferences: Record<string, any>;
  summarizedHistory: string[]; // Summaries of past interactions, not raw history
  learnedPatterns: Record<string, any>; // e.g., coding style, preferred tools
}

/**
 * @interface ProjectMemory
 * @description Stores context specific to a project or workspace.
 */
interface ProjectMemory {
  projectId: string;
  codebaseOverview?: string; // e.g., generated summary of a repo
  designDocuments?: string[];
  knownIssues?: string[];
  // Could include a vector index for semantic search within the project
}

/**
 * @interface GlobalMemory
 * @description Aggregates all memory types for a given user/session/project.
 */
export interface GlobalMemory {
  shortTerm?: ShortTermMemory;
  longTermUser?: LongTermUserMemory;
  project?: ProjectMemory;
}

// --- Internal Helper Functions (File-based Persistence) ---

async function getMemoryFilePath(type: 'session' | 'user' | 'project', id: string): Promise<string> {
  const dir = path.join(MEMORY_BASE_DIR, type);
  await fs.mkdir(dir, { recursive: true }); // Ensure directory exists
  return path.join(dir, `${id}.json`);
}

async function loadMemory(type: 'session' | 'user' | 'project', id: string): Promise<any | null> {
  const filePath = await getMemoryFilePath(type, id);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // console.log(`[Memory] No existing ${type} memory for ${id}.`);
      return null;
    }
    console.error(`[Memory] Error loading ${type} memory for ${id}:`, error);
    return null;
  }
}

async function saveMemory(type: 'session' | 'user' | 'project', id: string, data: any): Promise<void> {
  const filePath = await getMemoryFilePath(type, id);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[Memory] Error saving ${type} memory for ${id}:`, error);
  }
}

// --- Public API ---

/**
 * @function getMemory
 * @description Retrieves all relevant memory components for a given user, session, and optional project.
 * @param userId The ID of the user.
 * @param sessionId The ID of the current session.
 * @param projectId Optional: The ID of the current project.
 * @returns A Promise resolving to a GlobalMemory object.
 */
export async function getMemory(userId: string, sessionId: string, projectId?: string): Promise<GlobalMemory> {
  const globalMemory: GlobalMemory = {};
  const traceSteps: { step: string; info: any }[] = [];

  // Short-Term Session Memory
  let sessionMemory = await loadMemory('session', sessionId) as ShortTermMemory | null;
  if (sessionMemory && (Date.now() - sessionMemory.lastActive < SESSION_EXPIRATION_MS)) {
    globalMemory.shortTerm = sessionMemory;
    traceSteps.push(generateTraceStep("Loaded Session Memory", { sessionId, status: "active" }));
  } else {
    // Initialize new session memory if expired or not found
    globalMemory.shortTerm = {
      sessionId,
      lastActive: Date.now(),
      sessionHistory: [],
      currentContext: {},
    };
    traceSteps.push(generateTraceStep("Initialized Session Memory", { sessionId }));
  }

  // Long-Term User Memory
  let longTermUserMemory = await loadMemory('user', userId) as LongTermUserMemory | null;
  if (longTermUserMemory) {
    globalMemory.longTermUser = longTermUserMemory;
    traceSteps.push(generateTraceStep("Loaded Long-Term User Memory", { userId }));
  } else {
    globalMemory.longTermUser = {
      userId,
      preferences: {},
      summarizedHistory: [],
      learnedPatterns: {},
    };
    traceSteps.push(generateTraceStep("Initialized Long-Term User Memory", { userId }));
  }

  // Project Memory (if projectId is provided)
  if (projectId) {
    let projectMemory = await loadMemory('project', projectId) as ProjectMemory | null;
    if (projectMemory) {
      globalMemory.project = projectMemory;
      traceSteps.push(generateTraceStep("Loaded Project Memory", { projectId }));
    } else {
      globalMemory.project = { projectId };
      traceSteps.push(generateTraceStep("Initialized Project Memory", { projectId }));
    }
  }

  // Note: explainability.generateTrace is usually done by the orchestrator/engine
  // but for memory tracing, it's useful to log here as well.
  // console.log(`[Memory] Trace for getMemory: ${JSON.stringify(traceSteps)}`);
  return globalMemory;
}

/**
 * @function updateMemory
 * @description Updates various memory components.
 * @param userId The ID of the user.
 * @param sessionId The ID of the current session.
 * @param updates An object containing partial updates for different memory types.
 * @param projectId Optional: The ID of the current project.
 */
export async function updateMemory(
  userId: string,
  sessionId: string,
  updates: {
    shortTerm?: Partial<ShortTermMemory>;
    longTermUser?: Partial<LongTermUserMemory>;
    project?: Partial<ProjectMemory>;
    // Add new interaction to session history automatically
    newInteraction?: { prompt: string; response: any; }
  },
  projectId?: string,
): Promise<void> {
  const traceSteps: { step: string; info: any }[] = [];
  let currentGlobalMemory: GlobalMemory | null = null;

  try {
    // Load current state of all relevant memories to ensure we update, not overwrite
    currentGlobalMemory = await getMemory(userId, sessionId, projectId);

    // Update Short-Term Session Memory
    const currentShortTerm = currentGlobalMemory.shortTerm || { sessionId, lastActive: Date.now(), sessionHistory: [], currentContext: {} };
    const updatedShortTerm: ShortTermMemory = {
      ...currentShortTerm,
      ...updates.shortTerm,
      lastActive: Date.now(), // Always update last active timestamp
    };
    if (updates.newInteraction) {
      updatedShortTerm.sessionHistory.push({
        prompt: updates.newInteraction.prompt,
        response: updates.newInteraction.response,
        timestamp: Date.now(),
      });
      // Limit history length to prevent excessive memory usage
      updatedShortTerm.sessionHistory = updatedShortTerm.sessionHistory.slice(-50); // Keep last 50 interactions
    }
    await saveMemory('session', sessionId, updatedShortTerm);
    traceSteps.push(generateTraceStep("Updated Session Memory", { sessionId }));


    // Update Long-Term User Memory
    const currentLongTerm = currentGlobalMemory.longTermUser || { userId, preferences: {}, summarizedHistory: [], learnedPatterns: {} };
    const updatedLongTerm: LongTermUserMemory = {
      ...currentLongTerm,
      ...updates.longTermUser,
    };
    // Future: Logic to summarize `newInteraction` and add to `summarizedHistory`
    await saveMemory('user', userId, updatedLongTerm);
    traceSteps.push(generateTraceStep("Updated Long-Term User Memory", { userId }));


    // Update Project Memory
    if (projectId && updates.project) {
      const currentProject = currentGlobalMemory.project || { projectId };
      const updatedProject: ProjectMemory = {
        ...currentProject,
        ...updates.project,
      };
      await saveMemory('project', projectId, updatedProject);
      traceSteps.push(generateTraceStep("Updated Project Memory", { projectId }));
    }

  } catch (error) {
    console.error(`[Memory] Failed to update memory for user ${userId}, session ${sessionId}:`, error);
    traceSteps.push(generateTraceStep("Memory Update Error", { error: (error as Error).message }));
  }
  // console.log(`[Memory] Trace for updateMemory: ${JSON.stringify(traceSteps)}`);
}

// --- EXPLAINABILITY HELPER (for `generateTraceStep` usage above) ---
// Note: This is a simplified version. The actual `explainability.ts` would be more robust.
// You might already have this or something similar.
function generateTraceStep(step: string, info: any) {
    return { step, info, timestamp: Date.now() };
}

