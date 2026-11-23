# Global Store Module

Machine-level global Store at `~/.make-docs/` for Make Docs operational state (W18 R10; PRD 38 `docs/prd/38-global-store-and-project-state.md`; designs `docs/designs/2026-07-01-global-store-and-project-state.md` and `docs/designs/2026-11-22-store-review-and-maintenance.md`).

The Store holds **operational state only**: never shipped template assets, never project knowledge. Its presence or absence changes nothing about the local repository bootstrap (R-STORE-3). `bootstrapGlobalStore` (`bootstrap.ts`) writes only under the Store root and feeds nothing back into planning or apply. Its one caller today is the tool-level `make-docs update` (`packages/cli/src/self/update-tool.ts`). Project setup prepares and converts the Store through the installation state path (`installation-state.ts` `prepareStore`) instead.

## Contents

| File | Purpose |
| --- | --- |
| `config.json` | Global configuration: machine-level and tool-level settings (self-update preference, marketplace auto-registration opt-in). |
| `manifest.json` | Global manifest: tool-level state (last bootstrap, database status and schema version). Only `bootstrapGlobalStore` writes it, so a Store that `make-docs update` never touched has no manifest. |
| `store.db` (+ `-wal`/`-shm`) | SQLite database, schema 8: 24 tables (see the table catalog below), each with its three write guard triggers. File mode `0600` on POSIX systems. |
| `store.db.bridge-v<from>-to-v8-<uuid>.backup` | Verified, private Store backup that a schema conversion makes before its first write. Make Docs keeps it until a separate cleanup approval permits deletion. Older conversions left `-to-v5-`, `-to-v6-`, and `-to-v7-` names. |
| `backup/store-clean-<time>-<id>.db` | Verified `VACUUM INTO` backup that `make-docs setup store clean` makes before it changes a row. Clean keeps the three newest. While clean writes and checks one, it is `backup/.store-clean-<time>-<id>.db.partial`; every failure deletes it, and the next clean removes one older than a day. |
| `removal.lock`, `installation-bootstrap.lock`, `installation-lease-recovery.lock`, `global-assets.lock`, and the Store access lease | Short-lived lock and lease files. A finished command leaves none of them. Store removal does not delete one that remains: it keeps it and reports it with the entries the Store does not own (`make-docs uninstall` leaves out its own `removal.lock`). |

The Store root is `~/.make-docs/`, overridable via the `MAKE_DOCS_HOME` environment variable or an explicit `storeRoot`/`homeDir` option so tests and sandboxes never touch the real home directory.

## Table catalog

`table-catalog.ts` (`make-docs.store-table-catalog.v1`) names every Store table, its writers and readers, its maintenance class, and the fixed rule or limit for each row class. A drift test (`tests/store-table-catalog.test.ts`) fails when a physical table, a writer, or a rule leaves the catalog. Schema 8 has 24 physical tables: `projects`, `playbook_runs`, `work_evidence`, `runs`, `run_evidence`, `store_checkpoint_journal`, `installation_checkouts`, `installation_ledgers`, `installation_operations`, `installation_steps`, `installation_locks`, `installation_migration_records`, `installation_transfers`, `tool_operations`, `store_schema_journal`, `store_migration_receipts`, `backlog_review_cache`, `project_register`, and the six work store tables `work_units`, `work_dependencies`, `work_links`, `work_claims`, `work_sync_ledger`, and `work_sync_conflicts`. `projects` and `playbook_runs` are legacy: no current command writes them.

## D10 Implementer Decisions

The design's D10 section fixes the Store location, contents, identity keying, single project-state model, and mirror-versus-relocated distinction, and leaves the following to the implementer. These are the decisions this module records. They are implementation detail, not contract, and later migrations may revise them.

### SQLite driver: built-in `node:sqlite`

Chosen: the Node built-in `node:sqlite` module, loaded lazily via `createRequire` (`database.ts`).

- `better-sqlite3` was rejected because it is a native (node-gyp) dependency; for an npx-distributed CLI this adds install-time compilation or platform-prebuilt weight and a failure mode outside our control on unusual platforms. The CLI currently has zero native dependencies and this keeps it that way.
- `node:sqlite` was added in Node 22.5 behind a flag. Node 22.13 makes it available without the flag. The package engine floor is `>=24.0.0`. If a runtime lacks the module, the database reports `unavailable` through the same graceful-degradation path R-DB-4 mandates for a missing database. The diagnostic names the runtime requirement.
- Pure-JS/WASM drivers (`sql.js`) were rejected because they cannot provide real cross-process WAL concurrency (R-DB-3).

### Global config and manifest file formats: JSON

Both files are pretty-printed JSON, written atomically (temp file + rename, `json-files.ts`).

- The global config is deliberately **JSON, not YAML**, so it is structurally distinct from the project-owned overlay at `<repo>/.make-docs/config.yaml` and the two can never be confused or cross-read (R-STORE-2, R-KEEP-1). The global config loader takes only a Store root and never reads a project directory; no project config loader reads the Store.
- Shape: `config.json` is `{ schemaVersion, settings: { selfUpdate: "prompt" | "auto" | "off", marketplaceAutoRegistration: boolean } }`; unknown or invalid settings degrade to defaults with warnings. `settings.marketplaceAutoRegistration` has no reader today; its schema and default stay owned here.
- `manifest.json` is `{ schemaVersion, createdAt, updatedAt, lastBootstrap: { packageName, packageVersion, nodeVersion, at }, database: { file, schemaVersion, status } }`. It is tool-level state only, never a project install record.

### Project identifier generation: random UUID (v4), minted once

Chosen (W18 R10 P2): the stable project identifier is a random UUID (v4) from `node:crypto`'s `randomUUID()`. It is minted once and then kept verbatim. Today the identifier lives in the project's `.make-docs/config.yaml` as `projectId`. When installation state creates the first checkout of a project with no `projectId`, it mints one (`installation-state.ts`); skills adoption uses `mintProjectId()` (`packages/cli/src/manifest.ts`). An older project keeps the `projectId` in its `.make-docs/manifest.json`, which identity resolution reads when the config has none. Re-running setup never re-mints or changes an existing identifier (R-ID-1).

- Stability across clones, moves, and worktrees is achieved **by construction, not by derivation**: the identifier is not computed from anything that can change. It travels with the project config file, so a moved directory, a fresh clone, or a linked worktree that carries the config carries the identity. Deriving from the path (changes on move), the git remote (changes on re-host, absent in non-git or pre-remote repos), or machine/environment details (changes per machine) would each violate R-ID-2's rationale.
- A random UUID was chosen over a hash of any project property because no project property is both universally present and immutable; over ULID/monotonic ids because ordering is meaningless for identity and `randomUUID()` is built-in with zero dependencies; and over shorter random tokens because UUID collision risk is negligible and the format is self-describing in the manifest.
- Consequence accepted: two clones of one repository share one identity (they carry the same config), which is the intended reading of R-TEST-2 — project-scoped state follows the project, not the checkout. A deliberately re-initialized project (identifier removed, setup re-run) is a new project and mints a new identifier.
- Compatibility (R-ID-1): manifests written before the identifier simply lack `projectId`. They load unchanged and are never rejected.
- Identity resolution (`project-identity.ts`, exported as `resolveProjectIdentity`) is the only supported way to obtain a repository's `project_id`: it reads the config `projectId`, then the manifest, and returns an explicit status (`resolved` / `unminted` / `no-manifest` / `unreadable`). No Store table resolves identity from a path; path columns (`projects.root_path`, `installation_checkouts.root_path`) are secondary lookup and display metadata (R-ID-2).
- `project_register` (schema 7, W32 R0 P3) records each project's ID, its optional config `projectName` (unique, lower case, at most 64 characters), and when Make Docs first and last saw it. `make-docs project list` reads it (`project-register.ts`). The work store resolves a project by name or ID only through it (`work-store.ts` `resolveWorkProject`, PRD 38 R-REGISTER-2).

### Project-state facets

DDL lives in `STORE_MIGRATIONS` (`database.ts`); `PRAGMA user_version` records the schema.

- `work_evidence` — the work-execution evidence facet: keyed `(project_id, wave_slug, phase_path, evidence_kind)`, i.e. the project identifier plus the canonical work-item identity components produced by the retained work-item identity resolver (R-PS-3), with the evidence payload as opaque JSON and `repo_root` as secondary metadata. `state-rows.ts` refuses a payload above 65,536 bytes of UTF-8 JSON (`WorkEvidencePayloadTooLargeError`).
- `runs` and `run_evidence` — lifecycle runs and their evidence (`lifecycle-runs.ts`).
- `projects` — legacy install and directory registry mirror (R-MIR-1). `registry-mirror.ts` (`mirrorProjectManifest`, `rebuildProjectRegistry`, `readAuthoritativeInstallRecord`) still exports the mirror functions, but no command calls them. Legacy identity adoption reads the table.
- `playbook_runs` — legacy Playbook run state as opaque JSON. `state-rows.ts` still exports `createPlaybookRunRecord`, `readPlaybookRunRecord`, `transitionPlaybookRunRecord`, and `listPlaybookRunRecords`, but no command calls them.

### Work store (schema 8, W29 R0 P2)

`work-store-schema.ts` holds the six work store tables and the map from each column to its PRD 38 R-MIN field (`WORK_STORE_COLUMN_REGISTER`). `work-store.ts` is the only code that reads and writes them. This phase adds no public operation; the `work` operations in W29 R0 P4 call the service.

- `work_units` holds each wave, revision, phase, stage, task, and quick item of a project, with its stable store ID, coordinate, parent, status, gates, blockers, and record revision. `work_dependencies` and `work_links` hold the unit's lists in order. Units, dependencies, and links are shared by every checkout of the project, and maintenance never removes them (`keep`).
- `work_claims` has one row for each unit, live or expired: `unit_store_id` is `UNIQUE`, so a second claim fails in the schema. An expired claim keeps its row until a takeover after a handle check or a release; no fixed rule removes it (`bounded`).
- `work_sync_ledger` (`keep`) and `work_sync_conflicts` (`bounded`) belong to one checkout and go when the checkout row goes.
- Every write carries an expected version: the record revision for units and claims, and the entry version for ledger and conflict rows. A wrong version is refused with `WorkStoreRefusalError` (`version-conflict`), and nothing changes. `writeWorkStore` records the project's `project_register` row in the same transaction. `readWorkStore` and `writeWorkStore` never create or migrate a Store: an absent or older Store is `store-unavailable` with one next action, and an unsafe or newer one is `store-unsafe`.
- `tests/w29-r0-p2-store-schema-and-records.test.ts` holds the R-MIN parity test (`workStoreSchemaDrift`), which fails when a column, a register entry, or an R-MIN field is on one side only.

`project-state.ts` holds the model layer: `PROJECT_STATE_TABLE_ROLES` encodes mirror-versus-relocated per table (R-MIR-2), `WorkItemIdentity` is the canonical work-item identity tuple, and `recordWorkEvidence`/`readWorkItemEvidence`/`listWaveEvidence` accept that tuple verbatim.

`deleteProjectRows` removes one project's `run_evidence`, `runs`, and `work_evidence` rows, and its `project_register` row once no checkout of it is bound, in one transaction. It keeps legacy `playbook_runs` and `projects` rows (W32 R0 P3; R-LIFE-2, R-REGISTER-4). It also keeps the project's work store rows; only a scoped cleanup after export removes them (W29 R0 P4 T12). Its only caller is `pruneProjectFromStore`, which no command calls today.

### Checkpoint-to-evidence field mapping (W18 R10 P3, Stage 2)

The per-repo checkpoint JSON at `.make-docs/runs/<wave-slug>/state.json` is retired as a write target (R-BND-2). Its genuine-state fields become work-execution evidence rows keyed by the canonical work-item identity; its re-derivable fields are dropped, per the keep/remove disposition in `docs/assets/project/migrated-operations-inventory.md` (the checkpoint JSON is not ported verbatim, R-PS-2). Evidence writers/readers live in `packages/cli/src/operations/lifecycle/index.ts` (`WORK_EVIDENCE_KINDS`).

| Legacy checkpoint field | Disposition | Evidence kind / rationale |
| --- | --- | --- |
| `phases.<p>.validation` (status, commands) | **Kept** | `validation` — recorded validation sign-off (inventory: "validation-passed") |
| `phases.<p>.review` (status, required) | **Kept** | `review` — recorded review pass/waiver and the explicit required flag (inventory: "review-passed or waived") |
| `phases.<p>.closeout` (status) | **Kept** | `closeout` — recorded closeout approval (inventory: "closeout-approved") |
| `phases.<p>.commit` (status, sha) | **Kept** | `commit` — the recorded binding of a phase to its commit; an "equivalent recorded decision" not reliably re-derivable from git |
| `phases.<p>.push` (status) | **Kept** | `push` — recorded push evidence consumed by the commit policy gate |
| `phases.<p>.notes` | **Kept** | `notes` — operator-recorded free-text decisions, not re-derivable |
| `commitPolicy` (wave level) | **Kept** | `commit-policy`, recorded per phase — a recorded gating decision, neither evidence-derivable nor repo-derivable (implementer decision: per-phase keying because the evidence key requires a phase path; an explicit gate parameter still wins) |
| `phases.<p>.status` | **Dropped** | Re-derivable from the phase document's task checkboxes (`parseWorkPhase().isComplete`); the gate never consumed it |
| `phases.<p>.phasePath` | **Dropped as a field** | It IS the row key (canonical identity component), not payload |
| `schemaVersion`, `createdAt`, `updatedAt` | **Dropped** | File-format bookkeeping; Store rows carry `recorded_at` |
| `waveSlug`, `waveDir`, `target`, `coordinate`, `mode`, `nextPhasePath`, `activePhasePath` | **Dropped** | Resolver outputs, re-derivable from `docs/work/` by the retained work-item identity resolver; `waveSlug` survives only as a key component |

### Legacy checkpoint file handling

PRD 38 and the inventory are silent on whether old checkpoint files are removed, so this is a recorded implementer decision: **migrated files are removed**. The mutating `checkpoint` operation migrates a legacy file (read old → write evidence rows for kinds the Store does not already hold → delete the file and prune emptied `runs/` directories) because relocated-canonical state must have no in-repo copy (R-MIR-2); evidence already in the Store is never overwritten by legacy data. Read-only operations consult a not-yet-migrated file read-only for kinds missing from the Store and never write or delete it. Once migrated, no code path writes work-lifecycle state under any repository path; the mutating checkpoint fails explicitly when the project identity is unresolvable or the Store is unavailable, while reads degrade to "no recorded evidence" with a warning (R-DB-4).

### Lifecycle seams: uninstall, setup remove, and update

- **R-LIFE-1 (tool uninstall)**: `removeGlobalStore` (`lifecycle.ts`) is called by the tool-level `make-docs uninstall --remove-store` (`packages/cli/src/self/uninstall-tool.ts`). It cannot delete repository content: it unlinks only the fixed Store filenames (config, manifest, database and its WAL/SHM files, and `store.db.corrupt-*` files) non-recursively under the resolved Store root, and removes the root only when it is empty. It keeps the Store backups on purpose (`store.db.bridge-*.backup` and the `backup/` folder of clean backups) and names them in `keptBackups`; uninstall says so before confirmation and prints "Removed the Store. Kept N backups at ..." after. Any other entry, such as a lock or lease file, is kept and reported as an entry the Store does not own. It refuses outright when the root carries project `.make-docs/` markers (`config.yaml`, `templates/`, and so on) — the misconfigured-`MAKE_DOCS_HOME` case — and when the `backup/` folder holds files other than Store clean backups (a file browser's `.DS_Store` or `Thumbs.db` does not count).
- **R-LIFE-2 (setup remove)**: `make-docs setup remove` (`runUninstallCommand` in `packages/cli/src/uninstall.ts`) removes one project's managed files and records the removal in installation state. It keeps the machine Store rows of the project and of every other project (`storeHandling: preserved`). `pruneProjectFromStore` (`lifecycle.ts`) prunes exactly one project's current rows through `deleteProjectRows`, but no command calls it today; a reviewed command in a later design adds one.
- **R-LIFE-3 (update migration and pre-v2 detection)**: Store schema conversion runs only through a reviewed `make-docs setup` (see the migration strategy below). Pre-v2 project configuration detection remains in `classifyCompatibilityState` (`packages/cli/src/compatibility.ts`): schema-version-1 manifests classify as `clean-v1`/`modified-v1`, and `guardCompatibilityDisposition` (`packages/cli/src/cli.ts`) presents the warning-and-backup-or-cancel flow.
- **Repository backups stay separate**: Store handling changes none of the repo-level behavior governed by PRDs 05, 28, and 38. Project backups stay under `.make-docs/backup/**`, and legacy root `.backup/**` stays protected. `tests/uninstall.test.ts`, `tests/backup.test.ts`, `tests/audit.test.ts`, and `tests/store-lifecycle.test.ts` hold the proof.

### Migration strategy

An ordered, append-only list `STORE_MIGRATIONS` (`database.ts`), each entry `{ version, description, statements }` (R-DB-2). The current schema is 8 (`CURRENT_STORE_SCHEMA_VERSION`).

- A missing database is created fresh at schema 8 by the paths that may create a Store (`openStoreDatabase`, setup preparation). Read-only commands such as `project list` and `setup store check` refuse a missing Store instead.
- Ordinary Store access refuses a supported older schema (1 to 7) instead of changing it, and names `make-docs setup` as the next step. Checkout move review, checkout move, and separate checkout registration use a schema 6 or 7 Store as it is, because schema 8 adds only tables that they never touch.
- `make-docs setup` first calls `previewStoreCompatibilityBridge` (`compatibility-bridge.ts`). The preview is read only. It lists the exact Store changes, the blockers, the kept history, and one next action.
- After review, setup prepares the Store (`installation-state.ts` `prepareStore` → `applyStoreMigrations`). It makes and verifies one private backup, `store.db.bridge-v<from>-to-v8-<uuid>.backup`, before the first schema write. Each migration runs in one `BEGIN IMMEDIATE` transaction with its `user_version` bump and its `store_schema_journal` row; any failure rolls it back. A migration that rebuilds a table runs `PRAGMA foreign_key_check` before and after, and refuses only a reference that it newly broke. The checkpoint-9 path (`migrateStoreDatabaseAtCheckpoint9`, called from `packages/cli/src/migration.ts`) converts a Store with a project migration and also writes a `store_migration_receipts` row; Store preparation writes no receipt row.
- Schema 5 archives old checkout device and inode strings, removes both active columns, copies checkpoint receipts to `store_migration_receipts`, and removes legacy projection mirrors from active installation ledger JSON. Schema 6 adds `backlog_review_cache`. Schema 7 (W32 R0 P2) adds `project_register`, the `failed` operation status with its four failure columns, the four bounded receipt columns on `installation_operations`, the widened `store_migration_receipts` check, and the write guard triggers on every table. Schema 8 (W29 R0 P2) adds the six empty work store tables with their guard triggers and keeps every row.
- A database whose `user_version` is **newer** than `CURRENT_STORE_SCHEMA_VERSION` is never written: classification reports it, and every open refuses it with `StoreSchemaNewerError` or the `store-unsafe` outcome, naming both versions.

### Write guard (R-WRITE-GUARD)

- Every Store table has `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers that call the SQL function `make_docs_write_guard()` (72 triggers on 24 tables). Only a Make Docs connection registers the function, in the one shared connection path `openSqliteWithRetry`. Any other SQLite connection, such as the `sqlite3` command, can read the Store, but its writes fail with `no such function: make_docs_write_guard` and change nothing.
- Each Make Docs open checks every table's three triggers against the exact SQL (`inspectStoreWriteGuard`). A missing or changed trigger, or a Store set back to an older `user_version` while it still has objects of a newer schema, such as the work store tables of schema 8 in a Store that reports schema 7 (`inspectStoreVersionRollback`), is `changed-outside`: the operation stops with `store-unsafe`, and the next action names `make-docs setup store check` and the newest Store backup.
- **Limit (R-WRITE-GUARD-6):** the guard stops accidental and casual direct writes. A program that runs as the same person and sets out to remove the guard is not blocked; Make Docs detects it at the next Store open. Agents write the Store only through Make Docs commands or MCP tools. `make-docs project state status` states this limit (`storeIntegrity.writeGuard`, from `STORE_WRITE_GUARD_LIMIT`).
- A virtual table that an older program added cannot carry triggers. Make Docs skips it and reports it in status.

### Maintenance: `setup store check` and `setup store clean`

`maintenance.ts` runs the fixed rules of the table catalog. `setup.store.check` reads only, also on a Store that was changed outside Make Docs (`openStoreForReview`). `setup.store.clean` backs up the Store to `backup/store-clean-<time>-<id>.db`, re-checks every planned row inside one `BEGIN IMMEDIATE` transaction, changes only rows whose proofs still pass, keeps the three newest clean backups, vacuums, and prints the restore steps. A clean with nothing to remove makes no backup and does not vacuum. Rules 003, 004, and 005 wait 30 days after an operation finishes (`terminalOperationRetentionDays`), so a Store whose operations are all newer than that has nothing to clean yet. Check and clean then say how many rows wait and the first day one can go (`waiting` in the check JSON). Sizes print in MiB with the label "MB".

People run `make-docs setup store check` and `make-docs setup store clean` in a terminal. Agents use the `setup_store_check` and `setup_store_clean` MCP tools. The two commands are not native command rules, because the harness contract forbids the word `setup` in a rule.

### Locking discipline (WAL concurrency)

Every connection registers the write guard function and sets `trusted_schema = ON` (the triggers call the function). The read-write Store open (`connect`) then sets `busy_timeout = 5000`, `journal_mode = WAL`, `synchronous = NORMAL`, and `foreign_keys = ON`, and runs `PRAGMA quick_check` on an existing file. The installation path (`openStoreSqliteConnection`) sets `busy_timeout = 5000` and `foreign_keys = ON`, and `synchronous = FULL` when it writes (R-DB-3).

- **WAL** lets any number of readers proceed concurrently with the single writer, across processes (CLI, MCP server, agent sessions).
- **Short-lived connections**: the standard access pattern is `withStoreDatabase(storeRoot, fn)` — open, operate, close. No process holds a connection (or the write lock) across user-visible waits.
- **`busy_timeout`** makes contending writers queue up to 5 s instead of failing immediately; combined with short write transactions this makes writer collisions invisible in practice.
- **`BEGIN IMMEDIATE`** for multi-statement writes (migrations, operation commits, clean) acquires the write lock up front, avoiding the deferred-upgrade deadlock pattern.

### Recovery path

A missing or corrupt database is **recoverable operational-state loss, never project-knowledge loss** (R-DB-4).

- Missing file: the next setup creates a fresh Store at schema 8.
- Corrupt, unknown, or newer file: Make Docs keeps it as it is and stops the operation (`store-unsafe`, "Repair or restore this Store before you run the command again. Do not create a replacement Store."). It never replaces the Store with a new empty one. Restore a verified backup: a `backup/store-clean-*.db` file or a `store.db.bridge-*.backup` file, copied over `store.db` after you delete `store.db-wal` and `store.db-shm`.
- `bootstrapGlobalStore` never throws: every failure (unwritable Store root, driver unavailable, newer schema, corruption) becomes a warning in its report, so no Store condition can block reading or operating on a repository's own files.

## Privacy (R-PRIV-1)

The path columns (`projects.root_path`, `installation_checkouts.root_path`, and `repo_root` metadata on evidence rows) record the path of every project where Make Docs is set up. **This data is local to the machine and is never transmitted.** Any future feature that would export or share Store contents (sync, diagnostics upload, cross-machine registry, telemetry of any kind) requires explicit user opt-in before any Store field leaves the machine; absent that opt-in, no such surface may be built.

Audit (W18 R10 P4, 2026-07-01; rechecked W32 R0 P5, 2026-11-23): the only outbound network call in the CLI is the pinned skill-source fetch in `packages/cli/src/skill-resolver.ts` (`fetchRemote`), an HTTP GET whose only request data is the manifest-supplied URL and a static `User-Agent: make-docs-cli` header — no Store fields, no project paths. No other `fetch`/`node:http(s)` usage exists under `packages/cli/src/`; there is no telemetry path. The MCP server is stdio-local; its tools reach the Store only through the same registry operations as the CLI. Structural enforcement: `tests/store-lifecycle.test.ts` asserts that no `src/store/**` source contains a network call or network-module import and that the one network-capable module never imports the Store, so Store rows cannot reach a network-bound payload builder.

## Not in this module

Project-identifier **minting** for skills adoption lives with the manifest code (`mintProjectId` in `packages/cli/src/manifest.ts`, called by `packages/cli/src/skills-adoption.ts`); this module owns resolution (`project-identity.ts`) and the checkout binding. The checkpoint evidence vocabulary and legacy-file migration live with the lifecycle operations (`packages/cli/src/operations/lifecycle/index.ts`). The Store maintenance operations and their CLI output live in `packages/cli/src/operations/setup/store-ops.ts` and `packages/cli/src/run/setup-store.ts`. The command tree (PRD 39), the pre-v2 compatibility classifier (`packages/cli/src/compatibility.ts`), project `.make-docs/config.yaml` overlay rules (PRD 24), and the pinned global asset cache (PRD 17) are owned elsewhere and only consume this seam.
