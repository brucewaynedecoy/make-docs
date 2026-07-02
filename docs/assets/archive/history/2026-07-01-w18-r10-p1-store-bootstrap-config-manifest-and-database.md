---
title: "W18 R10 P1 Store Bootstrap, Config, Manifest, and Database"
kind: "history"
status: "completed"
date: "2026-07-01"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R10 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the machine-level global store (bootstrap, global config, global manifest, SQLite database) as the W18 R10 storage seam and ran the closeout coverage passes."
---

# W18 R10 P1 Store Bootstrap, Config, Manifest, and Database

## Changes

Implemented W18 R10 Phase 1 of [PRD 38](../../../prd/38-revise-global-store-and-project-state.md) as the new `packages/cli/src/store/` module: `paths.ts` resolves the store root as explicit option, then `MAKE_DOCS_HOME`, then `~/.make-docs`; `json-files.ts` writes JSON atomically; `global-config.ts` owns machine-level settings (`selfUpdate: prompt|auto|off`, `marketplaceAutoRegistration`); `global-manifest.ts` owns tool-level state; `database.ts` owns the SQLite database with the schema recorded in `PRAGMA user_version`, append-only migrations inside `BEGIN IMMEDIATE` transactions, explicit `StoreSchemaNewerError` refusal for newer-schema databases, WAL with `busy_timeout` 5000 and short-lived connections, and corrupt-database quarantine plus recreation; `state-rows.ts` provides the `projects` mirror, `playbook_runs`, and `work_evidence` row helpers with the `deleteProjectRows` pruning seam; and `index.ts` is the public seam for the W18 R7 runner and W18 R11 work operations. The bootstrap hook runs at the end of the `runCli` apply path in `packages/cli/src/cli.ts` after `applyInstallPlan` (fresh install, sync, and reconfigure; skipped on dry-run and cancel), and `bootstrapGlobalStore` never throws — every store failure degrades to a warning so no store condition blocks repository operations, satisfying R-STORE-1 through R-STORE-3, R-KEEP-1/R-KEEP-2, R-DB-2 through R-DB-4, and R-LIFE-3 at the installer-apply seam (the dedicated `update` command lands with W18 R11). The D10 implementer decisions — built-in `node:sqlite` via lazy `createRequire` with zero new dependencies and Node <22.5 degrading through the R-DB-4 path, deliberately-JSON global config so it can never be confused with project `.make-docs/config.yaml`, the schema-version-1 table layout, the migration strategy, and the WAL locking discipline — are recorded in [packages/cli/src/store/README.md](../../../../packages/cli/src/store/README.md). Tests landed as `packages/cli/tests/store.test.ts` (16 tests including two-process concurrency and corrupt/missing-database recovery) with `packages/cli/tests/setup.ts` and `packages/cli/vitest.config.ts` pointing `MAKE_DOCS_HOME` at per-worker temp directories; the full suite passes 438, and local repository bootstrap was verified byte-identical with and without the store. Project-identity minting, evidence migration, and uninstall/`setup remove` are Phases 2 through 4 with seams in place. All eight tasks in [the Phase 1 backlog file](../../../work/2026-07-01-w18-r10-global-store-and-project-state/01-store-bootstrap-config-manifest-and-database.md) are checked off.

Developer-guide coverage was `update-existing` because [the docs assets and runtime state boundaries guide](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) already owns the docs-assets/system-machinery/runtime-state boundary story that the store extends: it gained a machine-level `~/.make-docs/**` row in the boundary table and a Machine-Level Global Store section covering the boundary rules (operational state only, JSON-versus-YAML config separation, mirror-versus-canonical authority split, never-throws degradation) plus the `MAKE_DOCS_HOME` test-isolation discipline, routing to the store module README for the D10 decisions rather than duplicating them, with a Future Coverage bullet gated on W18 R10 Phases 2 through 4 and the W18 R7/R11 consumers; [the runner architecture guide](../../library/developer/playbooks-development-runner-architecture.md), whose Run State section still describes the in-repo `.make-docs/runs/playbooks/` location, gained a Future Coverage bullet recording that the `playbook_runs` seam landed and the section rewrites when W18 R7 relocates run state onto it. User-guide coverage was `update-existing` but deliberately small because the user-visible surface today is minimal: [the getting-started install guide](../../library/user/getting-started-installing-make-docs.md) gained one Your First Apply paragraph stating that a successful apply also sets up `~/.make-docs/`, that it never contains project content, and that store problems (including Node older than 22.5 leaving the database unavailable) warn without blocking the install — worth stating now because the directory genuinely appears and the guide's prerequisite floor is Node 18; the uninstall/privacy story was deferred as a Future Coverage bullet in [the lifecycle guide](../../library/user/cli-lifecycle-managing-installations.md) gated on Phases 2 through 4 and W18 R11 because machine-footprint removal does not exist yet. PRD coverage was `risk-register-update` because the phase implemented existing PRD 38 requirements without changing the active requirement surface: in [the open questions and risk register](../../../prd/03-open-questions-and-risk-register.md), R-019's Decision cell now records that the store bootstrap, database, and `playbook_runs` seam landed with identity, evidence migration, lifecycle, and W18 R7 consumption still open (Follow-Up retargeted to the remaining phases), and R-023's Decision cell records that schema version 1 structurally encodes the mirror-only `projects` table and the shared single-schema facet model while the registry read paths and checkpoint-to-evidence mapping stay open for P2/P3; both items keep their numbers, headings, and Open status, so the hardcoded item list in `packages/cli/tests/consistency.test.ts` is unaffected. Manual-test/UAT coverage is deferred until wave completion per user instruction; the natural UAT is a fresh packaged install on a clean machine verifying `~/.make-docs/` contents plus a corrupt-database recovery walkthrough.

Validation: jdocmunch was reindexed over the edited docs, `check_path_hygiene.py` reports zero errors, every relative link added this session resolves, and `git diff --check` is clean. No template-owned files were touched (this phase has no template deliverable), and the concurrent W18 R6 P2 work under `packages/cli/src/playbook/` was left untouched.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../../packages/cli/src/store/README.md](../../../../packages/cli/src/store/README.md) | New D10 implementer-decision record for the global store module (driver, formats, schema, migrations, locking, recovery). |
| [../../../work/2026-07-01-w18-r10-global-store-and-project-state/01-store-bootstrap-config-manifest-and-database.md](../../../work/2026-07-01-w18-r10-global-store-and-project-state/01-store-bootstrap-config-manifest-and-database.md) | Marked Phase 1 tasks t1 through t8 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated the R-019 and R-023 Decision cells to record the P1 store landing and what remains; numbers, headings, and Open statuses preserved. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Added the machine-level global store boundary row, the Machine-Level Global Store section with test-isolation discipline routing to the store README, related links, and a Future Coverage bullet for Phases 2 through 4 and the W18 R7/R11 consumers. |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Added a Future Coverage bullet for rewriting the Run State section when W18 R7 relocates run state onto the landed global-store `playbook_runs` seam. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/getting-started-installing-make-docs.md](../../library/user/getting-started-installing-make-docs.md) | Added a Your First Apply paragraph describing the machine-level `~/.make-docs/` store, its no-project-content guarantee, and the warn-only degradation including Node older than 22.5. |
| [../../library/user/cli-lifecycle-managing-installations.md](../../library/user/cli-lifecycle-managing-installations.md) | Added a Future Coverage bullet deferring the store inspection, per-project pruning, machine-footprint removal, and privacy guidance until W18 R10 Phases 2 through 4 and W18 R11 land. |
