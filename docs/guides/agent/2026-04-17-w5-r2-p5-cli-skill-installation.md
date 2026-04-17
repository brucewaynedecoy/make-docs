# Phase 5: CLI Skill Installation R2 — Remote Registry and Single-Skill Delivery

## Changes

Implemented Phase 5 around the clarified requirement that the CLI should publish a registry of installable skills, not bundle skill payloads. The shipped result is a remote, registry-driven install path that treats `archive-docs` as one required skill and `decompose-codebase` as one optional skill.

| Area | Summary |
| --- | --- |
| [packages/cli/skill-registry.json](../../../packages/cli/skill-registry.json) | Reduced the registry to two public remote entries: required `archive-docs` and optional `decompose-codebase`. The registry no longer models `archive-docs` as exploded subskills or a plugin-derived bundle. |
| [packages/cli/src/skill-resolver.ts](../../../packages/cli/src/skill-resolver.ts) and [packages/cli/src/skill-catalog.ts](../../../packages/cli/src/skill-catalog.ts) | Shifted skill resolution to remote sources and directory-based installs. Skills are installed under `.claude/skills/<name>/` and `.agents/skills/<name>/`, with support files colocated inside the skill directory instead of projected into `skill-assets/`. |
| [packages/skills/archive-docs/SKILL.md](../../../packages/skills/archive-docs/SKILL.md) and [packages/skills/archive-docs/references/archive-workflow.md](../../../packages/skills/archive-docs/references/archive-workflow.md) | Converted `archive-docs` into one standalone skill with internal routing for `archive`, `staleness-check`, `deprecate`, and `archive-impact`. Shared workflow/reference logic stayed in adjacent support files rather than separate installable subskills. |
| [packages/cli/src/manifest.ts](../../../packages/cli/src/manifest.ts), [packages/cli/src/planner.ts](../../../packages/cli/src/planner.ts), and [packages/cli/src/install.ts](../../../packages/cli/src/install.ts) | Added migration and cleanup for prior flat-skill outputs so reconfigure/update removes previously managed `archive-docs-*.md` installs and any earlier `skill-assets`-based artifacts when replacing them with directory installs. |
| [scripts/copy-template-to-cli.mjs](../../../scripts/copy-template-to-cli.mjs) and [packages/cli/package.json](../../../packages/cli/package.json) | Preserved registry-only publishing. Prepack validates the registry and the npm tarball includes the registry metadata, but no bundled skill tree or staging directory is produced. |
| Validation | Verified with `npm run build -w starter-docs`, `npm test -w starter-docs`, `npm run prepack -w starter-docs`, and `npm pack --dry-run` in `packages/cli`. The dry-run tarball included registry metadata and excluded bundled skills. |

### Notes

- The largest inflection point was abandoning the attempted “selective prepack” staging model. Once the requirement was clarified, shipping the registry alone was the correct boundary for the CLI package.
- Another major correction was removing the plugin interpretation of `archive-docs`. Converting it to one skill avoided harness-specific plugin logic while still preserving the scripts, references, and agent files that needed to travel with the skill.
- Directory installs replaced the earlier flat projection model. This removed the need for `skill-assets` rewriting and let relative references keep working from within the installed skill folder.
- The final phase behavior is intentionally remote-only at the registry level. Earlier in-session exploration considered retaining `local:` compatibility, but the shipped path standardized on public remote sources instead.
- The written `w5-r2` plan/work docs still record earlier execution assumptions such as `local:` resolution, flat `archive-docs-*.md` installs, and selective staging. They remain historical artifacts rather than the final source of truth.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md](../../work/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md) | Historical phase backlog for the packaging portion of `w5-r2`. The shipped implementation diverged from its staging-oriented prepack model. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md) | Historical phase plan for packaging. Kept as lineage even though the final implementation did not publish a staging directory. |
| [docs/designs/2026-04-16-cli-skill-installation-r2.md](../../designs/2026-04-16-cli-skill-installation-r2.md) | Living design source for the final remote-registry, single-skill `archive-docs` model. |

### Developer

None this session.

### User

None this session.
