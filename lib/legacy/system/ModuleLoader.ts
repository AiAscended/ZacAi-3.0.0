// core/system/ModuleLoader.ts

import type { SystemModule, ModuleStatus } from './types'; // Define your module interface/types

// Priority order: critical modules first, then non-essential
const MODULES: { name: string; path: string; priority: number; essential: boolean }[] = [
  { name: 'HealthMonitor', path: './health', priority: 1, essential: true },
  { name: 'DiagnosticsEngine', path: './diagnostics', priority: 2, essential: true },
  { name: 'SystemConfiguration', path: './config', priority: 3, essential: true },
  { name: 'ChatModule', path: '../../modules/chat', priority: 4, essential: true },
  { name: 'AdminUIModule', path: '../../modules/admin', priority: 5, essential: true },
  // Non-essential modules below
  { name: 'PhilosophyModule', path: '../../modules/philosophy', priority: 10, essential: false },
  { name: 'CodingModule', path: '../../modules/coding', priority: 11, essential: false },
  // ...add more modules here
];

export interface LoaderLog {
  module: string;
  status: ModuleStatus;
  error?: string;
  loadedAt: string;
}

export class ModuleLoader {
  logs: LoaderLog[] = [];
  loadedModules: { [name: string]: SystemModule } = {};

  async loadAllModules() {
    // Sort modules by priority
    const sortedModules = MODULES.sort((a, b) => a.priority - b.priority);

    for (const mod of sortedModules) {
      try {
        // Dynamically import (works for .ts and .json with proper Next.js config)
        const imported = await import(/* @vite-ignore */ mod.path);
        this.loadedModules[mod.name] = imported.default || imported;
        this.logs.push({
          module: mod.name,
          status: 'loaded',
          loadedAt: new Date().toISOString(),
        });
      } catch (error: any) {
        this.logs.push({
          module: mod.name,
          status: mod.essential ? 'failed-critical' : 'failed-nonessential',
          error: error?.message || String(error),
          loadedAt: new Date().toISOString(),
        });
        if (mod.essential) {
          // If essential, halt further loading and throw
          throw new Error(
            `Critical module "${mod.name}" failed to load: ${error?.message || error}`
          );
        }
        // If non-essential, continue loading others
      }
    }
  }

  getStatus() {
    return this.logs;
  }

  getLoadedModules() {
    return this.loadedModules;
  }
}

// Usage in SystemManager (core/system/manager.ts):
// import { ModuleLoader } from './ModuleLoader';
// const loader = new ModuleLoader();
// await loader.loadAllModules();
// Pass loader.getStatus() to admin diagnostics panel
