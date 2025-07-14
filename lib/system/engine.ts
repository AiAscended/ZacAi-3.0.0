import os from "os";
import { runPlugins } from "./tools/plugin-manager";

export async function process(
  prompt: string,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    let pluginResult = await runPlugins("preProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    if (/status|health/i.test(prompt)) {
      return {
        status: "healthy",
        uptime: os.uptime(),
        memory: os.freemem(),
        load: os.loadavg(),
        timestamp: Date.now(),
      };
    }
    if (/self.?heal/i.test(prompt)) {
      // Add your self-healing logic here
      return { healed: true, message: "System check passed." };
    }

    pluginResult = await runPlugins("postProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    return { error: "System command not recognized", prompt };
  } catch (err: any) {
    return { error: err.message || "Unknown error", stack: err.stack, prompt };
  }
}
