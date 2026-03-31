import { Command } from "commander";

import {
  collectOption,
  getGlobalOptions,
  parseOrderBy,
  parseSelect,
  parseWhereClause,
  type QueryFlags,
} from "../cli/options.js";
import { resolveProfile } from "../core/config.js";
import { createFirestoreClient, runQuery } from "../core/firestore.js";
import { renderQueryResults } from "../core/output.js";

export function registerQueryCommands(program: Command): void {
  program
    .command("query")
    .description("Run a read-only Firestore query against a collection")
    .argument("<collectionPath>", "Collection path to query")
    .option("--where <field,op,value>", "Firestore where clause", collectOption, [])
    .option("--order-by <field[:asc|desc]>", "Firestore orderBy clause", collectOption, [])
    .option("--limit <n>", "Limit the number of returned documents", parseNumber)
    .option("--offset <n>", "Offset the result set", parseNumber)
    .option("--select <fields>", "Comma-separated field projection")
    .action(async (collectionPath: string, flags: QueryFlags, command: Command) => {
      const options = getGlobalOptions(command);
      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);
      const documents = await runQuery(
        firestore,
        collectionPath,
        flags.where.map(parseWhereClause),
        flags.orderBy.map(parseOrderBy),
        flags.limit,
        flags.offset,
        parseSelect(flags.select),
      );

      renderQueryResults(collectionPath, documents, { json: options.json });
    });
}

function parseNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected a number but received "${value}".`);
  }
  return parsed;
}
