# W18 R4 Run Playbook Orchestration and Harness Capabilities Work

## Purpose

Implement the W18 R4 planning correction so W18 R1, W18 R2, and W18 R3 can proceed with a deterministic Run Playbook orchestration contract.

## Prerequisite Note

This backlog is a blocker for W18 R1, W18 R2, and W18 R3. Complete W18 R4 before implementing those backlogs so playbook runner, plugin bundle, and adversarial-review work inherit the same resolver, capability, state, nested-run, and concurrency rules.

This directory is the blocking implementation queue created by the planning correction. Its existence does not prove the resolver, config schema, run-state writer, nested-run guard, or concurrency checks have been built; those are complete only after the phases below are executed and closed.

## Source Chain

- Design: [../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- Plan: [../../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md](../../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md)
- Primary PRDs: [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md#requirements), [../../prd/30-plugin-substrate-and-workflow-bundles.md](../../prd/30-plugin-substrate-and-workflow-bundles.md), [../../prd/24-project-configuration-and-convention-overlay.md](../../prd/24-project-configuration-and-convention-overlay.md)

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Establish W18 R4 authority and reconcile PRDs/risk register. |
| [02-resolver-and-stack-disambiguation.md](02-resolver-and-stack-disambiguation.md) | Implement resolver/catalog requirements and stack disambiguation. |
| [03-harness-capabilities-and-config.md](03-harness-capabilities-and-config.md) | Implement capability config contract and discovery guidance. |
| [04-run-state-nesting-and-concurrency.md](04-run-state-nesting-and-concurrency.md) | Implement run-state, resume, nested-run, and concurrency requirements. |
| [05-guardrails-validation-history-and-commit.md](05-guardrails-validation-history-and-commit.md) | Add W18 guardrails, run validation, create history, and close locally. |

## Usage Notes

- Read phases in order.
- Skip UAT until the full wave is complete.
- Do not implement package code in Phase 1 unless a later user request explicitly expands this docs-only correction.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the W18 R4 plan and PRD contract.
- Coordinate Handoff: Carry `W18 R4` into phase history records and commits, adding the active P coordinate for each phase.
