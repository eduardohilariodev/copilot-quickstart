#!/usr/bin/env node

/**
 * copilot-quickstart onboard CLI
 *
 * Scans a target repository, builds repo-profile.yml, detects existing
 * AI configs, and recommends the appropriate meta-skill sequence.
 *
 * Usage:
 *   npx copilot-quickstart-onboard [target-path] [flags]
 *   node tools/onboard/bin/onboard.mjs [target-path] [flags]
 *
 * Flags:
 *   --stage         Write candidate files to ai-setup/ staging dir (preview before applying)
 *   --apply         Move staged files from ai-setup/ to final locations
 *   --skills        Include starter skill pack when staging
 *   --force         Overwrite existing files (use with --apply)
 *   --help          Show usage
 */

import { resolve, join, dirname, relative } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ─── Argument Parsing ───────────────────────────────────────────────────────

function parseArgs(argv) {
  const flags = { stage: false, apply: false, skills: false, force: false, help: false };
  let target = ".";

  for (const arg of argv.slice(2)) {
    if (arg === "--stage") flags.stage = true;
    else if (arg === "--apply") flags.apply = true;
    else if (arg === "--skills") flags.skills = true;
    else if (arg === "--force") flags.force = true;
    else if (arg === "--help" || arg === "-h") flags.help = true;
    else if (!arg.startsWith("-")) target = arg;
  }

  return { target: resolve(target), flags };
}

const { target: TARGET, flags: FLAGS } = parseArgs(process.argv);

// Resolve path to the copilot-quickstart library (for templates)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LIBRARY_ROOT = resolve(__dirname, "..", "..", "..");
const SKILLS_DIR = join(LIBRARY_ROOT, "templates", "skills");
const STAGING_DIR = join(TARGET, "ai-setup");

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileExists(path) {
  return existsSync(path);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function hasFile(name) {
  return fileExists(join(TARGET, name));
}

function hasDir(name) {
  const p = join(TARGET, name);
  return existsSync(p) && statSync(p).isDirectory();
}

function findFiles(dir, pattern) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.match(pattern)) {
        results.push(join(entry.parentPath || entry.path || dir, entry.name));
      }
    }
  } catch { /* skip inaccessible dirs */ }
  return results;
}

// ─── Detection: Languages ───────────────────────────────────────────────────

function detectLanguages() {
  const langs = new Set();
  const indicators = {
    "package.json": "typescript",
    "tsconfig.json": "typescript",
    "pyproject.toml": "python",
    "requirements.txt": "python",
    "go.mod": "go",
    "Cargo.toml": "rust",
    "pom.xml": "java",
    "build.gradle": "java",
    "Gemfile": "ruby",
    "mix.exs": "elixir",
    "composer.json": "php",
  };

  for (const [file, lang] of Object.entries(indicators)) {
    if (hasFile(file)) langs.add(lang);
  }

  // Check if it's actually TypeScript vs JavaScript
  if (langs.has("typescript") && !hasFile("tsconfig.json")) {
    langs.delete("typescript");
    langs.add("javascript");
  }

  // SQL if migrations present
  if (hasDir("prisma") || hasDir("migrations") || hasDir("db/migrations")) {
    langs.add("sql");
  }

  return [...langs];
}

// ─── Detection: Frameworks ──────────────────────────────────────────────────

function detectFrameworks() {
  const frameworks = new Set();
  const pkgPath = join(TARGET, "package.json");

  if (fileExists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg) {
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      const frameworkMap = {
        next: "nextjs",
        react: "react",
        vue: "vue",
        "@angular/core": "angular",
        svelte: "svelte",
        express: "express",
        fastify: "fastify",
        "@nestjs/core": "nestjs",
        prisma: "prisma",
        "@prisma/client": "prisma",
        tailwindcss: "tailwindcss",
        vitest: "vitest",
        jest: "jest",
        playwright: "playwright",
        "@playwright/test": "playwright",
        cypress: "cypress",
      };

      for (const [dep, framework] of Object.entries(frameworkMap)) {
        if (dep in allDeps) frameworks.add(framework);
      }
    }
  }

  // Python frameworks
  const pyProject = join(TARGET, "pyproject.toml");
  if (fileExists(pyProject)) {
    const content = readFileSync(pyProject, "utf8");
    if (content.includes("django")) frameworks.add("django");
    if (content.includes("fastapi")) frameworks.add("fastapi");
    if (content.includes("flask")) frameworks.add("flask");
    if (content.includes("pytest")) frameworks.add("pytest");
  }

  return [...frameworks];
}

// ─── Detection: Architecture ────────────────────────────────────────────────

function detectArchitecture() {
  if (hasFile("turbo.json") || hasFile("nx.json") || hasFile("lerna.json")) {
    return "monorepo";
  }
  if (hasDir("apps") && hasDir("packages")) {
    return "monorepo";
  }
  if (hasFile("serverless.yml") || hasFile("serverless.ts")) {
    return "serverless";
  }
  if (hasFile("Dockerfile") && hasDir("services")) {
    return "microservices";
  }
  if (hasDir("bin") && !hasDir("src/pages") && !hasDir("src/app")) {
    return "cli";
  }
  if (hasDir("lib") && !hasDir("src") && !hasDir("app")) {
    return "library";
  }
  return "monolith";
}

// ─── Detection: Build Commands ──────────────────────────────────────────────

function detectBuildCommands() {
  const commands = {};
  const pkgPath = join(TARGET, "package.json");

  if (fileExists(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg?.scripts) {
      // Package manager detection
      const pm = hasFile("pnpm-lock.yaml")
        ? "pnpm"
        : hasFile("yarn.lock")
          ? "yarn"
          : "npm";

      if (pkg.scripts.build) commands.build = `${pm} run build`;
      if (pkg.scripts.test) commands.test = `${pm} run test`;
      if (pkg.scripts.lint) commands.lint = `${pm} run lint`;
      if (pkg.scripts.format) commands.format = `${pm} run format`;
      commands.install = `${pm} install`;
    }
  }

  // Python
  if (hasFile("pyproject.toml")) {
    commands.install = commands.install || "pip install -e .";
    commands.test = commands.test || "pytest";
    commands.lint = commands.lint || "ruff check .";
  }

  // Go
  if (hasFile("go.mod")) {
    commands.build = commands.build || "go build ./...";
    commands.test = commands.test || "go test ./...";
    commands.lint = commands.lint || "golangci-lint run";
  }

  // Makefile fallback
  if (hasFile("Makefile")) {
    const content = readFileSync(join(TARGET, "Makefile"), "utf8");
    if (!commands.build && content.includes("build:")) commands.build = "make build";
    if (!commands.test && content.includes("test:")) commands.test = "make test";
    if (!commands.lint && content.includes("lint:")) commands.lint = "make lint";
  }

  return commands;
}

// ─── Detection: Existing AI Configs ─────────────────────────────────────────

function detectExistingConfigs() {
  const configs = {};

  if (hasFile(".github/copilot-instructions.md")) {
    configs.copilot_instructions = true;
  }
  if (hasFile("AGENTS.md")) {
    configs.agents_md = true;
  }
  if (hasFile("CLAUDE.md")) {
    configs.claude_md = true;
  }
  if (hasDir(".cursor/rules")) {
    configs.cursor_rules = true;
  }
  if (hasDir(".github/skills")) {
    configs.copilot_skills = true;
  }

  return configs;
}

// ─── Detection: Providers ───────────────────────────────────────────────────

function detectProviders(existingConfigs) {
  const providers = new Set();

  if (existingConfigs.copilot_instructions || existingConfigs.copilot_skills) {
    providers.add("copilot");
  }
  if (existingConfigs.claude_md) {
    providers.add("claude");
  }
  if (existingConfigs.cursor_rules) {
    providers.add("cursor");
  }

  // If nothing detected, assume copilot (most common)
  if (providers.size === 0) {
    providers.add("copilot");
  }

  return [...providers];
}

// ─── Profile Generation ─────────────────────────────────────────────────────

function generateProfile() {
  const languages = detectLanguages();
  const frameworks = detectFrameworks();
  const architecture = detectArchitecture();
  const buildCommands = detectBuildCommands();
  const existingConfigs = detectExistingConfigs();
  const providers = detectProviders(existingConfigs);

  const profile = {
    name: `<owner>/${TARGET.split(/[\\/]/).pop()}`,
    description: "<project description>",
    languages,
    frameworks,
    build_commands: buildCommands,
    architecture,
    risk_level: "medium",
    conventions: {
      naming: "<detected or fill in>",
      git_workflow: "github-flow",
      testing_strategy: "<fill in>",
    },
    protected_paths: [".env*"],
    providers,
  };

  // Add monorepo details if applicable
  if (architecture === "monorepo") {
    profile.monorepo = { tool: "<turbo/nx/lerna>", packages: [] };
    if (hasFile("turbo.json")) profile.monorepo.tool = "turborepo";
    if (hasFile("nx.json")) profile.monorepo.tool = "nx";
    if (hasFile("lerna.json")) profile.monorepo.tool = "lerna";
  }

  // Add prisma migrations to protected paths
  if (hasDir("prisma/migrations")) {
    profile.protected_paths.push("prisma/migrations/");
  }

  return { profile, existingConfigs };
}

// ─── Strategy Determination ─────────────────────────────────────────────────

function determineStrategy(existingConfigs) {
  const configCount = Object.keys(existingConfigs).length;
  if (configCount === 0) return "greenfield";
  return "brownfield";
}

// ─── Output ─────────────────────────────────────────────────────────────────

function formatYaml(obj, indent = 0) {
  const pad = " ".repeat(indent);
  let out = "";

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        out += `${pad}${key}: []\n`;
      } else if (typeof value[0] === "object") {
        out += `${pad}${key}:\n`;
        for (const item of value) {
          const lines = formatYaml(item, indent + 4).split("\n").filter(Boolean);
          out += `${pad}  - ${lines[0].trim()}\n`;
          for (const line of lines.slice(1)) {
            out += `${pad}    ${line.trim()}\n`;
          }
        }
      } else {
        out += `${pad}${key}:\n`;
        for (const item of value) {
          out += `${pad}  - ${JSON.stringify(item)}\n`;
        }
      }
    } else if (typeof value === "object") {
      out += `${pad}${key}:\n`;
      out += formatYaml(value, indent + 2);
    } else if (typeof value === "string" && value.includes(" ")) {
      out += `${pad}${key}: "${value}"\n`;
    } else {
      out += `${pad}${key}: ${value}\n`;
    }
  }

  return out;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
copilot-quickstart onboard — AI-ready repo configuration generator

Usage:
  copilot-quickstart [target-path] [flags]

Flags:
  --stage     Write candidate files to ai-setup/ staging dir
  --apply     Move staged files from ai-setup/ to final locations
  --skills    Include starter skill pack when staging
  --force     Overwrite existing files
  --help      Show this help

Examples:
  copilot-quickstart                    # Scan current dir, write repo-profile.yml
  copilot-quickstart --stage            # Stage all candidate files in ai-setup/
  copilot-quickstart --stage --skills   # Stage + include starter skills
  copilot-quickstart --apply            # Apply staged files to final locations
  copilot-quickstart /path/to/repo      # Target a specific repo
`);
}

function stageFiles(profile, strategy) {
  console.log("── Staging to ai-setup/ ────────────────────────");

  // Clean previous staging
  if (existsSync(STAGING_DIR)) {
    rmSync(STAGING_DIR, { recursive: true });
  }

  // Create staging structure mirroring final paths
  mkdirSync(join(STAGING_DIR, ".github"), { recursive: true });

  // Write repo-profile.yml
  const profileContent =
    `# Repository Profile\n` +
    `# yaml-language-server: $schema=https://raw.githubusercontent.com/eduardohilariodev/copilot-quickstart/main/schemas/repo-profile.schema.json\n` +
    `# Generated by copilot-quickstart onboard\n` +
    `# Review and fill in <placeholders> before running meta-skills\n\n` +
    formatYaml(profile);
  writeFileSync(join(STAGING_DIR, "repo-profile.yml"), profileContent, "utf8");
  console.log("  ✓ ai-setup/repo-profile.yml");

  // Stage AGENTS.md template (interpolated)
  const agentsMd = generateAgentsMd(profile);
  writeFileSync(join(STAGING_DIR, "AGENTS.md"), agentsMd, "utf8");
  console.log("  ✓ ai-setup/AGENTS.md");

  // Stage copilot-instructions
  const instructionsMd = generateInstructions(profile);
  writeFileSync(join(STAGING_DIR, ".github", "copilot-instructions.md"), instructionsMd, "utf8");
  console.log("  ✓ ai-setup/.github/copilot-instructions.md");

  // Stage skills if requested
  if (FLAGS.skills) {
    const skillsTarget = join(STAGING_DIR, ".github", "skills");
    mkdirSync(skillsTarget, { recursive: true });

    if (existsSync(SKILLS_DIR)) {
      const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());

      for (const dir of skillDirs) {
        const src = join(SKILLS_DIR, dir.name, "SKILL.md");
        if (existsSync(src)) {
          const dest = join(skillsTarget, dir.name);
          mkdirSync(dest, { recursive: true });
          cpSync(src, join(dest, "SKILL.md"));
          console.log(`  ✓ ai-setup/.github/skills/${dir.name}/SKILL.md`);
        }
      }
    }
  }

  console.log("");
  console.log(`  Total: staged in ${relative(TARGET, STAGING_DIR)}/`);
  console.log("");
  console.log("  Review with:");
  console.log(`    cd ${TARGET}`);
  console.log("    ls ai-setup/");
  console.log("");
  console.log("  Apply with:");
  console.log("    copilot-quickstart --apply");
}

function applyStaged() {
  console.log("── Applying staged files ───────────────────────");

  if (!existsSync(STAGING_DIR)) {
    console.error("  ERROR: No ai-setup/ directory found. Run with --stage first.");
    process.exit(1);
  }

  const moves = [
    { from: "repo-profile.yml", to: "repo-profile.yml" },
    { from: "AGENTS.md", to: "AGENTS.md" },
    { from: ".github/copilot-instructions.md", to: ".github/copilot-instructions.md" },
  ];

  // Check for skills
  const stagedSkills = join(STAGING_DIR, ".github", "skills");
  if (existsSync(stagedSkills)) {
    const skillDirs = readdirSync(stagedSkills, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const dir of skillDirs) {
      moves.push({
        from: `.github/skills/${dir.name}/SKILL.md`,
        to: `.github/skills/${dir.name}/SKILL.md`,
      });
    }
  }

  let applied = 0;
  let skipped = 0;

  for (const move of moves) {
    const src = join(STAGING_DIR, move.from);
    const dest = join(TARGET, move.to);

    if (!existsSync(src)) continue;

    if (existsSync(dest) && !FLAGS.force) {
      console.log(`  ⚠ SKIP (exists): ${move.to} — use --force to overwrite`);
      skipped++;
      continue;
    }

    // Ensure destination directory exists
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    console.log(`  ✓ ${move.to}`);
    applied++;
  }

  console.log("");
  console.log(`  Applied: ${applied} | Skipped: ${skipped}`);

  if (applied > 0) {
    console.log("");
    console.log("  Next: review changes with git diff, then commit:");
    console.log("    git add -A && git status");
  }
}

function generateAgentsMd(profile) {
  const name = profile.name || "this-repo";
  const langs = profile.languages.join(", ") || "not specified";
  const frameworks = profile.frameworks.join(", ") || "none";
  const arch = profile.architecture || "monolith";
  const cmds = profile.build_commands || {};

  return `# AGENTS.md — ${name}

## Quick Reference

| Key | Value |
|-----|-------|
| Languages | ${langs} |
| Frameworks | ${frameworks} |
| Architecture | ${arch} |
| Risk Level | ${profile.risk_level || "medium"} |

## Commands

| Action | Command |
|--------|---------|
${cmds.install ? `| Install | \`${cmds.install}\` |\n` : ""}${cmds.build ? `| Build | \`${cmds.build}\` |\n` : ""}${cmds.test ? `| Test | \`${cmds.test}\` |\n` : ""}${cmds.lint ? `| Lint | \`${cmds.lint}\` |\n` : ""}

## Architecture

<!-- Fill in: describe key modules, boundaries, and data flow -->

## Code Conventions

- Follow existing patterns in the codebase
- ${profile.conventions?.naming || "Use consistent naming conventions"}
- ${profile.conventions?.testing_strategy || "Write tests for new features"}

## Protected Paths

Do NOT modify these without explicit approval:
${(profile.protected_paths || [".env*"]).map(p => `- \`${p}\``).join("\n")}

## Agent Guidelines

- Read this file before making changes
- Run tests after every modification
- Keep commits small and focused
- Ask before architectural changes
`;
}

function generateInstructions(profile) {
  const langs = profile.languages.join(", ") || "this project";
  const frameworks = profile.frameworks.join(", ");

  return `# Copilot Instructions

## Project Context

This is a ${profile.architecture || "monolith"} project using ${langs}${frameworks ? ` with ${frameworks}` : ""}.

## Code Style

- Follow existing patterns in the codebase
- ${profile.conventions?.naming || "Use consistent naming conventions"}
- Write clear, self-documenting code

## Testing

- ${profile.conventions?.testing_strategy || "Write tests for new features and bug fixes"}
${profile.build_commands?.test ? `- Run tests: \`${profile.build_commands.test}\`` : ""}

## Safety

- Never modify files matching: ${(profile.protected_paths || [".env*"]).join(", ")}
- Never commit secrets or credentials
- Always verify changes compile/pass before committing

## When Unsure

- Check AGENTS.md for architecture guidance
- Look at existing similar code for patterns
- Ask the developer rather than guessing
`;
}

function main() {
  if (FLAGS.help) {
    showHelp();
    process.exit(0);
  }

  // Handle --apply separately
  if (FLAGS.apply) {
    console.log("");
    console.log("┌─────────────────────────────────────────────┐");
    console.log("│  copilot-quickstart apply                    │");
    console.log("└─────────────────────────────────────────────┘");
    console.log("");
    applyStaged();
    return;
  }

  console.log("");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│  copilot-quickstart onboard                  │");
  console.log("│  AI-ready repo configuration generator       │");
  console.log("└─────────────────────────────────────────────┘");
  console.log("");
  console.log(`Target: ${TARGET}`);
  console.log("");

  if (!existsSync(TARGET)) {
    console.error(`ERROR: Target path does not exist: ${TARGET}`);
    process.exit(1);
  }

  // ─── Detection Phase ────────────────────────────────────────────────────

  console.log("── Detection ──────────────────────────────────");
  const { profile, existingConfigs } = generateProfile();

  console.log(`  Languages:    ${profile.languages.join(", ") || "none detected"}`);
  console.log(`  Frameworks:   ${profile.frameworks.join(", ") || "none detected"}`);
  console.log(`  Architecture: ${profile.architecture}`);
  console.log(`  Providers:    ${profile.providers.join(", ")}`);
  console.log("");

  // ─── Existing Config Detection ──────────────────────────────────────────

  console.log("── Existing AI Configs ────────────────────────");
  const configEntries = Object.entries(existingConfigs);
  if (configEntries.length === 0) {
    console.log("  (none found)");
  } else {
    for (const [key] of configEntries) {
      console.log(`  ✓ ${key.replace(/_/g, " ")}`);
    }
  }
  console.log("");

  // ─── Strategy ───────────────────────────────────────────────────────────

  const strategy = determineStrategy(existingConfigs);
  console.log("── Strategy ───────────────────────────────────");
  console.log(`  Mode: ${strategy.toUpperCase()}`);
  console.log("");

  // ─── Build Commands ─────────────────────────────────────────────────────

  console.log("── Build Commands ─────────────────────────────");
  if (Object.keys(profile.build_commands).length === 0) {
    console.log("  (none detected — fill in repo-profile.yml manually)");
  } else {
    for (const [cmd, val] of Object.entries(profile.build_commands)) {
      console.log(`  ${cmd.padEnd(10)} ${val}`);
    }
  }
  console.log("");

  // ─── Stage or Write Profile ─────────────────────────────────────────────

  if (FLAGS.stage) {
    // Staging workflow: write everything to ai-setup/
    stageFiles(profile, strategy);
  } else {
    // Default: write only repo-profile.yml to root
    const profilePath = join(TARGET, "repo-profile.yml");
    const profileExists = fileExists(profilePath);

    console.log("── Profile ────────────────────────────────────");
    if (profileExists && !FLAGS.force) {
      console.log("  ⚠ repo-profile.yml already exists — skipping write");
      console.log("    Run with --force to overwrite");
    } else {
      const yamlContent =
        `# Repository Profile\n` +
        `# yaml-language-server: $schema=https://raw.githubusercontent.com/eduardohilariodev/copilot-quickstart/main/schemas/repo-profile.schema.json\n` +
        `# Generated by copilot-quickstart onboard\n` +
        `# Review and fill in <placeholders> before running meta-skills\n\n` +
        formatYaml(profile);

      writeFileSync(profilePath, yamlContent, "utf8");
      console.log(`  ✓ Written: ${profilePath}`);
    }
    console.log("");
  }

  // ─── Recommendations ────────────────────────────────────────────────────

  console.log("── Next Steps ─────────────────────────────────");
  console.log("");

  if (FLAGS.stage) {
    console.log("  Files staged in ai-setup/. To apply:");
    console.log("    copilot-quickstart --apply");
    console.log("");
    console.log("  Or review individual files first:");
    console.log("    cat ai-setup/AGENTS.md");
    console.log("    cat ai-setup/.github/copilot-instructions.md");
  } else if (strategy === "greenfield") {
    console.log("  1. Review and complete repo-profile.yml (fill <placeholders>)");
    console.log("  2. Stage full config (recommended):");
    console.log("     copilot-quickstart --stage --skills");
    console.log("  3. Or run in your AI tool:");
    console.log('     "Using onboard-repo, generate AI configs for this repo"');
  } else {
    console.log("  1. Review repo-profile.yml for accuracy");
    console.log("  2. Run diagnosis in your AI tool:");
    console.log('     "Using diagnose-brownfield, assess this repo\'s AI-readiness"');
    console.log("  3. Stage normalized configs:");
    console.log("     copilot-quickstart --stage");
    console.log("  4. Or target specific issues:");
    console.log('     "Run lint-instructions on my copilot-instructions"');
  }

  console.log("");
  console.log("── Maintenance Cadence ────────────────────────");
  console.log("  Weekly:    health-dashboard (check overall config health)");
  console.log("  Monthly:   audit-skills + detect-drift");
  console.log("  Quarterly: prune-skills + check-compatibility");
  console.log("");
}

main();
