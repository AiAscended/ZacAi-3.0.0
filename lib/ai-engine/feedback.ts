/**
 * ==========================================================
 * File: /lib/ai-engine/feedback.ts
 * Project: ZacAI 3.0
 * Role: AI Feedback Management System
 * Description:
 *   - Provides an API for collecting user feedback on AI responses.
 *   - Stores feedback for later analysis, model fine-tuning, or RLHF.
 *   - Distinguishes between explicit (user-provided) and implicit (system-inferred) feedback.
 * Advanced Features:
 *   - Timestamping and contextual tagging of feedback.
 *   - Support for various feedback types (e.g., thumbs up/down, sentiment, detailed comments).
 *   - Designed for integration with data warehousing and machine learning pipelines.
 * ==========================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { generateTraceStep } from './explainability'; // For tracing feedback events

// --- Configuration ---
const FEEDBACK_DIR = path.join(process.cwd(), 'data/feedback'); // Directory to store feedback logs

// --- Type Definitions ---

/**
 * @enum FeedbackType
 * @description Defines standard types of feedback.
 */
export enum FeedbackType {
  ThumbsUp = 'thumbs_up',
  ThumbsDown = 'thumbs_down',
  Helpful = 'helpful',
  NotHelpful = 'not_helpful',
  Correct = 'correct',
  Incorrect = 'incorrect',
  Detailed = 'detailed', // For text comments
  ImplicitPositive = 'implicit_positive', // e.g., user continued conversation
  ImplicitNegative = 'implicit_negative', // e.g., user rephrased same question
}

/**
 * @interface FeedbackRecord
 * @description Represents a single feedback entry.
 */
interface FeedbackRecord {
  id: string; // Unique ID for this feedback instance
  userId: string;
  sessionId: string;
  timestamp: number;
  type: FeedbackType;
  prompt: string; // The original user prompt that led to the response
  responseSummary: string; // A summary or ID of the AI's response
  details?: string; // Additional detailed comments
  context?: Record<string, any>; // Any specific context data from the interaction
  modelInfo?: { // Info about the model/engine that generated the response
    engine: string;
    domain: string;
    modelId?: string;
  };
}

// --- Internal Helper Functions ---

/**
 * @function logFeedback
 * @description Appends a feedback record to a daily log file.
 * In a production system, this would be pushed to a message queue or database.
 * @param record The feedback record to log.
 */
async function logFeedback(record: FeedbackRecord): Promise<void> {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const fileName = `feedback-${year}-${month}-${day}.jsonl`; // JSON Lines format
  const filePath = path.join(FEEDBACK_DIR, fileName);

  try {
    await fs.mkdir(FEEDBACK_DIR, { recursive: true }); // Ensure directory exists
    // Append the JSON record followed by a newline
    await fs.appendFile(filePath, JSON.stringify(record) + '\n', 'utf-8');
    console.log(`[Feedback] Logged feedback: ${record.type} for user ${record.userId}`);
  } catch (error) {
    console.error(`[Feedback] Failed to log feedback to file ${filePath}:`, error);
  }
}

// --- Public API ---

/**
 * @function submitFeedback
 * @description Submits a feedback record from the user or system.
 * @param recordData Partial data for the feedback record.
 * @param context Optional: Additional context from the AI session.
 */
export async function submitFeedback(
  recordData: Pick<FeedbackRecord, 'userId' | 'sessionId' | 'type' | 'prompt' | 'responseSummary' | 'details'>,
  context?: Record<string, any>
): Promise<void> {
  const feedbackRecord: FeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: Date.now(),
    ...recordData,
    context: context || {},
    modelInfo: {
      engine: context?.engineUsed || 'unknown',
      domain: context?.domainUsed || 'unknown',
      modelId: context?.modelId || 'unknown',
    },
  };

  await logFeedback(feedbackRecord);

  // Trace the feedback submission
  generateTraceStep("Feedback Submitted", {
    userId: feedbackRecord.userId,
    type: feedbackRecord.type,
    summary: feedbackRecord.responseSummary.substring(0, 50) + '...',
  });

  // Future: Here you would trigger asynchronous processes like:
  // 1. Send to a message queue (e.g., Kafka, RabbitMQ) for ML pipeline processing.
  // 2. Update a real-time analytics dashboard.
  // 3. Increment a counter for negative feedback on a specific response.
}

// Example usage:
// feedback.submitFeedback({
//   userId: 'user123',
//   sessionId: 'sess456',
//   type: FeedbackType.ThumbsUp,
//   prompt: 'Generate a Python function for quicksort.',
//   responseSummary: 'def quicksort(...)'
// });

// --- EXPLAINABILITY HELPER (for `generateTraceStep` usage above) ---
// Note: This is a simplified version. The actual `explainability.ts` would be more robust.
// It's assumed to be available in the ai-engine directory.
// This function would usually be part of the main explainability module.
function generateTraceStep(step: string, info: any) {
    // In a real scenario, this would push to a global trace array in the orchestrator.
    // For this module, it just logs to console or a debug log.
    console.debug(`[Feedback Module Trace] ${step}:`, info);
    return { step, info, timestamp: Date.now() };
}
