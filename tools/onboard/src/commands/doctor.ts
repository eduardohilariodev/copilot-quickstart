/**
 * `doctor` command — read-only diagnostics and readiness scoring.
 */

import type { Command } from "commander";
import { resolve } from "node:path";
import { runDoctor, formatDoctorOutput, formatDoctorJson } from "../core/doctor.js";
import { showIntro, showOutro } from "../ui/prompts.js";
import { VERSION } from "../core/constants.js";
import chalk from "chalk";

interface DoctorOptions {
  target: string;
  json: boolean;
}

export function registerDoctor(program: Command): void {
  program
    .command("doctor")
    .description("Read-only diagnostics & readiness score")
    .option("--target <path>", "Target repository path", ".")
    .option("--json", "Machine-readable JSON output", false)
    .action((opts: DoctorOptions) => {
      const target = resolve(opts.target);
      const result = runDoctor(target);

      if (opts.json) {
        console.log(formatDoctorJson(result));
        process.exit(result.level === "basic" ? 1 : 0);
      }

      showIntro(VERSION);
      console.log(formatDoctorOutput(result));
      showOutro(
        result.level === "advanced"
          ? chalk.green("Looking good! Your repo is well-configured for AI.")
          : result.level === "ready"
            ? chalk.yellow("Decent setup. Run onboard to fill remaining gaps.")
            : chalk.red("Needs work. Run copilot-quickstart onboard to get started.")
      );

      process.exit(result.level === "basic" ? 1 : 0);
    });
}
