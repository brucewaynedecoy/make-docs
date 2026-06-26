# Package and Deployment Boundaries Work Backlog

> In v2, work backlogs are directories. This file is the entry point for the W10 R1 package and deployment boundary implementation work. Phase detail lives in sibling `0N-<phase>.md` files.

## Purpose

This delta backlog turns the accepted W10 R1 plan and PRD 16 requirements into dependency-ordered implementation work. It covers the stable `make-docs` identity, TypeScript package runtime boundary, runtime/version disclosure review, dry-run package validation, package README/tarball reconciliation, and closeout evidence.

## W10 R7 Runtime Pivot

W10 R7 supersedes future-facing TypeScript/Rust boundary, same-command dual-runtime, and PATH-order runtime requirements in this completed backlog. Treat W10 R1 as historical package-boundary evidence; future implementation must follow [W10 R7](../2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md) and the W10 R8 implementation backlog.

The backlog assumes PRD reconciliation is already complete. Phase 01 is therefore a scope and requirements gate for implementation, not a request to recreate PRD 16 or rewrite the active PRD set.

Primary authority:

- [../../plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md](../../plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md)
- [../../prd/16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md)
- [../../designs/2026-06-19-package-and-deployment-boundaries.md](../../designs/2026-06-19-package-and-deployment-boundaries.md)

## Phase Map

| Phase | File | Builds |
| --- | --- | --- |
| 01 | [01-requirements-and-scope-gate.md](01-requirements-and-scope-gate.md) | Confirms PRD 16, risk-register state, no-go scope, and live TypeScript package/CLI surfaces before implementation starts. |
| 02 | [02-shared-command-and-runtime-contract.md](02-shared-command-and-runtime-contract.md) | Historical phase for the one `make-docs` command boundary, no default aliases, runtime/version disclosure, and superseded MCP/Rust safety sequencing. |
| 03 | [03-package-validation-and-release-boundaries.md](03-package-validation-and-release-boundaries.md) | Reconciles package README/tarball guidance and strengthens dry-run package, smoke-pack, no-default-skills, and release-channel validation. |
| 04 | [04-closeout-and-risk-validation.md](04-closeout-and-risk-validation.md) | Runs aggregate validation, updates PRD/risk/history only with evidence, records manual-test guidance, and keeps real publish actions blocked. |

## Usage Notes

- Work phases are dependency-ordered. Start with Phase 01 even though PRD reconciliation is already complete, because it verifies the implementation scope and current worktree before source edits.
- Do not introduce `makedocs`, `make-docs-js`, `make-docs-rs`, or another primary command alias.
- Do not perform real npm publish, registry reservation, Homebrew tap, Crates publish, git tag, or release-promotion actions unless the user explicitly expands scope in a later implementation turn.
- Treat `packages/cli/package.json`, `packages/cli/src/cli.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, and `scripts/smoke-pack.mjs` as the current TypeScript implementation authority.
- Keep Q-001, Q-007, and Q-012 open unless a later accepted design resolves skills delivery, remote-source integrity, or shared plugin/skill install behavior.
- Close D-006, R-003, R-006, or R-014 only when implementation evidence proves the specific risk is resolved.

## Intended Follow-On

Use the implementation loop as the next step. Execute the phase files in order, preserve task checkboxes in place, and run the validation stack from Phase 04 before closing the wave.
