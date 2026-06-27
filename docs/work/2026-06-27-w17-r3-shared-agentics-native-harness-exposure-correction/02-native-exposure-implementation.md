# P2 Native Exposure Implementation

## Goal

Replace selected-skill generated stubs with native harness skill directories.

## Source PRD Docs

- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 10](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 16](../../prd/16-revise-package-and-deployment-boundaries.md)
- [PRD 27](../../prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md)

## Tasks

- [x] t1: Update selected-skill planning so harness outputs are exposure records rather than generated `SKILL.md` forwarding stubs.
- [x] t2: Add symlink exposure creation for `.claude/skills/<skill-name>/`, `.agents/skills/<skill-name>/`, and matching home-scoped harness roots.
- [x] t3: Add managed copy-mirror fallback that copies the full canonical skill payload when symlink creation is unavailable, disabled, or rejected by platform policy.
- [x] t4: Ensure harness-visible `SKILL.md` frontmatter and body come from the real selected skill payload.
- [x] t5: Add manifest/audit metadata for scope, harness, canonical payload path, exposure path, exposure mode, symlink target, copy-mirror source, fallback reason, and legacy-stub status.
- [x] t6: Update dry-run, sync, and skills UI output to display canonical payloads, symlink exposures, copy mirrors, and legacy stubs as distinct roles.
- [x] t7: Keep default installs and no-skill profiles free of selected-skill payloads and harness exposures.

## Acceptance Criteria

- Selected project-scope skills expose native skill directories under each enabled project harness.
- Selected global-scope skills expose native skill directories under each enabled home-scoped harness.
- Symlink exposure is attempted and recorded where available.
- Copy-mirror fallback produces the same harness-readable skill tree without becoming a second authoritative payload.
- No default selected-skill path creates generic Make Docs generated stubs.

## Validation Notes

Phase 2 package validation completed:

- `npm test -w packages/cli -- --run tests/install.test.ts`
- `npm test -w packages/cli -- --reporter=dot`

Coverage added or updated:

- selected project-scope skills expose native `.claude/skills/<skill-name>` and `.agents/skills/<skill-name>` directories;
- selected global-scope skills expose home-scoped harness directories;
- symlink mode records `skillExposure.mode: "symlink"` where available;
- `MAKE_DOCS_DISABLE_SKILL_SYMLINKS=1` forces managed copy-mirror fallback and records fallback metadata;
- harness-visible `SKILL.md` content comes from the canonical skill payload;
- clean manifest-owned W17 R2 generated stubs migrate to native exposure;
- modified generated stubs remain review-only;
- default installs and disabled-skill profiles do not create selected-skill payloads or harness exposures.

Manual UAT remains deferred until the full W17 R3 wave is complete.
