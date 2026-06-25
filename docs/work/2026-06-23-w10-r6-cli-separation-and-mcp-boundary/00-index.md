# W10 R6 CLI Separation and MCP Boundary Work Backlog

## W9 R4 Prerequisite

Before executing this backlog, apply [W9 R4 v2 Documentation Asset IA Hard Move](../2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-index.md). W10 R6 must route CLI and MCP path behavior through `.make-docs/**` system resources and `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` project assets, not pre-pivot `docs/artifacts/**`, top-level `docs/archive/**`, `docs/assets/history/**`, or `docs/assets/{prompts,references,templates}/**` assumptions.

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
