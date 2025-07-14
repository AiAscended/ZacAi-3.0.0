/**
 * ==========================================================
 * File: /lib/ai-engine/detectors.ts
 * Project: ZacAI 3.0
 * Role: AI Intent and Domain Detection
 * Description:
 *   - Determines the primary intent and relevant domain for a given user prompt.
 *   - Leverages LLM capabilities, conversation history, and multimodal input analysis.
 *   - Designed for high accuracy and flexibility in routing complex user requests.
 * Advanced Features:
 *   - Context-aware domain selection using global memory.
 *   - Prioritizes multimodal cues (e.g., image content for coding tasks).
 *   - Dynamic adaptation to new domains as they are registered.
 * ==========================================================
 */

import { infer } from "./engine"; // The main LLM inference function
import { generateTraceStep } from "./explainability"; // For tracing decisions
import { GlobalMemory } from "./memory"; // Global AI memory interface
import { ProcessedMultimodalOutput } from './multimodal'; // Processed multimodal data interface

/**
 * @function detectDomain
 * @description Analyzes the user's prompt, historical context, and multimodal inputs
 *              to determine the most appropriate domain for processing.
 * @param prompt The raw text prompt from the user.
 * @param globalMemory The comprehensive global memory object (short-term, long-term, project).
 * @param multimodalProcessed Optional: The processed output from multimodal analysis.
 * @returns A Promise resolving to the detected domain string (e.g., 'coding', 'mathematics', 'general').
 */
export async function detectDomain(
  prompt: string,
  globalMemory: GlobalMemory,
  multimodalProcessed?: ProcessedMultimodalOutput
): Promise<string> {
  generateTraceStep("Domain Detection Started", { prompt: prompt.slice(0, 100) + "..." });

  // Construct a detailed prompt for the LLM to perform domain detection.
  // This prompt includes all relevant contextual information.
  const domainDetectionPrompt = `You are an intelligent domain router for an AI assistant. Your task is to analyze the user's request, considering the textual prompt, the conversation history, user preferences, project context, and any available multimodal input analysis, to accurately determine the single most appropriate domain for handling this request.

Available domains (choose one):
- 'coding': For all programming, code generation, debugging, language-specific questions, or code-related analysis.
- 'mathematics': For calculations, mathematical concepts, equations, algorithms, and logical problems.
- 'vocabulary': For definitions, synonyms, antonyms, word usage, and language learning.
- 'grammar': For syntax, punctuation, sentence structure, and language correctness.
- 'science': For physics, chemistry, biology, space, and general scientific inquiries.
- 'geography': For questions about locations, maps, countries, geological features, and environmental topics.
- 'general': For anything not covered by the specific domains, general knowledge, or casual conversation.

Consider these factors in order of importance:
1.  **Explicit keywords or phrases** in the current prompt.
2.  **Multimodal input analysis**: If a visual input strongly implies a domain (e.g., image of code -> coding).
3.  **Recent conversation history**: If the user has been consistently asking about a certain topic.
4.  **User preferences/learned patterns**: From long-term memory.
5.  **Project context**: If a project is loaded, questions related to it.

---
User Prompt: "${prompt}"

Conversation History (last 3 relevant exchanges):
${globalMemory.shortTerm?.sessionHistory?.slice(-3).map((interaction, index) =>
    `  ${index + 1}. User: "${interaction.prompt}" -> AI: "${JSON.stringify(interaction.response || 'N/A').slice(0, 100)}..."`
  ).join('\n') || '  No recent conversation history.'}

User Preferences:
${JSON.stringify(globalMemory.longTermUser?.preferences || {}) || '  No specific preferences.'}

Project Context (summary):
${globalMemory.project?.codebaseOverview || globalMemory.project?.designDocuments?.join(', ') || '  No active project context.'}

Multimodal Input Analysis Summary:
${multimodalProcessed ? JSON.stringify(multimodalProcessed.summary || 'No detailed summary provided.').slice(0, 300) : '  No multimodal input provided.'}
${multimodalProcessed?.imageDescription ? `  Image Description: ${multimodalProcessed.imageDescription.slice(0, 300)}` : ''}
${multimodalProcessed?.audioTranscription ? `  Audio Transcription: "${multimodalProcessed.audioTranscription.slice(0, 300)}"` : ''}

---
Based on the above, which single domain is the most appropriate? Provide only the domain name, no extra text, no punctuation.

Example Output:
coding
`;

  try {
    // Call the core LLM to infer the domain.
    // The `context` passed to `infer` should contain all necessary information for the LLM to make its decision.
    const { text: inferredDomain } = await infer(domainDetectionPrompt, {
      context: {
        prompt,
        globalMemory,
        multimodalProcessed,
        // Any other context variables the LLM might need to reason about.
      }
    });

    // Clean and validate the inferred domain.
    const detected = inferredDomain.trim().toLowerCase();

    // Define allowed domains to ensure the LLM returns a valid one.
    // This list should ideally be dynamic, populated from your `domainEngines` registry in orchestrator.ts
    const allowedDomains = ['coding', 'mathematics', 'vocabulary', 'grammar', 'science', 'geography', 'general'];

    if (allowedDomains.includes(detected)) {
      generateTraceStep("Domain Detection Success", { detectedDomain: detected });
      return detected;
    } else {
      generateTraceStep("Domain Detection Invalid (Fallback to General)", { inferred: detected });
      console.warn(`[DomainDetector] LLM inferred an invalid domain: "${detected}". Falling back to 'general'.`);
      return 'general'; // Fallback for invalid LLM output
    }
  } catch (error: any) {
    generateTraceStep("Domain Detection Error (Fallback to General)", { error: error.message });
    console.error(`[DomainDetector] Error during domain detection: ${error.message}. Falling back to 'general'.`);
    return 'general'; // Critical error fallback
  }
}
