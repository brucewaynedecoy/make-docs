# Phase 02: Shared Command and Runtime Contract

## Purpose

Implement or verify the shared command contract that keeps npm and future Rust distributions aligned around one primary `make-docs` command.

## Overview

This phase covers user-facing command semantics, no default aliases, runtime/version disclosure, and MCP startup sequencing. The TypeScript CLI remains the current implementation source of truth until a later Rust parity implementation plan lands.

## Source PRD Docs

- [../../prd/16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Public Command Boundary

### Tasks

- [x] t1: Verify the only primary executable in `packages/cli/package.json` is `make-docs`.
- [x] t2: Verify `packages/cli/src/cli.ts` exposes the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall` without adding command aliases.
- [x] t3: Add or update tests that prevent `makedocs`, `make-docs-js`, `make-docs-rs`, or other default command aliases from becoming accepted public commands.
- [x] t4: Review root and package README command examples so they use the scoped npm package plus the installed `make-docs` binary consistently.
- [x] t5: Preserve existing removed-command behavior for `init`, `update`, `--reconfigure`, and `--skills` unless a separate accepted design changes it.

### Acceptance criteria

- The public command model has one primary executable: `make-docs`.
- No implementation or doc change introduces a default compatibility alias.
- Tests or existing assertions cover alias rejection or absence.
- User-facing docs distinguish scoped package lookup from installed command name.

### Dependencies

- Phase 01 scope gate
- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/tests/cli.test.ts`
- `README.md`
- `packages/cli/README.md`

## Stage 2 - Runtime, Version, and MCP Boundary

### Tasks

- [x] t6: Review current help/version behavior and decide whether TypeScript runtime/version disclosure needs an immediate update before Rust exists.
- [x] t7: If runtime/version disclosure changes, update CLI output and tests so support can distinguish package version and runtime implementation.
- [x] t8: Document that npm and future Rust distributions are alternatives selected by PATH order, not commands users should normally chain together.
- [x] t9: Keep MCP startup work sequenced behind manifest, audit, backup, and uninstall safety; do not make TypeScript the long-term MCP runtime owner.
- [x] t10: Verify manifest provenance and audit-related docs/tests still describe TypeScript as current authority. W10 R7 later superseded the Rust parity target with TypeScript CLI/MCP ownership.

### Acceptance criteria

- Help/version behavior is either confirmed sufficient for the current TypeScript-only state or updated with tests.
- Runtime/version wording supports future side-by-side npm and Rust installs.
- MCP startup ownership remains future-Rust-oriented without bypassing current safety contracts.
- Manifest, audit, backup, and uninstall contracts remain shared-product constraints.

### Dependencies

- Stage 1 public command boundary
- `packages/cli/src/cli.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)

## Implementation Notes

- `packages/cli/package.json` exposes only the `make-docs` binary for the scoped npm package `@brucewaynedecoy/make-docs`.
- `packages/cli/src/cli.ts` keeps the current public command taxonomy to the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall`; no compatibility aliases were added.
- `packages/cli/tests/cli.test.ts` now asserts top-level help omits `makedocs`, `make-docs-js`, and `make-docs-rs`, and rejects each alias as an unknown argument.
- `README.md` and `packages/cli/README.md` now distinguish scoped npm lookup from the installed `make-docs` executable, and record that future npm/Rust implementations are selected by shell `PATH` order rather than chained together.
- Current TypeScript-only help/version behavior was left unchanged. PRD 16 and PRD 25 require runtime/version disclosure before dual-runtime npm/Rust support is acceptable; no Rust implementation exists in this phase.
- PRD 16 and PRD 25 keep MCP startup sequenced behind shared manifest, provenance, audit, backup, and uninstall contracts; this phase did not move long-term MCP runtime ownership to TypeScript.
- UAT/manual testing remains deferred until the full W10 R1 wave is complete.
