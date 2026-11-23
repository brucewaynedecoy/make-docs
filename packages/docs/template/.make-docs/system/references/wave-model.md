# Wave Model

## Purpose

This file is the single source of truth for the Wave/Revision/Phase (W/R/P) encoding used across `make-docs` v2 plans, work backlogs, and history records. It also defines how an agent selects a coordinate and how a committed plan or work backlog changes.

Every other reference file, template, and router links here instead of restating these rules. The encoding was piloted in `.make-docs/system/contracts/history-record-contract.md`. PRDs and designs are exempt; see `## PRD Exemption` and `## Design Exemption`.

## Terms

| Token | Name | Meaning |
| --- | --- | --- |
| `w{W}` | Wave | A self-contained unit of work. The Wave is the scope. It can be a full build, one domain slice, or one change request. Its plan is the statement of work. Wave 1 is the initial wave. |
| `r{R}` | Revision | `r0` is the base revision of every Wave. `r1+` is a revision Wave: a change order that revisits or rearchitects a substantial part of the Wave's completed work. A revision Wave has its own plan and work backlog. |
| `p{P}` | Phase | Phase within a plan or work backlog. Appears in inner phase files, phase-scoped history filenames, and history record `coordinate` frontmatter. `p{P}` does not appear in the top-level names of designs, plans, or work directories. Stage/task detail stays in `coordinate` only. |
| `T{T}` | Task | Task within one work backlog phase file. Task IDs appear on `### Tasks` checkbox items as phase-local ordinals (`T1`, `T2`, etc.) and are referenced externally as `W{W} R{R} P{P} T{T}` by inferring W/R from the work directory and P from the phase file. Write an upper-case `T`. Readers accept a lower-case `t` as the same task ID. |

Related terms:

| Term | Meaning |
| --- | --- |
| Phase complete | The Phase work is done, closed out, and committed. Deployment is extra evidence only: work that is deployed but not committed is not complete. Work that is done but not committed is not complete; edit or undo it in place. |
| Revision Phase | The next unused `P` in the same W/R that changes the result of a completed Phase. It carries no other coordinate marker. |
| Lineage Wave | The existing Wave whose plan promised the outcome that a request changes. |
| PRD | The product authority. A plan or work backlog never overrides it, and a work backlog can be rebuilt from it. |

## Naming Patterns

| Artifact | Required path |
| --- | --- |
| Plan directory | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| Plan overview file | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/00-overview.md` |
| Plan phase file | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/0N-<phase>.md` |
| Work directory | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| Work index file | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/00-index.md` |
| Work phase file | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/0N-<phase>.md` |
| Breadcrumb record | `.make-docs/archive/history/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md` when W/R/P is known; see `.make-docs/system/contracts/history-record-contract.md` for fallbacks. |

`YYYY-MM-DD` is the date the artifact is written. Never backdate.

`<slug>` is lowercase, hyphens only, no special characters.

## Decision Procedure

Use this procedure before writing a new plan or work directory, and before changing a committed plan or work backlog. Apply the steps in order. Steps 1 and 2 can decide the coordinate, but the significant deviation test and the owner gates still apply before you change any plan or backlog.

1. **Honor explicit guidance.** If the user states the coordinate (for example "this is wave 2" or "make this a revision wave"), use it. Still apply the significant deviation test and the owner gates to the change.
2. **Outcome test.** Does the request add an outcome that no Wave's plan promised? An outcome can be a new capability or an enhancement. Decide by outcome, not by code area.
   - If yes, the request is new work. Scan `docs/plans/`, `docs/work/`, and their archives for the highest `W`. Use the highest `W` plus one, with `r0`. If the scan finds no plan or work entries, use `w1-r0`. A Wave can be small.
   - A PRD `create` decision is strong evidence of new work, but it does not decide the result alone.
   - If an unfinished Wave could also absorb the outcome, ask the owner whether to extend that Wave or start a new one.
3. **Lineage Wave.** Otherwise the request changes an outcome that an existing Wave promised. Inspect the user request, referenced designs, design lineage, coordinate handoffs, prior plans, prior work backlogs, and history records to find that lineage Wave.
   - **Archived lineage first.** If the lineage Wave's plan and work are archived, ask the owner before any other decision. After approval, restore them to the working set under their existing names, then continue with this step.
   - **Not complete** (unstarted, in progress, or done but not committed): if the change does not significantly deviate from the plan, edit the existing backlog in place. If it does significantly deviate, ask the owner to choose:
     - **Pivot:** amend the same plan and backlog in place, at the same W/R.
     - **Finish first:** complete the Wave, then open a revision Wave.
   - **Complete:** add a revision Phase at the next unused `P` of the same W/R, unless the revision Wave test passes. If it passes, open a revision Wave at the next unused `R` of the lineage Wave.
4. **No drift to newer Waves.** Do not assign a new Wave only because newer, unrelated Waves exist. The highest-wave scan is for new work only.

### Significant Deviation Test

A change significantly deviates from the plan when it does one of these:

- changes the plan's goal, scope, or non-goals;
- replaces the approach or architecture that the plan chose;
- adds a product capability that the plan does not name.

These changes are not significant:

- adding, splitting, or reordering Phases or tasks inside the stated scope;
- fixing defects;
- adjusting tests or evidence.

### Revision Wave Test

A change to completed work is a revision Wave when at least one of these is true:

1. It reverses an approach or architecture choice in the plan, so the plan must be rewritten, not extended.
2. It must redo the results of two or more completed Phases.
3. The fix needs its own design, or a plan with several Phases.

Deployment alone does not make a change a revision Wave. Otherwise, the change is a revision Phase.

### Owner Gates

| Action | Agent decides alone | Ask the owner first |
| --- | --- | --- |
| Edit unfinished work that fits the plan | Yes | No |
| Add a revision Phase | Yes. State the choice and the reason. | When a revision Wave test result is borderline |
| Make a significant plan change on an unfinished Wave | No | Yes |
| Create a revision Wave | No | Yes |
| Create a new Wave when an existing Wave could absorb the work | No | Yes |
| Rebuild a work backlog from the PRD | No | Yes |
| Restore an archived Wave | No | Yes |

An owner question names the choice, the reason, and the effect, and follows the user action request rules in `.make-docs/system/contracts/human-experience-contract.md`. For a choice the agent makes alone, its reply names the chosen coordinate and the reason. Never select a coordinate silently.

### Recording The Decision

- Every plan records its `## Coordinate Decision` with `Classification: new-wave` or `revision-wave` and the evidence: the explicit guidance, the outcome test, or the revision Wave test that applied. The legacy value `revision` means `revision-wave`.
- A revision Wave's plan names the completed Phases it changes. The prior work backlog's `## Change History` records a `revision-wave` entry that links to the new W/R.
- A revision Phase names the Phase it changes in a `Revises:` line under its `## Purpose`. When it opens new work in a completed Wave, set the work index status back to `active`.

## Change History

A plan or work backlog that has been committed at least once records each later scope change in a `## Change History` section.

- In a work backlog, the section goes at the end of `00-index.md`.
- In a plan, the section goes at the end of `00-overview.md`, when the plan changes.
- A scope edit adds, removes, or rewrites tasks, acceptance criteria, or Phases. Each scope edit needs an entry.
- Progress updates never need an entry. Progress updates are checked tasks, status changes, closeout notes, and evidence links.
- Before its first commit, a plan or work backlog is a draft and needs no entries.

The entry shape mirrors the PRD `## Requirement History` contract in `.make-docs/system/references/prd-change-management.md`. Use one dated `###` entry per coherent change, newest entry last. Use the most specific coordinate the change affects, for example `W28 R0 P3`, or `W28 R0` when the change affects more than one Phase.

```md
## Change History

### {{DATE}} — {{COORDINATE}}

- Kind: `{{EDIT_REVISION_PHASE_PIVOT_REBUILD_OR_REVISION_WAVE}}`
- Affected scope: {{PHASES_OR_TASKS}}
- Previous scope: {{PREVIOUS_SCOPE}}
- Replacement scope: {{REPLACEMENT_SCOPE}}
- Rationale: {{RATIONALE}}
- PRD decision: `{{UPDATE_EXISTING_CREATE_LINK_ONLY_OR_NONE}}` — {{REASON_WHEN_NONE}}
- Owner approval: {{APPROVAL_SOURCE_OR_NOT_REQUIRED}}
- Source: [{{SOURCE_LABEL}}]({{RELATIVE_SOURCE_PATH}})
```

`Kind` is one of `edit`, `revision-phase`, `pivot`, `rebuild`, or `revision-wave`. `PRD decision` is one of `update-existing`, `create`, `link-only`, or `none`; give the reason when it is `none`.

## Plans, PRDs, And Work

- The PRD decision (`update-existing`, `create`, `link-only`, or `none`) is separate from the coordinate decision. When a change alters product requirements, update the owning PRD first, then the plan or work backlog.
- PRD maintenance work goes into the lineage Wave's work backlog, as an in-place edit or a revision Phase. Create a new work backlog only for a new Wave or a revision Wave.
- Write a plan before execution. After its first commit, amend it in place, with `## Change History`, when the owner approves a pivot or when a revision Phase changes plan-level scope. An amended plan keeps its W/R.

## Rebuild From The PRD

A work backlog can be rebuilt from the current PRD set after the owner approves.

- Keep the same W/R and the same record location. Do not create a duplicate record.
- Keep completed Phases unchanged, including their tasks, checkboxes, and closeout notes.
- Rebuild only the unfinished Phases.
- Add a `## Change History` entry of kind `rebuild`.

History keeps the prior version. These rules describe outcomes, not a storage mechanism, so they hold wherever a project keeps its history and archive.

## Breadcrumbs And Tasks

For breadcrumb records, store any known W/R/P/S/T position in the `coordinate` frontmatter field described by `.make-docs/system/contracts/history-record-contract.md`. Include W/R/P in the filename when all three are known. Include W/R when only those two are known. Keep stage and task detail only in `coordinate`.

For work backlog tasks, number task IDs ordinally across the entire phase file, not within each stage. Start the first task at `T1`, continue through later `### Tasks` sections without resetting, and do not renumber existing task IDs when inserting or completing work. Use unordered markdown task syntax (`- [ ] T1: ...` or `- [x] T1: ...`) so checkbox rendering stays reliable.

## Adoption

These rules govern coordinates selected and records changed from their adoption forward. Existing plan and work records keep their coordinates. Do not renumber or rewrite an older record to match these rules. Older records may use a revision for a fix or an add-on that these rules would now treat as a revision Phase.

## Deterministic Support

Coordinate selection is agent judgment: the outcome test, the significant deviation test, and the revision Wave test need it. When the CLI is available, `make-docs run work backlog snapshot` reports supporting facts: whether each phase file is committed, whether its closeout notes are present, whether a record is archived, each record's next free `P`, each Wave's revisions and next free `R`, and the highest `W`. It also checks the shape of a work backlog's `## Change History`. It never selects a coordinate. Treat an unknown fact as unknown, never as false. The `committed` fact describes the current working tree. A completed phase with a later uncommitted progress edit reads `false`, so the agent decides from history whether the phase was completed and committed earlier.

## PRD Exemption

PRDs are intentionally exempt from W/R/P. The PRD namespace is maintained in place as the current product authority rather than iterating in waves.

- PRD docs keep the fixed `NN-<slug>.md` convention described in `.make-docs/system/contracts/output-contract.md`.
- PRD filenames, H1 titles, kinds, and document-level frontmatter describe product subjects, not maintenance operations or revision coordinates.
- W/R/P coordinates may appear in a PRD's source links or non-normative `## Requirement History` entries to identify the maintenance event; they are not PRD document identity.
- Authoritative maintenance for PRDs is governed by `.make-docs/system/references/prd-change-management.md`.
- Archived PRD sets are grouped by date, not by wave (see `## Archive Integration`).

## Design Exemption

Designs are exempt from W/R encoding. Design filenames use the simplified pattern `YYYY-MM-DD-<slug>.md`.

The date provides chronological ordering; the slug provides topical identity. No wave or revision identifier is required.

When a design is revised or superseded, write a new dated design and use `## Design Lineage` (defined in `.make-docs/system/contracts/design-contract.md`) to link back to prior designs. Do not use `r{R}` revision numbering on designs.

Designs are inputs to a wave cycle (design → plan → work), not products of one. Binding a design to a wave number implies a 1:1 relationship with a downstream plan/work cycle that often does not hold.

## Archive Integration

Archive rules for designs, plans, work, and PRDs live in `.make-docs/archive/AGENTS.md`. W/R/P naming is preserved when an artifact is archived; it is not rewritten.

## Forward Compatibility

The W/R/P encoding was piloted in legacy history filenames before broader adoption. Existing legacy files continue to conform without change.
