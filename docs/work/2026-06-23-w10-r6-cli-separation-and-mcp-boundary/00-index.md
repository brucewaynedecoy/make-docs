# W10 R6 CLI Separation and MCP Boundary Work Backlog

## W10 R7 Runtime Pivot

W10 R7 supersedes W10 R6's future-facing Rust runtime ownership, same-command npm/Rust behavior, PATH-order runtime selection, and optional/deferred MCP assumptions. This backlog remains completed evidence; future implementation must follow [W10 R7](../2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md) and [W10 R8](../2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md).

## W9 R5 Prerequisite

Before executing this backlog, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md). W10 R6 must route CLI and MCP path behavior through `.make-docs/**` system resources and `docs/assets/{archive,artifacts,library,playbooks}/**` plus on-demand `docs/assets/archive/history/**` project assets, not W9 R4's superseded guide/breadcrumb targets or earlier top-level archive/artifact/tool-resource assumptions.

## Source Plan

- [Plan Overview](../../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md)
- [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md)

## Work Phases

1. [Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md)
2. [CLI Runtime and Command Boundary](02-cli-runtime-and-command-boundary.md)
3. [MCP Parity and Permissions](03-mcp-parity-and-permissions.md)
4. [Package Validation and Closeout](04-package-validation-and-closeout.md)

## Guardrails

- Preserve the no-command npm workflow.
- Do not reintroduce `init`, `update`, `--reconfigure`, or `--skills`.
- Keep MCP read-first and plan-first until a permission model lands.
- Route MCP and plugin behavior through canonical contracts, not configured labels.
- Keep deterministic script replacement dependent on CLI/shared-core equivalents.
