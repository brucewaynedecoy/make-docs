---
title: "Phase 3: Skill and Chat Report"
kind: "work"
status: "draft"
coordinate: "W23 R0 P3"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 3: Skill and Chat Report

## Purpose

Build the portable first-party Skill and the default concise in-chat review.

## Overview

This phase adds deterministic-first routing, an honest agentic fallback, conflict-aware interpretation, recommended order, and one shared report model.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. Current focus and next actions appear before machine detail, with facts, inferences, and recommendations distinct.
- Intended human outcome: A maintainer can understand what needs attention next without reading every backlog record.
- Human-facing surface or indirect effect: Skill-guided in-chat report.
- Implementation work: Skill instructions, references, examples, fallback, interpretation, report model, and chat rendering guidance.
- Evidence source or testing type selected under current authority: Automated fixture and packaging checks plus Guided Progress Review and Human Experience Review.
- Executor: Skill implementation agent and review agent.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md) and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Validate routing, support files, rule mappings, fixtures, and compact report structure. |
| Performance Testing | `not-needed-now` | No current performance decision exists. |
| Guided Progress Review | Required | Owner review can change section order, density, labels, and recommendation presentation. |
| Unassisted Goal Testing | `not-needed-now` | Guided iteration is the selected current evidence path; no separate discoverability gate exists. |

- Base maintenance action: `create`
- Performance applicability: `not-needed-now`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: none`

## Stage 1 - Skill and fallback

### Tasks

- [ ] t1: Add the `backlog-review` first-party Skill source, entrypoint, references, examples, metadata, and declared support files.
- [ ] t2: Implement MCP-first, CLI-second, and agentic-fallback routing with clear method reporting.
- [ ] t3: Write the portable fallback that works without the maintainer checkout and does not claim a deterministic run.
- [ ] t4: Map every fallback rule to the stable rule catalog and add twin-change checks.
- [ ] t5: Add Skill instructions and examples that turn tool errors, warnings, and material limits into natural human explanations with context, effect, known limits, next action, and clear required or optional user action. Keep raw technical detail secondary and preserve exact meaning.
- [ ] t6: Add build, package, and extracted-Skill independence tests.

### Acceptance criteria

- A18: The Skill works from its extracted package without a sibling Skill, network access, maintainer checkout, or Store requirement.
- A19: The Skill reports MCP, CLI, or agentic fallback as the fact source and never cross-certifies another method.
- A20: Every fallback rule has a deterministic mapping or an explicit judgment-only reason.
- A21: The packaged Skill contains every declared reference, example, and template source.
- A22: For error, warning, and material-limit fixtures, the agent-facing output names the subject, explains what happened and why it matters, states what remains known or unknown, gives the next useful action, and states whether human action is required. It does not lead with raw diagnostic text or assume technical grounding.
- A23: Human explanation and machine output preserve the same severity, failure, risk, limit, and required action.

### Dependencies

- P1 accepted.
- P2 snapshot schema stable. Final deterministic routing proof needs P2 complete.

## Stage 2 - Interpretation and chat report

### Tasks

- [ ] t6: Implement the shared report model with fact, inference, recommendation, confidence, limit, `waveStatus`, `statusReason`, and the four fixed portfolio tally fields.
- [ ] t7: Assign exactly one fixed wave status and one evidence-backed status reason, then implement current-focus, attention, open, closeout-needed, blocked or conflicted, paused or superseded, historical, and recommended-order reasoning.
- [ ] t8: Define the compact chat layout and omit empty sections without hiding material limits.
- [ ] t9: Add repository-relative source links and compact drill-down detail.
- [ ] t10: Run Guided Progress Review across small, medium, large, and conflict-heavy fixtures and revise the presentation.

### Acceptance criteria

- A22: The first screenful leads with current focus, material conflicts, and the next useful actions.
- A23: Facts, inferences, and recommendations are visibly distinct and traceable. Every live record uses one of the six fixed statuses, every displayed wave has a separate reason, and the four tally values cover the full portfolio.
- A24: The default report omits empty sections and internal schema detail while preserving access to exact evidence.
- A25: Recommended order explains dependencies, blockers, authority, active work, closeout debt, and evidence limits without using age alone.

### Dependencies

- A18-A21 complete.

### Closeout Notes

- Four testing decisions: Automated required; Performance not-needed-now; Guided required; Unassisted not-needed-now.
- Performance evidence: none.
- Human Experience Review: Record observations, conclusions, evidence, reviewer, and limits for the chat promises.
- Optional experience handoff: Invite the owner to compare the concise report with expanded evidence; optional and non-blocking.
- Explicit human acceptance gate: none.
- Evidence report: Add after evidence exists.
- Phase / capability status: P3 can close after the chat report and packaged Skill pass; HTML and full installed acceptance remain open.
