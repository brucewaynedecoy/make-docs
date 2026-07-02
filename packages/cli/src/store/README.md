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

### Project identifier generation: random UUID (v4), minted once at setup

Chosen (W18 R10 P2): the stable project identifier is a random UUID (v4) from `node:crypto`'s `randomUUID()`, minted by `mintProjectId()` (`packages/cli/src/manifest.ts`) exactly once — on the first install apply that writes the project's `.make-docs/manifest.json` — persisted there as `projectId`, and preserved verbatim on every later sync, reconfigure, or skills-only apply. Re-running setup or sync never re-mints or changes an existing identifier (R-ID-1).

- Stability across clones, moves, and worktrees is achieved **by construction, not by derivation**: the identifier is not computed from anything that can change. It travels with the manifest file, so a moved directory, a fresh clone, or a linked worktree that carries the manifest carries the identity. Deriving from the path (changes on move), the git remote (changes on re-host, absent in non-git or pre-remote repos), or machine/environment details (changes per machine) would each violate R-ID-2's rationale.
- A random UUID was chosen over a hash of any project property because no project property is both universally present and immutable; over ULID/monotonic ids because ordering is meaningless for identity and `randomUUID()` is built-in with zero dependencies; and over shorter random tokens because UUID collision risk is negligible and the format is self-describing in the manifest.
- Consequence accepted: two clones of one repository share one identity (they carry the same manifest), which is the intended reading of R-TEST-2 — project-scoped state follows the project, not the checkout. A deliberately re-initialized project (manifest removed, setup re-run) is a new project and mints a new identifier.
- Compatibility (R-ID-1): manifests written before the identifier simply lack `projectId`. They load unchanged and are never rejected; every lifecycle operation (bare sync, reconfigure, audit, backup, uninstall) works with or without the field. The identifier is minted on the next install apply — which already rewrites the manifest — and the CLI prints an explicit migration notice rather than doing it silently.
- Identity resolution (`project-identity.ts`, exported as `resolveProjectIdentity`) is the only supported way to obtain a repository's `project_id`: it reads the manifest and returns an explicit status (`resolved` / `unminted` / `no-manifest` / `unreadable`). No store table or query resolves identity from a path; the `projects.root_path` column and its index exist solely for secondary lookup and display (R-ID-2), and the schema-audit conclusion stands: every project-scoped table keys by `project_id` plus the row's own key, with paths stored only as metadata columns.

### SQL schema and table layout (schema version 1)

Recorded in `PRAGMA user_version`; DDL lives in `STORE_MIGRATIONS` (`database.ts`).

- `projects` — the install and directory registry **mirror** (R-MIR-1): `project_id` (primary key; the manifest-minted identifier supplied by callers, R-ID-1), `root_path` (secondary lookup metadata only, never the key, R-ID-2; local-only data, R-PRIV-1), `package_name`, `package_version`, `registered_at`, `last_seen_at`.
- `playbook_runs` — the run-state facet of the unified project-state model, **relocated and canonical** here (R-MIR-2): keyed `(project_id, run_id)` with the run record stored as opaque JSON in `record`. The record shape and progression semantics stay owned by the W18 R7 lineage (R-SCOPE-1); this module never interprets the payload.
- `work_evidence` — the work-execution evidence facet: keyed `(project_id, wave_slug, phase_path, evidence_kind)`, i.e. the project identifier plus the canonical work-item identity components produced by the retained work-item identity resolver (R-PS-3), with the evidence payload as opaque JSON and `repo_root` as secondary metadata.

Both facets share one model and one migration path (R-PS-2): same database, same keying discipline, same schema version. `deleteProjectRows` prunes all three tables by `project_id` in one transaction — the seam `setup remove` uses (R-LIFE-2).

W18 R10 P3 decision: the unified project-state model **stays on schema version 1**. The v1 layout already carries both facets on one migration path — the run-state seam, the identity-keyed evidence, and the registry mirror are all expressible over the v1 tables — so no v2 migration was warranted. The model layer lives in `project-state.ts`: `PROJECT_STATE_TABLE_ROLES` encodes mirror-versus-relocated per table (R-MIR-2), `WorkItemIdentity` is the canonical work-item identity tuple, and `recordWorkEvidence`/`readWorkItemEvidence`/`listWaveEvidence` accept that tuple verbatim — the store records against the identity the retained work-item identity resolver produced and never re-derives it (R-PS-3).

### Run-state facet seam (create / read / transition)

The storage seam PRD 35's R-STORE-1/R-STORE-2 consume (`state-rows.ts`): `createPlaybookRunRecord` (INSERT; throws `PlaybookRunExistsError` on collision), `readPlaybookRunRecord`, `transitionPlaybookRunRecord` (UPDATE; throws `PlaybookRunNotFoundError` when the run does not exist, so a transition can never silently create state), and `listPlaybookRunRecords`, all keyed `(project_id, run_id)`. The record is opaque JSON end to end: this module defines no status vocabulary, no progression rules, and no record fields beyond what storage needs — the shape and semantics stay owned by the W18 R7 lineage (R-SCOPE-1).

### Checkpoint-to-evidence field mapping (W18 R10 P3, Stage 2)

The per-repo checkpoint JSON at `.make-docs/runs/<wave-slug>/state.json` is retired as a write target (R-BND-2). Its genuine-state fields become work-execution evidence rows keyed by the canonical work-item identity; its re-derivable fields are dropped, per the keep/remove disposition in `docs/assets/artifacts/migrated-operations-inventory.md` (the checkpoint JSON is not ported verbatim, R-PS-2). Evidence writers/readers live in `packages/cli/src/operations/lifecycle/index.ts` (`WORK_EVIDENCE_KINDS`).

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
| `schemaVersion`, `createdAt`, `updatedAt` | **Dropped** | File-format bookkeeping; store rows carry `recorded_at` |
| `waveSlug`, `waveDir`, `target`, `coordinate`, `mode`, `nextPhasePath`, `activePhasePath` | **Dropped** | Resolver outputs, re-derivable from `docs/work/` by the retained work-item identity resolver; `waveSlug` survives only as a key component |

### Legacy checkpoint file handling

PRD 38 and the inventory are silent on whether old checkpoint files are removed, so this is a recorded implementer decision: **migrated files are removed**. The mutating `checkpoint` operation migrates a legacy file (read old → write evidence rows for kinds the store does not already hold → delete the file and prune emptied `runs/` directories) because relocated-canonical state must have no in-repo copy (R-MIR-2); evidence already in the store is never overwritten by legacy data. Read-only operations (`phase-gate`, `wave-status`) consult a not-yet-migrated file read-only for kinds missing from the store and never write or delete it, so reads stay side-effect free. Consumer repos migrate lazily at runtime on their next checkpoint; nothing is hand-migrated. Once migrated, no code path writes work-lifecycle state under any repository path; the mutating checkpoint fails explicitly (rather than falling back to a repo write) when the project identity is unresolvable or the store is unavailable, while reads degrade to "no recorded evidence" with a warning (R-DB-4).

### Registry mirror behavior (Stage 3)

`registry-mirror.ts` keeps the `projects` table strictly subordinate to project manifests (R-MIR-1):

- **Upsert hook**: the CLI apply flow (`runCli` in `cli.ts`) calls `mirrorProjectManifest` immediately after `bootstrapGlobalStore`, at the same post-apply seam — refreshing the mirror row from the manifest the apply just wrote. Mirror failures degrade to warnings and never affect the applied install.
- **Authoritative read**: `readAuthoritativeInstallRecord` always loads `.make-docs/manifest.json` and never consults the registry; a stale mirror row can never override the manifest.
- **Rebuild**: `rebuildProjectRegistry` drops all mirror rows and re-mirrors the supplied project roots from their manifests in one transaction — lossless by construction, and it never touches the relocated-canonical `playbook_runs`/`work_evidence` rows.

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

Project-identifier **minting** lives with the manifest writer (`mintProjectId` in `packages/cli/src/manifest.ts`, invoked by the install apply in `packages/cli/src/install.ts`) because the identifier is manifest-recorded state; this module owns only its **resolution** (`project-identity.ts`). The checkpoint evidence vocabulary and legacy-file migration live with the lifecycle operations (`packages/cli/src/operations/lifecycle/index.ts`), which consume this module's identity and evidence seams. Uninstall/setup-remove lifecycle behavior (P4), the Playbook run-record shape and progression semantics (W18 R7), the work operations' CLI/registry surfacing (W18 R11), project `.make-docs/config.yaml` overlay rules (PRD 24), and the pinned global asset cache (PRD 17) are owned elsewhere and only consume this seam.
