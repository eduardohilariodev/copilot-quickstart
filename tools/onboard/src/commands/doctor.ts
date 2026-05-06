/**
 * `doctor` command — read-only diagnostics, readiness scoring, and plan update.
 */

import type { Command } from "commander";
import { resolve } from "node:path";
import { runDoctor, formatDoctorOutput, formatDoctorJson } from "../core/doctor.js";
import { scanRepo } from "../core/repo-detect.js";
import { buildProfile } from "../core/templates.js";
import { generatePlanContent, writePlan } from "../core/plan.js";
import { showIntro, showOutro } from "../ui/prompts.js";
import { VERSION } from "../core/constants.js";
import { logger } from "../ui/logger.js";
import chalk from "chalk";

interface DoctorOptions {
  target: string;
  json: boolean;
  updatePlan: boolean;
}

export function registerDoctor(program: Command): void {
  program
    .command("doctor")
    .description("Read-only diagnostics & readiness score")
    .option("--target <path>", "Target repository path", ".")
    .option("--json", "Machine-readable JSON output", false)
    .option("--no-update-plan", "Skip updating copilot-plan.md", false)
    .action((opts: DoctorOptions) => {
      const target = resolve(opts.target);
      const result = runDoctor(target);

      if (opts.json) {
        console.log(formatDoctorJson(result));
        process.exit(result.level === "basic" ? 1 : 0);
      }

      showIntro(VERSION);
      console.log(formatDoctorOutput(result));

      // Update copilot-plan.md with current findings
      if (opts.updatePlan !== false) {
        const scan = result.scan;
        const profile = buildProfile(scan, {
          architecture: scan.architecture,
          risk_level: "medium",
          providers: scan.providers,
          naming_style: "standard",
        });

        const content = generatePlanContent({
          scan,
          profile,
          artifacts: [],
          doctorResult: result,
        });
        writePlan(target, content);
        logger.success(`${chalk.cyan("copilot-plan.md")} updated with current findings.`);
      }

      showOutro(
        result.level === "advanced"
          ? chalk.green("Looking good! Your repo is well-configured for AI.")
          : result.level === "ready"
            ? chalk.yellow("Decent setup. Run init to fill remaining gaps.")
            : chalk.red("Needs work. Run copilot-quickstart init to get started.")
      );

      process.exit(result.level === "basic" ? 1 : 0);
    });
}
