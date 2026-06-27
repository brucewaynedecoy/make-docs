---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R3 P1"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Confirmed W17 R3 authority and PRD reconciliation before implementation."
---

# W17 R3 P1 Authority and PRD Reconciliation

## Changes

Phase 1 confirmed the W17 R3 native harness exposure authority before package implementation: the W17 R3 design supersedes only the W17 R2 generated-stub default, W17 R2 remains historical evidence for shared payload placement and lifecycle classification, active PRDs name native exposure with symlink preference and managed copy-mirror fallback, and W18 follow-on work inherits W17 R3 instead of consuming generated stubs as the target behavior.

- Confirmed W17 R3 is the future-facing authority for selected-skill native harness exposure.
- Confirmed PRD 28, the PRD index, the risk register, CLI lifecycle, skills catalog, package validation, and plugin substrate PRDs already name the corrected exposure model.
- Confirmed W18 R2 and W18 R3 planning/backlog files inherit W17 R3 or treat generated adapters as plugin-specific harness shims only.
- Confirmed remaining W17 R2 stub references are historical evidence, legacy migration classification, or W17 R3 corrective requirements.
- Marked the Phase 1 work backlog complete with developer-guide, user-guide, PRD, and deferred-UAT coverage decisions.

Validation run:

- Targeted W17 R3/stub/native-exposure phrase scan across `docs/prd`, `docs/designs`, `docs/plans`, and `docs/work`.
- Touched-file Markdown link check for the Phase 1 work file and this history record.
- `git diff --check`

Validation caveat:

- `bash scripts/check-instruction-routers.sh` was not rerun for Phase 1 because this phase touched only the work file and history record. The known root-router baseline remains from the prior W17 R3 planning pass: root `AGENTS.md` and `CLAUDE.md` differ, and root `CLAUDE.md` exceeds the 12-line budget.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/01-authority-and-prd-reconciliation.md](../../../work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/01-authority-and-prd-reconciliation.md) | Marked Phase 1 complete and recorded authority, coverage, and validation evidence. |
| [docs/assets/archive/history/2026-06-27-w17-r3-p1-authority-and-prd-reconciliation.md](2026-06-27-w17-r3-p1-authority-and-prd-reconciliation.md) | Added this phase closeout breadcrumb. |

### Developer

None this session.

### User

None this session.
