---
title: "W29 R0 P1 Record Model and Rule Catalog Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P1"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W29 R0 P1 Record Model and Rule Catalog Closeout

## Changes

Adds the work store contract that later W29 phases build on. New zod schemas define work units, claims, the per-checkout sync ledger, sync conflicts, the queue requests, the tracker connection, and the `work` config block, with upper-case `T` task IDs. A new grammar parses `make-docs://project/<project>/tasks/` and `.../backlog/` URIs, which always name the project, and checks the short project name form. A new rule catalog holds 39 rules, nine `run work` operations, the sync table, the settle choices, the wait reason wording, the claim policy, the dependency bullet patterns, and a field register tied to PRD 38. A fixture matrix of 55 cases proves each rule. At the owner's direction, quick items live only in the work store, use plain numbers such as `7`, and `run work add` adds them.

Validation passed: 23 contract tests, the type check, and the PRD authority and path-hygiene validators. The full suite has four failures that exist without this phase: three Node v26 stderr warnings and one sandbox-only fixture. Two independent reviews found high and medium findings, and all were fixed. PRD 52, 38, 24, 17, 21, 25, 39, 53, and 04 and register D-061 match the contract. Register D-062 asks for a full Store table, event, and data maintenance review, and D-063 plans the task ID case Wave. Performance and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-21-w29-r0-work-store/01-record-model-and-rule-catalog.md) | Closes t1–t10 and A1–A4. |
| [Evidence report](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md) | Records the P1 checks, reviews, and limits. |
| [W29 R0 backlog](../../../docs/work/2026-11-21-w29-r0-work-store/00-index.md) | Records the quick item scope edit in Change History. |
| [PRD 52](../../../docs/prd/52-work-store-and-work-queue.md) | Holds the tightened queue, sync, quick item, and project URI rules. |

### Maintainer

None this session.

### User

None this session.
