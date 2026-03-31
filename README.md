# Firestore CLI

`firestore-cli` is a clean, read-only Node.js CLI for exploring Firestore databases from the terminal.

## Why

Neither `gcloud firestore` nor the Firebase CLI offer a good terminal experience for exploring Firestore data. `gcloud` supports basic document reads but uses verbose protobuf-style output, lacks field projection, can't list subcollections, and doesn't support native Firestore query operators. The Firebase CLI has no read/query commands at all — it's focused on deploy, emulators, and rules.

This CLI fills that gap with clean output, native query syntax, named profiles for switching between projects, and recursive deep export of documents with their subcollections.

## Features

- Named profiles for cloud and emulator targets
- Root collection and subcollection listing
- Direct document reads with recursive deep export of subcollections
- Filtered, ordered, projected collection queries
- JSON exports to stdout or files
- Pretty terminal output by default, `--json` for machine-readable output

## Install

```bash
npm install
npm run build
```

For ad hoc usage during development:

```bash
npm run dev -- --help
```

## Global options

```
--profile <name>   Profile to use (overrides the default)
--json             Emit machine-readable JSON
--verbose          Include full stack traces in error output
```

## Profile setup

Create a cloud profile:

```bash
firestore profiles add dev \
  --project my-project \
  --credentials /absolute/path/service-account.json
```

Create an emulator profile:

```bash
firestore profiles add local \
  --project demo-project \
  --emulator-host 127.0.0.1:8080
```

Profiles also accept `--database <id>` for non-default Firestore databases.

Set a default profile:

```bash
firestore profiles use dev
```

List all profiles:

```bash
firestore profiles list
```

Show a single profile:

```bash
firestore profiles show dev
```

Remove a profile:

```bash
firestore profiles remove dev
```

## Examples

List root collections:

```bash
firestore collections list
```

List subcollections under a document:

```bash
firestore collections list users/ada
```

Read a document:

```bash
firestore doc get users/ada
```

Deep export a document with all subcollections:

```bash
firestore doc get users/ada --deep
```

Write a document to a file:

```bash
firestore doc get users/ada --deep --out ./ada.json
```

The `--deep` flag recursively fetches all subcollections and nests them under a `subcollections` key. `--out` works with or without `--deep`.

Run a query:

```bash
firestore query users \
  --where status,==,"active" \
  --order-by createdAt:desc \
  --limit 10
```

Field projection and offset:

```bash
firestore query users --select name,email --offset 20 --limit 10
```

Supported `--where` operators: `<`, `<=`, `==`, `!=`, `>=`, `>`, `array-contains`, `in`, `not-in`, `array-contains-any`.

Emit raw JSON:

```bash
firestore --json query users --where role,==,"engineer"
```

Export query results to a file:

```bash
firestore export users --where active,==,true --out ./users.json
```

Export to stdout:

```bash
firestore export users --out -
```

## Configuration

The CLI stores profiles in the OS config directory resolved by `env-paths("firestore-cli")`, for example:

- macOS: `~/Library/Application Support/firestore-cli/config.json`
- Linux: `~/.config/firestore-cli/config.json`
- Windows: `%APPDATA%/firestore-cli/config.json`

## Current limitations

- Read-only by design in v1
- Firestore Native mode only
- No collection-group queries yet
- No OAuth or interactive TUI flows
