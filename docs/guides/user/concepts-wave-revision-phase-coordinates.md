---
title: Understanding W/R/P Coordinates
path: concepts
status: draft
order: 20
tags:
  - coordinates
  - history
  - commits
applies-to:
  - docs
  - workflow
related:
  - ../../assets/references/wave-model.md
  - ../../assets/references/history-record-contract.md
  - ../../assets/references/commit-message-convention.md
---

# Understanding W/R/P Coordinates

Make Docs uses coordinates such as `W1 R0 P1` to identify where a document, history record, or commit belongs in an end-to-end documentation workflow. The coordinate is short, but it carries three pieces of context: wave, revision, and phase.

This guide explains how to read the coordinate, where it appears, and what to do when you are not sure which coordinate applies.

## Quick Reference

| Token | Name | What it means |
| --- | --- | --- |
| `W1` | Wave 1 | The first end-to-end initiative in a project. A wave usually runs from design to plan to work. |
| `R0` | Revision 0 | The initial version of that wave. Revisions are zero-based, so `R0` is normal. |
| `P1` | Phase 1 | The first phase inside a plan or work backlog. Phases are one-based. |

Read `W7 R1 P3` as "Wave 7, revision 1, phase 3."

The authoritative rules live in [the wave model](../../assets/references/wave-model.md).

## How Waves Work

A wave is one complete initiative. It starts when the user asks for a new end-to-end body of work, then usually moves through design, planning, work execution, history records, and commits.

Use a new wave when the work is a new initiative. For example, if the latest unrelated initiative was `W4 R0` and the user starts a new feature planning effort, the next initiative is usually `W5 R0`.

Do not create a new wave just because a newer wave exists. If the current task revises older work, keep the older wave and increment its revision instead.

## How Revisions Work

A revision is a meaningful redo inside the same wave. The first version is always `R0`. Later revisions are `R1`, `R2`, and so on.

Use a new revision when the user asks to redesign, re-plan, correct, standardize, or finish something that already belongs to an existing wave. For example, if `W5 R0` delivered the first version of a CLI skill installation workflow and the user later asks to rework that same workflow after feedback, the follow-up should stay in `W5` and become the next unused revision, such as `W5 R1`.

## How Phases Work

A phase is a chunk of implementation or planning work inside a wave and revision. Phases appear inside plan files, work files, history records, and phase-specific commits.

Top-level plan and work directories include only wave and revision:

```text
docs/plans/2026-04-21-w10-r0-make-docs-rename/
docs/work/2026-04-21-w10-r0-make-docs-rename/
```

Individual phase files use ordinary numbered filenames inside those directories:

```text
01-core-package-and-cli-identity.md
02-template-and-installer-rename.md
03-docs-history-and-pathnames.md
```

History records include the phase when the phase is known:

```text
docs/assets/history/2026-04-21-w10-r0-p1-core-package-and-cli-identity.md
```

## Where Coordinates Appear

Coordinates appear in different formats depending on the artifact.

| Location | Example | Notes |
| --- | --- | --- |
| Plan directory | `docs/plans/2026-04-21-w10-r0-make-docs-rename/` | Uses lowercase `w` and `r`; no phase in the directory name. |
| Work directory | `docs/work/2026-04-21-w10-r0-make-docs-rename/` | Mirrors the plan directory shape. |
| History filename | `docs/assets/history/2026-04-21-w10-r0-p1-core-package-and-cli-identity.md` | Includes `p` when the record is phase-scoped. |
| History frontmatter | `coordinate: "W10 R0 P1"` | Uses the human-readable display form. |
| Commit subject | `feat: [W10 R0 P1] Make Docs rename - Core package and CLI identity` | Uses square brackets and no commas. |

History record details are defined in [the history record contract](../../assets/references/history-record-contract.md). Commit message details are defined in [the commit message convention](../../assets/references/commit-message-convention.md).

## How Commit Messages Use Coordinates

Plan commits usually include wave and revision only:

```text
plan: [W9 R1] Docs Assets Resource Namespace Overhaul
```

Feature commits include wave, revision, and phase:

```text
feat: [W8 R0 P5] CLI command simplification - Apply and sync output polish
```

Document commits include a coordinate only when the source document already has one:

```text
docs: [W10 R0 P3] document docs history and pathname migration
```

Do not add a coordinate to a commit message if the source work does not establish one. The coordinate should be evidence from the changed files, branch name, plan, work backlog, or history record, not a guess.

## How to Decide the Right Coordinate

Use this order when you need to identify a coordinate:

1. Follow any explicit coordinate from the user.
2. Check the related history record, plan, work backlog, or branch name.
3. If the task revises existing work, keep the original wave and use the next unused revision.
4. If the task starts a new end-to-end initiative, use the next unused wave and reset revision to `R0`.
5. Add a phase only when the work is tied to a specific plan or work phase.

If you still cannot resolve the coordinate, leave it out instead of filling in placeholders.

## Common Questions

### Is `R0` a mistake?

No. Revisions are zero-based. `R0` means the first version of the wave.

### Why is `P1` not in top-level plan or work directory names?

Plan and work directories represent the whole wave and revision. Phases are the files inside those directories, so phase numbers stay in phase files, history records, and phase-specific commits.

### Should designs use W/R/P?

No. Designs use dated filenames such as `docs/designs/YYYY-MM-DD-<slug>.md`. If a design revises an earlier design, it uses design lineage instead of `R1` in the filename.

### Should PRDs use W/R/P?

No. PRDs evolve as an active document set with change notes and fixed numbering. They are intentionally outside the wave/revision/phase model.

### What if only `W` and `R` are known?

Use only the known pieces. For history records, that means a path such as:

```text
docs/assets/history/YYYY-MM-DD-w9-r1-<slug>.md
```

Do not write `P0` or another placeholder just to complete the shape.
