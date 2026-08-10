# Requirements and Register Reconciliation

## Purpose

Trace PRD 20 into implementation surfaces and keep existing risk-register IDs stable.

## Source PRD Docs

- `docs/prd/20-agent-harness-conformance-and-support-claims.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Trace and Scope

### Tasks

- [x] t1: Map conformance lab requirements to scenario specs, result records, storage, adapters, and support-claim docs.
- [x] t2: Confirm lab assets do not move into shipped templates, npm packages, Rust packages, or provider-backed system assets.
- [x] t3: Update existing risk-register items only when implementation evidence supports a narrower status.

### Acceptance Criteria

- PRD 20 remains the source requirement for all lab implementation work.
- No new duplicate risk-register item is created for lab support claims.
- Shipped product scope remains unchanged.

### Dependencies

- PRD 20 accepted in the active set.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | PRD 20 maps scenario specs to the Phase 2 contract, result records to the Phase 2 reviewed-result schema, generated raw artifacts to `.make-docs/conformance/` or `.make-docs/runs/conformance/`, executable harness adapters and future adapter targets to Phase 3, and support-claim wording to the Phase 3 scenario/harness/model/provider/runtime tuple gate. |
| t2 | Phase 1 did not add lab assets to `packages/docs/template/`, copied `packages/cli/template/`, package allowlists, Rust-package surfaces, or provider-backed system assets. The active requirement keeps reviewed scenario/result records as maintainer evidence and keeps raw provider logs and transcripts in generated local state by default. |
| t3 | No risk-register edit was warranted in Phase 1. PRD 20 and the existing register already reference the relevant Q-007, Q-009, Q-012, Q-013, D-007, R-003, R-004, R-006, R-007, and R-014 items, and this trace phase did not produce new implementation evidence narrow enough to close or split any of them. |

## Coverage Decisions

- PRD coverage: no PRD files changed. PRD 20 already owns the conformance-lab requirement surface and the active PRD/risk-register references already preserve the support-claim boundary without duplicate IDs.
- Developer-guide coverage: no new or updated developer guide was needed. Phase 1 only records the implementation trace; the concrete maintainer workflow belongs with the scenario/result contract and adapter work in later phases.
- User-guide coverage: no user guide was needed. The lab is maintainer-only evidence infrastructure and does not change a shipped user workflow.
- UAT: deferred until the full W10 R5 wave is complete, per the active wave instruction.
