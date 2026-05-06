/**
 * `plan` command — (re)generate copilot-plan.md without staging files.
 */

import type { Command } from "commander";
import { resolve } from "node:path";
import chalk from "chalk";
import { VERSION } from "../core/constants.js";
import { scanRepo } from "../core/repo-detect.js";
import { buildProfile } from "../core/templates.js";
import { runDoctor } from "../core/doctor.js";
import { generatePlanContent, writePlan, planExists } from "../core/plan.js";
import { showIntro, showOutro } from "../ui/prompts.js";
import { logger } from "../ui/logger.js";

interface PlanOptions {
  target: string;
  withDoctor: boolean;
}

export function registerPlan(program: Command): void {
  program
    .command("plan")
    .description("Generate or update copilot-plan.md")
    .option("--target <path>", "Target repository path", ".")
    .option("--with-doctor", "Include readiness scores in the plan", false)
    .action((opts: PlanOptions) => {
      const target = resolve(opts.target);
      runPlan(target, opts);
    });
}

function runPlan(target: string, opts: PlanOptions): void {
  showIntro(VERSION);

  logger.info("Scanning repo...");
  const scan = scanRepo(target);

  const profile = buildProfile(scan, {
    architecture: scan.architecture,
    risk_level: "medium",
    providers: scan.providers,
    naming_style: "standard",
  });

  const doctorResult = opts.withDoctor ? runDoctor(target) : undefined;

  const content = generatePlanContent({
    scan,
    profile,
    artifacts: [],
    doctorResult,
  });

  const existed = planExists(target);
  writePlan(target, content);

  logger.success(
    existed
      ? `Updated ${chalk.cyan("copilot-plan.md")}`
      : `Created ${chalk.cyan("copilot-plan.md")}`
  );

  showOutro(`Paste in Copilot Chat: ${chalk.dim('"Read copilot-plan.md and help me fix the top issue."')}`);
}
