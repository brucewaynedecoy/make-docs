---
title: "W30 R0 P1 Factory Contract and Workflow Types Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W30 R0 P1"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W30 R0 P1 Factory Contract and Workflow Types Closeout

## Changes

Adds four shipped system resources, authored in `packages/docs/template/` and then copied into this repository's `.make-docs/` and the bundled CLI template. `make-docs://system/contract/factory-contract.md` holds the factory rules: the boundary, the four standard roles and custom role fields, an 11-entry capability catalog with a proof method for each, setup, the four readiness states and their moves, saved records, assignments, claims, the loop, waking, the human channel, the five floor events and message rules, acceptance, working rules, limits, the backup rule outside git, the workflow type fields, the preflight step, project-owned types, the planned `make-docs factory` commands, and a 53-row rule catalog in which each planned check names the phase and task that builds it. Three references under `make-docs://system/reference/factory/workflows/` give the `build-then-review`, `lead-and-specialists`, and `staged-backlog` types, each with a software, a personal, and a business example described by capability. The catalog gains four `mcpResources` entries in the `workflow` profile and the reference include pattern `factory/workflows/*.md`. `packages/cli/src/rules.ts` lists the four paths, so a project that selects contract or reference projection gets them; no project gets them by default. No CLI operation, Store table, or Skill changed. An independent review asked for ten changes, and all are fixed: a lost tool always drifts, the smallest setup names its subagent capabilities, the claim timing and takeover follow the work queue rules, a name clash saves nothing, the limit is checked before defects go back, and the rule catalog gained 13 rows.

Validation passed: 7 new resource tests, with guards that were each shown to fail when broken, 53 default validation tests, the router check, the PRD authority and path-hygiene validators, and a project doctor check with no findings. `make-docs resource read` returns each URI with the template bytes. After the review fixes, the full suite has only the 3 known failures. An earlier run had one 15-second timeout in `tests/cli.test.ts` that passed six times alone, with and without this change. The resource count test now pins `workflow: 52, all: 67`. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-21-w30-r0-factory/01-factory-contract-and-workflow-types.md) | Closes T1–T12 and A1–A8. |
| [Evidence report](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | Records the P1 checks, the design decision map, and the new choices for owner review. |
| [W30 R0 backlog](../../../docs/work/2026-11-21-w30-r0-factory/00-index.md) | Links the evidence report. |
| [Factory contract](../../system/contracts/factory-contract.md) | Dogfood copy of the new contract. |
| [Workflow types](../../system/references/factory/workflows/build-then-review.md) | Dogfood copy of the first of three workflow types. |

### Maintainer

None this session.

### User

None this session.
