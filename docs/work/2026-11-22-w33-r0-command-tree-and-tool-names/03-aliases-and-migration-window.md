---
title: "Phase 3: Aliases and Migration Window"
kind: "work"
status: "completed"
coordinate: "W33 R0 P3"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Aliases and Migration Window

## Purpose

Keep every current name working through the migration window.

## Overview

Old CLI paths and MCP names become hidden aliases for two minor releases, then return `command-renamed` for one more minor release, then go away.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A current name keeps working for the window and names the new one ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-MIG-1).
- Intended human outcome: an upgrade breaks no script, Skill, or saved MCP call during the window, and each old call shows its new name.
- Human-facing surface or indirect effect: old CLI paths, old MCP calls, `renamedTo`, and `command-renamed`.
- Implementation work: the alias layer, the window tracking, and tests.
- Evidence source or testing type selected under current authority: alias tests for every current name.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | An alias test for every current CLI path and MCP name, in window and after it, and a `tools/list` test. |
| Performance Testing | not-needed-now | Command names do not change run time. |
| Guided Progress Review | not-needed-now | Alias output is a fixed line and field; P5 reviews the help. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Aliases

### Tasks

- [x] T1: Add each old CLI path as a hidden alias that runs the same operation, prints one line naming the new command, and adds `renamedTo` to JSON output.
- [x] T2: Add each old MCP name as a hidden alias that is not in `tools/list`, runs the same operation, and adds `renamedTo` to the result. An alias works only in its operation's profiles.
- [x] T3: Record the release that introduced each rename. After two minor releases, an alias returns a typed `command-renamed` result naming the new command. After one more, it is removed.
- [x] T4: Add no alias for a name that never shipped.

### Acceptance criteria

- A7: Every old name runs the same operation and returns `renamedTo` during the window.
- A8: After the window every old name returns `command-renamed`, and after one more release it is gone.
- A9: `tools/list` shows only new names.

### Dependencies

- P2.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. `tests/w33-r0-p3-migration-aliases.test.ts` has 178 tests. It runs each of the 32 old CLI paths and each of the 31 old MCP names at a version in the window, after the window, and after removal (A7, A8). It checks `tools/list` in every profile at all three versions (A9), and it checks that a planned name gets no alias (T4). It also checks that a failing alias call writes one JSON error with `renamedTo`, the `run` group hints, and that server startup fails if the list wrapper never ran. `tests/w33-r0-p3-native-rule-migration.test.ts` has 3 tests for old `run ...` native command rules. The type check and the build passed. Before the review fixes, the full suite had 2546 tests: 2537 passed, 3 failed, and 6 skipped. After the fixes, the P3, CLI, name-catalog, and MCP tests have 528 tests: 526 passed and 2 failed. The failures are the known ones: two `tests/mcp-app-contract.test.ts` stdio tests and, in the full suite, the sandbox-only `tests/p5-migration-safety.test.ts` fixture 11 ([evidence](evidence.md#p3-aliases-and-migration-window)). Performance Testing `not-needed-now`: command names do not change run time. Guided Progress Review `not-needed-now`: alias output is a fixed line and field, and P5 reviews the help. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: an old CLI path runs the same operation. After it succeeds, it prints one stderr line that names the new command and the release in which the old name stops working. Stdout stays clean JSON, with `renamedTo` added. A failing alias call writes only one JSON error, with `renamedTo`. An old MCP name runs the same tool in its profiles and adds `renamedTo`. After the window each old name returns a typed `command-renamed` result with the new name and a next action. `make-docs run` alone, and any `run` spelling that never shipped, names the groups that took its commands. A former `run` group word, such as `run prd`, names the new group's help. An unknown `make-docs project` command lists the real project commands. `make-docs resource --help` now has a title and a plain-words summary. Limits: a machine with old native command rules shows drift until the person approves the `make-docs setup` update. A 3.0.0 release before 2.3.0 would remove the aliases with no `command-renamed` step. `--help` on a leaf command still fails, and P5 owns that.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: not needed for this phase. The owner chose 2026-11-23 that the rename ships in 2.1.0, the value of `RENAME_RELEASE`.
- Evidence report: [P3 Aliases and Migration Window](evidence.md#p3-aliases-and-migration-window).
- Phase / capability status: Phase complete on commit. T1 to T4, A7, A8, and A9 are done. Capability partial: shipped text and Skills (P4) and acceptance (P5) remain.
