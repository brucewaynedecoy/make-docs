# Agent Instruction File Ownership — PRD Change Plan

**Date:** 2026-06-18

**Repository:** `make-docs`

**Purpose:** Produce a reviewable plan for revising the make-docs CLI's
agent-instruction-file ownership model — replacing the all-or-nothing
overwrite/skip-all conflict behavior with a delimited managed-block plus
dedicated-file model — as an active-set evolution of the existing PRD namespace.
Seeded by
[2026-06-18-agent-instruction-file-ownership.md](../../designs/2026-06-18-agent-instruction-file-ownership.md).

## Objective

Change the CLI so that make-docs maintains its routing instructions inside a
deterministically delimited block — backed by a dedicated, fully managed
`.make-docs/<harness>.md` file — rather than owning the whole root
`AGENTS.md`/`CLAUDE.md`. Completion: the CLI can install, update, and re-assert
its block without touching user or project-specific content outside it;
reconcile at block scope; migrate existing installs; and make-docs's own dogfood
root files carry the make-docs block with project-specific maintainer
instructions preserved outside it.

## Coordinate Decision

- Coordinate: `W17 R0`
- Classification: `new-wave`
- Evidence: The seeding design's `## Intended Follow-On` recommends a new wave;
  the highest existing wave is `W16`. This introduces a substantial new
  ownership model rather than a tweak to the W14 R2 conflict flow. Confirm
  during plan review; the alternative reading is `W14 R3` continuing the CLI
  conflict-resolution lineage.

## Change Classification

- Requested change type: revision
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Instruction-file ownership design | design doc | `docs/designs/2026-06-18-agent-instruction-file-ownership.md` | high |
| Current root-instruction renderer | code | `packages/cli/src/renderers.ts:6-61` | high |
| Manifest managed-file model | data/code | `.make-docs/manifest.json`; `packages/cli/src/manifest.ts` | high |
| Conflict-review flow | code/PRD | `packages/cli/src/cli.ts`; `docs/prd/13-revise-cli-conflict-resolution.md` | high |
| Harness import/auto-load behavior | external | Claude Code `@`-import (confident); Codex `AGENTS.md` (to verify) | medium |

Open questions captured here are promoted into
`docs/prd/03-open-questions-and-risk-register.md` during execution when
appropriate — notably the per-harness import support and the migration path for
installs whose root files are currently verbatim renders.

## Baseline Context

- Active `docs/prd/` status: active namespace, slots `00`-`14`.
- Impacted baseline docs: `05`, `06`, `07`, `13`.
- Discovery pass required: yes (light).
- Discovery scope if required: confirm the current root-instruction render path,
  the conflict-review behavior, the manifest hashing, and the per-harness
  import/auto-load support.

## Output Contract

- Plan directory: `docs/plans/2026-06-18-w17-r0-agent-instruction-file-ownership/`
  (this directory).
- New change docs: `docs/prd/15-revise-agent-instruction-file-ownership.md`.
- Baseline docs to annotate: `07`, `13` (and `05`, `06` if implementation
  confirms impact).
- Delta backlog: `docs/work/2026-06-18-w17-r0-agent-instruction-file-ownership/`.

## Change Doc Strategy

| New doc | Kind | Why it exists | Affected baseline docs |
| --- | --- | --- | --- |
| `15-revise-agent-instruction-file-ownership.md` | revision | Revises the established instruction-file conflict/ownership requirement (overwrite/skip-all) to the block + dedicated-file model. | `05`, `06`, `07`, `13` |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| --- | --- | --- | --- |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | conflict review / managed-file behavior | Superseded by | `15-revise-agent-instruction-file-ownership.md` |
| `docs/prd/13-revise-cli-conflict-resolution.md` | conflict model | Superseded by | `15-revise-agent-instruction-file-ownership.md` |

## Authoring Location and Re-Seed

Every artifact this plan implements is **product code or a shipped template
asset**, so it is authored under `packages/` first (the source of truth) and
then dogfooded to the repo-root mirrors — never edited in the dogfood as the
source:

- CLI logic under `packages/cli/src/**` (renderers, manifest, conflict review),
  with tests under `packages/cli/tests/**`.
- Shipped instruction sources and the block template under
  `packages/docs/template/**`.
- After changes, re-seed the repo-root dogfood and verify parity (`diff -rq`).

The PRD change doc, this plan, and the delta backlog are make-docs's own content
and live only in the repo root.

## Worker Ownership

Execution is delegation-first; the coordinator's write scope is `none`.
Workstreams are disjoint and named by concern, not by agent:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| Block primitive | Phase 01 | `packages/cli/src` + tests | none | Delimited-block parser/writer |
| Renderer + template | Phase 02 | `packages/cli/src/renderers.ts`, `packages/docs/template` | 01 | Dedicated file + harness block |
| Reconciliation | Phase 03 | `packages/cli/src` (manifest, audit, conflict) | 01, 02 | Block-level reconcile + conflict |
| Migration + dogfood | Phase 04 | `packages/cli/src`, repo-root mirrors | 01-03 | Migration + dogfood re-seed |
| Validation + assembly | Phase 05 | `packages/cli/tests`; `docs/prd`, delta backlog | 01-04 | Tests, smoke, PRD/index/backlog reconcile |

## MCP Strategy

- Preferred servers available: `jcodemunch` for CLI code, `jdocmunch` for docs.
- Fallback plan if unavailable: reindex first; fall back to direct reads only if
  reindex fails.

## Validation

- The new change doc `15-...` uses the revision template and the `revision`
  change type.
- Impacted baseline docs (`07`, `13`, and `05`/`06` if confirmed) carry
  `### Change Notes` `Superseded by` backlinks.
- `docs/prd/00-index.md` reflects the new change doc's status and lineage.
- The delta backlog traces to the change doc and the impacted baseline docs.
- No existing PRD docs are renumbered or silently rewritten.
- Implementation validation: focused CLI tests for the block model and its edge
  cases, a smoke-pack of the packaged template, and template↔dogfood parity
  after re-seed.

## Phase Map

| Phase | File | Builds |
| --- | --- | --- |
| 01 | [01-managed-block-primitive.md](01-managed-block-primitive.md) | The delimited managed-block parser/writer. |
| 02 | [02-dedicated-file-and-harness-block.md](02-dedicated-file-and-harness-block.md) | The dedicated instruction file + harness-aware block rendering. |
| 03 | [03-block-level-reconciliation.md](03-block-level-reconciliation.md) | Manifest tracking and conflict review at block scope. |
| 04 | [04-migration-and-dogfood.md](04-migration-and-dogfood.md) | Migration of existing installs and the dogfood re-seed. |
| 05 | [05-validation.md](05-validation.md) | CLI tests, smoke-pack, and PRD/backlog reconciliation. |
