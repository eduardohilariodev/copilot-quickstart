/**
 * `onboard` command — hidden alias for `init` (backwards compatibility).
 */

import type { Command } from "commander";
import { resolve } from "node:path";

export function registerOnboard(program: Command): void {
  program
    .command("onboard")
    .description("Alias for init (deprecated)")
    .option("--target <path>", "Target repository path", ".")
    .option("--non-interactive", "Skip prompts, use defaults", false)
    .option("--force", "Overwrite existing files", false)
    .option("--skills", "Include starter skill pack", false)
    .action(async (opts) => {
      // Delegate to init command
      const initCmd = program.commands.find((c) => c.name() === "init");
      if (initCmd) {
        await initCmd.parseAsync([
          "", "",
          "--target", opts.target || ".",
          ...(opts.nonInteractive ? ["--non-interactive"] : []),
          ...(opts.force ? ["--force"] : []),
        ]);
      }
    });
}
