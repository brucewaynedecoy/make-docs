---
title: "Phase 2: Guidance and Project Proof"
kind: "work"
status: "complete"
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

- [x] t1: Update the PRD authority text in `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. Dogfood the upstream files and verify the built CLI package uses the same rule.
- [x] t2: Run the built `make-docs run prd authority validate --target-root` command against the full North Atlantic BuildOS project. Do not change that project. Save the report, elapsed time, and any error in phase evidence.
- [x] t3: Review the real command result against the two human promises. If another limit remains, record it without marking the full-project check passed.
- [x] t4: Run relevant package and link checks. Close D-042 only when code, guidance, tests, and full-project proof meet its close rule.

### Acceptance criteria

- Upstream, dogfood, and packaged guidance match PRD 39.
- The full project returns an authority report without reading unrelated JSONL evidence.
- Any remaining failure is reported as a separate, bounded finding.
- D-042 has evidence for its final status.

### Dependencies

- [P1](01-validator-selection-and-regression.md) is complete.
- [Phase plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/02-guidance-and-project-proof.md)

### Closeout Notes

2026-09-26: P2 is complete. The upstream reference and output contract now state the current Markdown source rule. Their dogfood copies match byte for byte. The packed CLI archive contains the same two files, also byte for byte. No standalone structured source is defined.

The built command `node packages/cli/dist/index.js run prd authority validate --target-root "/Volumes/TylerT9/Work/HSL/North Atlantic/north-atlantic-buildos" --json` returned exit code 0 and `status: passed` on the full project. It scanned 8 active PRDs, 73,372 Markdown files, zero structured files, and 172 authority links. It returned no diagnostics. The run took 17.79 seconds of wall time. See the [full report](evidence/2026-09-26-north-atlantic-authority-report.json) and [run record](evidence/2026-09-26-north-atlantic-authority-run.txt). The target project was used as a read-only input.

The 53 default package checks passed. The 21 PRD authority tests and 19 smoke harness tests passed. `npm pack` built the CLI archive and its two guidance files matched upstream. The link check found no broken links in the changed work and guidance files. The first archive attempt failed, and npm reported that it could not write logs under the home directory. A repeat with a temporary npm cache passed; that environment error did not affect the validator result.

Human Experience Review by the implementing agent: The real command returned a complete authority report for the project that had failed before. The report clearly states `passed` and zero structured files scanned. The P1 file-access regression proves that authority-looking JSON, JSONL, YAML, and YML evidence is not opened. This meets the two phase promises for the tested project and shipped package. The review does not prove a person's ease of use or a speed target for other projects. [D-042](../../prd/03-open-questions-and-risk-register.md) is closed on this evidence.

Separate finding: The validator still reads Markdown files under `docs/` before it checks for authority contexts. A [read-only count](evidence/2026-09-26-north-atlantic-markdown-path-counts.txt) found 73,242 Markdown files under one North Atlantic BuildOS plan's `implementation-evidence/` directory. The full run passed, but this does not prove that all unrelated evidence is outside the scan. [D-043](../../prd/03-open-questions-and-risk-register.md) records the Markdown source-scope issue for a separate product decision.

See the [P2 history record](../../../.make-docs/archive/history/2026-09-26-w18-r16-p2-prd-authority-guidance-and-proof.md) for the change summary.
