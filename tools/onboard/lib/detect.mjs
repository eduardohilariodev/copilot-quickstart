import { join, resolve } from "node:path";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import {
  IGNORE_DIRS,
  LANGUAGE_INDICATORS,
  FRAMEWORK_MAP,
  DEPLOYMENT_INDICATORS,
} from "./constants.mjs";

/**
 * Detection module — scans a target repo and returns a structured scan result.
 * Pure functions, no side effects, no prompts.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileExists(target, name) {
  return existsSync(join(target, name));
}

function dirExists(target, name) {
  const p = join(target, name);
  return existsSync(p) && statSync(p).isDirectory();
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function listTopLevel(target) {
  try {
    return readdirSync(target, { withFileTypes: true });
  } catch {
    return [];
  }
}

// ─── Language Detection ─────────────────────────────────────────────────────

export function detectLanguages(target) {
  const langs = new Set();

  for (const [file, lang] of Object.entries(LANGUAGE_INDICATORS)) {
    if (file.startsWith("*")) continue;
    if (fileExists(target, file)) langs.add(lang);
  }

  // Check TS vs JS
  if (langs.has("typescript") && !fileExists(target, "tsconfig.json")) {
    langs.delete("typescript");
    langs.add("javascript");
  }

  // C# detection (glob)
  const entries = listTopLevel(target);
  if (entries.some((e) => e.name.endsWith(".csproj") || e.name.endsWith(".sln"))) {
    langs.add("csharp");
  }

  // SQL if migrations
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

export function detectFrameworks(target) {
  const frameworks = new Set();
  const pkgPath = join(target, "package.json");

  if (existsSync(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg) {
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      for (const [dep, framework] of Object.entries(FRAMEWORK_MAP)) {
        if (dep in allDeps) frameworks.add(framework);
      }
    }
  }

  // Python frameworks
  const pyProject = join(target, "pyproject.toml");
  if (existsSync(pyProject)) {
    const content = readText(pyProject);
    if (content.includes("django")) frameworks.add("django");
    if (content.includes("fastapi")) frameworks.add("fastapi");
    if (content.includes("flask")) frameworks.add("flask");
    if (content.includes("pytest")) frameworks.add("pytest");
  }

  // Go frameworks
  const goMod = join(target, "go.mod");
  if (existsSync(goMod)) {
    const content = readText(goMod);
    if (content.includes("gin-gonic")) frameworks.add("gin");
    if (content.includes("gofiber")) frameworks.add("fiber");
    if (content.includes("echo")) frameworks.add("echo");
  }

  return [...frameworks];
}

// ─── Architecture Detection ─────────────────────────────────────────────────

export function detectArchitecture(target) {
  if (
    fileExists(target, "turbo.json") ||
    fileExists(target, "nx.json") ||
    fileExists(target, "lerna.json") ||
    fileExists(target, "pnpm-workspace.yaml")
  ) {
    return "monorepo";
  }
  if (dirExists(target, "apps") && dirExists(target, "packages")) {
    return "monorepo";
  }
  if (
    fileExists(target, "serverless.yml") ||
    fileExists(target, "serverless.ts")
  ) {
    return "serverless";
  }
  if (fileExists(target, "Dockerfile") && dirExists(target, "services")) {
    return "microservices";
  }
  if (dirExists(target, "bin") && !dirExists(target, "src/pages") && !dirExists(target, "src/app")) {
    return "cli";
  }
  if (dirExists(target, "lib") && !dirExists(target, "src") && !dirExists(target, "app")) {
    return "library";
  }
  return "monolith";
}

// ─── Build Commands Detection ───────────────────────────────────────────────

export function detectBuildCommands(target) {
  const commands = {};
  const pkgPath = join(target, "package.json");

  if (existsSync(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg?.scripts) {
      const pm = fileExists(target, "pnpm-lock.yaml")
        ? "pnpm"
        : fileExists(target, "bun.lockb")
          ? "bun"
          : fileExists(target, "yarn.lock")
            ? "yarn"
            : "npm";

      if (pkg.scripts.build) commands.build = `${pm} run build`;
      if (pkg.scripts.test) commands.test = `${pm} run test`;
      if (pkg.scripts.lint) commands.lint = `${pm} run lint`;
      if (pkg.scripts.format) commands.format = `${pm} run format`;
      if (pkg.scripts.dev) commands.dev = `${pm} run dev`;
      commands.install = `${pm} install`;
    }
  }

  // Python
  if (fileExists(target, "pyproject.toml")) {
    commands.install = commands.install || "pip install -e .";
    commands.test = commands.test || "pytest";
    commands.lint = commands.lint || "ruff check .";
  }

  // Go
  if (fileExists(target, "go.mod")) {
    commands.build = commands.build || "go build ./...";
    commands.test = commands.test || "go test ./...";
    commands.lint = commands.lint || "golangci-lint run";
  }

  // Rust
  if (fileExists(target, "Cargo.toml")) {
    commands.build = commands.build || "cargo build";
    commands.test = commands.test || "cargo test";
    commands.lint = commands.lint || "cargo clippy";
  }

  // Makefile fallback
  if (fileExists(target, "Makefile")) {
    const content = readText(join(target, "Makefile"));
    if (!commands.build && content.includes("build:")) commands.build = "make build";
    if (!commands.test && content.includes("test:")) commands.test = "make test";
    if (!commands.lint && content.includes("lint:")) commands.lint = "make lint";
  }

  return commands;
}

// ─── Existing AI Config Detection ───────────────────────────────────────────

export function detectExistingConfigs(target) {
  const configs = {};

  if (fileExists(target, ".github/copilot-instructions.md")) {
    configs.copilot_instructions = {
      path: ".github/copilot-instructions.md",
      size: statSync(join(target, ".github/copilot-instructions.md")).size,
    };
  }

  // Path-specific instructions
  const instructionsDir = join(target, ".github", "instructions");
  if (existsSync(instructionsDir) && statSync(instructionsDir).isDirectory()) {
    try {
      const files = readdirSync(instructionsDir).filter((f) =>
        f.endsWith(".instructions.md")
      );
      if (files.length > 0) {
        configs.path_instructions = { count: files.length, files };
      }
    } catch {}
  }

  if (fileExists(target, "AGENTS.md")) {
    configs.agents_md = {
      path: "AGENTS.md",
      size: statSync(join(target, "AGENTS.md")).size,
    };
  }
  if (fileExists(target, "CLAUDE.md")) {
    configs.claude_md = {
      path: "CLAUDE.md",
      size: statSync(join(target, "CLAUDE.md")).size,
    };
  }
  if (dirExists(target, ".cursor/rules")) {
    const rules = readdirSync(join(target, ".cursor", "rules")).filter((f) =>
      f.endsWith(".mdc")
    );
    if (rules.length > 0) {
      configs.cursor_rules = { count: rules.length, files: rules };
    }
  }
  if (dirExists(target, ".github/skills")) {
    configs.copilot_skills = { path: ".github/skills" };
  }

  // VS Code settings
  if (fileExists(target, ".vscode/settings.json")) {
    const settings = readJson(join(target, ".vscode/settings.json"));
    if (settings?.["chat.instructionsFilesLocations"]) {
      configs.vscode_instruction_discovery = true;
    }
  }

  return configs;
}

// ─── Provider Detection ─────────────────────────────────────────────────────

export function detectProviders(existingConfigs) {
  const providers = new Set();

  if (existingConfigs.copilot_instructions || existingConfigs.copilot_skills) {
    providers.add("copilot");
  }
  if (existingConfigs.claude_md) providers.add("claude");
  if (existingConfigs.cursor_rules) providers.add("cursor");

  // Default to copilot if nothing detected
  if (providers.size === 0) providers.add("copilot");

  return [...providers];
}

// ─── CI/Workflow Detection ──────────────────────────────────────────────────

export function detectCI(target) {
  const ci = {};
  const workflowsDir = join(target, ".github", "workflows");

  if (existsSync(workflowsDir) && statSync(workflowsDir).isDirectory()) {
    const files = readdirSync(workflowsDir).filter(
      (f) => f.endsWith(".yml") || f.endsWith(".yaml")
    );
    if (files.length > 0) {
      ci.github_actions = { count: files.length, files };
    }
  }

  if (fileExists(target, ".gitlab-ci.yml")) ci.gitlab = true;
  if (fileExists(target, "Jenkinsfile")) ci.jenkins = true;
  if (fileExists(target, ".circleci/config.yml")) ci.circleci = true;

  return ci;
}

// ─── Monorepo Package Detection ─────────────────────────────────────────────

export function detectMonorepoPackages(target) {
  const packages = [];

  // Check apps/ and packages/ dirs
  for (const dir of ["apps", "packages", "services", "libs"]) {
    const fullPath = join(target, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      try {
        const entries = readdirSync(fullPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
            packages.push(`${dir}/${entry.name}`);
          }
        }
      } catch {}
    }
  }

  return packages;
}

// ─── Monorepo Tool Detection ────────────────────────────────────────────────

export function detectMonorepoTool(target) {
  if (fileExists(target, "turbo.json")) return "turborepo";
  if (fileExists(target, "nx.json")) return "nx";
  if (fileExists(target, "lerna.json")) return "lerna";
  if (fileExists(target, "pnpm-workspace.yaml")) return "pnpm-workspaces";
  return "unknown";
}

// ─── Deployment Detection ───────────────────────────────────────────────────

export function detectDeployment(target) {
  const platforms = new Set();

  for (const [file, platform] of Object.entries(DEPLOYMENT_INDICATORS)) {
    if (fileExists(target, file)) {
      platforms.add(platform);
    }
  }

  // Check for terraform directory or .tf files
  if (dirExists(target, "terraform")) {
    platforms.add("terraform");
  } else {
    const topLevel = listTopLevel(target);
    if (topLevel.some((e) => e.isFile() && e.name.endsWith(".tf"))) {
      platforms.add("terraform");
    }
  }

  return [...platforms];
}

// ─── Agent Definitions Detection ────────────────────────────────────────────

export function detectAgentDefinitions(target) {
  const found = [];
  const searchDirs = ["agents", ".github/agents", ".ai/agents"];

  for (const dir of searchDirs) {
    const fullPath = join(target, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      try {
        const files = readdirSync(fullPath).filter(
          (f) => f.endsWith(".yml") || f.endsWith(".yaml")
        );
        for (const file of files) {
          found.push(`${dir}/${file}`);
        }
      } catch {}
    }
  }

  return found;
}

// ─── Full Scan ──────────────────────────────────────────────────────────────

/**
 * Run all detections and return a complete scan result.
 * @param {string} target - Absolute path to the target repo
 * @returns {object} Full scan result
 */
export function scanRepo(target) {
  const resolvedTarget = resolve(target);

  const languages = detectLanguages(resolvedTarget);
  const frameworks = detectFrameworks(resolvedTarget);
  const architecture = detectArchitecture(resolvedTarget);
  const buildCommands = detectBuildCommands(resolvedTarget);
  const existingConfigs = detectExistingConfigs(resolvedTarget);
  const providers = detectProviders(existingConfigs);
  const ci = detectCI(resolvedTarget);
  const deployment = detectDeployment(resolvedTarget);
  const agentDefinitions = detectAgentDefinitions(resolvedTarget);

  const scan = {
    target: resolvedTarget,
    languages,
    frameworks,
    architecture,
    build_commands: buildCommands,
    existing_configs: existingConfigs,
    providers,
    ci,
    deployment,
    agent_definitions: agentDefinitions,
  };

  // Monorepo details
  if (architecture === "monorepo") {
    scan.monorepo = {
      tool: detectMonorepoTool(resolvedTarget),
      packages: detectMonorepoPackages(resolvedTarget),
    };
  }

  // Strategy classification
  const configCount = Object.keys(existingConfigs).length;
  if (configCount === 0) {
    scan.strategy = "greenfield";
  } else if (configCount <= 2) {
    scan.strategy = "brownfield-light";
  } else {
    scan.strategy = "brownfield-heavy";
  }

  // Existing profile?
  if (fileExists(resolvedTarget, "repo-profile.yml")) {
    scan.has_existing_profile = true;
  }

  return scan;
}
