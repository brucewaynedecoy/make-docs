---
title: "Phase 5: Agent Twin and Config"
kind: "work"
status: "completed"
coordinate: "W29 R0 P5"
source:
  type: "prd"
  path: "docs/prd/52-work-store-and-work-queue.md"
---

# Phase 5: Agent Twin and Config

## Purpose

Give agents without the CLI the same work rules, and give projects one portable place for work settings.

## Overview

The upstream template gains `make-docs://system/reference/work-store.md`. The config validator accepts a `work` block. The tracker connection contract is written down in the same resource.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. A project without the CLI keeps `docs/work/` as the authority and uses the same rules ([PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-STORE-6, R-WORK-QUEUE-11, R-WORK-TRACKER-1 to R-WORK-TRACKER-3).
- Intended human outcome: an agent with no CLI gives the same readiness answer as the CLI.
- Human-facing surface or indirect effect: the `work-store` reference and the `work` config block.
- Implementation work: upstream resource, config schema, package and dogfood projection.
- Evidence source or testing type selected under current authority: twin parity on the P1 fixtures and byte parity across template, package, and dogfood.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Config validation, resource byte parity, and twin parity. |
| Performance Testing | not-needed-now | No performance candidate in this phase. |
| Guided Progress Review | not-needed-now | The resource follows the accepted catalog. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Resource and config

### Tasks

- [x] T1: Author `work-store.md` in `packages/docs/template/`. Cover readiness, claims, report, close, sync, conflicts, and the tracker connection contract for an agent that edits files directly.
- [x] T2: State in the resource that it is the agent twin of the P4 operations, and that a change to either form needs a review of the other.
- [x] T3: Add the `work` block to the config schema: `projection` (default `on`) and `tracker` (connection name and field map).
- [x] T4: Reject state fields, IDs, digests, receipts, and secrets in the `work` block.
- [x] T5: Project the resource into the package, then into this repo's dogfood copy.
- [x] T6: Point routers that name work backlog rules at the new resource where an agent needs it.
- [x] T7: State in the resource that quick items live only in the work store, how `make-docs://project/<project>/tasks/` and `.../backlog/` URIs name a project and its work, and that a checkout without the CLI or a Store reads `docs/work/` directly and has no quick items.
- [x] T8: Validate `projectName` in config (PRD 24 R-CONFIG-STATE-9), and have setup propose the checkout folder name in the PRD 38 R-ID-8 form.
- [x] T9: Add the sync rules that W29 R0 P3 added to PRD 52 (R-WORK-SYNC-14 to R-WORK-SYNC-16, and the first-sync, copies-off, and phase-title edits) to the rule catalog and to the `sync` and `first-import` sections of the agent form, with parity fixtures.
- [x] T10: Give older backlogs explicit status lines, so the all-tasks-checked fallback of PRD 52 R-WORK-QUEUE-20 is needed less over time: for example a `make-docs project doctor` finding for a phase file with no status line, with a reviewed fix that adds the status line that its tasks show. Owner decision of 2026-11-23 on W29 R0 P4 review finding 7; not built in P4.

### Acceptance criteria

- A22: Template, provider inventory, and dogfood bytes match.
- A23: The agent twin and the CLI give the same answer on every P1 parity fixture.
- A24: Config validation accepts the `work` block and rejects state fields in it.

### Dependencies

- P1. Final text after P4 behavior is stable.

### Closeout Notes

- Built (2026-11-23): T1 to T10. Evidence: [P5 section](evidence.md#p5-agent-twin-and-config).
- T1, T2, T7: `make-docs://system/reference/work-store.md` is the agent twin of the nine work operations. It has one section for each catalog area, names each rule by its catalog ID, and covers authority, the repo copy, sync with its table and settle choices (also `claimed`), the hold list, first import and dependency bullets, units, readiness with every wait reason, claims with private claim IDs, report and close with the progress note, the tracker connection contract, quick items, project URIs, and a checkout without the CLI or a Store.
- T9: catalog rules `WORK-RULE-041` to `WORK-RULE-054`, with parity fixtures `WSF-058` to `WSF-069`. Ten sync scenarios run through the real sync; one dependency fixture and one report fixture run through the P3 and P4 code.
- T3, T4: the `work` block was admitted in P4. P5 names each state or secret key (`work-block-state-field`) and refuses a field map value that looks like a key.
- T5: template, bundled package copy, and dogfood copy have the same bytes; both catalogs list the resource in the `workflow` and `backlog` profiles.
- T6: the `docs/work/` router and the references router name the new resource.
- T8: `projectName` validation existed since W32 R0 P3. Setup now shows the name, or proposes one from the checkout folder name, in its plan and in `project.nameProposal`. It does not write it. New behavior: a linked git worktree proposes its main checkout's folder name.
- T10: `make-docs project doctor` has the check `phase-status-line`. It skips held paths (`work.syncHold`) for that check, and `--exclude` leaves a path out of every check. On this repository (`--exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`, temporary `MAKE_DOCS_HOME`) it finds 79 phase files, the same 79 that `work next` counts as done by the fallback. The fix was not run on this repository: a repository-wide fix needs the owner's approval.
- Review fixes (2026-11-23): an independent review asked for seven small changes: mixed line endings in the doctor fix, camelCase field names, the fix sentence, whole-word key matching, the `--work-store` sentence, three note fixtures (`WSF-070` to `WSF-072`), and generic test names. All are fixed with tests. Evidence: [P5 review fixes](evidence.md#review-fixes).
- Owner decision (2026-11-23): setup proposes `projectName` and never writes it, as built.
- Four testing decisions: Automated Implementation Testing ran (see evidence). Performance Testing: `not-needed-now`. Guided Progress Review: `not-needed-now`. Unassisted Goal Testing: `not-needed-now`.
- Performance evidence: none in this phase.
- Human Experience Review: the resource puts the human meaning first, with short sentences and one next action for each wait reason. The doctor and config refusals name the key or file and say what to do.
- Optional experience handoff: none.
- Explicit human acceptance gate: on 2026-11-23 the owner chose that setup only proposes `projectName`, and approved the repository-wide `phase-status-line` fix with W22 R2 excluded, as its own commit.
- Evidence report: [P5 section](evidence.md#p5-agent-twin-and-config).
- Phase / capability status: active; every task built; pending owner review.
