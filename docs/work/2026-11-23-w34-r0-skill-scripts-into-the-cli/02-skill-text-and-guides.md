---
title: "Phase 2: Skill Text and Guides"
kind: "work"
status: "active"
coordinate: "W34 R0 P2"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---

# Phase 2: Skill Text and Guides

## Purpose

Move the three Skills to the new operations, and keep an agent form for a session without the CLI. This is step 3 of the [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) operation-first order. It depends on P1.

## Overview

The `decompose-codebase`, `archive-docs`, and `cleanup-docs` Skills stop naming script paths. Each check uses this order: the MCP tool, then the CLI command, then the agent form by hand. Each agent form uses the same rule IDs as its operation, and a twin test proves it. The shipped guides that name the old scripts change too.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Without the CLI, the Skill tells the agent how to do the same check by hand, and the agent says that the result is a manual review ([PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-SKILL-RUNTIME-7). `indirect`: a rule change on one side fails a test until the other side changes with it.
- Intended human outcome: a person reads a truthful result. They can tell a Make Docs check from a manual review, and nothing is installed or repaired without their consent.
- Human-facing surface or indirect effect: `SKILL.md` and the references of the three Skills; the shipped guides; maintainer test results.
- Implementation work: Skill text, rule IDs in the agent forms, the twin test, and guide edits.
- Evidence source or testing type selected under current authority: twin rule ID test, shipped-text test, Skill standalone tests, and the P5 Human Experience Review of the Skill text.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Twin rule ID test, shipped-text test, and Skill standalone tests. |
| Performance Testing | not-needed-now | Text changes do not change run time. |
| Guided Progress Review | not-needed-now | P5 reviews the Skill text in the Human Experience Review. |
| Unassisted Goal Testing | not-needed-now | Agents reach the checks through Skill text. No current decision needs an unassisted human run. |

## Source PRD Docs

- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-SKILL-RUNTIME-3, R-SKILL-RUNTIME-7, `Domain and Script Classification`, `Performance Evidence Validation Twin` proof states
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md): R-SKILL-BUNDLE-2, R-SKILL-BUNDLE-6, R-SKILL-BUNDLE-7
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-NAME-6, R-SKILL-CHECK-7

## Source Obligations, Scenarios, And Findings

- [D-064](../../prd/03-open-questions-and-risk-register.md)
- Owner decision PD-1, option A, 2026-11-23, in the [plan](../../plans/2026-11-23-w34-r0-skill-scripts-into-the-cli/00-overview.md#owner-decisions)

## Stage 1 - Skill text

### Tasks

- [ ] T1: `decompose-codebase`: replace `scripts/validate_output.py` with `check_decomposition` or `make-docs check decomposition`. Keep `references/output-contract.md` as the agent form and give each rule its P1 ID. Remove every step that runs `probe_environment.py`. Tell the agent to list the MCP tools and the subagent or parallel agent tools that its session gives it, and to write them in the plan. Under PD-1 option A, describe tools by capability, such as "a document index tool" and "a code index tool", and remove the MCP server names from `mcp-playbook.md`, `planning-workflow.md`, `execution-workflow.md`, and `harness-capability-matrix.md`.
- [ ] T2: `archive-docs`: replace the optional `trace_relationships.py` helper with `project_relations_list` or `make-docs project relations list`. Keep the manual tracing steps in `references/archive-workflow.md` as the agent form, with the P1 relation kind IDs.
- [ ] T3: `cleanup-docs`: keep the flow of check, review a sample, then repair only when the sample is clean. Use `project_markdown_validate` and `project_markdown_repair`, or their CLI commands. Keep the formatting rules in `SKILL.md` as the agent form, with the P1 rule IDs.
- [ ] T4: In all three Skills, write the no-CLI path: the agent says that the result is a manual review, uses the proof state `agent-reviewed`, and does not claim that a Make Docs check ran. It installs nothing without consent. A manual repair needs the person's agreement first.
- [ ] T5: Add a twin test that reads each operation's rule list and the Skill text, and fails when a rule ID exists on one side only.

Edit only `packages/skills/`. Do not edit any `scripts/` folder in this phase. This repository has no installed copy of these three Skills, so no dogfood Skill copy changes.

### Acceptance criteria

- A9: A search of the three Skills finds no `.py` path and no `scripts/` path.
- A10: The twin test passes, and fails on a fixture with a rule ID in the operation only, and on one with a rule ID in the Skill text only.
- A11: Each of the three Skills names the MCP tool, then the CLI command, then the agent form, and states the manual-review result. No `decompose-codebase` reference names an MCP server.

### Dependencies

- P1, for the rule IDs, command paths, and tool names.

## Stage 2 - Guides and standalone check

### Tasks

- [ ] T6: Change the shipped guides that name Skill helper scripts, under PRD 39 R-NAME-6: `docs/assets/maintainer/skills-catalog-and-distribution-model.md` and `docs/assets/user/skills-decomposing-an-existing-codebase.md`. Check the other Skill guides under `docs/assets/user/` and `docs/assets/maintainer/` too.
- [ ] T7: Check that each Skill still works alone under PRD 08 R-SKILL-BUNDLE-2.

No template change: no file in `packages/docs/template/` names these scripts. If a task changes a shipped system resource after all, write it first in `packages/docs/template/`, then copy it byte for byte to this repository's `.make-docs/` or `docs/`.

### Acceptance criteria

- A12: The shipped-text test and the Skill standalone tests pass, and no shipped guide names a removed script outside a history section.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
