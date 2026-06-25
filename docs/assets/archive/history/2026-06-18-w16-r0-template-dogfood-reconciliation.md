---
date: "2026-06-18"
coordinate: "W16 R0"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Reverse-seeded W16 R0 product assets from the dogfood into the template source of truth and recorded the layering drift."
---

# W16 R0 Template/Dogfood Reconciliation

## Changes

W16 R0 was implemented directly in the repo-root dogfood `docs/` instead of the
source-of-truth template `packages/docs/template/docs/`, leaving the template
missing the shipped product assets — the dogfood/template parity gap tracked as
D-007 and recorded for this incident as D-014. This session reverse-seeded the
template from the dogfood to restore parity, without reworking content: the
agent's W16 output was content-correct, only mislocated.

Propagated dogfood -> template (product assets):

- `docs/assets/references/coverage-pass-contract.md` (new) and `lifecycle.md` (new).
- `docs/assets/references/AGENTS.md`, `CLAUDE.md`, `output-contract.md`, and `planning-workflow.md` (W16 edits).
- `docs/assets/templates/plan-overview.md`, `prd-index.md`, and `work-index.md` (W16 edits).
- `docs/CLAUDE.md` and `docs/AGENTS.md` (root routers).
- `docs/artifacts/AGENTS.md` and `CLAUDE.md` (artifacts routers).

Kept dogfood-only (make-docs's own content): the lifecycle playbook at
`docs/library/playbooks/agent-maintainer/make-docs-lifecycle.md`, the
`docs/artifacts/` SVG and digests, the guides, and the planning docs. The
starter prompts and the `docs/guides/` routers were already present and matching
in both layers.

Validation: before copying, confirmed the template equaled the pre-W16 baseline
(commit `6891519`) for every updated file, so the copy applied only W16 changes.
After copying, `diff -rq docs/assets packages/docs/template/docs/assets` shows no
remaining W16 differences, and the root and artifacts routers match. Follow-up:
`.make-docs/manifest.json` does not yet track the new template assets and needs a
reconfigure.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Added D-014 recording the dogfood-vs-template layering drift and its resolution. |
| [docs/assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md](../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md) | Added the template-first authoring and re-seed note. |
| [docs/assets/archive/work/2026-06-17-w16-r0-lifecycle-workflow-foundation/00-index.md](../work/2026-06-17-w16-r0-lifecycle-workflow-foundation/00-index.md) | Added the template-first authoring and re-seed note. |
| `packages/docs/template/docs/**` | Reverse-seeded the W16 product assets into the template source of truth. |

### Developer

None this session.

### User

None this session.
