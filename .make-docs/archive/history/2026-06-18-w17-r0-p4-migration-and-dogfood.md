---
date: 2026-06-18
coordinate: W17 R0 P4
closeout: phase
summary: "Added root instruction block migration and dogfooded the dedicated instruction files."
---

# Agent Instruction File Ownership - Phase 04 Migration and Dogfood Closeout

## Changes

Phase 04 added migration behavior for existing root instruction files and applied the block model to this repository's dogfood instruction files. Existing root files without a make-docs block now migrate non-destructively: legacy manifest-owned files are replaced by the new block model, while project-owned root files keep their local content and receive the make-docs block in place.

| Area | Summary |
| --- | --- |
| CLI migration | Updated [`planner.ts`](../../../../packages/cli/src/planner.ts) to migrate root instruction files with no block, replacing legacy whole-file ownership when the manifest hash proves it and otherwise inserting the block while preserving user content. |
| Tests | Expanded [`install.test.ts`](../../../../packages/cli/tests/install.test.ts) for legacy whole-file migration and existing user-content preservation. |
| Dogfood root | Migrated [`AGENTS.md`](../../../AGENTS.md) and [`CLAUDE.md`](../../../CLAUDE.md) to project-specific lifecycle guidance outside the managed block plus harness-aware make-docs routing inside the block. |
| Dogfood dedicated files | Added [`.make-docs/AGENTS.md`](../../../../.make-docs/AGENTS.md) and [`.make-docs/CLAUDE.md`](../../../../.make-docs/CLAUDE.md), matching the template dedicated instruction files. |
| Dogfood manifest | Refreshed [`.make-docs/manifest.json`](../../../../.make-docs/manifest.json) so the dogfood install tracks root managed-block hashes and the dedicated instruction files. |
| Validation | Updated [`check-instruction-routers.sh`](../../../../scripts/check-instruction-routers.sh) root line budgets for project-specific guidance plus a managed block. |
| Work backlog | Marked all four tasks complete in [`04-migration-and-dogfood.md`](../work/2026-06-18-w17-r0-agent-instruction-file-ownership/04-migration-and-dogfood.md). |
| Managed state | Left `.make-docs/runs/` uncommitted as local wave checkpoint state created by the workflow tooling. |

| Surface | Verdict | Rationale |
| --- | --- | --- |
| Developer guide/playbook | `none` | The phase completes migration mechanics but final validation and PRD reconciliation remain in Phase 05. |
| User guide | `none` | User-facing migration language should wait until Phase 05 packaging/smoke validation confirms the whole wave contract. |
| PRD reconciliation | `none` | The work implements active PRD 15 migration/dogfood requirements without changing the requirement surface; Phase 05 owns deferred PRD annotations. |
| Manual test / UAT | `deferred` | UAT is intentionally skipped until the full W17 R0 wave is complete. Focused automated install, renderer, build, router, parity, and scope checks cover this phase. |
| History | `create` | This record is the Phase 04 breadcrumb for task decisions, dogfood decisions, validation, and baseline debt. |

No novel gaps were found.

Validation for closeout:

- `npm test -w packages/cli -- install`
- `npm test -w packages/cli -- managed-block renderers`
- `npm run build -w packages/cli`
- `scripts/check-instruction-routers.sh`
- `diff -rq packages/docs/template packages/cli/template`
- `diff -q packages/docs/template/.make-docs/AGENTS.md .make-docs/AGENTS.md`
- `diff -q packages/docs/template/.make-docs/CLAUDE.md .make-docs/CLAUDE.md`
- `python3 .agents/skills/work-on-wave/scripts/scope_guard.py 'W17 R0 P4'`
- `git diff --check`
- `npm test -w packages/cli -- consistency` was rerun after removing generated Python `__pycache__` files; remaining failures are pre-existing baseline debt for unmanaged template files and the risk-register expected heading list.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [`../../../../packages/cli/src/planner.ts`](../../../../packages/cli/src/planner.ts) | Adds root instruction migration for legacy whole-file ownership and existing user-content insertion. |
| [`../../../../packages/cli/tests/install.test.ts`](../../../../packages/cli/tests/install.test.ts) | Covers migration from legacy whole-file ownership and preservation of existing user content. |
| [`../../../AGENTS.md`](../../../AGENTS.md) | Dogfoods Codex root block ownership with lifecycle guidance outside the block. |
| [`../../../CLAUDE.md`](../../../CLAUDE.md) | Dogfoods Claude root block ownership with lifecycle guidance outside the block. |
| [`../../../../.make-docs/AGENTS.md`](../../../../.make-docs/AGENTS.md) | Adds the dogfood dedicated Codex instruction file. |
| [`../../../../.make-docs/CLAUDE.md`](../../../../.make-docs/CLAUDE.md) | Adds the dogfood dedicated Claude instruction file. |
| [`../../../../.make-docs/manifest.json`](../../../../.make-docs/manifest.json) | Tracks the dogfood root block hashes and dedicated instruction files. |
| [`../../../../scripts/check-instruction-routers.sh`](../../../../scripts/check-instruction-routers.sh) | Keeps instruction router validation compatible with dogfood root files that include project-specific guidance plus a managed block. |
| [docs/assets/archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/04-migration-and-dogfood.md](../work/2026-06-18-w17-r0-agent-instruction-file-ownership/04-migration-and-dogfood.md) | Records Phase 04 task completion after evidence review. |

### Developer

No new developer guide was needed.
Phase 05 still owns final validation and PRD reconciliation, so durable maintainer guidance should wait for the complete wave result.

### User

No new user guide was needed.
The migration behavior is implemented but should not be documented for users until Phase 05 validates packaged install and smoke behavior.
