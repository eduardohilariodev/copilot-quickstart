/**
 * Terminal Profile Builder — interactive wizard to compose VSCode terminal
 * profiles for GitHub Copilot CLI (gh copilot).
 */

import chalk from "chalk";
import { existsSync } from "node:fs";
import { askSelect, askMultiSelect, askConfirm, askText, showIntro, showOutro } from "../ui/prompts.js";
import { logger } from "../ui/logger.js";

// ─── Constants ──────────────────────────────────────────────────────────────

export interface ModelEntry {
  value: string;
  label: string;
  color: string;
}

export const MODELS: ModelEntry[] = [
  { value: "claude-sonnet-4.6", label: "Claude Sonnet 4.6", color: "terminal.ansiBlue" },
  { value: "claude-sonnet-4.5", label: "Claude Sonnet 4.5", color: "terminal.ansiBlue" },
  { value: "claude-opus-4.7", label: "Claude Opus 4.7", color: "terminal.ansiYellow" },
  { value: "claude-opus-4.6", label: "Claude Opus 4.6", color: "terminal.ansiMagenta" },
  { value: "claude-opus-4.5", label: "Claude Opus 4.5", color: "terminal.ansiMagenta" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4", color: "terminal.ansiBlue" },
  { value: "gpt-5.5", label: "GPT-5.5", color: "terminal.ansiGreen" },
  { value: "gpt-5.4", label: "GPT-5.4", color: "terminal.ansiGreen" },
  { value: "gpt-5.3-codex", label: "GPT-5.3-Codex", color: "terminal.ansiGreen" },
  { value: "gpt-5.2-codex", label: "GPT-5.2-Codex", color: "terminal.ansiGreen" },
  { value: "gpt-5.2", label: "GPT-5.2", color: "terminal.ansiGreen" },
  { value: "gpt-5.4-mini", label: "GPT-5.4 mini", color: "terminal.ansiCyan" },
  { value: "gpt-5-mini", label: "GPT-5 mini", color: "terminal.ansiCyan" },
  { value: "gpt-4.1", label: "GPT-4.1", color: "terminal.ansiCyan" },
];

export interface EffortEntry {
  value: string;
  label: string;
  symbol: string;
}

export const REASONING_EFFORTS: EffortEntry[] = [
  { value: "high", label: "High", symbol: "∧" },
  { value: "medium", label: "Medium", symbol: "○" },
  { value: "low", label: "Low", symbol: "∨" },
];

export interface ModeEntry {
  value: string;
  label: string;
  hint: string;
}

export const MODES: ModeEntry[] = [
  { value: "autopilot", label: "Autopilot", hint: "continuous execution without manual confirmation" },
  { value: "interactive", label: "Interactive", hint: "pause for confirmation at each step" },
  { value: "plan", label: "Plan", hint: "generate plan before executing" },
];

export interface ColorEntry {
  value: string;
  label: string;
}

export const COLORS: ColorEntry[] = [
  { value: "terminal.ansiBlue", label: "Blue" },
  { value: "terminal.ansiMagenta", label: "Magenta" },
  { value: "terminal.ansiYellow", label: "Yellow" },
  { value: "terminal.ansiGreen", label: "Green" },
  { value: "terminal.ansiCyan", label: "Cyan" },
  { value: "terminal.ansiRed", label: "Red" },
  { value: "terminal.ansiWhite", label: "White" },
];

export interface PermissionEntry {
  value: string;
  label: string;
  hint: string;
}

export const PERMISSIONS: PermissionEntry[] = [
  { value: "allow-all", label: "--allow-all", hint: "tools + paths + urls (recommended for trusted repos)" },
  { value: "allow-all-tools", label: "--allow-all-tools", hint: "run any tool without confirmation" },
  { value: "allow-all-paths", label: "--allow-all-paths", hint: "access any file path" },
  { value: "allow-all-urls", label: "--allow-all-urls", hint: "fetch any URL" },
];

const MODELS_WITHOUT_EFFORT = ["claude-opus-4.7"];

// ─── Shell Detection ────────────────────────────────────────────────────────

function detectShellPath(): string {
  const platform = process.platform;
  if (platform === "win32") {
    const candidates = [
      `${process.env.USERPROFILE}\\scoop\\apps\\pwsh\\current\\pwsh.exe`,
      "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
      "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return "pwsh.exe";
  }
  return process.env.SHELL || "/bin/bash";
}

// ─── Profile Name Builder ───────────────────────────────────────────────────

function buildDefaultName(model: string, effort?: string): string {
  const modelEntry = MODELS.find((m) => m.value === model);
  const shortName = modelEntry?.label?.split(" ").slice(-1)[0] || model;
  const familyName = modelEntry?.label?.split(" ")[0] || "";

  if (MODELS_WITHOUT_EFFORT.includes(model)) {
    return `${familyName} ${shortName}`;
  }

  const effortEntry = REASONING_EFFORTS.find((e) => e.value === effort);
  const symbol = effortEntry?.symbol || "";
  return `${familyName} ${shortName} ${symbol}`.trim();
}

// ─── Command Builder ────────────────────────────────────────────────────────

export interface CopilotCommandOptions {
  model: string;
  effort?: string;
  mode?: string;
  permissions?: string[];
  enableGithubMcp?: boolean;
  maxContinues?: number | null;
}

export function buildCopilotCommand(options: CopilotCommandOptions): string {
  const parts = ["gh copilot"];

  if (options.permissions?.includes("allow-all")) {
    parts.push("--allow-all");
  } else if (options.permissions && options.permissions.length > 0) {
    for (const perm of options.permissions) {
      parts.push(`--${perm}`);
    }
  }

  if (options.enableGithubMcp) {
    parts.push("--enable-all-github-mcp-tools");
  }

  parts.push(`--model ${options.model}`);

  if (options.effort && !MODELS_WITHOUT_EFFORT.includes(options.model)) {
    parts.push(`--reasoning-effort ${options.effort}`);
  }

  if (options.mode) {
    parts.push(`--mode ${options.mode}`);
  }

  if (options.maxContinues && options.mode === "autopilot") {
    parts.push(`--max-autopilot-continues ${options.maxContinues}`);
  }

  return parts.join(" ");
}

// ─── Profile JSON Builder ───────────────────────────────────────────────────

export interface ProfileJsonOptions extends CopilotCommandOptions {
  shellPath?: string;
  color?: string;
  icon?: string;
  keybinding?: string;
}

export function buildProfileJson(options: ProfileJsonOptions): Record<string, unknown> {
  const command = buildCopilotCommand(options);
  const platform = process.platform;

  const profile: Record<string, unknown> = {};

  if (platform === "win32") {
    profile.path = options.shellPath || "pwsh.exe";
    profile.args = ["-nologo", "-noexit", "-command", command];
  } else {
    profile.path = options.shellPath || "/bin/bash";
    profile.args = ["-c", command];
  }

  profile.color = options.color || "terminal.ansiBlue";
  profile.icon = options.icon || "copilot";

  if (options.keybinding) {
    profile.keybinding = options.keybinding;
  }

  return profile;
}

// ─── Interactive Wizard ─────────────────────────────────────────────────────

export async function runTerminalProfileBuilder(): Promise<void> {
  console.log();
  console.log(chalk.bgMagenta.white(" Terminal Profile Builder "));
  console.log();

  logger.info(
    `Build a VSCode terminal profile for ${chalk.bold("GitHub Copilot CLI")}.\n` +
    `  The output is a JSON snippet to paste into your ${chalk.cyan("settings.json")}.\n` +
    `  ${chalk.dim("(terminal.integrated.profiles.windows/linux/osx)")}`
  );

  const model = await askSelect({
    message: "Model",
    choices: MODELS.map((m) => ({ value: m.value, name: m.label, description: m.value })),
    default: "claude-sonnet-4.6",
  });

  let effort: string | undefined;
  if (!MODELS_WITHOUT_EFFORT.includes(model)) {
    effort = await askSelect({
      message: "Reasoning effort",
      choices: REASONING_EFFORTS.map((e) => ({ value: e.value, name: `${e.symbol} ${e.label}` })),
      default: "high",
    });
  }

  const mode = await askSelect({
    message: "Mode",
    choices: MODES.map((m) => ({ value: m.value, name: m.label, description: m.hint })),
    default: "autopilot",
  });

  const permissions = await askMultiSelect({
    message: "Permissions",
    choices: PERMISSIONS.map((p) => ({ value: p.value, name: p.label, description: p.hint })),
    defaults: ["allow-all"],
  });

  const enableGithubMcp = await askConfirm({ message: "Enable all GitHub MCP tools?", default: true });

  let maxContinues: number | null = null;
  if (mode === "autopilot") {
    const mc = await askText({
      message: "Max autopilot continues (leave empty for unlimited)",
      validate: (v) => {
        if (!v) return true;
        if (isNaN(Number(v)) || Number(v) < 1) return "Must be a positive number";
        return true;
      },
    });
    if (mc) maxContinues = Number(mc);
  }

  const shellPath = await askText({ message: "Shell executable path (leave empty for default)" });

  const color = await askSelect({
    message: "Profile color",
    choices: COLORS.map((c) => ({ value: c.value, name: c.label })),
    default: "terminal.ansiBlue",
  });

  const keybinding = await askText({ message: "Keybinding (optional, e.g. ctrl+alt+1)" });

  const defaultName = buildDefaultName(model, effort);
  const profileName = await askText({
    message: "Profile name",
    default: ` ${defaultName}`,
  });

  // Build the profile
  const options: ProfileJsonOptions = {
    model,
    effort,
    mode,
    permissions,
    enableGithubMcp,
    maxContinues,
    shellPath: shellPath || undefined,
    color,
    icon: "copilot",
    keybinding: keybinding || undefined,
  };

  const profile = buildProfileJson(options);
  const finalName = profileName?.trim() || defaultName;

  const jsonOutput = JSON.stringify({ [finalName]: profile }, null, 2);

  logger.blank();
  logger.success(chalk.bold("Generated profile:"));
  console.log();
  console.log(chalk.cyan(jsonOutput));
  console.log();

  logger.header("Usage");
  logger.info(`Add this to your ${chalk.bold("settings.json")} under:`);
  logger.info(`  ${chalk.cyan('"terminal.integrated.profiles.windows"')} ${chalk.dim("(or linux/osx)")}`);
  logger.blank();
  logger.info(chalk.bold("Command preview:"));
  logger.hint(buildCopilotCommand(options));

  const again = await askConfirm({ message: "Generate another profile?", default: false });

  if (again) {
    await runTerminalProfileBuilder();
    return;
  }

  showOutro("Done! Paste the JSON into your VSCode settings.");
}
