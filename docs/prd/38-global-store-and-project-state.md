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

- R-SCOPE-1 (MUST): this authority owns the global Store location, tool state, SQLite safety, stable project and checkout identity, installation records, migration progress, locks, receipts, recovery metadata, general lifecycle runs, privacy, and platform behavior. PRD 24 owns declarative project settings. PRD 17 owns resource resolution. PRD 39 owns command grammar. The Store must not define document authority, restore retired Playbook/Protocol behavior, or interpret opaque legacy state.

### The Boundary Principle (R-BND)

- R-BND-1 (MUST): data placement follows one test — versioned project knowledge stays in the repository; machine-local, tool-operational, or otherwise-duplicative data goes to the global store. The test for a piece of data is whether it is meaningful project knowledge that should be versioned and shared, or operational state that Make Docs uses to do its job.
- R-BND-2 (MUST): all Make Docs installation, upgrade, migration, reconfiguration, managed-change, and removal state lives in the global Store. This includes installed ownership, hashes, selections, receipts, checkpoints, locks, writer records, old-operation controls, conflict decisions, and recovery metadata. No project-local operational copy, mirror, fallback, or equivalent renamed directory is permitted. Designs, plans, PRDs, guides, artifacts, history, and optional work-specific tracking remain repository knowledge.

### Store Location and Contents (R-STORE)

- R-STORE-1 (MUST): when Make Docs is installed on a system, the CLI resolves the platform-appropriate user data root through supported operating-system APIs and creates the Make Docs Store there, conventionally represented as `~/.make-docs/`; it contains at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data. Implementations must not assume a POSIX home path on Windows or embed an unvalidated user-supplied path.
- R-STORE-2 (MUST): the global configuration file is machine-level and tool-level — machine settings such as a self-update preference or the marketplace auto-registration opt-in live there — and it must not be confused with, or override, project `.make-docs/config.yaml`, which remains the project-owned presentation overlay defined by [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).
- R-STORE-3 (MUST): the global Store is distinct from machine-installed system resources and any pinned cache; it holds operational state, not shipped template assets or repository documents, and its presence or absence must not weaken repository authority or the deterministic local-router fallback defined by [17-system-asset-materialization-and-local-bootstrap.md](17-system-asset-materialization-and-local-bootstrap.md).

- R-STORE-4 (MUST): every resolved Store root, override, database, lock, journal, temporary-state, and recovery metadata path remains outside the target project and all registered checkouts. Validate canonical paths and existing parent links before access, then revalidate under the lock before mutation. Reject project-contained overrides, symlink aliases, traversal, case collisions, and unsupported permission or filesystem states. Never fall back to a project path.

### The SQLite Database (R-DB)

- R-DB-1 (MUST): the SQLite database is the operational store; it holds the install and directory registry, the project-state model, and other operational data as needs emerge.
- R-DB-2 (MUST): the database carries a schema version and a defined migration strategy; `update` applies migrations, and a database from a newer schema than the running CLI is handled explicitly rather than corrupted.
- R-DB-3 (MUST): the Store serializes CLI, MCP, and agent writers with transactions, bounded busy retry, and Store-owned locks. Bootstrap uses an external Store lock that works before schema creation; it must not depend on a table that the pending migration creates. A canonical target path may scope a temporary pre-identity lock, but is not persistent project identity. Repository lock files are forbidden. Unsupported filesystem locking stops writes.
- R-DB-4 (MUST): absent, unreadable, corrupt, unknown, or newer Store state does not block reading repository knowledge or packaged resources. It blocks operations that require installation ownership or recovery state until explicit safe initialization or recovery succeeds. Never infer managed ownership from matching file names, a shared project identifier, or a new empty database. Fresh setup may initialize a missing Store only after source classification proves its scope. Existing files require a reviewed adoption plan. Corrupt bytes are preserved; they are never silently replaced.
- R-DB-5 (MUST): Store classification, exclusive bootstrap locking, and any required schema migration occur before project mutation. Schema DDL, `user_version`, and the Store schema journal commit in one SQLite write transaction. The former checkpoint-9 timing does not defer this prerequisite. Pre-commit failure rolls back that transaction. Post-commit recovery never replaces the whole Store or database. Schema journals and project-operation journals have distinct subjects and no project-local receipt projection.

### Stable Project Identity (R-ID)

- R-ID-1 (MUST): setup preserves or mints a stable project identifier in project-owned `.make-docs/config.yaml` as declarative identity. It is knowledge shared with the project, not proof of installation ownership. The Store binds a separate checkout identifier to each verified local installation. Project-operation records use project id, checkout id, and their own operation or record key.
- R-ID-2 (MUST NOT): a directory path is not the primary key of persistent project state. Paths are secondary lookup metadata. A verified move may update that lookup; clones and worktrees sharing a project identifier receive distinct checkout bindings and do not inherit installed ownership without review. Missing or conflicting identity stops mutation until an explicit resolution.

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

- R-MIR-1 (MUST): the Store is the sole authority for the installation manifest, installed ownership, directory registry, effective selections, hashes, resource provenance, and adoption records. `.make-docs/manifest.json` is legacy transfer input only. Current CLI paths neither write it nor use it as a post-transfer mirror or fallback. Declarative project identity and desired settings remain local under PRD 24. They do not prove applied state.
- R-MIR-2 (MUST): current lifecycle progress and bounded `run_evidence` references are canonical operational state in the Store, while the meaning and outcome of designs, plans, PRDs, work, validations, releases, archives, and retrospectives remain repository-authoritative. A Store row or receipt cannot override, synthesize, or replace the corresponding repository record.
- R-MIR-3 (MAY): when an authorized lifecycle operation captures performance execution, Project State or the Store may retain an optional, rebuildable, non-authoritative projection of run progress, environment fingerprints, observations, attempt or budget ledgers, and evidence references. The repository remains canonical for `PERF-###` identity and meaning, target and waiver authority, findings and dispositions, obligations, and active traceability under [48 Performance Evidence Governance](48-performance-evidence-governance.md). A receipt proves only that projection data was recorded; it does not prove a performance outcome or gate, satisfy conformance, or promote a support claim. This documentation-first boundary adds no run type, evidence kind, table, schema, or write path.

### Backup, Uninstall, and Upgrade (R-LIFE)

- R-LIFE-1 (MUST): tool `uninstall`, which removes the CLI itself, handles the global Store through an explicit reviewed preserve-or-remove choice and must not delete repository content. Store deletion is separately authorized from CLI removal, fails closed on unknown or corrupt scope, and preserves opaque legacy tables unless the reviewed action independently and explicitly includes them.
- R-LIFE-2 (MUST): project `setup remove` does not implicitly delete that project's Store rows. Removing Store state is a separate explicit reviewed action keyed by stable project identifier, must preserve opaque legacy tables, and must not affect other projects.
- R-LIFE-3 (MUST): `update`, `setup`, and `setup reconfigure` classify Store schema state before mutation. Supported migrations run transactionally after review and backup when destructive; newer-unknown, corrupt, or ambiguous state fails closed without rewriting the database.
- R-LIFE-4 (MUST): repository backup and reviewed content copies may remain under `.make-docs/backup/**` or their approved export destination. Legacy root `.backup/**` remains protected. The Store holds live backup indexes, restoration order, operation state, and recovery authority. A local backup description may explain saved bytes but cannot authorize or drive automatic recovery without verified Store records. Store backup does not absorb project document bodies. Tool uninstall, project removal, and content backup retain separate reviewed scopes.
- R-LIFE-5 (MUST): all migration steps write durable progress and receipts to the Store. Each operation records a unique id, stable project and checkout binding, frozen plan identity, step, before/after evidence, outcome, and recovery state. Commit intent before a project write and confirm the result after it. Repeat execution uses the saved operation and verifies actual bytes. A crash, receipt failure, or mismatch leaves a visible pending or failed operation; it must not report success, replay destructive work blindly, or fall back to local state.

### Skill Adoption State (R-SKILL-STATE)

These W19 R5 requirements record accepted direction. The owner accepted the R5 backlog on 2026-09-09 and authorized implementation. The tasks and proof remain pending. PRD [28](28-shared-agentics-installation-and-harness-exposure.md) owns adoption eligibility and review; PRD [39](39-cli-command-model-and-operation-registry.md) owns the `setup skills` command contract.

- R-SKILL-STATE-1 (MUST): reviewed Skill adoption records prospective ownership through the existing global Store installation and operation services. A content-noop adoption is still a required ownership transition. Preserve package version/hash evidence, source identity, selection, scope, native exposure, before/after ownership, backup references, and result. Do not fabricate prior ownership or use project-local receipts, locks, queues, or manifests.
- R-SKILL-STATE-2 (MUST): adoption dry-run is read-only and creates no Store, checkout identity, pending intent, backup, or local marker. Apply rechecks the reviewed inputs and ownership under the existing locks before committing intent. Required Store failure blocks managed file and ownership changes; optional-capture failure rules do not weaken this requirement.
- R-SKILL-STATE-3 (MUST): reuse current pending-operation, checkpoint, verification, and recovery behavior for adoption in both scopes. Commit required intent before mutation and verify results before completion. Interruption or result-capture failure stays visible and recoverable. Resume or rollback preserves later user edits, other owners, and unrelated projects; no separate Skill state engine is permitted.

### Transfer and Recovery (R-XFER)

- R-XFER-1 (MUST): setup first previews legacy operational files and the exact import, preserve, and removal decisions. Supported local receipts, manifest fields, writer records, and old-operation markers are verified as data. Unknown, malformed, symlinked, contradictory, changed, or actively written inputs stop cleanup. Never execute embedded instructions.
- R-XFER-2 (MUST): import required records into the Store and read them back before removing the exact verified obsolete inputs. The Store records import identity and cleanup progress. Repeats resume safely without duplicate receipts. A directory is removed only when empty and proven safe. Project content, unrelated files, and opaque legacy rows remain intact.
- R-XFER-3 (MUST): resume and rollback use the same Store operation, reviewed snapshot, content digests, and scoped backup references. They preserve later user changes and other projects. A partial result reports restored, remaining, and conflicting paths. No whole-Store restore may undo other committed operations.
- R-XFER-4 (MUST): supported entry points share one Store service. The supported-version transition requires known old CLI or helper writers that cannot honor Store locking to stop before transfer. Active or unresolved writer evidence stops migration. Make Docs cannot guarantee exclusion against an unmodified unsupported binary launched later. Report that limit without keeping a permanent local marker or restoring retired state files.
- R-XFER-5 (MUST): CLI status and recovery expose pending steps, committed results, Store location, checkout binding, and safe next actions through PRD 39. History breadcrumbs can link to that result but never become migration authority.

- R-XFER-6 (MUST): the corrected CLI is the minimum supported writer after transfer. Setup names that boundary and blocks known active old writers through scoped evidence. Probe the actual prior package to document its guard or limit; do not claim that an immutable old binary obeys new Store rules. Use a declarative format guard only when that parser proves rejection before writes. No local marker, dual writes, automatic CLI replacement, broad process scan, or second-version bridge is required or permitted by this scope.

### Privacy (R-PRIV)

- R-PRIV-1 (MUST): the Store records project paths only as local secondary lookup metadata. It never uploads them, document content, evidence bodies, prompts, credentials, secrets, or arbitrary payloads; any export is explicit, local, redacted, and relativizes project paths where possible, and any future sharing requires separate opt-in.
- R-PRIV-2 (MUST): Store paths and external evidence references are treated as data, not executable input. Reads and exports reject traversal and symlink escape, avoid following untrusted links or invoking referenced scripts, and apply platform-canonical comparisons for Windows drive/UNC, macOS case behavior, and Linux permissions.

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
- R-TEST-7 (MUST): verify shipped agent guidance and the optional capture path with the CLI unavailable and with the CLI present but optional capture failing. Ordinary project work continues with an accurate unavailable notice, no false success, no direct Store write, no local fallback state, and no queued write. Pair this evidence with a CLI-managed operation whose required Store write fails. That operation must stop before further project changes and preserve recovery evidence.
- R-TEST-8 (MUST): prove ownership-only Skill adoption, stale review rejection for package/source/selection/input/ownership changes, read-only review without Store creation, required Store failure before managed changes, and interrupted adoption through shared recovery. Test both scopes and competing writers. Matching bytes alone must never hide a missing ownership transition or authorize unreviewed content.

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

## Source Anchors

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
