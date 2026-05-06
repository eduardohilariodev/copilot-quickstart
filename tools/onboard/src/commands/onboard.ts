/**
 * `onboard` command — the main interactive onboarding wizard.
 */

import type { Command } from "commander";
import { resolve, join } from "node:path";
import { existsSync, rmSync } from "node:fs";
import chalk from "chalk";
import { VERSION, STAGING_DIR_NAME, ARCHITECTURES, PROVIDERS, SKILL_RECOMMENDATIONS } from "../core/constants.js";
import { scanRepo, type ScanResult } from "../core/repo-detect.js";
import { buildProfile, buildArtifactPlan, type Artifact } from "../core/templates.js";
import { stageArtifacts } from "../core/generate.js";
import { askSelect, askMultiSelect, askConfirm, askText, showIntro, showOutro } from "../ui/prompts.js";
import { logger } from "../ui/logger.js";
import { EnvironmentError } from "../errors.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function checkEnvironment(target: string): string[] {
  const issues: string[] = [];
  if (!existsSync(target)) issues.push(`Target path does not exist: ${target}`);
  if (!existsSync(join(target, ".git"))) issues.push("Not a git repository (no .git directory)");
  return issues;
}

function getRecommendedSkills(scan: ScanResult): Set<string> {
  const recommended = new Set<string>();
  for (const s of SKILL_RECOMMENDATIONS.general ?? []) recommended.add(s);
  for (const s of SKILL_RECOMMENDATIONS.onboarding ?? []) recommended.add(s);
  for (const s of SKILL_RECOMMENDATIONS.git ?? []) recommended.add(s);
  if (scan.ci && Object.keys(scan.ci).length > 0) {
    for (const s of SKILL_RECOMMENDATIONS.ci ?? []) recommended.add(s);
  }
  const testFrameworks = ["vitest", "jest", "mocha", "playwright", "cypress"];
  if (scan.frameworks?.some((f: string) => testFrameworks.includes(f))) {
    for (const s of SKILL_RECOMMENDATIONS.testing ?? []) recommended.add(s);
  }
  if (scan.deployment?.length > 0) {
    for (const s of SKILL_RECOMMENDATIONS.deployment ?? []) recommended.add(s);
  }
  return recommended;
}

function buildArtifactHint(artifact: Artifact, _recommended: Set<string>): string {
  if (artifact.action === "propose") return "exists — will propose update";
  if (artifact.category === "skills") return `${artifact.description} ★ matched your stack`;
  return artifact.description;
}

// ─── Command Registration ───────────────────────────────────────────────────

interface OnboardOptions {
  target: string;
  nonInteractive: boolean;
  force: boolean;
  skills: boolean;
}

export function registerOnboard(program: Command): void {
  program
    .command("onboard")
    .description("Full interactive onboarding wizard")
    .option("--target <path>", "Target repository path", ".")
    .option("--non-interactive", "Skip prompts, use scan defaults", false)
    .option("--force", "Overwrite existing files", false)
    .option("--skills", "Include starter skill pack", false)
    .action(async (opts: OnboardOptions) => {
      const target = resolve(opts.target);
      await runOnboard(target, opts);
    });
}

// ─── Implementation ─────────────────────────────────────────────────────────

async function runOnboard(target: string, opts: OnboardOptions): Promise<void> {
  showIntro(VERSION);

  // Phase 0: Environment check
  const issues = checkEnvironment(target);
  if (issues.length > 0) {
    for (const issue of issues) logger.warn(issue);
    if (!existsSync(target)) throw new EnvironmentError("Cannot continue — target path does not exist.");
  }

  // Phase 1: Scan
  logger.info("Scanning repository...");
  const scan = scanRepo(target);
  logger.success("Scan complete");
  logger.blank();

  logger.info(
    `${chalk.bold("Detected:")}\n` +
    `  Languages:    ${scan.languages.join(", ") || chalk.dim("none")}\n` +
    `  Frameworks:   ${scan.frameworks.join(", ") || chalk.dim("none")}\n` +
    `  Architecture: ${scan.architecture}\n` +
    `  CI:           ${Object.keys(scan.ci).join(", ") || chalk.dim("none")}\n` +
    `  AI configs:   ${Object.keys(scan.existing_configs).length > 0 ? Object.keys(scan.existing_configs).join(", ") : chalk.dim("none")}\n` +
    `  Strategy:     ${chalk.bold(scan.strategy)}`
  );
  logger.blank();

  // Phase 2: Profile questions
  let answers: Record<string, unknown> = {};

  if (opts.nonInteractive) {
    answers = {
      architecture: scan.architecture,
      risk_level: "medium",
      providers: scan.providers,
      protected_paths: [".env*"],
      naming_style: "standard",
      ...(opts.skills ? { include_skills: true } : {}),
    };
  } else {
    const architecture = await askSelect({
      message: "Architecture",
      choices: [
        ...ARCHITECTURES.map((a) => ({
          value: a,
          name: a,
          description: a === scan.architecture ? "detected" : undefined,
        })),
        { value: "other" as const, name: "Other", description: "type your own" },
      ],
      default: scan.architecture,
    });

    let architecture_custom: string | undefined;
    if (architecture === "other") {
      architecture_custom = await askText({
        message: "Describe your architecture",
        validate: (v) => (!v?.trim() ? "Please enter an architecture" : true),
      });
    }

    const risk_level = await askSelect({
      message: "Risk level — controls how conservative AI behavior will be",
      choices: [
        { value: "low", name: "Low", description: "Personal/experimental — basic safety, auto-commit allowed" },
        { value: "medium", name: "Medium", description: "Team projects — full security + PR review required" },
        { value: "high", name: "High", description: "Production — enhanced guardrails, no auto-commit" },
        { value: "critical", name: "Critical", description: "Security infra — maximum restrictions, manual review" },
      ],
      default: "medium",
    });

    const providers = await askMultiSelect({
      message: "AI providers to configure",
      choices: PROVIDERS.map((p) => ({
        value: p,
        name: p,
        description: scan.providers.includes(p) ? "detected" : undefined,
      })),
      defaults: scan.providers,
    });

    const naming_style = await askSelect({
      message: "How should Copilot files be named?",
      choices: [
        { value: "standard", name: "Standard (recommended)", description: "verb-ing-domain" },
        { value: "functional", name: "Functional", description: "domain-verb" },
        { value: "other", name: "Other (custom)", description: "type your own pattern" },
      ],
      default: "standard",
    });

    let naming_style_custom: string | undefined;
    if (naming_style === "other") {
      naming_style_custom = await askText({
        message: "Describe your naming pattern for AI artifacts",
        validate: (v) => (!v?.trim() ? "Please enter a naming pattern" : true),
      });
    }

    answers = { architecture, architecture_custom, risk_level, providers, naming_style, naming_style_custom };
  }

  // Build profile
  const profile = buildProfile(scan, answers);

  // Phase 3: Plan
  const allArtifacts = buildArtifactPlan(scan, profile, null);

  const defaultSelections = allArtifacts
    .filter((a) => {
      if (a.id === "starter-skills" || a.id === "starter-agents") return opts.skills || Boolean(answers.include_skills);
      if (a.id === "maintenance-skills") return true;
      return a.action !== "skip";
    })
    .map((a) => a.id);

  let selectedItems: string[];

  if (opts.nonInteractive) {
    selectedItems = defaultSelections;
  } else {
    const recommended = getRecommendedSkills(scan);
    selectedItems = await askMultiSelect({
      message: `What to generate ${chalk.dim(`(staging to ${STAGING_DIR_NAME}/)`)}`,
      choices: allArtifacts.map((a) => ({
        value: a.id,
        name: a.label,
        description: buildArtifactHint(a, recommended),
      })),
      defaults: defaultSelections,
    });
  }

  // Rebuild plan with selections
  const finalArtifacts = buildArtifactPlan(scan, profile, selectedItems);

  // Phase 4: Generate
  logger.info("Generating files...");

  const stagingDir = join(target, STAGING_DIR_NAME);
  if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true });

  const { written, skipped } = stageArtifacts(target, finalArtifacts, profile, scan);

  logger.success(`Generated ${written.length} files`);
  logger.blank();

  if (written.length > 0) {
    logger.info(chalk.bold("Staged files:"));
    logger.list(written.map((f) => `${chalk.green("✓")} ${STAGING_DIR_NAME}/${f}`));
  }
  if (skipped.length > 0) {
    logger.info(chalk.bold("Skipped:"));
    logger.list(skipped.map((f) => `${chalk.dim("○")} ${f}`));
  }

  // Phase 5: Next steps
  logger.blank();
  logger.header("Next steps");
  logger.info(`1. Review staged files: ${chalk.cyan(`ls ${STAGING_DIR_NAME}/`)}`);
  logger.info(`2. Apply when satisfied: ${chalk.cyan("copilot-quickstart apply")}`);
  logger.info(`3. Commit: ${chalk.cyan('git add -A && git commit -m "chore: add AI configuration"')}`);
  logger.info(`4. In Copilot Chat: ${chalk.dim('"Read AGENTS.md and tell me any remaining gaps"')}`);

  showOutro(`Done! Re-run anytime to update. ${chalk.dim("copilot-quickstart doctor")} for health checks.`);
}
