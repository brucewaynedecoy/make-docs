---
title: "W28 R0 P7 Schema Version and Completion Rules"
kind: "history"
status: "completed"
date: "2026-11-19"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P7"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P7 Schema Version and Completion Rules

## Changes

Applies the owner's decisions on the PR #64 review questions as a revision Phase of P2. The backlog snapshot moves to schema version 2, and the CLI and the dependency-free Skill bundle refuse a version 1 snapshot with an "upgrade the make-docs CLI to 2.0.9 or later" message. A phase is complete only when it is committed, with deployment as extra evidence, and the glossary has one Phase complete definition that requires both the PRD 45 and the PRD 14 conditions. The agent judges prior completion from history. A25 is recorded as an approved caveat that explains Bun as a tested user package runner. The package is 2.0.9, with a reviewed candidate digest from two matching builds.

Validation passed: 535 focused tests, `npm test` apart from the 3 known environment failures, `validate:defaults`, the build, `smoke:pack:local`, and two candidate packs with SHA-256 `8b9e48838ca989e6c41e9e8cd32f9bfaef160c32448b3aa55db17e110a3fa732`. The installed backlog-review Skill copy trails the source until an owner-approved Skill sync. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P7 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/07-schema-version-and-completion-rules.md) | Closes t1–t5 and A42–A44. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the decisions, tests, and both digests. |
| [PRD 51](../../../docs/prd/51-backlog-review-and-reporting.md) | Snapshot schema version 2. |
| [PRD 04](../../../docs/prd/04-glossary.md) | One Phase complete definition. |

### Maintainer

| Path | Description |
| --- | --- |
| [Report model](../../../packages/skills/backlog-review/references/report-model.md) | The embedded snapshot uses version 2. |

### User

None this session.
