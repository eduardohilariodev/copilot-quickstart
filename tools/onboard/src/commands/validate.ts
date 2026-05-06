/**
 * `validate` command — validate project artifacts.
 */

import type { Command } from "commander";
import { runValidate } from "../core/validate.js";

export function registerValidate(program: Command): void {
  program
    .command("validate")
    .description("Validate project artifacts (skills, templates, naming)")
    .option("--json", "Machine-readable JSON output", false)
    .action(async (opts: { json: boolean }) => {
      const { failed } = await runValidate({ json: opts.json });
      process.exit(failed > 0 ? 1 : 0);
    });
}
