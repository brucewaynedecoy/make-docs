# 15 Revise Agent Instruction File Ownership

## Purpose

Revise the established CLI requirement for owning and maintaining agent
instruction files. Today the CLI renders the root `AGENTS.md`/`CLAUDE.md`
verbatim from the template and resolves any divergence only by whole-file
overwrite or skip, with no append-merge. This change establishes a delimited
managed-block model with inline root routing, so make-docs maintains its routing
without owning the entire shared file — and a consuming project's own
instructions and make-docs's project-specific instructions both survive.

## Change Type

`revision`. It revises the established instruction-file conflict and ownership
requirement (PRD 07 apply/review and PRD 13 conflict model) and the verbatim
root-instruction render (PRD 06). The block model becomes the effective
requirement for instruction files; the prior whole-file overwrite/skip-only
behavior is superseded for instruction files only and remains in force for
non-instruction managed files.

## Baseline Being Revised or Removed

- `docs/prd/07-cli-command-surface-and-lifecycle.md` — the apply and
  conflict-review behavior as it applies to instruction files.
- `docs/prd/13-revise-cli-conflict-resolution.md` — the batch-first
  overwrite/skip-only conflict model and the explicit "no append-merge path for
  agent instructions" requirement, for instruction files.
- `docs/prd/06-template-contracts-and-generated-assets.md` — the verbatim
  root-instruction render.
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md` — the whole-file
  managed hash for instruction files, which becomes block-scoped.

## Rationale

The instruction files are near-essential routers; without make-docs's routing at
the root, agents must be steered by hand for every task. The whole-file model
forces a binary loss on any divergence and leaves no home for either a consuming
project's own instructions or make-docs's project-specific maintainer
instructions. Append-on-conflict was tried and abandoned because, without a
delimiter, later updates could not relocate make-docs's region; content
recognition is fragile. A delimited region is deterministic and resolves both
problems.

Code anchors:

- `packages/cli/src/renderers.ts:59-61`
- `docs/prd/13-revise-cli-conflict-resolution.md`

## Effective Requirement

make-docs must own its instruction content through a deterministically delimited
managed block, not the whole shared file:

- make-docs maintains only the text between explicit markers in any shared
  instruction file; content outside the markers is owned by the project or user
  and is never modified.
- The substance of make-docs's root routing lives directly in the managed block.
  The installed root `AGENTS.md` and `CLAUDE.md` blocks mirror each other unless
  a future route-specific requirement explicitly needs different behavior.
- The managed block must not load, point to, or depend on dedicated
  `.make-docs/AGENTS.md` or `.make-docs/CLAUDE.md` instruction files.
- Reconciliation is block-scoped: the manifest tracks the block hash; editing
  content outside the block never conflicts; an edited block is re-asserted or
  surfaced as a block-scoped decision, not a whole-file conflict.
- Existing installs migrate non-destructively; project-specific content (for
  make-docs's own repo, the template-first maintainer rules) lives outside the
  block and persists across reconfigure. Clean W17 dedicated instruction files
  are removed when their manifest hashes still match.
- Non-instruction managed files keep the existing whole-file overwrite/skip
  conflict behavior from PRD 13.

Code anchors:

- `packages/cli/src/renderers.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/cli.ts`

## Impacted Docs and Dependencies

This revision affects the CLI instruction-file render path, the managed-file
manifest and audit model, and the conflict-review flow. It constrains downstream
implementation by making the delimited block, inline root routing, harness
parity, and block-scoped reconciliation part of the active PRD contract. The
implementation is sequenced by the W17 R0 plan.

Code anchors:

- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `docs/plans/2026-06-18-w17-r0-agent-instruction-file-ownership/00-overview.md`

## Required Baseline Annotations

- `docs/prd/07-cli-command-surface-and-lifecycle.md` (Plan review, confirmation,
  and apply orchestration) — `Superseded by` this doc (applied).
- `docs/prd/13-revise-cli-conflict-resolution.md` (Effective Requirement) —
  `Superseded by` this doc (applied).
- `docs/prd/06-template-contracts-and-generated-assets.md` (root-instruction
  render) and `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  (instruction-file managed hash) — `Superseded by` this doc, to be confirmed
  and applied during implementation closeout.

## Source Anchors

- `docs/designs/2026-06-18-agent-instruction-file-ownership.md`
- `docs/plans/2026-06-18-w17-r0-agent-instruction-file-ownership/00-overview.md`
- `packages/cli/src/renderers.ts`
- `.make-docs/manifest.json`
