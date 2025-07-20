import LRU from 'lru-cache';
import { generateTraceStep } from '@/lib/ai/orchestrator/trace';
import { getEmbedding } from './embedding-engine';
import { searchSimilarVector } from './vector-db-client';

const CACHE_TTL = 1000 * 60 * 60;
const MAX_ITEMS = 500;
const SEMANTIC_THRESHOLD = 0.9;

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  embedding?: number[];
  originalKey?: string;
}

export class AICache {
  private lru = new LRU<string, CacheEntry<any>>({
    max: MAX_ITEMS,
    ttl: CACHE_TTL,
    updateAgeOnGet: true,
    updateAgeOnSet: true,
  });

  get<T>(key: string): T | undefined {
    const entry = this.lru.get(key);
    if (entry) {
      generateTraceStep('Cache Hit (LRU)', { key });
      return entry.value as T;
    }
    return undefined;
  }

  set<T>(key: string, value: T, embedding?: number[]) {
    const entry: CacheEntry<T> = { value, timestamp: Date.now(), originalKey: key, embedding };
    this.lru.set(key, entry);
    generateTraceStep('Cache Set', { key, embedding: !!embedding });
  }

  delete(key: string) {
    this.lru.delete(key);
    generateTraceStep('Cache Delete', { key });
  }

  clear() {
    this.lru.clear();
    generateTraceStep('Cache Cleared');
  }

  async getSemantic<T>(query: string): Promise<T | undefined> {
    const embedding = await getEmbedding(query);
    if (!embedding) return undefined;

    const result = await searchSimilarVector(embedding);
    if (!result || result.score < SEMANTIC_THRESHOLD) return undefined;

    const entry = this.lru.get(result.id);
    if (entry) {
      generateTraceStep('Semantic Cache Hit', { id: result.id, score: result.score });
      return entry.value;
    }

    return undefined;
  }

  size(): number {
    return this.lru.size;
  }
}

export const aiCache = new AICache();
