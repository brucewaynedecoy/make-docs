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
| P3 | [Markdown evidence source selection](03-markdown-evidence-source-selection.md) | Open. The directory-name candidate is superseded. Working-path selection, bounded frontmatter checks, and fresh full-project proof remain. D-043 stays open. |

## Usage Notes

P1 and P2 are complete, and [D-042](../../prd/03-open-questions-and-risk-register.md) is closed. Start the remaining P3 work from PRDs 39 and 24. The directory-name candidate is superseded. Keep [D-043](../../prd/03-open-questions-and-risk-register.md) open until revised code, guidance, tests, and fresh full-project proof agree. Keep the North Atlantic BuildOS project read-only during proof. Record any remaining failure as a separate finding with its own cause check.

This backlog is an implementation queue. The PRD remains the product rule. The observed 180-second timeout is evidence of an incomplete run, not a fixed product speed target.

## Intended Follow-On

Route: `implementation-loop`.

Next step: Implement [P3](03-markdown-evidence-source-selection.md) from the updated [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) rules.

Why: The P2 result exposed a separate Markdown evidence scan. P3 must select working sources before reads and keep stored copies outside the selected set.

Coordinate handoff: W18 R16 P3.
