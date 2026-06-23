# Phase 02: Shared Command and Runtime Contract

## Purpose

Define the implementation-ready contract for one user-facing `make-docs` command across npm and future Rust distributions, including runtime/version disclosure and the ownership transition for MCP startup behavior.

## What to Build

- Specify the shared command semantics that both TypeScript and Rust implementations must honor.
- Require both implementations to identify runtime and version in help/version output once both exist.
- Preserve the current npm package as the canonical `npx` and npm entry point: `@brucewaynedecoy/make-docs` with the installed `make-docs` binary.
- Define the Rust CLI as the future standalone deployment artifact for Homebrew and Crates while keeping the installed command name `make-docs`.
- Keep secondary command aliases out of scope unless a future registry constraint requires a lookup-only package alias.
- Document the MCP startup transition: TypeScript may bootstrap, configure, or bridge during transition; Rust owns long-term startup runtime without bypassing manifest, audit, backup, or uninstall safety.

## Key Decisions

- PATH order is an accepted user environment concern when both distributions are installed. The mitigation is clear runtime/version disclosure and documentation that npm and Rust distributions are alternatives, not chained commands.
- The TypeScript implementation remains the current source of truth for manifest, audit, backup, uninstall, conflict, and skills-selection behavior until a later implementation plan lands Rust parity.
- Shared contracts include `.make-docs/manifest.json`, package metadata needed for installed-project provenance, and user-visible command semantics.

## Acceptance Criteria

- The PRD change doc names one primary executable, `make-docs`, for both implementations.
- The downstream backlog includes tasks to review and, if needed, update CLI help/version output and tests for runtime/version disclosure.
- No plan or backlog task introduces `makedocs`, `make-docs-js`, `make-docs-rs`, or another primary command alias.
- MCP startup ownership work is sequenced behind shared safety contracts, not ahead of them.

## Dependencies

- Phase 01 PRD reconciliation
- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
