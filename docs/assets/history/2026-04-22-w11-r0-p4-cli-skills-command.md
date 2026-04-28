---
date: "2026-04-22"
coordinate: "W11 R0 P4"
repo: "make-docs"
branch: "main"
status: "complete"
summary: "Closed the `make-docs skills` wave with targeted validation tests, packed smoke coverage, and final dry-run checks."
---

# CLI Skills Command - Phase 4 Tests and Validation

## Changes

Implemented Phase 4 of the Wave 11 CLI skills command work, framed by [the Phase 4 plan](../archive/plans/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md) and [the Phase 4 backlog](../archive/work/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md). This phase closes the wave with expanded skills-only sync and removal coverage, packed CLI smoke validation for `make-docs skills`, stale root-level `--skills` checks, focused manual dry runs, and completed backlog acceptance criteria.

| Area | Summary |
| --- | --- |
| Installer tests | [`packages/cli/tests/install.test.ts`](../../../packages/cli/tests/install.test.ts) adds first-run skills-only coverage for global scope writes and disabled harness selections. |
| CLI tests | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) adds no-tracked-skills removal no-op coverage while preserving parser/help and skills output checks. |
| Smoke validation | [`scripts/smoke-pack.mjs`](../../../scripts/smoke-pack.mjs) now validates packed `make-docs skills --help`, a non-mutating skills dry run, and a skills removal dry run against the packed CLI. |
| Backlog closeout | [Phase 4](../archive/work/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md) backlog acceptance criteria were marked complete after build, test, smoke, stale-reference, and manual dry-run validation. |
| Verification | `npm test -w make-docs -- --run tests/install.test.ts`, `npm test -w make-docs -- --run tests/cli.test.ts`, `npm run build -w make-docs`, `npm test -w make-docs`, `node scripts/smoke-pack.mjs`, stale `--skills` scan, focused temp-target dry runs, and `git diff --check` passed. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-22-w11-r0-p4-cli-skills-command.md](2026-04-22-w11-r0-p4-cli-skills-command.md) | History record for Wave 11 Phase 4 tests and validation closeout. |
| [docs/assets/archive/work/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md](../archive/work/2026-04-21-w11-r0-cli-skills-command/04-tests-and-validation.md) | Phase 4 work backlog with acceptance criteria marked complete. |

### Developer

None this session.

### User

None this session.
