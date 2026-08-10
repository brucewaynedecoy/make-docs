---
date: "2026-06-25"
coordinate: "W10 R4 P2"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Documented the W10 R4 template-first ownership boundary."
---

# W10 R4 P2 Template Source Ownership

## Changes

Completed W10 R4 Phase 2 by documenting template-first ownership across the maintainer README, repo README, developer guides, and the active work backlog so shipped template-owned assets start in `packages/docs/template/`, repo-root `docs/` remains dogfood validation, `packages/cli/template/` remains a generated package copy, and project-owned records are excluded from blind reseeding.

### Coverage Decisions

- PRD coverage: no PRD files changed. [historical closeout](2026-06-25-w10-r4-p4-validation-and-closeout.md) (retired action-PRD: `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`), [PRD 06](../../../prd/06-template-contracts-and-generated-assets.md), and [PRD 09](../../../prd/09-dogfood-and-maintainer-operations.md) already carry the source-of-truth and dogfood ownership contract; Phase 2 implemented that contract in maintainer docs and work-backlog notes.
- Developer-guide coverage: updated existing developer guides instead of creating new ones. The affected guidance already lived in the dogfood operations, runtime-boundary, and template-assets guides.
- User-guide coverage: no user guide changed. The root README consumer tree was corrected, but no user-facing task flow, command, or troubleshooting path changed.
- Gap capture: no novel risk-register item was needed. The work explicitly preserves W10 R3's future packaged migration-hardening requirement rather than claiming direct dogfood moves satisfy V2 migration acceptance.
- UAT: deferred until the full W10 R4 wave is complete, per the active wave instruction.

### Validation

- `python3 packages/skills/work-on-wave/scripts/wave_status.py 'W10 R4 P2'`
- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/02-template-source-ownership.md --json`
- `python3 packages/skills/closeout-phase/scripts/closeout_probe.py --repo-root . --scope auto --json`
- `python3 packages/skills/closeout-phase/scripts/guide_coverage_probe.py --repo-root . --changed-files-json /tmp/w10-r4-p2-closeout-probe.json`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for tracked and untracked edited Markdown files.

The guide probe reported existing missing `persona` frontmatter across current library guides. That baseline predates Phase 2 and was not introduced by these edits.

`bash scripts/check-instruction-routers.sh` was also run and reported the existing root-router baseline: `./AGENTS.md` and `./CLAUDE.md` differ, and root `./CLAUDE.md` exceeds the current 12-line router budget. No Phase 2 file was identified as the source of that failure.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [README.md](../../../../README.md) | Updated the consumer tree, `.make-docs/**` system machinery, `docs/assets/**` project-asset namespace, and customization paths to the current v2 structure. |
| [packages/docs/README.md](../../../../packages/docs/README.md) | Expanded re-seed ownership guidance for template-owned system resources and project-owned exclusions. |
| [docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/02-template-source-ownership.md](../../../work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/02-template-source-ownership.md) | Marked Phase 2 tasks complete and recorded ownership-surface implementation notes. |
| [docs/assets/archive/history/2026-06-25-w10-r4-p2-template-source-ownership.md](2026-06-25-w10-r4-p2-template-source-ownership.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/maintainer-dogfood-and-maintainer-operations.md](../../library/developer/maintainer-dogfood-and-maintainer-operations.md) | Clarified template-owned reseed targets, project-owned exclusions, `.make-docs/**` system machinery, and the packaged migration boundary. |
| [docs/assets/library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Split managed project documentation assets, shipped system machinery, and mutable runtime state into separate ownership categories. |
| [docs/assets/library/developer/template-assets-and-generated-routers.md](../../library/developer/template-assets-and-generated-routers.md) | Clarified that installed managed assets span both `docs/**` and `.make-docs/**`, and that archive/artifact/library/playbook routers plus helper scripts are template-owned when shipped. |

### User

None this session.
