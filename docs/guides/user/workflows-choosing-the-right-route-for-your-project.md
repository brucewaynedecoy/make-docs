---
title: Choosing the Right Route for Your Project
path: workflows
status: draft
order: 20
tags:
  - workflow
  - routing
  - decomposition
  - prd
applies-to:
  - docs
  - workflow
related:
  - ./workflows-how-make-docs-stages-fit-together.md
  - ./concepts-wave-revision-phase-coordinates.md
  - ./getting-started-installing-make-docs.md
  - ../developer/development-workflows-choosing-the-right-route.md
  - ../../prd/02-architecture-overview.md
---

# Choosing the Right Route for Your Project

Choose the route based on the project's current starting point, not on habit.

The three main starting points are:

- a new idea or design
- an existing codebase
- an active PRD set

## Quick Chooser

| If you have... | And you need... | Best route | Typical result |
| --- | --- | --- | --- |
| A new initiative or design | A first active PRD set | Design -> plan -> full-set generation | Full PRD set plus full backlog |
| An existing codebase with missing or weak product docs | A current product definition based on real behavior | Decomposition -> plan -> full-set generation | Full PRD set plus rebuild backlog |
| An active PRD set that is still trustworthy | A targeted product change | Change planning -> active-set evolution | Change docs plus delta backlog |
| Existing plan or backlog lineage for the same initiative | Follow-up execution work or a correction | Continue the same W/R line | Revised plan/work artifacts, with PRD updates only if needed |

## Route 1: Start from a New Idea or Design

Use this route when the product definition still needs to be established.

This is the right fit when:

- the project is new
- the main input is intent rather than existing code
- you need a baseline PRD namespace before delivery planning

Expected outcome:

- a plan
- a full PRD set
- a full backlog

## Route 2: Start from an Existing Codebase

Use this route when the codebase is the most trustworthy source of truth.

This is the right fit when:

- the software already exists
- the current docs are missing, stale, or incomplete
- guessing from memory would be risky

Expected outcome:

- a decomposition-oriented plan
- a fresh PRD set generated from the existing system
- a rebuild-oriented backlog

This guide only helps you choose that route. The dedicated decomposition skill guide is owned by a later bundle and is intentionally deferred from this file's `related` links until that guide exists.

## Route 3: Start from an Active PRD Set

Use this route when the repo already has an active PRD namespace and only part of it is changing.

This is the right fit when:

- you are adding a capability
- you are enhancing an existing one
- you are revising or removing a requirement

Expected outcome:

- a change plan
- one or more PRD change docs
- baseline annotations where needed
- a delta backlog

This is the default route for iterative product work.

## Route 4: Continue Existing W/R Lineage

Sometimes the right answer is not a PRD route at all.

If the main task is:

- follow-up planning
- backlog correction
- continuing an existing initiative

then keep the same wave and update the revision only when the work is a real redo or correction. Do not create PRD churn unless the requirements actually changed.

## How to Decide

Ask these questions in order:

1. Does the repo already have a trustworthy active PRD set?
2. If not, is the best source of truth a design or the codebase?
3. Does the task need a full requirement surface or only a targeted change?
4. Is the main work about requirements, or is it really follow-up inside existing plan/work lineage?

If the answers point to an active PRD set, prefer active-set evolution over full replacement.

## Common Questions

### The repo has both code and docs. Should I still decompose it?

Usually no. If the active PRD set is still current enough to evolve in place, use change planning instead of regenerating the whole namespace.

### When should I create a full backlog?

When the route creates or replaces a full PRD set, or when the user explicitly asks for a full delivery plan.

### When should I create a delta backlog?

When the active PRD set stays in place and only the affected slice of work needs planning.

### What if I am mostly correcting an earlier plan or backlog?

That is usually W/R follow-up work, not a reason to regenerate the PRD set.

## Related Resources

- Use [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md) for the broader stage model behind these choices.
- Use [Understanding W/R/P Coordinates](./concepts-wave-revision-phase-coordinates.md) when the route decision depends on existing plan or backlog lineage.
- Use the companion developer guide [Choosing the Right Make Docs Route](../developer/development-workflows-choosing-the-right-route.md) for the maintainer-facing decision model.
