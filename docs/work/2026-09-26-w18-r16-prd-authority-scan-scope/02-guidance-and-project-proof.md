---
title: "Phase 2: Guidance and Project Proof"
kind: "work"
status: "active"
coordinate: "W18 R16 P2"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 2: Guidance and Project Proof

## Purpose

Align shipped guidance with the PRD and prove the command on the full reported project shape.

## Overview

The installed reference and output contract still describe the broad structured scan. Their upstream copies live in `packages/docs/template/`. This phase updates the upstream source first, then checks the dogfood and packaged copies.

## Human Experience Outcome

The user receives a complete authority report without moving stored evidence. CLI and MCP guidance describe the same file scope as the command.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required now. | Run relevant tests and package checks after guidance changes. |
| Performance Testing | `not-needed-now` | Record full-project completion and elapsed time. Do not claim an unsupported speed target. |
| Guided Progress Review | `not-needed-now` | No guided user flow changes. |
| Unassisted Goal Testing | `not-needed-now` | The full-project CLI result is the required real-use check. |

- Base maintenance action: `none`
- Performance applicability: `not-needed`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

Human Experience Review: Inspect the actual full-project report and command output. Record whether it met the human goal, what the evidence cannot prove, and any follow-up. A human response is not required to close this phase.

## Source PRD Docs

- [PRD 39, R-PRD-AUTH](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- [D-042](../../prd/03-open-questions-and-risk-register.md) remains open until the full-project result and guidance agree.
- No deferred obligation or unassisted goal scenario is assigned to this phase.

## Stage 1 - Shipped Rule and Full Project

### Tasks

- [ ] t1: Update the PRD authority text in `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. Dogfood the upstream files and verify the built CLI package uses the same rule.
- [ ] t2: Run the built `make-docs run prd authority validate --target-root` command against the full North Atlantic BuildOS project. Do not change that project. Save the report, elapsed time, and any error in phase evidence.
- [ ] t3: Review the real command result against the two human promises. If another limit remains, record it without marking the full-project check passed.
- [ ] t4: Run relevant package and link checks. Close D-042 only when code, guidance, tests, and full-project proof meet its close rule.

### Acceptance criteria

- Upstream, dogfood, and packaged guidance match PRD 39.
- The full project returns an authority report without reading unrelated JSONL evidence.
- Any remaining failure is reported as a separate, bounded finding.
- D-042 has evidence for its final status.

### Dependencies

- [P1](01-validator-selection-and-regression.md) is complete.
- [Phase plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/02-guidance-and-project-proof.md)

### Closeout Notes

Open. Record the full-project command, result, elapsed time, package check, and Human Experience Review here when the phase runs.
