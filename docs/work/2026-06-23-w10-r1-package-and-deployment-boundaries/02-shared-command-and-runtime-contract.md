# Phase 02: Shared Command and Runtime Contract

## Purpose

Implement or verify the shared command contract that keeps npm and future Rust distributions aligned around one primary `make-docs` command.

## Overview

This phase covers user-facing command semantics, no default aliases, runtime/version disclosure, and MCP startup sequencing. The TypeScript CLI remains the current implementation source of truth until a later Rust parity implementation plan lands.

## Source PRD Docs

- [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Stage 1 - Public Command Boundary

### Tasks

- [ ] t1: Verify the only primary executable in `packages/cli/package.json` is `make-docs`.
- [ ] t2: Verify `packages/cli/src/cli.ts` exposes the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall` without adding command aliases.
- [ ] t3: Add or update tests that prevent `makedocs`, `make-docs-js`, `make-docs-rs`, or other default command aliases from becoming accepted public commands.
- [ ] t4: Review root and package README command examples so they use the scoped npm package plus the installed `make-docs` binary consistently.
- [ ] t5: Preserve existing removed-command behavior for `init`, `update`, `--reconfigure`, and `--skills` unless a separate accepted design changes it.

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

- [ ] t6: Review current help/version behavior and decide whether TypeScript runtime/version disclosure needs an immediate update before Rust exists.
- [ ] t7: If runtime/version disclosure changes, update CLI output and tests so support can distinguish package version and runtime implementation.
- [ ] t8: Document that npm and future Rust distributions are alternatives selected by PATH order, not commands users should normally chain together.
- [ ] t9: Keep MCP startup work sequenced behind manifest, audit, backup, and uninstall safety; do not make TypeScript the long-term MCP runtime owner.
- [ ] t10: Verify manifest provenance and audit-related docs/tests still describe TypeScript as current authority until Rust parity lands.

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
