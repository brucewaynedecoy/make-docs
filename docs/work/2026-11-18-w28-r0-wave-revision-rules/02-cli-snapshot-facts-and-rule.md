---
title: "Phase 2: CLI Snapshot Facts and Rule"
kind: "work"
status: "active"
coordinate: "W28 R0 P2"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 2: CLI Snapshot Facts and Rule

## Purpose

Give the agent's coordinate decision reliable deterministic facts, and check Change History shape. This phase is the deterministic twin of the P1 instructions.

## Overview

`work.backlog.snapshot` gains these facts:

- per-phase `closeoutNotesPresent` and `committed`;
- a record-level `closeout.committed`;
- a per-record `nextPhase`;
- a project-level `coordinates` value.

The rule catalog gains `BACKLOG-RULE-017` / `BACKLOG-VAL-017` for the Change History shape, and agent-only `BACKLOG-AGENT-018` for coordinate selection.

The snapshot reports each signal separately. It never classifies a change or selects a coordinate. `work.item.resolve` is unchanged, which keeps the PRD 39 work-domain bound.

## Human Experience Outcome

- **Impact and governing promise:** `direct`, through agent output. A reader of a committed backlog sees each scope change in one Change History section. A malformed entry is reported as a warning with a reason and a fix.
- **Intended human outcome:** a maintainer who runs the snapshot on a backlog with a malformed Change History sees which entry is wrong and how to fix it. An agent reading the snapshot can see whether a Phase is committed, and the next free `P` and `R`. It sees `null` when Git is unavailable.
- **Human-facing surface:** the `make-docs run work backlog snapshot` output and its MCP projection.
- **Implementation work:** Stages 1 to 4.
- **Evidence source:** Automated Implementation Testing, plus a snapshot run on this repository.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SNAPSHOT-27 to R-BACKLOG-SNAPSHOT-30 and R-BACKLOG-RULES-11 to R-BACKLOG-RULES-12, and [the Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Focused fixture tests for each fact and rule, then `npm test -w packages/cli`. |
| Performance Testing | not-needed-now | The design and plan record the extra Git lookup as `none` / `not-needed`. |
| Guided Progress Review | not-needed-now | Fixtures settle the output shape. No owner review can change a current decision. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

Performance candidate (Git lookup for `committed`):

- Base maintenance action: `none`
- Performance applicability: `not-needed`
- Canonical `PERF-###` profile link: `none`
- Finite evidence budget and stop-rule reference: `not-applicable`
- Execution packet link: `not-applicable`
- Outcome and evidence handoff: `none`
- Gate disposition and supported-scope limit: `not-applicable`

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md) (R-COORD-14, R-COORD-21)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md) (registry and work-domain bounds, unchanged)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- `none`

## Stage 1 - Preflight

### Tasks

- [ ] t1: Search for every persisted artifact that validates JSON against `BacklogSnapshotV1Schema` in `packages/cli/src/operations/work/backlog/schemas.ts`. Include Store cache rows, saved reports, and review fragments. Record the result in `evidence.md`. If one cannot accept additive keys, stop and ask the owner about a schema version, under R-BACKLOG-SNAPSHOT-30.
- [ ] t2: Run the existing registry, access, CLI, and MCP contract tests as a baseline, under R-BACKLOG-SNAPSHOT-26. Record the result.

### Acceptance criteria

- A10: `evidence.md` names each persisted consumer found, or records that none was found. It also records the schema-version decision.
- A11: The baseline contract tests pass before any shared surface changes.

### Dependencies

- P1 Stage 1 names the `wave-model.md` Change History anchor that the parity mapping uses.

## Stage 2 - Facts

### Tasks

- [ ] t3: In `schemas.ts`, add three things and keep every schema strict:
  - `closeoutNotesPresent` and `committed` (`NullableSourcedBoolean`) to `WorkPhaseFactSchema`;
  - `nextPhase` (`SourcedCount`) to `BacklogWorkRecordV1Schema`;
  - a top-level `coordinates` object: `highestWave`, plus `waves[]` with `wave`, `revisions[]`, and `nextRevision`.
- [ ] t4: In `snapshot.ts`, derive `closeoutNotesPresent`. It is true when `### Closeout Notes` has content with no unresolved `{{` placeholder. It is false when the section is absent or empty.
- [ ] t5: In `snapshot.ts`, derive per-phase `committed` from the existing Git context. It is true when the file is tracked and clean, false when it is untracked or changed, and `null` when Git is unavailable, denied, or not a repository. Fill the record-level `closeout.committed` over the index and every linked phase file.
- [ ] t6: In `snapshot.ts`, derive `nextPhase` from the linked and numbered phase files. Derive `coordinates` from every discovered live and archived record directory.

### Acceptance criteria

- A12: A fixture with a clean, committed phase reports `committed: true`. A changed phase reports `false`. A non-repository root reports `null` with the existing Git capability diagnostic.
- A13: A fixture portfolio with Waves W1 R0–R2 and W3 R0 reports `highestWave` 3. It reports revisions `[0,1,2]` and `nextRevision` 3 for W1, and the correct `nextPhase` for each record.
- A14: No fact combines signals into completion, and no fact selects a coordinate.

### Dependencies

- Stage 1 is complete, and its schema-version decision is recorded.

## Stage 3 - Rule

### Tasks

- [ ] t7: In `catalog.ts`, add `BACKLOG-RULE-017` (`fact`, `full`, default severity `warning`, diagnostic `BACKLOG-VAL-017`). Its parity mapping points to the `wave-model.md` Change History section. Add `BACKLOG-AGENT-018` (`agent-only`), with the one-sided reason from R-BACKLOG-RULES-12.
- [ ] t8: In `snapshot.ts`, parse `## Change History` in supported work indexes. Emit `BACKLOG-VAL-017` in four cases:
  - a heading that does not use `YYYY-MM-DD — <coordinate>`;
  - a coordinate whose W/R differs from the record;
  - a missing one of the eight fields, or an invalid `Kind` or `PRD decision` value;
  - entries out of date order.

  An absent section emits nothing.

### Acceptance criteria

- A15: A valid Change History emits no diagnostic. Each of the four defect classes emits one `BACKLOG-VAL-017` with a record location, a reason, and a remediation.
- A16: The catalog entries carry every R-BACKLOG-RULES-7 field. `BACKLOG-AGENT-018` is never emitted as a snapshot fact.

### Dependencies

- Stage 2 is complete.

## Stage 4 - Tests and Proof

### Tasks

- [ ] t9: Add focused tests in `packages/cli/tests/`. Use isolated temporary repositories for Git states. Add the Change History fixtures to the "conflicts and links" fixture group. Cover every fact, every `null` state, A13, and A15.
- [ ] t10: Run `npm test -w packages/cli` and `make-docs run work backlog snapshot --target-root . --json` from the built CLI on this repository. Record the results in `evidence.md`.

### Acceptance criteria

- A17: `npm test -w packages/cli` passes.
- A18: The snapshot of this repository reports the W28 R0 record as `supported`, with four linked phases. Existing records gain no new diagnostic except accurate fact values.

### Dependencies

- Stages 2 and 3 are complete.
