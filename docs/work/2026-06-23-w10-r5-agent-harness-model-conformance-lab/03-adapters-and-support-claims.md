# Adapters and Support Claims

## Purpose

Build the first adapter path and support-claim gates without changing shipped harness behavior.

## Source PRD Docs

- `docs/prd/20-agent-harness-conformance-and-support-claims.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`

## Stage 1 - Adapters and Claims

### Tasks

- [x] t1: Start executable lab coverage with Codex and Claude Code only.
- [x] t2: Record OpenCode, Goose, Pi, and future IDEs as future adapter targets, not shipped harnesses.
- [x] t3: Gate support claims by scenario/harness/model/provider/runtime tuple.
- [x] t4: Ensure validation commands can be scenario steps without replacing package validation.

### Acceptance Criteria

- Public wording cannot imply blanket harness support from one result.
- Future adapters use the same scenario protocol.
- Package validation and conformance evidence remain distinct proof types.

### Dependencies

- Phase 2 schema and storage.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | Updated [Conformance Lab Scenario and Result Contracts](../../assets/library/developer/conformance-lab-scenario-and-result-contracts.md) to bind current executable lab coverage to the current `HARNESSES` values in `packages/cli/src/types.ts`: `codex` and `claude-code`. |
| t2 | The guide records OpenCode, Goose, Pi, and future agentic IDEs as future lab adapter targets that remain blocked or unattempted until accepted implementation and reviewed scenario results exist. |
| t3 | The guide adds a support-claim gate that distinguishes no public claim, nominal tuple support, caveated tuple support, and stronger wording. Claims must stay scoped to the exact scenario/harness/model/provider/runtime tuple. |
| t4 | The guide states that validation commands may appear in scenario steps, but they remain package validation evidence until a result record also captures tuple metadata, reviewer status, verdict, reason, and caveats. |

## Coverage Decisions

- PRD coverage: no PRD files changed. Phase 3 implements PRD 20's existing adapter and support-claim gate without changing shipped harness behavior.
- Developer-guide coverage: updated the new conformance-lab developer guide because adapter boundaries and support-claim rules are durable maintainer workflow.
- User-guide coverage: no user guide was needed. This phase does not change current user-facing harness behavior or support wording.
- UAT: deferred until the full W10 R5 wave is complete, per the active wave instruction.
