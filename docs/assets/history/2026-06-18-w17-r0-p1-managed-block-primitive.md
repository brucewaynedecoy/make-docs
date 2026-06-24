---
date: 2026-06-18
coordinate: W17 R0 P1
closeout: phase
summary: "Added the managed-block primitive for agent instruction file ownership."
---

# Agent Instruction File Ownership - Phase 01 Managed-Block Primitive Closeout

## Changes

Phase 01 added the reusable managed-block primitive that later W17 R0 phases can use to own only a deterministic make-docs region inside shared instruction files. The primitive exports the working `<!-- make-docs:begin -->` and `<!-- make-docs:end -->` marker constants, parses valid or malformed marker regions, renders a canonical block, inserts an absent block, replaces an edited block body, reasserts malformed marker regions, and no-ops when the canonical body already matches.

| Area | Summary |
| --- | --- |
| CLI source | Added [`managed-block.ts`](../../../packages/cli/src/managed-block.ts) with marker constants, parse/render helpers, append/prepend insertion, and idempotent upsert results. |
| Tests | Added [`managed-block.test.ts`](../../../packages/cli/tests/managed-block.test.ts) for greenfield insert, update, edited-body replacement, malformed marker reassertion, duplicate markers, missing markers, custom marker validation, and files without trailing newlines. |
| Work backlog | Marked all four tasks complete in [`01-managed-block-primitive.md`](../archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/01-managed-block-primitive.md). |
| Managed state | Left `.make-docs/runs/` uncommitted as local wave checkpoint state created by the workflow tooling. |

| Surface | Verdict | Rationale |
| --- | --- | --- |
| Developer guide/playbook | `none` | The phase adds a narrow internal primitive for upcoming implementation phases; durable maintainer guidance should wait until the primitive is integrated with rendering, manifests, and conflict review. |
| User guide | `none` | The phase does not change installed output, CLI usage, or any user-visible workflow yet. |
| PRD reconciliation | `none` | The work implements the existing PRD 15 managed-block requirement and PRD 07 lifecycle context without changing the active requirement surface. |
| Manual test / UAT | `deferred` | UAT is intentionally skipped until the full W17 R0 wave is complete. Focused automated tests cover this internal primitive. |
| History | `create` | This record is the Phase 01 breadcrumb for task decisions, coverage decisions, validation, and baseline debt. |

No novel gaps were found.

Validation for closeout:

- `npm test -w packages/cli -- managed-block`
- `npm run build -w packages/cli`
- `python3 .agents/skills/work-on-wave/scripts/scope_guard.py 'W17 R0 P1'`
- `npm test -w packages/cli -- consistency` was rerun after removing generated Python `__pycache__` files; remaining failures are pre-existing baseline debt for unmanaged template files and the risk-register expected heading list.
- `npm test -w packages/cli -- backup` still has the existing `filesToCopy` count mismatch (`76` actual vs `72` expected), consistent with the template asset baseline drift rather than this primitive.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [`../../../packages/cli/src/managed-block.ts`](../../../packages/cli/src/managed-block.ts) | Adds the reusable managed-block parser, renderer, and idempotent upsert operation. |
| [`../../../packages/cli/tests/managed-block.test.ts`](../../../packages/cli/tests/managed-block.test.ts) | Locks the primitive's insertion, replacement, reassertion, malformed-marker, and trailing-newline behavior. |
| [docs/assets/archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/01-managed-block-primitive.md](../archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/01-managed-block-primitive.md) | Records Phase 01 task completion after evidence review. |

### Developer

No new developer guide was needed.
This phase is an internal foundation step; guide-worthy maintainer behavior depends on later W17 R0 phases wiring the primitive into rendering, manifest hashing, audit, and conflict review.

### User

No new user guide was needed.
The phase does not change installed instructions, CLI commands, generated docs, or any user-facing workflow.
