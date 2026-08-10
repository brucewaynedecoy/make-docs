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

- R-SCOPE-1 (MUST NOT): this authority owns exactly the global store location and contents, the boundary principle, the SQLite database and its operational concerns, the stable project identity, the unified project-state model, the mirror-versus-relocated distinction, and the store's backup, uninstall, and privacy behavior. The Playbook run-state record shape and progression semantics are owned by [PRD 35](35-run-playbook-state-machine-and-portability.md); project `.make-docs/config.yaml` and its overlay rules by [PRD 24](24-project-configuration-and-convention-overlay.md); the local bootstrap guarantee and pinned global asset cache by [PRD 17](17-system-asset-materialization-and-local-bootstrap.md); and the CLI command tree, operation registry, and pruned-operation disposition by [PRD 39](39-cli-command-model-and-operation-registry.md). Those product boundaries must not be redefined or reinvented here.

### The Boundary Principle (R-BND)

- R-BND-1 (MUST): data placement follows one test — versioned project knowledge stays in the repository; machine-local, tool-operational, or otherwise-duplicative data goes to the global store. The test for a piece of data is whether it is meaningful project knowledge that should be versioned and shared, or operational state that Make Docs uses to do its job.
- R-BND-2 (MUST): by this test, run-state and work-execution evidence are operational state and must live in the global store, not the repository; designs, plans, PRDs, contracts, guides, Playbooks, and history records are project knowledge and must remain in the repository.

### Store Location and Contents (R-STORE)

- R-STORE-1 (MUST): when Make Docs is installed on a system, the CLI creates `~/.make-docs/` containing at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data.
- R-STORE-2 (MUST): the global configuration file is machine-level and tool-level — machine settings such as a self-update preference or the marketplace auto-registration opt-in live there — and it must not be confused with, or override, project `.make-docs/config.yaml`, which remains the project-owned presentation overlay defined by [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).
- R-STORE-3 (MUST): the global store is distinct from any provider-backed global asset cache; it holds operational state, not shipped template assets, and its presence or absence must not weaken the non-optional local repository bootstrap defined by [17-system-asset-materialization-and-local-bootstrap.md](17-system-asset-materialization-and-local-bootstrap.md).

### The SQLite Database (R-DB)

- R-DB-1 (MUST): the SQLite database is the operational store; it holds the install and directory registry, the project-state model, and other operational data as needs emerge.
- R-DB-2 (MUST): the database carries a schema version and a defined migration strategy; `update` applies migrations, and a database from a newer schema than the running CLI is handled explicitly rather than corrupted.
- R-DB-3 (MUST): the database tolerates concurrent access from the CLI, the MCP server, and agent sessions; the concurrency model uses write-ahead logging and a defined locking discipline.
- R-DB-4 (MUST): the database has a defined recovery path; lost or corrupt operational state degrades gracefully — because the store holds operational state and not project knowledge, a missing database must not block reading the repository or re-establishing state, and must not be treated as data loss of project knowledge.

### Stable Project Identity (R-ID)

- R-ID-1 (MUST): every project-scoped row in the store is keyed by a stable project identifier plus the row's own key; the identifier is minted at setup and recorded in the project's `.make-docs/manifest.json`.
- R-ID-2 (MUST NOT): the store must not key project-scoped state by directory path, because paths change under clones, moves, and worktrees; path may be recorded as secondary lookup metadata, but identity is the manifest-minted id.

### The Unified Project-State Model (R-PS)

- R-PS-1 (MUST): project state is one model with two facets, both recorded decisions and evidence for a unit of work, keyed by the project identifier — Playbook run-state, meaning the run records defined by [PRD 35](35-run-playbook-state-machine-and-portability.md), and work-execution evidence, meaning the recorded sign-offs and decisions that cannot be re-derived from the repository or git, such as validation-passed, review-passed or waived, and closeout-approved, for a unit of work-backlog progression.
- R-PS-2 (MUST): the two facets share the project-state model rather than becoming parallel, ad-hoc state stores. Work-execution evidence includes only non-rederivable sign-offs and decisions; repository or git facts that can be derived again are excluded from stored project state. The [migrated operations inventory](../assets/artifacts/migrated-operations-inventory.md) records the provenance of this boundary but does not define it.
- R-PS-3 (MUST): work-execution evidence is keyed to a canonical work-item identity — the resolved repo root, wave slug, and phase path — produced by the retained work-item identity resolver; the store records evidence against that identity and does not re-derive the identity.

### Mirror Versus Relocated (R-MIR)

- R-MIR-1 (MUST): the install and directory registry in the store is a mirror and index whose canonical source remains each project's `.make-docs/manifest.json`; it exists for cross-project queries and quick access and must not become a second source of truth for a project's install record.
- R-MIR-2 (MUST): run-state and work-execution evidence are relocated and canonical in the store, with no in-repo copy; the install registry mirrors, while operational state relocates.

### Backup, Uninstall, and Upgrade (R-LIFE)

- R-LIFE-1 (MUST): tool `uninstall`, which removes the CLI itself, handles the global store explicitly rather than orphaning it — either removing it or prompting — and must not delete repository content.
- R-LIFE-2 (MUST): project `setup remove` prunes that project's rows from the store, keyed by the project identifier, without affecting other projects.
- R-LIFE-3 (MUST): `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration and present the warning-and-backup-or-cancel flow defined by the CLI reorganization, and `update` applies any store schema migration.
- R-LIFE-4 (MUST): repository backup snapshots remain under project-local `.make-docs/backup/**`; the machine-level store does not absorb those snapshots or legacy root `.backup/**`. Tool `uninstall` handles the store explicitly, while project removal and repository backup use their own reviewed scopes and never delete repository content outside the approved project plan.

### Privacy (R-PRIV)

- R-PRIV-1 (MUST): the store records the paths of every project where Make Docs is set up; this data is local to the machine and must not be transmitted, and any future feature that would export or share it requires explicit opt-in.

### Preserved Prior Decisions (R-KEEP)

- R-KEEP-1 (MUST): project `.make-docs/config.yaml` remains the optional, project-owned presentation overlay that never renames structure and is never routing authority; the global config does not change this.
- R-KEEP-2 (MUST): the local repository bootstrap remains non-optional and cannot be provider-backed, and any global asset cache remains pinned by provider identity, version, and hash; the operational store is separate from both.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that run-state and work-execution evidence are written to the global store and never to a repository path.
- R-TEST-2 (MUST): a test asserts that project-scoped state survives a simulated directory move or clone because it is keyed by the manifest identifier, not the path.
- R-TEST-3 (MUST): a test asserts graceful degradation when the store database is missing or unreadable, confirming the repository remains readable and state can be re-established.
- R-TEST-4 (MUST): a test asserts that `setup remove` prunes only the target project's rows and that tool `uninstall` does not delete repository content.

This PRD fixes store-not-repo placement of operational state, the `~/.make-docs/` layout with global config, global manifest, and SQLite database, manifest-minted identity that is never path-keyed, the single project-state model with its two facets, and the mirror-versus-relocated distinction as non-substitutable. The concrete SQL schema and table layout, exact migration and locking implementation, project-identifier generation algorithm, and global config and manifest file formats remain implementation choices within those requirements.

Code anchors:

- `packages/cli/src/manifest.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/uninstall.ts`
## Obligation and UAT State Boundaries

[R-OBL-STATE](45-deferred-obligation-governance.md#r-obl-state-repository-and-project-state-boundary) and [R-NUAT-STATE](46-naive-end-user-acceptance-testing.md#r-nuat-state-repository-and-evidence-boundary) keep repository artifacts authoritative for obligation meaning, requirement traceability, scenario definitions, terminal rationales, and durable findings. Project State or the Global Store may hold operational execution progress, run identifiers, evidence pointers, timestamps, environment metadata, resumability state, and bounded projections for discovery.

Screenshots, recordings, logs, and other bulky or machine-local evidence may live outside the repository when policy requires it, but repository records must retain stable references and conclusions. Any database projection is non-authoritative and must be rebuildable from repository authority plus preserved evidence; this PRD round introduces no state schema change.
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
## Source Anchors

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
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`
