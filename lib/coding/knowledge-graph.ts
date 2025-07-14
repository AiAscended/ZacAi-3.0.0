/**
 * ==========================================================
 * File: /lib/coding/knowledge-graph.ts
 * Project: ZacAI 3.0
 * Role: Coding Knowledge Graph Integration
 * Description:
 *   - Links code concepts, libraries, and best practices for richer reasoning.
 *   - Enables advanced context retrieval and suggestion generation.
 * Advanced Features:
 *   - Integrates with semantic search and feedback modules.
 *   - Can be extended for graph-based reasoning and recommendations.
 * Future Enhancements:
 *   - Add visualization and real-time graph updates.
 * ==========================================================
 */

type CodeConcept = {
  name: string;
  description: string;
  related: string[];
};

const knowledgeGraph: Record<string, CodeConcept> = {};

/**
 * Adds or updates a code concept in the knowledge graph.
 */
export function upsertConcept(concept: CodeConcept) {
  knowledgeGraph[concept.name] = concept;
}

/**
 * Retrieves related concepts for a given code topic.
 */
export function getRelatedConcepts(conceptName: string): string[] {
  return knowledgeGraph[conceptName]?.related || [];
}
