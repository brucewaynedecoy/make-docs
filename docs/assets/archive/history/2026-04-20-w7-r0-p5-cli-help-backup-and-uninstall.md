---
date: "2026-04-20"
coordinate: "W7 R0 P5"
---

# CLI Help, Backup, and Uninstall - Phase 5 Tests and Validation

## Changes

Implemented the final validation pass described in [the design](../archive/designs/2026-04-18-cli-help-backup-and-uninstall.md), [the Phase 5 plan](../archive/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/05-tests-and-validation.md), and [the Phase 5 backlog](../archive/work/2026-04-18-w7-r0-cli-help-backup-and-uninstall/05-tests-and-validation.md). This phase locked down the lifecycle command behavior with broader help assertions, end-to-end lifecycle tests, packed-install smoke coverage, and a manual dogfood run against a temporary target.

| Area | Summary |
| --- | --- |
| Help coverage | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) now asserts the top-level command descriptions, `backup --help`, `uninstall --help`, lifecycle `--yes` prompt-skipping text, and the destructive/non-destructive lifecycle language. |
| Lifecycle execution tests | [`packages/cli/tests/lifecycle.test.ts`](../../../packages/cli/tests/lifecycle.test.ts) covers manifest-backed audits, manifest-missing fallback behavior, `.backup/` exclusion, unmanaged descendant preservation, modified root instruction preservation, deterministic backup naming, `_home` mapping, non-destructive backup behavior, and backup-failure abort behavior for `uninstall --backup`. |
| Shared test helpers | [`packages/cli/tests/helpers.ts`](../../../packages/cli/tests/helpers.ts) now exposes reusable lifecycle setup helpers for installing a make-docs target, mocking home-directory resolution, and controlling TTY state. |
| Packed smoke validation | [`scripts/smoke-pack.mjs`](../../../scripts/smoke-pack.mjs) now packs the CLI, runs `init`, runs `backup --yes`, verifies backup contents, runs `uninstall --yes`, and verifies managed files are removed while custom files and `.backup/` survive. |
| Packed CLI packaging fix | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now uses a literal dynamic import for the uninstall module so tsup includes the emitted uninstall chunk in packed installs. The packed smoke test caught the previous missing-module failure. |
| Backup test stability | [`packages/cli/tests/backup.test.ts`](../../../packages/cli/tests/backup.test.ts) gives the same-day ordinal promotion test a longer timeout so the full concurrent Vitest suite does not fail on timing rather than behavior. |
| Verification | Passed `npm run build -w make-docs`, `npm test -w make-docs`, `bash scripts/check-instruction-routers.sh`, `bash scripts/check-wave-numbering.sh`, `node scripts/smoke-pack.mjs`, and a manual dogfood flow of `init -> backup -> uninstall --backup` against an isolated `/tmp` target. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/guides/agent/2026-04-20-w7-r0-p5-cli-help-backup-and-uninstall.md](./2026-04-20-w7-r0-p5-cli-help-backup-and-uninstall.md) | Session breadcrumb for the Phase 5 tests and validation pass, including lifecycle test coverage, packed smoke validation, packaging fix, and verification outcomes. |

### Developer

None this session.

### User

None this session.
