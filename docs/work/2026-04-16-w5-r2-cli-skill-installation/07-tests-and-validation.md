# Phase 7: Tests and Validation

> Depends on all prior phases (1--6). No work in this phase can begin until the implementation is feature-complete.

## Purpose

Ensure the harness-based skill installation, multi-target output, scope selection, backward compatibility, and CLI flag changes introduced in Phases 1--6 are fully covered by automated tests, the smoke-pack, and a manual dogfood pass.

## Overview

This phase adds or updates tests across five test files and one smoke script, then runs the full validation suite including a live dogfood install. Each stage targets a distinct verification concern so they can be parallelized across agents once the implementation phases are merged.

## Source PRD Docs

- [07-tests-and-validation.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md)

## Stage 1 — Harness Model Tests

### Tasks

1. In `packages/cli/tests/install.test.ts`, add a test that constructs `InstallSelections` with `harnesses: { claudeCode: true, codex: true }` and asserts the install produces the correct instruction files for each harness (`CLAUDE.md` for Claude Code, `AGENTS.md` for Codex).
2. Add a backward-compatibility test that loads a manifest containing the legacy `instructionKinds` field (no `harnesses` key) and verifies the manifest loader migrates it to the equivalent harness-based profile without error.
3. In `packages/cli/tests/consistency.test.ts`, verify that any new buildable paths introduced by harness-derived instruction files or skill directories are added to `BUILDABLE_PATHS` and the consistency test passes.

### Acceptance criteria

- [ ] Harness model test confirms correct instruction files per harness selection
- [ ] Backward-compat test loads old `instructionKinds` manifests without error and produces equivalent harness profile
- [ ] Consistency test passes with updated `BUILDABLE_PATHS`

### Dependencies

- Phase 1 (type system and harness model) must be complete

## Stage 2 — Skill Install Tests

### Tasks

1. In `packages/cli/tests/install.test.ts`, add a **full-default** test asserting that skills install to both `.claude/skills/` and `.agents/skills/`, and that skill assets are present alongside their skill files.
2. Add a **no-skills** test that installs with `selections.skills = false` and asserts `.claude/skills/` and `.agents/skills/` do NOT exist while docs template and instruction files are still fully installed.
3. Add a **single-harness** test for `harnesses: { claudeCode: true, codex: false }` asserting `.claude/` instruction files and skills are installed while `.agents/` directory does NOT exist. Add the inverse (`codex: true, claudeCode: false`) test for symmetry.
4. Add a **path-rewriting** test that reads an installed `SKILL.md` and verifies relative references to shared assets resolve to the correct paths within the harness-specific skill directory.
5. Add **scope** tests: project scope (`skillScope: "project"`) installs skill files relative to `.` (the target directory); global scope (`skillScope: "global"`) installs relative to `~` (mock home directory to a temp path and verify files land there).

### Acceptance criteria

- [ ] Full-default test asserts skill files present in both `.claude/skills/` and `.agents/skills/`
- [ ] No-skills test confirms both skill directories are absent when skills disabled
- [ ] Single-harness test confirms only the selected harness directory is created (both directions)
- [ ] Path-rewriting test confirms installed SKILL.md references resolve correctly
- [ ] Scope tests confirm project scope uses `.` and global scope uses `~` (mocked)

### Dependencies

- Phases 2 and 4 (registry/resolver and skill install pipeline) must be complete

## Stage 3 — CLI Flag Tests

### Tasks

1. In `packages/cli/tests/cli.test.ts`, add flag-parsing tests for:
   - `--no-claude-code` sets `harnesses.claudeCode = false`
   - `--no-codex` sets `harnesses.codex = false`
   - `--no-skills` sets `skills = false`
   - `--skill-scope project` and `--skill-scope global` set `skillScope` correctly
2. Add alias tests confirming `--no-claude` maps to `--no-claude-code` and `--no-agents` maps to `--no-codex`.
3. In `packages/cli/tests/wizard.test.ts`, add tests for the harness selection step (renders platform options, produces correct `harnesses` on `InstallSelections`), the skill scope step (renders scope options, produces correct `skillScope`), and the guard that deselecting all harnesses shows a warning or prevents continuation.

### Acceptance criteria

- [ ] `--no-claude-code` flag test sets `harnesses.claudeCode = false`
- [ ] `--no-codex` flag test sets `harnesses.codex = false`
- [ ] `--no-skills` flag test sets `skills = false`
- [ ] `--skill-scope` flag test sets `skillScope` for both `project` and `global` values
- [ ] Old aliases `--no-claude` and `--no-agents` are accepted and map correctly
- [ ] Wizard harness selection step produces correct `harnesses` on `InstallSelections`
- [ ] Wizard skill scope step produces correct `skillScope`
- [ ] Deselecting all harnesses in wizard shows warning or prevents continuation

### Dependencies

- Phase 6 (wizard and CLI flags) must be complete

## Stage 4 — Smoke-Pack Update

### Tasks

1. In `scripts/smoke-pack.mjs`, after the existing `init --yes` step, add assertions that:
   - `.claude/skills/` exists and contains expected skill files
   - `.agents/skills/` exists and contains expected skill files
   - No stale skill files from the old installation model remain
2. Run `node scripts/smoke-pack.mjs` locally to confirm the updated smoke-pack passes against the current build.

### Acceptance criteria

- [ ] Smoke-pack asserts `.claude/skills/` contains expected skill files
- [ ] Smoke-pack asserts `.agents/skills/` contains expected skill files
- [ ] Smoke-pack confirms no stale skill files from old model remain
- [ ] `node scripts/smoke-pack.mjs` passes locally

### Dependencies

- Phase 5 (selective prepack) must be complete

## Stage 5 — Final Validation Run and Dogfood

### Tasks

1. Run `npm test -w starter-docs` — all tests pass.
2. Run `bash scripts/check-instruction-routers.sh` — passes.
3. Run `bash scripts/check-wave-numbering.sh` — passes (w5-r2 is valid).
4. Run `node scripts/smoke-pack.mjs` — pack/install/verify succeeds including skills.
5. Dogfood: run `npm run dev -w starter-docs -- init --yes --target /tmp/skill-dogfood-r2` and verify:
   - `.claude/skills/` exists with skill files
   - `.agents/skills/` exists with skill files
   - Opening a new Claude Code session in `/tmp/skill-dogfood-r2` discovers the installed skills
6. Clean up: `rm -rf /tmp/skill-dogfood-r2`.

### Acceptance criteria

- [ ] `npm test -w starter-docs` passes with zero failures
- [ ] `bash scripts/check-instruction-routers.sh` passes
- [ ] `bash scripts/check-wave-numbering.sh` passes
- [ ] `node scripts/smoke-pack.mjs` passes end-to-end
- [ ] Dogfood target at `/tmp/skill-dogfood-r2` contains `.claude/skills/` and `.agents/skills/` with skill files
- [ ] Claude Code session discovers installed skills in the dogfood target
- [ ] Dogfood temp directory cleaned up
