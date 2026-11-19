---
title: Understanding W/R/P Coordinates
path: concepts
status: draft
order: 20
tags:
  - coordinates
  - wave
  - revision
  - phase
applies-to:
  - docs
  - workflow
related:
  - "workflows-how-make-docs-stages-fit-together.md"
  - "workflows-choosing-the-right-route-for-your-project.md"
  - "../../../.make-docs/system/references/wave-model.md"
  - "../../../.make-docs/system/contracts/history-record-contract.md"
  - "../../../.make-docs/system/contracts/commit-message-convention.md"
---

# Understanding W/R/P Coordinates

`make-docs` uses W/R/P coordinates to track initiative lineage in plans, work backlogs, history records, and phase-scoped commits. The three parts are:

- `W` for wave
- `R` for revision
- `P` for phase

Read `W13 R0 P3` as "wave 13, revision 0, phase 3."

## Quick Reference

| Token | Meaning | Used for |
| --- | --- | --- |
| `W13` | The thirteenth wave: one self-contained unit of work | New work gets a new wave |
| `R0` | The base revision of that wave | A higher `R` is a change order on completed work |
| `P3` | The third phase inside that plan or backlog | Continuing work, revision Phases, history records, and phase-level commits |

The source of truth for the naming rules is [wave-model.md](../../../.make-docs/system/references/wave-model.md).

## Where Coordinates Belong

W/R/P is part of the plan-and-backlog side of the system, not the entire docs system.

| Artifact family | Uses W/R/P? | Why |
| --- | --- | --- |
| `docs/plans/` | Yes | Plans track initiative lineage. |
| `docs/work/` | Yes | Work backlogs follow plan lineage. |
| `docs/assets/archive/history/` | Yes, when known | History records often capture phase-scoped progress. |
| Commit messages tied to phased work | Yes | They can point back to the same initiative and phase. |
| `docs/designs/` | No | Designs use dated filenames and design lineage instead. |
| `docs/prd/` | No | The PRD namespace evolves in place as the active product truth. |

That distinction matters because [How Make Docs Stages Fit Together](workflows-how-make-docs-stages-fit-together.md) and [Choosing the Right Route for Your Project](workflows-choosing-the-right-route-for-your-project.md) both depend on the same rule: plans and work use initiative lineage, while designs and PRDs do not.

## What Each Part Means

### Wave

A wave is one self-contained unit of work. The wave sets the scope. It can be a full build, one slice such as the frontend, or a single change request. The wave's plan is its statement of work.

Start a new wave when the request adds an outcome that no earlier plan promised. Judge this by the outcome, not by which code it touches. A small new wave is fine.

Do not start a new wave only because a newer unrelated wave already exists.

### Revision

A revision above `R0` is a revision Wave: a change order. Use one only when completed, committed work must be substantially revisited or rearchitected, so the fix is effectively its own wave. One of these must be true:

- the change reverses an approach or architecture choice in the plan
- the change must redo the results of two or more completed phases
- the fix needs its own design, or a plan with several phases

Shipping or deploying the work does not make a fix a revision Wave by itself. `R0` is normal. Revisions are zero-based.

### Phase

A phase is one numbered chunk inside a plan or work backlog. Phase numbers appear in:

- phase files
- phase-scoped history records
- commits that clearly belong to that phase

A phase is complete when its work is done, closed out, and committed. A change to a completed phase usually becomes a revision Phase: the next phase number in the same wave and revision.

## How Coordinates Show Up in Files

| Location | Example |
| --- | --- |
| Plan directory | `docs/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/` |
| Work directory | `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/` |
| Work phase file | `03-user-guide-delivery.md` |
| History record | `docs/assets/archive/history/2026-04-23-w13-r0-p3-user-guide-delivery.md` |
| Commit subject | `docs: [W13 R0 P3] update user-guide coverage` |

Top-level plan and work directories include wave and revision, but not phase. Phase belongs inside the directory structure and in the history or commit record for that specific slice of work.

## How to Choose the Right Coordinate

Use this order:

1. Follow the coordinate the user already gave you.
2. If the task adds an outcome that no plan promised, start the next wave at `R0`.
3. Otherwise, find the wave whose plan promised the outcome being changed.
   - If that work is not complete yet, edit the existing backlog in place. If the change moves the plan's goal, scope, or approach, the agent asks the owner first.
   - If that work is complete, add a revision Phase to the same wave and revision.
   - Use the next revision only when the revision Wave test above passes, and only after the owner agrees.
4. Add `P` only when the work is clearly tied to a specific phase.

If you cannot prove the coordinate, leave it out instead of guessing. The full procedure and its owner gates are in [wave-model.md](../../../.make-docs/system/references/wave-model.md).

## How Changes Are Recorded

After a plan or work backlog has been committed, every change to its scope adds an entry to a `## Change History` section at the end of the plan overview or work index. Each entry says what changed, why, which PRD decision applied, and who approved it. Ticking tasks and updating status are progress, not scope changes, so they need no entry.

## Common Questions

### Why do plans and work use W/R, but PRDs do not?

Plans and work track initiative lineage. PRDs track the active product knowledge base. Mixing those two jobs would make iterative PRD maintenance harder.

### Why do designs not use W/R/P?

Designs are dated, topic-first artifacts. They feed later planning, but they are not named as wave artifacts.

### Is `R0` an error?

No. `R0` means the first revision.

### Why do older records have so many revisions?

Before W28, a new revision was also used for fixes and add-ons, so some waves have many revisions. Those records keep their coordinates. New work follows the rules on this page.

### What if I know the wave and revision but not the phase?

Use only what you know. Do not invent `P0` or another placeholder.

## Related Resources

- Use [How Make Docs Stages Fit Together](workflows-how-make-docs-stages-fit-together.md) for the user mental model of how plans, PRDs, and backlogs connect.
- Use [Choosing the Right Route for Your Project](workflows-choosing-the-right-route-for-your-project.md) when the main question is route selection rather than naming.
- Use [history-record-contract.md](../../../.make-docs/system/contracts/history-record-contract.md) and [commit-message-convention.md](../../../.make-docs/system/contracts/commit-message-convention.md) when you need the exact filename or commit formatting rules.
