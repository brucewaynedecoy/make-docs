---
title: Choosing the Right Route for Your Project
path: workflows
status: draft
order: 20
tags:
  - workflow
  - routing
  - prd
  - backlog
applies-to:
  - docs
  - workflow
related:
  - ./workflows-how-make-docs-stages-fit-together.md
  - ../developer/development-workflows-choosing-the-right-route.md
  - ./concepts-wave-revision-phase-coordinates.md
  - ./getting-started-installing-make-docs.md
---

# Choosing the Right Route for Your Project

> See `docs/assets/references/guide-contract.md` for frontmatter schema and slug rules.

## Overview

The best `make-docs` workflow depends on what you already have.

You do not need to force every project through the same path. The better question is:

- are you starting from an idea?
- from a real codebase?
- or from an existing PRD set that needs to change?

## Prerequisites

Read [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md) first if you want the background on what each stage does.

## Getting Started

Use this table to pick the most natural route.

| If you already have... | And you want... | Best route | Typical result |
| --- | --- | --- | --- |
| A new concept, feature, or initiative | A fresh product definition and delivery plan | Design -> plan -> full PRD generation | Full PRD set plus full backlog |
| An existing codebase with weak or missing product docs | A clear product definition based on what exists | Decomposition -> plan -> full PRD generation | Full PRD set plus rebuild backlog |
| An active PRD set | A net-new capability or enhancement | PRD change planning -> targeted PRD update | Change docs plus delta backlog |
| An active PRD set | A revised or removed requirement | PRD change planning -> targeted PRD update | Revision/removal docs plus delta backlog |
| Existing plan/work history for the same initiative | Follow-up planning or a corrected delivery path | Continue the existing wave/revision line | Revised plan/work artifacts, with PRD changes only if needed |

## Step-by-Step Instructions

### Choose a full PRD set when the whole requirement surface needs to exist

A full PRD set is natural when:

- the project is new
- the existing documentation is not usable
- you need a baseline description of the whole system

This usually leads to a full backlog as well, because the whole product scope is being defined.

### Choose decomposition when the code already tells the story

If the software already exists, decomposition is often the fastest honest route.

Use it when:

- the codebase is real and important
- you need to recover product knowledge from what already ships
- guessing from memory or stale docs would be risky

This still ends with a PRD set and backlog, but it starts from the code instead of from a blank sheet.

### Choose a targeted PRD update when the active PRD set already works

If the project already has an active PRD set, you usually do not want to replace it just to make one change.

Choose a targeted update when:

- you are adding a new capability
- you are extending an existing one
- you are revising or removing a specific requirement

This route usually produces:

- targeted PRD change docs
- updates that show how those changes connect to the existing baseline
- a delta backlog focused on the affected work

### Choose a full backlog only when the scope is full

A full backlog makes sense when:

- you are creating a full PRD set
- you need a delivery plan for the whole active requirement surface

A delta backlog makes sense when:

- only part of the product is changing
- the rest of the PRD set still stands
- you want a smaller, more focused delivery plan

### Practical rule of thumb

1. If the project is new, start from design.
2. If the system already exists, consider decomposition.
3. If the PRD already exists, prefer targeted PRD updates over full replacement.
4. If only planning or delivery needs to change, keep the existing initiative lineage and avoid unnecessary PRD churn.

## Troubleshooting

### "I have both a codebase and a design. Which route should I pick?"

Pick the route based on which source needs to carry the most weight. If the system already exists and must be described accurately, decomposition may still be the better route even if a new design also exists.

### "How do I know whether to update the PRD or replace it?"

If the existing PRD set is still the active truth and you are changing only part of it, update it in place. Replace it only when a fresh full-set generation is truly needed.

### "Can one project use different routes over time?"

Yes. A project might start with a baseline PRD set, later use targeted PRD changes for iterative work, and later still use decomposition if the real system drifts far away from the old documentation.

## FAQ

### What is the most flexible thing about this system?

It does not assume that every project starts from a blank slate. It can adapt to greenfield work, mature codebases, and ongoing iterative change.

### When should I read about coordinates?

Read [Understanding W/R/P Coordinates](./concepts-wave-revision-phase-coordinates.md) when you need help understanding plan and backlog lineage.

### When should I read about installation?

Read [Installing Make Docs](./getting-started-installing-make-docs.md) when your next step is setting up or syncing the docs system rather than choosing a workflow route.

### Where should contributors go?

Contributors and maintainers should use the companion developer guide [Choosing the Right Make Docs Route](../developer/development-workflows-choosing-the-right-route.md) for the deeper internal model and source references.
