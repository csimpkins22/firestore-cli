import type { Command } from "commander";

import { ValidationError } from "../core/errors.js";

export interface GlobalCliOptions {
  json?: boolean;
  profile?: string;
  verbose?: boolean;
}

export interface QueryFlags {
  collectionGroup?: boolean;
  limit?: number;
  offset?: number;
  orderBy: string[];
  select?: string;
  where: string[];
}

export interface ParsedOrderBy {
  direction: "asc" | "desc";
  field: string;
}

export interface ParsedWhere {
  field: string;
  operator: FirestoreWhereOperator;
  value: unknown;
}

export type FirestoreWhereOperator =
  | "<"
  | "<="
  | "=="
  | "!="
  | ">="
  | ">"
  | "array-contains"
  | "in"
  | "not-in"
  | "array-contains-any";

const VALID_OPERATORS = new Set<FirestoreWhereOperator>([
  "<",
  "<=",
  "==",
  "!=",
  ">=",
  ">",
  "array-contains",
  "in",
  "not-in",
  "array-contains-any",
]);

export function collectOption(value: string, previous: string[] = []): string[] {
  previous.push(value);
  return previous;
}

export function getGlobalOptions(command: Command): GlobalCliOptions {
  return command.optsWithGlobals<GlobalCliOptions>();
}

export function parseWhereClause(input: string): ParsedWhere {
  const [field, operator, ...rest] = input.split(",");
  if (!field || !operator || rest.length === 0) {
    throw new ValidationError(
      `Invalid --where clause "${input}". Expected format "field,op,value".`,
    );
  }

  if (!VALID_OPERATORS.has(operator as FirestoreWhereOperator)) {
    throw new ValidationError(
      `Unsupported Firestore operator "${operator}" in --where clause "${input}".`,
    );
  }

  const rawValue = rest.join(",");
  const value = parseLiteral(rawValue);

  if (
    (operator === "in" || operator === "not-in" || operator === "array-contains-any") &&
    !Array.isArray(value)
  ) {
    throw new ValidationError(
      `Operator "${operator}" requires a JSON array value in --where clause "${input}".`,
    );
  }

  return {
    field,
    operator: operator as FirestoreWhereOperator,
    value,
  };
}

export function parseOrderBy(input: string): ParsedOrderBy {
  const [field, direction = "asc"] = input.split(":");
  if (!field) {
    throw new ValidationError(`Invalid --order-by value "${input}".`);
  }

  if (direction !== "asc" && direction !== "desc") {
    throw new ValidationError(
      `Invalid order direction "${direction}" in --order-by "${input}". Use asc or desc.`,
    );
  }

  return {
    direction,
    field,
  };
}

export function parseSelect(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const fields = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (fields.length === 0) {
    throw new ValidationError("Expected at least one field in --select.");
  }

  return fields;
}

export function parseJsonData(input: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new ValidationError(`Invalid JSON: ${input}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ValidationError("Expected a JSON object, not an array or primitive.");
  }

  return parsed as Record<string, unknown>;
}

export function parseLiteral(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed) ||
    /^[\[{"]/.test(trimmed)
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}
