# W18 R3 Coverage Pass Extensions Adversarial Review Work

## Status — Deferred and Split (2026-07-01)

This backlog is unimplemented (all phases untouched, no history record) and is deferred pending the Playbook, CLI, and state-management architecture designed on 2026-06-30 and 2026-07-01. Do not implement this backlog as written. See risk-register entry [R-020](../../prd/03-open-questions-and-risk-register.md).

Disposition:

- The adversarial-review contract work is architecture-independent. P2 (adversarial-pass contract) is surface-neutral and needs no rewrite; P1 (requirements and register reconciliation) should fold into the reconciliation pass for the new design set rather than run standalone against a shifting PRD set.
- The surface-exposure and closeout work depends on the operation registry, the run-playbook state machine, the packaging and adapter pipeline, and conformance. P3 (optional surface exposure) and P4 (closeout) are deferred until those land, and P3 must be rewritten to target the new surfaces, with a Playbook as the recommended surface. Exposing adversarial review as a Playbook also dogfoods the new run, package, and install pipeline.

The relevant new designs are [Playbook Contract and Model](../../designs/2026-06-30-playbook-contract-and-model.md), [Run Playbook State Machine](../../designs/2026-07-01-run-playbook-state-machine.md), [Packaging Compiler and Harness Adapters](../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), [Playbook and Package Conformance](../../designs/2026-07-01-playbook-and-package-conformance.md), [Global Store and Project State](../../designs/2026-07-01-global-store-and-project-state.md), and [CLI Command Reorganization and Operation Registry](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md).

## W9 R5 Prerequisite

Before executing this backlog, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md). W18 R3 coverage-pass extensions must use `.make-docs/contracts/system/coverage-pass-contract.md`, `.make-docs/references/system/prompts/**`, and `docs/assets/archive/history/**` instead of W9 R4's superseded `docs/assets/breadcrumbs/**` target or pre-pivot `docs/assets/references/**`, `docs/assets/prompts/**`, or `docs/assets/history/**` assumptions.

## W18 R4 Run Playbook Prerequisite

Before executing any adversarial-review surface that uses a playbook, plugin workflow bundle, CLI action, MCP tool, or harness-assisted long-running execution, apply [W18 R4 Run Playbook Orchestration and Harness Capabilities](../2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md). W18 R3 remains optional coverage-pass work, but any runner-like exposure must consume W18 R4 resolver, capability, run-state, nested-run, and concurrency behavior.

## W18 R5 Playbook Packaging Prerequisite

Before executing this backlog for any packaged adversarial-review surface, apply [W18 R5 Playbook Packaging and Harness Adapter Registry](../2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md). W18 R3 workers must not package adversarial review as a plugin, skills bundle, or generated harness entry without W18 R5 package-plan review, adapter-selected surfaces, source/generated provenance, lifecycle ownership, and conformance evidence.

## Purpose

Implement adversarial review as an optional coverage-pass extension described by PRD 31.

## Source Chain

- Design: [docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- Plan: [docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- PRD: [docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md](../../prd/31-revise-coverage-pass-extensions-adversarial-review.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md) | Keep PRD and risk entries aligned with optional adversarial review. |
| P2 | [02 Adversarial Pass Contract](02-adversarial-pass-contract.md) | Add candidate record, verdict mapping, persona, and history rules. |
| P3 | [03 Optional Surface Exposure](03-optional-surface-exposure.md) | Select and implement only the requested prompt, playbook, plugin, CLI, MCP, or conformance surface. |
| P4 | [04 Template History Validation Closeout](04-template-history-validation-closeout.md) | Prove template/package parity, history idempotency, validation, and support-claim behavior. |

## Acceptance Gate

Do not close W18 R3 while adversarial review is mandatory, while it installs or runs by default, while `covered` or `rejected` candidates can disappear without reasons, or while a selected shipped asset bypasses template-first source-of-truth order.
