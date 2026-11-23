---
title: "Phase 5: Acceptance"
kind: "work"
status: "completed"
coordinate: "W33 R0 P5"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 5: Acceptance

## Purpose

Prove the Wave before W29 R0 P4 and W30 R0 P3 build their commands.

## Overview

This phase runs every proof, reviews help with the owner, and closes register D-065.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. All promises in the index.
- Intended human outcome: the owner sees the new help and confirms the tree reads by capability.
- Human-facing surface or indirect effect: `make-docs --help`, group help, and alias output.
- Implementation work: proofs, the help review, the full suite, and evidence.
- Evidence source or testing type selected under current authority: Human Experience Review and Guided Progress Review of help.
- Executor: the implementing agent runs and records. The owner reviews help.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Naming-rule, parity, alias, and shipped-text tests, and the full suite. |
| Performance Testing | not-needed-now | Command names do not change run time. |
| Guided Progress Review | selected | The owner reviews `make-docs --help` and the group help. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- [D-065](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Proof

### Tasks

- [x] T1: Run the naming-rule, parity, alias, and shipped-text tests.
- [x] T2: Review `make-docs --help` and each group's help with the owner.
- [x] T3: Run the full test suite and record known failures.
- [x] T4: Complete a Human Experience Review for each promise in the index, and record evidence in `evidence.md`.
- [x] T5: Update register D-065 with the result.

### Acceptance criteria

- A12: Every naming-rule, parity, alias, and shipped-text test passes.
- A13: The owner reviewed help, and any change is made.
- A14: Every plan validation item has recorded evidence or a named limit.
- A15: Register D-065 names the result.

### Dependencies

- P3 and P4.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. The naming-rule, parity, alias, shipped-text, leaf help, and CLI tests and the tests whose expectations changed have 1042 tests in one JSON run: 1039 passed and 3 failed (A12). The 3 failures are known: the two `tests/mcp-app-contract.test.ts` stdio tests, which fail on a Node `DEP0205` warning, and the sandbox-only `tests/p5-migration-safety.test.ts` fixture 11. The full suite has 2858 tests: 2848 passed, 4 failed, and 6 skipped, counted from the JSON report. The fourth failure is the known `tests/cli.test.ts` 15-second timeout under load; that test passes alone. The type check, the build, `validate:defaults` (53), the router check, `check prd`, `project paths validate`, `project doctor check`, and `smoke:pack:local` passed. Performance Testing `not-needed-now`: command names and help text do not change run time. Guided Progress Review selected and passed: the owner reviewed the help on 2026-11-23. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Known bug fixed: `--help` on a leaf command, such as `make-docs work item resolve --help`, failed with "`--help` requires a value." because argv reached the command's own option parser. The CLI now answers `--help` or `-h` after any of the 48 registry commands with its summary, usage, arguments, options, and notes, exits 0, and runs nothing. A help flag that is a flag value, such as `--checkpoint -h`, is that value. An old path in the window prints the new command's help, then the alias notice. One help table now feeds `--help`, group help, and the registry usage line, and tests check it against the options each command reads.
- Review fixes: the registry usage strings come from the help table (11 commands disagreed before); the moved notes for `setup store`, `project list`, and `project state` are in their help, and the dead command-level help branches in `root-operations.ts` are removed; `uninstall --help` states when `--remove-store` deletes the Store and that `<store>/backup/` is kept; and `uninstall --remove-store` no longer prints that the Store is preserved after it removed it.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: all four index promises are met ([evidence](evidence.md#human-experience-review-a14)). A person can go from `make-docs --help` to a group, see one plain line for each command, and ask any command for its options.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: passed. The owner reviewed the help on 2026-11-23 and accepted it with five changes: one summary line per command in every group, short plain `project` help, plain `setup` help with a `setup store` line, a plain `core` profile line in `mcp` help, and only "Changes nothing." on read-only commands. All five are made. The owner confirmed PRD 39 R-TOP-4 (A13).
- Evidence report: [P5 Acceptance](evidence.md#p5-acceptance).
- Phase / capability status: Phase complete on commit. T1 to T5 and A12 to A15 are done. W33 R0 is complete. The aliases return `command-renamed` in 2.3.0 and are removed in 2.4.0 (register D-065).
