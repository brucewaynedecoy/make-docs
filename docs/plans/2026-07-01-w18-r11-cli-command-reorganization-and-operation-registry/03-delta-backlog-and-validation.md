# Phase 3: Delta Backlog and Validation

## Scope

Generate the dependency-ordered W18 R11 delta backlog from the Phase 2 decision boundaries and run the closing validation pass over every file this change touched.

## Work

- Write `docs/work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/` with `00-index.md` per `.make-docs/templates/system/work-index.md` (coordinate `W18 R11`) and dependency-ordered `0N-<phase>.md` files per `.make-docs/templates/system/work-phase.md` (coordinate `W18 R11 P<N>`).
- Backlog arc, dependency-ordered per R-SEQ-1: the operation registry and shared core contract first; the command tree reorganization and bare-command behavior; tool self-management `update` and `uninstall` with pre-v2 detection; the run surface pruning and the retained work operations keyed to the W18 R10 project-state model; MCP derivation parity and the upstream template/doc command-spelling updates; and the D10 verification suite.
- Every phase cites [../../prd/39-revise-cli-command-reorganization-and-operation-registry.md](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md) plus the still-constraining baselines among PRD 07, PRD 25, PRD 26, PRD 16, PRD 05, PRD 35, PRD 36, and PRD 38 under `## Source PRD Docs`; stages carry `### Tasks` as `- [ ] tN: ...` items incrementing across the whole phase file and `### Acceptance criteria` as plain bullets; design MUSTs become acceptance criteria, including R-TEST-1's no-operation-in-one-surface-only assertion, R-TEST-3's no-lifecycle-under-`run` and no-tool-lifecycle-from-Playbook-steps assertions, and R-TEST-4's pre-v2 warning flow and pruned-operations-absent assertions.

## Validation

- Every backlog phase traces to PRD 39 and the constraining baselines, phases are dependency-ordered, task IDs are file-ordinal without resets, and acceptance criteria are plain bullets.
- The backlog respects R-SCOPE-1, leaves the D9 implementer freedoms open, carries the same-wave R-SEQ-1 rule, gates the retained work operations on the W18 R10 store phases, and routes template-owned command-spelling updates upstream to `packages/docs/template/` before dogfooding.
- Changed files pass link checks, `.make-docs/scripts/check_path_hygiene.py`, and `git diff --check`.
