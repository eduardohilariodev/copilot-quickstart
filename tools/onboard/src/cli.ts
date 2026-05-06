#!/usr/bin/env node

/**
 * copilot-quickstart CLI v4.0.0
 *
 * Scan → 2 questions → stage + plan → 2 next steps.
 * Teaches through doing: the primary output is copilot-plan.md.
 */

import { Command } from "commander";
import { VERSION } from "./core/constants.js";
import { CliError } from "./errors.js";
import { registerInit } from "./commands/init.js";
import { registerPlan } from "./commands/plan.js";
import { registerDoctor } from "./commands/doctor.js";
import { registerApply } from "./commands/apply.js";
import { registerReset } from "./commands/reset.js";
import { registerOnboard } from "./commands/onboard.js";
import { registerValidate } from "./commands/validate.js";
import { registerTerminalProfile } from "./commands/terminal-profile.js";
import { registerCopilotApply } from "./commands/copilot-apply.js";

const program = new Command();

program
  .name("copilot-quickstart")
  .description("Set up Copilot for any repository in 2 minutes")
  .version(VERSION, "-V, --version");

// Primary commands (shown in help)
registerInit(program);
registerPlan(program);
registerDoctor(program);
registerApply(program);
registerReset(program);

// Legacy/hidden commands (backwards compat)
registerOnboard(program);

// Power-user commands (hidden from default help)
registerValidate(program);
registerTerminalProfile(program);
registerCopilotApply(program);
// Hide power-user commands from help output
for (const cmd of program.commands) {
  if (["validate", "terminal-profile", "copilot-apply", "onboard"].includes(cmd.name())) {
    (cmd as unknown as { hidden: boolean }).hidden = true;
  }
}

// Default action: run init when no command provided
program.action(async (_opts, cmd) => {
  await cmd.parseAsync(["", "", "init", ...process.argv.slice(2)]);
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
