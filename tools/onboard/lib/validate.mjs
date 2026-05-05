#!/usr/bin/env node
//
// Validates project artifacts:
//   1. examples/target-repo/repo-profile.yml has required fields
//   2. meta-skills/<name>/SKILL.md have required sections
//   3. templates/skills/<name>/SKILL.md have required sections
//   4. Size threshold checks per maintenance-principles.md
//   5. Naming convention checks per naming-conventions.md
//   6. Template placeholder syntax validation
//
// Usage: node tools/onboard/bin/cli.mjs validate [--json]
// Exit 0 = all valid, Exit 1 = failures found
//

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

/**
 * Run all validation checks against the project root.
 * @param {object} options
 * @param {boolean} options.json - If true, suppress logs and return structured data
 * @param {string} options.root - Project root directory (defaults to process.cwd())
 * @returns {{ passed: number, failed: number, errors: string[], checks: object }}
 */
export async function runValidate(options = {}) {
  const ROOT = options.root || process.cwd();
  const JSON_MODE = options.json || false;

  // Per-category tracking for JSON output
  const checks = {
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
  const errors = [];

  function log(msg) {
    if (!JSON_MODE) console.log(msg);
  }

  function pass(msg) {
    log(`  \u2713 ${msg}`);
    passed++;
    checks[currentCategory].passed++;
  }

  function fail(msg) {
    log(`  \u2717 ${msg}`);
    failed++;
    errors.push(msg);
    checks[currentCategory].failed++;
    checks[currentCategory].errors.push(msg);
  }

  // --- 1. Validate repo-profile.yml ---
  currentCategory = "repo_profile";

  log("\n\u2500 Repo Profile (examples/target-repo/repo-profile.yml)");

  const profilePath = join(ROOT, "examples", "target-repo", "repo-profile.yml");
  const requiredKeys = ["name", "languages", "architecture", "risk_level", "providers"];

  try {
    const content = readFileSync(profilePath, "utf-8");
    const lines = content.split("\n");

    // Simple YAML key check: lines that start with `key:` (top-level, no indentation)
    const topLevelKeys = lines
      .filter((l) => /^[a-z_]+\s*:/.test(l))
      .map((l) => l.match(/^([a-z_]+)\s*:/)[1]);

    for (const key of requiredKeys) {
      if (topLevelKeys.includes(key)) {
        pass(`has key "${key}"`);
      } else {
        fail(`missing required key "${key}" in repo-profile.yml`);
      }
    }
  } catch (e) {
    fail(`cannot read repo-profile.yml: ${e.message}`);
  }

  // --- 2 & 3. Validate SKILL.md files ---

  /**
   * Globs directories matching pattern `baseDir/(*)/SKILL.md`
   */
  function findSkillFiles(baseDir) {
    const abs = join(ROOT, baseDir);
    try {
      return readdirSync(abs)
        .filter((d) => statSync(join(abs, d)).isDirectory())
        .map((d) => join(abs, d, "SKILL.md"))
        .filter((f) => {
          try {
            statSync(f);
            return true;
          } catch {
            return false;
          }
        });
    } catch {
      return [];
    }
  }

  /**
   * Check that a SKILL.md contains required sections.
   * Accepts headings at any level (##, ###, etc.)
   */
  function validateSkillFile(filePath) {
    const content = readFileSync(filePath, "utf-8");
    const rel = relative(ROOT, filePath);

    // Extract all headings
    const headings = content
      .split("\n")
      .filter((l) => /^#{1,4}\s+/.test(l))
      .map((l) => l.replace(/^#+\s+/, "").trim());

    const sectionChecks = [
      { name: "Description", match: (h) => h === "Description" },
      {
        name: "Behavior or Steps",
        match: (h) => h === "Behavior" || h === "Steps",
      },
      { name: "Constraints", match: (h) => h === "Constraints" },
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
  log("\n\u2500 Meta-skills (meta-skills/*/SKILL.md)");
  const metaSkills = findSkillFiles("meta-skills");
  if (metaSkills.length === 0) {
    fail("no meta-skill SKILL.md files found");
  } else {
    for (const f of metaSkills) validateSkillFile(f);
  }

  // Template skills
  currentCategory = "template_skills_sections";
  log("\n\u2500 Template skills (templates/skills/*/SKILL.md)");
  const templateSkills = findSkillFiles(join("templates", "skills"));
  if (templateSkills.length === 0) {
    fail("no template skill SKILL.md files found");
  } else {
    for (const f of templateSkills) validateSkillFile(f);
  }

  // --- 4. Size Threshold Checks ---
  currentCategory = "size_thresholds";
  log("\n\u2500 Size Thresholds");

  function checkFileSize(filePath, maxLines, label) {
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
      fail(`${label}: cannot read file: ${e.message}`);
    }
  }

  // meta-skills/*/SKILL.md ≤200 lines
  for (const f of metaSkills) {
    checkFileSize(f, 200, relative(ROOT, f));
  }

  // templates/skills/*/SKILL.md ≤200 lines
  for (const f of templateSkills) {
    checkFileSize(f, 200, relative(ROOT, f));
  }

  // AGENTS.md at repo root ≤120 lines
  checkFileSize(join(ROOT, "AGENTS.md"), 120, "AGENTS.md");

  // templates/instructions/ files ≤80 lines
  const instructionsDir = join(ROOT, "templates", "instructions");
  try {
    const instrFiles = readdirSync(instructionsDir).filter((f) => {
      try {
        return statSync(join(instructionsDir, f)).isFile();
      } catch {
        return false;
      }
    });
    for (const f of instrFiles) {
      checkFileSize(join(instructionsDir, f), 80, f);
    }
  } catch (e) {
    fail(`cannot read templates/instructions/: ${e.message}`);
  }

  // --- 5. Naming Convention Checks ---
  currentCategory = "naming";
  log("\n\u2500 Naming Conventions");

  const KEBAB_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+){1,3}$/;

  // Meta-skill directory names: kebab-case, verb-noun (2-4 segments)
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
    fail(`cannot read meta-skills/: ${e.message}`);
  }

  // Template skill directory names: kebab-case (2-4 segments)
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
    fail(`cannot read templates/skills/: ${e.message}`);
  }

  // --- 6. Template Placeholder Syntax ---
  currentCategory = "placeholders";
  log("\n\u2500 Template Placeholder Syntax");

  const VALID_PLACEHOLDER = /\{\{[a-z_]+[a-z0-9_]*\}\}/g;
  const ANY_OPEN_BRACE = /\{\{/g;

  function findMdFilesRecursive(dir) {
    const results = [];
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
        } catch {
          // skip inaccessible
        }
      }
    } catch {
      // skip inaccessible dirs
    }
    return results;
  }

  const templatesMdFiles = findMdFilesRecursive(join(ROOT, "templates"));

  for (const filePath of templatesMdFiles) {
    const content = readFileSync(filePath, "utf-8");
    const rel = relative(ROOT, filePath);

    // Only check files that contain {{ at all
    const openBraces = content.match(ANY_OPEN_BRACE);
    if (!openBraces) continue;

    // Find all valid placeholders and count them
    const validMatches = content.match(VALID_PLACEHOLDER) || [];

    // Find all {{ occurrences and check if each is part of a valid placeholder
    let hasMalformed = false;
    const malformedList = [];
    const mdLines = content.split("\n");
    for (let i = 0; i < mdLines.length; i++) {
      const line = mdLines[i];
      let idx = 0;
      while ((idx = line.indexOf("{{", idx)) !== -1) {
        // Extract the potential placeholder starting at idx
        const rest = line.slice(idx);
        const fullMatch = rest.match(/^\{\{[a-z_]+[a-z0-9_]*\}\}/);
        if (!fullMatch) {
          // Malformed placeholder
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
    const result = {
      passed,
      failed,
      errors,
      checks: {},
    };
    for (const [key, val] of Object.entries(checks)) {
      result.checks[key] = { passed: val.passed, failed: val.failed };
      if (val.errors.length > 0) {
        result.checks[key].errors = val.errors;
      }
    }
    console.log(JSON.stringify(result, null, 2));
  } else {
    log(`\n${"━".repeat(50)}`);
    log(`  ${passed}/${total} checks passed`);
    if (failed > 0) {
      log(`  ${failed} failure(s)\n`);
    } else {
      log("  All checks passed! \u2714\n");
    }
  }

  return { passed, failed, errors, checks };
}

// Run directly if invoked as a script
const isDirectRun =
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` ||
  import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;

if (isDirectRun) {
  const json = process.argv.includes("--json");
  const { failed } = await runValidate({ json });
  process.exit(failed > 0 ? 1 : 0);
}
