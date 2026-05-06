/**
 * `terminal-profile` command — build VSCode terminal profiles for gh copilot.
 */

import type { Command } from "commander";
import { runTerminalProfileBuilder } from "../core/terminal-profile.js";

export function registerTerminalProfile(program: Command): void {
  program
    .command("terminal-profile")
    .description("Build VSCode terminal profiles for gh copilot")
    .action(async () => {
      await runTerminalProfileBuilder();
    });
}
