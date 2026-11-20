---
title: "W28 R0 P1 Template Resources and Dogfood Closeout"
kind: "history"
status: "completed"
date: "2026-11-18"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P1"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P1 Template Resources and Dogfood Closeout

## Changes

Ships the PRD 14 coordinate selection and amendment rules in the Make Docs agent instructions. The Wave Model reference now holds the decision procedure, the significant deviation and revision Wave tests, the owner gates, and the `## Change History` entry shape. The planning, execution, PRD-maintenance, and lifecycle references, the output and design contracts, two prompts, four plan templates, the work index and phase templates, and the plans and work routers point to that procedure, and they no longer send every correction to a new revision or require a delta backlog. Each changed template-owned file is reseeded byte-for-byte into this repository's dogfood copy, and three user guides explain the new rules and the older revision pattern.

Validation passed: the PRD authority and path-hygiene validators, the instruction-router check, template and dogfood parity, `validate:defaults` (53 tests), the CLI build, and a built-CLI adoption dry run with 90 `noop` actions. The consistency test's pinned open-question list now includes Q-025. Two MCP stdio tests fail on Node v26 because of a `tsx` deprecation warning on stderr; that limit and the sandbox-only fixture failure are recorded in the evidence report. Performance and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/01-template-resources-and-dogfood.md) | Closes t1–t14 and A1–A9, A30. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the P1 checks and their limits. |
| [Wave Model](../../system/references/wave-model.md) | Holds the shipped decision procedure and Change History shape. |

### Maintainer

None this session.

### User

| Path | Description |
| --- | --- |
| [W/R/P concepts](../../../docs/assets/user/concepts-wave-revision-phase-coordinates.md) | Explains coordinate choice, Change History, and older records. |
| [Route choice](../../../docs/assets/user/workflows-choosing-the-right-route-for-your-project.md) | Replaces delta-backlog guidance with lineage amendment. |
| [Stage overview](../../../docs/assets/user/workflows-how-make-docs-stages-fit-together.md) | Replaces delta-backlog guidance with lineage amendment. |
