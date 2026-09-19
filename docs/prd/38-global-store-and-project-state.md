---
title: "38 Global Store and Project State"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-07-01-global-store-and-project-state.md"
---

# 38 Global Store and Project State

## Purpose

Accepted result: the owner accepted the implemented W19 R3 Store-state boundary on 2026-09-09. The [closed phase and evidence](../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) record package proof, reviewed live transfer, preservation checks, final fault checks, and installed CLI status. This acceptance does not close unrelated W19 R1 work.

This document defines the current product contract for stable project identity, machine-level Global Store state, and repository-state boundaries. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns stable project identity, machine-level Global Store state, and repository-state boundaries. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [global store and project-state design](../designs/2026-07-01-global-store-and-project-state.md), which is provenance rather than product authority.

### Scope and Boundaries (R-SCOPE)

- R-SCOPE-1 (MUST): this authority owns the global Store location, tool state, SQLite safety, stable project and checkout identity, installation records, migration progress, locks, receipts, harness-integration application evidence, recovery metadata, general lifecycle runs, privacy, and platform behavior. PRD 24 owns declarative project settings. PRD 17 owns resource resolution. PRD 28 owns harness adapter behavior. PRD 39 owns command grammar. The Store must not define document authority, restore retired Playbook/Protocol behavior, or interpret opaque legacy state.
- R-SCOPE-2 (MUST): a Make Docs project can exist and support repository-authoritative and Store-free behavior with no project Store or harness access configured. Absence of project access intent is `store-not-configured`, not corruption, unavailability, or denial. Required managed writes still need safe Store initialization and records before mutation.

### The Boundary Principle (R-BND)

- R-BND-1 (MUST): data placement follows one test — portable project knowledge and desired state stay in the repository; non-rebuildable local operational state and the minimum last-applied ownership needed for safe change stay in the global Store. Rebuildable Store indexes are caches, not authority.
- R-BND-2 (MUST): Make Docs installation, upgrade, migration, reconfiguration, managed-change, and removal journals live in the global Store. This includes applied ownership, required content digests, historical receipts, locks, writer records, old-operation controls, and recovery metadata. Desired project selections, selected project content, and product documents remain repository authority. No project-local operational copy, fallback, or renamed state directory is permitted.

### Minimal State Classes and Durable Field Register (R-MIN)

- R-MIN-1 (MUST): every durable fact has exactly one class: `repository-canonical and portable`, `Store-canonical and non-rebuildable`, `Store-cached and rebuildable`, `live-machine fact verified at use time`, `short-lived mutation guard`, `historical evidence`, or `obsolete and removable after migration`.
- R-MIN-2 (MUST): each current or target durable field follows the owner, writer, reader set, retention, privacy, and recovery use below. A physical schema may group fields differently, but it cannot change their class or create a second canonical writer.

| Durable record or field group | Class | Owner and only current writer | Reader set | Retention rule | Privacy rule | Recovery use |
| --- | --- | --- | --- | --- | --- | --- |
| Project config `projectId`, desired capabilities, harnesses, Skills, and resource selection | Repository-canonical and portable | Project config writer after reviewed project setup | Config, setup, resource, harness, and status readers | Retain with project history until the project owner changes or removes it | Project content; normal repository policy applies | Rebuild desired state and bind a local checkout without inheriting ownership |
| Global config machine preferences and machine approvals | Store-canonical and non-rebuildable | Reviewed machine setup or repair operation | Setup, harness policy, status, and removal | Retain until a reviewed machine change or Store removal | Local machine data; never expose secret proof in normal status or export | Rebuild machine intent without claiming current native state |
| `projects`: `project_id`, `root_path`, `package_name`, `package_version`, `registered_at`, `last_seen_at` | Store-cached and rebuildable | Project registry mirror writer | Registry and status | May be deleted and rebuilt after bound-checkout and live-project verification | Paths and package facts stay local and are redacted on export | Lookup only; never ownership or identity authority |
| `playbook_runs`: all fields and opaque `record` | Historical evidence | No current writer after target cutover; versioned legacy reader only | Explicit export, compatibility, and removal review | Preserve until its bridge exit and a separate export or deletion approval | Treat opaque data as private and potentially content-bearing | No current recovery action; preserve bytes without interpretation |
| `work_evidence`: all current fields and `payload` | Historical evidence for old rows; repository references are Store-cached if reintroduced | No current body writer after target cutover; bounded reference writer only under separate authority | Work evidence read, export, and compatibility | Preserve old rows through the bridge; current repository references can be rebuilt and removed | Do not retain document bodies, raw logs, prompts, or secrets in new rows | Point to evidence; never replace repository authority |
| `runs`: `project_id`, `run_id`, `run_type`, `lifecycle_stage`, `status`, `checkpoint`, `version`, `metadata`, and timestamps | Store-canonical and non-rebuildable | Lifecycle operation core | Lifecycle show, list, transition, evidence, status, and export | Retain until an explicit scoped project-state cleanup after export and terminal-state review | Bounded metadata only; no bodies, secrets, prompts, or arbitrary payloads | Resume legal transitions and preserve terminal operational history |
| `run_evidence`: identifiers, kind, reference type/value, digest, and time | Store-canonical when the external reference is non-rebuildable; Store-cached for a repository reference | Lifecycle evidence operation | Lifecycle evidence readers, status, and export | Non-rebuildable references follow their run; repository references may be rebuilt or pruned | Redact local absolute paths; store no evidence bodies | Reconnect a run to evidence without owning the evidence bytes |
| `store_checkpoint_journal`: all fields and `receipt_json` | Historical evidence, then obsolete and removable after migration | No current writer after bridge cutover | Compatibility, export, and bridge remaining-state check | Preserve until the bridge end condition and separate removal approval | Treat receipt JSON as private local evidence | Prove the old checkpoint cutover only |
| `installation_checkouts`: `checkout_id`, `project_id`, `created_at` | Store-canonical and non-rebuildable | Reviewed checkout bind or explicit identity repair | Installation, recovery, status, setup, and removal | Retain until explicit reviewed checkout-state removal | Local identifiers; do not export path linkage without redaction | Bind one local clone or worktree to portable project identity |
| `installation_checkouts.root_path` and last verification time/evidence | Store-cached and rebuildable mutable lookup | Verified path-update operation | Checkout lookup, status, lock planning, and recovery | Retain while the checkout binding exists; replace only through the path-update rule | Local path; keep local and redact on export | Locate and verify the checkout; never authorize identity or ownership change |
| `installation_checkouts.root_device` and `root_inode` | Obsolete and removable after migration | No target writer; versioned legacy reader only | Compatibility reader and one bridge remaining-state check | Remove only after the bridge exit contract and separate removal approval | Local file-system facts | Legacy comparison evidence only; never current identity authority |
| Target project last-applied ownership: stable asset or resource id, target path, content digest and algorithm, provider id and version or immutable ref, applied time, and recovery reference | Store-canonical and non-rebuildable minimum last-applied state | Shared install or resource apply operation | Verify, refresh, repair, remove, audit, status, and recovery | Retain while Make Docs claims local applied ownership; remove only after verified removal or explicit ownership release | Paths and digests stay local; no content bodies or secrets | Prove exactly which unchanged bytes Make Docs may refresh, remove, or restore |
| `installation_ledgers.manifest_json`, layout ledger, and layout state beyond the target fields | Historical evidence, then obsolete and removable after migration | No old-form writer after target cutover | Versioned compatibility reader, export, and bridge check | Preserve until converted or kept as opaque history and the bridge exit is approved | Treat embedded paths, hashes, and saved state as private | Translate verified old ownership into the target form without dual authority |
| `installation_operations`: identifiers, checkout, operation, status, before/after ledger references, times, `plan_complete`, failure code, safe summary, failed stage, and next action | Store-canonical and non-rebuildable | Shared mutation journal | Setup, status, recover, audit, and removal | Keep active and failed rows while recovery is possible; after closure retain a bounded receipt and failure summary until explicit scoped cleanup | Bounded facts only; no raw terminal output, secrets, or project bodies | Decide resume, rollback, no-effect rollback, or stop after restart |
| `installation_steps`: operation, ordinal, relative path, before/after evidence, and applied state | Store-canonical and non-rebuildable while recovery is open; historical digest summary after closure | Shared mutation journal | Apply, verify, resume, rollback, and status | Keep exact recovery evidence until the operation and required backup reach a terminal verified state; then remove saved bytes under scoped cleanup and keep required digests | Saved bytes and paths are sensitive local recovery data | Apply in order and restore only verified unchanged targets |
| `installation_locks`: root, token, process id, host, and acquired time | Short-lived mutation guard | Platform lock service | Current writer, status, and accepted stale-lock recovery | Delete on release or accepted stale recovery; never retain as identity history | Host and path stay local | Exclude competing writers for one mutation window |
| `installation_migration_records`: kind, record id, and record JSON | Store-canonical for live recovery kinds or historical evidence for closed compatibility kinds | Migration operation; each kind declares one class at registration | Migration, recovery, status, export, and bridge checks | Live recovery kinds last through verified terminal recovery; historical kinds follow their bridge exit and explicit removal approval | Each kind declares bounded fields; no unbounded payload or secret | Preserve backup, import, quiescence, and recovery evidence by declared kind |
| `installation_transfers`: checkout, source path and digest, status, and import time | Obsolete and removable after migration | No target writer after bridge cutover | Compatibility reader and remaining-state check | Preserve through the local-state transfer bridge, then remove only after its exit and separate approval | Local source paths are private | Prove one-time import and cleanup only |
| `tool_operations`: operation id, operation, status, process, host, bounded metadata, and times | Store-canonical while active; historical evidence after terminal result | Tool operation journal | Tool mutation, harness history, status, and Store removal guard | Keep active rows through recovery; retain bounded terminal result until explicit tool-history cleanup | No secrets, bodies, or raw output; host data stays local | Guard tool-wide mutation and Store removal after restart |
| Receipt history: receipt id, subject ids, adapter and method, operation, before/after digests, result, verification facts, package provenance, and time | Historical evidence | Owning operation after verified result | Audit, status history, compatibility, and export | Retain until the owning history policy or bridge exit permits scoped removal | Never store secret proof; redact local paths on export | Explain what happened; never grant current caller access |
| `store_schema_journal`: schema version, description, and committed time | Historical evidence | Schema migration transaction | Store verifier, migration, status, and support | Retain one immutable row per accepted schema version for the Store lifetime | No project content or secrets | Prove ordered schema history and block unsafe downgrade |
| Global manifest minimum last-applied global asset ownership | Store-canonical and non-rebuildable | Reviewed global asset operation | Verify, update, remove, status, and recovery | Retain while Make Docs claims global ownership; remove after verified removal or explicit ownership release | Paths and digests stay local | Safe global refresh, removal, and recovery |

- R-MIN-3 (MUST): a target writer writes only the target form. Old broad manifests, durable device or inode fields, transfer rows, checkpoint rows, and opaque legacy tables have versioned readers but no new writes after their cutover.
- R-MIN-4 (MUST): removal is by record class and reviewed scope. It cannot delete project content, another checkout's state, opaque legacy data, or non-rebuildable evidence that still supports recovery. Export is explicit, local, redacted, and read back before approved deletion.
- R-MIN-5 (MUST): receipts and content digests prove a past operation or named bytes only. They never prove current caller identity, project intent, checkout identity, or live native state.

### Store Location and Contents (R-STORE)

- R-STORE-1 (MUST): when Make Docs is installed on a system, the CLI resolves the platform-appropriate user data root through supported operating-system APIs and creates the Make Docs Store there, conventionally represented as `~/.make-docs/`; it contains at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data. Implementations must not assume a POSIX home path on Windows or embed an unvalidated user-supplied path.
- R-STORE-2 (MUST): the global configuration file is machine-level and tool-level. Machine settings such as a self-update preference, marketplace auto-registration opt-in, selected harnesses, and the maximum approved connection method per harness live there. It records desired machine intent, not proof that a harness-native file is current. It must not be confused with, or override, project `.make-docs/config.yaml`, which remains the project-owned declarative configuration defined by [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).
- R-STORE-3 (MUST): the global Store is distinct from machine-installed system resources and any pinned cache; it holds operational state, not shipped template assets or repository documents, and its presence or absence must not weaken repository authority or the deterministic local-router fallback defined by [17-system-asset-materialization-and-local-bootstrap.md](17-system-asset-materialization-and-local-bootstrap.md).

- R-STORE-4 (MUST): every resolved Store root, override, database, lock, journal, temporary-state, and recovery metadata path remains outside the target project and all registered checkouts. Validate canonical paths and existing parent links before access, then revalidate under the lock before mutation. Reject project-contained overrides, symlink aliases, traversal, case collisions, and unsupported permission or filesystem states. Never fall back to a project path.
- R-STORE-5 (MUST): agent and operation results distinguish `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied`. A Store-backed refusal stops only the affected operation. Store-free operations and ordinary repository work continue with no direct Store write, project-local fallback, queued write, or false success.

### The SQLite Database (R-DB)

- R-DB-1 (MUST): the SQLite database is the operational store; it holds the install and directory registry, the project-state model, and other operational data as needs emerge.
- R-DB-2 (MUST): the database carries a schema version and a defined migration strategy; `update` applies migrations, and a database from a newer schema than the running CLI is handled explicitly rather than corrupted.
- R-DB-3 (MUST): the Store serializes CLI, MCP, and agent writers with transactions, bounded busy retry, and Store-owned locks. Bootstrap uses an external Store lock that works before schema creation; it must not depend on a table that the pending migration creates. A canonical target path may scope a temporary pre-identity lock, but is not persistent project identity. Repository lock files are forbidden. Unsupported filesystem locking stops writes.
- R-DB-4 (MUST): absent, unreadable, corrupt, unknown, or newer Store state does not block reading repository knowledge or packaged resources. It blocks operations that require installation ownership or recovery state until explicit safe initialization or recovery succeeds. Never infer managed ownership from matching file names, a shared project identifier, or a new empty database. Fresh setup may initialize a missing Store only after source classification proves its scope. Existing files require a reviewed adoption plan. Corrupt bytes are preserved; they are never silently replaced.
- R-DB-5 (MUST): Store classification, exclusive bootstrap locking, and any required schema migration occur before project mutation. Schema DDL, `user_version`, and the Store schema journal commit in one SQLite write transaction. The former checkpoint-9 timing does not defer this prerequisite. Pre-commit failure rolls back that transaction. Post-commit recovery never replaces the whole Store or database. Schema journals and project-operation journals have distinct subjects and no project-local receipt projection.

### Stable Project Identity (R-ID)

- R-ID-1 (MUST): setup preserves or mints a stable project identifier in project-owned `.make-docs/config.yaml` as declarative identity. It is knowledge shared with the project, not proof of installation ownership. The Store binds a separate checkout identifier to each verified local installation. Project-operation records use project id, checkout id, and their own operation or record key.
- R-ID-2 (MUST NOT): a directory path is not the primary key of persistent project state. Paths are secondary lookup metadata. A verified move may update that lookup; clones and worktrees sharing a project identifier receive distinct checkout bindings and do not inherit installed ownership without review. Missing or conflicting identity stops mutation until an explicit resolution.

### Checkout Binding and Path Update Safety (R-CHECKOUT)

- R-CHECKOUT-1 (MUST): a path update can change only current root lookup data and its verification time or evidence. It cannot change project id, checkout id, local ownership, or the one-checkout-per-clone and worktree rule.
- R-CHECKOUT-2 (MUST): a verified move requires the old path to be absent, matching repository project identity, matching managed-content facts, no competing checkout claim, and no pending operation. Device, inode, path, content match, receipt, or package evidence cannot by itself authorize an identity update.
- R-CHECKOUT-3 (MUST): an unclear move, clone, path collision, or identity conflict stops only the affected mutation and shows review facts and one safe next action. The stop cannot rewrite identity, merge checkouts, transfer ownership, delete Store state, or choose a repair.
- R-CHECKOUT-4 (MUST): any repair that changes identity or ownership is a separate explicit reviewed action. A package update, remount, device-number change, inode-number change, or path-case change alone does not mint a new checkout or invalidate a verified project identity.

### General Lifecycle Runs and Evidence (R-PS)

- R-PS-1 (MUST): current run state uses a general `runs` relation keyed by stable project id and run id. Each row records `run_type`, `lifecycle_stage`, `status`, checkpoint, optimistic version, start, update, and optional finish timestamps, and bounded metadata; `run_type` is currently `lifecycle` only.
- R-PS-2 (MUST): lifecycle stages are `design`, `plan`, `prd`, `work`, `implementation`, `release`, `archive`, and `retrospective`; statuses are `active`, `paused`, `completed`, `failed`, and `abandoned`. The operation identifiers are `lifecycle.start`, `lifecycle.show`, `lifecycle.list`, `lifecycle.checkpoint`, `lifecycle.pause`, `lifecycle.resume`, `lifecycle.attach-evidence`, `lifecycle.complete`, `lifecycle.fail`, and `lifecycle.abandon`. Their CLI form is `make-docs run lifecycle <operation>`. P3 registers them as pending with `pendingLineage: W19 R1 P6`. P6 owns handler activation, state-transition validation, and optimistic concurrency. Each operation projects to an MCP tool.
- R-PS-3 (MUST): bounded evidence references use a separate `run_evidence` relation keyed by run id and evidence id, with evidence kind, a project-relative path or sanitized external reference, optional digest, and timestamp. The Store does not contain document bodies, screenshots, recordings, logs, prompts, secrets, credentials, or arbitrary tool payloads.
- R-PS-4 (MUST): every successful general lifecycle Store mutation returns a dedicated `LifecycleStoreMutationReceipt` with exactly `schemaVersion: 1`, `receiptId`, `operation`, `projectId`, `runId`, `storeSchemaVersion`, `resultingVersion`, and `committedAt`. The receipt identifier is a digest of the remaining receipt subject fields. Read-only operations return no mutation receipt. This receipt proves only the lifecycle Store transaction. Installation and migration use their own typed operational receipts under R-LIFE-5; they do not change lifecycle evidence meaning or prove phase acceptance.
- R-PS-5 (MUST): `run-capture-unavailable` remains ancillary only for optional general lifecycle capture. It records no repository mutation and implies no automatic retry. It cannot excuse failure to save required installation, migration, locking, provenance, or recovery state. Those failures stop the affected operation under R-DB-4.
- R-PS-6 (MUST NOT): legacy `playbook_runs` data remains opaque, untouched, and excluded from current run listings. Setup, update, migration, and lifecycle commands do not convert, delete, infer, or merge it into `runs`; any future adoption requires separate accepted authority and an explicit reviewed migration.
- R-PS-7 (MUST): `lifecycle.show` and `lifecycle.list` are valid for every run status. `lifecycle.checkpoint` is valid only for `active` or `paused` runs. `lifecycle.attach-evidence` is valid for every run status, but it does not change the run status or reopen a terminal run. `lifecycle.pause` is valid only from `active`; `lifecycle.resume` is valid only from `paused`; `lifecycle.complete` is valid only from `active`; and `lifecycle.fail` and `lifecycle.abandon` are valid only from `active` or `paused`. `completed`, `failed`, and `abandoned` runs reject checkpoints and every later status transition.
- R-PS-8 (MUST): when the CLI is not installed or cannot be invoked, agents allow ordinary project work to continue and report that Make Docs state capture was unavailable. They must not claim capture succeeded, write directly to the Store, create local fallback state, or queue a later write. Project documents, history breadcrumbs, and optional work backlog updates remain valid project content, not substitutes for Make Docs operational records. The same continuation rule applies when the CLI is present but optional general lifecycle capture fails. CLI-executed installs, upgrades, migrations, and other managed changes still require their Store records under R-DB-4. CLI availability does not imply Store availability.

### Mirror Versus Relocated (R-MIR)

- R-MIR-1 (MUST): the Store is the sole authority for minimum last-applied ownership, local checkout binding, operation journals, historical receipts, and recovery records. `.make-docs/manifest.json` and broad Store manifest forms are legacy transfer inputs only after their target cutover. Project config is the sole authority for declarative project identity and desired settings. Selected local resource bytes remain repository content. Desired state does not prove applied ownership, and applied state cannot rewrite desired state.
- R-MIR-2 (MUST): current lifecycle progress and bounded `run_evidence` references are canonical operational state in the Store, while the meaning and outcome of designs, plans, PRDs, work, validations, releases, archives, and retrospectives remain repository-authoritative. A Store row or receipt cannot override, synthesize, or replace the corresponding repository record.
- R-MIR-3 (MAY): when an authorized lifecycle operation captures performance execution, Project State or the Store may retain an optional, rebuildable, non-authoritative projection of run progress, environment fingerprints, observations, attempt or budget ledgers, and evidence references. The repository remains canonical for `PERF-###` identity and meaning, target and waiver authority, findings and dispositions, obligations, and active traceability under [48 Performance Evidence Governance](48-performance-evidence-governance.md). A receipt proves only that projection data was recorded; it does not prove a performance outcome or gate, satisfy conformance, or promote a support claim. This documentation-first boundary adds no run type, evidence kind, table, schema, or write path.

### Backup, Uninstall, and Upgrade (R-LIFE)

- R-LIFE-1 (MUST): tool `uninstall`, which removes the CLI itself, handles the global Store through an explicit reviewed preserve-or-remove choice and must not delete repository content. Store deletion is separately authorized from CLI removal, fails closed on unknown or corrupt scope, and preserves opaque legacy tables unless the reviewed action independently and explicitly includes them.
- R-LIFE-2 (MUST): project `setup remove` does not implicitly delete that project's Store rows. Removing Store state is a separate explicit reviewed action keyed by stable project identifier, must preserve opaque legacy tables, and must not affect other projects.
- R-LIFE-3 (MUST): `update`, `setup`, and `setup reconfigure` classify Store schema state before mutation. Supported migrations run transactionally after review and backup when destructive; newer-unknown, corrupt, or ambiguous state fails closed without rewriting the database.
- R-LIFE-4 (MUST): repository backup and reviewed content copies may remain under `.make-docs/backup/**` or their approved export destination. Legacy root `.backup/**` remains protected. The Store holds live backup indexes, restoration order, operation state, and recovery authority. A local backup description may explain saved bytes but cannot authorize or drive automatic recovery without verified Store records. Store backup does not absorb project document bodies. Tool uninstall, project removal, and content backup retain separate reviewed scopes.
- R-LIFE-5 (MUST): all migration steps write durable progress and receipts to the Store. Each operation records a unique id, stable project and checkout binding, frozen plan identity, step, before/after evidence, outcome, and recovery state. Commit intent before a project write and confirm the result after it. Repeat execution uses the saved operation and verifies actual bytes. A crash, receipt failure, or mismatch leaves a visible pending or failed operation; it must not report success, replay destructive work blindly, or fall back to local state.
- R-LIFE-6 (MUST): each installation operation can retain a stable failure code, a short safe failure summary, the stage that failed, and the last safe next action. A schema migration preserves old rows and treats absent fields as unknown. These fields must not contain secrets, document bodies, raw terminal output, or private file content. When the Store remains safe to write, the operation records this detail before it releases its context. A failure while recording the first fault does not erase prior recovery evidence or create a success claim.
- R-LIFE-7 (MUST): grouped setup keeps separate machine, project, Skills, and resource subplan status and recovery evidence. Each subplan commits only its own intent and result. A later subplan failure does not roll back, hide, or repeat an earlier verified subplan. Input refusal before any owned mutation creates no blocking operation.

### Skill Adoption State (R-SKILL-STATE)

These W19 R5 requirements record accepted direction. The owner accepted the R5 backlog on 2026-09-09 and authorized implementation. The tasks and proof remain pending. PRD [28](28-shared-agentics-installation-and-harness-exposure.md) owns adoption eligibility and review; PRD [39](39-cli-command-model-and-operation-registry.md) owns the `setup skills` command contract.

- R-SKILL-STATE-1 (MUST): reviewed Skill adoption records prospective ownership through the existing global Store installation and operation services. A content-noop adoption is still a required ownership transition. Preserve package version/hash evidence, source identity, selection, scope, native exposure, before/after ownership, backup references, and result. Do not fabricate prior ownership or use project-local receipts, locks, queues, or manifests.
- R-SKILL-STATE-2 (MUST): adoption dry-run is read-only and creates no Store, checkout identity, pending intent, backup, or local marker. Apply rechecks the reviewed inputs and ownership under the existing locks before committing intent. Required Store failure blocks managed file and ownership changes; optional-capture failure rules do not weaken this requirement.
- R-SKILL-STATE-3 (MUST): reuse current pending-operation, checkpoint, verification, and recovery behavior for adoption in both scopes. Commit required intent before mutation and verify results before completion. Interruption or result-capture failure stays visible and recoverable. Resume or rollback preserves later user edits, other owners, and unrelated projects; no separate Skill state engine is permitted.

### Harness Integration State (R-HARNESS-STATE)

- R-HARNESS-STATE-1 (MUST): global config records selected machine harnesses and the maximum method that the user approved for each harness. It does not contain applied-file proof, ownership hashes, or recovery state.
- R-HARNESS-STATE-2 (MUST): Store records retain historical receipt evidence for the exact adapter, method, operation, verified executable path and fingerprint where applicable, reviewed native configuration entries, before and after facts, ownership, applied version, verification result, drift state, and recovery status. These records explain past work and do not grant current access.
- R-HARNESS-STATE-3 (MUST): machine setup and project setup use separate operation identifiers and receipts. Machine setup completes and verifies before project setup begins. A later project failure does not roll back a valid machine result.
- R-HARNESS-STATE-4 (MUST): repeat setup reads global intent, project intent, live harness-native configuration, current executable proof where applicable, current owned native-entry proof, and Store receipt history. It reports current, missing, drifted, unsupported, blocked, and incomplete state. It changes only reviewed Make Docs-owned entries and resumes an incomplete operation without duplicating a verified change.
- R-HARNESS-STATE-5 (MUST): the effective permission is the most restrictive valid result across static adapter admission, machine intent, project intent, live native configuration, current executable proof where applicable, current owned native entry, and the requested operation. A receipt never grants access or overrules a removed or narrowed permission. Project config cannot widen machine trust.
- R-HARNESS-STATE-6 (MUST): this capability uses the current Store schema when its records fit existing installation and operation data. W19 R6 must not add a database migration solely for setup state. If implementation proves that safe records cannot fit, it must stop for new authority before changing the schema.
- R-HARNESS-STATE-7 (MUST): direct machine setup can safely initialize a missing Store and record its own intent and receipt without prior harness or MCP access. Project access remains absent until separate project intent is reviewed. Failure to create safe Store evidence stops only the managed machine change before native mutation; it does not block Store-free work or CLI remediation.
- R-HARNESS-STATE-8 (MUST): a bounded generic MCP profile retains a validated client label, reviewed machine ceiling, separate project intent, non-secret identity metadata, one-way secret proof when required, rotation state, configuration output digest, and lifecycle result. Current admission still verifies the profile, caller proof, and requested operation at call time. Normal status never returns secret proof. Unknown client files remain user-owned and untouched.

### Transfer and Recovery (R-XFER)

- R-XFER-1 (MUST): setup first previews legacy operational files and the exact import, preserve, and removal decisions. Supported local receipts, manifest fields, writer records, and old-operation markers are verified as data. Unknown, malformed, symlinked, contradictory, changed, or actively written inputs stop cleanup. Never execute embedded instructions.
- R-XFER-2 (MUST): import required records into the Store and read them back before removing the exact verified obsolete inputs. The Store records import identity and cleanup progress. Repeats resume safely without duplicate receipts. A directory is removed only when empty and proven safe. Project content, unrelated files, and opaque legacy rows remain intact.
- R-XFER-3 (MUST): resume and rollback use the same Store operation, reviewed snapshot, content digests, and scoped backup references. They preserve later user changes and other projects. A partial result reports restored, remaining, and conflicting paths. No whole-Store restore may undo other committed operations.
- R-XFER-4 (MUST): supported entry points share one Store service. The supported-version transition requires known old CLI or helper writers that cannot honor Store locking to stop before transfer. Active or unresolved writer evidence stops migration. Make Docs cannot guarantee exclusion against an unmodified unsupported binary launched later. Report that limit without keeping a permanent local marker or restoring retired state files.
- R-XFER-5 (MUST): CLI status and recovery expose pending steps, committed results, Store location, checkout binding, and safe next actions through PRD 39. History breadcrumbs can link to that result but never become migration authority.

- R-XFER-6 (MUST): the corrected CLI is the minimum supported writer after transfer. Setup names that boundary and blocks known active old writers through scoped evidence. Probe the actual prior package to document its guard or limit; do not claim that an immutable old binary obeys new Store rules. Use a declarative format guard only when that parser proves rejection before writes. No local marker, dual writes, automatic CLI replacement, broad process scan, or second-version bridge is required or permitted by this scope.
- R-XFER-7 (MUST): the Store service derives recovery actions from `plan_complete`, saved steps, before and after ledgers, checkout binding, lock state, and current file evidence. Resume is valid only for a complete verified plan. An incomplete zero-step operation with equal ledgers and no active lock can finish as a no-effect rollback that changes only its status and final time. Unknown or conflicting evidence blocks mutation and keeps the pending record visible.
- R-XFER-8 (MUST): fresh, v1, early-v2, partial, invalid-option, interrupted, and repeated setup can always reach status plus one safe next action. A repeat reads independent completed subplans and resumes only incomplete work. It never requires manual database edits, deletion of a pending row, successful prior MCP access, or a reinstall that does not change the failed condition.

### Privacy (R-PRIV)

- R-PRIV-1 (MUST): the Store records project paths only as local secondary lookup metadata. It never uploads them, document content, evidence bodies, prompts, credentials, secrets, or arbitrary payloads; any export is explicit, local, redacted, and relativizes project paths where possible, and any future sharing requires separate opt-in.
- R-PRIV-2 (MUST): Store paths and external evidence references are treated as data, not executable input. Reads and exports reject traversal and symlink escape, avoid following untrusted links or invoking referenced scripts, and apply platform-canonical comparisons for Windows drive/UNC, macOS case behavior, and Linux permissions.

### Platform Service Boundary (R-PLATFORM)

- R-PLATFORM-1 (MUST): the Store consumes one typed platform service for data and config roots, path normalization and comparison, case and volume behavior, safe real-path and link checks, atomic replace and directory sync, locks, process liveness, executable resolution, and short-lived file guards.
- R-PLATFORM-2 (MUST): the Store does not copy host rules into identity, setup, harness, resource, or migration modules. Project and checkout identity remain stable across platform-specific object numbers and path representation.
- R-PLATFORM-3 (MUST): core Store behavior has equal target scope on Windows, macOS, and Linux. A missing capability is a defect unless a time-bounded owner exception meets PRDs 10 and 16. A typed unsupported result is temporary containment, stops before mutation, and leaves Store-free work available.

### Preserved Prior Decisions (R-KEEP)

- R-KEEP-1 (MUST): project `.make-docs/config.yaml` remains project-owned. It holds declarative project identity, desired settings, and presentation conventions under PRD 24. It does not hold applied installation facts, operational progress, ownership proof, or recovery authority. Global config does not override that boundary.
- R-KEEP-2 (MUST): system-resource bodies are machine-served by default with explicit optional provenance-aware project projection; the Store remains separate from the installed resource provider, the always-local `.make-docs/system/**` router skeleton, projected resource bodies, repository routers, and any pinned cache.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): tests assert the `runs` and `run_evidence` schemas, exact lifecycle operation identifiers, CLI and MCP projections, pending-lineage refusal before P6 activation, lifecycle stages, statuses, legal transitions, optimistic conflicts, typed receipts, `run-capture-unavailable`, and the absence of Store writes under repository paths.
- R-TEST-2 (MUST): tests cover a verified move, a clone, a linked worktree, repeated setup, conflicting identifiers, and lost Store state. Project identity survives movement. Checkout ownership and pending operations never cross into another checkout merely because the project identifier matches.
- R-TEST-3 (MUST): tests prove repository and packaged-resource reads remain available when the Store is absent or unreadable, while required mutations fail before project writes. Recovery or adoption must not fabricate prior ownership, erase corrupt state, or overwrite user content.
- R-TEST-4 (MUST): tests assert project removal preserves Store rows unless separately authorized, explicit Store cleanup affects only the selected project, opaque `playbook_runs` remains unchanged and absent from current listings, and tool uninstall does not delete repository content.
- R-TEST-5 (MUST): tests cover transactional recovery, bounded busy retry, privacy-safe export, path traversal and symlink rejection, Windows drive/UNC and case-collision handling, macOS case behavior, and Linux permissions without persisting secrets or document bodies.
- R-TEST-6 (MUST): proof covers fresh setup, legacy transfer, repeat setup, reconfigure, resource ensure, project surface ensure, selected skills, update, backup, removal, restore, crash recovery, competing writers, and packed CLI execution. Assert the Store records every required operational transition and no project-local state directory, manifest, mirror, lock, receipt, or recovery journal is created. No test may hide `.make-docs/state/` changes from its comparison.
- R-TEST-9 (MUST): isolated-home proof covers machine and project harness intent, separate receipts, exact native configuration, executable identity, current and drifted states, interruption between machine and project operations, repeat setup, and preservation of unknown or user-owned entries.
- R-TEST-10 (MUST): Store-free operation proof fails if `resource.list` or `resource.read` opens the database, creates a session file, or requires a Store path. Store-backed setup proof uses the existing shared session and checkout-writer rules.
- R-TEST-7 (MUST): verify shipped agent guidance and the optional capture path with the CLI unavailable and with the CLI present but optional capture failing. Ordinary project work continues with an accurate unavailable notice, no false success, no direct Store write, no local fallback state, and no queued write. Pair this evidence with a CLI-managed operation whose required Store write fails. That operation must stop before further project changes and preserve recovery evidence.
- R-TEST-8 (MUST): prove ownership-only Skill adoption, stale review rejection for package/source/selection/input/ownership changes, read-only review without Store creation, required Store failure before managed changes, and interrupted adoption through shared recovery. Test both scopes and competing writers. Matching bytes alone must never hide a missing ownership transition or authorize unreviewed content.
- R-TEST-11 (MUST): prove plan-aware action selection for incomplete zero-step and complete partial operations. Prove failure detail survives process restart and matches human, JSON, and MCP results. Prove the no-effect rollback leaves project files and the installation ledger byte-identical, changes no other operation, and does not delete the historical row.
- R-TEST-12 (MUST): prove all four Store access states across human, JSON, MCP, and agent results. Prove `store-not-configured` opens no Store, and prove every Store-backed refusal leaves independent Store-free work available.
- R-TEST-13 (MUST): prove independent setup subplans by failing each machine, project, Skills, and resource part in turn. Earlier verified parts remain current and later repeat setup does not replay them.
- R-TEST-14 (MUST): prove direct machine setup can initialize a missing safe Store without existing MCP or harness access. Prove a failed Store initialization makes no native host change. Prove generic MCP identity, ceiling, rotation, removal, and secret non-disclosure without editing client-owned files.
- R-TEST-15 (MUST): remediation proof runs with Make Docs Store and MCP access unavailable in the maintainer checkout. It uses one exact installed package, temporary homes, disposable projects, and temporary Store roots. Store unavailability is a tested condition, not a remediation blocker.

This PRD fixes Store-only operational state, external Store paths, separate project and checkout identity, crash-safe recovery, the current lifecycle model, opaque legacy data, and local document authority. Physical SQL tables remain implementation choices within those requirements.

Code anchors:

- `packages/cli/src/manifest.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/uninstall.ts`
## Obligation and UAT State Boundaries

[R-OBL-STATE](45-deferred-obligation-governance.md#r-obl-state-repository-and-project-state-boundary) and [R-NUAT-STATE](46-naive-end-user-acceptance-testing.md#r-nuat-state-repository-and-evidence-boundary) keep repository artifacts authoritative for obligation meaning, requirement traceability, scenario definitions, terminal rationales, and durable findings. Project State or the Global Store may hold operational execution progress, run identifiers, evidence pointers, timestamps, environment metadata, resumability state, and bounded projections for discovery.

Screenshots, recordings, logs, and other bulky or machine-local evidence may live outside the repository when policy requires it, but repository records must retain stable references and conclusions. Any database projection is non-authoritative and must be rebuildable from repository authority plus preserved evidence. Current lifecycle capture uses the general `runs` and `run_evidence` contract above; it never derives authority from opaque legacy `playbook_runs`.

[48 Performance Evidence Governance](48-performance-evidence-governance.md) applies the same state boundary to performance evidence: the repository owns profile meaning, targets, waivers, findings, dispositions, and traceability, while optional machine state may project only operational run/evidence metadata and recording receipts. Missing optional projection cannot rewrite repository authority; when required evidence itself is missing, the performance proof remains unverified.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-09-18 — W22 R0

- Affected requirement or section: `Boundary Principle`, `Minimal State Classes and Durable Field Register`, `Stable Project Identity`, `Checkout Binding and Path Update Safety`, `Mirror Versus Relocated`, `Harness Integration State`, `Privacy`, and `Platform Service Boundary`
- Previous contract: The Store owned broad manifest, receipt, registry, migration, and file-identity state, with no complete field-level owner and retention register and with device and inode values persisted in checkout identity.
- Replacement contract: Each durable field has one class, owner, writer, reader set, retention, privacy, and recovery use; device and inode values are not durable identity; receipts are history; the Store keeps only non-rebuildable local state and minimum last-applied ownership.
- Rationale: The minimal model removes duplicate authority without losing safe recovery, local ownership proof, or opaque legacy evidence.
- Source: [W22 recovery design](../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [W22 plan](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md)

### 2026-09-15 — W19 R7

- Affected requirement or section: `Backup, Uninstall, and Upgrade`, `Transfer and Recovery`, and `Verification and Testability`
- Previous contract: Installation operations kept progress and recovery evidence, but the row lacked durable safe failure detail and the contract did not define plan-complete action selection or a zero-effect rollback.
- Replacement contract: Operations retain safe failure facts. Recovery offers resume only for a complete verified plan. A proved zero-step, equal-ledger, unlocked operation can close through a no-effect rollback that preserves the row and all unrelated state.
- Rationale: The installed CLI left an incomplete pending operation, recommended an unusable resume command, and retained too little detail to explain the first fault.
- Source: [W19 R7 design](../designs/2026-09-15-setup-interview-and-recovery-correction.md) and [plan](../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-overview.md)

### 2026-09-12 — W19 R6

- Affected requirement or section: `Scope and Boundaries`, `Store Location and Contents`, `Harness Integration State`, and `Verification and Testability`
- Previous contract: the Store held installation and Skill state, but it did not distinguish desired harness intent, live native permission, and exact applied adapter receipts.
- Replacement contract: global intent, project intent, live harness configuration, and Store evidence remain separate; machine and project setup have separate resumable receipts; Store-free reads open no session.
- Rationale: harness setup needs durable proof and drift recovery without making Store receipts the live permission authority or adding project-local state.
- Source: [Unified Setup and Harness Access](../designs/2026-09-12-unified-setup-and-harness-access.md) and [W19 R6 plan](../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md)

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — W18 R10

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current stable project identity, machine-level Global Store state, and repository-state boundaries requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Global Store and Project State design](../designs/2026-07-01-global-store-and-project-state.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Scope and Boundaries`, `The Boundary Principle`, `Store Location and Contents`, `The SQLite Database`, `General Lifecycle Runs and Evidence`, `Mirror Versus Relocated`, `Backup, Uninstall, and Upgrade`, `Privacy`, and `Verification and Testability`
- Previous contract: Project operational state centered on Playbook run-state and work-execution evidence, project removal pruned Store rows, legacy Playbook storage was treated as current behavior, and receipt, privacy, and cross-platform requirements were incomplete.
- Replacement contract: The Store provides general lifecycle `runs` and bounded `run_evidence`, typed mutation receipts, stable manifest-backed project identity, transactional and platform-safe operation, explicit privacy controls, repository authority, separately authorized cleanup, and opaque untouched legacy `playbook_runs` excluded from current listings.
- Rationale: Recovery requires a product-neutral operational Store that cannot overwrite repository truth, leak project content, or silently reinterpret removed Playbook/Protocol behavior.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-30 — W19 R1 P6

- Affected requirement or section: `General Lifecycle Runs and Evidence (R-PS)`
- Previous contract: P6 owned lifecycle state-transition validation, but current authority did not define the exact paused and terminal mutation matrix.
- Replacement contract: reads are valid in every status; checkpoints are limited to active or paused runs; evidence references can be added without reopening a run; pause, resume, complete, fail, and abandon have explicit source-status rules; and terminal runs reject checkpoints and later status transitions.
- Rationale: implementation and review need one deterministic matrix. The accepted model preserves audit evidence without allowing an evidence attachment to change lifecycle status.
- Source: accepted owner decision `P6-TRANSITIONS` in W19 R1 P6.

### 2026-08-30 — W19 R1 P6 safety design

- Affected requirement or section: `The SQLite Database (R-DB)`, `Backup, Uninstall, and Upgrade (R-LIFE)`, and `Verification and Testability (R-TEST)`
- Previous contract: checkpoint 9 required a transactional migration and safe recovery, but it did not define the commit boundary, journal authority, receipt-projection failure result, or post-commit restore prohibition.
- Replacement contract: setup classifies the Store before mutation; checkpoint-9 DDL, `user_version`, and an internal metadata-only journal row commit in one SQLite write transaction; the project receipt projects from that journal; two projection failures return a typed stop result; and no whole-Store or database restore occurs after commit.
- Rationale: one SQLite commit protects schema consistency and serializes writers. A journal-backed projection can recover without erasing later writes from another process or project.
- Source: accepted owner decision `P6-SAFETY-DESIGN` in W19 R1 P6.

### 2026-09-09 — W19 R3

- Affected requirement or section: R-BND, R-STORE, R-DB, R-ID, R-PS, R-MIR, R-LIFE, R-XFER, R-KEEP, R-TEST
- Previous contract: R-MIR-1 made the local manifest canonical. R-LIFE-5 required a local checkpoint-9 receipt projection. Project identity and some recovery rules relied on those files.
- Replacement contract: The Store is the only authority for installation and migration state. External locks, checkout identity, safe bootstrap, scoped recovery, verified legacy transfer, and no-local-state proof replace that split. At package acceptance on 2026-09-09, implementation had not started. The owner later accepted the delivered result recorded in the W19 R3 phase closeout.
- Rationale: Make Docs tool state needs one Store authority. Project knowledge remains local.
- Owner clarification (2026-09-09): missing CLI or failed optional capture does not block ordinary project work. R-PS-8 and R-TEST-7 make that rule explicit without weakening required Store recording for CLI-managed changes. This remains part of the single W19 R3 phase.
- Source: [Store-owned installation and migration state design](../designs/2026-09-09-store-owned-installation-and-migration-state.md) and [W19 R3 plan](../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-overview.md).

### 2026-09-09 — W19 R5 First-Party Skills and Managed Adoption

- Affected requirement or section: Skill Adoption State (R-SKILL-STATE); R-TEST-8.
- Previous contract: Generic managed-change intent and recovery did not state the ownership-only Skill adoption case explicitly.
- Replacement contract: Adoption uses the existing Store services even when bytes do not change. Dry-run writes no state; required capture failure blocks managed changes, and pending recovery remains shared.
- Rationale: Prevent a content-noop optimization from bypassing required ownership state.
- Source: [R5 design](../designs/2026-09-09-first-party-skills-and-managed-adoption.md) and [R5 plan](../plans/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-overview.md). The owner accepted the R5 backlog on 2026-09-09 and authorized implementation. Implementation tasks and evidence remain pending.

### 2026-09-16 — W19 R8

- Affected requirement or section: `Scope and Boundaries`, `Store Location and Contents`, `Backup, Uninstall, and Upgrade`, `Harness Integration State`, `Transfer and Recovery`, and `Verification and Testability`
- Previous contract: Missing Store state preserved repository reads and required managed writes failed closed, but project access absence was not a first-class state, grouped setup could hide independent results, and remediation could be treated as dependent on the Store surface under repair.
- Replacement contract: No project Store intent is valid `store-not-configured` state. Four typed access results stop only the affected operation. Setup stores independent subplan results. Direct machine setup can initialize a safe missing Store without prior harness access. Generic MCP has bounded Store-owned proof. Remediation uses isolated Store evidence and never depends on live Store access in the maintainer checkout.
- Rationale: The current setup and agent paths formed a closed loop that could not install, use, or repair Store access through a reachable action.
- Source: [W19 R8 design](../designs/2026-09-16-store-access-bootstrap-and-remediation.md) and [plan](../plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-overview.md)

## Source Anchors

- [W19 R8 Store Access Bootstrap and Remediation](../designs/2026-09-16-store-access-bootstrap-and-remediation.md)
- [W19 R8 plan](../plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-overview.md)
- [W19 R7 setup interview and recovery correction](../designs/2026-09-15-setup-interview-and-recovery-correction.md)
- [W19 R7 plan](../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-overview.md)
- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 performance evidence plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [48 Performance Evidence Governance](48-performance-evidence-governance.md)
- [../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-07-01-global-store-and-project-state.md](../designs/2026-07-01-global-store-and-project-state.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../designs/2026-06-20-configuration-and-convention-overlay.md](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md](../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/project/runtime-and-global-store.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/project/migrated-operations-inventory.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/project/cli-command-reorganization.md)
- [../plans/2026-07-01-w18-r10-global-store-and-project-state/00-overview.md](../plans/2026-07-01-w18-r10-global-store-and-project-state/00-overview.md)
- [../work/2026-07-01-w18-r10-global-store-and-project-state/00-index.md](../work/2026-07-01-w18-r10-global-store-and-project-state/00-index.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [17 System Asset Materialization Contract](17-system-asset-materialization-and-local-bootstrap.md)
- [24 Configuration Convention Overlay](24-project-configuration-and-convention-overlay.md)
- [38 Global Store and Project State](38-global-store-and-project-state.md)
- [35 Run Playbook State Machine](35-run-playbook-state-machine-and-portability.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/cli/src/manifest.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`
