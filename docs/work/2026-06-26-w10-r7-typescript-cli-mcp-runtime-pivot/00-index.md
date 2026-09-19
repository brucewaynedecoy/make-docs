# W10 R7 TypeScript CLI and MCP Runtime Pivot Work Backlog

## Source Plan

- [Plan Overview](../../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md)
- [TypeScript CLI and MCP Runtime Pivot Design](../../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)

## W10 R7 Supersession

W10 R7 supersedes future-facing Rust runtime ownership, same-command npm/Rust runtime behavior, PATH-order runtime selection, and optional/deferred MCP assumptions. TypeScript is the v2 runtime authority, MCP is required for v2, and W16 R3 remains completed operation-boundary proof rather than final source organization.

## Work Phases

1. [Authority Capture and Supersession Design](01-authority-capture-and-supersession-design.md)
2. [PRD and Risk Register Reconciliation](02-prd-and-risk-register-reconciliation.md)
3. [Plan and Work Guardrails](03-plan-and-work-guardrails.md)
4. [Follow-On Implementation Backlog](04-follow-on-implementation-backlog.md)
5. [Validation and Closeout](05-validation-and-closeout.md)

## Guardrails

- Do not implement code modularization or MCP server behavior in W10 R7.
- Do not reopen W16 R3.
- Do not leave Rust/PATH-order wording as future implementation authority.
- Do not treat MCP as optional for v2.
