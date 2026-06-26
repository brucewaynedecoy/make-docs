---
client: "Codex Desktop"
date: "2026-06-26"
coordinate: "W17 R1 P4"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Closed the W17 R1 lifecycle/package validation surface for alternate skills manifests and selected-skill provenance."
---

# W17 R1 P4 Lifecycle Package Validation and Closeout

## Changes

Phase 4 closed the W17 R1 lifecycle/package validation surface: manifest-backed audits now expose saved skill manifest and provenance review data, lifecycle backup/uninstall summaries and compatibility evidence render that provenance, alternate local-manifest skill files are reviewed from the saved manifest instead of the built-in registry, and package validation now covers the evolved registry shape through full CLI tests, default consistency, build, and smoke-pack runs.

- Added `skillSelectionReview` audit output for skill enablement, scope, resolved selected skills, saved skills manifest metadata, and selected-skill provenance.
- Updated backup and uninstall review summaries to show selected-skill manifest and provenance before lifecycle mutation.
- Updated compatibility classification evidence so migration review can see saved skill selection provenance.
- Reloaded saved local-manifest registries for lifecycle audit/removal of alternate selected-skill files, avoiding accidental expansion against the built-in registry.
- Added lifecycle fixture coverage for alternate local-manifest install, audit, compatibility, backup, and uninstall behavior.
- Corrected package skill guides so they describe explicit selected-skill behavior instead of required/default `archive-docs` behavior.
- Updated PRD 27 and the risk register with implementation evidence while leaving the broader skills delivery and lifecycle-removability risks open.
- Marked the Phase 4 work backlog complete with implementation notes, coverage decisions, and validation evidence.
- Completed post-wave UAT with a hermetic local alternate skills manifest scenario that installed only `acme-release`, exposed provenance in backup/uninstall review, and removed the selected skill without expanding to `archive-docs`.

Validation run:

- `npm test -w packages/cli -- lifecycle audit compatibility --reporter=dot`
- `npm test -w packages/cli -- wizard --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Manual UAT: local alternate skills manifest install, backup, and uninstall in an isolated temp project

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/04-lifecycle-package-validation-and-closeout.md](../../../work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/04-lifecycle-package-validation-and-closeout.md) | Marked Phase 4 complete and recorded implementation, coverage, and validation evidence. |
| [docs/prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md](../../../prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md) | Added W17 R1 Phase 4 implementation evidence for schema, alternate local manifests, provenance, lifecycle review, and package validation. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated Q-001, R-002, and R-006 with concrete W17 R1 evidence while preserving open delivery and lifecycle-removability follow-ups. |
| [docs/assets/archive/history/2026-06-26-w17-r1-p4-lifecycle-package-validation-and-closeout.md](2026-06-26-w17-r1-p4-lifecycle-package-validation-and-closeout.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Corrected the maintainer guide for purpose-led selected-skill behavior and no-default skill files. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/skills-installing-and-managing-skills.md](../../library/user/skills-installing-and-managing-skills.md) | Corrected user guidance so skills are described as explicitly selected and bare installs remain skill-free. |
