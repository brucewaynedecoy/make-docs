# Scenario and Result Schema

## Purpose

Implement the compact evidence records needed for maintainer review.

## Source PRD Docs

- `docs/prd/20-revise-agent-harness-model-conformance-lab.md`

## Stage 1 - Schema and Storage

### Tasks

- [ ] t1: Define versioned scenario metadata, safety modes, and required evidence fields.
- [ ] t2: Define result record fields, verdict enum, reason, caveats, and reviewer status.
- [ ] t3: Store raw artifacts under generated local storage by default.
- [ ] t4: Define the opt-in redaction and promotion path for contentious or stronger-claim evidence.

### Acceptance Criteria

- `blocked` results cannot be mistaken for support evidence.
- Raw provider logs are not committed by default.
- Result records identify harness/model/provider/runtime tuples.

### Dependencies

- Phase 1 trace and scope.
