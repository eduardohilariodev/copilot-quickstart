import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const VERSION = "2.0.0";

// Library root (this repo)
export const LIBRARY_ROOT = resolve(__dirname, "..", "..", "..");
export const SKILLS_DIR = join(LIBRARY_ROOT, "templates", "skills");
export const AGENTS_DIR = join(LIBRARY_ROOT, "templates", "agents");
export const INSTRUCTIONS_DIR = join(LIBRARY_ROOT, "templates", "instructions");
export const TEMPLATES_DIR = join(LIBRARY_ROOT, "templates");

// Staging
export const STAGING_DIR_NAME = "ai-setup";
export const MANIFEST_FILE = ".manifest.json";

// Directories to skip during scanning
export const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "vendor",
  "target",
  ".turbo",
  ".nx",
  STAGING_DIR_NAME,
]);

// File detection maps
export const LANGUAGE_INDICATORS = {
  "package.json": "typescript",
  "tsconfig.json": "typescript",
  "jsconfig.json": "javascript",
  "pyproject.toml": "python",
  "requirements.txt": "python",
  "setup.py": "python",
  "go.mod": "go",
  "Cargo.toml": "rust",
  "pom.xml": "java",
  "build.gradle": "java",
  "build.gradle.kts": "kotlin",
  "Gemfile": "ruby",
  "mix.exs": "elixir",
  "composer.json": "php",
  "Package.swift": "swift",
  "*.csproj": "csharp",
};

export const FRAMEWORK_MAP = {
  next: "nextjs",
  react: "react",
  "react-dom": "react",
  vue: "vue",
  "@angular/core": "angular",
  svelte: "svelte",
  "@sveltejs/kit": "sveltekit",
  express: "express",
  fastify: "fastify",
  "@nestjs/core": "nestjs",
  prisma: "prisma",
  "@prisma/client": "prisma",
  drizzle: "drizzle",
  tailwindcss: "tailwindcss",
  vitest: "vitest",
  jest: "jest",
  mocha: "mocha",
  playwright: "playwright",
  "@playwright/test": "playwright",
  cypress: "cypress",
  storybook: "storybook",
  "@storybook/react": "storybook",
  turborepo: "turborepo",
};

export const RISK_LEVELS = ["low", "medium", "high", "critical"];
export const ARCHITECTURES = [
  "monolith",
  "monorepo",
  "microservices",
  "serverless",
  "library",
  "cli",
];
export const PROVIDERS = ["copilot", "claude", "cursor"];

// Meta-skills directory
export const META_SKILLS_DIR = join(LIBRARY_ROOT, "meta-skills");

// Maintenance meta-skills to copy into target repos for self-maintenance
export const MAINTENANCE_SKILLS = [
  "detect-drift",
  "health-dashboard",
  "audit-skills",
  "lint-instructions",
  "sync-config",
];

// Deployment platform indicators
export const DEPLOYMENT_INDICATORS = {
  "vercel.json": "vercel",
  "netlify.toml": "netlify",
  "fly.toml": "fly",
  "railway.json": "railway",
  "railway.toml": "railway",
  "render.yaml": "render",
  "serverless.yml": "serverless",
  "serverless.yaml": "serverless",
  "Dockerfile": "docker",
  "docker-compose.yml": "docker",
  "docker-compose.yaml": "docker",
};

// Map detected signals to recommended starter skills
export const SKILL_RECOMMENDATIONS = {
  ci: ["ci-health-check", "ci-cd-starter"],
  testing: ["test-generator", "test-failure-diagnoser", "test-strategy-doc"],
  git: ["git-commit-message", "git-branch-and-pr", "git-cleanup"],
  deployment: ["deploy-playbook", "infra-sanity"],
  general: ["safe-refactor", "plan-and-scope-change", "shell-ops"],
  onboarding: ["project-onboarding", "context-curator"],
};
