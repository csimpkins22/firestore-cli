import { writeFile } from "node:fs/promises";

import pc from "picocolors";

import { getConfigPath } from "./config.js";
import type { DeepDocument, FirestoreCliConfig, FirestoreProfile, SerializedDocument } from "./types.js";

export interface OutputOptions {
  json?: boolean;
}

export function renderProfiles(config: FirestoreCliConfig, options: OutputOptions): void {
  const rows = Object.entries(config.profiles)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, profile]) => ({
      defaultMarker: config.defaultProfile === name ? "*" : "",
      mode: profile.mode,
      name,
      projectId: profile.projectId,
      target: profile.mode === "cloud" ? profile.credentialsPath : profile.emulatorHost,
    }));

  emit(rows, options, `Profiles (${getConfigPath()})`);
}

export function renderProfileDetail(
  name: string,
  profile: FirestoreProfile,
  options: OutputOptions,
): void {
  emit(
    {
      databaseId: profile.databaseId,
      mode: profile.mode,
      name,
      projectId: profile.projectId,
      target: profile.mode === "cloud" ? profile.credentialsPath : profile.emulatorHost,
    },
    options,
    `Profile: ${name}`,
  );
}

export function renderCollections(
  profileName: string,
  collections: Array<{ id: string; path: string }>,
  options: OutputOptions,
): void {
  emit(collections, options, `Collections (${profileName})`);
}

export function renderDocument(
  document: SerializedDocument,
  options: OutputOptions,
): void {
  emit(document, options, `Document: ${document.path}`);
}

export function renderQueryResults(
  collectionPath: string,
  documents: SerializedDocument[],
  options: OutputOptions,
): void {
  emit(
    {
      collectionPath,
      count: documents.length,
      documents,
    },
    options,
    `Query Results: ${collectionPath}`,
  );
}

export function renderDeepDocument(document: DeepDocument, options: OutputOptions): void {
  emit(document, options, `Document: ${document.path} (deep)`);
}

export async function writeDocumentJson(
  outputPath: string,
  document: SerializedDocument | DeepDocument,
): Promise<void> {
  const payload = JSON.stringify(document, null, 2);

  if (outputPath === "-") {
    process.stdout.write(`${payload}\n`);
    return;
  }

  await writeFile(outputPath, `${payload}\n`, "utf8");
  process.stderr.write(
    `${pc.green("Wrote")} ${document.path} to ${outputPath}\n`,
  );
}

export async function writeExport(
  outputPath: string,
  collectionPath: string,
  documents: SerializedDocument[],
): Promise<void> {
  const payload = JSON.stringify(
    {
      collectionPath,
      count: documents.length,
      documents,
    },
    null,
    2,
  );

  if (outputPath === "-") {
    process.stdout.write(`${payload}\n`);
    return;
  }

  await writeFile(outputPath, `${payload}\n`, "utf8");
  process.stderr.write(
    `${pc.green("Wrote")} ${documents.length} document(s) from ${collectionPath} to ${outputPath}\n`,
  );
}

export function renderWriteResult(
  operation: string,
  documentPath: string,
  options: OutputOptions,
): void {
  emit({ operation, documentPath }, options, `${operation}: ${documentPath}`);
}

export function renderDryRun(
  operation: string,
  documentPath: string,
  data?: Record<string, unknown>,
  options?: OutputOptions,
): void {
  const payload = data
    ? { operation, documentPath, data }
    : { operation, documentPath };

  emit(payload, options ?? {}, `Dry run — ${operation}: ${documentPath}`);
}

function emit(value: unknown, options: OutputOptions, title: string): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${pc.bold(title)}\n`);
  process.stdout.write(`${formatPretty(value)}\n`);
}

function formatPretty(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return pc.dim("(empty)");
    }

    return value
      .map((item) => `- ${formatInline(item)}`)
      .join("\n");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatInline(value: unknown): string {
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
