/**
 * Repo detection module — scans a target repo and returns a structured scan result.
 * Pure functions, no side effects, no prompts.
 */

import { join, resolve } from "node:path";
import { existsSync, statSync, readFileSync, readdirSync } from "node:fs";
import {
  DEPLOYMENT_INDICATORS,
  FRAMEWORK_MAP,
  IGNORE_DIRS,
  LANGUAGE_INDICATORS,
} from "./constants.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScanResult {
  target: string;
  languages: string[];
  frameworks: string[];
  architecture: string;
  build_commands: Record<string, string>;
  existing_configs: Record<string, unknown>;
  providers: string[];
  ci: Record<string, unknown>;
  deployment: string[];
  agent_definitions: string[];
  monorepo?: { tool: string; packages: string[] };
  strategy: "greenfield" | "brownfield-light" | "brownfield-heavy";
  has_existing_profile?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileExists(target: string, name: string): boolean {
  return existsSync(join(target, name));
}

function dirExists(target: string, name: string): boolean {
  const p = join(target, name);
  return existsSync(p) && statSync(p).isDirectory();
}

function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function readText(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function listTopLevel(target: string) {
  try {
    return readdirSync(target, { withFileTypes: true });
  } catch {
    return [];
  }
}

// ─── Language Detection ─────────────────────────────────────────────────────

export function detectLanguages(target: string): string[] {
  const langs = new Set<string>();

  for (const [file, lang] of Object.entries(LANGUAGE_INDICATORS)) {
    if (file.startsWith("*")) continue;
    if (fileExists(target, file)) langs.add(lang!);
  }

  if (langs.has("typescript") && !fileExists(target, "tsconfig.json")) {
    langs.delete("typescript");
    langs.add("javascript");
  }

  const entries = listTopLevel(target);
  if (entries.some((e) => e.name.endsWith(".csproj") || e.name.endsWith(".sln"))) {
    langs.add("csharp");
  }

  if (
    dirExists(target, "prisma") ||
    dirExists(target, "migrations") ||
    dirExists(target, "db/migrations")
  ) {
    langs.add("sql");
  }

  return [...langs];
}

// ─── Framework Detection ────────────────────────────────────────────────────

export function detectFrameworks(target: string): string[] {
  const frameworks = new Set<string>();
  const pkgPath = join(target, "package.json");

  if (existsSync(pkgPath)) {
    const pkg = readJson(pkgPath) as Record<string, Record<string, unknown>> | null;
    if (pkg) {
      const allDeps: Record<string, unknown> = {
        ...((pkg.dependencies as Record<string, unknown>) || {}),
        ...((pkg.devDependencies as Record<string, unknown>) || {}),
      };
      for (const [dep, framework] of Object.entries(FRAMEWORK_MAP)) {
        if (dep in allDeps) frameworks.add(framework!);
      }
    }
  }

  // Python frameworks
  if (fileExists(target, "pyproject.toml")) {
    const content = readText(join(target, "pyproject.toml"));
    if (content.includes("django")) frameworks.add("django");
    if (content.includes("fastapi")) frameworks.add("fastapi");
    if (content.includes("flask")) frameworks.add("flask");
    if (content.includes("pytest")) frameworks.add("pytest");
  }

  // Go frameworks
  if (fileExists(target, "go.mod")) {
    const content = readText(join(target, "go.mod"));
    if (content.includes("gin-gonic")) frameworks.add("gin");
    if (content.includes("gofiber")) frameworks.add("fiber");
    if (content.includes("echo")) frameworks.add("echo");
  }

  return [...frameworks];
}

// ─── Architecture Detection ─────────────────────────────────────────────────

export function detectArchitecture(target: string): string {
  if (
    fileExists(target, "turbo.json") ||
    fileExists(target, "nx.json") ||
    fileExists(target, "lerna.json") ||
    fileExists(target, "pnpm-workspace.yaml")
  ) {
    return "monorepo";
  }
  if (dirExists(target, "apps") && dirExists(target, "packages")) return "monorepo";
  if (fileExists(target, "serverless.yml") || fileExists(target, "serverless.ts")) return "serverless";
  if (fileExists(target, "Dockerfile") && dirExists(target, "services")) return "microservices";
  if (dirExists(target, "bin") && !dirExists(target, "src/pages") && !dirExists(target, "src/app"))
    return "cli";
  if (dirExists(target, "lib") && !dirExists(target, "src") && !dirExists(target, "app"))
    return "library";
  return "monolith";
}

// ─── Build Commands Detection ───────────────────────────────────────────────

export function detectBuildCommands(target: string): Record<string, string> {
  const commands: Record<string, string> = {};
  const pkgPath = join(target, "package.json");

  if (existsSync(pkgPath)) {
    const pkg = readJson(pkgPath) as Record<string, Record<string, unknown>> | null;
    if (pkg?.scripts) {
      const scripts = pkg.scripts as Record<string, string>;
      const pm = fileExists(target, "pnpm-lock.yaml")
        ? "pnpm"
        : fileExists(target, "bun.lockb")
          ? "bun"
          : fileExists(target, "yarn.lock")
            ? "yarn"
            : "npm";

      if (scripts.build) commands.build = `${pm} run build`;
      if (scripts.test) commands.test = `${pm} run test`;
      if (scripts.lint) commands.lint = `${pm} run lint`;
      if (scripts.format) commands.format = `${pm} run format`;
      if (scripts.dev) commands.dev = `${pm} run dev`;
      commands.install = `${pm} install`;
    }
  }

  if (fileExists(target, "pyproject.toml")) {
    commands.install = commands.install || "pip install -e .";
    commands.test = commands.test || "pytest";
    commands.lint = commands.lint || "ruff check .";
  }

  if (fileExists(target, "go.mod")) {
    commands.build = commands.build || "go build ./...";
    commands.test = commands.test || "go test ./...";
    commands.lint = commands.lint || "golangci-lint run";
  }

  if (fileExists(target, "Cargo.toml")) {
    commands.build = commands.build || "cargo build";
    commands.test = commands.test || "cargo test";
    commands.lint = commands.lint || "cargo clippy";
  }

  if (fileExists(target, "Makefile")) {
    const content = readText(join(target, "Makefile"));
    if (!commands.build && content.includes("build:")) commands.build = "make build";
    if (!commands.test && content.includes("test:")) commands.test = "make test";
    if (!commands.lint && content.includes("lint:")) commands.lint = "make lint";
  }

  return commands;
}

// ─── Existing AI Config Detection ───────────────────────────────────────────

export function detectExistingConfigs(target: string): Record<string, unknown> {
  const configs: Record<string, unknown> = {};

  if (fileExists(target, ".github/copilot-instructions.md")) {
    const stat = statSync(join(target, ".github/copilot-instructions.md"));
    configs.copilot_instructions = {
      path: ".github/copilot-instructions.md",
      size: stat.size,
    };
  }

  const instructionsDir = join(target, ".github", "instructions");
  if (dirExists(target, ".github/instructions")) {
    try {
      const files = readdirSync(instructionsDir).filter((f) => f.endsWith(".instructions.md"));
      if (files.length > 0) {
        configs.path_instructions = { count: files.length, files };
      }
    } catch { /* ignore */ }
  }

  if (fileExists(target, "AGENTS.md")) {
    configs.agents_md = { path: "AGENTS.md", size: statSync(join(target, "AGENTS.md")).size };
  }
  if (fileExists(target, "CLAUDE.md")) {
    configs.claude_md = { path: "CLAUDE.md", size: statSync(join(target, "CLAUDE.md")).size };
  }
  if (dirExists(target, ".cursor/rules")) {
    try {
      const rules = readdirSync(join(target, ".cursor", "rules")).filter((f) => f.endsWith(".mdc"));
      if (rules.length > 0) configs.cursor_rules = { count: rules.length, files: rules };
    } catch { /* ignore */ }
  }
  if (dirExists(target, ".github/skills")) {
    configs.copilot_skills = { path: ".github/skills" };
  }

  if (fileExists(target, ".vscode/settings.json")) {
    const settings = readJson(join(target, ".vscode/settings.json"));
    if (settings?.["chat.instructionsFilesLocations"]) {
      configs.vscode_instruction_discovery = true;
    }
  }

  return configs;
}

// ─── Provider Detection ─────────────────────────────────────────────────────

export function detectProviders(existingConfigs: Record<string, unknown>): string[] {
  const providers = new Set<string>();
  if (existingConfigs.copilot_instructions || existingConfigs.copilot_skills) providers.add("copilot");
  if (existingConfigs.claude_md) providers.add("claude");
  if (existingConfigs.cursor_rules) providers.add("cursor");
  if (providers.size === 0) providers.add("copilot");
  return [...providers];
}

// ─── CI/Workflow Detection ──────────────────────────────────────────────────

export function detectCI(target: string): Record<string, unknown> {
  const ci: Record<string, unknown> = {};
  const workflowsDir = join(target, ".github", "workflows");

  if (dirExists(target, ".github/workflows")) {
    try {
      const files = readdirSync(workflowsDir).filter(
        (f) => f.endsWith(".yml") || f.endsWith(".yaml"),
      );
      if (files.length > 0) ci.github_actions = { count: files.length, files };
    } catch { /* ignore */ }
  }

  if (fileExists(target, ".gitlab-ci.yml")) ci.gitlab = true;
  if (fileExists(target, "Jenkinsfile")) ci.jenkins = true;
  if (fileExists(target, ".circleci/config.yml")) ci.circleci = true;

  return ci;
}

// ─── Monorepo Detection ─────────────────────────────────────────────────────

export function detectMonorepoPackages(target: string): string[] {
  const packages: string[] = [];
  for (const dir of ["apps", "packages", "services", "libs"]) {
    if (dirExists(target, dir)) {
      try {
        const entries = readdirSync(join(target, dir), { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
            packages.push(`${dir}/${entry.name}`);
          }
        }
      } catch { /* ignore */ }
    }
  }
  return packages;
}

export function detectMonorepoTool(target: string): string {
  if (fileExists(target, "turbo.json")) return "turborepo";
  if (fileExists(target, "nx.json")) return "nx";
  if (fileExists(target, "lerna.json")) return "lerna";
  if (fileExists(target, "pnpm-workspace.yaml")) return "pnpm-workspaces";
  return "unknown";
}

// ─── Deployment Detection ───────────────────────────────────────────────────

export function detectDeployment(target: string): string[] {
  const platforms = new Set<string>();
  for (const [file, platform] of Object.entries(DEPLOYMENT_INDICATORS)) {
    if (fileExists(target, file)) platforms.add(platform!);
  }
  if (dirExists(target, "terraform")) {
    platforms.add("terraform");
  } else {
    const topLevel = listTopLevel(target);
    if (topLevel.some((e) => e.isFile() && e.name.endsWith(".tf"))) platforms.add("terraform");
  }
  return [...platforms];
}

// ─── Agent Definitions Detection ────────────────────────────────────────────

export function detectAgentDefinitions(target: string): string[] {
  const found: string[] = [];
  for (const dir of ["agents", ".github/agents", ".ai/agents"]) {
    if (dirExists(target, dir)) {
      try {
        const files = readdirSync(join(target, dir)).filter(
          (f) => f.endsWith(".yml") || f.endsWith(".yaml"),
        );
        found.push(...files.map((f) => `${dir}/${f}`));
      } catch { /* ignore */ }
    }
  }
  return found;
}

// ─── Full Scan ──────────────────────────────────────────────────────────────

export function scanRepo(target: string): ScanResult {
  const resolvedTarget = resolve(target);

  const languages = detectLanguages(resolvedTarget);
  const frameworks = detectFrameworks(resolvedTarget);
  const architecture = detectArchitecture(resolvedTarget);
  const build_commands = detectBuildCommands(resolvedTarget);
  const existing_configs = detectExistingConfigs(resolvedTarget);
  const providers = detectProviders(existing_configs);
  const ci = detectCI(resolvedTarget);
  const deployment = detectDeployment(resolvedTarget);
  const agent_definitions = detectAgentDefinitions(resolvedTarget);

  const scan: ScanResult = {
    target: resolvedTarget,
    languages,
    frameworks,
    architecture,
    build_commands,
    existing_configs,
    providers,
    ci,
    deployment,
    agent_definitions,
    strategy: "greenfield",
  };

  if (architecture === "monorepo") {
    scan.monorepo = {
      tool: detectMonorepoTool(resolvedTarget),
      packages: detectMonorepoPackages(resolvedTarget),
    };
  }

  const configCount = Object.keys(existing_configs).length;
  if (configCount === 0) scan.strategy = "greenfield";
  else if (configCount <= 2) scan.strategy = "brownfield-light";
  else scan.strategy = "brownfield-heavy";

  if (fileExists(resolvedTarget, "repo-profile.yml")) {
    scan.has_existing_profile = true;
  }

  return scan;
}
