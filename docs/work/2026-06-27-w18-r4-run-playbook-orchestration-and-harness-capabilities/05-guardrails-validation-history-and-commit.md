# Phase 5: Guardrails, Validation, History, and Commit

## Purpose

Close the W18 R4 planning correction and make downstream W18 work consume it.

## Overview

Add guardrails to W18 R1, W18 R2, and W18 R3, run docs hygiene, create the history record, draft the commit message, and create the local commit.

## Source PRD Docs

- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](../../prd/31-revise-coverage-pass-extensions-adversarial-review.md)

## Stage 1 - Closeout

### Tasks

- [ ] t1: Add W18 R4 prerequisite notes to W18 R1, W18 R2, and W18 R3 plan/work indexes.
- [ ] t2: Run changed-file Markdown/link hygiene.
- [ ] t3: Run `git diff --check`.
- [ ] t4: Run `bash scripts/check-wave-numbering.sh`.
- [ ] t5: Create the W18 R4 history record under `docs/assets/archive/history/`.
- [ ] t6: Draft and create a local-only plan commit.

### Acceptance criteria

- W18 R1, W18 R2, and W18 R3 cannot be mistaken as ready to implement without W18 R4.
- Validation results are recorded in the final response.
- The final response includes a clear guide to the W18 R4 capabilities and implementation expectations.

### Dependencies

- Phases 1 through 4.
