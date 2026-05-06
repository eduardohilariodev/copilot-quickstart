/**
 * `validate` command — validate project artifacts.
 *
 * Delegates to the existing validate module (lib/validate.mjs) for now.
 * Will be fully ported to TypeScript in a future pass.
 */

import type { Command } from "commander";
import { resolve, join } from "node:path";
import { LIBRARY_ROOT } from "../core/constants.js";

export function registerValidate(program: Command): void {
  program
    .command("validate")
    .description("Validate project artifacts (skills, templates, naming)")
    .option("--json", "Machine-readable JSON output", false)
    .action(async (opts: { json: boolean }) => {
      // Dynamic import of the existing validate module
      const validatePath = join(LIBRARY_ROOT, "tools", "onboard", "lib", "validate.mjs");
      try {
        const { runValidate } = await import(validatePath);
        const { failed } = await runValidate({ json: opts.json });
        process.exit(failed > 0 ? 1 : 0);
      } catch (err) {
        console.error(`Failed to load validate module: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
