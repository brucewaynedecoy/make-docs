# W18 R2 Harness Plugin Substrate Workflow Bundles Work

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

Do not close W18 R2 while plugin installation is defaulted, while skill selection can imply plugin selection, while playbooks require plugins to be valid, or while plugin payloads and generated harness exposures cannot be distinguished by manifest, audit, backup, uninstall, dry-run, and migration output.
