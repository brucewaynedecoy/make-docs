---
title: "Phase {{PHASE_NUMBER}}: {{PHASE_TITLE}}"
kind: "work"
status: "active"
coordinate: "W{{W}} R{{R}} P{{PHASE_NUMBER}}"
# source:
#   type: "prd"
#   path: "{{SOURCE_PATH}}"
---

# Phase {{PHASE_NUMBER}}: {{PHASE_TITLE}}

> Shape for `0N-<phase>.md` files inside a work directory. See `.make-docs/system/references/wave-model.md` for W/R semantics.

## Purpose

Explain why this phase exists and what foundation it depends on.

## Overview

Explain the work covered by this phase and the value it unlocks.

## Source PRD Docs

- {{SOURCE_PRD_LINK_ONE}}
- {{SOURCE_PRD_LINK_TWO}}

## Source Obligations, Scenarios, And Findings

- `{{O_REF_OR_NONE}}`
- `{{NUAT_REF_OR_NONE}}`
- `{{FINDING_REF_OR_NONE}}`

## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}

### Tasks

- [ ] t1: {{TASK}}
- [ ] t2: {{TASK}}

### Acceptance criteria

Use stable `A<number>` case IDs that are unique across this backlog's phases. When retaining evidence for acceptance or review, create or update the owning backlog's central `evidence.md` report. Link the relevant report sections from this phase's acceptance or closeout record. The report must explain the findings even when supporting evidence already exists elsewhere and no new capture folder is needed. Keep new acceptance-case captures in `evidence/a<number>/` only when needed; detailed reports in case folders are optional. Follow the Acceptance-Case Evidence Retention section in `.make-docs/system/contracts/coverage-pass-contract.md`.

- A{{CASE_NUMBER}}: {{ACCEPTANCE}}
- A{{NEXT_CASE_NUMBER}}: {{ACCEPTANCE}}

### Dependencies

- {{DEPENDENCY}}

### Closeout Notes

- Testing-mode decision(s): {{AUTOMATED_REVIEW_NUAT_ACCESSIBILITY_VISUAL_DECISIONS}}
- Evidence report: {{CENTRAL_EVIDENCE_REPORT_SECTION_LINKS_OR_REASON_NO_DURABLE_RECORD_IS_NEEDED}}
- Phase / capability status: {{PHASE_AND_CAPABILITY_STATUS}}

<!-- Insert additional STAGES as needed -->
