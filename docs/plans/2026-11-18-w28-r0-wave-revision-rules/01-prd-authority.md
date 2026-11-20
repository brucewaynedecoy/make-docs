---
title: "W28 R0 Phase 1 PRD Authority"
kind: "plan"
status: "draft"
coordinate: "W28 R0 P1"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md"
---

# Phase 1: PRD Authority

## Purpose

Make the current product requirements state the coordinate, amendment, and Change History rules, and the new backlog snapshot facts.

## Scope

### PRD 14 Lifecycle Workflow and Coverage Passes

Add `### Coordinate Selection and Amendment` under `## Requirements`. Add one Component and Capability Map line that points to it. State these as current requirements:

- **Terms.** Wave as the scope. Plan as the statement of work. PRD as the authority. Phase complete means done, closed out, and committed (or deployed). Revision Phase. Revision Wave. `R0` as the base revision.
- **Decision procedure.** The five ordered steps from the source design:
  1. explicit guidance;
  2. the outcome test, which is decided by outcome and not by code area;
  3. lineage Wave handling for incomplete Phases versus complete Phases;
  4. archived lineage Waves;
  5. no drift to newer Waves.
- **Significant deviation test.** The three triggers, and the changes that are not significant.
- **Revision Wave test.** The three triggers. Deployment alone does not qualify.
- **Owner gates.** The seven-row gate table. The agent states the choice and the reason for each choice it makes alone.
- **Change History.**
  - Location and duty: the section is required after the first commit. Scope edits need an entry. Progress updates never do.
  - The eight fields and the five `Kind` values.
  - The `Revises:` line in a revision Phase.
  - A Wave reopened by a revision Phase returns to `active`.
  - A revision Wave has two cross-links: the new plan names the revised Phases, and the old backlog gets a `revision-wave` entry.
- **Rebuild from the PRD.** Same W/R and same location. Completed Phases are kept unchanged. A `rebuild` entry is required. The owner gate applies.
- **PRD rule.**
  - The PRD decision is separate from the W/R/P decision.
  - Update the PRD first when requirements change.
  - A `none` reason goes in Change History.
  - No separate delta backlog. A new backlog only for a new Wave or a revision Wave.
- **Plan amendment.** A plan can be amended in place, with Change History, after an owner-approved pivot or after a revision Phase that changes plan-level scope.
- **Storage neutrality.** Rules name outcomes such as "restore to the working set" and "history keeps the prior version", not storage mechanics.
- **Adoption.** The rules apply forward only. No existing record is renumbered or rewritten.

Write the rules as product requirements, not as editorial history. Add the W28 R0 `## Requirement History` entry listed in the overview.

### PRD 51 Backlog Review and Reporting

- **`### Backlog snapshot operation`.** Add requirements for four facts:
  - **Per-Phase `closeoutNotesPresent`.** True when the Phase file's `### Closeout Notes` section has content with no unresolved `{{` placeholder. False when the section is absent or empty.
  - **Per-Phase `committed`.** True when the Phase file is tracked and has no uncommitted change. False when it is untracked or changed. `null` when Git evidence is unavailable, denied, or not a repository.
  - **Record-level `closeout.committed`.** Uses the same rule over the index and all linked Phase files.
  - **Project-level coordinate facts.** The highest Wave number, each Wave's existing revisions and next free revision, and each record's next free Phase number.

  Each signal stays separate. The operation never derives "complete" (R-BACKLOG-SNAPSHOT-6 and R-BACKLOG-SNAPSHOT-7 stay in force).
- **`### Internal collectors and rule catalog`.**
  - Add `BACKLOG-RULE-017`, with diagnostic `BACKLOG-VAL-017`, severity `warning`. It checks the `## Change History` shape in a supported work index:
    - each heading uses `YYYY-MM-DD — <coordinate>`, where the coordinate's W/R matches the record;
    - each entry has all eight fields;
    - `Kind` and `PRD decision` use their allowed values;
    - entries are in ascending date order.
  - An absent section raises no diagnostic.
  - Plan Change History is agent-only, because the snapshot does not read plans. Give that as the one-sided reason.
  - Add agent-only entry `BACKLOG-AGENT-018` for the coordinate decision procedure. Its instruction location is `wave-model.md`. Its one-sided reason: the outcome, deviation, and revision Wave tests need judgment.
- **`### Snapshot result`.** Describe the new keys and their `null` meanings. `schemaVersion` stays `1` only when the Phase 2 preflight confirms that no persisted consumer validates older snapshot JSON against the strict schema. If such a consumer exists, stop and route a schema-version decision to the owner before writing code.
- Add the W28 R0 `## Requirement History` entry.

### PRD 04 Glossary

Add six terms to `## Terms`: Wave, Revision Wave, Revision Phase, Phase complete, Change History, and Lineage Wave. Each term gets a one-line meaning and a link to PRD 14. If an existing term conflicts, update it in place.

### PRD 03 Open Questions and Risk Register

- Add `Q-025`: should the Make Docs Store become an optional durable archive for non-active documents, or a full redundant store, while the default install stays in the project folder?
  - Status: `Open`
  - Decision: none yet
  - Follow-Up: a future design
  - Recommendation: write a dedicated design. This Q item records the topic only.
- Add a non-closing pointer in `R-025` to W28 R0 as related coordinate-rule work. Do not change R-025's status.

### PRD 00 Index

Update only if PRD 14 or PRD 51 focus text no longer describes the current scope.

## Human Experience Trace

- Each PRD 14 rule that produces an owner question must state what the question names: the choice, the reason, and the effect. Link it to the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) User Action Requests rule. Do not copy that rule.
- Link outcomes to the [source design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md#human-experience-intent).

## Gate

Run `make-docs run prd authority validate --target-root .`. Resolve every diagnostic before Phase 2 and Phase 3 use the updated PRDs as authority.
