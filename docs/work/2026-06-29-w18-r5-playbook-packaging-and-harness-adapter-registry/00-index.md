# W18 R5 Playbook Packaging and Harness Adapter Registry Work

## Purpose

Implement the required v2 Playbook packaging and harness adapter registry capability described by PRD 33.

## Prerequisite Note

This backlog is required W18 authority before W18 R1, W18 R2, or W18 R3 implementation proceeds further. W18 R5 does not replace those backlogs: it constrains their Playbook metadata, plugin substrate, workflow bundle, generated output, support-claim, and guide behavior so they remain packageable.

Implementation phases may depend on W18 R1 runner primitives and W18 R2 plugin substrate primitives as they land. If a phase cannot safely implement a writer because the upstream runner or plugin substrate is missing, the worker must leave a narrow deferred task in this backlog rather than inventing a second behavior model in W18 R1 or W18 R2.

## Source Chain

- Design: [../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- Plan: [../../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md](../../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md)
- Primary PRD: [../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- Supporting PRDs: [../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md#requirements), [../../prd/30-plugin-substrate-and-workflow-bundles.md](../../prd/30-plugin-substrate-and-workflow-bundles.md), [../../prd/28-shared-agentics-installation-and-harness-exposure.md](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [../../prd/20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md), [../../prd/30-plugin-substrate-and-workflow-bundles.md](../../prd/30-plugin-substrate-and-workflow-bundles.md#update-migration-audit-backup-and-uninstall)

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-and-schema-foundation.md](01-authority-and-schema-foundation.md) | Establish package-plan, generated-output, and adapter-registry schemas while preserving W18 R1/R2/R3 guardrails. |
| [02-package-planner-and-review-flow.md](02-package-planner-and-review-flow.md) | Implement package-plan generation, deterministic validation, semantic-review stops, and CLI/MCP dry-run surfaces. |
| [03-harness-adapter-registry-and-surface-resolution.md](03-harness-adapter-registry-and-surface-resolution.md) | Implement modular harness adapters, output-kind support, surface selection, preconditions, and future-harness fixtures. |
| [04-output-writers-lifecycle-and-validation.md](04-output-writers-lifecycle-and-validation.md) | Implement plugin/skills-bundle writers, lifecycle safety, package validation, conformance hooks, docs, and closeout. |

## Usage Notes

- Read phases in order.
- Skip UAT until the full wave is complete.
- Treat `plugin` and `skills-bundle` as output kinds, not mutually exclusive product strategies.
- Treat `native`, `agents-standard`, and `auto` as surfaces or surface-selection modes, not harness ids.
- Keep Playbooks valid and runnable without packaging.
- Keep workflow bundles as product capability groupings; do not equate each bundle family with a plugin id.
- Do not write generated outputs without an accepted package plan or a proven fully deterministic safe plan.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the W18 R5 plan and PRD contract.
- Coordinate Handoff: Carry `W18 R5` into phase history records and commits, adding the active P coordinate for each phase.
