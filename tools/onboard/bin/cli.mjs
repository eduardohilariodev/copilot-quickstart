#!/usr/bin/env node

/**
 * copilot-quickstart CLI v2.0.0
 *
 * Interactive wizard for onboarding repositories into the copilot-quickstart
 * ecosystem. Detects stack, asks targeted questions, stages config files.
 *
 * Commands:
 *   onboard    Full interactive wizard (default)
 *   doctor     Read-only diagnostics and readiness scoring
 *   apply      Move staged files from ai-setup/ to final locations
 *   reset      Remove ai-setup/ staging directory
 *   validate   Validate project artifacts (skills, templates, naming)
 *
 * Flags:
 *   --non-interactive  Skip prompts, use scan defaults (for CI)
 *   --force            Overwrite existing files
 *   --json             Output machine-readable JSON (doctor)
 *   --skills           Include starter skill pack
 *   --help, -h         Show usage
 *
 * Legacy flags (deprecated, still work):
 *   --stage            Alias for: onboard (stages by default now)
 *   --apply            Alias for: apply
 */

import { resolve, join } from "node:path";
import { existsSync, rmSync } from "node:fs";
import pc from "picocolors";
import * as p from "@clack/prompts";
import { VERSION } from "../lib/constants.mjs";
import { scanRepo } from "../lib/detect.mjs";
import { buildProfile, buildArtifactPlan } from "../lib/plan.mjs";
import { stageArtifacts, applyStaged } from "../lib/generate.mjs";
import { stageCapsule } from "../lib/capsule.mjs";
import { runDoctor, formatDoctorOutput, formatDoctorJson } from "../lib/doctor.mjs";
import {
  STAGING_DIR_NAME,
  ARCHITECTURES,
  PROVIDERS,
} from "../lib/constants.mjs";
import { runValidate } from "../lib/validate.mjs";

// ─── Argument Parsing ───────────────────────────────────────────────────────

function parseArgs(argv) {
  const flags = {
    nonInteractive: false,
    force: false,
    json: false,
    skills: false,
    help: false,
    // Legacy
    stage: false,
    apply: false,
  };
  let command = null;
  let target = ".";

  for (const arg of argv.slice(2)) {
    switch (arg) {
      case "onboard":
        command = "onboard";
        break;
      case "doctor":
        command = "doctor";
        break;
      case "apply":
        command = "apply";
        break;
      case "reset":
        command = "reset";
        break;
      case "validate":
        command = "validate";
        break;
      case "--non-interactive":
      case "--ci":
        flags.nonInteractive = true;
        break;
      case "--force":
        flags.force = true;
        break;
      case "--json":
        flags.json = true;
        break;
      case "--skills":
        flags.skills = true;
        break;
      case "--help":
      case "-h":
        flags.help = true;
        break;
      // Legacy flag compat
      case "--stage":
        flags.stage = true;
        if (!command) command = "onboard";
        break;
      case "--apply":
        flags.apply = true;
        if (!command) command = "apply";
        break;
      default:
        if (!arg.startsWith("-") && !command) {
          // Could be target path or command
          if (existsSync(resolve(arg))) {
            target = arg;
          }
        }
        break;
    }
  }

  // Default command
  if (!command) command = "onboard";

  return { command, target: resolve(target), flags };
}

// ─── Help ───────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
${pc.bold("copilot-quickstart")} v${VERSION} — AI-ready repo configuration wizard

${pc.bold("Usage:")}
  copilot-quickstart [command] [target-path] [flags]

${pc.bold("Commands:")}
  onboard     Interactive onboarding wizard ${pc.dim("(default)")}
  doctor      Read-only diagnostics & readiness score
  apply       Move staged files from ai-setup/ to final locations
  reset       Remove ai-setup/ staging directory
  validate    Validate project artifacts (skills, templates, naming)

${pc.bold("Flags:")}
  --non-interactive  Skip prompts, use defaults (for CI/scripting)
  --force            Overwrite existing files during apply
  --skills           Include starter skill pack (15 skills)
  --json             Machine-readable output (doctor command)
  -h, --help         Show this help

${pc.bold("Examples:")}
  ${pc.dim("$")} copilot-quickstart                  ${pc.dim("# Wizard in current dir")}
  ${pc.dim("$")} copilot-quickstart doctor           ${pc.dim("# Check readiness")}
  ${pc.dim("$")} copilot-quickstart doctor --json    ${pc.dim("# CI-friendly score")}
  ${pc.dim("$")} copilot-quickstart apply            ${pc.dim("# Apply staged configs")}
  ${pc.dim("$")} copilot-quickstart apply --force    ${pc.dim("# Overwrite existing")}
  ${pc.dim("$")} copilot-quickstart validate         ${pc.dim("# Run validation checks")}
  ${pc.dim("$")} copilot-quickstart validate --json  ${pc.dim("# Machine-readable validation")}
  ${pc.dim("$")} copilot-quickstart --non-interactive --skills  ${pc.dim("# Full unattended")}
  ${pc.dim("$")} copilot-quickstart /path/to/repo    ${pc.dim("# Target another repo")}
`);
}

// ─── Phase 0: Environment Check ─────────────────────────────────────────────

function checkEnvironment(target) {
  const issues = [];

  if (!existsSync(target)) {
    issues.push(`Target path does not exist: ${target}`);
  }

  if (!existsSync(join(target, ".git"))) {
    issues.push("Not a git repository (no .git directory)");
  }

  return issues;
}

// ─── Wizard: Interactive Onboarding ─────────────────────────────────────────

async function wizardOnboard(target, flags) {
  p.intro(`${pc.bgCyan(pc.black(" copilot-quickstart "))} v${VERSION}`);

  // Phase 0: Environment check
  const envIssues = checkEnvironment(target);
  if (envIssues.length > 0) {
    for (const issue of envIssues) {
      p.log.warn(issue);
    }
    if (!existsSync(target)) {
      p.outro(pc.red("Cannot continue — target path does not exist."));
      process.exit(1);
    }
  }

  // Phase 1: Scan
  const s = p.spinner();
  s.start("Scanning repository...");

  const scan = scanRepo(target);

  s.stop("Scan complete");

  // Display scan results
  p.log.info(
    `${pc.bold("Detected:")}\n` +
      `  Languages:    ${scan.languages.join(", ") || pc.dim("none")}\n` +
      `  Frameworks:   ${scan.frameworks.join(", ") || pc.dim("none")}\n` +
      `  Architecture: ${scan.architecture}\n` +
      `  CI:           ${Object.keys(scan.ci).join(", ") || pc.dim("none")}\n` +
      `  AI configs:   ${Object.keys(scan.existing_configs).length > 0 ? Object.keys(scan.existing_configs).join(", ") : pc.dim("none")}\n` +
      `  Strategy:     ${pc.bold(scan.strategy)}`
  );

  // Phase 2: Profile questions
  let answers = {};

  if (flags.nonInteractive) {
    // Non-interactive: use scan defaults, fail on unknowns if critical
    answers = {
      architecture: scan.architecture,
      risk_level: "medium",
      providers: scan.providers,
      protected_paths: [".env*"],
      naming_style: "standard",
    };
    if (flags.skills) {
      answers.include_skills = true;
    }
  } else {
    // Interactive prompts
    const group = await p.group(
      {
        architecture: () =>
          p.select({
            message: "Architecture",
            options: ARCHITECTURES.map((a) => ({
              value: a,
              label: a,
              hint: a === scan.architecture ? "detected" : undefined,
            })),
            initialValue: scan.architecture,
          }),

        risk_level: () =>
          p.select({
            message:
              "Risk level — controls how conservative AI behavior will be",
            options: [
              {
                value: "low",
                label: "Low",
                hint: "Personal/experimental projects — basic safety rules, auto-commit allowed",
              },
              {
                value: "medium",
                label: "Medium",
                hint: "Team projects, internal tools — full security rules + PR review required",
              },
              {
                value: "high",
                label: "High",
                hint: "Production services, financial — enhanced guardrails, audit, no auto-commit",
              },
              {
                value: "critical",
                label: "Critical",
                hint: "Security/auth infrastructure — maximum restrictions, manual review of all AI changes",
              },
            ],
            initialValue: "medium",
          }),

        providers: () =>
          p.multiselect({
            message: "AI providers to configure",
            options: PROVIDERS.map((prov) => ({
              value: prov,
              label: prov,
              hint: scan.providers.includes(prov) ? "detected" : undefined,
            })),
            initialValues: scan.providers,
            required: true,
          }),

        naming: () =>
          p.text({
            message: "Code naming convention",
            placeholder: "e.g., camelCase functions, PascalCase components",
            defaultValue: "",
          }),

        testing_strategy: () =>
          p.text({
            message: "Testing strategy",
            placeholder: "e.g., unit tests for logic, integration for APIs",
            defaultValue: "",
          }),

        naming_style: () =>
          p.select({
            message: "Naming style for AI artifacts (skills, agents, instructions)",
            options: [
              {
                value: "standard",
                label: "Standard (recommended)",
                hint: "skills: testing-code, agents: coding-refactor",
              },
              {
                value: "functional",
                label: "Functional",
                hint: "skills: code-testing, agents: frontend-review",
              },
            ],
            initialValue: "standard",
          }),
      },
      {
        onCancel: () => {
          p.cancel("Onboarding cancelled.");
          process.exit(0);
        },
      }
    );

    answers = { ...group };
  }

  // Build profile
  const profile = buildProfile(scan, answers);

  // Phase 3: Plan
  const allArtifacts = buildArtifactPlan(scan, profile, null);

  // Determine default selections
  const defaultSelections = allArtifacts
    .filter((a) => {
      if (a.id === "starter-skills") return flags.skills || answers.include_skills;
      return a.action !== "skip";
    })
    .map((a) => a.id);

  let selectedItems;

  if (flags.nonInteractive) {
    selectedItems = defaultSelections;
  } else {
    // Show plan with toggleable items
    selectedItems = await p.multiselect({
      message: `What to generate ${pc.dim(`(staging to ${STAGING_DIR_NAME}/)`)}`,
      options: allArtifacts.map((a) => ({
        value: a.id,
        label: a.label,
        hint: a.action === "propose" ? "exists — will propose update" : a.description,
      })),
      initialValues: defaultSelections,
      required: true,
    });

    if (p.isCancel(selectedItems)) {
      p.cancel("Onboarding cancelled.");
      process.exit(0);
    }
  }

  // Rebuild plan with selections
  const finalArtifacts = buildArtifactPlan(scan, profile, selectedItems);

  // Phase 4: Generate
  s.start("Generating files...");

  // Clean previous staging if exists
  const stagingDir = join(target, STAGING_DIR_NAME);
  if (existsSync(stagingDir)) {
    rmSync(stagingDir, { recursive: true });
  }

  const { written, skipped } = stageArtifacts(target, finalArtifacts, profile, scan);

  // Stage the standards capsule alongside other artifacts
  const stagingDir2 = join(target, STAGING_DIR_NAME);
  const capsuleResult = stageCapsule(stagingDir2, {
    version: VERSION,
    repo: "eduardohilariodev/copilot-quickstart",
    docsBaseUrl: `https://github.com/eduardohilariodev/copilot-quickstart/tree/v${VERSION}/source-of-truth`,
  });
  for (const f of capsuleResult.files) {
    written.push(f);
  }

  s.stop(`Generated ${written.length} files`);

  // Show what was written
  if (written.length > 0) {
    p.log.success(
      `${pc.bold("Staged files:")}\n` +
        written.map((f) => `  ${pc.green("✓")} ${STAGING_DIR_NAME}/${f}`).join("\n")
    );
  }
  if (skipped.length > 0) {
    p.log.info(
      `${pc.bold("Skipped:")}\n` +
        skipped.map((f) => `  ${pc.dim("○")} ${f}`).join("\n")
    );
  }

  // Phase 5: Next steps
  p.note(
    `${pc.bold("1.")} Review staged files:\n` +
      `   ${pc.cyan(`ls ${STAGING_DIR_NAME}/`)}\n\n` +
      `${pc.bold("2.")} Apply when satisfied:\n` +
      `   ${pc.cyan("copilot-quickstart apply")}\n\n` +
      `${pc.bold("3.")} Commit:\n` +
      `   ${pc.cyan('git add -A && git commit -m "chore: add AI configuration"')}\n\n` +
      `${pc.bold("4.")} In Copilot Chat:\n` +
      `   ${pc.dim('"Read AGENTS.md and tell me any remaining gaps"')}`,
    "Next steps"
  );

  p.outro(`Done! Re-run anytime to update. ${pc.dim("copilot-quickstart doctor")} for health checks.`);
}

// ─── Doctor Command ─────────────────────────────────────────────────────────

function commandDoctor(target, flags) {
  const result = runDoctor(target);

  if (flags.json) {
    console.log(formatDoctorJson(result));
    // Exit code based on level
    process.exit(result.level === "basic" ? 1 : 0);
  }

  p.intro(`${pc.bgCyan(pc.black(" copilot-quickstart doctor "))} v${VERSION}`);
  console.log(formatDoctorOutput(result));
  p.outro(
    result.level === "advanced"
      ? pc.green("Looking good! Your repo is well-configured for AI.")
      : result.level === "ready"
        ? pc.yellow("Decent setup. Run onboard to fill remaining gaps.")
        : pc.red("Needs work. Run copilot-quickstart onboard to get started.")
  );

  process.exit(result.level === "basic" ? 1 : 0);
}

// ─── Apply Command ──────────────────────────────────────────────────────────

function commandApply(target, flags) {
  p.intro(`${pc.bgCyan(pc.black(" copilot-quickstart apply "))} v${VERSION}`);

  const { applied, skipped, errors } = applyStaged(target, flags.force);

  if (errors.length > 0) {
    for (const err of errors) {
      p.log.error(err);
    }
    p.outro(pc.red("Apply failed."));
    process.exit(1);
  }

  if (applied.length > 0) {
    p.log.success(
      `${pc.bold("Applied:")}\n` +
        applied.map((f) => `  ${pc.green("✓")} ${f}`).join("\n")
    );
  }

  if (skipped.length > 0) {
    p.log.warn(
      `${pc.bold("Skipped:")}\n` +
        skipped.map((f) => `  ${pc.yellow("⚠")} ${f}`).join("\n")
    );
  }

  if (applied.length === 0 && skipped.length > 0) {
    p.outro(pc.yellow("Nothing new to apply. Use --force to overwrite existing files."));
  } else if (applied.length > 0) {
    p.note(
      `${pc.cyan('git add -A && git commit -m "chore: add AI configuration"')}`,
      "Commit your changes"
    );
    p.outro(pc.green(`Applied ${applied.length} files.`));
  } else {
    p.outro(pc.dim("Nothing to apply."));
  }
}

// ─── Reset Command ──────────────────────────────────────────────────────────

function commandReset(target) {
  const stagingDir = join(target, STAGING_DIR_NAME);

  if (!existsSync(stagingDir)) {
    console.log(pc.dim("  No ai-setup/ directory to remove."));
    return;
  }

  rmSync(stagingDir, { recursive: true });
  console.log(pc.green("  ✓ Removed ai-setup/"));
}

// ─── Validate Command ────────────────────────────────────────────────────────

async function commandValidate(flags) {
  const { failed } = await runValidate({ json: flags.json });
  process.exit(failed > 0 ? 1 : 0);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const { command, target, flags } = parseArgs(process.argv);

  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  // Legacy flag handling with deprecation hints
  if (flags.stage && command === "onboard") {
    // --stage is now the default behavior of onboard; no-op but inform
  }
  if (flags.apply && command !== "apply") {
    // Already routed to apply command
  }

  switch (command) {
    case "onboard":
      await wizardOnboard(target, flags);
      break;
    case "doctor":
      commandDoctor(target, flags);
      break;
    case "apply":
      commandApply(target, flags);
      break;
    case "reset":
      commandReset(target);
      break;
    case "validate":
      await commandValidate(flags);
      break;
    default:
      showHelp();
      break;
  }
}

main().catch((err) => {
  p.log.error(err.message);
  process.exit(1);
});
