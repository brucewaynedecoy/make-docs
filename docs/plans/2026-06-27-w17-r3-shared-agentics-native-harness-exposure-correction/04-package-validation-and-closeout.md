# Package Validation and Closeout

## Purpose

Plan validation and closeout for the corrected native harness exposure contract.

## Planned Changes

- Update tests for selected skill installation, skills sync, audit, backup, uninstall, lifecycle, skills UI, and package smoke behavior.
- Add platform/fallback fixtures for symlink success, symlink unavailable, copy-mirror fallback, wrong-target symlink, modified copy mirror, and legacy generated stub migration.
- Update `scripts/smoke-pack.mjs` so packed CLI validation proves native harness exposure instead of generated stubs.
- Record closeout history and PRD/risk evidence only after package validation passes.

## Acceptance Criteria

- Full package validation covers symlink-preferred behavior and copy-mirror fallback.
- Default install still writes no selected skill payloads or harness exposures.
- Package smoke proves packed CLI behavior through npm, pnpm, and Bun runner paths.
- W17 R3 closeout records distinguish corrected product behavior from W17 R2 historical stub implementation.
