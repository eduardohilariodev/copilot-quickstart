/**
 * Plan generator — renders copilot-plan.md from scan results, profile, and artifacts.
 * This is the primary output of the CLI: a human-readable assessment AND Copilot-ready prompt.
 */

import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import type { ScanResult } from "./repo-detect.js";
import type { Profile, Artifact } from "./templates.js";
import type { DoctorResult } from "./doctor.js";
import { VERSION } from "./constants.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlanContext {
  scan: ScanResult;
  profile: Profile;
  artifacts: Artifact[];
  doctorResult?: DoctorResult;
}

export interface Gap {
  area: string;
  gap: string;
  action: string;
}

// ─── Gap Detection ──────────────────────────────────────────────────────────

function detectGaps(scan: ScanResult, profile: Profile): Gap[] {
  const gaps: Gap[] = [];

  if (!scan.build_commands.test) {
    gaps.push({
      area: "Testing",
      gap: "No test command detected",
      action: 'Ask: "Use test-generate to scaffold tests for this project"',
    });
  }

  if (!scan.build_commands.lint) {
    gaps.push({
      area: "Code quality",
      gap: "No linter configured",
      action: "Add ESLint, Biome, or equivalent and configure lint command",
    });
  }

  if (Object.keys(scan.ci).length === 0) {
    gaps.push({
      area: "CI/CD",
      gap: "No CI workflows detected",
      action: 'Ask: "Use ci-starter to create a GitHub Actions workflow"',
    });
  } else if (!scan.build_commands.test) {
    gaps.push({
      area: "CI/CD",
      gap: "CI exists but no test step",
      action: 'Ask: "Use ci-health to audit your CI workflow"',
    });
  }

  const configs = scan.existing_configs as Record<string, unknown>;
  if (!configs.agents_md) {
    gaps.push({
      area: "Docs",
      gap: "No AGENTS.md for AI context",
      action: "The init wizard will generate one for you",
    });
  }

  if (!configs.copilot_instructions) {
    gaps.push({
      area: "Config",
      gap: "No .github/copilot-instructions.md",
      action: "The init wizard will generate one for you",
    });
  }

  if (scan.deployment.length === 0) {
    gaps.push({
      area: "Deployment",
      gap: "No deployment configuration detected",
      action: 'Ask: "Use deploy-guide to document our deployment process"',
    });
  }

  return gaps;
}

// ─── Renderer ───────────────────────────────────────────────────────────────

function renderSkillList(artifacts: Artifact[]): string[] {
  const lines: string[] = [];

  const skillArtifacts = artifacts.filter((a) => a.category === "skills");
  if (skillArtifacts.length > 0) {
    lines.push("- **Skills installed:** " + skillArtifacts.map((a) => a.label).join(", "));
  }

  const coreArtifacts = artifacts.filter((a) => a.category === "core");
  if (coreArtifacts.length > 0) {
    lines.push("- **Core configs:** " + coreArtifacts.map((a) => a.label).join(", "));
  }

  const agentArtifacts = artifacts.filter((a) => a.category === "agents");
  if (agentArtifacts.length > 0) {
    lines.push("- **Agent definitions:** " + agentArtifacts.map((a) => a.label).join(", "));
  }

  return lines;
}

function renderBundleDescriptions(profile: Profile): string[] {
  const lines: string[] = [];
  lines.push("- **Git skills:** conventional commits, branch naming, PRs, cleanup");
  lines.push("- **Planning:** structured approach before code changes");
  lines.push("- **Code review:** self-review before committing");

  if (profile.build_commands.test) {
    lines.push("- **Testing:** generate tests, diagnose failures (matched your test framework)");
  }

  if (profile.frameworks?.length > 0) {
    lines.push(`- **Framework-aware:** configured for ${profile.frameworks.join(", ")}`);
  }

  return lines;
}

export function generatePlanContent(ctx: PlanContext): string {
  const { scan, profile, artifacts } = ctx;
  const gaps = ctx.doctorResult ? doctorGaps(ctx.doctorResult) : detectGaps(scan, profile);
  const repoName = profile.name || scan.target.split(/[\\/]/).pop() || "repo";
  const date = new Date().toISOString().split("T")[0];

  const lines: string[] = [];

  lines.push(`# Copilot Plan — ${repoName}`);
  lines.push("");
  lines.push(`Generated: ${date} | Framework: v${VERSION} | Strategy: ${scan.strategy}`);
  lines.push("");

  // Section 1: What I found
  lines.push("## What I found");
  lines.push("");
  lines.push(`- **Languages:** ${scan.languages.join(", ") || "none detected"}`);
  lines.push(`- **Frameworks:** ${scan.frameworks.join(", ") || "none detected"}`);
  lines.push(`- **Architecture:** ${profile.architecture}`);
  lines.push(`- **CI:** ${Object.keys(scan.ci).join(", ") || "none"}`);
  lines.push(`- **Deployment:** ${scan.deployment.join(", ") || "none detected"}`);
  lines.push(`- **Existing AI config:** ${Object.keys(scan.existing_configs).length > 0 ? Object.keys(scan.existing_configs).join(", ") : "none"}`);
  if (scan.monorepo) {
    lines.push(`- **Monorepo:** ${scan.monorepo.tool} (${scan.monorepo.packages.length} packages)`);
  }
  lines.push("");

  // Section 2: What this setup gives you
  lines.push("## What this setup gives you");
  lines.push("");
  lines.push(...renderBundleDescriptions(profile));
  lines.push(...renderSkillList(artifacts));
  lines.push("");

  // Section 3: Gaps identified
  lines.push("## Gaps identified");
  lines.push("");
  if (gaps.length === 0) {
    lines.push("No significant gaps detected. Your repo is well-configured.");
  } else {
    lines.push("| Area | Gap | Suggested action |");
    lines.push("|------|-----|-----------------|");
    for (const gap of gaps) {
      lines.push(`| ${gap.area} | ${gap.gap} | ${gap.action} |`);
    }
  }
  lines.push("");

  // Section 4: How to use with Copilot
  lines.push("## How to use with Copilot");
  lines.push("");
  lines.push("Copy and paste to start:");
  lines.push("");
  lines.push('> "Read .framework/standards.md and this plan. Work through the gaps');
  lines.push('>  starting with testing. Use the skills in .github/skills/ for each step."');
  lines.push("");

  if (gaps.length > 0) {
    lines.push("Or start with a specific gap:");
    lines.push("");
    const firstGap = gaps[0]!;
    lines.push(`> "${firstGap.action.replace(/^Ask: "?|"$/g, "")}"`);
    lines.push("");
  }

  // Section 5: Doctor scores (if available)
  if (ctx.doctorResult) {
    const { scores, level } = ctx.doctorResult;
    lines.push("## Readiness scores");
    lines.push("");
    lines.push(`| Dimension | Score |`);
    lines.push(`|-----------|-------|`);
    lines.push(`| Context & Docs | ${scores.context}/10 |`);
    lines.push(`| Verification | ${scores.verification}/10 |`);
    lines.push(`| Config Hygiene | ${scores.config_hygiene}/10 |`);
    lines.push(`| Safety | ${scores.safety}/10 |`);
    lines.push(`| **Overall** | **${scores.overall}/10** (${level}) |`);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Doctor-based gaps ──────────────────────────────────────────────────────

function doctorGaps(result: DoctorResult): Gap[] {
  const gaps: Gap[] = [];

  for (const finding of result.findings) {
    if (finding.includes("AGENTS.md")) {
      gaps.push({ area: "Docs", gap: finding, action: "Run copilot-quickstart init to generate AGENTS.md" });
    } else if (finding.includes("copilot-instructions")) {
      gaps.push({ area: "Config", gap: finding, action: "Run copilot-quickstart init to generate instructions" });
    } else if (finding.includes("test")) {
      gaps.push({ area: "Testing", gap: finding, action: 'Ask: "Use test-generate to scaffold tests"' });
    } else if (finding.includes("lint")) {
      gaps.push({ area: "Code quality", gap: finding, action: "Add a linter to your project" });
    } else if (finding.includes("CI") || finding.includes("workflow")) {
      gaps.push({ area: "CI/CD", gap: finding, action: 'Ask: "Use ci-health to audit CI workflows"' });
    } else if (finding.includes("build")) {
      gaps.push({ area: "Build", gap: finding, action: "Ensure build commands are in package.json scripts" });
    } else {
      gaps.push({ area: "Config", gap: finding, action: "Review and fix this configuration issue" });
    }
  }

  return gaps;
}

// ─── File I/O ───────────────────────────────────────────────────────────────

export function writePlan(target: string, content: string): string {
  const planPath = join(target, "copilot-plan.md");
  writeFileSync(planPath, content, "utf8");
  return planPath;
}

export function planExists(target: string): boolean {
  return existsSync(join(target, "copilot-plan.md"));
}
