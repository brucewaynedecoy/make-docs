---
title: "Phase 7: Schema Version and Completion Rules"
kind: "work"
status: "completed"
coordinate: "W28 R0 P7"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 7: Schema Version and Completion Rules

## Purpose

Apply the owner's 2026-11-19 decisions on the PR #64 review questions:
- the snapshot schema moves to version 2;
- a phase is complete only when it is committed;
- one glossary definition of Phase complete;
- the agent judges prior completion;
- the package moves to 2.0.9 with a reviewed candidate digest.

Revises: [P2](02-cli-snapshot-facts-and-rule.md)

## Overview

This is a revision Phase. P2 chose to add the new snapshot facts to schema version 1, unless a persisted artifact could not accept them (R-BACKLOG-SNAPSHOT-30). Installed backlog-review Skill copies validate snapshot JSON with a bundled strict schema, so they are such artifacts. The version change applies P2's own rule rather than reversing it. No revision Wave test passes. The owner approved each decision.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. A reader whose CLI and Skill versions differ gets a clear "upgrade the CLI" message instead of a schema error. Phase completion has one meaning.
- **Intended human outcome:** a backlog review that receives a version 1 snapshot tells the person to upgrade the make-docs CLI to 2.0.9 or later. The glossary, PRD 14, the Wave Model, and the design all say that a commit is required.
- **Human-facing surface:** backlog-review Skill errors, the snapshot output, PRD 04, PRD 14, PRD 51, and `wave-model.md`.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing and document review.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Schema-version tests in the CLI and in the dependency-free Skill bundle, the focused backlog tests, `npm test`, `validate:defaults`, the build, `smoke:pack:local`, and two candidate packs. |
| Performance Testing | not-needed-now | No performance decision depends on a version literal. |
| Guided Progress Review | not-needed-now | The owner already decided each question. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md) (R-BACKLOG-SNAPSHOT-10, R-BACKLOG-SNAPSHOT-30)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md) (R-COORD-2, R-COORD-21)
- [04 Glossary](../../prd/04-glossary.md)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- PR #64 review questions 1, 2, 3, 5, and 6, decided by the owner on 2026-11-19

## Stage 1 - Owner Decisions

### Tasks

- [x] t1: Move the snapshot schema to version 2. A version 1 snapshot is refused with "upgrade the make-docs CLI to 2.0.9 or later". Update the cache-key literals, the fixtures, and the PRD 51 and Skill report-model text. Regenerate the Skill bundles and the MCP App widget.
- [x] t2: Add schema-version tests for the CLI schema, the CLI agent gate, and the dependency-free Skill bundle.
- [x] t3: Require a commit for Phase complete in PRD 14 R-COORD-2, `wave-model.md`, the design, and the glossary, with deployment as extra evidence only. Merge the two glossary rows into one row that requires both conditions.
- [x] t4: State in PRD 14 R-COORD-21 and `wave-model.md` that `committed` describes the current working tree, and that the agent decides prior completion from history.
- [x] t5: Bump `@brucewaynedecoy/make-docs` to 2.0.9. Last, pack the candidate twice and save its matching SHA-256 in `.github/release-candidates/v2.0.9.sha256`, following RELEASING.md step 2. Leave `v2.0.8.sha256` unchanged.

### Acceptance criteria

- A42: The snapshot reports `schemaVersion: 2`. The CLI schema, the CLI agent gate, and the Skill bundle refuse a version 1 snapshot with the upgrade message, and name any other version as unsupported.
- A43: PRD 04 has one Phase complete row that requires both the PRD 45 and the PRD 14 conditions, and a Requirement History entry records the merge. No live rule says "committed or deployed".
- A44: Two packs of the 2.0.9 candidate have the same SHA-256, and `.github/release-candidates/v2.0.9.sha256` holds it as one lowercase hex line.

### Dependencies

- P1 to P6 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p7-schema-version-and-completion-rules). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: the version 1 refusal names the fix (upgrade the CLI) instead of a schema path. The completion rules now give one meaning in every owner.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P7 Schema Version and Completion Rules](evidence.md#p7-schema-version-and-completion-rules).
- Phase / capability status: Phase complete on commit. The installed backlog-review copy trails the source again until a further reviewed Skill sync, which needs owner approval for a Store write.
