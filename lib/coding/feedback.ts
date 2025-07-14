/**
 * ==========================================================
 * File: /lib/coding/feedback.ts
 * Project: ZacAI 3.0
 * Role: Feedback & Learning Module
 * Description:
 *   - Collects user corrections, ratings, and feedback on code outputs.
 *   - Enables the system to learn and adapt over time.
 * Advanced Features:
 *   - Integrates with memory and knowledge graph.
 *   - Can be extended for automated retraining triggers.
 * Future Enhancements:
 *   - Add active learning and reinforcement learning integration.
 * ==========================================================
 */

type Feedback = {
  userId: string;
  code: string;
  feedback: string;
  rating: number;
  timestamp: number;
};

const feedbackStore: Feedback[] = [];

/**
 * Adds user feedback for a code output.
 */
export function addFeedback(feedback: Feedback) {
  feedbackStore.push(feedback);
}

/**
 * Retrieves all feedback for a user or code snippet.
 */
export function getFeedback({ userId, code }: { userId?: string; code?: string }) {
  return feedbackStore.filter(fb =>
    (!userId || fb.userId === userId) &&
    (!code || fb.code === code)
  );
}
