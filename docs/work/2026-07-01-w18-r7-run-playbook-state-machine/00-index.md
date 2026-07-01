---
title: "W18 R7 Run Playbook State Machine Work"
kind: "work"
status: "active"
coordinate: "W18 R7"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R7 plan and PRD contract."
  coordinate_handoff: "Carry W18 R7 into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/35-revise-run-playbook-state-machine.md"
---

# W18 R7 Run Playbook State Machine Work

## Purpose

Implement the deterministic Run Playbook state machine required by [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md): the run-state record relocated to the global store, the `playbook.start`/`status`/`next`/`advance`/`gate`/`resume`/`close` progression operations, execution by step mode with the delegated default, digest-aware resume that blocks by default, the nested/parallel/unattended guardrails, export/import portability, three-tier degradation, and the D10 test suite including the no-repo-run-state assertion. The source chain is [the design](../../designs/2026-07-01-run-playbook-state-machine.md), [the W18 R7 plan](../../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md), and PRD 35, with [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md), [PRD 34](../../prd/34-revise-playbook-contract-and-model.md), [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md), [PRD 24](../../prd/24-revise-configuration-convention-overlay.md), and [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md) as still-constraining baselines.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-run-state-record-and-global-store-storage.md](./01-run-state-record-and-global-store-storage.md) | Define the run-state record and store it in the global store keyed by project id plus run id, removing every repository run-state write path. |
| [02-progression-operations.md](./02-progression-operations.md) | Implement the seven progression operations with their read-versus-mutate classification, registry identifiers, and CLI plus MCP surfaces. |
| [03-execution-modes-and-digest-aware-resume.md](./03-execution-modes-and-digest-aware-resume.md) | Implement deterministic, delegated, and manual step execution inside `playbook.advance` and the digest-checked resume that blocks on mismatch. |
| [04-guardrails-portability-and-three-tiers.md](./04-guardrails-portability-and-three-tiers.md) | Enforce the nested, parallel, output-surface, and unattended guardrails, add run export/import, and prove the three-tier degradation guarantee. |
| [05-tests-and-verification.md](./05-tests-and-verification.md) | Land the D10 test suite: per-operation transitions, resume both ways, all three modes, guardrail stops, and the no-repo-run-state assertion. |

## Usage Notes

- Read phases in order; they are dependency-ordered and later phases consume earlier deliverables.
- Cross-design sequencing dependency: Phase 1 storage work is gated on the global store, its concurrency model, and the stable project identifier owned by the [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) lineage (design planned as W18 R10); this backlog defines what run state requires of the store and never the store schema, locking, recovery, or identifier scheme (R-STORE-3, R-SCOPE-1).
- Consume the W18 R6 Playbook model, step dimensions, `delegated` default, and eight-value shared status vocabulary from [PRD 34](../../prd/34-revise-playbook-contract-and-model.md) unchanged; never re-parse Playbook Markdown or invent a parallel status vocabulary (R-STATE-2).
- Inherit the W18 R4 resolver identity, orchestration policy fields, canonical capability identifiers, `harnessCapabilities` config surface, and unknown-capability handling unchanged from [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md) and [PRD 24](../../prd/24-revise-configuration-convention-overlay.md) (R-SCOPE-2, R-KEEP-1).
- Address every progression operation by its stable operation-registry identifier surfaced under `run playbook` and as MCP tools; the registry materialization and CLI tree are owned by the CLI command reorganization lineage (R-SCOPE-1, R-OP-1).
- The runner is ordinary operation-core source code under `packages/cli/`; it is not a dogfooded template asset, and any Make Docs-owned documentation or config-schema resource this work implies is authored upstream in `packages/docs/template/` first per the maintainer dogfooding rule.
- Treat the D9 fixed decisions — global-store run state with no repository writes, the shared status vocabulary, the operation set with its read-versus-mutate classification, digest-blocked resume, and the D1 preserved decisions — as non-substitutable acceptance criteria, and leave the D9 implementer freedoms (run-state serialization, engine internals, evidence format, migration algorithm) open.
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase, deferring Phase 1 storage tasks until the global store lands if it is not yet available.
- Why: The backlog is the implementation queue derived from the W18 R7 plan and PRD contract, and plugins, workflow bundles, and packaging all delegate execution semantics to this runner.
- Coordinate Handoff: Carry `W18 R7` into phase history records and commits, adding the active P coordinate for each phase.
