# W10 R8 TypeScript CLI Operation Domains and MCP Runtime Work Backlog

## Source Plan

- [Plan Overview](../../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md)
- [W10 R7 Runtime Pivot](../2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md)

## W10 R7 Prerequisite

Apply W10 R7 before executing this backlog. TypeScript is the v2 runtime authority, MCP must ship in v2, Rust is not a v2 prerequisite, and W16 R3 is operation-boundary proof rather than final source organization.

## Work Phases

1. [Operation Domain Architecture](01-operation-domain-architecture.md)
2. [CLI Operation Refactor](02-cli-operation-refactor.md)
3. [TypeScript MCP Runtime](03-typescript-mcp-runtime.md)
4. [Remote Execution and Package Validation](04-remote-execution-and-package-validation.md)
5. [Closeout and Support Evidence](05-closeout-and-support-evidence.md)

## Guardrails

- Preserve existing `make-docs operations ...` behavior.
- Do not add Rust work.
- Do not build MCP as a separate behavior model.
- Do not extend the current monolithic operations shape for new deterministic behavior.
