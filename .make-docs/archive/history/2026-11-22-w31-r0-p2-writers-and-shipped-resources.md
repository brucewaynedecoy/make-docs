---
title: "W31 R0 P2 Writers and Shipped Resources Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W31 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W31 R0 P2 Writers and Shipped Resources Closeout

## Changes

Makes every shipped file and CLI result that names a task ID write `T`. Upstream in `packages/docs/template/`, the work phase template, the output contract, the execution workflow, the wave model, the human experience reference, and six docs and work routers now write `T1`. The wave model and the output contract say that readers accept a lower-case `t` as the same ID. The nine files that this repository installs were reseeded byte for byte, and the bundled CLI template was refreshed. The work phase parser now gives each task `id` as `T` in `run` results, and the phase check warnings name `T`. The work store ready order names the task part `T`. The decompose-codebase Skill template, references, and validator errors use `T`. The migrated operations inventory names the new form. No backlog was rewritten. P4 does that with the doctor.

Validation passed: 5 new writer tests, the shipped-file search, the dogfood parity check, 53 template validation tests, the router check, 46 validator tests, and the type check. Expectations in five existing test files changed from `t` to `T`, with their inputs unchanged. The full suite has 3 failures that exist without this phase: two Node v26 stderr warnings and one sandbox-only fixture. Without the CLI changes, the 3 new CLI tests fail. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/02-writers-and-shipped-resources.md) | Closes t1–t5 and A4–A6. |
| [Evidence report](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/evidence.md) | Records the P2 checks, results, changed test expectations, and limits. |
| [Migrated operations inventory](../../../docs/assets/project/migrated-operations-inventory.md) | Names the `- [ ] TN: ...` task form. |

### Maintainer

None this session.

### User

None this session.
