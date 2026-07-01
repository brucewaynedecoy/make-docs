# Phase 3: Delta Backlog and Validation

## Scope

Generate the W18 R7 delta work backlog from PRD 35 and the still-constraining baselines, then run the closing validation pass over everything this change wrote.

## Inputs

- `docs/prd/35-revise-run-playbook-state-machine.md` as the effective requirement, with [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md), [PRD 34](../../prd/34-revise-playbook-contract-and-model.md), [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md), [PRD 24](../../prd/24-revise-configuration-convention-overlay.md), and [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md) as still-constraining baselines.
- The Phase 2 scope decisions and the D10 test requirements.
- `.make-docs/templates/system/work-index.md` and `.make-docs/templates/system/work-phase.md`.

## Outputs

- `docs/work/2026-07-01-w18-r7-run-playbook-state-machine/` with `00-index.md` (coordinate `W18 R7`) and dependency-ordered phase files (coordinate `W18 R7 P<N>`), following the arc: run-state record and global-store storage integration, progression operations, execution modes and digest-aware resume, guardrails plus portability plus three-tier behavior, and the D10 test suite including the assertion that no run state is written under `.make-docs/runs/` or any repository path.
- Every phase cites `../../prd/35-revise-run-playbook-state-machine.md` plus the still-constraining baselines under `## Source PRD Docs`, writes `### Tasks` as `- [ ] tN: ...` items incrementing across the whole file, writes `### Acceptance criteria` as plain bullets derived from the design MUSTs, and lists `### Dependencies`.
- The storage phase records the cross-design sequencing dependency explicitly: run-state storage is gated on the global store, its concurrency model, and the stable project identifier from the Runtime and Global Store lineage (planned as W18 R10), and the backlog defines what run state requires of the store without defining the store.

## Validation

- Every new change doc uses the revision template and change type; every impacted baseline carries the required backlink; `docs/prd/00-index.md` reflects doc 35's status and lineage; the delta backlog traces to PRD 35 and the constraining baselines; no existing PRD doc was renumbered or silently rewritten.
- All links resolve relatively, all paths are repo-relative with no absolute checkout paths, paragraphs use no semantic line breaks, and `git diff --check` is clean.
- The backlog leaves D9's implementer freedoms open and encodes D9's non-negotiables — global-store run state, the shared status vocabulary, the operation set and its read-versus-mutate classification, digest-blocked resume, and the D1 preserved decisions — as acceptance criteria.
