import fs from "fs/promises";
import path from "path";
import { runPlugins } from "./tools/plugin-manager";

const PROFILE_PATH = path.join(process.cwd(), "data/user/profile.json");

// User profile CRUD
export async function getProfile(userId: string) {
  try {
    const raw = await fs.readFile(PROFILE_PATH, "utf-8");
    const profiles = JSON.parse(raw);
    return profiles[userId] || null;
  } catch {
    return null;
  }
}

export async function saveProfile(userId: string, data: any) {
  let profiles = {};
  try {
    const raw = await fs.readFile(PROFILE_PATH, "utf-8");
    profiles = JSON.parse(raw);
  } catch {}
  profiles[userId] = data;
  await fs.writeFile(PROFILE_PATH, JSON.stringify(profiles, null, 2));
}

export async function process(
  prompt: string,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    let pluginResult = await runPlugins("preProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    // Example: "show my profile" or "update my preferences"
    if (/show.*profile/i.test(prompt)) {
      return await getProfile(context.userId || "default");
    }
    if (/update.*profile/i.test(prompt)) {
      await saveProfile(context.userId || "default", context.updateData || {});
      return { status: "updated" };
    }

    pluginResult = await runPlugins("postProcess", { prompt, context });
    if (pluginResult?.handled) return pluginResult.result;

    return { error: "User command not understood", prompt };
  } catch (err: any) {
    return { error: err.message || "Unknown error", stack: err.stack, prompt };
  }
}
