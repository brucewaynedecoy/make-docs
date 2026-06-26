---
client: "Codex Desktop"
date: "2026-06-26"
coordinate: "W17 R1 P3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Added alternate local skills manifest selection, source-policy stops, and persisted selection provenance."
---

# W17 R1 P3 Selection Source Policy and Provenance

## Changes

Phase 3 made skill selection manifest-aware: the CLI now accepts an explicit local `--skill-manifest`, expands `--selected-skills all` against the effective manifest, shows purpose/source/harness/provenance metadata in skill selection UI surfaces, rejects unpinned remote manifests and unpinned remote skill payloads before install state is written, and preserves resolved selected skill names while adding manifest and selection-provenance metadata to saved selections.

- Added effective skill-registry loading for the packaged manifest and alternate local file manifests.
- Passed effective registry metadata through install planning, skills-only planning, recommended choices, wizard choices, and Clack skills UI state.
- Normalized local alternate manifest sources to file URLs for resolver and planner reuse.
- Added static argument validation so manifest/skill-selection conflicts fail before registry loading or mutation.
- Persisted `skillManifest` and `skillSelectionProvenance` metadata in install selections while keeping `selectedSkills` and `skillFiles` intact.
- Updated user and developer skills guides for first-party purpose grouping, alternate local manifests, provenance persistence, and remote source-policy stops.
- Marked the Phase 3 work backlog complete with implementation, coverage, and validation evidence.

Validation run:

- `npm test -w packages/cli -- cli skill-registry skill-catalog skills-ui --reporter=dot`
- `npm run build -w packages/cli`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/03-selection-source-policy-and-provenance.md](../../../work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/03-selection-source-policy-and-provenance.md) | Marked Phase 3 complete and recorded implementation, guide coverage, PRD coverage, and validation evidence. |
| [docs/assets/archive/history/2026-06-26-w17-r1-p3-selection-source-policy-and-provenance.md](2026-06-26-w17-r1-p3-selection-source-policy-and-provenance.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Updated the skills distribution model for first-party manifest metadata, purpose/provenance fields, the current seven-skill catalog, alternate local manifests, and remote pinning policy. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/skills-installing-and-managing-skills.md](../../library/user/skills-installing-and-managing-skills.md) | Updated skills-management guidance for purpose-led selection, `--skill-manifest`, effective-manifest `all` expansion, provenance persistence, and remote policy stops. |
