# CLI Skill Installation — Implementation Plan

## Purpose

Implement the CLI skill installation capability designed in [2026-04-16-cli-skill-installation.md](../../designs/2026-04-16-cli-skill-installation.md). This is a **revision of Wave 5** (`w5-r1`) — it fixes the skill delivery gap discovered during the archive-docs plugin implementation (Wave 5 Phase 5), where skills were built and validated but had no installation path to consumer projects.

## Objective

- Skills in `packages/skills/` are bundled into the CLI package at publish time.
- The CLI discovers bundled skills and installs them into `.claude/skills/` during `init` and `update`.
- Supporting assets (references, scripts) are installed into `.claude/skill-assets/<plugin>/`.
- SKILL.md reference paths are rewritten at install time to point to the installed asset locations.
- A `skills` toggle is added to `InstallSelections` (default: true, opt-out: `--no-skills`).
- The wizard includes a skills step.
- Installed skills are tracked in the manifest for update/reconfigure support.
- The invalid `.claude/settings.json` and `.agents/README.md` from Wave 5 Phase 5 are cleaned up.
- Dogfood validation confirms skills are discoverable by Claude Code.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-cleanup-and-bundling.md` | Clean up invalid W5P5 artifacts; extend prepack to bundle skills; update package.json files. |
| `02-cli-types-and-profile.md` | Add `skills` to InstallSelections, defaultSelections, cloneSelections, profileId, isFullDefaultProfile. |
| `03-skill-catalog-and-install.md` | Add skill discovery, path rewriting, and install logic to the CLI pipeline. |
| `04-wizard-and-cli-flags.md` | Add skills wizard step, `--no-skills` flag, help text, and review summary. |
| `05-tests-and-validation.md` | Update tests, run full validation, dogfood with a fresh init. |

## Dependencies

- Phase 1 has no dependencies (cleanup + bundling).
- Phase 2 has no dependencies (types only). Phases 1 and 2 can run in parallel.
- Phase 3 depends on Phases 1 and 2 (needs bundled skills + the `skills` selection type).
- Phase 4 depends on Phase 2 (needs the `skills` selection type). Can run in parallel with Phase 3.
- Phase 5 depends on Phases 3 and 4.

## Validation

1. `npm test -w starter-docs` — all tests pass, including new skill-related tests.
2. `bash scripts/check-instruction-routers.sh` — passes.
3. `bash scripts/check-wave-numbering.sh` — passes (w5-r1 is a valid revision of w5).
4. `node scripts/smoke-pack.mjs` — pack/install/verify succeeds and includes skills.
5. Dogfood: run `npm run dev -w starter-docs -- init --yes --target /tmp/skill-test` and confirm `.claude/skills/` contains discoverable skill files.
6. `.claude/settings.json` and `.agents/README.md` no longer exist.
