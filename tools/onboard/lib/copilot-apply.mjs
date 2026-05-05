import { join } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { STAGING_DIR_NAME, MANIFEST_FILE } from "./constants.mjs";
import { MODELS, MODES, buildCopilotCommand } from "./terminal-profile.mjs";

/**
 * Apply via Copilot — launches GitHub Copilot CLI with a prompt that
 * instructs it to apply the staged ai-setup/ artifacts into the repository.
 */

// ─── Manifest Reader ────────────────────────────────────────────────────────

function readManifest(target) {
  const manifestPath = join(target, STAGING_DIR_NAME, MANIFEST_FILE);
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function listStagedFiles(target) {
  const stagingDir = join(target, STAGING_DIR_NAME);
  if (!existsSync(stagingDir)) return [];

  const files = [];
  function walk(dir, prefix = "") {
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

function buildApplyPrompt(target, manifest, stagedFiles) {
  const lines = [];

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
  lines.push("9. Stage all changes with git and create a commit: `chore: apply AI configuration from copilot-quickstart`");
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

// ─── Interactive Wizard ─────────────────────────────────────────────────────

export async function runCopilotApply(target) {
  p.intro(`${pc.bgGreen(pc.black(" Apply via Copilot "))}`);

  // Check staging exists
  const stagingDir = join(target, STAGING_DIR_NAME);
  if (!existsSync(stagingDir)) {
    p.log.error(
      `No ${pc.bold(STAGING_DIR_NAME + "/")} directory found.\n` +
      `  Run ${pc.cyan("copilot-quickstart onboard")} first to stage configuration files.`
    );
    p.outro(pc.red("Nothing to apply."));
    return;
  }

  const manifest = readManifest(target);
  const stagedFiles = listStagedFiles(target);

  if (stagedFiles.length === 0) {
    p.log.error("Staging directory is empty.");
    p.outro(pc.red("Nothing to apply."));
    return;
  }

  p.log.info(
    `${pc.bold("Staged artifacts:")} ${stagedFiles.length} files in ${STAGING_DIR_NAME}/\n` +
    stagedFiles.slice(0, 8).map((f) => `  ${pc.dim("•")} ${f}`).join("\n") +
    (stagedFiles.length > 8 ? `\n  ${pc.dim(`... and ${stagedFiles.length - 8} more`)}` : "")
  );

  // Ask for model + mode
  const answers = await p.group(
    {
      model: () =>
        p.select({
          message: "Model for apply",
          options: MODELS.map((m) => ({
            value: m.value,
            label: m.label,
            hint: m.value,
          })),
          initialValue: "claude-sonnet-4.6",
        }),

      mode: () =>
        p.select({
          message: "Execution mode",
          options: [
            { value: "autopilot", label: "Autopilot", hint: "recommended — Copilot applies everything autonomously" },
            { value: "plan", label: "Plan first", hint: "Copilot creates a plan, then you approve execution" },
            { value: "interactive", label: "Interactive", hint: "confirm each step manually" },
          ],
          initialValue: "autopilot",
        }),

      action: () =>
        p.select({
          message: "What to do with the command?",
          options: [
            { value: "launch", label: "Launch now", hint: "execute gh copilot directly" },
            { value: "copy", label: "Show command", hint: "display the full command to copy" },
          ],
          initialValue: "launch",
        }),
    },
    {
      onCancel: () => {
        p.cancel("Cancelled.");
        process.exit(0);
      },
    }
  );

  // Build the prompt
  const prompt = buildApplyPrompt(target, manifest, stagedFiles);

  // Build the copilot command
  const copilotArgs = buildCopilotCommand({
    model: answers.model,
    effort: "high",
    mode: answers.mode,
    permissions: ["allow-all"],
    enableGithubMcp: true,
    maxContinues: null,
  });

  // The full command with --prompt
  const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const fullCommand = `${copilotArgs} --prompt "${escapedPrompt}"`;

  if (answers.action === "copy") {
    p.log.success(`${pc.bold("Command:")}`);
    console.log();
    console.log(pc.cyan(copilotArgs));
    console.log();
    p.note(
      `Run this command in your repo root, then paste the prompt below\n` +
      `when Copilot starts (or use ${pc.bold("--prompt")} flag with a file).`,
      "Usage"
    );
    console.log(pc.dim("─".repeat(60)));
    console.log(pc.bold("Prompt to provide:"));
    console.log(pc.dim("─".repeat(60)));
    console.log(prompt);
    console.log(pc.dim("─".repeat(60)));
    p.outro("Copy the command and prompt above.");
  } else {
    // Launch directly
    p.log.info(`Launching Copilot with ${pc.bold(answers.model)} in ${pc.bold(answers.mode)} mode...`);

    const { execSync } = await import("node:child_process");
    const platform = process.platform;

    // Write prompt to a temp file to avoid shell escaping issues
    const { writeFileSync, unlinkSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const promptFile = join(tmpdir(), `copilot-apply-prompt-${Date.now()}.md`);
    writeFileSync(promptFile, prompt, "utf8");

    const launchCmd = `${copilotArgs} -p "$(cat '${promptFile.replace(/\\/g, "/")}')"`;

    // On Windows, use a different approach
    const winCmd = `${copilotArgs} -p "${escapedPrompt.slice(0, 4000)}"`;

    try {
      if (platform === "win32") {
        // Launch in current terminal - use spawn for interactive
        const { spawn } = await import("node:child_process");
        const args = copilotArgs.replace("gh copilot", "").trim().split(/\s+/);
        args.push("-i", prompt.slice(0, 8000));

        p.log.info(`${pc.dim("Executing:")} gh copilot ${args.slice(0, 5).join(" ")}...`);
        console.log();

        const child = spawn("gh", ["copilot", ...args], {
          stdio: "inherit",
          cwd: target,
          shell: true,
        });

        child.on("close", (code) => {
          if (code === 0) {
            console.log();
            p.outro(pc.green("Copilot apply completed."));
          }
          // Clean up prompt file
          try { unlinkSync(promptFile); } catch { /* ignore */ }
        });

        child.on("error", (err) => {
          p.log.error(`Failed to launch: ${err.message}`);
          p.log.info(`You can run the command manually:\n  ${pc.cyan(copilotArgs)}`);
          try { unlinkSync(promptFile); } catch { /* ignore */ }
        });
      } else {
        const { spawn } = await import("node:child_process");
        const args = copilotArgs.replace("gh copilot", "").trim().split(/\s+/);
        args.push("-i", prompt.slice(0, 8000));

        const child = spawn("gh", ["copilot", ...args], {
          stdio: "inherit",
          cwd: target,
        });

        child.on("close", () => {
          try { unlinkSync(promptFile); } catch { /* ignore */ }
        });
      }
    } catch (err) {
      p.log.error(`Failed to launch Copilot: ${err.message}`);
      p.log.info(`Run manually:\n  ${pc.cyan(copilotArgs)}`);
      try { unlinkSync(promptFile); } catch { /* ignore */ }
    }
  }
}
