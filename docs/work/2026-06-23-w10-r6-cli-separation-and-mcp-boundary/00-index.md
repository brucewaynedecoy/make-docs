# W10 R6 CLI Separation and MCP Boundary Work Backlog

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
