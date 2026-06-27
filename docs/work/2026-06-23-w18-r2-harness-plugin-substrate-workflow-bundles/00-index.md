# W18 R2 Harness Plugin Substrate Workflow Bundles Work

## W10 R7 Runtime Pivot

Before executing plugin lifecycle or operation delegation work, apply W10 R7: TypeScript owns v2 CLI/MCP runtime behavior, MCP is required, Rust is not a v2 prerequisite, and W10 R8 owns modular operation-domain/MCP implementation.

## W9 R5 Prerequisite

Before executing this backlog, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md). W18 R2 plugin substrate and workflow bundles must consume `.make-docs/**` system-resource ownership and `docs/assets/{archive,artifacts,library,playbooks}/**` plus on-demand `docs/assets/archive/history/**` project-asset ownership before selecting shipped bundle paths.

## W17 R4 Lifecycle State Prerequisite

Before implementing plugin backup, uninstall, migration, or cleanup behavior, apply [W17 R4 Lifecycle Backup State and Agentics Pruning](../2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-index.md). W18 R2 plugin lifecycle work must use `.make-docs/backup/**` for new backup writes, protect legacy root `.backup/**`, and prune empty managed `.make-docs/agentics/**` directories only when audit proves no unmanaged descendants remain.

## Purpose

Implement the v2 plugin substrate and productized workflow bundle metadata described by PRD 30.

## Source Chain

- Design: [docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- Plan: [docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- PRD: [docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md) | Keep PRD and risk entries aligned with plugin substrate and bundle metadata. |
| P2 | [02 Plugin Substrate and Manifest Records](02-plugin-substrate-and-manifest-records.md) | Add plugin payload, exposure, metadata, manifest, and fixture contracts. |
| P3 | [03 Plugin Lifecycle and Safety](03-plugin-lifecycle-and-safety.md) | Implement explicit selection, update, audit, backup, uninstall, and migration safety. |
| P4 | [04 Workflow Bundles and Support Validation](04-workflow-bundles-and-support-validation.md) | Add bundle metadata, package proof, conformance gates, and closeout validation. |

## Acceptance Gate

Do not close W18 R2 while plugin installation is defaulted, while skill selection can imply plugin selection, while playbooks require plugins to be valid, or while plugin payloads, native exposures, and plugin-specific adapters cannot be distinguished by manifest, audit, backup, uninstall, dry-run, and migration output.
