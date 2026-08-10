# W17 R0 — Agent Instruction File Ownership (Work Backlog)

> Delta backlog directory: this `00-index.md` is the entry point; phase detail
> lives in the sibling `0N-<phase>.md` files. See
> `docs/assets/references/wave-model.md` for W/R semantics.

## Purpose

This delta backlog implements
[historical design](../../designs/2026-06-18-agent-instruction-file-ownership.md) (retired action-PRD: `docs/prd/15-revise-agent-instruction-file-ownership.md`):
a delimited managed-block inline-routing model for agent instruction files, with
block-scoped reconciliation, non-destructive migration, and dogfood. It is
derived from the W17 R0 plan and revises the conflict and ownership behavior in
PRD 07 and 13.

## Authoring Location and Re-Seed

Every artifact these phases implement is product code or a shipped template
asset, authored under `packages/` first (the source of truth) and then dogfooded
to the repo-root mirrors — never edited in the dogfood as the source. CLI logic
lives under `packages/cli/src/**` with tests under `packages/cli/tests/**`;
shipped instruction sources and the block template live under
`packages/docs/template/**`. After changes, re-seed the dogfood and verify parity
(`diff -rq`). This backlog and the other planning docs are make-docs's own
content and stay in the repo root.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-managed-block-primitive.md](./01-managed-block-primitive.md) | Build the delimited managed-block parser/writer. |
| [02-dedicated-file-and-harness-block.md](./02-dedicated-file-and-harness-block.md) | Add static inline instruction blocks and harness parity. |
| [03-block-level-reconciliation.md](./03-block-level-reconciliation.md) | Move manifest tracking and conflict review to block scope. |
| [04-migration-and-dogfood.md](./04-migration-and-dogfood.md) | Migrate existing installs and re-seed the dogfood. |
| [05-validation.md](./05-validation.md) | CLI tests, smoke-pack, and PRD reconciliation closeout. |

## Source PRD Docs

- [historical design](../../designs/2026-06-18-agent-instruction-file-ownership.md) (retired action-PRD: `docs/prd/15-revise-agent-instruction-file-ownership.md`) — the change doc this backlog implements.
- [05-installation-profile-and-manifest-lifecycle.md](../../../../prd/05-installation-profile-and-manifest-lifecycle.md), [06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md), [07-cli-command-surface-and-lifecycle.md](../../../../prd/07-cli-command-surface-and-lifecycle.md), [historical plan](../../plans/2026-05-06-w14-r2-cli-conflict-resolution/00-overview.md) (retired action-PRD: `docs/prd/13-revise-cli-conflict-resolution.md`) — impacted baselines that still constrain implementation.

## Usage Notes

- Read phases in order; they are dependency-ordered. Phase 01 (the block
  primitive) is the foundation the others reuse.
- Every phase file includes `## Source PRD Docs` linking PRD 15 and the impacted
  baselines.
- Coordinate: `W17 R0`. This is a delta backlog (active-set evolution), not a
  full-set regeneration.
