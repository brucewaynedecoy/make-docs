# Phase 04: Remote Execution and Package Validation

## Purpose

Prove the v2 runtime posture through package-runner execution instead of persistent local CLI installation.

## Tasks

- [x] t1: Extend packed-package smoke validation for `npx`.
- [x] t2: Add packed-package validation for `pnpm dlx`.
- [x] t3: Add packed-package validation for `bunx` or `bun x`.
- [x] t4: Use isolated temp roots, HOME, package-manager caches, and project config for each runner.
- [x] t5: Keep existing package validation gates green.

## Acceptance Criteria

- Remote execution works from the packed package across npm, pnpm, and Bun.
- Smoke validation does not rely on global user configuration or a persistent installed CLI.

## Implementation Notes

Phase 4 extends `scripts/smoke-pack.mjs` so the packed tarball is executed through package runners before the existing direct unpacked-bin install, skills, backup, and uninstall assertions continue.

- Added remote package-runner smoke cases for:
  - `npx --package <tarball> make-docs --yes --target <temp-target>`;
  - `pnpm dlx <tarball> --yes --target <temp-target>`;
  - `bun x --package file:<tarball> make-docs --yes --target <temp-target>`.
- Each runner gets its own temp root with isolated `HOME`, working directory, target directory, `XDG_CACHE_HOME`, and package-manager cache/store directories.
- Each runner performs a real first install from the packed tarball and asserts the installed manifest, instruction routers, reader-facing assets, managed-file tracking, omitted optional config, and no default skill files.
- The existing deep smoke-pack coverage still validates direct unpacked-bin help, repo-backed skill registry fixtures, base install, idempotent sync, selected-skill install, backup, uninstall, and unmanaged-file preservation.

## Coverage Decisions

Developer-guide coverage outcome: `update-existing`. Updated `docs/assets/library/developer/release-packaging-validation-and-release-reference.md` because it already owns the smoke-pack validation contract and maintainer release workflow.

User-guide coverage outcome: `none`. This phase hardens maintainer/package validation and does not change the user-facing CLI lifecycle beyond behavior already documented by W10 R7/W10 R8 Phase 3.

PRD coverage outcome: `baseline-change-note`. Updated `docs/prd/10-packaging-validation-and-release-reference.md` in place because Phase 4 implements an existing package-validation requirement rather than introducing a new product requirement.

Manual/UAT coverage remains deferred until W10 R8 wave closeout per the requested workflow.

## Validation Evidence

- `npm run smoke:pack`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- `bash scripts/check-wave-numbering.sh`
- Refreshed the local jdocmunch docs index
- Changed-file Markdown link check
- `git diff --check`
- `bash scripts/check-instruction-routers.sh` reported the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No Phase 4 router regression was introduced.
