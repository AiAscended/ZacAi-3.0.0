type Plugin = {
  type: "preProcess" | "postProcess",
  handler: (args: any) => Promise<{ handled: boolean, result?: any }>
};

const plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin) {
  plugins.push(plugin);
}

export async function runPlugins(type: "preProcess" | "postProcess", args: any) {
  for (const plugin of plugins) {
    if (plugin.type === type) {
      const result = await plugin.handler(args);
      if (result.handled) return result;
    }
  }
  return { handled: false };
}
