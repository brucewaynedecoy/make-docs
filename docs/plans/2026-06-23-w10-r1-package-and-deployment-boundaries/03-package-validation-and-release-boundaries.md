# Phase 03: Package Validation and Release Boundaries

## Purpose

Make the release and validation requirements explicit before downstream work touches npm packaging, package READMEs, future Rust artifacts, or dry-run release checks.

## What to Build

- Record the npm release-channel contract: `next` for release candidates and `latest` for stable releases.
- Preserve the npm package content boundary around `packages/cli`: built CLI, bundled template, skill registry files, and package README.
- Define package validation against the same user-facing command boundary for npm and future Rust packages.
- Require dry-run-only release validation unless the user explicitly authorizes irreversible publish or registry actions.
- Tie package README and tarball validation back to D-006 and R-003 in the risk register.
- Preserve the no-default-skills bare-install behavior from the existing skills-selection contract while Rust catches up.

## Key Decisions

- The root workspace remains private and is not a deployment package.
- Standalone template, skills, or content packages remain deferred to later asset-materialization and template/package/dogfood decisions.
- Future Rust package lookup names may be owner-qualified if registry constraints require it, but the installed command remains `make-docs`.
- Package validation should prove development templates, packed artifacts, manifest provenance, backup/uninstall safety, and no-scripts migration safety do not diverge.

## Acceptance Criteria

- The PRD change doc distinguishes npm package ownership from Rust standalone artifact ownership.
- The delta backlog includes dry-run package validation, smoke-pack coverage, package README/tarball inspection, and documentation updates.
- Any release command in the backlog is marked dry-run unless a later user-approved phase explicitly handles real publish.
- D-006 and R-003 are updated with the new package-boundary linkage, not duplicated as new risks.

## Dependencies

- Phase 01 PRD reconciliation
- Phase 02 shared command contract
- `packages/cli/package.json`
- `packages/cli/README.md`
- `README.md`
- `scripts/smoke-pack.mjs`
- `docs/prd/10-packaging-validation-and-release-reference.md`
