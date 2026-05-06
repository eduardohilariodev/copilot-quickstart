/**
 * Template planning — takes scan results + user answers and produces an artifact plan.
 */

import type { ScanResult } from "./repo-detect.js";
import { STAGING_DIR_NAME } from "./constants.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Profile {
  name: string;
  description: string;
  languages: string[];
  frameworks: string[];
  build_commands: Record<string, string>;
  architecture: string;
  risk_level: string;
  protected_paths: string[];
  providers: string[];
  naming: { skills_pattern: string; agents_pattern: string; instructions_pattern: string };
  monorepo?: { tool: string; packages: string[] };
}

export interface Artifact {
  id: string;
  label: string;
  description: string;
  stagePath: string;
  targetPath: string;
  category: string;
  action: string;
  isDirectory?: boolean;
  templateSource?: string;
}

export interface Answers {
  name?: string;
  description?: string;
  architecture?: string;
  architecture_custom?: string;
  risk_level?: string;
  protected_paths?: string[];
  providers?: string[];
  naming_style?: string;
  naming_style_custom?: string;
  include_skills?: boolean;
}

export interface Manifest {
  version: string;
  generated_at: string;
  strategy: string;
  profile_hash: string;
  repo_target: string;
  artifacts: Pick<Artifact, "id" | "stagePath" | "targetPath" | "action" | "category">[];
}

// ─── Profile Builder ────────────────────────────────────────────────────────

export function buildProfile(scan: ScanResult, answers: Answers): Profile {
  const repoName = answers.name || `<owner>/${scan.target.split(/[\\/]/).pop()}`;

  const namingStyle = answers.naming_style || "standard";
  let naming: Profile["naming"];
  if (namingStyle === "other") {
    const custom = answers.naming_style_custom || "custom";
    naming = { skills_pattern: custom, agents_pattern: custom, instructions_pattern: custom };
  } else if (namingStyle === "functional") {
    naming = {
      skills_pattern: "domain-verb",
      agents_pattern: "domain-role",
      instructions_pattern: "tech-domain-focus",
    };
  } else {
    naming = {
      skills_pattern: "verb-ing-domain",
      agents_pattern: "role-scope",
      instructions_pattern: "topic",
    };
  }

  const architecture =
    answers.architecture === "other"
      ? answers.architecture_custom || "custom"
      : answers.architecture || scan.architecture;

  return {
    name: repoName,
    description: answers.description || "<project description>",
    languages: scan.languages,
    frameworks: scan.frameworks,
    build_commands: scan.build_commands,
    architecture,
    risk_level: answers.risk_level || "medium",
    protected_paths: answers.protected_paths || buildProtectedPaths(scan),
    providers: answers.providers || scan.providers,
    naming,
    ...(scan.monorepo ? { monorepo: scan.monorepo } : {}),
  };
}

function buildProtectedPaths(scan: ScanResult): string[] {
  const paths = [".env*"];
  if (scan.frameworks?.includes("prisma")) paths.push("prisma/migrations/");
  return paths;
}

// ─── Artifact Plan ──────────────────────────────────────────────────────────

export function buildArtifactPlan(
  scan: ScanResult,
  profile: Profile,
  selectedItems: string[] | null,
): Artifact[] {
  const artifacts: Artifact[] = [];
  const configs = scan.existing_configs as Record<string, unknown>;

  if (shouldInclude("repo-profile", scan, selectedItems)) {
    artifacts.push({
      id: "repo-profile",
      label: "repo-profile.yml",
      description: "Repository profile (input for all meta-skills)",
      stagePath: "repo-profile.yml",
      targetPath: "repo-profile.yml",
      category: "core",
      action: scan.has_existing_profile ? "update" : "create",
    });
  }

  if (shouldInclude("agents-md", scan, selectedItems)) {
    artifacts.push({
      id: "agents-md",
      label: "AGENTS.md",
      description: "Agent context document (architecture, commands, conventions)",
      stagePath: "AGENTS.md",
      targetPath: "AGENTS.md",
      category: "core",
      action: configs.agents_md ? "propose" : "create",
    });
  }

  if (shouldInclude("copilot-instructions", scan, selectedItems)) {
    artifacts.push({
      id: "copilot-instructions",
      label: ".github/copilot-instructions.md",
      description: "Repo-wide Copilot behavior rules",
      stagePath: ".github/copilot-instructions.md",
      targetPath: ".github/copilot-instructions.md",
      category: "instructions",
      action: configs.copilot_instructions ? "propose" : "create",
    });
  }

  for (const instr of getInstructionCandidates(scan, profile)) {
    if (shouldInclude(instr.id, scan, selectedItems)) {
      artifacts.push({
        id: instr.id,
        label: `.github/instructions/${instr.filename}`,
        description: instr.description,
        stagePath: `.github/instructions/${instr.filename}`,
        targetPath: `.github/instructions/${instr.filename}`,
        category: "instructions",
        action: "create",
        templateSource: instr.templateFile,
      });
    }
  }

  if (shouldInclude("vscode-settings", scan, selectedItems)) {
    artifacts.push({
      id: "vscode-settings",
      label: ".vscode/settings.json (instruction discovery)",
      description: "Enable Copilot Chat to find path-specific instructions",
      stagePath: ".vscode/settings.json",
      targetPath: ".vscode/settings.json",
      category: "ide",
      action: configs.vscode_instruction_discovery ? "skip" : "create",
    });
  }

  if (shouldInclude("starter-skills", scan, selectedItems)) {
    artifacts.push({
      id: "starter-skills",
      label: ".github/skills/ (15 starter skills)",
      description: "Generic skill pack: git, testing, CI, planning, ops",
      stagePath: ".github/skills/",
      targetPath: ".github/skills/",
      category: "skills",
      action: "create",
      isDirectory: true,
    });
  }

  if (shouldInclude("starter-agents", scan, selectedItems)) {
    artifacts.push({
      id: "starter-agents",
      label: "agents/ (5 starter agent definitions)",
      description: "Agent role definitions: onboard, refactor, review, deploy, test",
      stagePath: "agents/",
      targetPath: "agents/",
      category: "agents",
      action: "create",
      isDirectory: true,
    });
  }

  if (shouldInclude("maintenance-skills", scan, selectedItems)) {
    artifacts.push({
      id: "maintenance-skills",
      label: ".github/skills/ (5 maintenance skills)",
      description: "Self-maintenance: detect-drift, health-dashboard, audit, lint, sync",
      stagePath: ".github/skills/",
      targetPath: ".github/skills/",
      category: "skills",
      action: "create",
      isDirectory: true,
    });
  }

  return artifacts;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface InstructionCandidate {
  id: string;
  filename: string;
  description: string;
  templateFile: string;
}

function getInstructionCandidates(scan: ScanResult, profile: Profile): InstructionCandidate[] {
  const candidates: InstructionCandidate[] = [];
  const langs = scan.languages || [];
  const frameworks = scan.frameworks || [];
  const arch = profile.architecture || scan.architecture;

  if (langs.includes("typescript") || langs.includes("javascript")) {
    candidates.push({
      id: "instr-typescript",
      filename: "typescript.instructions.md",
      description: "TypeScript/JavaScript conventions",
      templateFile: "typescript.instructions.md",
    });
  }

  const hasFrontend =
    frameworks.some((f) => ["react", "nextjs", "vue", "angular", "svelte", "sveltekit"].includes(f)) ||
    (arch === "monorepo" &&
      scan.monorepo?.packages?.some((p) => p.includes("web") || p.includes("ui")));
  if (hasFrontend) {
    candidates.push({
      id: "instr-frontend",
      filename: "frontend.instructions.md",
      description: "Frontend/UI component conventions",
      templateFile: "frontend.instructions.md",
    });
  }

  const hasBackend =
    frameworks.some((f) =>
      ["express", "fastify", "nestjs", "django", "fastapi", "flask", "gin", "fiber"].includes(f),
    ) ||
    (arch === "monorepo" &&
      scan.monorepo?.packages?.some((p) => p.includes("api") || p.includes("server")));
  if (hasBackend) {
    candidates.push({
      id: "instr-backend",
      filename: "backend.instructions.md",
      description: "Backend/API conventions",
      templateFile: "backend.instructions.md",
    });
  }

  if (frameworks.some((f) => ["vitest", "jest", "mocha", "pytest", "playwright", "cypress"].includes(f))) {
    candidates.push({
      id: "instr-tests",
      filename: "tests.instructions.md",
      description: "Testing conventions and patterns",
      templateFile: "tests.instructions.md",
    });
  }

  if (Object.keys(scan.ci).length > 0 || frameworks.includes("terraform")) {
    candidates.push({
      id: "instr-infra",
      filename: "infra.instructions.md",
      description: "Infrastructure and CI/CD rules",
      templateFile: "infra.instructions.md",
    });
  }

  return candidates;
}

function shouldInclude(id: string, scan: ScanResult, selectedItems: string[] | null): boolean {
  if (selectedItems && selectedItems.length > 0) return selectedItems.includes(id);
  if (scan.strategy === "greenfield") return true;
  if (id === "starter-skills") return false;
  return true;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function buildManifest(artifacts: Artifact[], profile: Profile, scan: ScanResult): Manifest {
  return {
    version: "3.0.0",
    generated_at: new Date().toISOString(),
    strategy: scan.strategy,
    profile_hash: simpleHash(JSON.stringify(profile)),
    repo_target: scan.target,
    artifacts: artifacts.map((a) => ({
      id: a.id,
      stagePath: a.stagePath,
      targetPath: a.targetPath,
      action: a.action,
      category: a.category,
    })),
  };
}

export { STAGING_DIR_NAME };
