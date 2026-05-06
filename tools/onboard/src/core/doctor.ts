/**
 * Doctor — read-only diagnostics and readiness scoring.
 */

import chalk from "chalk";
import { scanRepo, type ScanResult } from "./repo-detect.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DoctorResult {
  scan: ScanResult;
  scores: { context: number; verification: number; config_hygiene: number; safety: number; overall: number };
  level: "basic" | "ready" | "advanced";
  findings: string[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  action: string;
  command?: string;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

const WEIGHTS = { context: 0.3, verification: 0.25, config_hygiene: 0.25, safety: 0.2 };

function scoreContext(scan: ScanResult) {
  let score = 0;
  const findings: string[] = [];
  const configs = scan.existing_configs as Record<string, unknown>;

  if (configs.agents_md) score += 4;
  else findings.push("Missing AGENTS.md — no architecture context for AI");

  if (configs.copilot_instructions) {
    score += 3;
    const instr = configs.copilot_instructions as { size?: number };
    if (instr.size && instr.size > 4000) { score -= 1; findings.push("copilot-instructions.md is large (>4KB)"); }
  } else findings.push("Missing .github/copilot-instructions.md");

  if (configs.path_instructions) score += 2;
  if (Object.keys(scan.build_commands).length >= 3) score += 1;
  else findings.push("Few build commands detected");

  return { score: Math.min(10, score), findings };
}

function scoreVerification(scan: ScanResult) {
  let score = 0;
  const findings: string[] = [];
  if (scan.build_commands.test) score += 4; else findings.push("No test command detected");
  if (scan.build_commands.lint) score += 2; else findings.push("No lint command detected");
  if (Object.keys(scan.ci).length > 0) score += 3; else findings.push("No CI workflows detected");
  if (scan.build_commands.build) score += 1;
  return { score: Math.min(10, score), findings };
}

function scoreConfigHygiene(scan: ScanResult) {
  let score = 0;
  const findings: string[] = [];
  const configs = scan.existing_configs as Record<string, unknown>;
  const configCount = Object.keys(configs).length;
  if (configCount >= 3) score += 4;
  else if (configCount >= 1) score += 2;
  else findings.push("No AI configuration files detected");
  if (configs.vscode_instruction_discovery) score += 2;
  else if (configs.path_instructions) findings.push("Path instructions exist but VS Code discovery not configured");
  if (scan.has_existing_profile) score += 2;
  else findings.push("No repo-profile.yml");
  if (scan.providers.length > 1) score += 2;
  return { score: Math.min(10, score), findings };
}

function scoreSafety(scan: ScanResult) {
  let score = 5;
  const findings: string[] = [];
  const configs = scan.existing_configs as Record<string, unknown>;
  if (!configs.copilot_instructions && !configs.agents_md) { score -= 2; findings.push("No protected paths documented"); }
  if (Object.keys(scan.ci).length > 0) score += 3;
  if (scan.build_commands.test) score += 2;
  return { score: Math.min(10, Math.max(0, score)), findings };
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function runDoctor(target: string): DoctorResult {
  const scan = scanRepo(target);
  const context = scoreContext(scan);
  const verification = scoreVerification(scan);
  const configHygiene = scoreConfigHygiene(scan);
  const safety = scoreSafety(scan);

  const weighted = context.score * WEIGHTS.context + verification.score * WEIGHTS.verification +
    configHygiene.score * WEIGHTS.config_hygiene + safety.score * WEIGHTS.safety;
  const overall = Math.round(weighted * 10) / 10;

  let level: DoctorResult["level"];
  if (overall >= 7) level = "advanced";
  else if (overall >= 4) level = "ready";
  else level = "basic";

  const configs = scan.existing_configs as Record<string, unknown>;
  const recommendations: Recommendation[] = [];
  if (!configs.agents_md) recommendations.push({ priority: "high", action: "Create AGENTS.md", command: "copilot-quickstart init" });
  if (!configs.copilot_instructions) recommendations.push({ priority: "high", action: "Create .github/copilot-instructions.md", command: "copilot-quickstart init" });
  if (!scan.has_existing_profile) recommendations.push({ priority: "medium", action: "Generate repo-profile.yml", command: "copilot-quickstart init" });
  if (context.score < 5) recommendations.push({ priority: "medium", action: "Add path-specific instructions", command: "copilot-quickstart init" });

  return {
    scan, scores: { context: context.score, verification: verification.score, config_hygiene: configHygiene.score, safety: safety.score, overall },
    level,
    findings: [...context.findings, ...verification.findings, ...configHygiene.findings, ...safety.findings],
    recommendations,
  };
}

// ─── Formatters ─────────────────────────────────────────────────────────────

export function formatDoctorOutput(result: DoctorResult): string {
  const { scores, level, findings, recommendations } = result;
  let output = `\n${chalk.bold("AI Readiness Report")}\n\n`;

  const scoreBar = (score: number) => {
    const filled = Math.round(score);
    const color = score >= 7 ? chalk.green : score >= 4 ? chalk.yellow : chalk.red;
    return color("█".repeat(filled)) + chalk.dim("░".repeat(10 - filled)) + ` ${score}/10`;
  };

  output += `  Context & Docs     ${scoreBar(scores.context)}\n`;
  output += `  Verification       ${scoreBar(scores.verification)}\n`;
  output += `  Config Hygiene     ${scoreBar(scores.config_hygiene)}\n`;
  output += `  Safety             ${scoreBar(scores.safety)}\n`;
  output += `  ${"─".repeat(40)}\n`;

  const levelColor = level === "advanced" ? chalk.green : level === "ready" ? chalk.yellow : chalk.red;
  output += `  ${chalk.bold("Overall")}            ${scoreBar(scores.overall)}  ${levelColor(level.toUpperCase())}\n`;

  if (findings.length > 0) {
    output += `\n${chalk.bold("Findings")}\n\n`;
    for (const f of findings) output += `  ${chalk.yellow("⚠")} ${f}\n`;
  }
  if (recommendations.length > 0) {
    output += `\n${chalk.bold("Recommendations")}\n\n`;
    for (const rec of recommendations) {
      const pColor = rec.priority === "high" ? chalk.red : rec.priority === "medium" ? chalk.yellow : chalk.dim;
      output += `  ${pColor(`[${rec.priority}]`)} ${rec.action}\n`;
      if (rec.command) output += `         ${chalk.dim(`$ ${rec.command}`)}\n`;
    }
  }
  return output;
}

export function formatDoctorJson(result: DoctorResult): string {
  return JSON.stringify({
    scores: result.scores, level: result.level, findings: result.findings,
    recommendations: result.recommendations,
    scan: { languages: result.scan.languages, frameworks: result.scan.frameworks, architecture: result.scan.architecture, strategy: result.scan.strategy, providers: result.scan.providers },
  }, null, 2);
}
