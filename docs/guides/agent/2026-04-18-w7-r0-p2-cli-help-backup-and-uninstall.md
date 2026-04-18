# CLI Help, Backup, and Uninstall - Phase 2 Shared Audit Engine

## Changes

Implemented the shared audit substrate described in [the design](../../designs/2026-04-18-cli-help-backup-and-uninstall.md), [the Phase 2 plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/02-shared-audit-engine.md), and [the Phase 2 backlog](../../work/2026-04-18-w7-r0-cli-help-backup-and-uninstall/02-shared-audit-engine.md). This phase stayed classification-only: it establishes ownership, preservation, and prune-safety decisions once so later backup and uninstall phases can execute from a deterministic audit result instead of re-deriving file safety on the fly.

| Area | Summary |
| --- | --- |
| Audit contract | [`packages/cli/src/types.ts`](../../../packages/cli/src/types.ts) now carries audit-domain result types for removable files, prunable directories, preserved paths, skipped candidates, audit mode, ordering metadata, scope classification, and backup-relative destination metadata. |
| Manifest helpers | [`packages/cli/src/manifest.ts`](../../../packages/cli/src/manifest.ts) now derives managed-file records, skill-file candidates, prior selections, local-versus-home classification, and deterministic backup-relative destinations for audit use. |
| Shared audit engine | [`packages/cli/src/audit.ts`](../../../packages/cli/src/audit.ts) adds the shared classification entrypoint for manifest-present and manifest-missing modes, excludes `.backup/` from removal consideration, classifies removable leaves before directory pruning, and orders prune candidates deepest-first. |
| Preservation rules | [`packages/cli/src/audit.ts`](../../../packages/cli/src/audit.ts) preserves directories that still contain unmanaged or already-preserved descendants and only marks root `AGENTS.md` and `CLAUDE.md` removable when their content exactly matches canonical or conservative fingerprinted output. |
| Test coverage | [`packages/cli/tests/audit.test.ts`](../../../packages/cli/tests/audit.test.ts) now covers manifest-present and manifest-missing audit flows, `.backup/` exclusion, exact-match versus modified root instruction files, preserved directories with unmanaged descendants, and `_home/...` backup-relative mapping for home or global paths. |
| Verification | Worker verification reported `npx tsc --noEmit` and package-local `npm test` passing after the Phase 2 source and test changes landed. |

## Documentation

### Project

None this session.

### Developer

None this session.

### User

None this session.
