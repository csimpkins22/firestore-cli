export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode: number,
  ) {
    super(message);
  }
}

export class ValidationError extends CliError {
  constructor(message: string) {
    super(message, 2);
  }
}

export class ConfigError extends CliError {
  constructor(message: string) {
    super(message, 3);
  }
}

export class FirestoreCommandError extends CliError {
  constructor(message: string) {
    super(message, 4);
  }
}
