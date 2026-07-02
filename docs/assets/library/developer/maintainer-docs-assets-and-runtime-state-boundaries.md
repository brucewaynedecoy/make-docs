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
  - ../../../prd/38-revise-global-store-and-project-state.md
  - ../../../../packages/cli/src/store/README.md
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
| `.make-docs/{contracts,references,templates}/system/**` and `.make-docs/scripts/**` | Shipped system machinery | `.make-docs/contracts/system/output-contract.md`, `.make-docs/references/system/lifecycle.md`, `.make-docs/references/system/prompts/`, `.make-docs/templates/system/`, `.make-docs/scripts/check_path_hygiene.py` |
| mutable `.make-docs/**` state | CLI runtime state | `.make-docs/manifest.json`, `.make-docs/conflicts/<run-id>/` |
| machine-level `~/.make-docs/**` | Global store: machine-level operational state | `~/.make-docs/config.json`, `~/.make-docs/manifest.json`, `~/.make-docs/store.db` |

`docs/assets/archive/history/` is part of the shipped docs resource namespace when history records exist. It is not installer state just because it records work history. The runtime state boundary begins at root `.make-docs/`, not inside `docs/`.

## Machine-Level Global Store

W18 R10 adds a fourth layer: a machine-level global store at `~/.make-docs/`, implemented in `packages/cli/src/store/` and bootstrapped at the end of every successful installer apply (fresh install, sync, or reconfigure; skipped on dry-run or cancel). It holds a global config (`config.json`), a global manifest (`manifest.json`), and a SQLite database (`store.db`) for operational state such as an install-registry mirror, Playbook run records, and work-execution evidence rows.

Boundary rules maintainers must preserve:

- The store holds operational state only — never shipped template assets and never project knowledge. Local repository bootstrap behavior is byte-identical with and without the store present.
- The global config is deliberately JSON so it can never be confused or cross-read with the project-owned YAML overlay at `<repo>/.make-docs/config.yaml`. Neither loader reads the other's directory.
- Authority is split by table, and the split is now encoded in code: `PROJECT_STATE_TABLE_ROLES` (`packages/cli/src/store/project-state.ts`) records each table as mirror or relocated. The `projects` table is a mirror — rebuildable from project manifests, with `readAuthoritativeInstallRecord` always resolving a project's install record from its `.make-docs/manifest.json` and `rebuildProjectRegistry` able to drop and re-mirror every row losslessly — while `playbook_runs` and `work_evidence` are relocated-canonical: the store copy is the only copy, with no in-repo duplicate. Never add a registry read path that trusts the mirror over the manifest, and never write relocated-canonical state back under a repository path.
- The unified project-state model carries both facets on one schema (still version 1) and one migration path. `playbook_runs` is the run-state storage seam the W18 R7 runner consumes — create, read, transition, and list keyed by project identifier plus run identifier, with the record payload fully opaque so the runner lineage owns its shape and progression semantics — and `work_evidence` records work-execution evidence keyed by the project identifier plus the canonical work-item identity (resolved repo root, wave slug, phase path) produced by the retained work-item identity resolver; the store records against that identity verbatim and never re-derives it.
- Work-lifecycle state is no longer written under `.make-docs/runs/`. The mutating `checkpoint` operation writes work-execution evidence to the global store and lazily migrates a legacy `.make-docs/runs/<wave-slug>/state.json`: it writes evidence rows only for kinds the store does not already hold — legacy data never overwrites recorded store evidence — then deletes the file and prunes emptied `runs/` directories. Read-only operations (`phase-gate`, `wave-status`) consult a not-yet-migrated file read-only with a warning and never write or delete it, and `checkpoint` fails explicitly rather than falling back to a repository write when project identity is unresolvable or the store is unavailable. The kept-versus-dropped checkpoint field mapping is recorded as a table in the store README; do not restate it here. `packages/cli/tests/tool-directory.test.ts` still classifies `.make-docs/runs/**` as runtime-state paths, which stays correct while unmigrated legacy files can exist.
- `bootstrapGlobalStore` never throws; every store failure (unwritable root, missing `node:sqlite` on Node older than 22.5, newer-schema database, corruption) degrades to a warning so no store condition can block installing or operating on a repository. A corrupt database is quarantined and recreated — recoverable operational-state loss, never project-knowledge loss.
- Project identity is minted on the manifest side and resolved read-only on the store side. `mintProjectId()` (`packages/cli/src/manifest.ts`) runs exactly once, on the first apply that writes the project's `.make-docs/manifest.json`, records the identifier as the optional `projectId` field (no schema-version bump), and every later apply preserves it verbatim; pre-identifier manifests stay fully operable across sync, reconfigure, audit, backup, and uninstall, gain the field on their next manifest-writing apply with a one-time migration notice, and lifecycle reads never mint. `resolveProjectIdentity()` (`packages/cli/src/store/project-identity.ts`) is the only supported way to obtain a repository's `project_id`: it is a pure manifest read that never mints and never touches the database, returning one of four statuses — `resolved`, `unminted`, `no-manifest`, or `unreadable` — with `rootPath` as explicitly secondary metadata. Reuse that status vocabulary in the W18 R7 and W18 R11 consumers rather than inventing parallel terms, and never add a code path that resolves identity from a directory path.

The driver choice, file formats, SQL schema, migration strategy, and WAL locking discipline are D10 implementer decisions recorded in [the store module README](../../../../packages/cli/src/store/README.md); read that before changing anything under `packages/cli/src/store/` rather than restating it here.

When writing CLI tests, never touch the real home directory: the store root resolves as explicit option, then `MAKE_DOCS_HOME`, then `~/.make-docs`, and `packages/cli/tests/setup.ts` plus `packages/cli/vitest.config.ts` point `MAKE_DOCS_HOME` at a per-worker temp directory. New tests that trigger the installer apply path inherit that isolation automatically; standalone scripts or smoke checks that call the CLI outside vitest should set `MAKE_DOCS_HOME` themselves.

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
| dogfood re-seed after template changes | manual copy into repo-root `docs/`, then router and smoke-pack validation |

If the failure involves local build or packaged entry paths, start with [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md). If the failure involves dogfood re-seeding, template-to-package flow, or maintainer routines, continue with [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md). If the failure is packaging or release-facing, use [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md).

## Practical Debugging Heuristics

- Missing or stale files under `docs/assets/**` usually mean template ownership or dogfood re-seed drift.
- Missing or stale `.make-docs/manifest.json` usually means installer behavior, not template content.
- Files staged under `.make-docs/conflicts/` are expected conflict output, not docs resources that should be copied back into the template.
- If a historical doc disagrees with the current path layout, prefer current README, `packages/docs/README.md`, and the live CLI code over migration intent.

## Future Coverage

- Blocked by: W18 R10 Phases 4 and 5 and the W18 R7 and W18 R11 consumers of the store seam. Update when: the uninstall/`setup remove` lifecycle and the template runtime-state guidance refresh land, and when run-state storage and the reorganized command surface start consuming `packages/cli/src/store/`. Guide change: extend the Machine-Level Global Store section with the per-project pruning and machine-footprint removal flows and refreshed maintainer checks for store-touching changes, and revisit the runtime-state examples once the template guidance stops naming `.make-docs/runs/` as a current write target.

## Related Resources

- [Building and Installing the CLI Locally](./cli-development-local-build-and-install.md)
- [Dogfood and Maintainer Operations](./maintainer-dogfood-and-maintainer-operations.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
- [06 Template Contracts and Generated Assets](../../../prd/06-template-contracts-and-generated-assets.md)
- [38 Revise Global Store and Project State](../../../prd/38-revise-global-store-and-project-state.md)
- [Global Store Module README](../../../../packages/cli/src/store/README.md)
