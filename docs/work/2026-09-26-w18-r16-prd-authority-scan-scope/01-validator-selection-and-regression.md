---
title: "Phase 1: Validator Selection and Regression"
kind: "work"
status: "active"
coordinate: "W18 R16 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 1: Validator Selection and Regression

## Purpose

Make the validator choose current authority sources before it reads files.

## Overview

The current code walks the target project for structured extensions and then reads every selected file. [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) now defines no eligible standalone structured source. Retain active PRD Markdown, live Markdown authority links, and Markdown frontmatter checks.

## Human Experience Outcome

A person can run the authority check on a project with large stored evidence and receive a report. The report still points to a current Markdown claim that uses an action-named PRD.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required now. | Tests must prove excluded-file non-access and retained Markdown diagnostics. |
| Performance Testing | `not-needed-now` | No numerical speed target is part of this correction. Full-project completion is checked in P2. |
| Guided Progress Review | `not-needed-now` | No interactive flow changes. |
| Unassisted Goal Testing | `not-needed-now` | The existing command has a defined result; this phase changes file selection. |

- Base maintenance action: `none`
- Performance applicability: `not-needed`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

Human Experience Review: Inspect the CLI or MCP result after the tests. Record the observed result, any limit, and the next action. A human response is not required to close this phase.

## Source PRD Docs

- [PRD 39, R-PRD-AUTH](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- [D-042](../../prd/03-open-questions-and-risk-register.md) records the open scan-scope defect.
- No deferred obligation or unassisted goal scenario is assigned to this phase.

## Stage 1 - Source Selection and Tests

### Tasks

- [ ] t1: Confirm the PRD source rule and review `docs/assets/project/developing-deterministic-agentic-twins.md` before changing business logic.
- [ ] t2: Remove the whole-project structured-file walk and read from `packages/cli/src/operations/prd/authority.ts`. Keep the report field `structuredFilesScanned` with value zero.
- [ ] t3: Replace the synthetic standalone structured-authority fixture in `packages/cli/tests/prd-authority.test.ts`. Prove that an excluded structured file is not opened, including one under plan evidence.
- [ ] t4: Verify `PRD-AUTH-005` still covers live Markdown authority links and frontmatter. Run the relevant CLI and MCP operation tests.

### Acceptance criteria

- The validator does not enumerate or read standalone structured files by extension.
- Unrelated JSONL evidence with `source_prd` does not cause a diagnostic or a read error.
- Active PRD, Markdown authority, report-shape, and root-safety tests pass.

### Dependencies

- [Source-scope design](../../designs/2026-09-26-prd-authority-source-scope.md)
- [Phase plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/01-validator-selection-and-regression.md)

### Closeout Notes

Open. Record the changed files, test commands, results, and any remaining limit here when the phase runs.
