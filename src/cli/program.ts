import { Command } from "commander";

import { registerCollectionsCommands } from "../commands/collections.js";
import { registerDocCommands } from "../commands/doc.js";
import { registerExportCommands } from "../commands/export.js";
import { registerProfileCommands } from "../commands/profiles.js";
import { registerQueryCommands } from "../commands/query.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("firestore")
    .description("A clean, read-only CLI for exploring Firestore databases.")
    .showHelpAfterError()
    .option("--profile <name>", "Profile to use for Firestore commands")
    .option("--json", "Emit machine-readable JSON")
    .option("--verbose", "Include full stack traces in error output")
    .version("0.1.0");

  registerProfileCommands(program);
  registerCollectionsCommands(program);
  registerDocCommands(program);
  registerQueryCommands(program);
  registerExportCommands(program);

  return program;
}
