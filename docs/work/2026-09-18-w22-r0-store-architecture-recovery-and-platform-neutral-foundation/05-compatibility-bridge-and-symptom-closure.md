---
title: "Phase 5: Compatibility Bridge and Symptom Closure"
kind: "work"
status: "draft"
coordinate: "W22 R0 P5"
source:
  type: "prd"
  path: "docs/prd/18-compatibility-classification-and-migration-safety.md"
---

# Phase 5: Compatibility Bridge and Symptom Closure

## Purpose

Convert supported old state to the accepted target. Preserve user content and useful recovery evidence. Close every in-scope symptom through the new model.

## Overview

P5 adds a read, classify, preview, convert, verify, and rollback bridge. It keeps ambiguous state safe. It retires old active fields only after conversion proof. It uses one symptom table to prove that the architecture recovery resolves the observed problems without new special cases.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Apply HX-4 and HX-5. Preserve HX-1 through HX-3.
- Intended human outcome: An existing installation can upgrade or recover without losing project files, native entries, or useful operation evidence.
- Human-facing surface or indirect effect: Upgrade, setup, status, migration preview, apply, verify, rollback, repair, and recovery.
- Implementation work: Compatibility readers, classification, preview, conversion journal, verification, rollback, quarantine, old-field retirement, and symptom cases.
- Evidence source or testing type selected under current authority: Automated Implementation Testing with historical fixtures, interruption/restart proof, and byte inventories.
- Executor: Compatibility owner implements. Store, harness, and validation owners review their state.
- Accepted obligation or deferral route: None. Unsupported or ambiguous state needs an explicit safe result and owner-approved support rule.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), and [PRD 38](../../prd/38-global-store-and-project-state.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required; blocking | Historical schema, interruption, rollback, repeat, preservation, and symptom cases decide whether the bridge is safe. |
| Performance Testing | `not-needed-now` | Migration duration has no accepted target. Finite retry and stop rules are functional safety. |
| Guided Progress Review | `not-needed-now` for source close | P6 will review the installed result and recovery language. |
| Unassisted Goal Testing | `not-needed-now` | Automated migration and preservation proof can answer the current safety decision. |

Human Experience Review is separate. Inspect preview, blocked, converted, quarantined, rollback, and recovered results. Do not infer confidence from successful schema writes alone.

## Source PRD Docs

- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- P1 symptom table and P2 W22 risk items.
- Existing D-031, D-033, D-034, D-035, and D-038 where their close rules remain relevant.
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none.

## Stage 1 - Read, Classify, Preview, and Convert

### Tasks

- [x] t1: Build fixtures for every supported old schema, receipt, installation ledger, checkout record, path claim, projection record, and pending-operation shape.
- [x] t2: Implement read-only classification as convert, retain as history, rebuild, quarantine, unsupported, or removable after proof.
- [x] t3: Produce an exact preview of Store, project, and native changes with blockers and one next action.
- [x] t4: Record one conversion operation journal before the first write. Use P3 locks and file guards.
- [x] t5: Convert accepted state to the new model. Preserve stable project identity, useful recovery evidence, user files, and changed native entries.
- [x] t6: Verify converted state before old active fields or rows are retired. Keep historical evidence under its accepted retention rule.
- [x] t7: Implement rollback from the saved before state. Keep ambiguous state quarantined without destructive cleanup.

### Acceptance criteria

- A28: Every supported old record shape has one tested classification and one clear public result.
- A29: Preview lists every planned change and blocker before mutation. It writes nothing.
- A30: Conversion preserves user files, changed native entries, stable project identity, and useful recovery evidence.
- A31: An interrupted conversion resumes or rolls back from one journal. It does not create a second state engine or project-local fallback.

### Dependencies

- P3 and P4 target behavior is complete.
- Current P2 migration and retention authority is accepted.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing required; other testing types `not-needed-now` for this stage.
- Human Experience Review: The P5 source review records preview, block, convert, quarantine, rollback, and recovery observations. P6 still owns the final installed-package review.
- Evidence report: Retain fixture identity, before and after inventories, operation records, and byte-preservation proof.
- Phase / capability status: Stage 1 is complete.

## Stage 2 - Symptom Cases and Old-State Retirement

### Tasks

- [x] t8: Update the append-only symptom table with the final cause, accepted rule, exact case, migration effect, and evidence link.
- [x] t9: Prove moved checkout behavior without durable device or inode identity.
- [x] t10: Prove valid package update behavior without historical executable hash lock-in.
- [x] t11: Prove the accepted Windows harness behavior or accepted narrow limit.
- [x] t12: Prove setup and Store access no longer form a closed recovery loop.
- [x] t13: Prove selected resource projection has one desired-state owner and one minimum applied-state record.
- [x] t14: Add each later owner-provided in-scope symptom and prove it through the accepted model.
- [x] t15: Stop writing obsolete active fields. Retire them only after all supported upgrade, repeat, interruption, and rollback cases pass.
- [x] t16: Run focused and full tests, default validation, package smoke preparation, authority checks, links, paths, and diff checks.

### Acceptance criteria

- A32: Every known in-scope symptom has a reproducible before case and an accepted after result. No close claim relies only on code inspection.
- A33: No symptom fix adds a platform-specific core identity, duplicate authority, second recovery engine, or project-local operational state.
- A34: Repeat conversion and repeat setup are idempotent. Interruption and restart keep one valid next action.
- A35: Old active fields stop receiving writes and are removed or retained only under the accepted compatibility and history rule.

### Dependencies

- Stage 1 bridge passes all supported state cases.
- Owner symptom details that arrive before P5 close are classified into this scope or routed to a separate decision.

### Closeout Notes

- Four testing decisions: Record final automated bridge and symptom results. Performance, Guided Progress, and Unassisted Goal Testing remain `not-needed-now` until P6.
- Human Experience Review: The P5 evidence records per-promise observations, conclusions, and remaining limits.
- Evidence report: Link every symptom row to its before and after evidence.
- Phase / capability status: All supported old state and known in-scope symptoms have a disposition. The owner authorized closeout on 2026-09-19. P5 is closed.
