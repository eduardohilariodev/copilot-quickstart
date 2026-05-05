#!/usr/bin/env node
//
// Validates project artifacts:
//   1. examples/target-repo/repo-profile.yml has required fields
//   2. meta-skills/<name>/SKILL.md have required sections
//   3. templates/skills/<name>/SKILL.md have required sections
//
// Usage: node tools/validate.mjs
// Exit 0 = all valid, Exit 1 = failures found
//

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = process.cwd();
let passed = 0;
let failed = 0;
const errors = [];

function pass(msg) {
  console.log(`  \u2713 ${msg}`);
  passed++;
}

function fail(msg) {
  console.log(`  \u2717 ${msg}`);
  failed++;
  errors.push(msg);
}

// --- 1. Validate repo-profile.yml ---

console.log("\n\u2500 Repo Profile (examples/target-repo/repo-profile.yml)");

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

  const checks = [
    { name: "Description", match: (h) => h === "Description" },
    {
      name: "Behavior or Steps",
      match: (h) => h === "Behavior" || h === "Steps",
    },
    { name: "Constraints", match: (h) => h === "Constraints" },
  ];

  for (const check of checks) {
    if (headings.some(check.match)) {
      pass(`${rel} → has "${check.name}"`);
    } else {
      fail(`${rel} → missing "${check.name}"`);
    }
  }
}

// Meta-skills
console.log("\n\u2500 Meta-skills (meta-skills/*/SKILL.md)");
const metaSkills = findSkillFiles("meta-skills");
if (metaSkills.length === 0) {
  fail("no meta-skill SKILL.md files found");
} else {
  for (const f of metaSkills) validateSkillFile(f);
}

// Template skills
console.log("\n\u2500 Template skills (templates/skills/*/SKILL.md)");
const templateSkills = findSkillFiles(join("templates", "skills"));
if (templateSkills.length === 0) {
  fail("no template skill SKILL.md files found");
} else {
  for (const f of templateSkills) validateSkillFile(f);
}

// --- Summary ---
const total = passed + failed;
console.log(`\n${"━".repeat(50)}`);
console.log(`  ${passed}/${total} checks passed`);
if (failed > 0) {
  console.log(`  ${failed} failure(s)\n`);
  process.exit(1);
} else {
  console.log("  All checks passed! \u2714\n");
  process.exit(0);
}
