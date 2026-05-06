/**
 * Capsule — standards capsule installer for target repos.
 *
 * Creates .framework/standards.json and .framework/standards-summary.md
 * in target repositories, linking them back to copilot-quickstart upstream.
 */

import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { LIBRARY_ROOT } from "./constants.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const CAPSULE_DIR = ".framework";
const CAPSULE_JSON = "standards.json";
const CAPSULE_SUMMARY = "standards-summary.md";
const TEMPLATE_PATH = join(LIBRARY_ROOT, "tools", "onboard", "templates", "standards-summary.md");

const MARKER_BEGIN = "<!-- QUICKSTART-STANDARDS:BEGIN -->";
const MARKER_END = "<!-- QUICKSTART-STANDARDS:END -->";

const DEFAULT_LOCAL_PATHS: Record<string, string> = {
  agents_doc: "AGENTS.md",
  repo_instructions: ".github/copilot-instructions.md",
  skills_root: ".ai/skills",
  meta_skills_root: ".ai/skills/_meta",
  instructions_dir: ".github/instructions",
  agents_dir: ".ai/agents",
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CapsuleOptions {
  version?: string;
  repo?: string;
  docsBaseUrl?: string;
  localPaths?: Record<string, string>;
}

interface CapsuleManifest {
  upstream: { repo: string; ref: string; docs_base_url: string };
  local: Record<string, string>;
  installed_at: string;
  updated_at: string;
}

interface CapsuleResult {
  jsonPath: string;
  summaryPath: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in values ? values[key]! : match;
  });
}

function buildPlaceholders(options: CapsuleOptions, localPaths: Record<string, string>): Record<string, string> {
  return {
    version: options.version || "main",
    upstream_repo: options.repo || "eduardohilariodev/copilot-quickstart",
    upstream_ref: options.version || "main",
    docs_base_url: options.docsBaseUrl || `https://github.com/${options.repo || "eduardohilariodev/copilot-quickstart"}/tree/${options.version || "main"}/source-of-truth`,
    agents_dir: localPaths.agents_dir || DEFAULT_LOCAL_PATHS.agents_dir!,
    skills_root: localPaths.skills_root || DEFAULT_LOCAL_PATHS.skills_root!,
    repo_instructions: localPaths.repo_instructions || DEFAULT_LOCAL_PATHS.repo_instructions!,
    instructions_dir: localPaths.instructions_dir || DEFAULT_LOCAL_PATHS.instructions_dir!,
    agents_doc: localPaths.agents_doc || DEFAULT_LOCAL_PATHS.agents_doc!,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function readCapsule(targetDir: string): CapsuleManifest | null {
  // Try new path first
  let capsulePath = join(targetDir, ".framework", CAPSULE_JSON);
  if (!existsSync(capsulePath)) {
    // Fallback to legacy path
    capsulePath = join(targetDir, ".ai", "system", CAPSULE_JSON);
  }
  if (!existsSync(capsulePath)) return null;
  try {
    return JSON.parse(readFileSync(capsulePath, "utf8"));
  } catch {
    return null;
  }
}

export function installCapsule(targetDir: string, options: CapsuleOptions = {}): CapsuleResult {
  const localPaths = { ...DEFAULT_LOCAL_PATHS, ...options.localPaths };
  const now = new Date().toISOString();

  const capsule: CapsuleManifest = {
    upstream: {
      repo: options.repo || "eduardohilariodev/copilot-quickstart",
      ref: options.version || "main",
      docs_base_url: options.docsBaseUrl || `https://github.com/${options.repo || "eduardohilariodev/copilot-quickstart"}/tree/${options.version || "main"}/source-of-truth`,
    },
    local: localPaths,
    installed_at: now,
    updated_at: now,
  };

  const dir = join(targetDir, CAPSULE_DIR);
  mkdirSync(dir, { recursive: true });

  const jsonPath = join(dir, CAPSULE_JSON);
  writeFileSync(jsonPath, JSON.stringify(capsule, null, 2) + "\n", "utf8");

  const summaryPath = join(dir, CAPSULE_SUMMARY);
  const placeholders = buildPlaceholders(options, localPaths);

  if (existsSync(TEMPLATE_PATH)) {
    const template = readFileSync(TEMPLATE_PATH, "utf8");
    const rendered = renderTemplate(template, placeholders);
    writeFileSync(summaryPath, rendered, "utf8");
  }

  return {
    jsonPath: join(CAPSULE_DIR, CAPSULE_JSON),
    summaryPath: join(CAPSULE_DIR, CAPSULE_SUMMARY),
  };
}

export function updateCapsule(targetDir: string, options: CapsuleOptions = {}): CapsuleResult | null {
  const existing = readCapsule(targetDir);
  if (!existing) return null;

  const updated: CapsuleManifest = {
    ...existing,
    upstream: {
      repo: options.repo || existing.upstream.repo,
      ref: options.version || existing.upstream.ref,
      docs_base_url: options.docsBaseUrl || existing.upstream.docs_base_url,
    },
    updated_at: new Date().toISOString(),
  };

  const dir = join(targetDir, CAPSULE_DIR);

  const jsonPath = join(dir, CAPSULE_JSON);
  writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + "\n", "utf8");

  const summaryPath = join(dir, CAPSULE_SUMMARY);
  if (existsSync(summaryPath) && existsSync(TEMPLATE_PATH)) {
    const currentContent = readFileSync(summaryPath, "utf8");
    const template = readFileSync(TEMPLATE_PATH, "utf8");

    const beginIdx = currentContent.indexOf(MARKER_BEGIN);
    const endIdx = currentContent.indexOf(MARKER_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      const localPaths = updated.local || DEFAULT_LOCAL_PATHS;
      const placeholders = buildPlaceholders(
        { version: updated.upstream.ref, repo: updated.upstream.repo, docsBaseUrl: updated.upstream.docs_base_url },
        localPaths
      );
      const renderedTemplate = renderTemplate(template, placeholders);

      const tmplBegin = renderedTemplate.indexOf(MARKER_BEGIN);
      const tmplEnd = renderedTemplate.indexOf(MARKER_END);

      if (tmplBegin !== -1 && tmplEnd !== -1) {
        const freshSection = renderedTemplate.slice(tmplBegin, tmplEnd + MARKER_END.length);
        const before = currentContent.slice(0, beginIdx);
        const after = currentContent.slice(endIdx + MARKER_END.length);
        writeFileSync(summaryPath, before + freshSection + after, "utf8");
      }
    }
  }

  return {
    jsonPath: join(CAPSULE_DIR, CAPSULE_JSON),
    summaryPath: join(CAPSULE_DIR, CAPSULE_SUMMARY),
  };
}

export function stageCapsule(stagingDir: string, options: CapsuleOptions = {}): { files: string[] } {
  const localPaths = { ...DEFAULT_LOCAL_PATHS, ...options.localPaths };
  const now = new Date().toISOString();

  const capsule: CapsuleManifest = {
    upstream: {
      repo: options.repo || "eduardohilariodev/copilot-quickstart",
      ref: options.version || "main",
      docs_base_url: options.docsBaseUrl || `https://github.com/${options.repo || "eduardohilariodev/copilot-quickstart"}/tree/${options.version || "main"}/source-of-truth`,
    },
    local: localPaths,
    installed_at: now,
    updated_at: now,
  };

  const dir = join(stagingDir, CAPSULE_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, CAPSULE_JSON), JSON.stringify(capsule, null, 2) + "\n", "utf8");

  const placeholders = buildPlaceholders(options, localPaths);
  const files = [join(CAPSULE_DIR, CAPSULE_JSON)];

  if (existsSync(TEMPLATE_PATH)) {
    const template = readFileSync(TEMPLATE_PATH, "utf8");
    const rendered = renderTemplate(template, placeholders);
    writeFileSync(join(dir, CAPSULE_SUMMARY), rendered, "utf8");
    files.push(join(CAPSULE_DIR, CAPSULE_SUMMARY));
  }

  return { files };
}
