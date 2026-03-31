import { Command } from "commander";

import { getGlobalOptions } from "../cli/options.js";
import { resolveProfile } from "../core/config.js";
import { createFirestoreClient, listCollections } from "../core/firestore.js";
import { renderCollections } from "../core/output.js";

export function registerCollectionsCommands(program: Command): void {
  const collections = program.command("collections").description("List Firestore collections");

  collections
    .command("list")
    .argument("[documentPath]", "Document path whose subcollections should be listed")
    .action(async function (this: Command, documentPath: string | undefined) {
      const options = getGlobalOptions(this);
      const { name, profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      const result = await listCollections(firestore, documentPath);
      renderCollections(name, result, { json: options.json });
    });
}
