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
  why: "P3 must apply the Markdown evidence path rule and prove it on the full project."
  coordinate_handoff: "Carry W18 R16 P3 into phase history and the implementation commit."
---

# W18 R16 PRD Authority Scan Scope Work

## Purpose

Implement the file-scope rule in [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and the custom-source declaration in [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md). Prove both on a project with stored evidence.

The source decision is in the [design](../../designs/2026-09-26-prd-authority-source-scope.md). The [plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/00-overview.md) defines three phases. P1 and P2 are complete. P3 remains open for the Markdown evidence issue found in the P2 run.

## Human Experience Trace

| Promise | PRD owner | Phase | Required evidence |
| --- | --- | --- | --- |
| The authority command returns a result without opening unrelated structured evidence. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-validator-selection-and-regression.md), [P2](02-guidance-and-project-proof.md) | Excluded-file access test and full-project command result. |
| Supported Markdown authority claims still receive a clear diagnostic. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P1](01-validator-selection-and-regression.md) | Markdown link and frontmatter tests. |
| The command does not enter or read stored Markdown evidence under the named directory families. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P3](03-markdown-evidence-source-selection.md) | Directory-traversal and file-access tests plus a full-project report. |
| Live Markdown authority claims outside those directories still receive a clear diagnostic. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P3](03-markdown-evidence-source-selection.md) | Positive tests in standard and custom live paths. |

## Phase Map

| Phase | Work | State |
| --- | --- | --- |
| P1 | [Validator selection and regression](01-validator-selection-and-regression.md) | Complete. |
| P2 | [Guidance and project proof](02-guidance-and-project-proof.md) | Complete. The full-project check passed. |
| P3 | [Markdown evidence source selection](03-markdown-evidence-source-selection.md) | Complete. The full-project check passed, and D-043 is closed. |

## Usage Notes

P1, P2, and P3 are complete. [D-042](../../prd/03-open-questions-and-risk-register.md) and [D-043](../../prd/03-open-questions-and-risk-register.md) are closed. The directory-name candidate is superseded. The revised P3 code, guidance, tests, and full-project report agree in this checkout. The North Atlantic BuildOS project remained read-only during proof.

This backlog is an implementation queue. The PRD remains the product rule. The observed 180-second timeout is evidence of an incomplete run, not a fixed product speed target.

## Intended Follow-On

Route: `implementation-loop`.

Next step: Consume the completed [P3](03-markdown-evidence-source-selection.md) source rule in later authority work when needed.

Why: The revised validator selects working sources before reads and passed the full-project check.

Coordinate handoff: W18 R16 P3.
