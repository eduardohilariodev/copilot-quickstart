/**
 * `init` command — streamlined first-time setup.
 * Scan → 2 questions → stage + plan → 2 next steps.
 */

import type { Command } from "commander";
import { resolve, join } from "node:path";
import { existsSync, rmSync } from "node:fs";
import chalk from "chalk";
import { VERSION, STAGING_DIR_NAME, SKILL_RECOMMENDATIONS } from "../core/constants.js";
import { scanRepo, type ScanResult } from "../core/repo-detect.js";
import { buildProfile, buildArtifactPlan } from "../core/templates.js";
import { stageArtifacts } from "../core/generate.js";
import { stageCapsule } from "../core/capsule.js";
import { generatePlanContent, writePlan } from "../core/plan.js";
import { askSelect, askMultiSelect, showIntro, showOutro } from "../ui/prompts.js";
import { logger } from "../ui/logger.js";
import { EnvironmentError } from "../errors.js";

// ─── Types ──────────────────────────────────────────────────────────────────

type BehaviorMode = "ask" | "try" | "careful";

interface WorkflowBundle {
  id: string;
  name: string;
  description: string;
  skills: string[];
  alwaysOn?: boolean;
}

interface InitOptions {
  target: string;
  nonInteractive: boolean;
  force: boolean;
  providers: string;
  advanced: boolean;
}

// ─── Bundle Definitions ─────────────────────────────────────────────────────

const WORKFLOW_BUNDLES: WorkflowBundle[] = [
  {
    id: "git",
    name: "Git",
    description: "commits, branches, PRs, cleanup",
    skills: [...(SKILL_RECOMMENDATIONS.git ?? [])],
    alwaysOn: true,
  },
  {
    id: "code-quality",
    name: "Code quality",
    description: "planning, refactoring, self-review",
    skills: ["plan-change", "safe-refactor", "context-pick", "review-self"],
  },
  {
    id: "testing",
    name: "Testing",
    description: "generate tests, diagnose failures",
    skills: [...(SKILL_RECOMMENDATIONS.testing ?? [])],
  },
  {
    id: "docs",
    name: "Docs",
    description: "write docs, README, ADRs, changelogs",
    skills: [...(SKILL_RECOMMENDATIONS.docs ?? [])],
  },
  {
    id: "ci-ops",
    name: "CI/CD",
    description: "starter workflows, health checks",
    skills: [...(SKILL_RECOMMENDATIONS["ci-ops"] ?? [])],
  },
];

// ─── Behavior → Risk Mapping ────────────────────────────────────────────────

function behaviorToRisk(mode: BehaviorMode): string {
  switch (mode) {
    case "ask": return "medium";
    case "try": return "low";
    case "careful": return "high";
  }
}

// ─── Command Registration ───────────────────────────────────────────────────

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("Set up Copilot for this repository")
    .option("--target <path>", "Target repository path", ".")
    .option("--non-interactive", "Skip prompts, use defaults", false)
    .option("--force", "Overwrite existing staging", false)
    .option("--providers <list>", "Comma-separated providers (copilot,claude,cursor)", "copilot")
    .option("--advanced", "Show additional configuration options", false)
    .action(async (opts: InitOptions) => {
      const target = resolve(opts.target);
      await runInit(target, opts);
    });
}

// ─── Implementation ─────────────────────────────────────────────────────────

async function runInit(target: string, opts: InitOptions): Promise<void> {
  showIntro(VERSION);

  // Phase 0: Silent environment check
  if (!existsSync(target)) {
    throw new EnvironmentError(`Target path does not exist: ${target}`);
  }
  if (!existsSync(join(target, ".git"))) {
    throw new EnvironmentError("Not a git repository (no .git directory).");
  }

  // Phase 1: Scan (progress indicator, no questions)
  logger.info("Scanning repo...");
  const scan = scanRepo(target);
  logger.blank();

  console.log(
    `  ${chalk.bold("Languages:")}    ${scan.languages.join(", ") || chalk.dim("none")}\n` +
    `  ${chalk.bold("Frameworks:")}   ${scan.frameworks.join(", ") || chalk.dim("none")}\n` +
    `  ${chalk.bold("CI:")}            ${Object.keys(scan.ci).join(", ") || chalk.dim("none")}\n` +
    `  ${chalk.bold("AI config:")}     ${Object.keys(scan.existing_configs).length > 0 ? Object.keys(scan.existing_configs).join(", ") : chalk.dim("none")}`
  );
  logger.blank();

  // Phase 2: Two questions (or defaults for non-interactive)
  let behaviorMode: BehaviorMode = "ask";
  let selectedBundles: string[] = WORKFLOW_BUNDLES.map((b) => b.id);

  if (!opts.nonInteractive) {
    // Question 1: Behavior mode
    behaviorMode = await askSelect<BehaviorMode>({
      message: "How should Copilot behave when it's unsure?",
      choices: [
        { value: "ask", name: "Ask me", description: "stops and checks before anything significant" },
        { value: "try", name: "Try it", description: "makes reasonable attempts, tells you what it did" },
        { value: "careful", name: "Careful", description: "always asks, never auto-commits, flags protected files" },
      ],
      default: "ask",
    });

    // Question 2: Workflow bundles
    selectedBundles = await askMultiSelect({
      message: "What workflows do you want Copilot to help with?",
      choices: WORKFLOW_BUNDLES.map((b) => ({
        value: b.id,
        name: `${b.name} — ${b.description}`,
        description: b.alwaysOn ? "always on" : undefined,
      })),
      defaults: WORKFLOW_BUNDLES.map((b) => b.id),
    });

    // Ensure git is always included
    if (!selectedBundles.includes("git")) {
      selectedBundles.unshift("git");
    }
  }

  // Build profile from answers
  const providers = opts.providers.split(",").map((p) => p.trim()).filter(Boolean);
  const profile = buildProfile(scan, {
    architecture: scan.architecture,
    risk_level: behaviorToRisk(behaviorMode),
    providers,
    naming_style: "standard",
  });

  // Determine which artifact IDs to include based on bundles
  const selectedArtifactIds = resolveArtifactIds(scan, selectedBundles);

  // Phase 3: Generate + stage (combined)
  logger.info("Generating your Copilot setup...");
  logger.blank();

  const stagingDir = join(target, STAGING_DIR_NAME);
  if (existsSync(stagingDir)) {
    if (!opts.force) {
      logger.warn(`${STAGING_DIR_NAME}/ already exists. Use --force to overwrite.`);
      logger.hint(`Or run: ${chalk.cyan("copilot-quickstart reset")}`);
      return;
    }
    rmSync(stagingDir, { recursive: true });
  }

  const finalArtifacts = buildArtifactPlan(scan, profile, selectedArtifactIds);
  const { written, skipped } = stageArtifacts(target, finalArtifacts, profile, scan);

  // Stage the framework capsule
  const capsuleResult = stageCapsule(stagingDir, {
    version: VERSION,
    repo: "eduardohilariodev/copilot-quickstart",
    docsBaseUrl: `https://github.com/eduardohilariodev/copilot-quickstart/tree/v${VERSION}/source-of-truth`,
  });
  for (const f of capsuleResult.files) written.push(f);

  // Generate copilot-plan.md
  const planContent = generatePlanContent({ scan, profile, artifacts: finalArtifacts });
  const planPath = writePlan(target, planContent);

  // Show results
  for (const f of written) {
    console.log(`  ${chalk.green("✓")} ${STAGING_DIR_NAME}/${f}`);
  }
  console.log(`  ${chalk.green("✓")} copilot-plan.md`);
  logger.blank();

  logger.success(`Staged to ${chalk.cyan(STAGING_DIR_NAME + "/")} — nothing applied yet.`);

  // Phase 4: Two concrete next steps
  logger.blank();
  logger.header("Done. Two steps to activate:");
  logger.blank();
  console.log(`  ${chalk.bold("1.")} Apply files:`);
  console.log(`     ${chalk.cyan("copilot-quickstart apply")}`);
  logger.blank();
  console.log(`  ${chalk.bold("2.")} Open Copilot Chat and paste this:`);
  logger.blank();
  console.log(`     ${chalk.dim('"Read copilot-plan.md and tell me the first thing to improve."')}`);
  logger.blank();
  console.log(`  That's it. Copilot will take it from there.`);

  showOutro(`Re-run anytime. ${chalk.dim("copilot-quickstart doctor")} for health checks.`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveArtifactIds(scan: ScanResult, bundles: string[]): string[] {
  const ids = new Set<string>();

  // Always include core artifacts
  ids.add("repo-profile");
  ids.add("agents-md");
  ids.add("copilot-instructions");
  ids.add("vscode-settings");

  // Include skills and agents if any workflow bundle is selected
  if (bundles.length > 0) {
    ids.add("starter-skills");
    ids.add("starter-agents");
    ids.add("maintenance-skills");
  }

  return [...ids];
}
