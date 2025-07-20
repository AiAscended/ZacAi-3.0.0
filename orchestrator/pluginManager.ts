// /lib/orchestrator/pluginManager.ts

export type PluginType =
  | "preProcess"
  | "postProcess"
  | "before"
  | "after"
  | "onError"
  | "onRoute"
  | string;

export type Plugin = {
  type: PluginType;
  handler: (args: any) => Promise<{ handled: boolean; result?: any }>;
};

const plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin) {
  plugins.push(plugin);
}

export async function runPlugins(type: PluginType, args: any) {
  for (const plugin of plugins) {
    if (plugin.type === type) {
      const result = await plugin.handler(args);
      if (result?.handled) return result;
    }
  }
  return { handled: false };
}
