/**
 * ==========================================================
 * File: /lib/ai-engine/orchestrator.ts
 * Project: ZacAI 3.0
 * Role: Universal Multimodal AI Orchestrator
 * Description:
 *   - Detects user intent and routes prompts to the correct domain engine (coding, math, etc.)
 *   - Integrates memory (short-term, long-term, project), feedback, multimodal, and explainability
 *   - Supports task decomposition, aggregation, and proactive future extensibility
 *   - Now includes proactive suggestion generation based on context and errors.
 * ==========================================================
 */

import { infer } from "./engine";
import * as detectors from "./detectors";
import * as aiMemory from "./memory";
import * as aiFeedback from "./feedback";
import { FeedbackType } from "./feedback";
import * as safety from "./safety";
import * as rateLimiter from "./rate-limiter";
import * as explainability from "./explainability";
import * as multimodal from "./multimodal";
import { runGlobalPlugins } from "../shared/plugin-manager";
import * as suggestionEngine from "./suggestion-engine"; // NEW: Import suggestion engine
import { AISuggestion } from "./suggestion-engine"; // NEW: Import AISuggestion interface

// Domain Engine Imports
import * as coding from "../coding/engine";
import * as mathematics from "../mathematics/engine";
import * as vocabulary from "../vocabulary/engine";
import * as grammar from "../grammar/engine";
// Add future domains here as needed

/**
 * @interface AIContext
 * @description Defines the comprehensive context passed throughout the AI system.
 */
interface AIContext {
  userId: string;
  sessionId: string;
  projectId?: string;
  multimodalInput?: multimodal.MultimodalInput; // Raw multimodal input
  multimodalProcessed?: multimodal.ProcessedMultimodalOutput; // Processed multimodal data
  globalMemory?: aiMemory.GlobalMemory; // Comprehensive memory object
  detectedDomain?: string; // The primary domain detected for the current prompt
  [key: string]: any; // Allows for additional dynamic context properties
}

/**
 * @interface PromptTask
 * @description Represents a decomposed sub-task for processing by a domain engine.
 */
interface PromptTask {
  id: string; // Unique ID for the task
  originalPrompt: string; // The original user prompt
  content: string; // The content of the sub-task
  domain: string; // The specific domain responsible for this sub-task
  subTasks?: PromptTask[]; // Recursive for nested decomposition
}

/**
 * @interface OrchestrationResult
 * @description The final structured output of the orchestration process.
 */
interface OrchestrationResult {
  response: any; // The primary AI response
  trace: string; // A detailed trace of the orchestration process for explainability
  warnings?: string[]; // Non-critical issues encountered
  errors?: string[]; // Critical errors that prevented full processing
  suggestions?: AISuggestion[]; // NEW: Proactive suggestions for the user
}

// Register all domain engines here
// Each engine must expose a `process(task: string, context: any)` method.
const domainEngines: { [key: string]: { process: (task: string, context: any) => Promise<any> } } = {
  coding,
  mathematics,
  vocabulary,
  grammar,
  general: { process: async (task, context) => { // General domain fallback using core LLM
      const { text } = await infer(task, { context });
      return { response: text, domain: 'general' };
    }
  },
  // Add more domains as you implement them (e.g., science, history)
};

/**
 * @function processPrompt
 * @description The core orchestration function that processes a user prompt
 *              through a series of AI steps including detection, routing, and aggregation.
 * @param prompt The user's input text.
 * @param context The initial AI context containing user and session IDs.
 * @returns A Promise resolving to an OrchestrationResult.
 */
export async function processPrompt(prompt: string, context: AIContext): Promise<OrchestrationResult> {
  // Initialize trace, warnings, errors, and the final response variable
  explainability.clearTrace(); // Clear trace for new request
  const traceSteps: { step: string; info: any }[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let finalResponse: any = null; // Will hold the aggregated response

  try {
    generateTraceStep("Orchestration Start", { prompt, user: context.userId, session: context.sessionId, project: context.projectId });

    // 1. Pre-processing, Safety, Rate-Limiting
    // These steps prevent malicious input or abuse before any heavy processing begins.
    await runGlobalPlugins("preProcessPrompt", { prompt, context });
    generateTraceStep("Pre-processing Plugins Executed", {});

    if (!await safety.isSafePrompt(prompt)) {
      errors.push("Unsafe prompt detected and blocked.");
      generateTraceStep("Safety Check Failed", { reason: "unsafe_prompt" });
      return { response: { error: "Unsafe content detected. Your request cannot be processed." }, trace: explainability.generateTrace(traceSteps), errors };
    }
    generateTraceStep("Safety Check Passed", {});

    if (rateLimiter.isRateLimited(context.userId)) {
      errors.push("Rate limit exceeded for this user.");
      generateTraceStep("Rate Limit Exceeded", { userId: context.userId });
      return { response: { error: "You have exceeded the rate limit. Please try again shortly." }, trace: explainability.generateTrace(traceSteps), errors };
    }
    generateTraceStep("Rate Limit Check Passed", {});

    // 2. Multimodal Input Processing
    // If multimodal input exists, process it to extract meaningful context.
    if (context.multimodalInput && multimodal.processMultimodalInput) {
      context.multimodalProcessed = await multimodal.processMultimodalInput(context.multimodalInput);
      generateTraceStep("Multimodal Input Processed", { input_type: context.multimodalInput.type, summary: context.multimodalProcessed.summary.slice(0, 50) + "..." });
    } else {
      generateTraceStep("No Multimodal Input", {});
    }

    // 3. Retrieve Global Memory
    // Load comprehensive conversational memory, user preferences, and project context.
    // This memory is crucial for context-aware decisions and responses.
    const globalMemory = await aiMemory.getMemory(context.userId, context.sessionId, context.projectId);
    context.globalMemory = globalMemory; // Make this comprehensive memory available to all downstream engines.
    generateTraceStep("Global Memory Retrieved", {
        shortTerm: !!globalMemory.shortTerm,
        longTermUser: !!globalMemory.longTermUser,
        project: !!globalMemory.project,
        sessionHistoryLength: globalMemory.shortTerm?.sessionHistory?.length || 0
    });

    // 4. Domain Detection
    // Determine the primary domain responsible for handling the user's prompt.
    let detectedDomain = await detectors.detectDomain(prompt, globalMemory, context.multimodalProcessed);
    // Fallback to 'general' if the detected domain is not recognized or is invalid.
    if (!detectedDomain || !domainEngines[detectedDomain]) {
      warnings.push(`Detected domain '${detectedDomain}' is not recognized. Falling back to 'general'.`);
      detectedDomain = "general";
    }
    context.detectedDomain = detectedDomain; // Store for traceability and downstream use
    generateTraceStep("Domain Detected", { domain: detectedDomain });

    // 5. Task Decomposition (LLM-powered)
    // For complex prompts, the orchestrator breaks them down into smaller, manageable sub-tasks.
    let tasksToProcess: PromptTask[] = [];
    try {
      // Use LLM to decide if decomposition is needed and how to perform it.
      const decompositionInstruction = `Decompose the following user prompt for the '${detectedDomain}' domain into a JSON array of minimal, atomic sub-tasks. Each element in the array should be a string representing a sub-task. If the prompt is simple and atomic, return an array with just the original prompt as a single sub-task.
        User Prompt: "${prompt}"
        Previous conversation context summary: ${globalMemory.shortTerm?.sessionHistory?.slice(-1).map(h => h.prompt).join('\n') || 'N/A'}
        Example for complex prompt: "Write a Python function to sort an array, and also explain how quicksort works." -> ["Write a Python function to sort an array", "Explain how quicksort works"]
        Example for simple prompt: "Define polymorphism" -> ["Define polymorphism"]`;

      const { text: decompositionJson } = await infer(decompositionInstruction, { context });
      const subTasks = JSON.parse(decompositionJson); // Expecting an array of strings

      if (Array.isArray(subTasks) && subTasks.length) {
        tasksToProcess = subTasks.map((content: string, idx: number) => ({
            id: `task-${Date.now()}-${idx}`, // Unique ID for each sub-task
            originalPrompt: prompt,
            content: content,
            domain: detectedDomain, // Assign the main detected domain to all sub-tasks initially
        }));
      } else {
        // Fallback if LLM doesn't return a valid array, or an empty one.
        tasksToProcess = [{
          id: `task-${Date.now()}`,
          originalPrompt: prompt,
          content: prompt,
          domain: detectedDomain,
        }];
      }
      generateTraceStep("Task Decomposition", { tasksCount: tasksToProcess.length, tasks: tasksToProcess.map(t => t.content) });
    } catch (parseError: any) {
      warnings.push(`Task decomposition failed: ${parseError.message}. Processing original prompt as a single task.`);
      generateTraceStep("Task Decomposition Failed", { error: parseError.message, llmOutput: parseError.llmOutput || 'N/A' });
      // If decomposition fails, treat the original prompt as a single task.
      tasksToProcess = [{
        id: `task-${Date.now()}`,
        originalPrompt: prompt,
        content: prompt,
        domain: detectedDomain,
      }];
    }

    // 6. Route to Domain Engines & Process Tasks
    // Each sub-task is routed to its respective domain engine for processing.
    const engineResponses: any[] = [];
    for (const task of tasksToProcess) {
      const engine = domainEngines[task.domain];
      if (engine) {
        try {
          generateTraceStep(`Routing to ${task.domain} Engine`, { taskId: task.id, taskContent: task.content.slice(0, 100) + "..." });
          // Pass the full context, including globalMemory and multimodalProcessed, to the engine.
          const engineResponse = await engine.process(task.content, { ...context, taskData: task });
          engineResponses.push(engineResponse);
          generateTraceStep(`${task.domain} Engine Response Received`, { taskId: task.id, responseSummary: JSON.stringify(engineResponse).slice(0, 100) + "..." });
        } catch (engineError: any) {
          errors.push(`Error in ${task.domain} engine for task '${task.content.slice(0, 50)}...': ${engineError.message}`);
          generateTraceStep(`Error in ${task.domain} Engine`, { taskId: task.id, error: engineError.message });
          // Add a structured error response to the list of engine responses.
          engineResponses.push({ error: `Failed to process task in ${task.domain} engine.`, task: task.content, details: engineError.message });
        }
      } else {
        // This case should be rare if domain detection is robust, but provides a fallback.
        warnings.push(`No specific engine found for domain '${task.domain}'. Using general LLM fallback.`);
        generateTraceStep(`No Specific Engine, Fallback to General LLM`, { taskId: task.id, domain: task.domain });
        try {
          const generalResponse = await infer(task.content, { context: { ...context, globalMemory } });
          engineResponses.push(generalResponse);
        } catch (llmError: any) {
          errors.push(`General LLM fallback error for task '${task.content.slice(0, 50)}...': ${llmError.message}`);
          engineResponses.push({ error: "Failed to get general response from LLM fallback.", task: task.content, details: llmError.message });
        }
      }
    }

    // 7. Aggregation and Synthesis (LLM-powered)
    // Synthesize all responses from individual domain engines into one cohesive final response.
    generateTraceStep("Aggregation and Synthesis Started", { engineResponsesCount: engineResponses.length });
    const aggregationPrompt = `You are an AI orchestrator. Your final task is to synthesize a single, comprehensive, and helpful response based on the original user prompt, the processed sub-tasks, and the outputs received from various AI engines.

      Original User Prompt: "${prompt}"
      Multimodal Context Summary: ${context.multimodalProcessed ? JSON.stringify(context.multimodalProcessed.summary).slice(0, 200) : "N/A"}
      Processed Sub-tasks: ${tasksToProcess.map(t => `[${t.domain}] "${t.content.slice(0, 100)}..."`).join(";\n")}
      Outputs from Domain Engines: ${JSON.stringify(engineResponses, null, 2)}
      Previous Conversation History (summarized): ${globalMemory.longTermUser?.summarizedHistory?.slice(-3).join("; ") || "N/A"}
      Current Session History (last 3 turns): ${globalMemory.shortTerm?.sessionHistory?.slice(-3).map(h => `User: "${h.prompt}" -> AI: "${JSON.stringify(h.response).slice(0, 50)}..."`).join("; ") || "N/A"}
      User Preferences: ${JSON.stringify(globalMemory.longTermUser?.preferences || {}) || "N/A"}
      Project Context: ${JSON.stringify(globalMemory.project || {}) || "N/A"}

      Ensure the final response is coherent, directly addresses the user's original intent, and seamlessly integrates information from all relevant engine outputs. If there were errors, acknowledge them gracefully.`;

    finalResponse = await infer(aggregationPrompt, {
      context: { ...context, globalMemory, engineOutputs: engineResponses, originalTasks: tasksToProcess },
    });
    generateTraceStep("Responses Aggregated & Synthesized", { finalResponseSummary: JSON.stringify(finalResponse).slice(0, 100) + "..." });

    // 8. Global Post-processing, Memory Update, Feedback, and Plugin Hooks

    // Update global memory with the latest interaction for future context.
    await aiMemory.updateMemory(context.userId, context.sessionId, {
      newInteraction: { prompt, response: finalResponse }, // Automatically logs this turn
      // Additional targeted memory updates can go here if the orchestrator detects specific changes
      // e.g., longTermUser: { preferences: { /* updated prefs */ } },
      // e.g., project: { codebaseOverview: "Updated with new analysis" }
    }, context.projectId);
    generateTraceStep("Global Memory Updated", {});

    // Submit implicit positive feedback: Indicates a successful and completed interaction.
    await aiFeedback.submitFeedback({
      userId: context.userId,
      sessionId: context.sessionId,
      type: FeedbackType.ImplicitPositive,
      prompt: prompt,
      responseSummary: JSON.stringify(finalResponse).slice(0, 200) + '...',
      details: `Orchestrator successfully processed prompt and generated a response for domain ${detectedDomain}.`,
    }, {
      engineUsed: detectedDomain,
      modelId: 'orchestrator_v3', // Identifier for the orchestrator version/model
      traceId: explainability.generateTrace(), // Link to the full trace of this request
    });
    generateTraceStep("Implicit Positive Feedback Submitted", {});

    // Generate Proactive Suggestions
    // Offer helpful next steps or related queries to the user.
    const suggestions = await suggestionEngine.generateSuggestions(
      prompt,
      context, // Pass the full context for rich suggestion generation
      errors, // Pass any errors encountered during this process
      warnings, // Pass any warnings encountered
      finalResponse // Pass the final response to allow suggestions based on it
    );
    generateTraceStep("Suggestions Generated", { count: suggestions.length, suggestionsSummary: suggestions.map(s => s.text).slice(0,3).join('; ') });

    // Execute any global post-processing plugins.
    await runGlobalPlugins("postProcessPrompt", { prompt, context, response: finalResponse });
    generateTraceStep("Global Post-processing Plugins Executed", {});

    generateTraceStep("Orchestration End", { status: "Success" });

    // Return the comprehensive result
    return {
      response: finalResponse,
      trace: explainability.generateTrace(), // Get the full trace for the entire request
      warnings,
      errors,
      suggestions,
    };

  } catch (orchestrationError: any) {
    // --- Error Handling and Recovery ---
    // Log the critical error and provide a user-friendly error message.
    errors.push(`Critical Orchestration Failure: ${orchestrationError.message}`);
    generateTraceStep("Critical Orchestration Error", { error: orchestrationError.message, stack: orchestrationError.stack });

    // Submit implicit negative feedback: Indicates a failure in the AI's ability to process the prompt.
    await aiFeedback.submitFeedback({
      userId: context.userId,
      sessionId: context.sessionId,
      type: FeedbackType.ImplicitNegative,
      prompt: prompt,
      responseSummary: `Orchestration Error: ${orchestrationError.message.slice(0, 100)}`,
      details: `Orchestration failed during processing for prompt: ${prompt}`,
    }, {
      engineUsed: 'orchestrator_failure', // Specific identifier for orchestration failures
      modelId: 'orchestrator_v3',
      traceId: explainability.generateTrace(),
      errorMessage: orchestrationError.message,
    });

    // Generate suggestions even on error to guide the user (e.g., "try rephrasing", "contact support").
    const suggestionsOnError = await suggestionEngine.generateSuggestions(
      prompt,
      context,
      errors, // Pass the errors encountered
      warnings,
      null // No successful response to base suggestions on
    );
    generateTraceStep("Suggestions Generated (OnError)", { count: suggestionsOnError.length });

    console.error("[Orchestrator] Critical error during prompt processing:", orchestrationError); // Log to console for debugging

    // Return an error response with trace, warnings, errors, and helpful suggestions.
    return {
      response: { error: "An unrecoverable internal error occurred. Please try again or contact support." },
      trace: explainability.generateTrace(),
      warnings,
      errors,
      suggestions: suggestionsOnError,
    };
  }
}

/**
 * @function handleUserRequest
 * @description A wrapper function for handling incoming user requests, preparing the context,
 *              and invoking the main processPrompt function.
 *              This would typically be called by your API layer (e.g., a Next.js API route).
 * @param userId The ID of the user making the request.
 * @param sessionId The ID of the current user session.
 * @param prompt The user's text input.
 * @param additionalContext Any additional context (e.g., projectId, raw multimodal input).
 * @returns A Promise resolving to the OrchestrationResult.
 */
export async function handleUserRequest(
  userId: string,
  sessionId: string,
  prompt: string,
  additionalContext: any = {}
): Promise<OrchestrationResult> {
  const fullContext: AIContext = { userId, sessionId, prompt, ...additionalContext };
  return processPrompt(prompt, fullContext);
}

/**
 * === HOW TO ADD A NEW DOMAIN ===
 * 1. Implement your new domain engine in `/lib/<domain>/engine.ts`.
 *    It must export a `process(task: string, context: any)` function.
 * 2. Import your new domain engine at the top of this file.
 * 3. Add it to the `domainEngines` registry constant above.
 * 4. (Optional but Recommended) Update `detectors.ts` to recognize the new domain
 *    in its LLM prompt for domain routing accuracy.
 */
