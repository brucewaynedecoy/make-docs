---
title: "Phase 1: Factory Contract and Workflow Types"
kind: "work"
status: "active"
coordinate: "W30 R0 P1"
source:
  type: "plan"
  path: "docs/plans/2026-11-21-w30-r0-factory/01-factory-contract-and-workflow-types.md"
---

# Phase 1: Factory Contract and Workflow Types

## Purpose

Write the shared factory rules once, as system resources, so both Skills and the CLI follow the same rules. Later phases build on these resources.

## Overview

This phase adds four upstream resources in `packages/docs/template/`:

- `make-docs://system/contract/factory-contract.md`;
- `make-docs://system/reference/factory/workflows/build-then-review.md`;
- `make-docs://system/reference/factory/workflows/lead-and-specialists.md`;
- `make-docs://system/reference/factory/workflows/staged-backlog.md`.

They use the existing contract and reference types. After review, they are projected into the package and then into this repository's dogfood copy.

## Human Experience Outcome

- Impact and governing promise: `direct`. Escalation messages say what happened, what is needed, and what happens next (R-FACTORY-37, R-FACTORY-38).
- Intended human outcome: an agent that follows the contract sends only floor events and added events, each as a self-contained request.
- Human-facing surface: the factory contract and the three workflow type references.
- Implementation work: Stages 1 and 2.
- Evidence source: resource parity checks, the PRD authority validator, and a reviewer map from each design decision to one resource section.
- Executor: the implementing agent.
- Accepted obligation: none.

The governing requirements are [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-1, R-FACTORY-6 to R-FACTORY-10, R-FACTORY-12, R-FACTORY-17 to R-FACTORY-21, R-FACTORY-37 to R-FACTORY-46, and R-FACTORY-52, with the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Resource identity, package, provider inventory, and dogfood byte parity checks; the PRD authority and path-hygiene validators. |
| Performance Testing | not-needed-now | This phase changes text only. No performance candidate applies. |
| Guided Progress Review | not-needed-now | P5 reviews the real escalation messages that follow these rules. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [53 Factory Setup and Orchestration](../../prd/53-factory-setup-and-orchestration.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Factory Contract

### Tasks

- [x] T1: Author `factory-contract.md` upstream with the four standard roles and the fields of a custom role (R-FACTORY-6, R-FACTORY-7, R-FACTORY-8).
- [x] T2: Add the capability catalog. List each capability and how setup proves it (R-FACTORY-9, R-FACTORY-10).
- [x] T3: Add the readiness states `draft`, `wired`, `ready`, and `drifted`, and what moves a workflow between them (R-FACTORY-12).
- [x] T4: Add the escalation floor, the message rules, and acceptance at the end of the given scope (R-FACTORY-37, R-FACTORY-38, R-FACTORY-39).
- [x] T5: Add the working rules, the limits and their defaults, and the backup rule outside git (R-FACTORY-20, R-FACTORY-40 to R-FACTORY-46).
- [x] T6: Add a rule catalog that maps each rule to its CLI check, where one exists, and to its contract text (R-FACTORY-52).
- [x] T7: Describe every example tool by capability only.

### Acceptance criteria

- A1: The contract states the four roles, the capability catalog, the four readiness states, the five floor events, the acceptance rule, the working rules, the limits, and the backup rule.
- A2: Each capability in the catalog names how setup proves it.
- A3: No example, default, or required step in the contract names a particular app, harness, provider, multiplexer, scheduler, or messaging tool.
- A4: The rule catalog has one row per rule, and each row names its CLI check or states that the rule is contract-only.

### Dependencies

- Accepted design and PRD 53.

## Stage 2 - Workflow Types and Projection

### Tasks

- [x] T8: Author `build-then-review.md`, `lead-and-specialists.md`, and `staged-backlog.md` upstream. Each names its roles, the capabilities each role needs, its steps, its limits, its integration owner rule for parallel work, and what it returns (R-FACTORY-17, R-FACTORY-18, R-FACTORY-20, R-FACTORY-42).
- [x] T9: Define the repo path and fields for a project-owned workflow type, and the rule that it never replaces a shipped type silently (R-FACTORY-19).
- [x] T10: Add the optional preflight step to the workflow type fields (R-FACTORY-21).
- [x] T11: Project the four resources into the package, then reseed them into this repository's `.make-docs/`.
- [x] T12: Map each design decision to one contract or workflow type section, and record the map for the reviewer.

### Acceptance criteria

- A5: Each workflow type works for software, personal, and business work, and says so with one example of each, described by capability.
- A6: Package, provider inventory, and dogfood bytes match for all four resources.
- A7: A reviewer can map every decision in the design to one contract or workflow type section.
- A8: No new resource type, Playbook shape, or Protocol shape exists after the change.

### Dependencies

- Stage 1.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done: `packages/cli/tests/w30-r0-p1-factory-resources.test.ts` (7 tests) checks byte parity, catalog entries, offline list and read with and without local projection, the contract content, the state moves, the claim timing, the rule catalog checks, the workflow type sections, examples, and step order, and the product-name and task ID guards. The PRD authority and path-hygiene validators pass. Performance Testing `not-needed-now`: text only. Guided Progress Review `not-needed-now`: P5 reviews the real escalation messages. Unassisted Goal Testing `not-needed-now`.
- Performance evidence: none needed. No measurement was taken.
- Human Experience Review: done by the implementing agent on the contract text. Each escalation message must say what happened, what is needed, whether it is required or optional, what it blocks, and what happens next, and the contract gives one example. The real messages are reviewed in P5.
- Independent review: ten findings, all fixed. They covered the state moves, the smallest setup, the rule catalog checks and missing rows, claim timing, the name clash, two owner choices, the upgrade effect of projection, the step order in two workflow types, one word in a rule row, and a too-wide tool-name test. The [evidence report](evidence.md#independent-review-fixes) lists each fix.
- Optional experience handoff: none.
- Explicit human acceptance gate: none in this phase. The owner reviews the new choices listed in the evidence report.
- Evidence report: [P1 Factory Contract and Workflow Types](evidence.md#p1-factory-contract-and-workflow-types), with the design decision map for T12 and A7.
- Phase / capability status: implementation complete and uncommitted, on `4daaf18f`. A1 to A8 have evidence. The factory and work queue commands named in the resources are planned, not built.
- Waits for: nothing. P1 could start any time.
- Next: P2 waits for all of [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md).
