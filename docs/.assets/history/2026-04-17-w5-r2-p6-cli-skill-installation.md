---
date: "2026-04-17"
coordinate: "W5 R2 P6"
---

# Phase 6: CLI Skill Installation R2 — Wizard, CLI Surface, and Current-Truth Cleanup

## Changes

Completed the practical Phase 6 outcome after the earlier Phase 5 pivots. The CLI now exposes the shipped harness-and-skill model cleanly in both interactive and non-interactive flows, and the surrounding design/user/developer docs were reconciled to the final remote single-skill implementation so the wave is easier to audit.

| Area | Summary |
| --- | --- |
| [packages/cli/src/cli.ts](../../../packages/cli/src/cli.ts) and [packages/cli/tests/cli.test.ts](../../../packages/cli/tests/cli.test.ts) | Finished the headless CLI surface for the harness-first install model: canonical `--no-claude-code` and `--no-codex` flags, deprecated alias handling for `--no-claude` and `--no-agents`, `--no-skills`, `--skill-scope project|global`, and `--optional-skills <csv|none>`, plus validation for conflicting combinations and invalid skill selections. |
| [packages/cli/skill-registry.schema.json](../../../packages/cli/skill-registry.schema.json), [packages/cli/skill-registry.json](../../../packages/cli/skill-registry.json), [packages/cli/package.json](../../../packages/cli/package.json), and [packages/cli/tests/skill-registry.test.ts](../../../packages/cli/tests/skill-registry.test.ts) | Replaced the dangling registry `$schema` reference with a real packaged schema artifact at the CLI package root and added coverage that the schema file is present and resolvable in the shipped package. |
| [docs/designs/2026-04-16-cli-skill-installation-r2.md](../../designs/2026-04-16-cli-skill-installation-r2.md) | Rewrote the living R2 design doc to reflect the final shipped model: remote-only registry sources, `archive-docs` as a single required skill, directory installs under `.claude/skills/<name>/` and `.agents/skills/<name>/`, and canonical phase-6 CLI flags. |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) and [docs/guides/developer/roadmap.md](../../guides/developer/roadmap.md) | Updated the current-facing guidance so the install UX, harness terminology, skill scope, optional-skill selection, and longer-term roadmap no longer describe the pre-pivot plugin/`skill-assets` model. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md), [docs/plans/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md), [docs/work/2026-04-16-w5-r2-cli-skill-installation/00-index.md](../../work/2026-04-16-w5-r2-cli-skill-installation/00-index.md), and [docs/work/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md](../../work/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md) | Added concise divergence notes so the historical `w5-r2` plan/work backlog remains readable without pretending the earlier `local:`/staging/flat-skill assumptions were the final implementation. |

### Notes

- Phase 6 did not land as a neat isolated implementation pass. The phase-5 pivots pulled some CLI/wizard work forward, and this session closed the remaining non-interactive parity and documentation truthfulness gaps that still made the phase feel incomplete.
- The canonical CLI surface is now aligned with the shipped model; the old flag names remain only as backward-compat aliases.
- This session also cleaned up the “source of truth” problem around the wave. The updated design and guides now describe what actually shipped, while the historical plan/work docs explicitly declare where they diverged.
- Phase 7 validation still remains as separate follow-up work, especially smoke-pack and live dogfood verification against the real remote skill sources.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-04-16-cli-skill-installation-r2.md](../../designs/2026-04-16-cli-skill-installation-r2.md) | Living design source updated to the final remote single-skill model and the canonical phase-6 CLI surface. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/00-overview.md) | Plan entrypoint updated with an implemented-divergence note so readers do not mistake the original plan text for the final shipped behavior. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md) | Historical phase-6 plan updated with a divergence note pointing back to the living design for the final flag and wizard model. |
| [docs/work/2026-04-16-w5-r2-cli-skill-installation/00-index.md](../../work/2026-04-16-w5-r2-cli-skill-installation/00-index.md) | Backlog index updated with a divergence note to clarify that the wave’s shipped behavior differs from several mid-implementation assumptions. |
| [docs/work/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md](../../work/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md) | Historical phase-6 backlog updated with a divergence note for the final canonical/alias flag split and the completed non-interactive skill controls. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/roadmap.md](../../guides/developer/roadmap.md) | Roadmap updated to treat skills as the current packaging unit, keep broader agentics as a deferred expansion layer, and stop describing `archive-docs` as a plugin baseline. |

### User

| Path | Description |
| --- | --- |
| [docs/guides/user/getting-started-installing-make-docs.md](../../guides/user/getting-started-installing-make-docs.md) | Install guide updated to document the current harness-first wizard, canonical CLI flags, skill scope, and optional-skill selection workflow. |
