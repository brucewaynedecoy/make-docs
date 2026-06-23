# Adapters and Support Claims

## Purpose

Build the first adapter path and support-claim gates without changing shipped harness behavior.

## Source PRD Docs

- `docs/prd/20-revise-agent-harness-model-conformance-lab.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`

## Stage 1 - Adapters and Claims

### Tasks

- [ ] t1: Start executable lab coverage with Codex and Claude Code only.
- [ ] t2: Record OpenCode, Goose, Pi, and future IDEs as future adapter targets, not shipped harnesses.
- [ ] t3: Gate support claims by scenario/harness/model/provider/runtime tuple.
- [ ] t4: Ensure validation commands can be scenario steps without replacing package validation.

### Acceptance Criteria

- Public wording cannot imply blanket harness support from one result.
- Future adapters use the same scenario protocol.
- Package validation and conformance evidence remain distinct proof types.

### Dependencies

- Phase 2 schema and storage.
