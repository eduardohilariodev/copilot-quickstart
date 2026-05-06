/**
 * `copilot-apply` command — launch Copilot to apply staged ai-setup/ artifacts.
 */

import type { Command } from "commander";
import { resolve } from "node:path";
import { runCopilotApply } from "../core/copilot-apply.js";

export function registerCopilotApply(program: Command): void {
  program
    .command("copilot-apply")
    .description("Launch Copilot to apply staged ai-setup/ artifacts")
    .option("--target <path>", "Target repository path", ".")
    .action(async (opts: { target: string }) => {
      const target = resolve(opts.target);
      await runCopilotApply(target);
    });
}
