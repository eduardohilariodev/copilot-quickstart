/**
 * `reset` command — remove ai-setup/ staging directory.
 */

import type { Command } from "commander";
import { resolve, join } from "node:path";
import { existsSync, rmSync } from "node:fs";
import chalk from "chalk";
import { STAGING_DIR_NAME } from "../core/constants.js";
import { logger } from "../ui/logger.js";

export function registerReset(program: Command): void {
  program
    .command("reset")
    .description("Remove ai-setup/ staging directory")
    .option("--target <path>", "Target repository path", ".")
    .action((opts: { target: string }) => {
      const target = resolve(opts.target);
      const stagingDir = join(target, STAGING_DIR_NAME);

      if (!existsSync(stagingDir)) {
        logger.hint("No ai-setup/ directory to remove.");
        return;
      }

      rmSync(stagingDir, { recursive: true });
      logger.success(`Removed ${chalk.cyan(STAGING_DIR_NAME + "/")}`);
    });
}
