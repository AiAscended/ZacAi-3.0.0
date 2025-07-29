/**
 * ==========================================================
 * File: /lib/orchestrator/pluginManager.ts
 * Project: ZacAI 3.0
 * Role: AI-Engine Plugin System
 * Description:
 *   - Manages plugins for tools, skills, and custom logic within the AI engine.
 *   - Enables rapid extensibility and feature development.
 * Advanced Features:
 *   - Supports async plugin execution and dynamic registration.
 *   - Can be extended for plugin configuration and isolation.
 * Future Enhancements:
 *   - Add plugin sandboxing and permission controls.
 * ==========================================================
 */

type AIEnginePlugin = {
  type: string;
  handler: (args: any) => Promise<void>;
};

const enginePlugins: AIEnginePlugin[] = [];

export function registerAIEnginePlugin(plugin: AIEnginePlugin) {
  enginePlugins.push(plugin);
}

export async function runAIEnginePlugins(type: string, args: any) {
  for (const plugin of enginePlugins) {
    if (plugin.type === type) await plugin.handler(args);
  }
}
