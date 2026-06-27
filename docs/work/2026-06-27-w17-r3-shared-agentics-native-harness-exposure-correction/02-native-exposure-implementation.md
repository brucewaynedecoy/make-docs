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

- [ ] t1: Update selected-skill planning so harness outputs are exposure records rather than generated `SKILL.md` forwarding stubs.
- [ ] t2: Add symlink exposure creation for `.claude/skills/<skill-name>/`, `.agents/skills/<skill-name>/`, and matching home-scoped harness roots.
- [ ] t3: Add managed copy-mirror fallback that copies the full canonical skill payload when symlink creation is unavailable, disabled, or rejected by platform policy.
- [ ] t4: Ensure harness-visible `SKILL.md` frontmatter and body come from the real selected skill payload.
- [ ] t5: Add manifest/audit metadata for scope, harness, canonical payload path, exposure path, exposure mode, symlink target, copy-mirror source, fallback reason, and legacy-stub status.
- [ ] t6: Update dry-run, sync, and skills UI output to display canonical payloads, symlink exposures, copy mirrors, and legacy stubs as distinct roles.
- [ ] t7: Keep default installs and no-skill profiles free of selected-skill payloads and harness exposures.

## Acceptance Criteria

- Selected project-scope skills expose native skill directories under each enabled project harness.
- Selected global-scope skills expose native skill directories under each enabled home-scoped harness.
- Symlink exposure is attempted and recorded where available.
- Copy-mirror fallback produces the same harness-readable skill tree without becoming a second authoritative payload.
- No default selected-skill path creates generic Make Docs generated stubs.

## Validation Notes

Add focused tests for project scope, global scope, selected first-party skills, alternate manifest skills, disabled symlink preference, symlink creation failure, and package-runner execution.
