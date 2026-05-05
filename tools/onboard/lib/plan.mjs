import { STAGING_DIR_NAME } from "./constants.mjs";

/**
 * Plan module — takes scan results + user answers and produces a deterministic
 * artifact plan that `generate` and `apply` both consume.
 */

/**
 * Build a normalized profile from scan + user input.
 */
export function buildProfile(scan, answers) {
  const repoName = answers.name || `<owner>/${scan.target.split(/[\\/]/).pop()}`;

  return {
    name: repoName,
    description: answers.description || "<project description>",
    languages: scan.languages,
    frameworks: scan.frameworks,
    build_commands: scan.build_commands,
    architecture: answers.architecture || scan.architecture,
    risk_level: answers.risk_level || "medium",
    conventions: {
      naming: answers.naming || "<fill in>",
      git_workflow: answers.git_workflow || "github-flow",
      testing_strategy: answers.testing_strategy || "<fill in>",
    },
    protected_paths: answers.protected_paths || buildProtectedPaths(scan),
    providers: answers.providers || scan.providers,
    ...(scan.monorepo ? { monorepo: scan.monorepo } : {}),
  };
}

function buildProtectedPaths(scan) {
  const paths = [".env*"];
  if (scan.target) {
    // Check common protected dirs
    const candidates = [
      "prisma/migrations/",
      "migrations/",
      "db/migrations/",
    ];
    // We just add common ones; detection was done in scan
    if (scan.frameworks?.includes("prisma")) {
      paths.push("prisma/migrations/");
    }
  }
  return paths;
}

/**
 * Determine which artifacts should be generated based on scan + strategy.
 * Returns a list of planned artifacts with metadata.
 */
export function buildArtifactPlan(scan, profile, selectedItems) {
  const artifacts = [];
  const strategy = scan.strategy;

  // Core artifacts (always proposed for greenfield, conditional for brownfield)
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
      action: scan.existing_configs.agents_md ? "propose" : "create",
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
      action: scan.existing_configs.copilot_instructions ? "propose" : "create",
    });
  }

  // Path-specific instructions based on detected stack
  const instructionCandidates = getInstructionCandidates(scan, profile);
  for (const instr of instructionCandidates) {
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

  // VS Code settings
  if (shouldInclude("vscode-settings", scan, selectedItems)) {
    artifacts.push({
      id: "vscode-settings",
      label: ".vscode/settings.json (instruction discovery)",
      description: "Enable Copilot Chat to find path-specific instructions",
      stagePath: ".vscode/settings.json",
      targetPath: ".vscode/settings.json",
      category: "ide",
      action: scan.existing_configs.vscode_instruction_discovery ? "skip" : "create",
    });
  }

  // Skills (only if explicitly selected)
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

  return artifacts;
}

/**
 * Get instruction templates that match the detected stack.
 */
function getInstructionCandidates(scan, profile) {
  const candidates = [];
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

  // Frontend detection
  const hasFrontend =
    frameworks.some((f) => ["react", "nextjs", "vue", "angular", "svelte", "sveltekit"].includes(f)) ||
    (arch === "monorepo" && scan.monorepo?.packages?.some((p) => p.includes("web") || p.includes("ui")));
  if (hasFrontend) {
    candidates.push({
      id: "instr-frontend",
      filename: "frontend.instructions.md",
      description: "Frontend/UI component conventions",
      templateFile: "frontend.instructions.md",
    });
  }

  // Backend detection
  const hasBackend =
    frameworks.some((f) => ["express", "fastify", "nestjs", "django", "fastapi", "flask", "gin", "fiber"].includes(f)) ||
    (arch === "monorepo" && scan.monorepo?.packages?.some((p) => p.includes("api") || p.includes("server")));
  if (hasBackend) {
    candidates.push({
      id: "instr-backend",
      filename: "backend.instructions.md",
      description: "Backend/API conventions",
      templateFile: "backend.instructions.md",
    });
  }

  // Tests (always if test framework detected)
  if (frameworks.some((f) => ["vitest", "jest", "mocha", "pytest", "playwright", "cypress"].includes(f))) {
    candidates.push({
      id: "instr-tests",
      filename: "tests.instructions.md",
      description: "Testing conventions and patterns",
      templateFile: "tests.instructions.md",
    });
  }

  // Infra (if workflows or IaC exist)
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

function shouldInclude(id, scan, selectedItems) {
  // If user explicitly selected items, respect that
  if (selectedItems && selectedItems.length > 0) {
    return selectedItems.includes(id);
  }
  // Default: include everything for greenfield, be conservative for brownfield
  if (scan.strategy === "greenfield") return true;
  // For brownfield, skip skills by default
  if (id === "starter-skills") return false;
  return true;
}

/**
 * Generate a staging manifest to make apply safe.
 */
export function buildManifest(artifacts, profile, scan) {
  return {
    version: "2.0.0",
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

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
