import { aiCache } from '@/lib/infrastructure/cache';

export default {
  type: 'preProcess',
  handler: async ({ prompt }: any) => {
    const cached = aiCache.get(prompt);
    if (cached) return { handled: true, result: cached };
    
    const semantic = await aiCache.getSemantic(prompt);
    if (semantic) return { handled: true, result: semantic };

    return { handled: false };
  }
};
