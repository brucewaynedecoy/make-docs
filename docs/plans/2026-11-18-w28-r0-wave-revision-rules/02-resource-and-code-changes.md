---
title: "W28 R0 Phase 2 Resource and Code Changes"
kind: "plan"
status: "draft"
coordinate: "W28 R0 P2"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md"
---

# Phase 2: Resource and Code Changes

## Purpose

Settle the exact change to each shipped resource, Skill, and CLI module, so the work backlog needs no new product decision.

## Order Rule

1. Edit each shipped resource in `packages/docs/template/` first.
2. Reseed only the affected template-owned files into `./.make-docs/` and `./docs/`. Reseeding is a reviewed operation, not a blind copy, as `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md` requires.
3. Do not hand-edit `packages/cli/template/`. The package preparation step regenerates it.
4. Edit project documents in place.

The resource catalog has no content hashes, and this work adds no new resources. The catalog therefore needs no change.

## System References (`packages/docs/template/.make-docs/system/references/`)

| File | Change |
| --- | --- |
| `wave-model.md` | Change four parts of the file. See the list below. |
| `planning-workflow.md` | Change two parts of the file. See the list below. |
| `execution-workflow.md` | Around line 161: authoritative PRD maintenance writes its work into the lineage Wave's backlog (an edit or a revision Phase). It creates a new backlog directory only for a new Wave or a revision Wave. |
| `prd-change-management.md` | Line 120: replace the "dated delta backlog rather than rewriting" rule with the same lineage-backlog rule. Line 121 applies to every affected backlog Phase. |
| `lifecycle.md` | Under `## Default Ordering`: when an approved plan or backlog must change, use the amendment rules in `wave-model.md` and record a Change History entry. |

Changes to `wave-model.md`:

- **Terms.**
  - Wave = a self-contained unit of work, which is the scope.
  - Revision = a revision Wave, which is a change order.
  - Add rows for revision Phase and Phase complete.
  - Remove "redesigned design" from the Revision example.
- **Line 7.** Remove the line that says the encoding "is extended to designs".
- **`## Resolution Rules`.** Replace it with `## Decision Procedure`. That section holds the five ordered steps, the significant deviation test, the revision Wave test, and the owner gates. Keep the existing scan, `w1-r0` default, and "no drift to newer Waves" rules as sub-steps.
- **New sections.** Add `## Change History`, which holds the format, duty, `Kind` values, and naming rationale. Add `## Rebuild From The PRD`. Add `## Adoption`.

Changes to `planning-workflow.md`:

- **Line 37.** Apply the decision procedure in place of "keep the lineage wave and increment its revision".
- **Lines 65, 92, and 109.** Replace "scoped delta backlog vs regenerated full backlog" with three choices:
  - in-place amendment of the lineage backlog;
  - rebuild from the PRD, which needs owner approval;
  - a new backlog for a new Wave or a revision Wave.

  Every plan records `new-wave` or `revision-wave`.

## Contracts (`.../system/contracts/`)

| File | Change |
| --- | --- |
| `output-contract.md` | Change four parts of the file. See the list below. |
| `design-contract.md` | Line 51: `Coordinate Handoff` names the classification that the decision procedure produced. It includes the evidence for a revision Wave test, or for the outcome test. The trigger list is removed. |

Changes to `output-contract.md`:

- **Line 37.** Change-oriented work uses the lineage W/R directory.
- **Line 220.** Keep the task-ID rule.
- **Line 261.** Replace the delta-directory rule.
- **Line 264.** Active-work updates also need a Change History entry after the first commit.

## Prompts (`.../system/prompts/`)

| File | Change |
| --- | --- |
| `designs-to-plan-change.prompt.md` | Line 16: resolve the coordinate with the `wave-model.md` decision procedure. Stop at an owner gate. Record whether the plan is an amendment of the lineage plan (with Change History) or a new plan. |
| `prd-change-to-work.prompt.md` | Replace "a dated delta backlog" with: amend the lineage backlog, with Change History, or create a backlog only for a new Wave or a revision Wave. |

## Templates (`.../system/templates/`)

| File | Change |
| --- | --- |
| `plan-overview.md`, `plan-prd.md`, `plan-prd-change.md`, `plan-prd-decompose.md` | `Classification: new-wave or revision-wave`. Add a note that the legacy value `revision` means `revision-wave`. The Evidence line names the outcome test or the revision Wave test that applied. Add an optional `## Change History` with the entry shape, marked "add after the first commit, when scope changes". `plan-prd-change.md` changes its "Delta backlog" output line to "Work backlog (lineage or new)". |
| `work-index.md` | Add the optional `## Change History` at the end, with the same shape. |
| `work-phase.md` | Under `## Purpose`, add an optional `Revises: [P{{N}}](0N-<phase>.md)` line for revision Phases. |

## Routers (`packages/docs/template/docs/`)

| File | Change |
| --- | --- |
| `plans/AGENTS.md` and `plans/CLAUDE.md` | Replace "Plans are written before execution, not retroactively" with "Plans are written before execution. After the first commit, amend them in place with `## Change History`, under `wave-model.md`." |
| `work/AGENTS.md` and `work/CLAUDE.md` | Add one line: edit the lineage backlog in place under `wave-model.md`, and record scope edits in `## Change History` after the first commit. |

## Skills (`packages/skills/`)

| File | Change |
| --- | --- |
| `decompose-codebase/assets/templates/decomposition-plan.md` | Line 16: `Classification: new-wave or revision-wave`. |
| `backlog-review/references/rule-map.md` | Add rows for `BACKLOG-RULE-017` and `BACKLOG-AGENT-018`. |
| `backlog-review/references/review-method.md` | A status reason for a reopened Wave names the revision Phase. A `BACKLOG-VAL-017` finding is an Attention item. |
| `preflight/SKILL.md` | One line: classify each requested change with the `wave-model.md` decision procedure, and stop at its owner gates. |

## CLI (`packages/cli/src/operations/work/backlog/`)

| File | Change |
| --- | --- |
| `schemas.ts` | Add `closeoutNotesPresent` and `committed` (`NullableSourcedBoolean`) to `WorkPhaseFactSchema`. Add `nextPhase` (`SourcedCount`) to `BacklogWorkRecordV1Schema`. Add a top-level `coordinates` object: `highestWave` (nullable count), plus `waves[]` with `wave`, `revisions[]`, and `nextRevision`. Keep the strict schemas. |
| `snapshot.ts` | Change five parts of the file. See the list below. |
| `catalog.ts` | Add `BACKLOG-RULE-017` (`fact`, `full`), with its parity mapping to `wave-model.md#change-history`. Add `BACKLOG-AGENT-018` (`agent-only`), with a one-sided reason. |
| `work/index.ts` (`resolveWorkItemIdentity`) | No change. The coordinate facts go into the snapshot, to keep the PRD 39 work-domain bound. |
| Tests in `packages/cli/tests/` | Cover each new fact, the `null` Git states, VAL-017 positive and negative fixtures (in the "conflicts and links" fixture group), the coordinate facts across live and archived records, and no new diagnostics on the existing fixture set. |

Changes to `snapshot.ts`:

- **Phase facts.** Fill the per-Phase facts from the `### Closeout Notes` section and the existing Git context. A file is `committed` when it is tracked and `git status --porcelain` shows no change for it.
- **Record closeout.** Fill `closeout.committed` for the record.
- **`nextPhase`.** Derive it from the linked and numbered Phase files.
- **Coordinates.** Derive `coordinates` from all discovered records, live and archived.
- **Change History check.** Parse `## Change History` in the index and emit `BACKLOG-VAL-017`.

**Preflight before the schema edit.** Search for any persisted artifact that is validated against `BacklogSnapshotV1Schema`, such as Store cache rows or saved reports. If there is none, keep `schemaVersion: 1`, because the change only adds keys. If there is one, stop and ask the owner about a version change.

## Project Documents (edited in place)

| File | Change |
| --- | --- |
| `docs/assets/user/concepts-wave-revision-phase-coordinates.md` | Rewrite the coordinate-choice sections (around lines 74–79 and 108–111) for the new procedure. Add a short "older records" note: before W28, Revisions were also used for fixes and add-ons. |
| Source design | Already updated to place the coordinate facts in the snapshot only. |

## Out of Scope

- Store-as-archive (recorded only as `Q-025`).
- The status vocabulary.
- W22 status drift.
- Any rewrite of existing records.
- `scripts/check-wave-numbering.sh`. Its duplicate-coordinate warning still fits the "same location on rebuild" rule.
