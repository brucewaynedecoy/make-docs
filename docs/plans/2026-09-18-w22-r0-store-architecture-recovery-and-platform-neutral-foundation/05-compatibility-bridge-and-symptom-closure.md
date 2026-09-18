---
title: "W22 R0 P5 Compatibility Bridge and Symptom Closure"
kind: "plan"
status: "draft"
coordinate: "W22 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P5 Compatibility Bridge and Symptom Closure

## Purpose

Move supported existing installations to the accepted target without losing user content or useful recovery evidence. Close each in-scope symptom through the new model.

## Outcome

The CLI can read, classify, preview, convert, verify, and roll back supported old state. Ambiguous state stays safe and reviewable. No symptom is fixed by adding an unowned second authority or a one-platform special case.

## Bridge Rules

- Read old schemas, checkout rows, ledgers, receipts, path claims, operations, and projection records before mutation.
- Classify each record as convert, retain as history, rebuild, quarantine, or remove after proof.
- Preview the exact project, Store, and native changes.
- Record the operation journal before the first write.
- Verify the converted state before retiring old active fields.
- Keep rollback until the converted installation passes its required proof.
- Preserve unknown user files and changed native entries.
- Do not edit SQLite by hand or create project-local fallback state.

## Symptom Rule

Maintain one append-only symptom table. Each entry includes observed behavior, affected platform, current cause, accepted model rule, test case, migration effect, and close evidence.

The initial table must cover durable device and inode identity, package hash coupling, Windows native rule support, setup and Store recovery loops, duplicated projection state, and conflicting authority text. Add the owner's later symptom details to the same table when they map to this scope.

## Verification

Use fixtures from every supported schema and material historical state. Include current, moved, upgraded, incomplete, partial, failed, locked, changed, ambiguous, and Store-unavailable cases. Prove idempotent repeat, interruption, restart, rollback, and user-content preservation.

P5 closes only when every supported old state has a tested disposition and every known in-scope symptom has accepted close evidence or a named blocker.
