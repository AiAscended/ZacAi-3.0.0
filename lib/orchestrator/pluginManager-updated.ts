import { Plugin } from './types';
import PreCache from '@/plugins/preProcess/cacheCheck';
import PostCache from '@/plugins/postProcess/cacheStore';

const plugins: Plugin[] = [
  PreCache,
  PostCache,
  // Add other plugins here
];

export async function runPlugins(type: string, args: any) {
  for (const plugin of plugins) {
    if (plugin.type === type) {
      const result = await plugin.handler(args);
      if (result?.handled) return result;
    }
  }
  return { handled: false };
}
