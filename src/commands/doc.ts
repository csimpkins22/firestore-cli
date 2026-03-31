import { Command } from "commander";

import { getGlobalOptions } from "../cli/options.js";
import { resolveProfile } from "../core/config.js";
import { createFirestoreClient, getDocument } from "../core/firestore.js";
import { renderDocument } from "../core/output.js";

export function registerDocCommands(program: Command): void {
  const doc = program.command("doc").description("Read Firestore documents");

  doc
    .command("get")
    .argument("<documentPath>", "Document path to read")
    .action(async (documentPath: string, command: Command) => {
      const options = getGlobalOptions(command);
      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      const result = await getDocument(firestore, documentPath);
      renderDocument(result, { json: options.json });
    });
}
