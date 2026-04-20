---
date: "2026-04-17"
coordinate: "W5 R2 P4"
---

# Phase 4: CLI Skill Installation R2 — Skill Install Pipeline

## Changes

Implemented the end-to-end skill installation pipeline for Phase 4. The CLI now resolves registry-backed skills per active harness, rewrites SKILL asset references for installed copies, plans skill file create/update/remove actions alongside the docs asset pipeline, writes those files during apply, and persists installed skill paths in the manifest for later reconfigure runs.

| Area | Summary |
| --- | --- |
| [packages/cli/src/skill-catalog.ts](../../../packages/cli/src/skill-catalog.ts) | Added a new `getDesiredSkillAssets(selections)` module that loads the skill registry, resolves each skill through the Phase 2 `local:` protocol resolver, computes harness-specific install roots for project and global scope, emits installed assets for both SKILL entrypoints and declared plugin assets, and rewrites markdown/code-span references like `references/...`, `scripts/...`, and `./references/...` to the installed `../skill-assets/...` targets. |
| [packages/cli/src/planner.ts](../../../packages/cli/src/planner.ts) | Integrated skill assets into `createInstallPlan` after the docs-template asset catalog. The planner now tracks `desiredSkillFiles`, compares desired outputs against `manifest.skillFiles`, refreshes tracked skill paths that are missing manifest file metadata, and plans `remove-managed` actions when a previously installed harness-specific skill path disappears during reconfigure. |
| [packages/cli/src/install.ts](../../../packages/cli/src/install.ts) | Extended `applyInstallPlan` to maintain a separate `nextSkillFiles` set while applying the existing action types, then persists the final sorted set back into the manifest. Also added safe conflict-staging path normalization so absolute paths produced by global skill installs do not create invalid conflict output paths. |
| [packages/cli/src/manifest.ts](../../../packages/cli/src/manifest.ts) and [packages/cli/src/types.ts](../../../packages/cli/src/types.ts) | Changed `InstallManifest.skillFiles` from the earlier optional object-like shape to a required string array, added backward-compatible migration for missing or legacy `skillFiles` values, and extended the install-plan/manifest types so the final tracked skill path list flows through plan creation and manifest writes cleanly. |
| [packages/cli/tests/skill-catalog.test.ts](../../../packages/cli/tests/skill-catalog.test.ts) and [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Added focused coverage for harness-specific skill paths, global-scope path roots, reference rewriting, installed manifest tracking, and harness-removal reconfigure behavior that deletes deselected harness skill files while preserving the remaining harness. |
| Validation | `npm run build -w starter-docs` passed, and `npm test -w starter-docs` passed with 48/48 tests green after the Phase 4 changes. |

Files modified:

```text
packages/cli/
├── src/
│   ├── skill-catalog.ts   (new harness-aware skill asset catalog + rewrite logic)
│   ├── planner.ts         (plan skill create/update/remove actions)
│   ├── install.ts         (apply and track skill file writes)
│   ├── manifest.ts        (migrate and persist skillFiles array)
│   └── types.ts           (manifest + plan shape updates)
└── tests/
    ├── skill-catalog.test.ts  (new catalog coverage)
    └── install.test.ts        (end-to-end install/reconfigure assertions)
```

Notes for future phases:

- [Phase 5](../../work/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md) now needs to ensure the new skill-catalog inputs (`skill-registry.json`, skill entrypoints, and declared assets) are included in the published package and selectively copied during prepack.
- [Phase 6](../../work/2026-04-16-w5-r2-cli-skill-installation/06-wizard-and-cli-flags.md) can build directly on the new skill pipeline: the remaining work is exposing `skills` and `skillScope` through the wizard and CLI flags rather than adding more install-path infrastructure.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r2-cli-skill-installation/04-skill-install-pipeline.md](../../work/2026-04-16-w5-r2-cli-skill-installation/04-skill-install-pipeline.md) | Work backlog phase — defines the five stage rollout for the harness-aware skill install pipeline that this session completed. |
| [docs/plans/2026-04-16-w5-r2-cli-skill-installation/04-skill-install-pipeline.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/04-skill-install-pipeline.md) | Source plan — specifies the new `skill-catalog.ts`, planner/install integration, manifest `skillFiles` behavior, and acceptance criteria for skill path rewriting and reconfigure removal. |

### Developer

None this session.

### User

None this session.
