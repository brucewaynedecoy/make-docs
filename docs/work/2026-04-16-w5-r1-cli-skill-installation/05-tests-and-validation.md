# Phase 5: Tests and Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-16-w5-r1-cli-skill-installation/05-tests-and-validation.md).

## Purpose

Update the test suite for skill installation, run the full validation chain, and dogfood-verify that skills are discoverable by Claude Code.

## Overview

Six stages covering test assertions for skill installation (full-default, no-skills, path rewriting, CLI flag), smoke-pack verification, and a final end-to-end validation run including dogfood. Stages 1-4 are parallel; Stage 5 follows after 1-4; Stage 6 follows after 5.

## Source Plan Phases

- [05-tests-and-validation.md](../../plans/2026-04-16-w5-r1-cli-skill-installation/05-tests-and-validation.md)

## Stage 1 — Add install test assertions

### Tasks

1. Open `packages/cli/tests/install.test.ts`.
2. In the full-default install test, add assertions that the following files exist after installation:
   - `.claude/skills/decompose-codebase.md`
   - `.claude/skills/archive-docs-archive.md`
   - `.claude/skills/archive-docs-staleness-check.md`
   - `.claude/skills/archive-docs-deprecate.md`
   - `.claude/skills/archive-docs-archive-impact.md`
3. Add an assertion that `.claude/skill-assets/archive-docs/references/archive-workflow.md` exists.

### Acceptance criteria

- [ ] Full-default test asserts all 5 skill files in `.claude/skills/`.
- [ ] Full-default test asserts `.claude/skill-assets/archive-docs/references/archive-workflow.md` exists.
- [ ] Assertions pass when running `npm test`.

### Dependencies

- Phases 3 and 4 (all CLI changes must be complete).

## Stage 2 — Add no-skills test

### Tasks

1. In `packages/cli/tests/install.test.ts`, add a new test case that installs with `selections.skills = false`.
2. Assert that `.claude/skills/` does NOT exist in the install target.
3. Assert that the docs template is still fully installed (existing template assertions remain valid).

### Acceptance criteria

- [ ] New test case exists for `selections.skills = false`.
- [ ] Test verifies `.claude/skills/` does not exist when skills are disabled.
- [ ] Test verifies the docs template is still fully installed.
- [ ] Test passes when running `npm test`.

### Dependencies

- Phases 3 and 4 (all CLI changes must be complete).

## Stage 3 — Add path rewriting test

### Tasks

1. In `packages/cli/tests/install.test.ts`, add a test case that reads an installed SKILL.md file after installation.
2. Verify that relative references in the installed skill point to `../skill-assets/...` and not original source paths.

### Acceptance criteria

- [ ] Test reads an installed SKILL.md and inspects its content.
- [ ] Test asserts relative references resolve to `../skill-assets/...`.
- [ ] Test passes when running `npm test`.

### Dependencies

- Phases 3 and 4 (all CLI changes must be complete).

## Stage 4 — Add CLI flag test

### Tasks

1. Open `packages/cli/tests/cli.test.ts`.
2. Add a test for the `--no-skills` flag, verifying it is correctly parsed and applied.

### Acceptance criteria

- [ ] Test for `--no-skills` flag parsing exists in `cli.test.ts`.
- [ ] Test passes when running `npm test`.

### Dependencies

- Phases 3 and 4 (all CLI changes must be complete).

## Stage 5 — Update smoke-pack

### Tasks

1. Open `scripts/smoke-pack.mjs`.
2. After the existing `init --yes` step, add `existsSync` checks for:
   - `.claude/skills/decompose-codebase.md`
   - `.claude/skills/archive-docs-archive.md`
3. Fail the smoke-pack if either file is missing.

### Acceptance criteria

- [ ] `smoke-pack.mjs` checks for `.claude/skills/decompose-codebase.md` after init.
- [ ] `smoke-pack.mjs` checks for `.claude/skills/archive-docs-archive.md` after init.
- [ ] `node scripts/smoke-pack.mjs` passes with skill checks.

### Dependencies

- Stages 1-4 (all test assertions must be in place before smoke-pack update).

## Stage 6 — Final validation run

### Tasks

1. Run `npm test` and verify all tests pass.
2. Run `bash scripts/check-instruction-routers.sh` and verify exit code 0.
3. Run `bash scripts/check-wave-numbering.sh` and verify it passes.
4. Run `node scripts/smoke-pack.mjs` and verify pack/install/verify succeeds including skills.
5. Dogfood: run `npm run dev -w make-docs -- init --yes --target /tmp/skill-dogfood`.
6. Verify `.claude/skills/` has 5 skill files.
7. Open a new Claude Code session in `/tmp/skill-dogfood` and confirm skill discovery.
8. Clean up: `rm -rf /tmp/skill-dogfood`.

### Acceptance criteria

- [ ] `npm test` passes.
- [ ] `bash scripts/check-instruction-routers.sh` passes.
- [ ] `bash scripts/check-wave-numbering.sh` passes.
- [ ] `node scripts/smoke-pack.mjs` passes.
- [ ] Dogfood target `.claude/skills/` contains 5 skill files.
- [ ] Claude Code discovers installed skills in the dogfood target.
- [ ] `/tmp/skill-dogfood` cleaned up.

### Dependencies

- Stage 5 (smoke-pack must be updated before final validation).
