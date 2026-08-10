---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R2 P3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Implemented shared-agentics role classification, audit handling, and clean legacy payload migration."
---

# W17 R2 P3 Manifest Audit and Migration

## Changes

Phase 3 implemented the transitional manifest/audit layer for shared selected-agentics. Planned actions and audit metadata now distinguish shared payloads, generated harness stubs, and legacy duplicated payloads while `skillFiles` remains the interim ownership list.

- Added shared-agentics role classification for planned actions, manifest audit records, and candidate audit paths.
- Updated CLI and skills dry-run summaries to label shared payloads, generated harness stubs, and legacy duplicated payloads.
- Updated audit, backup, uninstall, lifecycle, and skills UI handling for project and home-scoped shared payloads and stubs.
- Added retired managed-asset knowledge for the old per-harness duplicated skill payload layout.
- Routed full installs and skills-only sync through the same skill-aware planning logic for desired skill files.
- Added clean migration coverage from manifest-owned duplicated per-harness payloads into shared payloads plus generated stubs.
- Preserved modified, custom, malformed, and ambiguous state behavior by keeping ownership evidence manifest/content based instead of path-name based.
- Reconciled PRD 28, developer guide, user guide, and the Phase 3 backlog with the implemented behavior.

Validation run:

- `npm test -w packages/cli -- install -t "migrates clean manifest-owned duplicated" --reporter=verbose`
- `npm test -w packages/cli -- install -t "skills-only sync cleans up deselected skill files" --reporter=verbose`
- `npm test -w packages/cli -- install -t "skills-only removal removes tracked skills" --reporter=verbose`
- `npm test -w packages/cli -- cli -t "skills sync output uses skills-specific language" --reporter=verbose`
- `npm test -w packages/cli -- install audit backup uninstall lifecycle skills-ui cli --reporter=dot`
- `npm run build -w packages/cli`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/03-manifest-audit-and-migration.md](../../../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/03-manifest-audit-and-migration.md) | Marked Phase 3 complete and recorded validation evidence. |
| [historical closeout](2026-06-27-w17-r2-p4-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`) | Added the Phase 3 implementation note for role classification, dry-run/audit output, and clean legacy payload migration. |
| [docs/assets/archive/history/2026-06-27-w17-r2-p3-manifest-audit-and-migration.md](2026-06-27-w17-r2-p3-manifest-audit-and-migration.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [packages/cli/src/agentic-skill-roles.ts](../../../../packages/cli/src/agentic-skill-roles.ts) | Classifies shared payloads, generated harness stubs, and legacy duplicated payloads. |
| [packages/cli/src/planner.ts](../../../../packages/cli/src/planner.ts) | Applies role metadata and uses skill-aware planning for desired skill files in full installs and skills-only sync. |
| [packages/cli/src/skill-catalog.ts](../../../../packages/cli/src/skill-catalog.ts) | Provides retired managed content for the old duplicated per-harness payload layout. |
| [packages/cli/src/audit.ts](../../../../packages/cli/src/audit.ts) | Carries shared-agentics role metadata through audit, backup, and uninstall classification. |
| [docs/assets/library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Documented role labels and safe migration handling for maintainers. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/skills-installing-and-managing-skills.md](../../library/user/skills-installing-and-managing-skills.md) | Documented dry-run role labels and legacy duplicated payload migration behavior. |
