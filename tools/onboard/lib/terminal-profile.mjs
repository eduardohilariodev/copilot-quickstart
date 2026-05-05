import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "node:fs";

/**
 * Terminal Profile Builder — interactive wizard to compose VSCode terminal
 * profiles for GitHub Copilot CLI (gh copilot).
 */

// ─── Constants ──────────────────────────────────────────────────────────────

export const MODELS = [
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

export const REASONING_EFFORTS = [
  { value: "high", label: "High", symbol: "∧" },
  { value: "medium", label: "Medium", symbol: "○" },
  { value: "low", label: "Low", symbol: "∨" },
];

export const MODES = [
  { value: "autopilot", label: "Autopilot", hint: "continuous execution without manual confirmation" },
  { value: "interactive", label: "Interactive", hint: "pause for confirmation at each step" },
  { value: "plan", label: "Plan", hint: "generate plan before executing" },
];

export const COLORS = [
  { value: "terminal.ansiBlue", label: "Blue" },
  { value: "terminal.ansiMagenta", label: "Magenta" },
  { value: "terminal.ansiYellow", label: "Yellow" },
  { value: "terminal.ansiGreen", label: "Green" },
  { value: "terminal.ansiCyan", label: "Cyan" },
  { value: "terminal.ansiRed", label: "Red" },
  { value: "terminal.ansiWhite", label: "White" },
];

export const PERMISSIONS = [
  { value: "allow-all", label: "--allow-all", hint: "tools + paths + urls (recommended for trusted repos)" },
  { value: "allow-all-tools", label: "--allow-all-tools", hint: "run any tool without confirmation" },
  { value: "allow-all-paths", label: "--allow-all-paths", hint: "access any file path" },
  { value: "allow-all-urls", label: "--allow-all-urls", hint: "fetch any URL" },
];

const MODELS_WITHOUT_EFFORT = ["claude-opus-4.7"];

// ─── Shell Detection ────────────────────────────────────────────────────────

function detectShellPath() {
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

function buildDefaultName(model, effort) {
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

export function buildCopilotCommand(options) {
  const parts = ["gh copilot"];

  if (options.permissions?.includes("allow-all")) {
    parts.push("--allow-all");
  } else if (options.permissions?.length > 0) {
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

export function buildProfileJson(options) {
  const command = buildCopilotCommand(options);
  const platform = process.platform;

  const profile = {};

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

export async function runTerminalProfileBuilder() {
  p.intro(`${pc.bgMagenta(pc.white(" Terminal Profile Builder "))}`);

  p.log.info(
    `Build a VSCode terminal profile for ${pc.bold("GitHub Copilot CLI")}.\n` +
    `  The output is a JSON snippet to paste into your ${pc.cyan("settings.json")}.\n` +
    `  ${pc.dim("(terminal.integrated.profiles.windows/linux/osx)")}`
  );

  const answers = await p.group(
    {
      model: () =>
        p.select({
          message: "Model",
          options: MODELS.map((m) => ({
            value: m.value,
            label: m.label,
            hint: m.value,
          })),
          initialValue: "claude-sonnet-4.6",
        }),

      effort: ({ results }) => {
        if (MODELS_WITHOUT_EFFORT.includes(results.model)) return;
        return p.select({
          message: "Reasoning effort",
          options: REASONING_EFFORTS.map((e) => ({
            value: e.value,
            label: `${e.symbol} ${e.label}`,
          })),
          initialValue: "high",
        });
      },

      mode: () =>
        p.select({
          message: "Mode",
          options: MODES.map((m) => ({
            value: m.value,
            label: m.label,
            hint: m.hint,
          })),
          initialValue: "autopilot",
        }),

      permissions: () =>
        p.multiselect({
          message: "Permissions",
          options: PERMISSIONS.map((perm) => ({
            value: perm.value,
            label: perm.label,
            hint: perm.hint,
          })),
          initialValues: ["allow-all"],
          required: false,
        }),

      enableGithubMcp: () =>
        p.confirm({
          message: "Enable all GitHub MCP tools?",
          initialValue: true,
        }),

      maxContinues: ({ results }) => {
        if (results.mode !== "autopilot") return;
        return p.text({
          message: "Max autopilot continues (leave empty for unlimited)",
          placeholder: "e.g. 50",
          validate: (v) => {
            if (!v) return;
            if (isNaN(Number(v)) || Number(v) < 1) return "Must be a positive number";
          },
        });
      },

      shellPath: () =>
        p.text({
          message: "Shell executable path",
          placeholder: process.platform === "win32"
            ? "C:\\Users\\...\\pwsh.exe"
            : "/bin/bash",
          initialValue: "",
        }),

      color: () =>
        p.select({
          message: "Profile color",
          options: COLORS.map((c) => ({ value: c.value, label: c.label })),
          initialValue: "terminal.ansiBlue",
        }),

      keybinding: () =>
        p.text({
          message: "Keybinding (optional)",
          placeholder: "e.g. ctrl+alt+1",
        }),

      profileName: ({ results }) => {
        const defaultName = buildDefaultName(results.model, results.effort);
        return p.text({
          message: "Profile name",
          initialValue: ` ${defaultName}`,
          placeholder: defaultName,
        });
      },
    },
    {
      onCancel: () => {
        p.cancel("Cancelled.");
        process.exit(0);
      },
    }
  );

  // Build the profile
  const options = {
    model: answers.model,
    effort: answers.effort,
    mode: answers.mode,
    permissions: answers.permissions || [],
    enableGithubMcp: answers.enableGithubMcp,
    maxContinues: answers.maxContinues ? Number(answers.maxContinues) : null,
    shellPath: answers.shellPath || undefined,
    color: answers.color,
    icon: "copilot",
    keybinding: answers.keybinding || undefined,
  };

  const profile = buildProfileJson(options);
  const profileName = answers.profileName?.trim() || buildDefaultName(answers.model, answers.effort);

  // Format output
  const jsonOutput = JSON.stringify({ [profileName]: profile }, null, 2);

  p.log.success(`${pc.bold("Generated profile:")}`);
  console.log();
  console.log(pc.cyan(jsonOutput));
  console.log();

  p.note(
    `Add this to your ${pc.bold("settings.json")} under:\n` +
    `  ${pc.cyan('"terminal.integrated.profiles.windows"')} ${pc.dim("(or linux/osx)")}\n\n` +
    `${pc.bold("Command preview:")}\n` +
    `  ${pc.dim(buildCopilotCommand(options))}`,
    "Usage"
  );

  // Ask if user wants to generate more
  const again = await p.confirm({
    message: "Generate another profile?",
    initialValue: false,
  });

  if (p.isCancel(again)) {
    p.outro("Done!");
    return;
  }

  if (again) {
    await runTerminalProfileBuilder();
    return;
  }

  p.outro("Done! Paste the JSON into your VSCode settings.");
}
