---
title: "W18 R10 Global Store and Project State Work"
kind: "work"
status: "active"
coordinate: "W18 R10"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R10 plan and PRD contract."
  coordinate_handoff: "Carry W18 R10 into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# W18 R10 Global Store and Project State Work

## Purpose

Implement the machine-level global store and unified project-state model required by [38 Revise Global Store and Project State](../../prd/38-global-store-and-project-state.md): the store bootstrap at `~/.make-docs/` with its global config, global manifest, and SQLite database, the schema version, migration strategy, WAL concurrency, and graceful recovery, the manifest-minted stable project identity, the unified project-state model with its run-state and work-execution evidence facets and the checkpoint-JSON evidence migration, the mirror-versus-relocated distinction, the uninstall, setup-remove, and update lifecycle behaviors with local-only privacy, the upstream template runtime-state guidance update, and the D11 test suite. The source chain is [the design](../../designs/2026-07-01-global-store-and-project-state.md), [the W18 R10 plan](../../plans/2026-07-01-w18-r10-global-store-and-project-state/00-overview.md), and PRD 38, with [PRD 21](../../prd/21-project-tool-directory-and-resource-tiers.md), [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 17](../../prd/17-system-asset-materialization-and-local-bootstrap.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md), former PRD 32, and [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md) as still-constraining baselines.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-store-bootstrap-config-manifest-and-database.md](./01-store-bootstrap-config-manifest-and-database.md) | Create the `~/.make-docs/` store with global config, global manifest, and the SQLite database including schema versioning, migrations, WAL concurrency, and graceful recovery. |
| [02-stable-project-identity-and-manifest-minting.md](./02-stable-project-identity-and-manifest-minting.md) | Mint the stable project identifier at setup, record it in `.make-docs/manifest.json`, and make it the only project-scoped key in the store. |
| [03-unified-project-state-model-and-evidence-migration.md](./03-unified-project-state-model-and-evidence-migration.md) | Implement the single project-state model with its two facets, migrate the checkpoint JSON's genuine-state fields to work-execution evidence, and keep the install registry a subordinate mirror. |
| [04-lifecycle-and-privacy.md](./04-lifecycle-and-privacy.md) | Implement the uninstall, setup-remove, and update behaviors for the store and enforce the local-only privacy rule. |
| [05-runtime-state-guidance-and-verification.md](./05-runtime-state-guidance-and-verification.md) | Update the upstream template `.make-docs/` runtime-state guidance and dogfood it, then land the D11 test suite. |

## Usage Notes

- Read phases in order; they are dependency-ordered and later phases consume earlier deliverables.
- Cross-design sequencing: this store is consumed by the W18 R7 runner ([PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md)), whose run-state storage phases are gated on Phases 1 and 2 here, and by the CLI reorganization's retained work operations — the work-execution evidence store and the work-item identity resolver from [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) — whose reorganization lineage is planned next as W18 R11; land the store seam before those consumers build on it.
- Respect R-SCOPE-1: do not redefine the Playbook run-state record shape or its progression semantics (W18 R7 lineage), project `.make-docs/config.yaml` and its overlay rules ([PRD 24](../../prd/24-project-configuration-and-convention-overlay.md)), the local bootstrap guarantee and the pinned global asset cache ([PRD 17](../../prd/17-system-asset-materialization-and-local-bootstrap.md)), the CLI command tree and operation registry (the CLI reorganization lineage), or the pruning inventory's keep/remove disposition.
- Treat the D10 fixed decisions — operational state in the store and never the repository, the `~/.make-docs/` layout with global config, global manifest, and SQLite database, manifest-minted identity never keyed by path, one project-state model with two facets, and mirror-versus-relocated — as non-substitutable acceptance criteria, and leave the D10 implementer freedoms (the concrete SQL schema and table layout, the exact migration and locking implementation, the identifier generation algorithm, and the global config and manifest file formats) open.
- The store implementation is ordinary source code under `packages/cli/`; it is not a repository file and not a shipped template asset. The one documentation deliverable — the `.make-docs/` runtime-state guidance update — is authored upstream in `packages/docs/template/` first and then dogfooded, per the maintainer dogfooding rule.
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase; the W18 R7 run-state storage phases and the W18 R11 retained work operations unblock as Phases 1 through 3 land.
- Why: The backlog is the implementation queue derived from the W18 R10 plan and PRD contract, and R-019 records this store as the blocking prerequisite for the run-state relocation.
- Coordinate Handoff: Carry `W18 R10` into phase history records and commits, adding the active P coordinate for each phase.
