# Phase 7 — Tests and Validation

## Objective

Update the full test suite, smoke-pack, and dogfood validation to cover harness-based skill installation, multi-target output, scope selection, backward compatibility, and CLI flag changes introduced in Phases 1--6.

## Depends On

All prior phases (1--6 must be complete before test assertions can target the final implementation).

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/install.test.ts` | Harness selection, backward compat, full-default skills, no-skills, single harness, path rewriting, scope tests. |
| `packages/cli/tests/cli.test.ts` | Flag parsing for `--no-claude-code`, `--no-codex`, `--no-skills`, `--skill-scope`, plus old aliases. |
| `packages/cli/tests/consistency.test.ts` | Verify template-completeness still passes with harness-derived instruction files and skill directories. |
| `packages/cli/tests/wizard.test.ts` | Harness selection step produces correct `InstallSelections.harnesses`, scope step sets `skillScope`. |
| `scripts/smoke-pack.mjs` | Assert skill files exist in packed install output for both `.claude/skills/` and `.agents/skills/`. |

## Detailed Changes

### 1. Harness model (`install.test.ts`)

Add a test that constructs `InstallSelections` with `harnesses: { claudeCode: true, codex: true }` and verifies the install produces the correct instruction files for each harness (e.g., `CLAUDE.md` for Claude Code, `AGENTS.md` for Codex).

### 2. Backward compatibility (`install.test.ts`)

Add a test that loads a manifest containing the old `instructionKinds` field (no `harnesses` key). Verify the manifest loader migrates it correctly and the resulting profile matches the equivalent harness-based profile.

### 3. Full-default skill installation (`install.test.ts`)

In the full-default install test, add assertions that skills install to both target directories:
- `.claude/skills/` contains expected skill files
- `.agents/skills/` contains expected skill files
- Skill assets are present alongside their skill files

### 4. No-skills (`install.test.ts`)

Add a test that installs with `selections.skills = false` and verifies:
- `.claude/skills/` does NOT exist
- `.agents/skills/` does NOT exist
- Docs template and instruction files are still fully installed

### 5. Single harness (`install.test.ts`)

Add a test that installs with only `harnesses: { claudeCode: true, codex: false }` and verifies:
- `.claude/` instruction files and skills are installed
- `.agents/` directory does NOT exist (no instruction file, no skills directory)

Add the inverse test (`codex: true, claudeCode: false`) to confirm symmetry.

### 6. Path rewriting (`install.test.ts`)

Add a test that reads an installed SKILL.md and verifies that relative references (e.g., to shared assets) resolve to the correct paths within the harness-specific skill directory.

### 7. Scope (`install.test.ts`)

Add tests for project vs. global scope:
- **Project scope** (`skillScope: "project"`): skill files install relative to `.` (the target directory).
- **Global scope** (`skillScope: "global"`): skill files install relative to `~` (mock the home directory in the test to a temp path and verify files land there).

### 8. CLI flags (`cli.test.ts`)

Add flag parsing tests:
- `--no-claude-code` sets `harnesses.claudeCode = false`
- `--no-codex` sets `harnesses.codex = false`
- `--no-skills` sets `skills = false`
- `--skill-scope project` and `--skill-scope global` set `skillScope` correctly
- Old aliases `--no-claude` and `--no-agents` are accepted and map to `--no-claude-code` and `--no-codex` respectively

### 9. Wizard (`wizard.test.ts`)

Add tests for the new wizard steps:
- The harness selection step renders platform options and produces correct `harnesses` on `InstallSelections`
- The skill scope step renders scope options and produces correct `skillScope`
- Deselecting all harnesses shows a warning or prevents continuation

### 10. Consistency (`consistency.test.ts`)

Verify that any new buildable paths introduced by harness-derived instruction files or skill directories are added to `BUILDABLE_PATHS` and the consistency test passes.

### 11. Smoke-pack (`smoke-pack.mjs`)

After the existing `init --yes` step, add checks:
- `.claude/skills/` exists and contains expected skill files
- `.agents/skills/` exists and contains expected skill files
- No stale skill files from old installation model remain

### 12. Final validation run

1. `npm test -w starter-docs` -- all tests pass.
2. `bash scripts/check-instruction-routers.sh` -- passes.
3. `bash scripts/check-wave-numbering.sh` -- passes (w5-r2 is valid).
4. `node scripts/smoke-pack.mjs` -- pack/install/verify succeeds including skills.
5. Dogfood: `npm run dev -w starter-docs -- init --yes --target /tmp/skill-dogfood-r2` then verify:
   - `.claude/skills/` exists with skill files
   - `.agents/skills/` exists with skill files
   - Opening a new Claude Code session in `/tmp/skill-dogfood-r2` discovers the installed skills
6. Clean up: `rm -rf /tmp/skill-dogfood-r2`

## Acceptance Criteria

- [ ] Harness model test confirms correct instruction files per harness selection
- [ ] Backward compat test loads old `instructionKinds` manifests without error
- [ ] Full-default test asserts skill files in `.claude/skills/` and `.agents/skills/`
- [ ] No-skills test confirms both skill directories are absent when skills disabled
- [ ] Single-harness test confirms only selected harness directory is created
- [ ] Path rewriting test confirms installed SKILL.md references resolve correctly
- [ ] Scope tests confirm project uses `.` and global uses `~` (mocked)
- [ ] CLI flag tests cover `--no-claude-code`, `--no-codex`, `--no-skills`, `--skill-scope`, and old aliases
- [ ] Wizard tests cover harness selection and scope selection steps
- [ ] Consistency test passes with updated `BUILDABLE_PATHS`
- [ ] Smoke-pack verifies skill files in packed install output
- [ ] `npm test -w starter-docs` passes
- [ ] `bash scripts/check-instruction-routers.sh` passes
- [ ] `bash scripts/check-wave-numbering.sh` passes
- [ ] `node scripts/smoke-pack.mjs` passes
- [ ] Dogfood: Claude Code discovers installed skills in a fresh init target
