---
date: "2026-06-18"
client: "Codex Desktop"
coordinate: "W17 R0 P5"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Validated the agent instruction ownership wave and reconciled baseline PRD lineage."
---

# W17 R0 P5 Validation and PRD Reconciliation

## Changes

Phase 05 closed the W17 R0 agent instruction file ownership wave with focused CLI validation, packaged-template smoke coverage, and PRD lineage updates. The smoke-pack path now asserts that the packed template and clean install include `.make-docs/AGENTS.md`, `.make-docs/CLAUDE.md`, root managed-block markers, the Codex dedicated-file pointer, and the Claude Code import. Baseline PRD 05 and PRD 06 now carry `Superseded by` backlinks to PRD 15 at the implementation sections affected by block-scoped root instruction ownership, and the PRD index reading order now includes PRD 15 with the active revision set.

| Area | Summary |
| --- | --- |
| Packaging validation | Extended `scripts/smoke-pack.mjs` to prove dedicated instruction files and root managed-block pointers ship in the packed CLI and install from a clean target. |
| PRD reconciliation | Added PRD 15 supersession notes to the affected manifest, render, and generated-asset sections in PRD 05 and PRD 06, then updated the PRD index reading order. |
| Wave closeout | Marked Phase 05 validation and reconciliation tasks complete in the W17 R0 work backlog. |

Validation passed for `npm test -w packages/cli -- managed-block renderers install`, `npm run build -w packages/cli`, `npm run smoke:pack`, `scripts/check-instruction-routers.sh`, `scripts/check-wave-numbering.sh`, `diff -rq packages/docs/template packages/cli/template`, `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`, and `git diff --check`. `npm test -w packages/cli -- consistency` still fails only on the existing unmanaged-template and risk-register expected-heading baseline failures recorded by earlier phase closeouts.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../prd/00-index.md](../../prd/00-index.md) | Updated the reading order to include PRD 15 with the active revision set. |
| [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Added PRD 15 supersession notes for root instruction preservation and block-scoped manifest hashing. |
| [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md) | Added PRD 15 supersession notes for root instruction rendering and dedicated `.make-docs/` generated assets. |
| [../../work/2026-06-18-w17-r0-agent-instruction-file-ownership/05-validation.md](../../work/2026-06-18-w17-r0-agent-instruction-file-ownership/05-validation.md) | Marked final validation and PRD reconciliation tasks complete with evidence. |

### Developer

None this session.

### User

None this session.
