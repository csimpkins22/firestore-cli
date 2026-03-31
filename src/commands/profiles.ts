import { Command } from "commander";

import { addProfile, loadConfig, removeProfile, resolveProfile, setDefaultProfile } from "../core/config.js";
import { ValidationError } from "../core/errors.js";
import { renderProfileDetail, renderProfiles } from "../core/output.js";
import type { FirestoreProfile } from "../core/types.js";

interface AddProfileOptions {
  credentials?: string;
  database?: string;
  emulatorHost?: string;
  project: string;
}

export function registerProfileCommands(program: Command): void {
  const profiles = program.command("profiles").description("Manage Firestore connection profiles");

  profiles
    .command("add")
    .argument("<name>", "Profile name")
    .requiredOption("--project <id>", "Google Cloud project ID")
    .option("--credentials <path>", "Path to a service-account JSON file")
    .option("--emulator-host <host:port>", "Firestore emulator host, for example 127.0.0.1:8080")
    .option("--database <id>", "Firestore database ID", "(default)")
    .action(async (name: string, options: AddProfileOptions, command: Command) => {
      const profile = buildProfile(options);
      const config = await addProfile(name, profile);
      renderProfiles(config, { json: command.optsWithGlobals<{ json?: boolean }>().json });
    });

  profiles.command("list").action(async function (this: Command) {
    const config = await loadConfig();
    renderProfiles(config, { json: this.optsWithGlobals<{ json?: boolean }>().json });
  });

  profiles
    .command("show")
    .argument("[name]", "Profile name")
    .action(async function (this: Command, name: string | undefined) {
      const resolved = await resolveProfile(name ?? this.optsWithGlobals<{ profile?: string }>().profile);
      renderProfileDetail(resolved.name, resolved.profile, {
        json: this.optsWithGlobals<{ json?: boolean }>().json,
      });
    });

  profiles
    .command("use")
    .argument("<name>", "Profile name")
    .action(async function (this: Command, name: string) {
      const config = await setDefaultProfile(name);
      renderProfiles(config, { json: this.optsWithGlobals<{ json?: boolean }>().json });
    });

  profiles
    .command("remove")
    .argument("<name>", "Profile name")
    .action(async function (this: Command, name: string) {
      const config = await removeProfile(name);
      renderProfiles(config, { json: this.optsWithGlobals<{ json?: boolean }>().json });
    });
}

function buildProfile(options: AddProfileOptions): FirestoreProfile {
  const hasCredentials = Boolean(options.credentials);
  const hasEmulatorHost = Boolean(options.emulatorHost);

  if (hasCredentials === hasEmulatorHost) {
    throw new ValidationError(
      `Provide exactly one of --credentials or --emulator-host when creating a profile.`,
    );
  }

  if (options.credentials) {
    return {
      credentialsPath: options.credentials,
      databaseId: options.database ?? "(default)",
      mode: "cloud",
      projectId: options.project,
    };
  }

  return {
    databaseId: options.database ?? "(default)",
    emulatorHost: options.emulatorHost ?? "127.0.0.1:8080",
    mode: "emulator",
    projectId: options.project,
  };
}
