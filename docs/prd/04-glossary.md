# 04 Glossary

## Purpose

This glossary defines the typed and operational vocabulary used across the active `make-docs` PRD set. The most important terms come directly from the CLI contracts in `packages/cli/src/types.ts:1-271`, the profile and manifest logic in `packages/cli/src/profile.ts:10-99` and `packages/cli/src/manifest.ts:18-245`, the asset pipeline in `packages/cli/src/catalog.ts:7-85` and `packages/cli/src/renderers.ts:40-570`, and the lifecycle boundary in `packages/cli/src/audit.ts:41-940`.

## Terms

| Term | Meaning | Key anchors |
| --- | --- | --- |
| Active PRD set | The current live PRD namespace rooted at `docs/prd/`, with a fixed core of `00` through `04` plus adaptive subsystem/reference docs `05+` as required by `docs/assets/references/output-contract.md`. | `docs/assets/references/output-contract.md`, `README.md:8068-8609` |
| Capability | One of `designs`, `plans`, `prd`, or `work`. Capabilities are the top-level docs families the installer can enable or disable. | `packages/cli/src/types.ts:1-3` |
| Effective capability | The runtime-enabled form of a capability after prerequisite enforcement. A capability can remain selected but ineffective when its dependencies are disabled. | `packages/cli/src/profile.ts:10-15`, `packages/cli/src/profile.ts:42-65` |
| Harness | One of `claude-code` or `codex`. Harness selection controls which root instruction file is active and which skill install roots are used. | `packages/cli/src/types.ts:9-18`, `packages/cli/src/skill-catalog.ts:18-46` |
| Instruction kind | The file-level harness marker, either `AGENTS.md` or `CLAUDE.md`. Active instruction kinds expand across root, docs, and asset routers. | `packages/cli/src/types.ts:5-18`, `packages/cli/src/catalog.ts:23-61` |
| Install selections | The raw user intent captured before capability resolution, including harnesses, skills, prompt starters, template/reference modes, and optional skills. | `packages/cli/src/types.ts:38-58`, `packages/cli/src/cli.ts:295-346` |
| Install profile | The resolved installation state produced from selections, including `capabilityState`, `effectiveCapabilities`, and a stable `profileId`. | `packages/cli/src/types.ts:68-74`, `packages/cli/src/profile.ts:68-99` |
| Profile ID | The deterministic hash of the resolved install profile. It lets later syncs compare precise profile state rather than a vague installed/not-installed flag. | `packages/cli/src/profile.ts:74-92` |
| Install manifest | The persisted managed-state record written to `.make-docs/manifest.json`, including selections, effective capabilities, managed files, and managed skill files. | `packages/cli/src/types.ts:87-97`, `packages/cli/src/manifest.ts:18-101` |
| Resolved asset | The normalized unit of desired installer output. Each asset carries `relativePath`, `assetClass`, `sourceId`, and final `content`. | `packages/cli/src/types.ts:75-80`, `packages/cli/src/catalog.ts:64-85` |
| Buildable asset | A generated asset whose content is rendered at install time rather than copied byte-for-byte from the template tree. Today this mainly means routers and the design fallback trio. | `packages/cli/src/catalog.ts:7-20`, `packages/cli/src/renderers.ts:40-96` |
| Scoped-static asset | A copied asset that still participates in profile-aware inclusion rules. Most references, templates, and prompts are installed this way. | `packages/cli/src/catalog.ts:7-20`, `packages/cli/src/utils.ts:49-55` |
| Planned action | The unit of installer or skills-only work in an `InstallPlan`: `create`, `generate`, `update`, `update-conflict`, `noop`, `remove-managed`, or `skip-conflict`. | `packages/cli/src/types.ts:29-129`, `packages/cli/src/planner.ts:19-390` |
| Conflict staging | The non-destructive behavior where generated replacements for locally modified managed files are written under `.make-docs/conflicts/<run-id>/...` instead of overwriting the user’s copy. | `packages/cli/src/install.ts:166-240`, `packages/cli/src/utils.ts:87` |
| Skill scope | Whether installed skills live in the target project or in the user’s home directory. Global installs later surface in audit and backup as `_home/...` paths. | `packages/cli/src/skill-catalog.ts:33-46`, `packages/cli/src/manifest.ts:135-183` |
| Managed skill file | A skill asset tracked separately from ordinary scaffold files inside `manifest.skillFiles`. Skills-only operations depend on that split. | `packages/cli/src/types.ts:87-97`, `packages/cli/src/install.ts:96-163`, `packages/cli/src/planner.ts:204-390` |
| Audit report | The shared lifecycle classification that partitions managed state into `removableFiles`, `prunableDirectories`, `preservedPaths`, and `skippedPaths`. | `packages/cli/src/types.ts:241-271`, `packages/cli/src/audit.ts:41-79` |
| Prunable directory | A directory the audit engine can prove will be empty after approved removals, allowing uninstall to remove it safely. | `packages/cli/src/audit.ts:577-724` |
| Dogfood surface | The repo-root `docs/` tree used by this project to exercise the same template contracts and workflows it ships to consumers. | `README.md:313-3056`, `packages/docs/README.md:50-121`, `packages/cli/src/utils.ts:33-55` |
| Prepack bundle | The packaged CLI state after `prepack` copies `packages/docs/template/` into `packages/cli/template/` and builds the CLI output. | `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32` |
| Smoke-pack | The end-to-end packaged validation script that proves prepack, tarball creation, installer behavior, skills, backup, and uninstall still agree. | `scripts/smoke-pack.mjs:60-246` |
| Reserved content package | The future-facing `packages/content/` workspace described in `README.md:10-17` for CLI-rendered content fragments, which still lacks a live selector, renderer, or release contract. | `README.md:10-17`, `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/renderers.ts:54-570` |

## Source Anchors

- `docs/assets/references/output-contract.md`
- `README.md:313-3056`
- `packages/cli/src/types.ts:1-271`
- `packages/cli/src/profile.ts:10-99`
- `packages/cli/src/manifest.ts:18-245`
- `packages/cli/src/catalog.ts:7-85`
- `packages/cli/src/renderers.ts:40-570`
- `packages/cli/src/planner.ts:19-390`
- `packages/cli/src/install.ts:96-240`
- `packages/cli/src/skill-catalog.ts:18-138`
- `packages/cli/src/audit.ts:41-940`
- `packages/cli/package.json:19-25`
- `scripts/copy-template-to-cli.mjs:24-32`
- `scripts/smoke-pack.mjs:60-246`
