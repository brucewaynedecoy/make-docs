# Phase 5 — Tests and Validation

## Objective

Update the test suite for skill installation, run the full validation chain, and dogfood-verify that skills are discoverable by Claude Code.

## Depends On

- Phases 3 and 4 (all CLI changes must be complete)

## Files to Modify/Create

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/install.test.ts` | Add skill installation assertions to full-default test; add `--no-skills` reduced-profile test; verify `.claude/skills/` and `.claude/skill-assets/` contents. |
| `packages/cli/tests/cli.test.ts` | Add `--no-skills` flag parsing test. |
| `packages/cli/tests/consistency.test.ts` | Template-completeness test may need updating if skill files affect the template check. Verify it still passes. |
| `scripts/smoke-pack.mjs` | Add assertions for skill files in the smoke-pack output (verify `.claude/skills/` exists after init). |

## Detailed Changes

### 1. `install.test.ts` — Full-default skill assertions

In the full-default install test, add:
- `.claude/skills/decompose-codebase.md` exists
- `.claude/skills/archive-docs-archive.md` exists
- `.claude/skills/archive-docs-staleness-check.md` exists
- `.claude/skills/archive-docs-deprecate.md` exists
- `.claude/skills/archive-docs-archive-impact.md` exists
- `.claude/skill-assets/archive-docs/references/archive-workflow.md` exists
- `.claude/skill-assets/archive-docs/scripts/trace_relationships.py` exists

### 2. `install.test.ts` — No-skills profile

Add a test that installs with `selections.skills = false` and verifies:
- `.claude/skills/` does NOT exist
- `.claude/skill-assets/` does NOT exist
- Docs template is still fully installed

### 3. `install.test.ts` — Skill path rewriting

Add a test that reads an installed SKILL.md and verifies relative references resolve to `.claude/skill-assets/`.

### 4. `cli.test.ts` — Flag parsing

Add test for `--no-skills` flag being recognized and applied.

### 5. `smoke-pack.mjs` — Skill verification

After the existing `init --yes` step, add checks:
- `existsSync(path.join(targetDir, ".claude/skills/decompose-codebase.md"))`
- `existsSync(path.join(targetDir, ".claude/skills/archive-docs-archive.md"))`

### 6. Final validation run

1. `npm test -w make-docs` — all tests pass
2. `bash scripts/check-instruction-routers.sh` — passes
3. `bash scripts/check-wave-numbering.sh` — passes (w5-r1 is valid)
4. `node scripts/smoke-pack.mjs` — pack/install/verify succeeds including skills
5. Dogfood: `npm run dev -w make-docs -- init --yes --target /tmp/skill-dogfood` then verify:
   - `.claude/skills/` exists with 5 skill files
   - `.claude/skill-assets/` exists with supporting assets
   - Opening a new Claude Code session in `/tmp/skill-dogfood` discovers the skills
6. Clean up: `rm -rf /tmp/skill-dogfood`

## Acceptance Criteria

- [ ] Full-default install test asserts skill files in `.claude/skills/` and assets in `.claude/skill-assets/`
- [ ] No-skills test confirms skills are excluded when disabled
- [ ] Path rewriting test confirms references resolve correctly
- [ ] `--no-skills` flag test added to CLI tests
- [ ] Smoke-pack verifies skill files in packed install output
- [ ] `npm test -w make-docs` passes
- [ ] `bash scripts/check-instruction-routers.sh` passes
- [ ] `bash scripts/check-wave-numbering.sh` passes
- [ ] `node scripts/smoke-pack.mjs` passes
- [ ] Dogfood verification: Claude Code discovers installed skills in a fresh init target
