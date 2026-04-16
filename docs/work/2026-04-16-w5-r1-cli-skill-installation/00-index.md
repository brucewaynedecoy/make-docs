# CLI Skill Installation — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the CLI skill installation fix. It is a **revision of Wave 5** (`w5-r1`) — it completes the archive-docs plugin delivery by adding the missing skill installation capability to the CLI. It derives from [the plan](../../plans/2026-04-16-w5-r1-cli-skill-installation/00-overview.md) and the originating [design](../../designs/2026-04-16-cli-skill-installation.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-cleanup-and-bundling.md](./01-cleanup-and-bundling.md) | Delete invalid W5P5 artifacts; extend prepack to bundle skills; update package.json. |
| [02-cli-types-and-profile.md](./02-cli-types-and-profile.md) | Add `skills` to InstallSelections, manifest, defaultSelections, cloneSelections, isFullDefaultProfile. |
| [03-skill-catalog-and-install.md](./03-skill-catalog-and-install.md) | Add SKILLS_ROOT, skill discovery, path rewriting, and install pipeline integration. |
| [04-wizard-and-cli-flags.md](./04-wizard-and-cli-flags.md) | Add skills wizard prompt, `--no-skills` flag, help text, review summary. |
| [05-tests-and-validation.md](./05-tests-and-validation.md) | Update tests, smoke-pack, run full validation, dogfood Claude Code skill discovery. |

## Usage Notes

- Phases 1 and 2 can execute in parallel (disjoint file sets).
- Phases 3 and 4 can execute in parallel (both depend on Phase 2, different files).
- Phase 3 also depends on Phase 1 (bundled skills must exist).
- Phase 5 depends on Phases 3 and 4.
- Keep phase files dependency-ordered.
