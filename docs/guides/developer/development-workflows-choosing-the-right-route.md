---
title: Choosing the Right Make Docs Route
path: development/workflows
status: draft
order: 20
tags:
  - workflow
  - routing
  - decomposition
  - prd
  - planning
applies-to:
  - docs
  - workflow
  - template
  - skills
related:
  - ./development-workflows-stage-model-and-artifact-relationships.md
  - ../user/workflows-choosing-the-right-route-for-your-project.md
  - ../../assets/templates/plan-prd.md
  - ../../assets/templates/plan-prd-decompose.md
  - ../../assets/templates/plan-prd-change.md
  - ../../assets/references/planning-workflow.md
  - ../../assets/references/execution-workflow.md
  - ../../assets/references/prd-change-management.md
---

# Choosing the Right Make Docs Route

> See `docs/assets/references/guide-contract.md` for frontmatter schema and slug rules.

## Overview

The most common workflow mistake in `make-docs` is choosing a route based on habit instead of current state. This guide is the route chooser for contributors, maintainers, and agents who need to decide between baseline generation, decomposition-driven PRD generation, targeted active-set evolution, and follow-up W/R work.

The route decision should come from two questions:

1. What is the starting point?
2. What output should exist when the work is done?

## Prerequisites

Read [Understanding the Make Docs Stage Model](./development-workflows-stage-model-and-artifact-relationships.md) first if you need the conceptual background for how the artifacts fit together.

You should also know whether the repo currently has:

- a design doc that already names `baseline-plan` or `change-plan`
- active content in `docs/prd/`
- an existing codebase that needs reverse engineering
- an existing plan or work lineage that this task revises

## Setup / Configuration

These are the route-specific planning templates:

| Route | Planning template | Typical execution mode |
| --- | --- | --- |
| Fresh baseline generation | [plan-prd.md](../../assets/templates/plan-prd.md) | `full-set generation` |
| Codebase decomposition | [plan-prd-decompose.md](../../assets/templates/plan-prd-decompose.md) | `full-set generation` |
| Active PRD change | [plan-prd-change.md](../../assets/templates/plan-prd-change.md) | `active-set evolution` |

These are the change templates used once a task is already in active-set evolution:

- additions and enhancements use `prd-change-addition.md`
- revisions and removals use `prd-change-revision.md`

The current CLI and PRD surface split route choice from skill execution:

- route choice still happens in planning and execution workflow docs
- the optional `decompose-codebase` skill is an implementation aid for the decomposition route, not a replacement for route selection
- direct cross-bundle linking into Bundle C skill coverage is deferred to Phase 6 assembly

## Usage

### Decision table

| Starting point | Desired outcome | Recommended route | Why |
| --- | --- | --- | --- |
| New idea, new design, or net-new initiative | Fresh PRD set and full backlog | Baseline plan -> full-set generation | The repo needs a baseline requirement surface before delivery planning |
| Existing codebase with no reliable PRD set | Reverse-engineered PRD set and rebuild backlog | Decomposition plan -> full-set generation | The codebase is the primary input and needs to be turned into active product docs |
| Active PRD set, net-new capability | Change docs and delta backlog | Change plan -> active-set evolution | The active namespace already exists and should be extended in place |
| Active PRD set, changed or removed requirement | Revision/removal docs, baseline annotations, delta backlog | Change plan -> active-set evolution | Existing requirements must preserve lineage instead of being silently rewritten |
| Existing initiative needs re-plan or follow-up work | Revised plan/work lineage, possibly no PRD change | Continue the existing wave/revision line as appropriate | W/R lineage belongs to plan/work, not the PRD namespace |

### Route-selection checks

Before you choose a route, answer these in order:

1. Is the authoritative starting point a design, an existing codebase, or an active PRD set?
2. Is the outcome a fresh PRD namespace, an in-place change to the active namespace, or only follow-up execution work?
3. Does the task belong to an existing W/R line that should be revised instead of replaced?
4. Would the route require replacing active `docs/prd/` root entries, and if so, has the archive gate been handled?

### Route 1: Fresh baseline generation

Choose this route when the repo needs a baseline PRD set and the starting point is primarily idea or design driven.

Use it when:

- the user wants a new PRD set for a project or product area
- no active PRD namespace exists, or the existing namespace is going to be replaced as a set
- the main source inputs are design intent, planned capabilities, or known requirements

Expected artifacts:

- a plan directory under `docs/plans/`
- the fixed PRD core plus adaptive baseline docs under `docs/prd/`
- a full backlog directory under `docs/work/`

Important constraint:

- if `docs/prd/` already contains active root entries, execution must resolve the archive gate before replacement

### Route 2: Decomposition-driven PRD generation

Choose this route when the product already exists and the codebase is the authoritative starting point.

Use it when:

- you need to preserve product knowledge from an existing repo
- the current documentation is missing, stale, or incomplete
- the goal is a fresh active PRD set plus a rebuild-oriented backlog

Expected artifacts:

- a decomposition plan directory
- a full PRD set generated from the codebase
- a rebuild backlog directory

This route still ends in `full-set generation`, but the planning and discovery assumptions are different from greenfield baseline work. In current state, the optional `decompose-codebase` skill belongs to the decomposition execution path, while this guide remains the authority for deciding when that path is appropriate.

### Route 3: Active-set evolution

Choose this route when the repo already has an active PRD namespace and the task changes only part of it.

Use it when:

- you are adding a capability to an existing product
- you are enhancing an existing capability
- you are revising or removing an established requirement

Expected artifacts:

- a change plan directory
- one or more new numbered change docs in `docs/prd/`
- `### Change Notes` annotations in impacted baseline docs
- an updated `docs/prd/00-index.md`
- a new dated delta backlog directory under `docs/work/`

Do not use this route to silently rewrite baseline PRDs unless the user explicitly asks for a cleanup rewrite.

### Route 4: W/R follow-up work

Sometimes the right answer is not "change the PRD" but "continue or revise the plan/work lineage."

Choose this route when:

- the initiative belongs to an existing wave
- the work is a re-plan, correction, or follow-up to an earlier plan/work effort
- the effective requirements are already captured in the active PRD set

In that case:

- keep the relevant wave
- increment the revision only when the work is a real redo or correction
- avoid inventing PRD changes that do not exist

### What should not drive route selection

Do not choose a route because:

- a familiar template exists
- decomposition tooling is available
- the codebase is large
- the task feels important enough to justify a fresh PRD set

Choose the route from current state and required outputs. Tooling, templates, and backlog size are downstream consequences.

### Quick chooser

If you need a fast rule of thumb:

1. Start from a design when intent is still being shaped.
2. Start from decomposition when the codebase is the thing you need to understand.
3. Start from change planning when the active PRD already exists and only part of it is changing.
4. Start from existing plan/work lineage when the main problem is execution follow-through rather than requirement change.

## Troubleshooting

### "The repo has code and a PRD set. Should I decompose anyway?"

Usually no. If the active PRD set is still trustworthy, use change planning or ordinary W/R follow-up work instead of regenerating the whole knowledge base.

### "The change is big enough to feel like a subsystem. Should it still be a change doc?"

Yes, if it is a net-new or expanded capability inside the active namespace. Change management still treats it as an addition or enhancement doc.

### "When should I regenerate the full backlog?"

Only when the task is full-set generation or when the user explicitly asks for a regenerated full backlog. Active-set evolution defaults to a new delta backlog.

### "When should I replace the active PRD set?"

Only when the task is truly full-set generation. If the change belongs inside the current namespace, evolve it in place instead.

### "Where should I document the decomposition skill itself?"

Outside this guide. Route choice stays here; detailed skill entry points, registry behavior, and distribution belong in the skills documentation bundle and can be cross-linked during Phase 6 assembly.

## Related Resources

- Use [Understanding the Make Docs Stage Model](./development-workflows-stage-model-and-artifact-relationships.md) for the conceptual model behind these route choices.
- Use the companion user guide [Choosing the Right Route for Your Project](../user/workflows-choosing-the-right-route-for-your-project.md) for a simpler external explanation.
- Use [planning-workflow.md](../../assets/references/planning-workflow.md) and [execution-workflow.md](../../assets/references/execution-workflow.md) when you need the exact decision and writing rules that back this guide.
