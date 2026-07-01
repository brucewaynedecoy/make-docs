---
title: "W18 R6 Playbook Contract and Model Work"
kind: "work"
status: "active"
coordinate: "W18 R6"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R6 plan and PRD contract."
  coordinate_handoff: "Carry W18 R6 into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/34-revise-playbook-contract-and-model.md"
---

# W18 R6 Playbook Contract and Model Work

## Purpose

Implement the deterministic Playbook contract and model required by [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md): the first-class contract document authored upstream and dogfooded, the single parsed Playbook model with its staged parser, the layered validator with the diagnostic catalog, the `playbook.validate` and `playbook.catalog` operation wiring, the default-Playbook migration to the `<slug>.playbook.md` form, and the D7 test and fixture coverage. The source chain is [the design](../../designs/2026-06-30-playbook-contract-and-model.md), [the W18 R6 plan](../../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md), and PRD 34, with [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md) and [PRD 33](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md) as still-constraining baselines.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-playbook-contract-authoring.md](./01-playbook-contract-authoring.md) | Author the normative Playbook contract upstream, dogfood it, and optionally project a reader-facing guide. |
| [02-playbook-model-and-parser.md](./02-playbook-model-and-parser.md) | Implement the Playbook model data shape and the staged fail-soft/fail-closed parser pipeline as a pure modular library. |
| [03-validator-and-diagnostics.md](./03-validator-and-diagnostics.md) | Implement layered validation and the diagnostic catalog in strict parity with the contract. |
| [04-operations-and-default-playbook-migration.md](./04-operations-and-default-playbook-migration.md) | Wire `playbook.validate` and `playbook.catalog` over the library and migrate the default Playbook to the suffix form upstream and downstream. |
| [05-tests-fixtures-and-verification.md](./05-tests-fixtures-and-verification.md) | Land the D7 test suite: per-diagnostic failing fixtures, coverage areas, the worked-example parse, and zero-error default-Playbook validation in both locations. |

## Usage Notes

- Read phases in order; they are dependency-ordered and later phases consume earlier deliverables.
- Author every Make Docs-owned resource upstream in `packages/docs/template/` first, then dogfood into `./.make-docs/` and `./docs/`; never author directly in the downstream instance (R-AUTH-1).
- Stay inside the design's four areas: document schema, workflow contract and step model, dependency registry, and model/parser/validator/diagnostics. Do not implement the Run Playbook state machine, the packaging compiler, harness adapters, conformance, the CLI reorganization, or the global store here (R-SCOPE-1).
- Reference Make Docs operations by stable registry identifier only; never hardcode CLI command strings in step invocations or library code (R-SCOPE-2).
- Treat the D6 fixed decisions — the eleven-heading spine, the authoritative-versus-narrative line, the `playbook` info string, the enumerations with the `delegated` default, the single-model rule, and the `operation`-versus-`command` split — as non-substitutable acceptance criteria, and leave the D6 implementer freedoms (data structures, module layout, diagnostic wording, version-string persistence) open.
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the W18 R6 plan and PRD contract, and the runner, packaging, and conformance work is gated on this model being parseable and enforceable.
- Coordinate Handoff: Carry `W18 R6` into phase history records and commits, adding the active P coordinate for each phase.
