# Phase 03: Package Validation and Release Boundaries

## Purpose

Reconcile npm package documentation with the actual package boundary and strengthen dry-run package validation without performing irreversible release actions.

## Overview

This phase handles D-006 and R-003 implementation work: package README/tarball alignment, dev-versus-packed validation, no-default-skills preservation, and release-channel documentation. It must keep real publish and registry operations blocked unless the user explicitly expands scope.

## Source PRD Docs

- [../../prd/16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md#component-and-capability-map)

## Stage 1 - Package README and Tarball Alignment

### Tasks

- [x] t1: Run dry-run package inspection against `packages/cli` and capture the actual shipped files without publishing.
- [x] t2: Compare dry-run output with `packages/cli/package.json` `files` and the package-surface text in `README.md`, `packages/cli/README.md`, and any maintained package README source.
- [x] t3: Update stale README/package-surface wording so it describes built CLI, bundled template, skill registry files, schema, and package README as the npm package boundary.
- [x] t4: Preserve root workspace privacy and avoid describing `packages/docs`, `packages/skills`, or `packages/content` as standalone deployment packages.
- [x] t5: Keep D-006 open until package docs and dry-run output agree; close it only with the evidence named in the risk item.

### Acceptance criteria

- Package documentation matches the dry-run tarball boundary.
- The scoped npm package lookup and installed `make-docs` command are described consistently.
- Root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, scripts, and scratch planning material are not described as shipped npm package contents.
- D-006 is either still open with a clear follow-up or closed with dry-run evidence.

### Dependencies

- Phase 02 public command boundary
- `packages/cli/package.json`
- `README.md`
- `packages/cli/README.md`
- `packages/cli/src/README.md`
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Stage 2 - Dry-Run Validation and Smoke Coverage

### Tasks

- [x] t6: Run or update `scripts/smoke-pack.mjs` so package validation proves packed-template behavior, CLI install, skills flow, backup, and uninstall behavior that matter to PRD 16.
- [x] t7: Verify bare packaged installs still write no skill files by default.
- [x] t8: Verify explicit skills installation remains opt-in and does not reopen Q-001, Q-007, or Q-012.
- [x] t9: Run npm publish validation only with dry-run flags and the intended `next` release-candidate tag; do not perform a real publish.
- [x] t10: Tie R-003 evidence to both dev-template and packed-template behavior, not only one path.

### Acceptance criteria

- Package validation distinguishes local development template resolution from packed artifact resolution.
- No-default-skills behavior is preserved in packaged validation.
- Release validation commands are dry-run only.
- R-003 remains open unless both local and packed resolution are proven and documented.

### Dependencies

- Stage 1 package README and tarball alignment
- `scripts/smoke-pack.mjs`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`

## Implementation Notes

- `npm pack --dry-run --json --ignore-scripts` against `packages/cli` returned 102 files with tarball-root entries `LICENSE`, `README.md`, `dist/`, `package.json`, `skill-registry.json`, `skill-registry.schema.json`, and `template/`; no repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source workspace, script, or scratch planning paths were present.
- `README.md`, `packages/cli/README.md`, and `packages/cli/src/README.md` now describe the package boundary using that dry-run evidence, including npm metadata/license files and excluding source-only repository surfaces.
- `packages/cli/src/README.md` now frames release work as dry-run validation, uses `npm pack --dry-run --json --ignore-scripts`, and requires `npm publish --dry-run --access public --tag next` unless an irreversible real publish is separately authorized.
- `node scripts/smoke-pack.mjs` passed and proved prepack/build, packed-template install/sync, no-default-skills, explicit opt-in skills, backup, and uninstall behavior from the packed artifact.
- `npm --prefix packages/cli test -- tests/install.test.ts tests/consistency.test.ts tests/lifecycle.test.ts tests/backup.test.ts tests/uninstall.test.ts` passed, tying R-003 evidence to local-template behavior while smoke-pack covered packed-template behavior.
- `npm publish --dry-run --access public --tag next` passed and did not publish; no npm registry publish, Homebrew tap, Crates publish, git tag, release promotion, or remote push was performed.
- `docs/prd/03-open-questions-and-risk-register.md` now closes D-006 and R-003 with this dry-run/local/packed validation evidence. Q-001, Q-007, and Q-012 remain open because Phase 3 preserved current opt-in skills behavior without choosing a long-term delivery model.
- UAT/manual testing remains deferred until the full W10 R1 wave is complete.
