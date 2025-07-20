import { aiCache } from '@/lib/infrastructure/cache';
import { getEmbedding } from '@/lib/infrastructure/embedding-engine';

export default {
  type: 'postProcess',
  handler: async ({ prompt, response }: any) => {
    const embedding = await getEmbedding(prompt);
    aiCache.set(prompt, response, embedding);
    return { handled: false };
  }
};
