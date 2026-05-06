#!/usr/bin/env node

/**
 * copilot-quickstart CLI v3.0.0
 *
 * Interactive wizard for onboarding repositories into the copilot-quickstart
 * ecosystem. Detects stack, asks targeted questions, stages config files.
 */

import { Command } from "commander";
import { VERSION } from "./core/constants.js";
import { CliError } from "./errors.js";
import { registerOnboard } from "./commands/onboard.js";
import { registerDoctor } from "./commands/doctor.js";
import { registerApply } from "./commands/apply.js";
import { registerReset } from "./commands/reset.js";
import { registerValidate } from "./commands/validate.js";
import { registerTerminalProfile } from "./commands/terminal-profile.js";
import { registerCopilotApply } from "./commands/copilot-apply.js";

const program = new Command();

program
  .name("copilot-quickstart")
  .description("AI-ready repo configuration wizard")
  .version(VERSION, "-V, --version");

// Register all commands
registerOnboard(program);
registerDoctor(program);
registerApply(program);
registerReset(program);
registerValidate(program);
registerTerminalProfile(program);
registerCopilotApply(program);

// Default action: show help if no command provided
program.action(() => {
  program.help();
});

// Centralized error handling
program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof CliError) {
    console.error(`\n  Error: ${err.message}\n`);
    process.exit(err.exitCode);
  }
  if (err instanceof Error) {
    console.error(`\n  Unexpected error: ${err.message}\n`);
    if (process.env.DEBUG) console.error(err.stack);
  }
  process.exit(1);
});
