import { createInterface } from "node:readline";
import { Command } from "commander";

import { getGlobalOptions, parseJsonData } from "../cli/options.js";
import { resolveProfile } from "../core/config.js";
import {
  createDocument,
  createFirestoreClient,
  deleteDocument,
  getDocument,
  getDocumentDeep,
  setDocument,
  updateDocument,
} from "../core/firestore.js";
import {
  renderDeepDocument,
  renderDocument,
  renderDryRun,
  renderWriteResult,
  writeDocumentJson,
} from "../core/output.js";

interface DocGetFlags {
  deep?: boolean;
  out?: string;
}

interface DocWriteFlags {
  dryRun?: boolean;
  merge?: boolean;
}

interface DocDeleteFlags {
  dryRun?: boolean;
  yes?: boolean;
}

export function registerDocCommands(program: Command): void {
  const doc = program.command("doc").description("Read and write Firestore documents");

  doc
    .command("get")
    .argument("<documentPath>", "Document path to read")
    .option("--deep", "Recursively fetch all subcollections")
    .option("--out <file|->", "Write output to file or - for stdout")
    .action(async (documentPath: string, flags: DocGetFlags, command: Command) => {
      const options = getGlobalOptions(command);
      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);

      if (flags.deep) {
        const result = await getDocumentDeep(firestore, documentPath);
        if (flags.out) {
          await writeDocumentJson(flags.out, result);
        } else {
          renderDeepDocument(result, { json: options.json });
        }
      } else {
        const result = await getDocument(firestore, documentPath);
        if (flags.out) {
          await writeDocumentJson(flags.out, result);
        } else {
          renderDocument(result, { json: options.json });
        }
      }
    });

  doc
    .command("set")
    .description("Create or overwrite a document")
    .argument("<documentPath>", "Document path to write")
    .argument("<json>", "JSON object to write")
    .option("--merge", "Merge fields instead of overwriting")
    .option("--dry-run", "Show what would happen without writing")
    .action(async (documentPath: string, json: string, flags: DocWriteFlags, command: Command) => {
      const options = getGlobalOptions(command);
      const data = parseJsonData(json);

      if (flags.dryRun) {
        const op = flags.merge ? "set (merge)" : "set";
        renderDryRun(op, documentPath, data, { json: options.json });
        return;
      }

      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      await setDocument(firestore, documentPath, data, flags.merge);

      const op = flags.merge ? "set (merge)" : "set";
      renderWriteResult(op, documentPath, { json: options.json });
    });

  doc
    .command("create")
    .description("Create a document (fails if it already exists)")
    .argument("<documentPath>", "Document path to create")
    .argument("<json>", "JSON object to write")
    .option("--dry-run", "Show what would happen without writing")
    .action(async (documentPath: string, json: string, flags: DocWriteFlags, command: Command) => {
      const options = getGlobalOptions(command);
      const data = parseJsonData(json);

      if (flags.dryRun) {
        renderDryRun("create", documentPath, data, { json: options.json });
        return;
      }

      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      await createDocument(firestore, documentPath, data);
      renderWriteResult("create", documentPath, { json: options.json });
    });

  doc
    .command("update")
    .description("Update fields on an existing document (fails if missing)")
    .argument("<documentPath>", "Document path to update")
    .argument("<json>", "JSON fields to merge")
    .option("--dry-run", "Show what would happen without writing")
    .action(async (documentPath: string, json: string, flags: DocWriteFlags, command: Command) => {
      const options = getGlobalOptions(command);
      const data = parseJsonData(json);

      if (flags.dryRun) {
        renderDryRun("update", documentPath, data, { json: options.json });
        return;
      }

      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      await updateDocument(firestore, documentPath, data);
      renderWriteResult("update", documentPath, { json: options.json });
    });

  doc
    .command("delete")
    .description("Delete a document")
    .argument("<documentPath>", "Document path to delete")
    .option("--dry-run", "Show what would happen without deleting")
    .option("--yes", "Skip confirmation prompt")
    .action(async (documentPath: string, flags: DocDeleteFlags, command: Command) => {
      const options = getGlobalOptions(command);

      if (flags.dryRun) {
        renderDryRun("delete", documentPath, undefined, { json: options.json });
        return;
      }

      if (!flags.yes) {
        const confirmed = await confirm(`Delete ${documentPath}?`);
        if (!confirmed) {
          process.stderr.write("Aborted.\n");
          return;
        }
      }

      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      await deleteDocument(firestore, documentPath);
      renderWriteResult("delete", documentPath, { json: options.json });
    });
}

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
