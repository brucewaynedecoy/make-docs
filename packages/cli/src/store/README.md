# Global Store Module

Machine-level global store at `~/.make-docs/` for Make Docs operational state (W18 R10; PRD 38 `docs/prd/38-revise-global-store-and-project-state.md`; design `docs/designs/2026-07-01-global-store-and-project-state.md`).

The store holds **operational state only** — never shipped template assets, never project knowledge. Its presence or absence changes nothing about the non-optional local repository bootstrap (R-STORE-3): `bootstrapGlobalStore` runs after the install plan is applied, writes only under the store root, and feeds nothing back into planning or apply.

## Contents

| File | Purpose |
| --- | --- |
| `config.json` | Global configuration: machine-level and tool-level settings (self-update preference, marketplace auto-registration opt-in). |
| `manifest.json` | Global manifest: tool-level state (last bootstrap, database status and schema version). |
| `store.db` (+ `-wal`/`-shm`) | SQLite database: install/directory registry mirror and the unified project-state model. |

The store root is `~/.make-docs/`, overridable via the `MAKE_DOCS_HOME` environment variable or an explicit `storeRoot`/`homeDir` option so tests and sandboxes never touch the real home directory.

## D10 Implementer Decisions

The design's D10 section fixes the store location, contents, identity keying, single project-state model, and mirror-versus-relocated distinction, and deliberately leaves the following to the implementer. These are the decisions this module records; they are implementation detail, not contract, and may be revised by future migrations.

### SQLite driver: built-in `node:sqlite`

Chosen: the Node built-in `node:sqlite` module, loaded lazily via `createRequire` (`database.ts`).

- `better-sqlite3` was rejected because it is a native (node-gyp) dependency; for an npx-distributed CLI this adds install-time compilation or platform-prebuilt weight and a failure mode outside our control on unusual platforms. The CLI currently has zero native dependencies and this keeps it that way.
- `node:sqlite` requires Node >= 22.5 while the package engine floor is `>=18`. On runtimes without the module (Node 18/20, both end-of-life), the database reports `unavailable` through the same graceful-degradation path R-DB-4 mandates for a missing database: the config and manifest are still created, repository operations are unaffected, and a diagnostic names the runtime requirement. This is a deliberate tradeoff — the pre-EOL runtimes lose only optional operational-state recording, not any repository behavior.
- Pure-JS/WASM drivers (`sql.js`) were rejected because they cannot provide real cross-process WAL concurrency (R-DB-3).

### Global config and manifest file formats: JSON

Both files are pretty-printed JSON, written atomically (temp file + rename, `json-files.ts`).

- The global config is deliberately **JSON, not YAML**, so it is structurally distinct from the project-owned presentation overlay at `<repo>/.make-docs/config.yaml` and the two can never be confused or cross-read (R-STORE-2, R-KEEP-1). The global config loader takes only a store root and never reads a project directory; no project config loader reads the store.
- Shape: `config.json` is `{ schemaVersion, settings: { selfUpdate: "prompt" | "auto" | "off", marketplaceAutoRegistration: boolean } }`; unknown or invalid settings degrade to defaults with warnings.
- `manifest.json` is `{ schemaVersion, createdAt, updatedAt, lastBootstrap: { packageName, packageVersion, nodeVersion, at }, database: { file, schemaVersion, status } }`. It is tool-level state only; each project's `.make-docs/manifest.json` remains the canonical install record (R-MIR-1).

### SQL schema and table layout (schema version 1)

Recorded in `PRAGMA user_version`; DDL lives in `STORE_MIGRATIONS` (`database.ts`).

- `projects` — the install and directory registry **mirror** (R-MIR-1): `project_id` (primary key; the manifest-minted identifier supplied by callers, R-ID-1), `root_path` (secondary lookup metadata only, never the key, R-ID-2; local-only data, R-PRIV-1), `package_name`, `package_version`, `registered_at`, `last_seen_at`.
- `playbook_runs` — the run-state facet of the unified project-state model, **relocated and canonical** here (R-MIR-2): keyed `(project_id, run_id)` with the run record stored as opaque JSON in `record`. The record shape and progression semantics stay owned by the W18 R7 lineage (R-SCOPE-1); this module never interprets the payload.
- `work_evidence` — the work-execution evidence facet: keyed `(project_id, wave_slug, phase_path, evidence_kind)`, i.e. the project identifier plus the canonical work-item identity components produced by the retained work-item identity resolver (R-PS-3), with the evidence payload as opaque JSON and `repo_root` as secondary metadata.

Both facets share one model and one migration path (R-PS-2): same database, same keying discipline, same schema version. `deleteProjectRows` prunes all three tables by `project_id` in one transaction — the seam `setup remove` uses (R-LIFE-2).

### Migration strategy

An ordered, append-only list `STORE_MIGRATIONS`, each entry `{ version, description, statements }` (R-DB-2).

- A fresh database replays the full list; an existing one replays only versions above its recorded `user_version`. Each migration runs inside a `BEGIN IMMEDIATE` transaction paired with the `user_version` bump, so a migration either fully lands with its version or not at all.
- `update` applies pending migrations (R-LIFE-3): the installer apply flow calls `bootstrapGlobalStore`, which opens the database and migrates. When the dedicated `update` self-management command lands (CLI reorganization lineage, W18 R11), it calls the same `openStoreDatabase`/`applyStoreMigrations` seam.
- A database whose `user_version` is **newer** than `CURRENT_STORE_SCHEMA_VERSION` is never read or written: `openStoreDatabase` throws `StoreSchemaNewerError` with an explicit diagnostic naming both versions and telling the user to update the CLI. Downgrade-safe by construction.

### Locking discipline (WAL concurrency)

Every connection applies, in order: `busy_timeout = 5000`, `journal_mode = WAL`, `synchronous = NORMAL`, `foreign_keys = ON` (R-DB-3).

- **WAL** lets any number of readers proceed concurrently with the single writer, across processes (CLI, MCP server, agent sessions).
- **Short-lived connections**: the standard access pattern is `withStoreDatabase(storeRoot, fn)` — open, operate, close. No process holds a connection (or the write lock) across user-visible waits.
- **`busy_timeout`** makes contending writers queue up to 5 s instead of failing immediately; combined with short write transactions this makes writer collisions invisible in practice.
- **`BEGIN IMMEDIATE`** for multi-statement writes (migrations, project pruning) acquires the write lock up front, avoiding the deferred-upgrade deadlock pattern.

### Recovery path

A missing or corrupt database is **recoverable operational-state loss, never project-knowledge loss** (R-DB-4).

- Missing file: recreated fresh at the current schema on the next open.
- Corrupt file (open failure or failed `PRAGMA quick_check`): quarantined as `store.db.corrupt-<timestamp>` (stale WAL/SHM sidecars removed so they cannot replay), then recreated fresh. The bootstrap reports the quarantine path and states explicitly that no repository content was lost and state can be re-established.
- `bootstrapGlobalStore` never throws: every failure (unwritable store root, driver unavailable, newer schema, corruption) becomes a warning in the report, so no store condition can ever block installing, reading, or operating on a repository.

## Not in this module

Project-identifier minting (W18 R10 P2), the project-state read/write operations and checkpoint-evidence migration (P3), uninstall/setup-remove lifecycle behavior (P4), the Playbook run-record shape (W18 R7), project `.make-docs/config.yaml` overlay rules (PRD 24), and the pinned global asset cache (PRD 17) are owned elsewhere and only consume this seam.
