#!/usr/bin/env node

import { createProgram } from "../cli/program.js";

async function main(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const withExitCode = normalized as Error & { exitCode?: unknown };
  const exitCode = typeof withExitCode.exitCode === "number"
    ? withExitCode.exitCode
    : 1;

  const verbose = process.argv.includes("--verbose");
  const message = verbose && normalized.stack ? normalized.stack : normalized.message;

  process.stderr.write(`${message}\n`);
  process.exitCode = exitCode;
});
