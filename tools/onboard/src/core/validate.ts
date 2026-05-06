/**
 * Validate — project artifact validation checks.
 *
 * Checks: repo-profile.yml keys, SKILL.md sections, size thresholds,
 * naming conventions, template placeholder syntax.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { LIBRARY_ROOT } from "./constants.js";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CategoryResult {
  passed: number;
  failed: number;
  errors: string[];
}

export interface ValidateResult {
  passed: number;
  failed: number;
  errors: string[];
  checks: Record<string, CategoryResult>;
}

export interface ValidateOptions {
  json?: boolean;
  root?: string;
}

// ─── Implementation ─────────────────────────────────────────────────────────

export async function runValidate(options: ValidateOptions = {}): Promise<ValidateResult> {
  const ROOT = options.root || LIBRARY_ROOT;
  const JSON_MODE = options.json || false;

  const checks: Record<string, CategoryResult> = {
    repo_profile: { passed: 0, failed: 0, errors: [] },
    meta_skills_sections: { passed: 0, failed: 0, errors: [] },
    template_skills_sections: { passed: 0, failed: 0, errors: [] },
    size_thresholds: { passed: 0, failed: 0, errors: [] },
    naming: { passed: 0, failed: 0, errors: [] },
    placeholders: { passed: 0, failed: 0, errors: [] },
  };
  let currentCategory = "repo_profile";

  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function log(msg: string): void {
    if (!JSON_MODE) console.log(msg);
  }

  function pass(msg: string): void {
    log(`  ✓ ${msg}`);
    passed++;
    checks[currentCategory]!.passed++;
  }

  function fail(msg: string): void {
    log(`  ✗ ${msg}`);
    failed++;
    errors.push(msg);
    checks[currentCategory]!.failed++;
    checks[currentCategory]!.errors.push(msg);
  }

  // --- 1. Validate repo-profile.yml ---
  currentCategory = "repo_profile";
  log("\n─ Repo Profile (examples/target-repo/repo-profile.yml)");

  const profilePath = join(ROOT, "examples", "target-repo", "repo-profile.yml");
  const requiredKeys = ["name", "languages", "architecture", "risk_level", "providers"];

  try {
    const content = readFileSync(profilePath, "utf-8");
    const lines = content.split("\n");
    const topLevelKeys = lines
      .filter((l) => /^[a-z_]+\s*:/.test(l))
      .map((l) => l.match(/^([a-z_]+)\s*:/)![1]);

    for (const key of requiredKeys) {
      if (topLevelKeys.includes(key)) {
        pass(`has key "${key}"`);
      } else {
        fail(`missing required key "${key}" in repo-profile.yml`);
      }
    }
  } catch (e) {
    fail(`cannot read repo-profile.yml: ${(e as Error).message}`);
  }

  // --- 2 & 3. Validate SKILL.md files ---

  function findSkillFiles(baseDir: string): string[] {
    const abs = join(ROOT, baseDir);
    try {
      return readdirSync(abs)
        .filter((d) => statSync(join(abs, d)).isDirectory())
        .map((d) => join(abs, d, "SKILL.md"))
        .filter((f) => {
          try { statSync(f); return true; } catch { return false; }
        });
    } catch {
      return [];
    }
  }

  function validateSkillFile(filePath: string): void {
    const content = readFileSync(filePath, "utf-8");
    const rel = relative(ROOT, filePath);

    const headings = content
      .split("\n")
      .filter((l) => /^#{1,4}\s+/.test(l))
      .map((l) => l.replace(/^#+\s+/, "").trim());

    const sectionChecks = [
      { name: "Description", match: (h: string) => h === "Description" },
      { name: "Behavior or Steps", match: (h: string) => h === "Behavior" || h === "Steps" },
      { name: "Constraints", match: (h: string) => h === "Constraints" },
    ];

    for (const check of sectionChecks) {
      if (headings.some(check.match)) {
        pass(`${rel} → has "${check.name}"`);
      } else {
        fail(`${rel} → missing "${check.name}"`);
      }
    }
  }

  // Meta-skills
  currentCategory = "meta_skills_sections";
  log("\n─ Meta-skills (meta-skills/*/SKILL.md)");
  const metaSkills = findSkillFiles("meta-skills");
  if (metaSkills.length === 0) {
    fail("no meta-skill SKILL.md files found");
  } else {
    for (const f of metaSkills) validateSkillFile(f);
  }

  // Template skills
  currentCategory = "template_skills_sections";
  log("\n─ Template skills (templates/skills/*/SKILL.md)");
  const templateSkills = findSkillFiles(join("templates", "skills"));
  if (templateSkills.length === 0) {
    fail("no template skill SKILL.md files found");
  } else {
    for (const f of templateSkills) validateSkillFile(f);
  }

  // --- 4. Size Threshold Checks ---
  currentCategory = "size_thresholds";
  log("\n─ Size Thresholds");

  function checkFileSize(filePath: string, maxLines: number, label: string): void {
    try {
      const content = readFileSync(filePath, "utf-8");
      const lineCount = content.split("\n").length;
      const rel = relative(ROOT, filePath);
      if (lineCount <= maxLines) {
        pass(`${rel} → ${lineCount} lines (≤${maxLines})`);
      } else {
        fail(`${rel} → ${lineCount} lines exceeds ${maxLines}-line limit`);
      }
    } catch (e) {
      fail(`${label}: cannot read file: ${(e as Error).message}`);
    }
  }

  for (const f of metaSkills) checkFileSize(f, 200, relative(ROOT, f));
  for (const f of templateSkills) checkFileSize(f, 200, relative(ROOT, f));
  checkFileSize(join(ROOT, "AGENTS.md"), 120, "AGENTS.md");

  const instructionsDir = join(ROOT, "templates", "instructions");
  try {
    const instrFiles = readdirSync(instructionsDir).filter((f) => {
      try { return statSync(join(instructionsDir, f)).isFile(); } catch { return false; }
    });
    for (const f of instrFiles) checkFileSize(join(instructionsDir, f), 80, f);
  } catch (e) {
    fail(`cannot read templates/instructions/: ${(e as Error).message}`);
  }

  // --- 5. Naming Convention Checks ---
  currentCategory = "naming";
  log("\n─ Naming Conventions");

  const KEBAB_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+){1,3}$/;

  const metaSkillsDir = join(ROOT, "meta-skills");
  try {
    const metaDirs = readdirSync(metaSkillsDir).filter((d) =>
      statSync(join(metaSkillsDir, d)).isDirectory()
    );
    for (const d of metaDirs) {
      if (KEBAB_PATTERN.test(d)) {
        pass(`meta-skills/${d} → valid kebab-case name`);
      } else {
        fail(`meta-skills/${d} → name must be kebab-case (verb-noun, 2-4 segments)`);
      }
    }
  } catch (e) {
    fail(`cannot read meta-skills/: ${(e as Error).message}`);
  }

  const templateSkillsDir = join(ROOT, "templates", "skills");
  try {
    const tplDirs = readdirSync(templateSkillsDir).filter((d) =>
      statSync(join(templateSkillsDir, d)).isDirectory()
    );
    for (const d of tplDirs) {
      if (KEBAB_PATTERN.test(d)) {
        pass(`templates/skills/${d} → valid kebab-case name`);
      } else {
        fail(`templates/skills/${d} → name must be kebab-case (2-4 segments)`);
      }
    }
  } catch (e) {
    fail(`cannot read templates/skills/: ${(e as Error).message}`);
  }

  // --- 6. Template Placeholder Syntax ---
  currentCategory = "placeholders";
  log("\n─ Template Placeholder Syntax");

  const VALID_PLACEHOLDER = /\{\{[a-z_]+[a-z0-9_]*\}\}/g;
  const ANY_OPEN_BRACE = /\{\{/g;

  function findMdFilesRecursive(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            results.push(...findMdFilesRecursive(fullPath));
          } else if (entry.endsWith(".md")) {
            results.push(fullPath);
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
    return results;
  }

  const templatesMdFiles = findMdFilesRecursive(join(ROOT, "templates"));

  for (const filePath of templatesMdFiles) {
    const content = readFileSync(filePath, "utf-8");
    const rel = relative(ROOT, filePath);

    const openBraces = content.match(ANY_OPEN_BRACE);
    if (!openBraces) continue;

    const validMatches = content.match(VALID_PLACEHOLDER) || [];

    let hasMalformed = false;
    const malformedList: string[] = [];
    const mdLines = content.split("\n");
    for (let i = 0; i < mdLines.length; i++) {
      const line = mdLines[i]!;
      let idx = 0;
      while ((idx = line.indexOf("{{", idx)) !== -1) {
        if (idx > 0 && line[idx - 1] === "$") { idx += 2; continue; }
        const rest = line.slice(idx);
        const fullMatch = rest.match(/^\{\{[a-z_]+[a-z0-9_]*\}\}/);
        if (!fullMatch) {
          const snippet = rest.slice(0, 30);
          malformedList.push(`line ${i + 1}: "${snippet}..."`);
          hasMalformed = true;
        }
        idx += 2;
      }
    }

    if (hasMalformed) {
      fail(`${rel} → malformed placeholder(s): ${malformedList.join("; ")}`);
    } else {
      pass(`${rel} → ${validMatches.length} valid placeholder(s)`);
    }
  }

  // --- Summary ---
  const total = passed + failed;

  if (JSON_MODE) {
    const result: Record<string, unknown> = { passed, failed, errors, checks: {} };
    for (const [key, val] of Object.entries(checks)) {
      (result.checks as Record<string, unknown>)[key] = {
        passed: val.passed,
        failed: val.failed,
        ...(val.errors.length > 0 ? { errors: val.errors } : {}),
      };
    }
    console.log(JSON.stringify(result, null, 2));
  } else {
    log(`\n${"━".repeat(50)}`);
    log(`  ${passed}/${total} checks passed`);
    if (failed > 0) {
      log(`  ${failed} failure(s)\n`);
    } else {
      log("  All checks passed! ✔\n");
    }
  }

  return { passed, failed, errors, checks };
}
