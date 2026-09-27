---
title: "W18 R16 PRD Authority Scan Scope Work"
kind: "work"
status: "active"
coordinate: "W18 R16"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog tracks the code and guidance needed to meet the PRD source rule."
  coordinate_handoff: "Carry W18 R16 and the active P number into phase history and commits."
---

# W18 R16 PRD Authority Scan Scope Work

## Purpose

Implement the file-scope rule in [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and prove it on a project with stored evidence.

The source decision is in the [design](../../designs/2026-09-26-prd-authority-source-scope.md). The [plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/00-overview.md) defines the two phases. Both phases are unstarted.

## Human Experience Trace

| Promise | PRD owner | Phase | Required evidence |
| --- | --- | --- | --- |
| The authority command returns a result without opening unrelated structured evidence. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-validator-selection-and-regression.md), [P2](02-guidance-and-project-proof.md) | Excluded-file access test and full-project command result. |
| Supported Markdown authority claims still receive a clear diagnostic. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-validator-selection-and-regression.md) | Markdown link and frontmatter tests. |

## Phase Map

| Phase | Work | State |
| --- | --- | --- |
| P1 | [Validator selection and regression](01-validator-selection-and-regression.md) | Complete for P1 scope. Full-project proof remains in P2. |
| P2 | [Guidance and project proof](02-guidance-and-project-proof.md) | Open. |

## Usage Notes

Complete P1 before P2. Do not mark [D-042](../../prd/03-open-questions-and-risk-register.md) closed after a reduced-copy run. Keep the North Atlantic BuildOS project read-only during proof. Record any remaining timeout as a separate finding with its own cause check.

This backlog is an implementation queue. The PRD remains the product rule. The observed 180-second timeout is evidence of an incomplete run, not a fixed product speed target.

## Intended Follow-On

Route: `implementation-loop`.

Next step: Start [P1](01-validator-selection-and-regression.md) after this package is accepted.

Why: The validator still uses the old whole-project structured scan.

Coordinate handoff: W18 R16 P1.
