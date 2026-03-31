---
name: firestore
description: Explore Firestore databases using the firestore-cli. List collections, read documents, run queries, deep export documents with subcollections, and export results to JSON. Use when the user wants to read, query, explore, or export Firestore data.
---

# Firestore CLI Skill

Read-only explorer for Firestore databases via the globally installed `firestore` command.

## When to use

- User asks to read, query, explore, or export Firestore data
- User mentions Firestore collections, documents, or subcollections
- User wants to inspect or dump Firestore data from any project/emulator

## Prerequisites

The `firestore` CLI must be installed globally (`npm install -g @csimpkins22/firestore-cli`) and at least one profile must be configured.

## Always use --json

When running `firestore` commands programmatically, **always** use the `--json` global flag so output is machine-readable JSON. Place `--json` before the subcommand:

```bash
firestore --json collections list
firestore --json doc get users/ada
firestore --json query users --limit 10
```

## Commands

### Profiles

```bash
firestore --json profiles list
firestore --json profiles show <name>
firestore profiles add <name> --project <id> --credentials <path>
firestore profiles add <name> --project <id> --emulator-host <host:port>
firestore profiles add <name> --project <id> --credentials <path> --database <id>
firestore profiles use <name>
firestore profiles remove <name>
```

### List collections

```bash
firestore --json collections list                    # root collections
firestore --json collections list <documentPath>     # subcollections
```

### Read a document

```bash
firestore --json doc get <documentPath>
firestore --json doc get <documentPath> --deep                    # recursive subcollections
firestore doc get <documentPath> --out ./output.json              # write to file
firestore doc get <documentPath> --deep --out ./output.json       # deep export to file
firestore doc get <documentPath> --out -                          # write to stdout
```

### Query a collection

```bash
firestore --json query <collectionPath> \
  --where <field>,<op>,<value> \
  --order-by <field>:<asc|desc> \
  --select <field1>,<field2> \
  --limit <n> \
  --offset <n>
```

All query flags are optional. Multiple `--where` and `--order-by` flags can be combined.

Supported `--where` operators: `<`, `<=`, `==`, `!=`, `>=`, `>`, `array-contains`, `in`, `not-in`, `array-contains-any`.

For `in`, `not-in`, and `array-contains-any`, the value must be a JSON array:
```bash
--where 'status,in,["active","pending"]'
```

### Export query results

```bash
firestore export <collectionPath> --out <file|-> \
  --where <field>,<op>,<value> \
  --order-by <field>:<asc|desc> \
  --select <field1>,<field2> \
  --limit <n> \
  --offset <n>
```

`--out` is required. Use `--out -` for stdout.

## Global flags

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON output (place before subcommand) |
| `--profile <name>` | Override the default profile for this command |
| `--verbose` | Include full stack traces on errors |

## Workflow guidance

1. **Start by listing profiles** to confirm connectivity: `firestore --json profiles list`
2. **List root collections** to understand the database structure: `firestore --json collections list`
3. **Explore specific collections** with queries: `firestore --json query <collection> --limit 5`
4. **Read individual documents** when you know the path: `firestore --json doc get <path>`
5. **Use --deep** when you need a document and all its nested subcollections
6. **Use --out** when the user wants to save results to a file
7. **Use --select** to reduce output noise when only specific fields are needed
8. **Check subcollections** on any document: `firestore --json collections list <documentPath>`

## Output shapes

### collections list
```json
[{ "id": "users", "path": "users" }]
```

### doc get
```json
{ "createTime": "...", "data": {...}, "id": "...", "path": "...", "updateTime": "..." }
```

### doc get --deep
```json
{ "createTime": "...", "data": {...}, "id": "...", "path": "...", "updateTime": "...", "subcollections": { "orders": [{...}] } }
```

### query / export
```json
{ "collectionPath": "...", "count": 2, "documents": [{...}] }
```

## Error handling

- Missing documents return exit code 4 with message: `Document "path" was not found.`
- Invalid `--where` syntax throws a validation error with the expected format
- Use `--verbose` to get full stack traces for debugging
