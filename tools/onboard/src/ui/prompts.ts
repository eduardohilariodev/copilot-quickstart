/**
 * Thin wrappers around @inquirer/prompts for consistent UX.
 */

import { confirm, input, select, checkbox } from "@inquirer/prompts";
import chalk from "chalk";

export interface SelectOption<T = string> {
  value: T;
  name: string;
  description?: string;
}

export async function askText(opts: {
  message: string;
  default?: string;
  validate?: (v: string) => string | true;
}): Promise<string> {
  return input({
    message: opts.message,
    default: opts.default,
    validate: opts.validate,
  });
}

export async function askSelect<T extends string>(opts: {
  message: string;
  choices: SelectOption<T>[];
  default?: T;
}): Promise<T> {
  return select<T>({
    message: opts.message,
    choices: opts.choices,
    default: opts.default,
  });
}

export async function askMultiSelect<T extends string>(opts: {
  message: string;
  choices: SelectOption<T>[];
  defaults?: T[];
}): Promise<T[]> {
  return checkbox<T>({
    message: opts.message,
    choices: opts.choices.map((c) => ({
      ...c,
      checked: opts.defaults?.includes(c.value),
    })),
  });
}

export async function askConfirm(opts: {
  message: string;
  default?: boolean;
}): Promise<boolean> {
  return confirm({
    message: opts.message,
    default: opts.default ?? true,
  });
}

export function showIntro(version: string): void {
  console.log();
  console.log(chalk.bgCyan.black(" copilot-quickstart ") + chalk.dim(` v${version}`));
  console.log();
}

export function showOutro(msg: string): void {
  console.log();
  console.log(chalk.dim("─".repeat(60)));
  console.log(`  ${msg}`);
  console.log();
}
