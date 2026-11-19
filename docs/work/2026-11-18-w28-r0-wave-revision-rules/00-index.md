---
title: "W28 R0 Wave, Revision, and Backlog Amendment Rules"
kind: "work"
status: "active"
coordinate: "W28 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and current PRDs 14, 51, and 04 into implementation work."
  coordinate_handoff: "Carry W28 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/14-lifecycle-workflow-and-coverage-passes.md"
---

# W28 R0 Wave, Revision, and Backlog Amendment Rules

## Purpose

This backlog ships three things in shipped resources, Skills, and the CLI:

- the coordinate selection and amendment rules in [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment);
- the snapshot facts and the Change History rule in [PRD 51](../../prd/51-backlog-review-and-reporting.md);
- the terms in [PRD 04](../../prd/04-glossary.md).

Shipped resources change in `packages/docs/template/` first. Each change is then reseeded, after review, into this repository's `.make-docs/` and `docs/`.

The [design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md) and the [plan](../../plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md) define the scope.

Out of scope:

- Store-as-archive. It is recorded only as [Q-025](../../prd/03-open-questions-and-risk-register.md#q-025-should-the-store-become-an-optional-durable-archive-for-non-active-documents).
- The status vocabulary.
- W22 status drift.
- Any rewrite of existing records.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| A coordinate tells the reader the kind of change: new `W`, change-order `R`, or `P` for continuation or revision. | [Design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md#human-experience-intent); [plan](../../plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md#human-experience-propagation) | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment) R-COORD-1 to R-COORD-10; [PRD 04](../../prd/04-glossary.md) | [P1](01-template-resources-and-dogfood.md); [P4](04-validation-review-and-closeout.md) | Agent walkthrough of five past cases against the shipped `wave-model.md` | All five cases give the outcome that the design expects | None |
| Before a gated action, the owner gets one self-contained question that names the choice, the reason, and the effect. | Same | PRD 14 R-COORD-11, R-COORD-12 | [P1](01-template-resources-and-dogfood.md); [P3](03-skills.md); [P4](04-validation-review-and-closeout.md) | Agent Human Experience Review of one sample gated question | The sample meets the User Action Requests rule | None |
| For each other coordinate choice, the agent's reply names the choice and the reason. | Same | PRD 14 R-COORD-12 | [P1](01-template-resources-and-dogfood.md); [P4](04-validation-review-and-closeout.md) | Agent Human Experience Review of one sample agent-alone reply | The sample names the choice and the reason | None |
| A reader of a committed plan or backlog sees each scope change, its reason, its PRD decision, and any approval in one `## Change History` section. | Same | PRD 14 R-COORD-13 to R-COORD-15; [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-RULES-11 | [P1](01-template-resources-and-dogfood.md); [P2](02-cli-snapshot-facts-and-rule.md); [P4](04-validation-review-and-closeout.md) | Automated Implementation Testing of `BACKLOG-VAL-017`; template review | Valid and invalid fixtures give the expected diagnostics | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [P1 Template Resources and Dogfood](01-template-resources-and-dogfood.md) | Change the shipped references, contracts, prompts, templates, and routers. Reseed them into dogfood. Rewrite the user concept guide. |
| [P2 CLI Snapshot Facts and Rule](02-cli-snapshot-facts-and-rule.md) | Add the committed, closeout-notes, and coordinate facts and the Change History rule to `work.backlog.snapshot`. |
| [P3 Skills](03-skills.md) | Align `decompose-codebase`, `backlog-review`, and `preflight` with the rules and the new catalog entries. |
| [P4 Validation, Review, and Closeout](04-validation-review-and-closeout.md) | Walk through past cases, run the Human Experience Review, run the package checks, run the coverage pass, and write history. |
| [P5 Coordinate Facts Corrections](05-coordinate-facts-corrections.md) | Revision Phase for P2: count plan directories in coordinate facts, add per-Wave `archived`, and name `wave-model.md` in catalog parity. Runs before P4. |

## Usage Notes

- Read the phases in order. P3 depends on the P2 rule IDs. P5 revises P2. P4 depends on P1 to P3 and P5, so it runs last.
- Every phase file includes `## Source PRD Docs`.
- Each phase adds `### Closeout Notes` at closeout. Do not add a placeholder earlier. A placeholder would make the `closeoutNotesPresent` fact misleading.
- Each Human Experience promise above is traceable through its phase, evidence decision, and implementation gate.
- The central [evidence report](evidence.md) holds the retained acceptance evidence for each phase. Follow the Acceptance-Case Evidence Retention section in [the coverage-pass contract](../../../.make-docs/system/contracts/coverage-pass-contract.md).
- No deferred obligation is in scope. Unassisted Goal Testing is `not-needed-now` in every phase, because no current decision needs it.
- This backlog is a draft until its first commit. After that, scope edits need a `## Change History` entry, as PRD 14 R-COORD-13 requires.
- Do not commit, push, or open a PR without Tyler's go-ahead.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: After Tyler's go-ahead, start with P1 and continue phase by phase.
- Why: The backlog turns the approved plan and current PRDs 14, 51, and 04 into implementation work.
- Coordinate Handoff: Carry `W28 R0` into phase history records and commits, adding the active P number.

## Change History

### 2026-11-18 — W28 R0

- Kind: `edit`
- Affected scope: P2 t11, t12, and A31; P3 t2.
- Previous scope: P2 changed the snapshot schema, snapshot code, catalog, and tests only. P3 t2 added the `rule-map.md` rows for `BACKLOG-RULE-017` and `BACKLOG-RULE-018`.
- Replacement scope: P2 t11 regenerates the two generated backlog-review Skill bundles and the MCP App widget asset from the changed schema. P2 t12 adds the `rule-map.md` rows, moved from P3 t2. P3 t2 points to P2 t12. New acceptance A31 covers the regenerated files.
- Rationale: The generated bundles embed the strict snapshot schema, and the Skill test checks that `rule-map.md` lists every catalog rule. P2's tests cannot pass without these files. The change stays inside the plan's stated scope.
- PRD decision: `none` — No product requirement changes; PRD 51 already requires the facts and the rule.
- Owner approval: Not required. This is an edit to unfinished work that fits the plan.
- Source: [P2 CLI Snapshot Facts and Rule](02-cli-snapshot-facts-and-rule.md)

### 2026-11-18 — W28 R0 P5

- Kind: `revision-phase`
- Affected scope: New P5 t1–t4 and A32–A35, revising completed P2; P4 dependencies.
- Previous scope: P2 coordinate facts counted work directories only, reported archived state per record only, and its catalog parity text did not name `wave-model.md`.
- Replacement scope: P5 counts the union of work and plan W/R directories, adds a per-Wave `archived` fact, and names `wave-model.md` in both catalog parity mappings. P4 now also depends on P5.
- Rationale: Owner review of committed P2 found that plan-only revisions such as W18 R15 were missing from the revision facts, which is the collision these facts exist to prevent. No revision Wave test passes.
- PRD decision: `update-existing` — PRD 51 R-BACKLOG-SNAPSHOT-29 now names plan directories and per-Wave archived state.
- Owner approval: Not required. This is a clear revision Phase that the agent may add alone; the owner requested the fixes in P2 review.
- Source: [P5 Coordinate Facts Corrections](05-coordinate-facts-corrections.md)
