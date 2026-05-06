/**
 * Consistent CLI logger with chalk-based coloring and prefixes.
 */

import chalk from "chalk";

let verbose = false;

export function setVerbose(enabled: boolean): void {
  verbose = enabled;
}

export const logger = {
  debug(msg: string): void {
    if (verbose) {
      console.error(chalk.gray(`  [debug] ${msg}`));
    }
  },

  info(msg: string): void {
    console.log(chalk.blue("  ℹ") + ` ${msg}`);
  },

  success(msg: string): void {
    console.log(chalk.green("  ✓") + ` ${msg}`);
  },

  warn(msg: string): void {
    console.error(chalk.yellow("  ⚠") + ` ${msg}`);
  },

  error(msg: string): void {
    console.error(chalk.red("  ✗") + ` ${msg}`);
  },

  blank(): void {
    console.log();
  },

  header(msg: string): void {
    console.log();
    console.log(chalk.bold.cyan(`  ${msg}`));
    console.log(chalk.dim(`  ${"─".repeat(msg.length)}`));
  },

  hint(msg: string): void {
    console.log(chalk.dim(`  ${msg}`));
  },

  list(items: string[], bullet = "•"): void {
    for (const item of items) {
      console.log(`  ${chalk.dim(bullet)} ${item}`);
    }
  },
};
