# Phase 04: Validation and Closeout

## Purpose

Validate the W10 R3 implementation, update docs, and close the round without publishing or pushing.

## Overview

This phase proves the classifier and disposition flows preserve current lifecycle safety while adding fixture coverage for compatibility states.

## Source PRD Docs

- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-revise-compatibility-audit-and-migration-disposition.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Run implementation validation

### Tasks

- [x] t1: Run `npm test -w packages/cli`.
- [x] t2: Run targeted audit, backup, uninstall, install, and managed-block tests.
- [x] t3: Run `npm run validate:defaults -w packages/cli`.
- [x] t4: Run `npm run smoke:pack`.

### Acceptance criteria

- Existing install, backup, uninstall, and lifecycle behavior still passes.
- Every source-state fixture has a tested disposition.
- Default installs still do not install skills.

### Dependencies

- Phase 03.

## Stage 2 - Validate package, dogfood, and Rust-compatibility boundaries

### Tasks

- [x] t5: Run package dry-run checks when package contents change.
- [x] t6: Run dogfood/template parity checks once the template/package/dogfood design defines exact parity rules.
- [x] t7: Verify the classifier taxonomy is runtime-agnostic enough for future Rust parity.

### Acceptance criteria

- Package validation still proves the packed npm template, not only local dev paths.
- Root dogfood authored docs are not treated as package-owned product assets.
- The taxonomy can be reused by Rust without forking installed-project semantics.

### Dependencies

- t1
- t2
- t3

## Stage 3 - Close docs and commit

### Tasks

- [x] t8: Update implementation docs, PRD notes, or risk-register entries only where the implemented behavior changes the accepted contract.
- [x] t9: Run `git diff --check`.
- [x] t10: Read `docs/assets/references/commit-message-convention.md` and draft the commit message from the actual diff.
- [x] t11: Create a local commit and do not push.

### Acceptance criteria

- Closeout records validation commands and any skipped checks.
- Docs do not claim Rust parity or provider readiness before implementation evidence exists.
- Local commit contains only W10 R3 implementation and docs.

### Dependencies

- t5
- t6
- t7

## Closeout Notes

| Area | Result |
| --- | --- |
| Full CLI validation | `npm test -w packages/cli` passed with 17 test files and 280 tests. |
| Targeted lifecycle validation | `npm test -w packages/cli -- audit.test.ts backup.test.ts uninstall.test.ts install.test.ts managed-block.test.ts lifecycle.test.ts --reporter=dot` passed with 6 files and 92 tests. |
| Default selection validation | `npm run validate:defaults -w packages/cli` passed with 24 consistency tests, preserving the no-default-skills install contract. |
| Package smoke | `npm run smoke:pack` passed, including prepack template copy, CLI build, packed CLI install/sync, skills sync, backup, and uninstall flows. |
| Package dry run | `npm pack --dry-run -w packages/cli` passed after prepack and listed 102 tarball files from the built npm package. |
| Template package parity | `diff -qr packages/docs/template packages/cli/template` passed after prepack refreshed the generated package copy. Root `docs/` was not compared as a package-owned source because PRD 19 defines root dogfood docs as validation, not the shipped product source of truth. |
| Manual UAT | Built `packages/cli/dist/index.js` installed into a non-empty target with an existing README, created `.make-docs/manifest.json`, preserved the README, and blocked an unmanaged `AGENTS.md` collision with `manual-review-required` before manifest creation. |
| Rust boundary | Reviewed `CompatibilitySourceState`, `CompatibilityDisposition`, and classifier/disposition mappings as string taxonomy contracts in `packages/cli/src/types.ts` and `packages/cli/src/compatibility.ts`; no docs claim Rust parity or provider readiness before a Rust implementation exists. |
| PRD and risk coverage | No PRD or risk-register edit was needed in Phase 4. PRD 18 remains the active owner of compatibility audit and migration disposition behavior, with Phase 3 source anchors already added for the CLI gate and tests. |
| Guide coverage | No developer or user guide update was needed because W10 R3 closes internal safety behavior and test coverage, not a new user-facing migration command or troubleshooting workflow. |
| Workflow | Closed the wave with local validation and a local commit only; no remote push. |

## Link-Rewrite Hardening Addendum

The original W10 R3 closeout proves compatibility classification and disposition safety, but it does not prove deterministic Markdown link rewriting for documentation tree moves. Future V2 migration acceptance must add full destination-tree validation for every moved Markdown file, not only changed-file or touched-file link checks.

### Required Future Validation

- [ ] t12: Add CLI fixture tests for clean V1 documentation tree migration with deterministic relative-link rewrites.
- [ ] t13: Add review-flow tests proving modified managed docs and user-authored Markdown are not blindly rewritten.
- [ ] t14: Add failure tests for deleted targets, unmapped targets, ambiguous missing-manifest trees, and unsafe rewrite plans.
- [ ] t15: Add full destination-tree Markdown link validation after migration for every moved Markdown file.
- [ ] t16: Add package smoke or install coverage proving the move/rewrite/validation behavior runs from the packaged CLI.

### Acceptance Criteria

- Validation fails when any moved Markdown file in the destination tree has a broken internal link, image, or reference-style target that should have been rewritten.
- Review-mode output distinguishes approved rewrites, skipped user content, unresolved targets, and manual-review-required stops.
- W9 R2 and W9 R5 dogfood moves may seed fixtures, but they are not accepted as product migration proof.
