/**
 * `copilot-apply` command — launch Copilot to apply staged ai-setup/ artifacts.
 *
 * Delegates to the existing copilot-apply module (lib/copilot-apply.mjs).
 * Will be fully ported to TypeScript in a future pass.
 */

import type { Command } from "commander";
import { resolve, join } from "node:path";
import { LIBRARY_ROOT } from "../core/constants.js";

export function registerCopilotApply(program: Command): void {
  program
    .command("copilot-apply")
    .description("Launch Copilot to apply staged ai-setup/ artifacts")
    .option("--target <path>", "Target repository path", ".")
    .action(async (opts: { target: string }) => {
      const target = resolve(opts.target);
      const modulePath = join(LIBRARY_ROOT, "tools", "onboard", "lib", "copilot-apply.mjs");
      try {
        const { runCopilotApply } = await import(modulePath);
        await runCopilotApply(target);
      } catch (err) {
        console.error(`Failed to load copilot-apply module: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
