---
title: "Phase 4: Verification and Conformance Reconciliation"
kind: "work"
status: "active"
coordinate: "W18 R12 P4"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 4: Verification and Conformance Reconciliation

## Purpose

Prove the round end-to-end and unblock W18 R9: run the full verification sweep across both change docs' test bars, reconcile former PRD 37, now incorporated in [PRD 43](../../prd/43-conformance-scenario-model-and-execution-kits.md#requirements), and the [W18 R9 backlog](../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) for every assumption this round invalidates, and hand off the UAT-doc regeneration note. This phase implements former PRD 40 anchors R-TEST-1..2 (sweep), former PRD 41 anchors R-TEST-3..6 (sweep) and R-SEQ-1..2, and closes the follow-ups on register items [D-015](../../prd/03-open-questions-and-risk-register.md), [D-016](../../prd/03-open-questions-and-risk-register.md), and [R-026](../../prd/03-open-questions-and-risk-register.md).

## Overview

Phases 1–3 each land their own suites; this phase runs them as one bar, adds the cross-cutting checks (package validation, path hygiene, consistency pins), and then turns outward: the W18 R9 conformance wave was authored against pre-remediation surfaces, so its scenario expectations, command spellings, and transcript consumption must be reconciled before any conformance evidence is minted. The phase ends with W18 R9 unblocked and a handoff note for regenerating the UAT walkthrough document against the remediated surfaces.

## Source PRD Docs

- [40 Revise Playbook Authoring Contract v2](../../prd/34-playbook-authoring-contract-and-model.md)
- [41 Revise CLI Human Experience and Package Grammar](../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar)
- [37 Enhance Playbook and Package Conformance](../../prd/43-conformance-scenario-model-and-execution-kits.md#requirements) (reconciliation target; its tuple registry, evidence bar, test layers, and governance are unchanged)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) (D-015, D-016, R-026 closure state)

## Stage 1 - Full Verification Sweep

### Tasks

- [x] t1: Run the complete W18 R12 test bar in one pass — contract R-TEST-1, probe R-TEST-2, hints R-TEST-3, render invariance R-TEST-4, grammar R-TEST-5, ship R-TEST-6 — plus the full existing suite, and fix regressions before proceeding (PRD 40 R-TEST-1..2; PRD 41 R-TEST-3..6).
- [x] t2: Run `npm run validate:defaults` and the package/template validation over the migrated upstream assets, confirming the migrated default Playbook validates with zero errors in `packages/docs/template/`, the packaged copy pipeline, and the dogfood instance, and that consistency pins reflect the `package.ship` registry addition and nothing else (PRD 40 R-MIG-4; PRD 39 R-REG-1).
- [x] t3: Run `python3 .make-docs/scripts/check_path_hygiene.py` and a relative-link resolution pass over every document this round touched, and confirm `git diff --check` is clean.

### Acceptance criteria

- Every R-TEST anchor across PRD 40 and PRD 41 has a passing test, and the whole suite is green.
- Package validation proves no v1-form document ships in the template, the packaged copy, or the tarball.
- Path hygiene, link resolution, and `git diff --check` pass over the round's changes.

### Dependencies

- Phases 1–3 complete.

## Stage 2 - PRD 37 and W18 R9 Backlog Reconciliation (R-026)

### Tasks

- [x] t4: Reconcile the [W18 R9 backlog](../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) phase files for the invalidated assumptions: dependency-table fixtures and generated-check expectations move to the v2 dependencies block and probe-based checks; `run package` command spellings in scenario scripts move to `plan`/`preview`/`write` (and `ship` where a single-entry flow is exercised); any scenario transcript that consumes CLI output pins `--json` so the render layer never enters evidence (PRD 41 R-SEQ-2).
- [x] t5: Verify the PRD 37 R-SCEN change note reflects the reconciled state, and update the register: mark the D-015 and D-016 follow-ups with their closure evidence and update R-026 to `Closed` with a `Resolution` once W18 R9 is genuinely unblocked — never renumbering items (PRD 41 R-SEQ-1..2).

### Acceptance criteria

- No W18 R9 phase file or PRD 37 scenario references the v1 dependency table, `Source`-derived checks, the `write --write` spelling, or unpinned CLI output consumption.
- Register items D-015 and D-016 carry closure evidence, and R-026 is closed with a resolution or explicitly records what still blocks W18 R9.

### Dependencies

- Stage 1, so reconciliation targets verified surfaces.

## Stage 3 - UAT-Doc Regeneration Handoff

### Tasks

- [x] t6: Write the handoff note for regenerating the hand-run UAT walkthrough against the remediated surfaces — the v2 authoring shapes, the `plan`/`preview`/`write`/`ship` spellings, the TTY render expectations, and the run-id/flag ergonomics — recording it as a breadcrumb history record for this phase per the history-record contract rather than regenerating the UAT document inside this round.

### Acceptance criteria

- The handoff note names every UAT step whose commands or expected output changed, with the new spelling or expectation beside each.
- The note is discoverable from the phase history record and does not modify the original UAT evidence.

### Dependencies

- Stages 1–2.
