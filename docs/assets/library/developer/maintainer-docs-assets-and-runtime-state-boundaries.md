---
title: Docs Assets and Runtime State Boundaries
path: maintainer
status: draft
order: 20
tags:
  - maintainer
  - docs-assets
  - runtime-state
applies-to:
  - cli
  - template
related:
  - ../user/getting-started-installing-make-docs.md
  - ../user/cli-lifecycle-managing-installations.md
  - ./cli-development-local-build-and-install.md
  - ./maintainer-dogfood-and-maintainer-operations.md
  - ./release-packaging-validation-and-release-reference.md
  - ../../../prd/06-template-contracts-and-generated-assets.md
  - ../../../prd/35-run-playbook-state-machine-and-portability.md
  - ../../../prd/38-global-store-and-project-state.md
  - ../../../../packages/cli/src/store/README.md
  - ./playbooks-development-runner-architecture.md
---

# Docs Assets and Runtime State Boundaries

## Overview

This guide explains the boundary maintainers need to preserve between shipped project documentation assets, shipped system machinery, and mutable installer state. The short version is stable: `docs/assets/**` is for people-and-agent-managed project documentation assets, `.make-docs/{contracts,references,templates}/system/**` plus `.make-docs/scripts/**` is for make-docs-owned system machinery, and mutable runtime state is limited to files such as `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.

That split matters in three places:

- template authoring in `packages/docs/template/`
- repo-root dogfood maintenance in `docs/`
- installer and release validation in `packages/cli/`

## Current Boundary

| Area | What belongs there | Examples |
| --- | --- | --- |
| `docs/assets/**` | Managed project documentation assets and history records | `docs/assets/archive/history/`, `docs/assets/artifacts/`, `docs/assets/library/`, `docs/assets/playbooks/` |
| visible docs directories | Authored or managed documentation content | `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, `docs/assets/library/` |
| `.make-docs/{contracts,references,templates}/system/**`, `.make-docs/system/prompts/**`, and `.make-docs/scripts/**` | Shipped system machinery | `.make-docs/system/contracts/output-contract.md`, `.make-docs/system/references/lifecycle.md`, `.make-docs/system/prompts/`, `.make-docs/system/templates/`, `.make-docs/scripts/check_path_hygiene.py` |
| mutable `.make-docs/**` state | CLI runtime state | `.make-docs/manifest.json`, `.make-docs/conflicts/<run-id>/` |
| machine-level `~/.make-docs/**` | Global store: machine-level operational state | `~/.make-docs/config.json`, `~/.make-docs/manifest.json`, `~/.make-docs/store.db` |

`docs/assets/archive/history/` is part of the shipped docs resource namespace when history records exist. It is not installer state just because it records work history. The runtime state boundary begins at root `.make-docs/`, not inside `docs/`.

## Machine-Level Global Store

W18 R10 adds a fourth layer: a machine-level global store at `~/.make-docs/`, implemented in `packages/cli/src/store/` and bootstrapped at the end of every successful installer apply (fresh install, sync, or reconfigure; skipped on dry-run or cancel). It holds a global config (`config.json`), a global manifest (`manifest.json`), and a SQLite database (`store.db`) for operational state such as an install-registry mirror, Playbook run records, and work-execution evidence rows.

Boundary rules maintainers must preserve:

- The store holds operational state only — never shipped template assets and never project knowledge. Local repository bootstrap behavior is byte-identical with and without the store present.
- The global config is deliberately JSON so it can never be confused or cross-read with the project-owned YAML overlay at `<repo>/.make-docs/config.yaml`. Neither loader reads the other's directory.
- Authority is split by table, and the split is now encoded in code: `PROJECT_STATE_TABLE_ROLES` (`packages/cli/src/store/project-state.ts`) records each table as mirror or relocated. The `projects` table is a mirror — rebuildable from project manifests, with `readAuthoritativeInstallRecord` always resolving a project's install record from its `.make-docs/manifest.json` and `rebuildProjectRegistry` able to drop and re-mirror every row losslessly — while `playbook_runs` and `work_evidence` are relocated-canonical: the store copy is the only copy, with no in-repo duplicate. Never add a registry read path that trusts the mirror over the manifest, and never write relocated-canonical state back under a repository path.
- The unified project-state model carries both facets on one schema (still version 1) and one migration path. `playbook_runs` is the run-state storage seam the W18 R7 runner consumes — create, read, transition, and list keyed by project identifier plus run identifier, with the record payload fully opaque so the runner lineage owns its shape and progression semantics; since W18 R7 P1 the consumer is live at `packages/cli/src/operations/playbook/run-state.ts`, which serializes the full run-state record as one JSON document versioned by the record's own `schemaVersion` (the recorded PRD 35 D9 decision, cross-referenced in the store README) — and `work_evidence` records work-execution evidence keyed by the project identifier plus the canonical work-item identity (resolved repo root, wave slug, phase path) produced by the retained work-item identity resolver; the store records against that identity verbatim and never re-derives it.
- Work-lifecycle state is no longer written under `.make-docs/runs/`. Work-execution evidence is recorded in the global store through the retained `run work evidence record` operation and read back through `run work evidence read`, keyed by the manifest-minted project identifier plus the canonical work-item identity produced by the retained `run work item resolve` operation; evidence recording fails explicitly rather than falling back to a repository write when project identity is unresolvable or the store is unavailable. The former `checkpoint` operation — and the read-only `phase-gate` and `wave-status` operations that consulted legacy state alongside it — was removed from the CLI by the W18 R11 pruning disposition and is being rebuilt as Playbooks; only the evidence record/read pair and the work-item identity resolver keep CLI slots. The checkpoint-era lazy migration of a legacy `.make-docs/runs/<wave-slug>/state.json` (evidence rows written only for kinds the store did not already hold, legacy data never overwriting recorded store evidence, then file deletion and pruning of emptied `runs/` directories) was part of the pruned operation; a not-yet-migrated legacy file is historical read-only state, and no current operation writes or deletes it. The kept-versus-dropped checkpoint field mapping is recorded as a table in the store README; do not restate it here. `packages/cli/tests/tool-directory.test.ts` still classifies `.make-docs/runs/**` as runtime-state paths, which stays correct while unmigrated legacy files can exist; as of W18 R7 P1 the Playbook runner no longer writes `.make-docs/runs/playbooks/**` — its run state landed on the `playbook_runs` seam, keyed by the manifest-minted project identifier plus the run identifier, failing explicitly on an unresolvable identity — so nothing current writes under `.make-docs/runs/`.
- The shipped runtime-state guidance now matches the behavior. As of W18 R10 Phase 5, the `.make-docs/` routers (`packages/docs/template/.make-docs/AGENTS.md` and `CLAUDE.md`, dogfooded byte-identically at repo root) no longer name `.make-docs/runs/` as a runtime-state location: they keep `manifest.json`, `conflicts/`, and project config as project `.make-docs/` state and point run-state and work-execution evidence at the machine-level global store. The enforcement mechanism is twofold. The D11 verification suite `packages/cli/tests/store-verification.test.ts` proves the PRD 38 R-TEST-1 through R-TEST-4 contract at the module seams: a repo-snapshot-equality proof that checkpoint evidence and run records write only to the store, move/clone survival because state is keyed by the manifest-minted identity rather than the path, missing-or-corrupt-database degradation reported as recoverable operational-state loss, and prune scoping plus `removeGlobalStore` leaving repositories byte-identical. `node scripts/smoke-pack.mjs` re-proves the same contract against the packed CLI: it sandboxes `MAKE_DOCS_HOME` for every packed-CLI invocation, asserts store bootstrap with no repository-path state writes after the bare install and in each package-runner smoke, asserts the packed template routers are byte-identical to the dogfood copies, and ends the run by asserting no `.make-docs/runs/` exists under the target repository.
- `bootstrapGlobalStore` never throws; every store failure (unwritable root, missing `node:sqlite` on Node older than 22.5, newer-schema database, corruption) degrades to a warning so no store condition can block installing or operating on a repository. A corrupt database is quarantined and recreated — recoverable operational-state loss, never project-knowledge loss.
- Project identity is minted on the manifest side and resolved read-only on the store side. `mintProjectId()` (`packages/cli/src/manifest.ts`) runs exactly once, on the first apply that writes the project's `.make-docs/manifest.json`, records the identifier as the optional `projectId` field (no schema-version bump), and every later apply preserves it verbatim; pre-identifier manifests stay fully operable across sync, reconfigure, audit, backup, and uninstall, gain the field on their next manifest-writing apply with a one-time migration notice, and lifecycle reads never mint. `resolveProjectIdentity()` (`packages/cli/src/store/project-identity.ts`) is the only supported way to obtain a repository's `project_id`: it is a pure manifest read that never mints and never touches the database, returning one of four statuses — `resolved`, `unminted`, `no-manifest`, or `unreadable` — with `rootPath` as explicitly secondary metadata. The W18 R7 run-state seam and the W18 R11 work operations both consume that status vocabulary verbatim rather than inventing parallel terms; never add a code path that resolves identity from a directory path.
- Store lifecycle behavior is command-backed as of W18 R11 P3. `pruneProjectFromStore` (`packages/cli/src/store/lifecycle.ts`) removes exactly one project's rows across all three tables in one transaction — it accepts a pre-resolved identifier because removal must capture identity before the manifest is removed, never creates a database, and never throws — and is surfaced by `make-docs setup remove`. `removeGlobalStore` is the machine-footprint removal seam surfaced by the tool-level `make-docs uninstall` (`packages/cli/src/self/uninstall-tool.ts`), which owns the confirmation prompt: it unlinks only the fixed known store filenames non-recursively, removes the root directory only when empty, retains-and-reports anything unexpected, and refuses a root that carries project `.make-docs/` markers, so it is structurally incapable of deleting repository content. `make-docs update` (`packages/cli/src/self/update-tool.ts`) is the detect-and-delegate wrapper over the install manager; it applies pending store schema migrations through `bootstrapGlobalStore` on every run and never guesses before a destructive global change — ambiguous binary ownership degrades to printing the exact command and the affected store path.
- The store is never silently orphaned: the repo-level `make-docs setup remove` prunes the target project's rows and always prints the store disposition (kept for N other projects, last-project-gone with safe-removal guidance, no store, unresolvable identity, or an explicit prune warning). The repo-level command never removes the store — deleting a machine-level, all-projects store from a one-repo operation is the wrong blast radius — and the remove-or-prompt choice belongs to the W18 R11 tool-level `uninstall`. Store lifecycle handling runs strictly after the removal loop governed by PRDs 05, 28, and 30 and preserves it byte-identically: `.make-docs/backup/**` destinations, legacy root `.backup/**` protection, and agentics pruning are unchanged, and `packages/cli/tests/store-lifecycle.test.ts` asserts both protected backup roots survive an uninstall with store handling active.
- Update migration and pre-v2 detection build on existing seams: every apply-shaped run migrates the store through `bootstrapGlobalStore`, and pre-v2 configurations are fingerprinted from `classifyCompatibilityState` evidence by `detectPreV2Install` (`packages/cli/src/self/pre-v2.ts`) — manifest schema version 1 or a v1 classifier state — which gates `setup`, `setup reconfigure`, and `update` behind the R-MIG-2 warning-and-backup-or-cancel choice before any compatibility disposition runs; non-interactive runs never upgrade a pre-v2 install silently. The store's project-path records are local-only (R-PRIV-1): no store source may contain a network call or network-module import and the CLI's one network-capable module may never import the store — both directions are structurally enforced by `packages/cli/tests/store-lifecycle.test.ts` — and any future export or sharing surface requires explicit user opt-in before any store field leaves the machine.

The driver choice, file formats, SQL schema, migration strategy, and WAL locking discipline are D10 implementer decisions recorded in [the store module README](../../../../packages/cli/src/store/README.md); read that before changing anything under `packages/cli/src/store/` rather than restating it here.

When writing CLI tests, never touch the real home directory: the store root resolves as explicit option, then `MAKE_DOCS_HOME`, then `~/.make-docs`, and `packages/cli/tests/setup.ts` plus `packages/cli/vitest.config.ts` point `MAKE_DOCS_HOME` at a per-worker temp directory. New tests that trigger the installer apply path inherit that isolation automatically; standalone scripts or smoke checks that call the CLI outside vitest should set `MAKE_DOCS_HOME` themselves, as `scripts/smoke-pack.mjs` now does for every packed-CLI invocation.

## Historical Mismatch You Must Preserve

Older W9 migration material and intermediate plans described a future where manifest or config state would live under documentation-owned paths such as `docs/assets/config/`. That is no longer current truth.

Current truth is:

- managed project documentation assets and history live under `docs/assets/{archive,artifacts,library,playbooks}/**`
- make-docs-owned system resources live under `.make-docs/{contracts,references,templates}/system/**` and `.make-docs/scripts/**`
- runtime manifest and conflict staging live under mutable `.make-docs/**` state paths
- maintainers should treat older `docs/.references`, `docs/.templates`, `docs/.assets`, and `docs/assets/config/*` references as historical lineage only

Do not rewrite guides to erase that mismatch. The mismatch is part of the maintainer story because it explains why some historical artifacts point at paths that the live CLI no longer writes.

## Source-of-Truth Rules

Follow these ownership rules when touching paths near the boundary:

1. Edit shipped contracts, references, prompts, templates, helper scripts, and routers in `packages/docs/template/` first.
2. Treat repo-root `docs/assets/**`, `.make-docs/{contracts,references,templates}/system/**`, and `.make-docs/scripts/**` as dogfood copies only when those files are template-owned.
3. Treat generated designs, plans, PRDs, work backlogs, local library docs, local playbooks, artifact review content, archive history records, overlays, and project config as project-owned records unless a later accepted plan explicitly promotes a file as starter content.
4. Treat `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/` as installer output owned by apply, sync, backup, and uninstall behavior.
5. Do not move manifest or conflict files into `docs/` to make the tree look tidier. That would collapse authored docs and mutable runtime state back into one namespace.

## Planner and Apply Semantics

The planner classifies managed-file work before apply writes anything.
Plan output should stay grouped with the user-facing labels `generate`, `update`, `skip`, and `remove`, even when the internal action names are more specific.

Selected existing files with content that differs from the desired make-docs content require an explicit resolution before apply.
Interactive runs can resolve them with batch choices or per-file review.
Non-interactive runs, including `--yes`, must fail while those diffs remain unresolved.
Apply should refuse unresolved diffs instead of treating them as safe defaults.

Do not use a manifest hash mismatch alone as proof that a selected desired managed file was modified locally.
For files still selected by the current profile, the desired package content is the comparison point that determines whether the file can be updated, needs review, or should be skipped.
This distinction matters during package upgrades: a file can differ from the old manifest hash because make-docs changed upstream, not because the user edited it.

Reviewable managed-file coverage is broad.
When selected, prompts, references, templates, router and agent instruction files, skill assets, and other managed files all participate in the same planning and apply rules.
It also includes prompts, skills, router files, and other selected managed files.

## Maintainer Checks

When a change touches these boundaries, verify the right layer:

| Change type | Minimum checks |
| --- | --- |
| template-owned resource path changes | `npm test`, `npm run validate:defaults`, `bash scripts/check-instruction-routers.sh` |
| installer state path changes | `npm test`, packaged install check, `node scripts/smoke-pack.mjs` |
| store-touching changes under `packages/cli/src/store/` | read [the store module README](../../../../packages/cli/src/store/README.md) first, then `npm test` with attention to `tests/store.test.ts`, `tests/store-lifecycle.test.ts`, `tests/project-state.test.ts`, the D11 verification suite `tests/store-verification.test.ts`, the runner storage-seam coverage in `tests/playbook-operations.test.ts`, and the unmodified backup/removal regression baselines from former PRD 32 in `tests/uninstall.test.ts`, `tests/backup.test.ts`, and `tests/audit.test.ts`; finish with `node scripts/smoke-pack.mjs` for the packed-CLI store assertions |
| dogfood re-seed after template changes | manual copy into repo-root `docs/`, then router and smoke-pack validation |

If the failure involves local build or packaged entry paths, start with [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md). If the failure involves dogfood re-seeding, template-to-package flow, or maintainer routines, continue with [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md). If the failure is packaging or release-facing, use [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md).

## Practical Debugging Heuristics

- Missing or stale files under `docs/assets/**` usually mean template ownership or dogfood re-seed drift.
- Missing or stale `.make-docs/manifest.json` usually means installer behavior, not template content.
- Files staged under `.make-docs/conflicts/` are expected conflict output, not docs resources that should be copied back into the template.
- If a historical doc disagrees with the current path layout, prefer current README, `packages/docs/README.md`, and the live CLI code over migration intent.

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
- [06 Template Contracts and Generated Assets](../../../prd/06-template-contracts-and-generated-assets.md)
- [35 Revise Run Playbook State Machine](../../../prd/35-run-playbook-state-machine-and-portability.md)
- [38 Revise Global Store and Project State](../../../prd/38-global-store-and-project-state.md)
- [Global Store Module README](../../../../packages/cli/src/store/README.md)
- [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md)
