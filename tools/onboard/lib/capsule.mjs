import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the copilot-quickstart repository (three levels up from lib/) */
export const QUICKSTART_ROOT = join(__dirname, "..", "..", "..");

const CAPSULE_DIR = ".ai/system";
const CAPSULE_JSON = "standards.json";
const CAPSULE_SUMMARY = "standards-summary.md";
const TEMPLATE_PATH = join(QUICKSTART_ROOT, "templates", "standards-summary.md");

const MARKER_BEGIN = "<!-- QUICKSTART-STANDARDS:BEGIN -->";
const MARKER_END = "<!-- QUICKSTART-STANDARDS:END -->";

// Default local paths matching the schema defaults
const DEFAULT_LOCAL_PATHS = {
  agents_doc: "AGENTS.md",
  repo_instructions: ".github/copilot-instructions.md",
  skills_root: ".ai/skills",
  meta_skills_root: ".ai/meta-skills",
  instructions_dir: ".github/instructions",
  agents_dir: ".ai/agents",
};

/**
 * Replace {{placeholder}} tokens in template content with values.
 */
function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in values ? values[key] : match;
  });
}

/**
 * Build the placeholder values map from options + local paths.
 */
function buildPlaceholders(options, localPaths) {
  return {
    version: options.version || "main",
    upstream_repo: options.repo || "eduardohilariodev/copilot-quickstart",
    upstream_ref: options.version || "main",
    docs_base_url: options.docsBaseUrl || `https://github.com/${options.repo || "eduardohilariodev/copilot-quickstart"}/tree/${options.version || "main"}/source-of-truth`,
    agents_dir: localPaths.agents_dir || DEFAULT_LOCAL_PATHS.agents_dir,
    skills_root: localPaths.skills_root || DEFAULT_LOCAL_PATHS.skills_root,
    repo_instructions: localPaths.repo_instructions || DEFAULT_LOCAL_PATHS.repo_instructions,
    instructions_dir: localPaths.instructions_dir || DEFAULT_LOCAL_PATHS.instructions_dir,
    agents_doc: localPaths.agents_doc || DEFAULT_LOCAL_PATHS.agents_doc,
  };
}

/**
 * Read the capsule manifest from a target directory.
 * @param {string} targetDir - Absolute path to the target repo root
 * @returns {object|null} Parsed standards.json or null if not found
 */
export function readCapsule(targetDir) {
  const capsulePath = join(targetDir, CAPSULE_DIR, CAPSULE_JSON);
  if (!existsSync(capsulePath)) return null;

  try {
    return JSON.parse(readFileSync(capsulePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Install the standards capsule in a target repo (first run).
 * Creates .ai/system/standards.json and .ai/system/standards-summary.md.
 *
 * @param {string} targetDir - Absolute path to the target repo root
 * @param {object} options
 * @param {string} [options.version] - Upstream git ref (default: "main")
 * @param {string} [options.repo] - Upstream repo identifier
 * @param {string} [options.docsBaseUrl] - URL prefix for docs
 * @param {object} [options.localPaths] - Override local path mappings
 * @returns {{ jsonPath: string, summaryPath: string }} Paths written (relative to targetDir)
 */
export function installCapsule(targetDir, options = {}) {
  const localPaths = { ...DEFAULT_LOCAL_PATHS, ...options.localPaths };
  const now = new Date().toISOString();

  const capsule = {
    upstream: {
      repo: options.repo || "eduardohilariodev/copilot-quickstart",
      ref: options.version || "main",
      docs_base_url: options.docsBaseUrl || `https://github.com/${options.repo || "eduardohilariodev/copilot-quickstart"}/tree/${options.version || "main"}/source-of-truth`,
    },
    local: localPaths,
    installed_at: now,
    updated_at: now,
  };

  // Ensure directory
  const dir = join(targetDir, CAPSULE_DIR);
  mkdirSync(dir, { recursive: true });

  // Write standards.json
  const jsonPath = join(dir, CAPSULE_JSON);
  writeFileSync(jsonPath, JSON.stringify(capsule, null, 2) + "\n", "utf8");

  // Render and write standards-summary.md
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

/**
 * Update an existing capsule — refreshes upstream block and marked content only.
 *
 * @param {string} targetDir - Absolute path to the target repo root
 * @param {object} options
 * @param {string} [options.version] - New upstream git ref
 * @param {string} [options.repo] - New upstream repo identifier
 * @param {string} [options.docsBaseUrl] - New docs URL prefix
 * @returns {{ jsonPath: string, summaryPath: string }|null} Paths updated, or null if no capsule found
 */
export function updateCapsule(targetDir, options = {}) {
  const existing = readCapsule(targetDir);
  if (!existing) return null;

  // Update upstream + updated_at, preserve local + installed_at
  const updated = {
    ...existing,
    upstream: {
      repo: options.repo || existing.upstream.repo,
      ref: options.version || existing.upstream.ref,
      docs_base_url: options.docsBaseUrl || existing.upstream.docs_base_url,
    },
    updated_at: new Date().toISOString(),
  };

  const dir = join(targetDir, CAPSULE_DIR);

  // Write updated standards.json
  const jsonPath = join(dir, CAPSULE_JSON);
  writeFileSync(jsonPath, JSON.stringify(updated, null, 2) + "\n", "utf8");

  // Update standards-summary.md between markers
  const summaryPath = join(dir, CAPSULE_SUMMARY);
  if (existsSync(summaryPath) && existsSync(TEMPLATE_PATH)) {
    const currentContent = readFileSync(summaryPath, "utf8");
    const template = readFileSync(TEMPLATE_PATH, "utf8");

    const beginIdx = currentContent.indexOf(MARKER_BEGIN);
    const endIdx = currentContent.indexOf(MARKER_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      // Extract fresh marked section from rendered template
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

        // Replace only the marked section in the existing file
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

/**
 * Stage capsule files into the staging directory (for CLI integration).
 * Writes capsule artifacts to stagingDir/.ai/system/ so they get applied
 * alongside other staged artifacts.
 *
 * @param {string} stagingDir - Absolute path to the staging directory (ai-setup/)
 * @param {object} options - Same options as installCapsule
 * @returns {{ files: string[] }} List of relative paths staged
 */
export function stageCapsule(stagingDir, options = {}) {
  const localPaths = { ...DEFAULT_LOCAL_PATHS, ...options.localPaths };
  const now = new Date().toISOString();

  const capsule = {
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

  // Write standards.json
  writeFileSync(
    join(dir, CAPSULE_JSON),
    JSON.stringify(capsule, null, 2) + "\n",
    "utf8"
  );

  // Render and write standards-summary.md
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
