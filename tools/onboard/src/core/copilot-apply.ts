/**
 * Copilot Apply — launch Copilot CLI to apply staged ai-setup/ artifacts.
 */

import { join } from "node:path";
import { existsSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import chalk from "chalk";
import { STAGING_DIR_NAME, MANIFEST_FILE } from "./constants.js";
import { buildCopilotCommand, MODELS, type CopilotCommandOptions } from "./terminal-profile.js";
import { askSelect, showOutro } from "../ui/prompts.js";
import { logger } from "../ui/logger.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

interface Manifest {
  mappings?: Record<string, string>;
  profile?: {
    languages?: string[];
    frameworks?: string[];
    architecture?: string;
    risk_level?: string;
  };
}

function readManifest(target: string): Manifest | null {
  const manifestPath = join(target, STAGING_DIR_NAME, MANIFEST_FILE);
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function listStagedFiles(target: string): string[] {
  const stagingDir = join(target, STAGING_DIR_NAME);
  if (!existsSync(stagingDir)) return [];

  const files: string[] = [];
  function walk(dir: string, prefix = ""): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), rel);
      } else {
        files.push(rel);
      }
    }
  }
  walk(stagingDir);
  return files;
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────

function buildApplyPrompt(target: string, manifest: Manifest | null, stagedFiles: string[]): string {
  const lines: string[] = [];

  lines.push("You are applying AI configuration files from the staging directory (ai-setup/) into this repository.");
  lines.push("");
  lines.push("## Task");
  lines.push("");
  lines.push("Move all staged configuration files from `ai-setup/` to their final locations in this repository.");
  lines.push("Follow the manifest mappings below. After moving, remove the `ai-setup/` directory.");
  lines.push("");

  if (manifest?.mappings) {
    lines.push("## File Mappings (from manifest)");
    lines.push("");
    for (const [src, dest] of Object.entries(manifest.mappings)) {
      lines.push(`- \`ai-setup/${src}\` → \`${dest}\``);
    }
    lines.push("");
  }

  lines.push("## Staged Files");
  lines.push("");
  for (const f of stagedFiles) {
    lines.push(`- \`ai-setup/${f}\``);
  }
  lines.push("");

  lines.push("## Instructions");
  lines.push("");
  lines.push("1. Read each staged file to understand its content");
  lines.push("2. Move/copy each file to its final destination per the mappings");
  lines.push("3. If a destination file already exists, merge intelligently (don't lose existing content)");
  lines.push("4. Review the generated AGENTS.md and fill in any `<!-- TODO -->` placeholders with actual project info");
  lines.push("5. Review .github/copilot-instructions.md and customize for this specific project");
  lines.push("6. If skills were staged, ensure they reference correct project paths and conventions");
  lines.push("7. Run any validation or linting if available");
  lines.push("8. Remove the `ai-setup/` directory after successful apply");
  lines.push('9. Stage all changes with git and create a commit: `chore: apply AI configuration from copilot-quickstart`');
  lines.push("");

  if (manifest?.profile) {
    lines.push("## Repository Context");
    lines.push("");
    const prof = manifest.profile;
    if (prof.languages) lines.push(`- **Languages:** ${prof.languages.join(", ")}`);
    if (prof.frameworks) lines.push(`- **Frameworks:** ${prof.frameworks.join(", ")}`);
    if (prof.architecture) lines.push(`- **Architecture:** ${prof.architecture}`);
    if (prof.risk_level) lines.push(`- **Risk level:** ${prof.risk_level}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function runCopilotApply(target: string): Promise<void> {
  console.log();
  console.log(chalk.bgGreen.black(" Apply via Copilot "));
  console.log();

  // Check staging exists
  const stagingDir = join(target, STAGING_DIR_NAME);
  if (!existsSync(stagingDir)) {
    logger.error(
      `No ${chalk.bold(STAGING_DIR_NAME + "/")} directory found.\n` +
      `  Run ${chalk.cyan("copilot-quickstart onboard")} first to stage configuration files.`
    );
    showOutro(chalk.red("Nothing to apply."));
    return;
  }

  const manifest = readManifest(target);
  const stagedFiles = listStagedFiles(target);

  if (stagedFiles.length === 0) {
    logger.error("Staging directory is empty.");
    showOutro(chalk.red("Nothing to apply."));
    return;
  }

  logger.info(
    `${chalk.bold("Staged artifacts:")} ${stagedFiles.length} files in ${STAGING_DIR_NAME}/\n` +
    stagedFiles.slice(0, 8).map((f) => `  ${chalk.dim("•")} ${f}`).join("\n") +
    (stagedFiles.length > 8 ? `\n  ${chalk.dim(`... and ${stagedFiles.length - 8} more`)}` : "")
  );

  const model = await askSelect({
    message: "Model for apply",
    choices: MODELS.map((m) => ({ value: m.value, name: m.label, description: m.value })),
    default: "claude-sonnet-4.6",
  });

  const mode = await askSelect({
    message: "Execution mode",
    choices: [
      { value: "autopilot", name: "Autopilot", description: "recommended — Copilot applies everything autonomously" },
      { value: "plan", name: "Plan first", description: "Copilot creates a plan, then you approve execution" },
      { value: "interactive", name: "Interactive", description: "confirm each step manually" },
    ],
    default: "autopilot",
  });

  const action = await askSelect({
    message: "What to do with the command?",
    choices: [
      { value: "launch", name: "Launch now", description: "execute gh copilot directly" },
      { value: "copy", name: "Show command", description: "display the full command to copy" },
    ],
    default: "launch",
  });

  // Build the prompt
  const prompt = buildApplyPrompt(target, manifest, stagedFiles);

  // Build the copilot command
  const cmdOpts: CopilotCommandOptions = {
    model,
    effort: "high",
    mode,
    permissions: ["allow-all"],
    enableGithubMcp: true,
    maxContinues: null,
  };
  const copilotArgs = buildCopilotCommand(cmdOpts);

  const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n");

  if (action === "copy") {
    logger.success(chalk.bold("Command:"));
    console.log();
    console.log(chalk.cyan(copilotArgs));
    console.log();

    logger.header("Usage");
    logger.info(
      `Run this command in your repo root, then paste the prompt below\n` +
      `  when Copilot starts (or use ${chalk.bold("--prompt")} flag with a file).`
    );
    console.log(chalk.dim("─".repeat(60)));
    console.log(chalk.bold("Prompt to provide:"));
    console.log(chalk.dim("─".repeat(60)));
    console.log(prompt);
    console.log(chalk.dim("─".repeat(60)));
    showOutro("Copy the command and prompt above.");
  } else {
    // Launch directly
    logger.info(`Launching Copilot with ${chalk.bold(model)} in ${chalk.bold(mode)} mode...`);

    const promptFile = join(tmpdir(), `copilot-apply-prompt-${Date.now()}.md`);
    writeFileSync(promptFile, prompt, "utf8");

    try {
      const args = copilotArgs.replace("gh copilot", "").trim().split(/\s+/);
      args.push("-i", prompt.slice(0, 8000));

      logger.info(`${chalk.dim("Executing:")} gh copilot ${args.slice(0, 5).join(" ")}...`);
      console.log();

      const child = spawn("gh", ["copilot", ...args], {
        stdio: "inherit",
        cwd: target,
        shell: true,
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log();
          showOutro(chalk.green("Copilot apply completed."));
        }
        try { unlinkSync(promptFile); } catch { /* ignore */ }
      });

      child.on("error", (err) => {
        logger.error(`Failed to launch: ${err.message}`);
        logger.info(`You can run the command manually:\n  ${chalk.cyan(copilotArgs)}`);
        try { unlinkSync(promptFile); } catch { /* ignore */ }
      });
    } catch (err) {
      logger.error(`Failed to launch Copilot: ${(err as Error).message}`);
      logger.info(`Run manually:\n  ${chalk.cyan(copilotArgs)}`);
      try { unlinkSync(promptFile); } catch { /* ignore */ }
    }
  }
}
