/**
 * ==========================================================
 * File: /lib/coding/engine.ts
 * Project: ZacAI 3.0
 * Role: World-Class Coding Domain Engine & Orchestrator
 * Description:
 *   - Serves as the central processing unit for all coding-related AI tasks.
 *   - Orchestrates specialized coding tools (executor, linter, security scanner, etc.) using LLM-driven decisions.
 *   - Integrates deep memory, adaptive self-correction, and multimodal inputs.
 *   - Provides comprehensive explainability for every step.
 * Advanced Features:
 *   - LLM-driven tool selection and execution based on user intent and context.
 *   - Automated self-correction loop: generates, tests/lints, and refines code iteratively.
 *   - Contextual memory management (short-term, long-term user, project-specific).
 *   - Multimodal input awareness (e.g., image-to-code capabilities).
 *   - Robust error handling, logging, and explainability for tracing.
 *   - Plugin system for extensible pre- and post-processing.
 * ==========================================================
 */

import fs from "fs/promises";
import path from "path";
import LRU from "lru-cache";

// --- Core AI Engine (LLM) Imports ---
import { infer } from "../ai-engine/engine"; // The main LLM inference function
import * as aiMemory from "../ai-engine/memory"; // Global AI memory (get/update functions)
import { generateTraceStep } from "../ai-engine/explainability"; // For tracing decisions
import * as aiSafety from "../ai-engine/safety"; // For internal safety checks on generated content

// --- CODING DOMAIN TOOL IMPORTS ---
// Assume these are implemented in `lib/coding/tools/`
import * as codeExecutor from "./tools/code-executor";
import * * as linter from "./tools/linter";
import * as testRunner from "./tools/test-runner"; // For running unit tests
import * * as securityScanner from "./tools/security-scanner";
import * as semanticSearch from "./tools/semantic-search"; // For finding similar code/concepts
import * as codeTransformer from "./tools/code-transformer"; // For refactoring, syntax conversion
import * as codeAnalyzer from "./tools/code-analyzer"; // For static analysis, complexity
import * as projectManager from "./tools/project-manager"; // For interacting with local project files/structure

// --- Shared Utilities ---
import * as vocab from "../vocabulary/engine"; // For prompt parsing
import * as math from "../mathematics/engine"; // For math integration (if needed directly)
import { fetchDocs } from "./api"; // Example API for external documentation
import { getLearntConcept, saveLearntConcept, validateConcept } from "./tools/learnt-manager"; // For managing learned concepts
import { runCodingPlugins } from "./tools/plugin-manager"; // Coding-specific plugins

// --- Configuration ---
const SEED_DIR = path.join(process.cwd(), "data/coding/");
const LEARNT_DIR = path.join(process.cwd(), "data/learnt/coding/");
const CACHE_MAX = 200;
const cache = new LRU<string, any>({ max: CACHE_MAX });
const MAX_SELF_CORRECTION_ATTEMPTS = 3; // Max attempts for AI to self-correct code

// --- Tool Registry for LLM-driven selection ---
// Map tool names (as decided by LLM) to their actual functions.
// Each function should ideally accept `code` and `context` and return structured results.
const toolRegistry: { [key: string]: Function } = {
  executeCode: codeExecutor.executeCode,
  lintCode: linter.lint,
  runTests: testRunner.runTests,
  scanSecurity: securityScanner.scan,
  semanticSearch: semanticSearch.semanticSearch,
  transformCode: codeTransformer.transform,
  analyzeCode: codeAnalyzer.analyze,
  // Add other coding tools here.
  // Ensure the tool's signature is consistent or handle args dynamically.
};

const toolDescriptions: { [key: string]: string } = {
  executeCode: "Executes provided code in a secure sandbox. Use for running scripts or testing snippets.",
  lintCode: "Checks code for stylistic and potential error issues based on common linting rules.",
  runTests: "Executes unit tests against provided code and returns test results (pass/fail).",
  scanSecurity: "Scans code for common security vulnerabilities and patterns.",
  semanticSearch: "Searches for semantically similar code snippets or documentation based on a query.",
  transformCode: "Transforms code (e.g., refactoring, language conversion, dependency updates).",
  analyzeCode: "Performs static analysis on code to provide metrics like complexity, readability, and identify patterns.",
  // Add descriptions for better LLM reasoning
};

// --- Helper Functions ---

async function loadSeedData(domain: string): Promise<Record<string, any>> {
  try {
    const file = path.join(SEED_DIR, `${domain}_structure.json`);
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    generateTraceStep("Load Seed Data Error", { domain, error: (error as Error).message });
    return {};
  }
}

function extractConcept(prompt: string): string {
  // Can be enhanced with LLM-based concept extraction or more complex regex
  const match = prompt.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/);
  return match ? match[0].toLowerCase() : prompt.trim().toLowerCase();
}

/**
 * @function generateCodeAndSelfCorrect
 * @description Generates code and iteratively self-corrects it based on linting and testing feedback.
 * This is the core of the advanced self-correction loop.
 */
async function generateCodeAndSelfCorrect(initialPrompt: string, context: any, domain: string, concept: string): Promise<any> {
  let generatedCode: string | null = null;
  const selfCorrectionLogs: string[] = [];
  let attempts = 0;
  let success = false;
  let finalResult: any = null;

  while (attempts < MAX_SELF_CORRECTION_ATTEMPTS && !success) {
    attempts++;
    generateTraceStep("Self-Correction Attempt", { attempt: attempts, max: MAX_SELF_CORRECTION_ATTEMPTS });
    selfCorrectionLogs.push(`--- Attempt ${attempts}/${MAX_SELF_CORRECTION_ATTEMPTS} ---`);

    let currentPrompt = initialPrompt;
    if (generatedCode) {
      // If code exists, the prompt becomes about refining it based on feedback.
      currentPrompt = `Refine the following code based on the provided feedback (linting/test results). Original prompt: "${initialPrompt}"\n\nExisting Code:\n\`\`\`\n${generatedCode}\n\`\`\`\n\nFeedback:\n${selfCorrectionLogs[selfCorrectionLogs.length - 1]}`;
    }

    // Step 1: Generate/Refine Code using LLM
    generateTraceStep("AI Code Generation", { prompt: currentPrompt.slice(0, 100) + "..." });
    const llmResponse = await infer(currentPrompt, { context: { ...context, selfCorrectionLogs } });
    generatedCode = llmResponse.code || llmResponse.text; // Assume LLM provides 'code' or 'text'
    if (!generatedCode || generatedCode.trim().length === 0) {
      selfCorrectionLogs.push("AI failed to generate code for this attempt.");
      break; // Exit if no code is generated
    }
    selfCorrectionLogs.push(`Generated Code (Attempt ${attempts}):\n\`\`\`\n${generatedCode}\n\`\`\``);

    // Step 2: Lint the generated code
    generateTraceStep("Linting Code", {});
    const lintResults = await linter.lint(generatedCode, context);
    if (lintResults.errors && lintResults.errors.length > 0) {
      selfCorrectionLogs.push(`Linting Errors:\n${lintResults.errors.map((e: any) => `- ${e.message} at ${e.line}:${e.column}`).join('\n')}`);
    } else {
      selfCorrectionLogs.push("No linting errors found.");
    }

    // Step 3: Run tests on the generated code (if applicable)
    generateTraceStep("Running Tests", {});
    const testResults = await testRunner.runTests(generatedCode, context);
    if (testResults.passed) {
      selfCorrectionLogs.push(`Tests Passed: ${testResults.passedCount}/${testResults.totalCount}`);
    } else {
      selfCorrectionLogs.push(`Tests Failed: ${testResults.failedCount}/${testResults.totalCount}\nFailures:\n${testResults.failures.map((f: any) => `- ${f.message}`).join('\n')}`);
    }

    // Step 4: Check if code is acceptable
    if (lintResults.errors.length === 0 && testResults.passed) {
      success = true;
      finalResult = { code: generatedCode, selfCorrection: { logs: selfCorrectionLogs, attempts, success: true } };
      generateTraceStep("Self-Correction Success", { attempts });
    } else {
      // If not successful, prepare for next iteration by adding feedback to logs
      selfCorrectionLogs.push(`Code needs further refinement. Remaining attempts: ${MAX_SELF_CORRECTION_ATTEMPTS - attempts}`);
      // The prompt for the next attempt will incorporate these logs.
    }
  }

  if (!success) {
    generateTraceStep("Self-Correction Failed", { attempts });
    finalResult = {
      code: generatedCode, // Return the last generated code
      error: "Self-correction failed after maximum attempts. Please review the code and logs.",
      selfCorrection: { logs: selfCorrectionLogs, attempts, success: false }
    };
  }
  return finalResult;
}

// --- Main Engine Entry Point ---
export async function process(
  prompt: string,
  context: Record<string, any> = {}
): Promise<any> {
  // Ensure globalTrace for this request starts fresh
  explainability.clearTrace(); 
  generateTraceStep("Coding Engine Process Start", { prompt, contextSummary: { userId: context.userId, sessionId: context.sessionId, projectId: context.projectId, domain: context.domain } });

  try {
    // 1. Initial Prompt Parsing & Context Extraction
    const parsed = vocab.parsePrompt(prompt); // Use vocabulary engine for initial parsing
    const domain = parsed.domain || "general"; // Default to general if no domain detected
    const concept = parsed.concept || extractConcept(prompt); // Extract core concept for caching/retrieval

    // 2. Plugin Pre-processing
    let pluginResult = await runCodingPlugins("preProcess", { prompt, context, domain, concept });
    if (pluginResult?.handled) {
      generateTraceStep("Plugin Pre-processed Handled", { plugin: pluginResult.pluginName });
      return pluginResult.result;
    }

    // 3. Cache Lookup (LRU Cache)
    if (cache.has(concept)) {
      generateTraceStep("Cache Hit", { concept });
      return { ...cache.get(concept), source: "cache" };
    }

    // 4. Learnt Concept Lookup (Persistent Learnt Data)
    const learnt = await getLearntConcept(domain, concept, LEARNT_DIR);
    if (learnt) {
      cache.set(concept, learnt); // Add to LRU cache for quick access
      generateTraceStep("Learnt Concept Hit", { concept });
      return { ...learnt, source: "learnt" };
    }

    // 5. Seed Data Lookup (Static, Pre-defined Data)
    const seedData = await loadSeedData(domain);
    if (seedData[concept]) {
      cache.set(concept, seedData[concept]); // Add to LRU cache
      generateTraceStep("Seed Data Hit", { concept });
      return { ...seedData[concept], source: "seed" };
    }

    // 6. External API Lookup (e.g., Documentation APIs)
    const apiResult = await fetchDocs(domain, concept);
    if (apiResult && validateConcept(apiResult)) {
      await saveLearntConcept(domain, concept, apiResult, LEARNT_DIR); // Save to learnt concepts
      cache.set(concept, apiResult); // Add to LRU cache
      generateTraceStep("API Lookup Success", { concept });
      return { ...apiResult, source: "api" };
    }

    // 7. Semantic Search (for similar concepts/code)
    const similar = await semanticSearch.semanticSearch(concept, { domain, seedData, learntDir: LEARNT_DIR });
    if (similar) {
      // Note: Semantic search often returns closest match, which might not be perfect.
      // Consider passing this to LLM for final validation/refinement.
      generateTraceStep("Semantic Search Hit", { concept, similarity: similar.score });
      return { ...similar, source: "semantic" };
    }

    // 8. LLM-Driven Tool Selection & Execution
    generateTraceStep("LLM Tool Selection Phase", { prompt: prompt.slice(0, 100) + "..." });
    // This is where the AI decides what to do if direct concept lookup fails.
    // It uses the LLM to choose a tool or directly generate code.
    const toolDecisionPrompt = `Analyze the user's prompt and current context to determine the best course of action.
      Available Tools and their descriptions:
      ${Object.entries(toolDescriptions).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}
      
      User Prompt: "${prompt}"
      Previous conversation context: ${context.globalMemory?.shortTerm?.sessionHistory?.slice(-2).map((h:any) => `User: ${h.prompt} -> AI: ${JSON.stringify(h.response).slice(0, 50)}...`).join('\n') || 'N/A'}
      User preferences: ${JSON.stringify(context.globalMemory?.longTermUser?.preferences || {}) || 'N/A'}
      Project context: ${JSON.stringify(context.globalMemory?.project || {}) || 'N/A'}
      Multimodal input analysis: ${JSON.stringify(context.multimodalProcessed || {}) || 'N/A'}
      
      Decide whether to use one of the tools or to directly generate code. If using a tool, respond in JSON format: {"action": "tool", "toolName": "tool_name", "args": {...}}. If generating code directly, respond: {"action": "generate_code"}.`;

    let actionDecision: { action: string; toolName?: string; args?: any };
    try {
      const llmToolResponse = await infer(toolDecisionPrompt, { context });
      actionDecision = JSON.parse(llmToolResponse.text || llmToolResponse.code); // Expect JSON from LLM
      generateTraceStep("LLM Action Decision", { decision: actionDecision });
    } catch (parseError) {
      generateTraceStep("LLM Action Decision Parse Error", { error: (parseError as Error).message, llmOutput: "Could not parse LLM tool decision. Defaulting to code generation." });
      actionDecision = { action: "generate_code" }; // Fallback to direct generation
    }

    let result: any = null;
    if (actionDecision.action === "tool" && actionDecision.toolName && toolRegistry[actionDecision.toolName]) {
      const toolFunc = toolRegistry[actionDecision.toolName];
      try {
        generateTraceStep("Executing Tool", { tool: actionDecision.toolName, args: actionDecision.args });
        // Dynamically call the tool with its arguments, passing full context.
        result = await toolFunc(actionDecision.args.code || prompt, context); // Adjust args based on tool needs
        result.source = `tool:${actionDecision.toolName}`;
      } catch (toolError: any) {
        generateTraceStep("Tool Execution Error", { tool: actionDecision.toolName, error: toolError.message });
        warnings.push(`Tool ${actionDecision.toolName} failed: ${toolError.message}. Attempting direct code generation.`);
        // Fallback to code generation if a selected tool fails
        actionDecision = { action: "generate_code" };
      }
    }

    // 9. Direct Code Generation (with Self-Correction)
    if (actionDecision.action === "generate_code" || !result) {
      generateTraceStep("Direct Code Generation (with Self-Correction)", {});
      result = await generateCodeAndSelfCorrect(prompt, context, domain, concept);
      result.source = "generated_and_corrected";
      if (!result.success && result.error) {
        warnings.push(result.error);
      }
    }

    // 10. Final Safety Check on Generated Content
    if (result && (result.code || result.text)) {
      const contentToCheck = result.code || result.text;
      const isSafe = await aiSafety.isSafeCode(contentToCheck); // Assuming isSafeCode exists
      if (!isSafe) {
        generateTraceStep("Safety Check Failed", {});
        result = {
          error: "Generated content failed safety review.",
          originalContent: contentToCheck,
          source: result.source,
          safety_flagged: true
        };
        // Do not cache unsafe content
        return result;
      }
    }

    // 11. Plugin Post-processing
    let pluginResultPost = await runCodingPlugins("postProcess", { prompt, context, result, domain, concept });
    if (pluginResultPost?.handled) {
      generateTraceStep("Plugin Post-processed Handled", { plugin: pluginResultPost.pluginName });
      result = pluginResultPost.result;
    }

    // 12. Caching Final Result
    if (result && (result.code || result.text) && !result.safety_flagged) {
      cache.set(concept, result);
      generateTraceStep("Result Cached", { concept });
    }

    generateTraceStep("Coding Engine Process End", { status: "Success" });
    return result;

  } catch (err: any) {
    generateTraceStep("Coding Engine Error", { error: err.message, stack: err.stack });
    console.error(`[CodingEngine] Critical Error: ${err.message}`, err);
    return {
      error: err.message || "Unknown error in coding engine",
      stack: err.stack,
      prompt,
      timestamp: Date.now(),
      trace: explainability.generateTrace(), // Include full trace on error
    };
  }
}

// Stream large responses (for chat UIs or code blocks)
export async function* streamProcess(prompt: string, context: Record<string, any> = {}) {
  generateTraceStep("Stream Process Initiated", { prompt });
  const result = await process(prompt, context); // Get the full result first
  if (result && result.code && typeof result.code === "string") {
    for (let i = 0; i < result.code.length; i += 100) {
      yield result.code.slice(i, i + 100);
    }
  } else {
    yield JSON.stringify(result); // Fallback for non-code results
  }
  generateTraceStep("Stream Process Completed", {});
}

// Batch processing
export async function batchProcess(
  prompts: string[],
  context: Record<string, any> = {}
): Promise<any[]> {
  generateTraceStep("Batch Process Initiated", { count: prompts.length });
  const results = await Promise.all(prompts.map((p) => process(p, context)));
  generateTraceStep("Batch Process Completed", {});
  return results;
}
