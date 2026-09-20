---
date: 2026-06-18
coordinate: W17 R0 P3
closeout: phase
summary: "Moved root instruction reconciliation from whole-file hashes to managed-block hashes."
---

# Agent Instruction File Ownership - Phase 03 Block-Level Reconciliation Closeout

## Changes

Phase 03 moved root instruction reconciliation to managed-block scope. Manifest hashing now records the managed block hash for root instruction files while keeping whole-file hashes for dedicated `.make-docs/<harness>.md` and all non-instruction files; the planner no-ops when only outside-block user content changes, surfaces edited blocks as managed-block review items, and reasserts the desired block in place without overwriting surrounding content.

| Area | Summary |
| --- | --- |
| Manifest | Added [`getManifestFileHash`](../../../../packages/cli/src/manifest.ts) so root instruction manifest entries store the block hash and other files keep whole-file hashes. |
| Planner/audit | Updated [`planner.ts`](../../../../packages/cli/src/planner.ts) and [`audit.ts`](../../../../packages/cli/src/audit.ts) to compare root instruction blocks instead of whole files where the manifest owns only the block. |
| Conflict review | Added managed-block conflict scope through [`types.ts`](../../../../packages/cli/src/types.ts), [`install.ts`](../../../../packages/cli/src/install.ts), and [`wizard.ts`](../../../../packages/cli/src/wizard.ts); block conflicts are presented as reassert/keep decisions and default to reassert. |
| Tests | Expanded [`install.test.ts`](../../../../packages/cli/tests/install.test.ts) for outside-block edits, edited-block review, block reassertion with surrounding content preserved, and unchanged non-instruction overwrite/skip behavior. |
| Work backlog | Marked all five tasks complete in [`03-block-level-reconciliation.md`](../work/2026-06-18-w17-r0-agent-instruction-file-ownership/03-block-level-reconciliation.md). |
| Managed state | Left `.make-docs/runs/` uncommitted as local wave checkpoint state created by the workflow tooling. |

| Surface | Verdict | Rationale |
| --- | --- | --- |
| Developer guide/playbook | `none` | The phase changes internal reconciliation mechanics; durable maintainer guidance should wait until migration and final packaging validation settle the complete contract. |
| User guide | `none` | The behavior is not yet presented as a user-facing workflow until migration/dogfood and validation complete. |
| PRD reconciliation | `none` | The work implements active PRD 15 block-scoped reconciliation requirements without changing the requirement surface. |
| Manual test / UAT | `deferred` | UAT is intentionally skipped until the full W17 R0 wave is complete. Focused automated install, renderer, managed-block, build, router, and scope checks cover this phase. |
| History | `create` | This record is the Phase 03 breadcrumb for task decisions, coverage decisions, validation, and baseline debt. |

No novel gaps were found.

Validation for closeout:

- `npm test -w packages/cli -- install`
- `npm test -w packages/cli -- managed-block renderers`
- `npm run build -w packages/cli`
- `scripts/check-instruction-routers.sh`
- `python3 .agents/skills/work-on-wave/scripts/scope_guard.py 'W17 R0 P3'`
- `git diff --check`
- `npm test -w packages/cli -- consistency` was rerun after removing generated Python `__pycache__` files; remaining failures are pre-existing baseline debt for unmanaged template files and the risk-register expected heading list.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [`../../../../packages/cli/src/manifest.ts`](../../../../packages/cli/src/manifest.ts) | Defines the manifest hash rule for root instruction managed blocks versus whole-file assets. |
| [`../../../../packages/cli/src/planner.ts`](../../../../packages/cli/src/planner.ts) | Plans block-scoped noops, conflicts, and in-place block reassertion for root instruction files. |
| [`../../../../packages/cli/src/audit.ts`](../../../../packages/cli/src/audit.ts) | Compares manifest-owned root instruction blocks and preserves files with user content outside the block. |
| [`../../../../packages/cli/src/wizard.ts`](../../../../packages/cli/src/wizard.ts) | Labels block-scoped review choices as reassert/keep and defaults edited blocks to reassert. |
| [`../../../../packages/cli/tests/install.test.ts`](../../../../packages/cli/tests/install.test.ts) | Covers block-scoped reconciliation and unchanged whole-file behavior for non-instruction files. |
| [docs/assets/archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/03-block-level-reconciliation.md](../work/2026-06-18-w17-r0-agent-instruction-file-ownership/03-block-level-reconciliation.md) | Records Phase 03 task completion after evidence review. |

### Developer

No new developer guide was needed.
The phase is still an internal migration step; developer-facing guidance should be written after the migration, dogfood, and validation phases confirm the end-to-end contract.

### User

No new user guide was needed.
The phase changes internal conflict handling and manifest semantics but does not yet introduce a documented user workflow.
