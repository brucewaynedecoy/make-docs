# Phase 02: Shared Command and Runtime Contract

## Purpose

Define the implementation-ready contract for one user-facing `make-docs` package binary, package-runner execution, runtime/version disclosure, and required TypeScript MCP ownership.

## What to Build

- Specify the shared command semantics that TypeScript CLI and MCP surfaces must honor.
- Require package-runner and persistent-install paths to identify package/runtime and version clearly enough for support.
- Preserve the npm package as the canonical package entry point: `@brucewaynedecoy/make-docs` with the `make-docs` binary.
- Treat `npx`, `pnpm dlx`, and `bunx` / `bun x` as first-class remote execution targets.
- Keep secondary command aliases out of scope unless a future registry constraint requires a lookup-only package alias.
- Document the required MCP surface as TypeScript-owned and constrained by manifest, audit, backup, and uninstall safety.

## Key Decisions

- Persistent installs and package-runner execution must not create separate behavior models. The mitigation is shared operation-domain behavior and clear package/runtime disclosure.
- The TypeScript implementation remains the v2 source of truth for manifest, audit, backup, uninstall, conflict, deterministic operation, MCP, and skills-selection behavior.
- Shared contracts include `.make-docs/manifest.json`, package metadata needed for installed-project provenance, and user-visible command semantics.

## Acceptance Criteria

- The PRD change doc names one primary package binary, `make-docs`, for TypeScript package execution.
- The downstream backlog includes tasks to review and, if needed, update CLI help/version output and tests for runtime/version disclosure.
- No plan or backlog task introduces `makedocs`, `make-docs-js`, `make-docs-rs`, or another primary command alias.
- MCP implementation work is sequenced behind shared safety contracts, not ahead of them.

## Dependencies

- Phase 01 PRD reconciliation
- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
