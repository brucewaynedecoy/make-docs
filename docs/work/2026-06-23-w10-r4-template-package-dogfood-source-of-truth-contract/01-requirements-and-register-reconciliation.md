# Requirements and Register Reconciliation

## Purpose

Keep implementation work grounded in PRD 19 and the active risk register before source or validation changes begin.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Requirements Trace

### Tasks

- [ ] t1: Map PRD 19 requirements to source, docs, tests, and validation surfaces.
- [ ] t2: Identify which existing risk-register items will be narrowed by implementation evidence.
- [ ] t3: Confirm no new PRD or risk-register item is required before coding.
- [ ] t4: Record the W10 R3 link-rewrite hardening requirements as deferred future migration work unless W10 R4 directly depends on moved user Markdown trees.

### Acceptance Criteria

- Every implementation phase references PRD 19.
- Existing risk-register IDs remain stable.
- Any intentionally deferred requirement is recorded as a follow-on, not silently dropped.
- W10 R4 does not implement or claim V1-to-V2 Markdown-tree migration unless it records that dependency explicitly.

### Dependencies

- PRD 19 accepted in the active set.
