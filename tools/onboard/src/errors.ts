/**
 * Typed error classes for the CLI.
 */

export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}

export class ValidationError extends CliError {
  constructor(message: string) {
    super(message, 1);
    this.name = "ValidationError";
  }
}

export class FsError extends CliError {
  readonly path: string;

  constructor(message: string, path: string) {
    super(message, 1);
    this.name = "FsError";
    this.path = path;
  }
}

export class EnvironmentError extends CliError {
  constructor(message: string) {
    super(message, 1);
    this.name = "EnvironmentError";
  }
}
