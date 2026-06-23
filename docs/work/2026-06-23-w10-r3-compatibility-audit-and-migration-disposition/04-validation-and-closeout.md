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

- [ ] t1: Run `npm test -w packages/cli`.
- [ ] t2: Run targeted audit, backup, uninstall, install, and managed-block tests.
- [ ] t3: Run `npm run validate:defaults -w packages/cli`.
- [ ] t4: Run `npm run smoke:pack`.

### Acceptance criteria

- Existing install, backup, uninstall, and lifecycle behavior still passes.
- Every source-state fixture has a tested disposition.
- Default installs still do not install skills.

### Dependencies

- Phase 03.

## Stage 2 - Validate package, dogfood, and Rust-compatibility boundaries

### Tasks

- [ ] t5: Run package dry-run checks when package contents change.
- [ ] t6: Run dogfood/template parity checks once the template/package/dogfood design defines exact parity rules.
- [ ] t7: Verify the classifier taxonomy is runtime-agnostic enough for future Rust parity.

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

- [ ] t8: Update implementation docs, PRD notes, or risk-register entries only where the implemented behavior changes the accepted contract.
- [ ] t9: Run `git diff --check`.
- [ ] t10: Read `docs/assets/references/commit-message-convention.md` and draft the commit message from the actual diff.
- [ ] t11: Create a local commit and do not push.

### Acceptance criteria

- Closeout records validation commands and any skipped checks.
- Docs do not claim Rust parity or provider readiness before implementation evidence exists.
- Local commit contains only W10 R3 implementation and docs.

### Dependencies

- t5
- t6
- t7
