# Phase 4 - Tests and Validation

## Objective

Lock the `make-docs skills` command with automated coverage, packed smoke validation, and stale-reference checks before closing the wave.

## Depends On

- [2026-04-21-cli-skills-command.md](../../designs/2026-04-21-cli-skills-command.md)
- Phases 1 through 3 of this plan.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/cli.test.ts` | Add command parsing, help, headless sync, headless removal, and invalid-flag coverage. |
| `packages/cli/tests/install.test.ts` | Add skills-only planner/apply coverage for first-time installs, manifest preservation, stale cleanup, and removal. |
| `packages/cli/tests/wizard.test.ts` | Add skills-only interactive state and review coverage if the UI is implemented in wizard helpers. |
| `scripts/smoke-pack.mjs` | Add or update packed CLI validation to exercise `make-docs skills` if smoke coverage is practical. |

## Detailed Changes

### 1. Add parser and help tests

Tests should assert:

- top-level help lists `skills`
- `make-docs skills --help` renders command-specific help
- `make-docs --skills` is not valid
- `make-docs skills --remove` parses
- content flags are rejected under `skills`
- `--remove --optional-skills` is rejected

### 2. Add skills-only sync tests

Tests should cover:

- first-time `make-docs skills --yes` creates selected skill files and minimal manifest state only
- existing full installs keep non-skill managed files unchanged
- `--skill-scope global` writes skill files to the home-root skill directories
- `--no-codex` and `--no-claude-code` constrain desired skill files
- `--optional-skills decompose-codebase` adds optional skill files
- `--optional-skills none` removes stale optional managed skill files

Remote skill fetching should continue to use the existing test mocking pattern rather than hitting live network during unit tests.

### 3. Add removal tests

Tests should cover:

- `make-docs skills --remove --yes` removes manifest-tracked skill files
- non-skill manifest files remain in place and remain tracked
- unrelated files under `.claude/skills/` or `.agents/skills/` are preserved
- modified managed skill files are preserved or conflict-staged according to the implemented safety behavior
- removal with no manifest or no tracked skill files exits cleanly with a no-op summary

### 4. Add interactive flow tests

Tests should cover:

- sync action path
- remove action path
- platform selection
- scope selection
- optional skill selection
- review apply/edit/cancel behavior

Use renderer-level tests where possible so coverage does not depend on a live TTY.

### 5. Run final validation

Run:

1. `npm run build -w make-docs`
2. `npm test -w make-docs`
3. `node scripts/smoke-pack.mjs`
4. stale-reference checks for root-level `--skills` guidance
5. focused manual dry runs in a temp target for `make-docs skills --dry-run`, `make-docs skills --yes`, and `make-docs skills --remove --yes`

## Acceptance Criteria

- [ ] Parser and help tests cover the final command surface.
- [ ] Skills-only sync tests prove non-skill files are untouched.
- [ ] Skills-only removal tests prove only managed skill files are removed.
- [ ] Interactive tests cover sync, removal, edit, and cancellation paths.
- [ ] Build, full package tests, and smoke-pack validation pass.
- [ ] No docs or help text advertise a root-level `--skills` flag.
