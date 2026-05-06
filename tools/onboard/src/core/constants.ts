/**
 * Core constants — detection maps, config values, paths.
 * Pure data, no side effects.
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Version ────────────────────────────────────────────────────────────────

export const VERSION = "3.0.0";

// ─── Library Paths ──────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the copilot-quickstart repository (four levels up from src/core/) */
export const LIBRARY_ROOT = resolve(__dirname, "..", "..", "..", "..");
export const SKILLS_DIR = join(LIBRARY_ROOT, "skills", "_default");
export const AGENTS_DIR = join(LIBRARY_ROOT, "agents");
export const INSTRUCTIONS_DIR = join(LIBRARY_ROOT, "instructions");
export const TEMPLATES_DIR = join(LIBRARY_ROOT, "tools", "onboard", "templates");
export const META_SKILLS_DIR = join(LIBRARY_ROOT, "skills", "_meta");
export const FRAMEWORK_DIR = join(LIBRARY_ROOT, ".framework");

// ─── Staging ────────────────────────────────────────────────────────────────

export const STAGING_DIR_NAME = "ai-setup";
export const MANIFEST_FILE = ".manifest.json";

// ─── Detection Maps ─────────────────────────────────────────────────────────

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

export const LANGUAGE_INDICATORS: Record<string, string> = {
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

export const FRAMEWORK_MAP: Record<string, string> = {
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

export const DEPLOYMENT_INDICATORS: Record<string, string> = {
  "vercel.json": "vercel",
  "netlify.toml": "netlify",
  "fly.toml": "fly",
  "railway.json": "railway",
  "railway.toml": "railway",
  "render.yaml": "render",
  "serverless.yml": "serverless",
  "serverless.yaml": "serverless",
  Dockerfile: "docker",
  "docker-compose.yml": "docker",
  "docker-compose.yaml": "docker",
};

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const ARCHITECTURES = [
  "monolith",
  "monorepo",
  "microservices",
  "serverless",
  "library",
  "cli",
] as const;
export type Architecture = (typeof ARCHITECTURES)[number];

export const PROVIDERS = ["copilot", "claude", "cursor"] as const;
export type Provider = (typeof PROVIDERS)[number];

// ─── Maintenance Skills ─────────────────────────────────────────────────────

export const MAINTENANCE_SKILLS = [
  "detect-drift",
  "health-dashboard",
  "audit-skills",
  "lint-instructions",
  "sync-config",
];

// ─── Skill Recommendations ──────────────────────────────────────────────────

export const SKILL_RECOMMENDATIONS: Record<string, string[]> = {
  core: ["git-commit", "git-branch-pr", "plan-change", "context-pick", "review-self"],
  git: ["git-commit", "git-branch-pr", "git-cleanup", "git-undo"],
  testing: ["test-generate", "test-diagnose", "test-strategy"],
  docs: ["doc-write", "doc-readme", "doc-adr", "doc-changelog"],
  "ci-ops": ["ci-starter", "ci-health", "deploy-guide", "shell-safe"],
  deployment: ["deploy-guide", "infra-sanity"],
  onboarding: ["project-onboard", "context-pick"],
};
