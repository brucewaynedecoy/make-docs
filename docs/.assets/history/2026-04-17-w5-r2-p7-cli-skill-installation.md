---
date: "2026-04-17"
coordinate: "W5 R2 P7"
---

# Phase 7: CLI Skill Installation R2 — Tests, Smoke-Pack, and Dogfood Validation

## Changes

Completed Phase 7 for `w5-r2` by filling the remaining validation gaps, fixing the product issues that the new tests exposed, and proving the shipped harness-aware skill model in a real dogfood install.

| Area | Summary |
| --- | --- |
| [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) and [packages/cli/tests/consistency.test.ts](../../../packages/cli/tests/consistency.test.ts) | Added harness-model and skill-install coverage for both harnesses, legacy `instructionKinds` manifest migration, `skills = false`, single-harness symmetry, relative-link validity inside installed `SKILL.md`, project/global skill scope, and a consistency guard that `BUILDABLE_PATHS` matches the default profile’s buildable asset set. |
| [packages/cli/src/wizard.ts](../../../packages/cli/src/wizard.ts), [packages/cli/tests/wizard.test.ts](../../../packages/cli/tests/wizard.test.ts), and [packages/cli/tests/cli.test.ts](../../../packages/cli/tests/cli.test.ts) | Brought the wizard back into alignment with the shipped harness-first model. The flow now uses a dedicated harness step instead of stale `instructionKinds` state, re-prompts if all harnesses are deselected, and has explicit CLI and wizard coverage for canonical harness flags, deprecated aliases, `--no-skills`, and `--skill-scope`. |
| [packages/cli/src/utils.ts](../../../packages/cli/src/utils.ts) and [packages/cli/src/planner.ts](../../../packages/cli/src/planner.ts) | Fixed the global skill-scope path bug exposed by the new tests. Absolute managed skill paths now stay rooted in the home directory instead of being incorrectly re-joined under the install target, and the planner uses the same resolution path for removals and updates. |
| [scripts/smoke-pack.mjs](../../../scripts/smoke-pack.mjs) | Updated smoke-pack for the final directory-based skill model. The script now asserts expected `.claude/skills/archive-docs/...` and `.agents/skills/archive-docs/...` files, confirms legacy flat skill artifacts and `skill-assets` trees are absent, and uses a temporary local HTTP fixture so packed-install validation still exercises remote fetch behavior without depending on GitHub `main` matching the local workspace. |
| [packages/cli/tests/cli.test.ts](../../../packages/cli/tests/cli.test.ts) and [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Hardened the global-scope tests so they stub both `HOME` and `os.homedir()` to temp directories instead of touching the real `~/.claude` and `~/.agents` trees during validation. |
| Validation | Verified with `npm run build -w starter-docs`, `npm test -w starter-docs`, `bash scripts/check-instruction-routers.sh`, `bash scripts/check-wave-numbering.sh`, `node scripts/smoke-pack.mjs`, and `npm run dev -w starter-docs -- init --yes --target /tmp/skill-dogfood-r2`. The dogfood install produced both harness skill directories and `claude -p --permission-mode bypassPermissions --tools '' -- "/archive-docs What modes do you support? Reply with a short comma-separated list only."` resolved the installed skill and returned `archive, staleness-check, deprecate, archive-impact`. |

### Notes

- This phase surfaced two real implementation gaps rather than just missing tests: the wizard still reflected the older `instructionKinds` model, and global skill scope still routed absolute paths back under the target directory.
- Smoke-pack could not stay release-like while depending on the public GitHub skill URLs alone because the current local workspace had already moved ahead of the remote repo. The local HTTP fixture kept the test remote-fetch-based without reintroducing bundled skills.
- The final validation pass also needed a small test-harness correction: global-scope tests were initially writing into the real home directory until the test suite began stubbing both environment and runtime home resolution.
- Phase 7 closed the wave with both filesystem-level proof and Claude Code skill discovery proof from a real dogfood target.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md](../../work/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md) | Historical phase backlog defining the validation, smoke-pack, and dogfood acceptance criteria completed in this session. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md) | Phase plan describing the intended validation scope and smoke-pack expectations that were carried through to completion here. |
| [docs/designs/2026-04-16-cli-skill-installation-r2.md](../../designs/2026-04-16-cli-skill-installation-r2.md) | Living design source for the remote-registry, single-skill, harness-aware install model that Phase 7 validated end to end. |

### Developer

None this session.

### User

None this session.
