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
  - ./workflows-how-make-docs-stages-fit-together.md
  - ./workflows-choosing-the-right-route-for-your-project.md
  - ../../assets/references/wave-model.md
  - ../../assets/references/history-record-contract.md
  - ../../assets/references/commit-message-convention.md
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
| `W13` | The thirteenth end-to-end initiative | Plan and work lineage |
| `R0` | The first version of that initiative | Corrections or redos stay in the same wave and increment revision |
| `P3` | The third phase inside that plan or backlog | Phase files, history records, and phase-level commits |

The source of truth for the naming rules is [wave-model.md](../../assets/references/wave-model.md).

## Where Coordinates Belong

W/R/P is part of the plan-and-backlog side of the system, not the entire docs system.

| Artifact family | Uses W/R/P? | Why |
| --- | --- | --- |
| `docs/plans/` | Yes | Plans track initiative lineage. |
| `docs/work/` | Yes | Work backlogs follow plan lineage. |
| `docs/assets/history/` | Yes, when known | History records often capture phase-scoped progress. |
| Commit messages tied to phased work | Yes | They can point back to the same initiative and phase. |
| `docs/designs/` | No | Designs use dated filenames and design lineage instead. |
| `docs/prd/` | No | The PRD namespace evolves in place as the active product truth. |

That distinction matters because [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md) and [Choosing the Right Route for Your Project](./workflows-choosing-the-right-route-for-your-project.md) both depend on the same rule: plans and work use initiative lineage, while designs and PRDs do not.

## What Each Part Means

### Wave

A wave is one end-to-end initiative. In user terms, it is the planning and delivery line for one coherent body of work.

Start a new wave when:

- the task is a new initiative
- it is not a correction or continuation of an earlier plan/work line

Do not start a new wave only because a newer unrelated wave already exists.

### Revision

A revision is a meaningful redo inside the same wave.

Use the next revision when:

- the task corrects an earlier plan
- the task reworks an existing initiative
- the task continues the same initiative after a real reset or redo

`R0` is normal. Revisions are zero-based.

### Phase

A phase is one numbered chunk inside a plan or work backlog.

Use a phase when the work is tied to a specific plan phase or backlog phase. Phase numbers appear in:

- phase files
- phase-scoped history records
- commits that clearly belong to that phase

## How Coordinates Show Up in Files

| Location | Example |
| --- | --- |
| Plan directory | `docs/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/` |
| Work directory | `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/` |
| Work phase file | `03-user-guide-delivery.md` |
| History record | `docs/assets/history/2026-04-23-w13-r0-p3-user-guide-delivery.md` |
| Commit subject | `docs: [W13 R0 P3] update user-guide coverage` |

Top-level plan and work directories include wave and revision, but not phase. Phase belongs inside the directory structure and in the history or commit record for that specific slice of work.

## How to Choose the Right Coordinate

Use this order:

1. Follow the coordinate the user already gave you.
2. If the task belongs to an existing plan or backlog line, keep that wave.
3. If the task is a redo or correction of that same line, increment the revision.
4. If the task is a new initiative, start the next wave at `R0`.
5. Add `P` only when the work is clearly tied to a specific phase.

If you cannot prove the coordinate, leave it out instead of guessing.

## Common Questions

### Why do plans and work use W/R, but PRDs do not?

Plans and work track initiative lineage. PRDs track the active product knowledge base. Mixing those two jobs would make iterative PRD maintenance harder.

### Why do designs not use W/R/P?

Designs are dated, topic-first artifacts. They feed later planning, but they are not named as wave artifacts.

### Is `R0` an error?

No. `R0` means the first revision.

### What if I know the wave and revision but not the phase?

Use only what you know. Do not invent `P0` or another placeholder.

## Related Resources

- Use [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md) for the user mental model of how plans, PRDs, and backlogs connect.
- Use [Choosing the Right Route for Your Project](./workflows-choosing-the-right-route-for-your-project.md) when the main question is route selection rather than naming.
- Use [history-record-contract.md](../../assets/references/history-record-contract.md) and [commit-message-convention.md](../../assets/references/commit-message-convention.md) when you need the exact filename or commit formatting rules.
