/**
 * `apply` command — move staged files from ai-setup/ to final locations.
 */

import type { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { applyStaged } from "../core/generate.js";
import { showIntro, showOutro } from "../ui/prompts.js";
import { logger } from "../ui/logger.js";
import { VERSION } from "../core/constants.js";

interface ApplyOptions {
  target: string;
  force: boolean;
}

export function registerApply(program: Command): void {
  program
    .command("apply")
    .description("Move staged files from ai-setup/ to final locations")
    .option("--target <path>", "Target repository path", ".")
    .option("--force", "Overwrite existing files", false)
    .action((opts: ApplyOptions) => {
      const target = resolve(opts.target);
      showIntro(VERSION);

      const { applied, skipped, errors } = applyStaged(target, opts.force);

      if (errors.length > 0) {
        for (const err of errors) logger.error(err);
        showOutro(chalk.red("Apply failed."));
        process.exit(1);
      }

      if (applied.length > 0) {
        logger.info(chalk.bold("Applied:"));
        logger.list(applied.map((f) => `${chalk.green("✓")} ${f}`));
      }

      if (skipped.length > 0) {
        logger.info(chalk.bold("Skipped:"));
        logger.list(skipped.map((f) => `${chalk.yellow("⚠")} ${f}`));
      }

      if (applied.length === 0 && skipped.length > 0) {
        showOutro(chalk.yellow("Nothing new to apply. Use --force to overwrite existing files."));
      } else if (applied.length > 0) {
        logger.blank();
        logger.hint(`Commit: ${chalk.cyan('git add -A && git commit -m "chore: add AI configuration"')}`);
        showOutro(chalk.green(`Applied ${applied.length} files.`));
      } else {
        showOutro(chalk.dim("Nothing to apply."));
      }
    });
}
