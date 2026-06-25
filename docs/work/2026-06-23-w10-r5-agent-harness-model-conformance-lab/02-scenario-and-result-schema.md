# Scenario and Result Schema

## Purpose

Implement the compact evidence records needed for maintainer review.

## Source PRD Docs

- `docs/prd/20-revise-agent-harness-model-conformance-lab.md`

## Stage 1 - Schema and Storage

### Tasks

- [x] t1: Define versioned scenario metadata, safety modes, and required evidence fields.
- [x] t2: Define result record fields, verdict enum, reason, caveats, and reviewer status.
- [x] t3: Store raw artifacts under generated local storage by default.
- [x] t4: Define the opt-in redaction and promotion path for contentious or stronger-claim evidence.

### Acceptance Criteria

- `blocked` results cannot be mistaken for support evidence.
- Raw provider logs are not committed by default.
- Result records identify harness/model/provider/runtime tuples.

### Dependencies

- Phase 1 trace and scope.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | Added [Conformance Lab Scenario and Result Contracts](../../assets/library/developer/conformance-lab-scenario-and-result-contracts.md), which defines `schemaVersion`, stable scenario identity, required source requirement anchors, safety modes, prerequisite flags, execution steps, expected evidence, artifact policy, and support-claim scope. |
| t2 | The guide defines compact result records with harness/model/provider/runtime tuple fields, make-docs version, produced files, diffs, exit status, transcript/log pointer, verdict enum, reason, caveats, reviewer status, and support-claim use. `blocked` records must use `supportClaimUse: none`. |
| t3 | Added `.make-docs/conformance/` to `.gitignore` and documented `.make-docs/conformance/<run-id>/` plus `.make-docs/runs/conformance/<run-id>/` as generated local raw-artifact storage. |
| t4 | The guide defines opt-in redaction and promotion for contentious evidence, stronger claim candidates, transcript excerpts, and reviewed compact result records. Raw provider logs, temporary workspaces, credentials, and full transcripts remain local by default. |

## Coverage Decisions

- PRD coverage: no PRD files changed. Phase 2 implements PRD 20's existing scenario/result contract without changing the requirement surface.
- Developer-guide coverage: created a new draft developer guide because maintainers need durable schema, storage, and redaction rules before running the lab.
- User-guide coverage: no user guide was needed because the lab remains maintainer-only and does not change shipped user behavior.
- UAT: deferred until the full W10 R5 wave is complete, per the active wave instruction.
