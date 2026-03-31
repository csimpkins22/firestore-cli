import { Command } from "commander";

import { getGlobalOptions } from "../cli/options.js";
import { resolveProfile } from "../core/config.js";
import { createFirestoreClient, getDocument, getDocumentDeep } from "../core/firestore.js";
import { renderDeepDocument, renderDocument, writeDocumentJson } from "../core/output.js";

interface DocGetFlags {
  deep?: boolean;
  out?: string;
}

export function registerDocCommands(program: Command): void {
  const doc = program.command("doc").description("Read Firestore documents");

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
}
