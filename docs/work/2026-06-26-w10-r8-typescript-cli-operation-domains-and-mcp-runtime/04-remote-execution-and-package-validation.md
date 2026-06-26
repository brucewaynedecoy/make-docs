# Phase 04: Remote Execution and Package Validation

## Purpose

Prove the v2 runtime posture through package-runner execution instead of persistent local CLI installation.

## Tasks

- [ ] t1: Extend packed-package smoke validation for `npx`.
- [ ] t2: Add packed-package validation for `pnpm dlx`.
- [ ] t3: Add packed-package validation for `bunx` or `bun x`.
- [ ] t4: Use isolated temp roots, HOME, package-manager caches, and project config for each runner.
- [ ] t5: Keep existing package validation gates green.

## Acceptance Criteria

- Remote execution works from the packed package across npm, pnpm, and Bun.
- Smoke validation does not rely on global user configuration or a persistent installed CLI.
