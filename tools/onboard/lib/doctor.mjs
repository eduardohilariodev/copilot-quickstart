import pc from "picocolors";
import { scanRepo } from "./detect.mjs";

/**
 * Doctor command — read-only diagnostics and readiness scoring.
 */

// Scoring weights (from source-of-truth/maintenance-principles.md)
const WEIGHTS = {
  context: 0.3,
  verification: 0.25,
  config_hygiene: 0.25,
  safety: 0.2,
};

function scoreContext(scan) {
  let score = 0;
  const findings = [];

  if (scan.existing_configs.agents_md) {
    score += 4;
  } else {
    findings.push("Missing AGENTS.md — no architecture context for AI");
  }

  if (scan.existing_configs.copilot_instructions) {
    score += 3;
    if (scan.existing_configs.copilot_instructions.size > 4000) {
      score -= 1;
      findings.push("copilot-instructions.md is large (>4KB) — may exceed token budget");
    }
  } else {
    findings.push("Missing .github/copilot-instructions.md");
  }

  if (scan.existing_configs.path_instructions) {
    score += 2;
  }

  if (Object.keys(scan.build_commands).length >= 3) {
    score += 1;
  } else {
    findings.push("Few build commands detected — AI may struggle to verify changes");
  }

  return { score: Math.min(10, score), findings };
}

function scoreVerification(scan) {
  let score = 0;
  const findings = [];

  if (scan.build_commands.test) {
    score += 4;
  } else {
    findings.push("No test command detected");
  }

  if (scan.build_commands.lint) {
    score += 2;
  } else {
    findings.push("No lint command detected");
  }

  if (Object.keys(scan.ci).length > 0) {
    score += 3;
  } else {
    findings.push("No CI workflows detected");
  }

  if (scan.build_commands.build) {
    score += 1;
  }

  return { score: Math.min(10, score), findings };
}

function scoreConfigHygiene(scan) {
  let score = 0;
  const findings = [];

  const configCount = Object.keys(scan.existing_configs).length;
  if (configCount >= 3) {
    score += 4;
  } else if (configCount >= 1) {
    score += 2;
  } else {
    findings.push("No AI configuration files detected");
  }

  if (scan.existing_configs.vscode_instruction_discovery) {
    score += 2;
  } else if (scan.existing_configs.path_instructions) {
    findings.push("Path instructions exist but VS Code discovery not configured");
  }

  if (scan.has_existing_profile) {
    score += 2;
  } else {
    findings.push("No repo-profile.yml — meta-skills won't have structured input");
  }

  // Multi-provider alignment
  const providerCount = scan.providers.length;
  if (providerCount > 1) {
    score += 2;
  }

  return { score: Math.min(10, score), findings };
}

function scoreSafety(scan) {
  let score = 5; // Start at 5, deduct for issues
  const findings = [];

  // Can't deeply inspect without reading files, so check presence indicators
  if (!scan.existing_configs.copilot_instructions && !scan.existing_configs.agents_md) {
    score -= 2;
    findings.push("No protected paths documented — AI might modify sensitive files");
  }

  if (Object.keys(scan.ci).length > 0) {
    score += 3; // CI provides a safety net
  }

  if (scan.build_commands.test) {
    score += 2; // Tests provide safety
  }

  return { score: Math.min(10, Math.max(0, score)), findings };
}

/**
 * Run doctor diagnostics.
 * @returns {object} Diagnostic result with scores and findings.
 */
export function runDoctor(target) {
  const scan = scanRepo(target);

  const context = scoreContext(scan);
  const verification = scoreVerification(scan);
  const configHygiene = scoreConfigHygiene(scan);
  const safety = scoreSafety(scan);

  const weighted =
    context.score * WEIGHTS.context +
    verification.score * WEIGHTS.verification +
    configHygiene.score * WEIGHTS.config_hygiene +
    safety.score * WEIGHTS.safety;

  const overall = Math.round(weighted * 10) / 10;

  let level;
  if (overall >= 7) level = "advanced";
  else if (overall >= 4) level = "ready";
  else level = "basic";

  return {
    scan,
    scores: {
      context: context.score,
      verification: verification.score,
      config_hygiene: configHygiene.score,
      safety: safety.score,
      overall,
    },
    level,
    findings: [
      ...context.findings,
      ...verification.findings,
      ...configHygiene.findings,
      ...safety.findings,
    ],
    recommendations: buildRecommendations(level, scan, {
      context,
      verification,
      configHygiene,
      safety,
    }),
  };
}

function buildRecommendations(level, scan, scores) {
  const recs = [];

  if (!scan.existing_configs.agents_md) {
    recs.push({
      priority: "high",
      action: "Create AGENTS.md",
      command: "copilot-quickstart onboard",
    });
  }

  if (!scan.existing_configs.copilot_instructions) {
    recs.push({
      priority: "high",
      action: "Create .github/copilot-instructions.md",
      command: "copilot-quickstart onboard",
    });
  }

  if (!scan.has_existing_profile) {
    recs.push({
      priority: "medium",
      action: "Generate repo-profile.yml",
      command: "copilot-quickstart onboard",
    });
  }

  if (scores.context.score < 5) {
    recs.push({
      priority: "medium",
      action: "Add path-specific instructions for scoped guidance",
      command: "copilot-quickstart onboard",
    });
  }

  if (!scan.existing_configs.vscode_instruction_discovery && scan.existing_configs.path_instructions) {
    recs.push({
      priority: "low",
      action: "Add .vscode/settings.json for instruction discovery",
      command: "copilot-quickstart onboard",
    });
  }

  return recs;
}

/**
 * Format doctor results for terminal display.
 */
export function formatDoctorOutput(result) {
  const { scores, level, findings, recommendations, scan } = result;
  let output = "";

  // Header
  output += `\n${pc.bold("AI Readiness Report")}\n\n`;

  // Scores
  const scoreBar = (score) => {
    const filled = Math.round(score);
    const empty = 10 - filled;
    const color = score >= 7 ? pc.green : score >= 4 ? pc.yellow : pc.red;
    return color("█".repeat(filled)) + pc.dim("░".repeat(empty)) + ` ${score}/10`;
  };

  output += `  Context & Docs     ${scoreBar(scores.context)}\n`;
  output += `  Verification       ${scoreBar(scores.verification)}\n`;
  output += `  Config Hygiene     ${scoreBar(scores.config_hygiene)}\n`;
  output += `  Safety             ${scoreBar(scores.safety)}\n`;
  output += `  ${"─".repeat(40)}\n`;

  const levelColor = level === "advanced" ? pc.green : level === "ready" ? pc.yellow : pc.red;
  output += `  ${pc.bold("Overall")}            ${scoreBar(scores.overall)}  ${levelColor(pc.bold(level.toUpperCase()))}\n`;

  // Findings
  if (findings.length > 0) {
    output += `\n${pc.bold("Findings")}\n\n`;
    for (const f of findings) {
      output += `  ${pc.yellow("⚠")} ${f}\n`;
    }
  }

  // Recommendations
  if (recommendations.length > 0) {
    output += `\n${pc.bold("Recommendations")}\n\n`;
    for (const rec of recommendations) {
      const pColor = rec.priority === "high" ? pc.red : rec.priority === "medium" ? pc.yellow : pc.dim;
      output += `  ${pColor(`[${rec.priority}]`)} ${rec.action}\n`;
      if (rec.command) {
        output += `         ${pc.dim(`$ ${rec.command}`)}\n`;
      }
    }
  }

  return output;
}

/**
 * Format doctor results as JSON for CI/automation.
 */
export function formatDoctorJson(result) {
  return JSON.stringify(
    {
      scores: result.scores,
      level: result.level,
      findings: result.findings,
      recommendations: result.recommendations,
      scan: {
        languages: result.scan.languages,
        frameworks: result.scan.frameworks,
        architecture: result.scan.architecture,
        strategy: result.scan.strategy,
        providers: result.scan.providers,
      },
    },
    null,
    2
  );
}
