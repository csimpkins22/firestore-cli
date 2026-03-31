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
import { createFirestoreClient, runCollectionGroupQuery, runQuery } from "../core/firestore.js";
import { writeExport } from "../core/output.js";

interface ExportFlags extends QueryFlags {
  out: string;
}

export function registerExportCommands(program: Command): void {
  program
    .command("export")
    .description("Export Firestore query results as JSON")
    .argument("<collectionPath>", "Collection path (or collection ID with --collection-group)")
    .requiredOption("--out <file|->", "Output file path or - for stdout")
    .option("--collection-group", "Query across all collections with this ID")
    .option("--where <field,op,value>", "Firestore where clause", collectOption, [])
    .option("--order-by <field[:asc|desc]>", "Firestore orderBy clause", collectOption, [])
    .option("--limit <n>", "Limit the number of returned documents", parseNumber)
    .option("--offset <n>", "Offset the result set", parseNumber)
    .option("--select <fields>", "Comma-separated field projection")
    .action(async (collectionPath: string, flags: ExportFlags, command: Command) => {
      const options = getGlobalOptions(command);
      const { profile } = await resolveProfile(options.profile);
      const firestore = createFirestoreClient(profile);

      const queryFn = flags.collectionGroup ? runCollectionGroupQuery : runQuery;
      const documents = await queryFn(
        firestore,
        collectionPath,
        flags.where.map(parseWhereClause),
        flags.orderBy.map(parseOrderBy),
        flags.limit,
        flags.offset,
        parseSelect(flags.select),
      );

      if (options.json && flags.out !== "-") {
        process.stderr.write(
          `Ignoring --json because export output is controlled by --out when writing to a file.\n`,
        );
      }

      await writeExport(flags.out, collectionPath, documents);
    });
}

function parseNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected a number but received "${value}".`);
  }
  return parsed;
}
