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

This document defines the current product contract for stable project identity, machine-level Global Store state, and repository-state boundaries. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns stable project identity, machine-level Global Store state, and repository-state boundaries. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [global store and project-state design](../designs/2026-07-01-global-store-and-project-state.md), which is provenance rather than product authority.

### Scope and Boundaries (R-SCOPE)

- R-SCOPE-1 (MUST NOT): this authority owns exactly the global Store location and contents, the boundary principle, the SQLite database and its operational concerns, stable project identity, general lifecycle runs and run evidence, typed Store mutation receipts, the mirror-versus-repository-authority distinction, and Store backup, uninstall, privacy, and platform behavior. Project `.make-docs/config.yaml` and its overlay rules are owned by [PRD 24](24-project-configuration-and-convention-overlay.md), system-resource resolution by [PRD 17](17-system-asset-materialization-and-local-bootstrap.md), and the CLI command tree and operation registry by [PRD 39](39-cli-command-model-and-operation-registry.md). The Store must not define document authority, resurrect Playbook/Protocol product behavior, or reinterpret opaque legacy state.

### The Boundary Principle (R-BND)

- R-BND-1 (MUST): data placement follows one test — versioned project knowledge stays in the repository; machine-local, tool-operational, or otherwise-duplicative data goes to the global store. The test for a piece of data is whether it is meaningful project knowledge that should be versioned and shared, or operational state that Make Docs uses to do its job.
- R-BND-2 (MUST): by this test, lifecycle run progress and bounded execution-evidence references are operational state and must live in the global Store, not the repository; designs, plans, PRDs, contracts, guides, artifacts, history, and legacy project-authored Playbook/Protocol files are repository knowledge and must remain repository-authoritative.

### Store Location and Contents (R-STORE)

- R-STORE-1 (MUST): when Make Docs is installed on a system, the CLI resolves the platform-appropriate user data root through supported operating-system APIs and creates the Make Docs Store there, conventionally represented as `~/.make-docs/`; it contains at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data. Implementations must not assume a POSIX home path on Windows or embed an unvalidated user-supplied path.
- R-STORE-2 (MUST): the global configuration file is machine-level and tool-level — machine settings such as a self-update preference or the marketplace auto-registration opt-in live there — and it must not be confused with, or override, project `.make-docs/config.yaml`, which remains the project-owned presentation overlay defined by [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).
- R-STORE-3 (MUST): the global Store is distinct from machine-installed system resources and any pinned cache; it holds operational state, not shipped template assets or repository documents, and its presence or absence must not weaken repository authority or the deterministic local-router fallback defined by [17-system-asset-materialization-and-local-bootstrap.md](17-system-asset-materialization-and-local-bootstrap.md).

### The SQLite Database (R-DB)

- R-DB-1 (MUST): the SQLite database is the operational store; it holds the install and directory registry, the project-state model, and other operational data as needs emerge.
- R-DB-2 (MUST): the database carries a schema version and a defined migration strategy; `update` applies migrations, and a database from a newer schema than the running CLI is handled explicitly rather than corrupted.
- R-DB-3 (MUST): the database tolerates concurrent access from the CLI, the MCP server, and agent sessions through transactions, a defined locking discipline, and bounded busy retry; it must not rely on repository lock files or unsafe network-filesystem assumptions as the sole concurrency control.
- R-DB-4 (MUST): the database has a defined recovery path; lost or corrupt operational state degrades gracefully — because the store holds operational state and not project knowledge, a missing database must not block reading the repository or re-establishing state, and must not be treated as data loss of project knowledge.
- R-DB-5 (MUST): checkpoint 9 classifies the Store before any setup mutation and fails closed for corrupt, unknown, newer, or indeterminate state. Its schema DDL, `user_version`, and one internal checkpoint-journal row commit in one authoritative SQLite write transaction. This transaction is the Store rollback and cross-process serialization boundary. The journal contains only checkpoint and receipt-projection metadata and no Store payload. A failure before commit rolls back the transaction as one unit. After commit, setup must not replace or restore the whole Store or its database.

### Stable Project Identity (R-ID)

- R-ID-1 (MUST): every project-scoped row in the store is keyed by a stable project identifier plus the row's own key; the identifier is minted at setup and recorded in the project's `.make-docs/manifest.json`.
- R-ID-2 (MUST NOT): the store must not key project-scoped state by directory path, because paths change under clones, moves, and worktrees; path may be recorded as secondary lookup metadata, but identity is the manifest-minted id.

### General Lifecycle Runs and Evidence (R-PS)

- R-PS-1 (MUST): current run state uses a general `runs` relation keyed by stable project id and run id. Each row records `run_type`, `lifecycle_stage`, `status`, checkpoint, optimistic version, start, update, and optional finish timestamps, and bounded metadata; `run_type` is currently `lifecycle` only.
- R-PS-2 (MUST): lifecycle stages are `design`, `plan`, `prd`, `work`, `implementation`, `release`, `archive`, and `retrospective`; statuses are `active`, `paused`, `completed`, `failed`, and `abandoned`. The operation identifiers are `lifecycle.start`, `lifecycle.show`, `lifecycle.list`, `lifecycle.checkpoint`, `lifecycle.pause`, `lifecycle.resume`, `lifecycle.attach-evidence`, `lifecycle.complete`, `lifecycle.fail`, and `lifecycle.abandon`. Their CLI form is `make-docs run lifecycle <operation>`. P3 registers them as pending with `pendingLineage: W19 R1 P6`. P6 owns handler activation, state-transition validation, and optimistic concurrency. Each operation projects to an MCP tool.
- R-PS-3 (MUST): bounded evidence references use a separate `run_evidence` relation keyed by run id and evidence id, with evidence kind, a project-relative path or sanitized external reference, optional digest, and timestamp. The Store does not contain document bodies, screenshots, recordings, logs, prompts, secrets, credentials, or arbitrary tool payloads.
- R-PS-4 (MUST): every successful Store mutation returns a dedicated `LifecycleStoreMutationReceipt` with exactly `schemaVersion: 1`, `receiptId`, `operation`, `projectId`, `runId`, `storeSchemaVersion`, `resultingVersion`, and `committedAt`. The receipt identifier is a digest of the remaining receipt subject fields. Read-only operations return no mutation receipt. The receipt proves only the Store transaction; it does not prove a repository write, validation result, UAT result, publication, external delivery, or phase closure. The receipt carries no evidence payload, backup data, rollback data, or claim map. Existing lifecycle and migration receipt types remain unchanged.
- R-PS-5 (MUST): `run-capture-unavailable` is a typed outcome that records no repository mutation and implies no automatic retry. It is non-blocking for repository workflows unless the user invoked a direct Store or run-capture gate that explicitly requires success.
- R-PS-6 (MUST NOT): legacy `playbook_runs` data remains opaque, untouched, and excluded from current run listings. Setup, update, migration, and lifecycle commands do not convert, delete, infer, or merge it into `runs`; any future adoption requires separate accepted authority and an explicit reviewed migration.
- R-PS-7 (MUST): `lifecycle.show` and `lifecycle.list` are valid for every run status. `lifecycle.checkpoint` is valid only for `active` or `paused` runs. `lifecycle.attach-evidence` is valid for every run status, but it does not change the run status or reopen a terminal run. `lifecycle.pause` is valid only from `active`; `lifecycle.resume` is valid only from `paused`; `lifecycle.complete` is valid only from `active`; and `lifecycle.fail` and `lifecycle.abandon` are valid only from `active` or `paused`. `completed`, `failed`, and `abandoned` runs reject checkpoints and every later status transition.

### Mirror Versus Relocated (R-MIR)

- R-MIR-1 (MUST): the install and directory registry in the store is a mirror and index whose canonical source remains each project's `.make-docs/manifest.json`; it exists for cross-project queries and discovery and must not become a second source of truth for a project's install record.
- R-MIR-2 (MUST): current lifecycle progress and bounded `run_evidence` references are canonical operational state in the Store, while the meaning and outcome of designs, plans, PRDs, work, validations, releases, archives, and retrospectives remain repository-authoritative. A Store row or receipt cannot override, synthesize, or replace the corresponding repository record.
- R-MIR-3 (MAY): when an authorized lifecycle operation captures performance execution, Project State or the Store may retain an optional, rebuildable, non-authoritative projection of run progress, environment fingerprints, observations, attempt or budget ledgers, and evidence references. The repository remains canonical for `PERF-###` identity and meaning, target and waiver authority, findings and dispositions, obligations, and active traceability under [48 Performance Evidence Governance](48-performance-evidence-governance.md). A receipt proves only that projection data was recorded; it does not prove a performance outcome or gate, satisfy conformance, or promote a support claim. This documentation-first boundary adds no run type, evidence kind, table, schema, or write path.

### Backup, Uninstall, and Upgrade (R-LIFE)

- R-LIFE-1 (MUST): tool `uninstall`, which removes the CLI itself, handles the global Store through an explicit reviewed preserve-or-remove choice and must not delete repository content. Store deletion is separately authorized from CLI removal, fails closed on unknown or corrupt scope, and preserves opaque legacy tables unless the reviewed action independently and explicitly includes them.
- R-LIFE-2 (MUST): project `setup remove` does not implicitly delete that project's Store rows. Removing Store state is a separate explicit reviewed action keyed by stable project identifier, must preserve opaque legacy tables, and must not affect other projects.
- R-LIFE-3 (MUST): `update`, `setup`, and `setup reconfigure` classify Store schema state before mutation. Supported migrations run transactionally after review and backup when destructive; newer-unknown, corrupt, or ambiguous state fails closed without rewriting the database.
- R-LIFE-4 (MUST): repository backup snapshots remain under project-local `.make-docs/backup/**`; the machine-level store does not absorb those snapshots or legacy root `.backup/**`. Tool `uninstall` handles the store explicitly, while project removal and repository backup use their own reviewed scopes and never delete repository content outside the approved project plan.
- R-LIFE-5 (MUST): the project-local checkpoint-9 migration receipt is an idempotent projection of the committed checkpoint-journal row. Setup retries a failed receipt projection once. If both attempts fail, setup returns a typed checkpoint result, exits unsuccessfully, and makes no later setup mutation. A later setup uses the committed journal row to recover the projection before a new setup mutation. Receipt projection failure does not roll back, replace, or restore the committed Store.

### Privacy (R-PRIV)

- R-PRIV-1 (MUST): the Store records project paths only as local secondary lookup metadata. It never uploads them, document content, evidence bodies, prompts, credentials, secrets, or arbitrary payloads; any export is explicit, local, redacted, and relativizes project paths where possible, and any future sharing requires separate opt-in.
- R-PRIV-2 (MUST): Store paths and external evidence references are treated as data, not executable input. Reads and exports reject traversal and symlink escape, avoid following untrusted links or invoking referenced scripts, and apply platform-canonical comparisons for Windows drive/UNC, macOS case behavior, and Linux permissions.

### Preserved Prior Decisions (R-KEEP)

- R-KEEP-1 (MUST): project `.make-docs/config.yaml` remains the optional, project-owned presentation overlay that never renames structure and is never routing authority; the global config does not change this.
- R-KEEP-2 (MUST): system resources are machine-served by default with explicit optional provenance-aware project projection; the Store remains separate from the installed resource provider, projected `.make-docs/system/**` files, repository routers, and any pinned cache.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): tests assert the `runs` and `run_evidence` schemas, exact lifecycle operation identifiers, CLI and MCP projections, pending-lineage refusal before P6 activation, lifecycle stages, statuses, legal transitions, optimistic conflicts, typed receipts, `run-capture-unavailable`, and the absence of Store writes under repository paths.
- R-TEST-2 (MUST): a test asserts that project-scoped state survives a simulated directory move or clone because it is keyed by the manifest identifier, not the path.
- R-TEST-3 (MUST): a test asserts graceful degradation when the store database is missing or unreadable, confirming the repository remains readable and state can be re-established.
- R-TEST-4 (MUST): tests assert project removal preserves Store rows unless separately authorized, explicit Store cleanup affects only the selected project, opaque `playbook_runs` remains unchanged and absent from current listings, and tool uninstall does not delete repository content.
- R-TEST-5 (MUST): tests cover transactional recovery, bounded busy retry, privacy-safe export, path traversal and symlink rejection, Windows drive/UNC and case-collision handling, macOS case behavior, and Linux permissions without persisting secrets or document bodies.
- R-TEST-6 (MUST): the finite P6 proof set covers checkpoint 9 through the integrated setup path, Store classification before setup mutation, cross-process writer serialization, one-transaction schema and journal commit, journal-based receipt recovery, and the typed stop result after two failed receipt-projection attempts. The proof also confirms that post-commit failure does not replace or restore the Store and that CLI and MCP operation identifiers do not change.

This PRD fixes Store-not-repo placement of bounded operational state, platform-safe Store resolution, manifest-minted identity that is never path-keyed, the current `runs` and `run_evidence` model, typed receipts, opaque legacy `playbook_runs`, and the repository-authority boundary as non-substitutable. Physical SQL DDL, project-identifier generation, and global config and manifest serialization remain implementation choices within those requirements.

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
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


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
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
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
