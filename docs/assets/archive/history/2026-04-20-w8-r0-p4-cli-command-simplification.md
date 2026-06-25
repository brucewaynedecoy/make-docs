---
date: "2026-04-20"
coordinate: "W8 R0 P4"
---

# CLI Command Simplification - Phase 4 Tests and Validation

## Changes

Implemented Phase 4 of the Wave 8 CLI command simplification, framed by [the design](../archive/designs/2026-04-20-cli-command-simplification.md), [the Phase 4 plan](../archive/plans/2026-04-20-w8-r0-cli-command-simplification/04-tests-and-validation.md), and [the Phase 4 backlog](../archive/work/2026-04-20-w8-r0-cli-command-simplification/04-tests-and-validation.md). This phase closed the wave with final regression coverage review, packed CLI validation, stale-reference scanning, and the required build/test/smoke checks.

| Area | Summary |
| --- | --- |
| Regression coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) already covered the final command model: bare first install, bare existing-install sync, bare desired-state changes, interactive and non-interactive reconfigure, removed-surface migration errors, command help, and lifecycle flag boundaries. |
| Renderer coverage | [`packages/cli/tests/renderers.test.ts`](../../../packages/cli/tests/renderers.test.ts) already covered generated fallback guidance for the simplified reconfigure command. |
| Packed smoke | [`scripts/smoke-pack.mjs`](../../../scripts/smoke-pack.mjs) now runs the packed CLI twice with the bare command: once for first install and once for unchanged existing-install sync, asserting the sync does not stage conflicts before continuing through backup and uninstall validation. |
| Stale-reference scan | User-facing docs, developer docs, generated renderer text, and smoke validation were scanned and contain no stale public command examples. Remaining matches are limited to design/plan/work specifications and migration-error code/tests that intentionally document removed behavior. |
| Verification | `node --check scripts/smoke-pack.mjs`, `npm run build -w make-docs`, `npm test -w make-docs`, `node scripts/smoke-pack.mjs`, and stale-reference scans passed. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/guides/agent/2026-04-20-w8-r0-p4-cli-command-simplification.md](2026-04-20-w8-r0-p4-cli-command-simplification.md) | Agent session guide for Wave 8 Phase 4 tests and validation work. |

### Developer

None this session.

### User

None this session.
