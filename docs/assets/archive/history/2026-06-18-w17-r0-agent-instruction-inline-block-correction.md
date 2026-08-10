---
date: 2026-06-18
coordinate: W17 R0
closeout: corrective
summary: "Corrected W17 root instruction ownership to inline managed blocks."
---

# Agent Instruction File Ownership - Inline Block Correction

## Changes

This corrective pass replaces the W17 dedicated `.make-docs/AGENTS.md` and
`.make-docs/CLAUDE.md` instruction-file shape with mirrored inline managed
blocks in root `AGENTS.md` and `CLAUDE.md`. The dedicated template and dogfood
files are no longer desired assets, clean W17 installs refresh their old root
blocks automatically, and manifest-clean stale dedicated files are removed.

| Area | Summary |
| --- | --- |
| CLI asset model | Removed dedicated instruction assets from the desired asset catalog and renderer while keeping root instruction files buildable as inline managed blocks. |
| Planner migration | Added clean-W17 refresh behavior so manifest-owned root blocks update to the new inline body and stale dedicated files are pruned when their hashes still match. |
| Template and dogfood | Reseeded `packages/cli/template` from `packages/docs/template`, removed dedicated instruction files from both template surfaces, and refreshed root dogfood files plus `.make-docs/manifest.json`. |
| Validation coverage | Updated renderer, install/reconfigure, consistency, uninstall, smoke-pack, and router checks to assert mirrored root instruction blocks and no `.make-docs` instruction imports. |
| Docs reconciliation | Updated PRD 15, W17 P2 plan/backlog docs, and active PRD/W17 references so the current source of truth describes the inline managed-block product shape. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../designs/2026-06-18-agent-instruction-file-ownership.md](../designs/2026-06-18-agent-instruction-file-ownership.md) | Corrects the design decision from dedicated instruction files to mirrored inline root managed blocks. |
| [historical design](../designs/2026-06-18-agent-instruction-file-ownership.md) (retired action-PRD: `docs/prd/15-revise-agent-instruction-file-ownership.md`) | Updates the active requirement to forbid dedicated `.make-docs/AGENTS.md` and `.make-docs/CLAUDE.md` instruction files. |
| [docs/assets/archive/plans/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md](../plans/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md) | Recasts Phase 02 as inline root block and harness parity work while preserving the existing path. |
| [docs/assets/archive/work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md](../work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md) | Reconciles the Phase 02 backlog tasks and acceptance criteria with the inline block implementation. |
| [../../../AGENTS.md](../../../AGENTS.md) | Dogfoods the mirrored inline root instruction block for Codex. |
| [../../../CLAUDE.md](../../../CLAUDE.md) | Dogfoods the mirrored inline root instruction block for Claude. |
| [../../../../packages/docs/template/AGENTS.md](../../../../packages/docs/template/AGENTS.md) | Template source for the inline root instruction block. |
| [../../../../packages/docs/template/CLAUDE.md](../../../../packages/docs/template/CLAUDE.md) | Mirrors the template AGENTS root instruction block for Claude. |

### Developer

None this session.

### User

None this session.
