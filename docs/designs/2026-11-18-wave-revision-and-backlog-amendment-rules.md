---
title: "Wave, Revision, and Backlog Amendment Rules"
kind: "design"
status: "draft"
coordinate: "W28 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The active PRD set and shipped system resources already own coordinate, plan, and backlog rules. This design changes them in place."
  coordinate_handoff: "New wave W28 R0. The work adds outcomes that no earlier plan promised: in-place amendment with an audit trail, revision Phases, owner gates, and CLI coordinate facts."
---

# Wave, Revision, and Backlog Amendment Rules

## Purpose

Define when an agent creates a new Wave, creates a Revision, or edits an existing plan and work backlog. Define the audit trail for in-place edits and the owner gates for serious changes.

This design replaces the current "revise, rework, correct, standardize, or finish → next Revision" rule.

## Context

[wave-model.md](../../.make-docs/system/references/wave-model.md) is the single authority for W/R/P coordinates. Its lineage rule sends any work that "revises, reworks, corrects, standardizes, or finishes something already delivered in a known wave" to the next unused `R`. The same trigger list is repeated in the design contract, the change-plan prompt, the planning workflow, and the user concept guide.

Other rules push in the same direction:

- Plan templates offer only `Classification: new-wave` or `revision`. There is no outcome for "amend the existing W/R".
- `output-contract.md`, `prd-change-management.md`, and `execution-workflow.md` prefer "a dated delta backlog rather than rewriting an earlier backlog".
- `docs/plans/AGENTS.md` says plans "are written before execution, not retroactively". No rule covers amending a plan.

The CLI makes no Wave or Revision decision. `backlog_snapshot` and `work_item_resolve` parse existing coordinates only. The snapshot already has `committed` and `closeoutAccepted` closeout slots, but it always returns `null` for them.

The result in this repository: W18 has revisions R1 to R16, and W19 has R1 to R8. Many of these Revisions are defect fixes or add-ons, not change orders. Examples are W26 R1, W18 R16, and W19 R7. Practice is also inconsistent: W22 R2 P4 handled a post-release fix as a new Phase, but W22 R1 handled a similar fix as a new Revision.

The product owner set these principles in a design session on 2026-11-18:

1. The PRD is the product authority, not the backlog. A backlog can be updated, or deleted and rebuilt from the PRD.
2. A Wave is a self-contained unit of work. It can be a full build, one domain slice, or one change request.
3. When work is unstarted or incomplete, prefer to edit the Wave's Phases.
4. A Revision is serious, like a change order.
5. The Wave is the scope of work. The plan is the statement of work.

## Human Experience Intent

Impact: `direct`

Affected humans: `maintainer` Persona — project owners who direct Make Docs work, and maintainers who read plans, backlogs, coordinates, and commit history.

Human goal or effect: Read a coordinate and know how serious the change is. See every scope change to committed work, with its reason. Get asked before a serious change, and not for routine upkeep.

Experience promises:

- A coordinate tells the reader the kind of change:
  - a new `W` means new work;
  - a new `R` means substantial completed work is being revisited, like a change order;
  - a new `P` in an existing W/R means the work continues or a completed Phase is revised.
- Before an agent makes a revision Wave, a new Wave that could fit an existing Wave, a significant plan change, a backlog rebuild, or an archive restore, the owner gets one self-contained question. The question names the choice, the reason, and the effect.
- For each other coordinate choice, the agent's reply names the choice and the reason.
- A reader of a committed plan or backlog can see each scope change, its reason, its PRD decision, and any owner approval in one `## Change History` section, without reading git history.

Complexity kept out of the human path:

- The owner does not compute the next W, R, or P.
- The owner does not write Change History entries.
- The owner does not need to know where an archived Wave is stored.

Evidence required:

- A walkthrough of the decision procedure against W22 R2 P4, W17 R3, W26 R1, W18 R16, and W19 R7. Each case must give the expected outcome in `## Decision`.
- A review of the changed template resources and their dogfood copies.
- CLI tests for the new coordinate facts and the Change History shape rule.
- A review of one sample gated owner question and one sample agent-alone reply against the User Action Requests rule in the Human Experience Contract.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| Extra git lookup for the per-Phase `committed` fact in `backlog_snapshot` | `none` | `not-needed` | The snapshot completes and its facts are correct | No speed target changes the choice to report this fact. The snapshot already reads git evidence for each record. | None. Reassess only if snapshot runtime fails on a real project. |

## Decision

### Terms

| Term | Meaning |
| --- | --- |
| Wave (`W`) | A self-contained unit of work. The Wave is the scope. It can be a full build, one domain slice, or one change request. |
| Plan | The statement of work for one W/R. |
| PRD | The product authority. A backlog never overrides it and can be rebuilt from it. |
| Phase complete | The Phase work is done, closed out, and committed. Deployment is extra evidence only. Work that is deployed or done but not committed is not complete. |
| Revision Phase | A new Phase at the next `P` in the same W/R that changes a completed Phase. It gets no special coordinate. |
| Revision Wave (`R+1`) | A change order. A substantial part of completed work must be revisited or rearchitected, so the fix is effectively its own Wave. It gets a new plan and backlog at the next `R`. |

`R0` stays the base revision of a Wave.

### Decision procedure

The agent applies these steps in order. A stated coordinate or the outcome test can decide the coordinate, but the significant deviation test and the owner gates still apply before any plan or backlog changes.

1. **Explicit guidance.** If the user names the coordinate, use it.
2. **Outcome test.** Does the request add an outcome that no Wave's plan promised? This can be a new capability or an enhancement. The test uses the outcome, not the code area.
   - If yes, it is new work. Create a **new Wave** at the highest `W` + 1, `R0`, or `W1 R0` when no plan or work exists. Small Waves are allowed. A PRD `create` decision is strong evidence for a new Wave, but it does not decide the result alone.
   - If an unfinished Wave could also absorb the outcome, ask the owner whether to extend that Wave or start a new one.
3. **Lineage Wave.** If the request does not pass the outcome test, it changes an outcome that an existing Wave promised. That Wave is the lineage Wave.
   - **Archived lineage first:** if it is archived, ask the owner, then restore its plan and backlog to the working set under the same name before any other decision.
   - **Not complete** (unstarted, in progress, or done but not committed):
     - If the change does not significantly deviate from the plan, edit the backlog in place.
     - If it does significantly deviate, ask the owner. The owner chooses one of two:
       - **Pivot**: amend the same plan and backlog in place, at the same W/R.
       - **Finish first**: complete the Wave, then make a revision Wave.
   - **Complete:** add a **revision Phase**, unless the revision Wave test passes.
4. **No drift to newer Waves.** Do not assign a new Wave only because newer, unrelated Waves exist. This existing rule stays.

### Significant deviation test

A change significantly deviates from the plan when it does one of these:

- changes the plan's goal, scope, or non-goals;
- replaces the approach or architecture the plan chose;
- adds a product capability the plan did not name.

These changes are not significant:

- adding, splitting, or reordering Phases or tasks inside the stated scope;
- fixing defects;
- adjusting tests or evidence.

### Revision Wave test

A change to completed work is a revision Wave when at least one of these is true:

1. It reverses an approach or architecture choice in the plan, so the plan must be rewritten, not extended.
2. It must redo the results of two or more completed Phases.
3. The fix needs its own design, or a plan with several Phases.

Deployment alone does not make a change a revision Wave. Otherwise, the change is a revision Phase.

### Owner gates

| Action | Agent decides alone | Ask the owner first |
| --- | --- | --- |
| Edit unfinished work that fits the plan | Yes | No |
| Add a revision Phase | Yes. State the choice and the reason. | When a revision Wave test result is borderline |
| Make a significant plan change on an unfinished Wave | No | Yes |
| Create a revision Wave | No | Yes |
| Create a new Wave when an existing Wave could absorb the work | No | Yes |
| Rebuild a backlog from the PRD | No | Yes |
| Restore an archived Wave | No | Yes |

The lifecycle straddle rule still applies: never depart silently.

### Change History

A plan or backlog that has been committed at least once records each later scope change in a `## Change History` section:

- In a work backlog, the section goes at the end of `00-index.md`.
- In a plan, the section goes at the end of `00-overview.md`, when the plan changes.

The section mirrors the PRD `## Requirement History` contract in [prd-change-management.md](../../.make-docs/system/references/prd-change-management.md):

- Each coherent change gets one dated `###` entry, with the newest entry last.
- The heading uses the same `{{DATE}} — {{COORDINATE}}` shape.
- The entry uses the same field names where the meaning is the same.

```md
## Change History

### {{DATE}} — {{COORDINATE}}

- Kind: `edit` | `revision-phase` | `pivot` | `rebuild` | `revision-wave`
- Affected scope: {{PHASES_OR_TASKS}}
- Previous scope: {{PREVIOUS_SCOPE}}
- Replacement scope: {{REPLACEMENT_SCOPE}}
- Rationale: {{RATIONALE}}
- PRD decision: `update-existing` | `create` | `link-only` | `none` — {{REASON_WHEN_NONE}}
- Owner approval: {{APPROVAL_SOURCE_OR_NOT_REQUIRED}}
- Source: [{{SOURCE_LABEL}}]({{RELATIVE_SOURCE_PATH}})
```

Rules:

- `Coordinate` is the most specific coordinate that the change affects. For example, use `W28 R0 P3`, or use `W28 R0` when the change affects more than one Phase.
- Scope edits need an entry. A scope edit adds, removes, or rewrites tasks, acceptance criteria, or Phases.
- Progress updates never need an entry. Progress updates are checked tasks, status changes, closeout notes, and evidence links.
- Before the first commit, the plan or backlog is a draft. A draft needs no entries.
- A revision Phase file names the Phase it revises in a `Revises:` line under its purpose.
- When a revision Phase reopens a completed Wave, the index status returns to `active`.
- A revision Wave adds two records:
  - The new plan's `## Coordinate Decision` names the completed Phases that it revises.
  - The old backlog's Change History gets a `revision-wave` entry that links to the new W/R.

**Naming.** The section is named `## Change History`. The product owner chose this name on 2026-11-18. It keeps the PRD pattern of a subject followed by "History", and its entry shape mirrors `## Requirement History`. The section lives only in plans and work backlogs, never in product PRDs.

The duty is stricter than Requirement History. Requirement History records only material replacements. Change History records every scope edit after the first commit, because the backlog is the record of what the Wave promised to do.

### Rebuild from the PRD

A backlog can be rebuilt from the current PRD. These rules apply:

- Keep the same W/R and the same record location. Do not create a duplicate record.
- Keep completed Phases unchanged. This includes their tasks, checkboxes, and closeout notes.
- Rebuild only the unfinished Phases.
- Add a Change History entry of kind `rebuild`.
- Ask the owner first.

The prior version stays in history. Today that history is git. A future Store-backed archive could also keep it.

### PRD rule

- The PRD decision (`update-existing`, `create`, `link-only`, or `none`) is separate from the W/R/P decision.
- The default order stays the same: design, plan, PRD, work. When a change alters product requirements, update the owning PRD first, then the plan or backlog.
- PRD edits are always in place and surgical. The coordinate of the change appears only in `## Requirement History` and source links.
- A `none` decision gives its reason in the Change History entry.
- PRD maintenance no longer requires a separate delta backlog. Its work goes into the lineage Wave's backlog, as an in-place edit or a revision Phase. A new backlog is created only for a new Wave or a revision Wave.

### Plan amendment

A plan can be amended after execution starts in two cases:

- the owner approves a pivot;
- a revision Phase changes plan-level scope.

The plan keeps its W/R and records the amendment in its own Change History.

This replaces "plans are written before execution, not retroactively" with "plans are written before execution and amended in place with Change History".

### CLI twin

The decision stays agent-only. The outcome test, the deviation test, and the revision Wave test need judgment. The CLI reports facts:

- **Per Phase:** whether all tasks are checked, whether closeout notes are present, and whether the Phase was committed.
  - The `committed` fact comes from git when git is available. Otherwise it is `null`.
  - The `committed` fact describes the current working tree only. A completed Phase with a new uncommitted edit, such as an evidence link, reports `false`. The agent decides from history whether the Phase was completed earlier, and does not treat that Phase as unfinished.
  - The snapshot fills its existing `committed` closeout slot.
- **Per Wave:** whether the Wave is archived.
- **Per project:** the next free `P` for a W/R, the next free `R` for a Wave, and the highest `W`.

The CLI reports each signal separately and never combines them into "complete". This keeps the snapshot rule that one signal cannot prove another.

A new backlog rule checks the `## Change History` shape. Its parity mapping points to `wave-model.md`. The decision rule is listed as `agent-only`, with a one-sided reason.

### Storage neutrality

The rules describe outcomes, not storage mechanics. Examples:

- "restore to the working set", not "move the folder";
- "history keeps the prior version", not "git keeps it".

A future design may make the Make Docs Store the durable archive for non-active documents, or an optional redundant copy of all documents. The default install remains fully inside the project folder. That Store design is out of scope here.

### Adoption

- The rules apply from adoption forward.
- Existing records keep their coordinates.
- No record is renumbered or rewritten to match the new rules.
- Status drift in existing records (for example W22 R1 and R2) is a separate cleanup.

### Expected outcomes for past cases

| Case | What happened | Outcome under these rules |
| --- | --- | --- |
| W22 R2 P4 | A post-release fix to committed R2 work | Revision Phase. This matches what happened. |
| W17 R3 | Reversed the R2 harness exposure architecture and migrated R2 output | Revision Wave. Test 1 passes. |
| W26 R1 | The owner selected W26 R1 for an MCP name projection that W26 R0 left outside its scope | W26 R1 by explicit owner guidance (step 1). Without that guidance it is new work; because R0 was unfinished, the owner chooses between extending R0 and a new Wave. |
| W18 R16 | A defect fix to the W18 R11 validator, with its own design and a three-phase plan | Revision Wave by test 3, borderline because it is a defect fix, so it needs an owner gate |
| W19 R7 | A correction of completed W19 R3, R5, and R6 outcomes, with its own design, replaced by R8 before any R7 commit | Revision Wave by tests 2 and 3, behind an owner gate. R8's replacement of unfinished R7 is a significant deviation, so the owner chooses between pivoting R7 in place and finishing it first. |

The W26 R1, W18 R16, and W19 R7 rows were corrected on 2026-11-18 after the W28 R0 P4 walkthrough checked each case against its own plan. The owner kept the rules and approved the corrected rows. See the [P4 evidence](../work/2026-11-18-w28-r0-wave-revision-rules/evidence.md#expected-outcome-walkthrough-a21).

### Resources to change

The shipped template is the authority. Each resource is changed in `packages/docs/template/` first, then dogfooded into this repository.

- `wave-model.md`: rewrite Terms and Resolution Rules. Remove the "redesigned design" Revision example and the line that says the encoding "is extended to designs". Both conflict with the design exemption.
- `planning-workflow.md`, `execution-workflow.md`, `prd-change-management.md`, `output-contract.md`, and `design-contract.md`: replace the old trigger list and the delta-backlog rule.
- `lifecycle.md`: add one pointer for amending or revisiting work.
- `designs-to-plan-change.prompt.md` and `prd-change-to-work.prompt.md`: apply the new procedure.
- Plan templates: change Classification to `new-wave` or `revision-wave`, and accept `revision` as a legacy alias. Add an optional `## Change History`.
- `work-index.md`: add `## Change History`. `work-phase.md`: add the `Revises:` line.
- The `docs/plans/AGENTS.md` and `docs/work/AGENTS.md` routers.
- Skills: `decompose-codebase` plan template, `backlog-review` rule map, and `preflight`.
- CLI: `backlog_snapshot`, the backlog rule catalog, and their tests. `work_item_resolve` is unchanged; the snapshot already scans every live and archived record, and this keeps the PRD 39 work-domain bound.
- Project documents, edited in place: `docs/assets/user/concepts-wave-revision-phase-coordinates.md` and the owning PRDs.

## Alternatives Considered

- **Keep the current lineage rule.** Rejected. It turns every fix into a Revision. That has inflated `R` counts (W18 has 16 Revisions) and hides which changes are serious.
- **Any rework of completed work is a Revision.** Rejected. A Revision should signal a change order. A routine post-release fix should not carry that weight.
- **Owner judgment for every revision Phase versus revision Wave decision.** Rejected. Fixed tests let small changes move without a question, and the owner still decides borderline cases.
- **Ask the owner before every coordinate choice.** Rejected. It adds questions for routine upkeep that the plan already authorizes.
- **Pivot equals a new revision Wave.** Rejected. An unfinished Wave has no completed work to revise, so an `R` would overstate the change.
- **Per-Phase change logs.** Rejected. A reader would need to open every Phase to see what changed. One section in the index or overview is easier to find.
- **Name the section `## Change History`.** Considered because it names what is tracked and avoids the word "change". The owner chose `## Change History` instead, as the more familiar name for the same entry format.
- **Archive the old backlog when rebuilding.** Rejected. It creates two records with one coordinate, which the snapshot reports as `BACKLOG-VAL-005`.
- **Treat archived Waves as sealed.** Rejected. A fix to an archived outcome belongs with the Wave that made that outcome.
- **Test new work by code area.** Rejected. Old backlogs would grow without limit, and enhancements would hide inside old Waves.
- **Ship the documentation rules first and the CLI facts later.** Rejected. The twin rule prefers a deterministic counterpart. The facts are small, and the snapshot already reserves the `committed` slot.

## Consequences

- `R` numbers become rare and meaningful. Most follow-on work becomes a new Phase or a new small Wave.
- Plans and backlogs become living documents after the first commit. Change History is what keeps that safe.
- Reopened Waves change the backlog review picture. A Wave shown as `complete` can return to `active`, so backlog-review status reasons should name the revision Phase.
- Old and new records follow different rules. Readers of old records see the old Revision pattern. The user concept guide must explain both patterns.
- The `committed` fact depends on git. It is `null` when git is unavailable or when the history is shallow. Agents must treat `null` as unknown, not as false.
- The PRD authority validator does not need a change. Change History links are not authority-bearing sections, so the validator does not enforce them.
- Store-as-archive is recorded as a future design topic. These rules are already written to fit it.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs:
  - [2026-04-15-docs-contract-v2-planning.md](2026-04-15-docs-contract-v2-planning.md)
  - [2026-04-20-docs-assets-state-and-history.md](../../.make-docs/archive/designs/2026-04-20-docs-assets-state-and-history.md)
  - [2026-09-18-backlog-review-and-reporting.md](2026-09-18-backlog-review-and-reporting.md)
- Reason: The 2026-04-15 design introduced W/R/P and defined `r1+` as "meaningful redos". The 2026-04-20 design defined the `coordinate` field. The 2026-09-18 design defined the backlog snapshot facts. This design changes when each coordinate level is used and adds the amendment rules. It does not change the encoding.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: The active PRD set and shipped system resources already own coordinate, plan, and backlog rules. This design changes them in place.
- Coordinate Handoff: New wave W28 R0, by this design's own outcome test. The work adds outcomes that no earlier plan promised: in-place amendment with Change History, revision Phases, owner gates, and CLI coordinate facts. No completed coordinate is revised.
