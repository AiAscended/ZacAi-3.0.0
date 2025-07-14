/**
 * ==========================================================
 * File: /lib/coding/plugin-manager.ts
 * Project: ZacAI 3.0
 * Role: Coding Engine Plugin System
 * Description:
 *   - Manages plugins for code tools, skills, and custom logic.
 *   - Enables rapid extensibility for the coding engine.
 * Advanced Features:
 *   - Async plugin execution and dynamic registration.
 *   - Can be extended for plugin configuration and isolation.
 * Future Enhancements:
 *   - Add plugin sandboxing, permissions, and hot-reloading.
 * ==========================================================
 */

type CodingPlugin = {
  type: string;
  handler: (args: any) => Promise<void>;
};

const codingPlugins: CodingPlugin[] = [];

export function registerCodingPlugin(plugin: CodingPlugin) {
  codingPlugins.push(plugin);
}

export async function runCodingPlugins(type: string, args: any) {
  for (const plugin of codingPlugins) {
    if (plugin.type === type) await plugin.handler(args);
  }
}
