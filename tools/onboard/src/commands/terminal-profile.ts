/**
 * `terminal-profile` command — build VSCode terminal profiles for gh copilot.
 *
 * Delegates to the existing terminal-profile module (lib/terminal-profile.mjs).
 * Will be fully ported to TypeScript in a future pass.
 */

import type { Command } from "commander";
import { join } from "node:path";
import { LIBRARY_ROOT } from "../core/constants.js";

export function registerTerminalProfile(program: Command): void {
  program
    .command("terminal-profile")
    .description("Build VSCode terminal profiles for gh copilot")
    .action(async () => {
      const modulePath = join(LIBRARY_ROOT, "tools", "onboard", "lib", "terminal-profile.mjs");
      try {
        const { runTerminalProfileBuilder } = await import(modulePath);
        await runTerminalProfileBuilder();
      } catch (err) {
        console.error(`Failed to load terminal-profile module: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
