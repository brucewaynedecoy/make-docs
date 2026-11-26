---
title: "Phase 1: Name Catalog and Rules"
kind: "work"
status: "completed"
coordinate: "W33 R0 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 1: Name Catalog and Rules

## Purpose

Settle every name before any command moves. No rename starts before the owner accepts the table.

## Overview

This phase writes one name catalog in code with the current and new CLI path and MCP name for every operation and tool, and a test that enforces [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-NAME.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Every command for one capability starts with its group, and each tool name matches its command ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-NAME-1 to R-NAME-5).
- Intended human outcome: the owner can read one table and see every name before and after.
- Human-facing surface or indirect effect: the name table that later phases apply.
- Implementation work: the name catalog module and its test.
- Evidence source or testing type selected under current authority: naming-rule test; owner review of the table.
- Executor: the implementing agent prepares it. The owner reviews it.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | The naming-rule test passes on the table and fails on broken fixture entries; PRD command lists match the registry. |
| Performance Testing | not-needed-now | Command names do not change run time. |
| Guided Progress Review | selected | The owner reviews the full name table before P2. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- [D-065](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Name catalog

### Tasks

- [x] T1: List all 43 registry operations (the design said 45), the six hand-defined MCP tools, and every operation planned by W29 R0, W30 R0, W31 R0, and W32 R0, with current and new CLI paths and MCP names.
- [x] T2: Apply R-NAME-1 to R-NAME-4. Shorten a CLI path when its name would pass 26 characters, and record why.
- [x] T3: Give each hand-defined tool (`compatibility`, `config`, `domains`, `install_plan`, `install_status`, `manifest`) a group and a CLI path, or record why it has an MCP name only.
- [x] T4: Add the naming-rule test: it fails when an entry breaks a rule, when two entries share a name, or when a PRD command list and the registry differ.
- [x] T5: Write the table into `evidence.md` for the owner's review.

### Acceptance criteria

- A1: Every operation and tool has one entry with all four names.
- A2: The naming-rule test passes on the table and fails on a broken fixture entry, a duplicate name, and a PRD list that differs from the registry.
- A3: The owner accepts the table.

### Dependencies

- Accepted PRD 39 and PRD 25 changes.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed: 39 tests in `packages/cli/tests/name-catalog.test.ts`, the type check, the PRD authority validator with no diagnostics, and the full suite (2148 passed, 4 failed, 6 skipped). Three failures exist without this phase: the two `tests/mcp-app-contract.test.ts` stdio tests and the sandbox-only `tests/p5-migration-safety.test.ts` fixture 11. The fourth, `tests/cli.test.ts` "routes reconfigure skill scope and selected-name changes without changing Skills", timed out at 15 seconds under full-suite load and passes alone ([evidence](evidence.md#p1-name-catalog-and-rules)). Performance Testing `not-needed-now`: command names do not change run time. Guided Progress Review selected: the owner reviewed the name table and decided ND-01 to ND-10 on 2026-11-22. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: the owner can read one table, grouped by the eleven groups, with the current and new name of every operation and tool and the reason for each choice. Every new command starts with its group and ends with a verb, except `check`, where the group word is the verb. Every new MCP name is its path with underscores. No name a person types changed in this phase.
- Optional experience handoff: not applicable. No human-facing wording changed.
- Explicit human acceptance gate: accepted on 2026-11-22. The owner accepted ND-01, ND-02, ND-04, ND-06, ND-08, and ND-10 and changed ND-03, ND-05, ND-07, and ND-09. The catalog and the evidence table now use the owner's names. The owner gave the final acceptance of the updated table on 2026-11-22.
- Evidence report: [P1 Name Catalog and Rules](evidence.md#p1-name-catalog-and-rules).
- Phase / capability status: Phase complete on commit. T1 to T5, A1, A2, and A3 are done. PRD 39 R-NAME-2 and R-RUN-1 and PRD 25 R-MCP-PROFILE-10 were aligned with the catalog. Capability partial: the command tree (P2), aliases (P3), shipped text and Skills (P4), and acceptance (P5) remain.
