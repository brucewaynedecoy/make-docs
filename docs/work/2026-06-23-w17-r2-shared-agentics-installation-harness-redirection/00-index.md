# W17 R2 Shared Agentics Installation Harness Redirection Work Backlog

## W9 R4 Prerequisite

Before executing this backlog, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). W17 R2 must place shared agentic assets under `.make-docs/**` system-resource ownership and avoid deriving harness routing from pre-pivot `docs/assets/{prompts,references,templates}/**` paths.

## Purpose

Implement the requirements captured in [28-revise-shared-agentics-installation-harness-redirection.md](../../prd/28-revise-shared-agentics-installation-harness-redirection.md) and planned in [W17 R2 Shared Agentics Installation Harness Redirection Plan](../../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md).

## Source Inputs

- [Shared Agentics Installation and Harness Redirection](../../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [W17 R2 plan overview](../../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [Risk register](../../prd/03-open-questions-and-risk-register.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md) | Keep PRD/risk updates aligned with the shared-agentics contract. |
| P2 | [02 Shared Store and Stub Generation](02-shared-store-and-stub-generation.md) | Implement shared payload placement and generated harness stubs. |
| P3 | [03 Manifest Audit and Migration](03-manifest-audit-and-migration.md) | Add ownership records, classification, and migration behavior. |
| P4 | [04 Package Validation and Closeout](04-package-validation-and-closeout.md) | Prove package, lifecycle, cross-platform, and no-default-skills behavior. |

## Acceptance Gate

Do not close W17 R2 while selected skill payloads are duplicated as authoritative content per harness, while symlinks are required for correctness, or while bare installs write selected agentic artifacts.
