---
title: "W34 R0 P5 Acceptance"
kind: "plan"
status: "draft"
coordinate: "W34 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-11-23-skill-scripts-into-the-cli.md"
---

# W34 R0 P5 Acceptance

## Purpose

Prove the Wave and close D-064. This is step 5 of the PRD 25 operation-first order.

## Outcome

Every plan validation item has evidence or a named limit. D-064 is closed. R-008 records that its helper-script part is closed.

## Scope

- Run the name catalog, parity, ported, twin, byte-match, guard, managed-removal, and shipped-text tests.
- Run `npm run smoke:pack` and the full test suite. Record known failures.
- Check the side-by-side evidence from P1 against the final operations.
- Complete a Human Experience Review for each promise in the plan overview. Review the real text of the three Skills and the real plain output of each command.
- Give the owner a short optional experience handoff: run each command on this repository and notice the plain result.
- Update D-064 to closed with the evidence. Update R-008 for the helper-script part. Check whether R-008's whole close bar is now met, and close it only if it is.
- Record evidence in the work backlog's `evidence.md`.

## Exclusions

- No release or publish action without separate owner authority.

## Acceptance

- Every plan validation item has recorded evidence or a named limit.
- D-064 names the result and is closed.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed`.
- Guided Progress Review: selected. The owner sees the Human Experience Review result.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P4.
