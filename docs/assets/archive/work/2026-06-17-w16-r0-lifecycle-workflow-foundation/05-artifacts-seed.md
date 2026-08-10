# Phase 05: Artifacts Seed Directory

## Purpose

Sanction an optional `docs/artifacts/` directory: a zero-contract home for
free-form pre-design inputs that hydrate the downstream pipeline. This
accommodates ideation and architecture as an input surface, not as contract-bound
stages.

## Overview

A dogfood instance of `docs/artifacts/` already exists in this repo. This phase
sanctions the directory at the product level — referenced in the contracts and
provided as an installable, light router — so consuming projects can use it.

## Source PRD Docs

- [historical design](../../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`)
- [02-architecture-overview.md](../../../../prd/02-architecture-overview.md)

## Stage 1 - Sanction the seed directory

### Tasks

- [x] t1: Add references in the lifecycle anchor and `planning-workflow.md` citing `docs/artifacts/` as a recommended (never required) input source — "if present, read it to hydrate the design and plan."
- [x] t2: Provide a light `AGENTS.md`/`CLAUDE.md` router for `docs/artifacts/` as a managed/template asset, stating the zero-contract seed purpose (the dogfood instance at `docs/artifacts/` can serve as the basis).
- [x] t3: Update `planning-workflow.md` so planning reads `docs/artifacts/`, generalizing the prior architecture-seed idea; treat "architecture" docs as one kind of artifact, not the directory name.

### Acceptance criteria

- The contracts and routers reference `docs/artifacts/` as an optional recommended input.
- A light router exists for the directory; no required-stage semantics are introduced.
- No placeholders remain.

### Dependencies

- Phase 02 — `docs/artifacts/` is referenced by the lifecycle anchor and the planning workflow.
