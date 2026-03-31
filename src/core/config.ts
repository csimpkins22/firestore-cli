import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import envPaths from "env-paths";

import { ConfigError } from "./errors.js";
import { configSchema, type FirestoreCliConfig, type FirestoreProfile } from "./types.js";

const paths = envPaths("firestore-cli");
const configPath = `${paths.config}/config.json`;

export function getConfigPath(): string {
  return configPath;
}

export async function loadConfig(): Promise<FirestoreCliConfig> {
  try {
    const content = await readFile(configPath, "utf8");
    return configSchema.parse(JSON.parse(content));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return configSchema.parse({});
    }

    if (error instanceof Error && error.name === "ZodError") {
      throw new ConfigError(`Invalid config file at ${configPath}: ${error.message}`);
    }

    throw new ConfigError(`Unable to read config file at ${configPath}.`);
  }
}

export async function saveConfig(config: FirestoreCliConfig): Promise<void> {
  const normalized = configSchema.parse(config);
  await mkdir(dirname(configPath), { recursive: true });

  const tempPath = `${configPath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  await rename(tempPath, configPath);
}

export async function addProfile(
  name: string,
  profile: FirestoreProfile,
): Promise<FirestoreCliConfig> {
  const config = await loadConfig();
  config.profiles[name] = profile;
  if (!config.defaultProfile) {
    config.defaultProfile = name;
  }
  await saveConfig(config);
  return config;
}

export async function removeProfile(name: string): Promise<FirestoreCliConfig> {
  const config = await loadConfig();
  if (!config.profiles[name]) {
    throw new ConfigError(`Profile "${name}" does not exist.`);
  }

  delete config.profiles[name];
  if (config.defaultProfile === name) {
    config.defaultProfile = Object.keys(config.profiles)[0];
  }

  if (Object.keys(config.profiles).length === 0) {
    config.defaultProfile = undefined;
    await rm(configPath, { force: true });
    return configSchema.parse({});
  }

  await saveConfig(config);
  return config;
}

export async function setDefaultProfile(name: string): Promise<FirestoreCliConfig> {
  const config = await loadConfig();
  if (!config.profiles[name]) {
    throw new ConfigError(`Profile "${name}" does not exist.`);
  }

  config.defaultProfile = name;
  await saveConfig(config);
  return config;
}

export async function resolveProfile(profileName?: string): Promise<{ name: string; profile: FirestoreProfile }> {
  const config = await loadConfig();
  const resolvedName = profileName ?? config.defaultProfile;
  if (!resolvedName) {
    throw new ConfigError(
      `No default profile is configured. Add one with "firestore profiles add <name> ...".`,
    );
  }

  const profile = config.profiles[resolvedName];
  if (!profile) {
    throw new ConfigError(`Profile "${resolvedName}" does not exist.`);
  }

  return { name: resolvedName, profile };
}
