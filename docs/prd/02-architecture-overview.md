# 02 Architecture Overview

## Purpose

This document describes how `make-docs` is assembled across template authoring, CLI runtime, packaged distribution, consumer installation, skills delivery, and lifecycle cleanup. It is a synthesis layer above the detailed subsystem docs in `docs/prd/05-installation-profile-and-manifest-lifecycle.md` through `docs/prd/10-packaging-validation-and-release-reference.md`, with code treated as the final authority in `packages/cli/src/*.ts`, `packages/docs/template/`, `packages/skills/`, and `scripts/`.

At a high level, the architecture is a contract-driven asset pipeline wrapped in a lifecycle CLI. `packages/cli/src/index.ts:1-7` boots the process, `packages/cli/src/cli.ts:77-265` resolves the requested operation, `packages/cli/src/profile.ts:68-93` and `packages/cli/src/rules.ts:120-194` derive the target documentation profile, `packages/cli/src/catalog.ts:64-85` and `packages/cli/src/renderers.ts:54-97` materialize the desired asset set, and `packages/cli/src/planner.ts:19-202` plus `packages/cli/src/install.ts:107-157` convert that desired state into deterministic filesystem mutations and manifest state.

## Topology

The architecture has four runtime zones. The authoring zone contains `packages/docs/template/` as the source-of-truth template tree, `packages/skills/` as the authored skill payload source, repo-root `docs/` as the dogfood mirror, and `scripts/` as the maintainer validation and packaging layer (`README.md:7-20`, `packages/docs/README.md:31-48`, `packages/docs/README.md:62-121`).

The build-and-package zone centers on `packages/cli/`. `packages/cli/package.json:6-25` declares the publishable bin and the packaged allowlist, while `scripts/copy-template-to-cli.mjs:24-32` copies `packages/docs/template/` into `packages/cli/template/` during `prepack`. In development, `packages/cli/src/utils.ts:33-42` resolves the sibling template first; in packed artifacts, the same resolver falls back to the bundled `packages/cli/template/`.

The consumer-install zone is the target repository plus optional home-directory skill scope. The installed docs surface lives under `docs/**`, root `AGENTS.md` / `CLAUDE.md`, and `.make-docs/manifest.json` / `.make-docs/conflicts/<run-id>/` (`README.md:24-46`, `packages/cli/src/manifest.ts:17-20`), while skills install under `.claude/skills` and `.agents/skills` in project scope or under the user home directory when `skillScope === "global"` in `packages/cli/src/skill-catalog.ts:18-21` and `packages/cli/src/skill-catalog.ts:50-67`.

The external-dependency zone is intentionally narrow but real. The CLI depends on the local filesystem and Node runtime everywhere, on npm packaging behavior during `prepack` and `npm pack` (`packages/cli/package.json:19-25`, `scripts/smoke-pack.mjs:60-76`), and on remote HTTP fetches for skill payload resolution through `packages/cli/src/skill-resolver.ts:118-244`. Base documentation installs are local-template driven; skills are the part of the architecture that still reaches outside the packaged tarball.

## Module Map

- Entry and command orchestration: `packages/cli/src/index.ts:1-7` invokes `runCli()`, `packages/cli/src/cli.ts:77-265` handles main install/sync/reconfigure, `packages/cli/src/cli.ts:400-410` delegates the skills command, and `packages/cli/src/cli.ts:894-1040` publishes the operator-facing command surface.
- Selection and profile modeling: `packages/cli/src/types.ts:1-97` defines capabilities, harness mappings, selection shapes, assets, and manifests; `packages/cli/src/profile.ts:10-93` applies capability dependencies and computes `profileId`; and `packages/cli/src/wizard.ts:93-104` plus `packages/cli/src/wizard.ts:826-889` drive the interactive choices for prompts, templates, references, harnesses, and skills.
- Template and contract asset pipeline: `packages/cli/src/rules.ts:8-194` maps capabilities to prompt, template, and reference paths; `packages/cli/src/catalog.ts:7-85` turns those paths into `ResolvedAsset[]`; `packages/cli/src/renderers.ts:40-570` renders only the buildable routers and design fallback trio; and `packages/cli/src/utils.ts:49-55` reads copied assets from the resolved template root. The authored files being selected and copied live under `packages/docs/template/docs/assets/**`.
- Planning, apply, and manifest state: `packages/cli/src/planner.ts:19-202` merges desired doc assets with desired skill assets and computes `PlannedAction[]`; `packages/cli/src/planner.ts:204-444` provides the skills-only variant; `packages/cli/src/install.ts:107-157` applies actions and rewrites manifest state; and `packages/cli/src/install.ts:212-223` stages unresolved conflicts under `.make-docs/conflicts/`.
- Skills distribution: `packages/cli/src/skill-registry.ts:23-63` loads and validates the packaged registry, `packages/cli/skill-registry.json:3-112` defines the live skill inventory, `packages/cli/src/skill-catalog.ts:33-127` expands selections into harness-specific assets, `packages/cli/src/skill-resolver.ts:40-244` resolves remote content, and `packages/cli/src/skills-command.ts:32-103` runs the skills-only lifecycle without changing the docs scaffold.
- Lifecycle cleanup and validation: `packages/cli/src/audit.ts:41-87` classifies removable, preserved, skipped, and prunable paths; `packages/cli/src/backup.ts:49-158` and `packages/cli/src/uninstall.ts:52-177` build on that audit report; `packages/cli/tests/consistency.test.ts:33-77` proves template completeness and default-profile consistency; `scripts/check-instruction-routers.sh:1-75` enforces router invariants; and `scripts/smoke-pack.mjs:60-246` validates the packaged tarball against install, skills, backup, and uninstall flows.

## Runtime Boundaries

The first important boundary is dev versus packed execution. `packages/cli/src/utils.ts:33-42` switches between sibling template resolution and bundled template resolution, so the same CLI code runs against `packages/docs/template/` during local development but against `packages/cli/template/` after `prepack`. That split is fundamental to both dogfood correctness and release validation, and `scripts/copy-template-to-cli.mjs:24-32` is the bridge between the two modes.

The second boundary is managed documentation content versus CLI runtime state. Installed contracts, routers, templates, prompts, and authored outputs live under `docs/**`, but manifest state and staged conflicts live under root `.make-docs/` instead of `docs/assets/` (`README.md:39-46`, `packages/cli/src/renderers.ts:173-184`, `packages/cli/src/manifest.ts:17-20`). The architecture explicitly prevents `docs/assets/` from becoming a hidden state directory.

The third boundary is project scope versus home scope for skills. Documentation assets always install relative to the target directory through `packages/cli/src/planner.ts:51-176` and `packages/cli/src/install.ts:173-210`, while skills can target either `.` or `os.homedir()` depending on `InstallSelections.skillScope` in `packages/cli/src/skill-catalog.ts:50-67`. That means uninstall and backup need a broader audit model than docs installation alone, which is why `packages/cli/src/audit.ts:35-39` and `packages/cli/src/manifest.ts:104-133` reason about project, home, and external path scopes.

The fourth boundary is canonical managed content versus local user modifications. The planner trusts manifest hashes and canonical skill content when deciding whether a file is safe to update or remove in `packages/cli/src/planner.ts:77-139`, `packages/cli/src/planner.ts:142-189`, and `packages/cli/src/planner.ts:308-390`. When that proof fails, the architecture preserves local edits and moves generated replacements into conflict staging instead of overwriting them (`packages/cli/src/install.ts:212-223`).

## Data Flow

1. Command ingestion: `packages/cli/src/index.ts:1-7` invokes `runCli()`, `packages/cli/src/cli.ts:455-723` parses argv, validates command-specific flags, loads the current manifest with `packages/cli/src/manifest.ts:26-38`, and decides whether the run is apply, reconfigure, skills, backup, or uninstall.
2. Selection resolution: main install/reconfigure starts from saved manifest selections or `defaultSelections()` in `packages/cli/src/cli.ts:295-346` and `packages/cli/src/profile.ts:17-35`, while the interactive wizard in `packages/cli/src/wizard.ts:826-889` can refine those choices before planning.
3. Desired-state construction: `packages/cli/src/profile.ts:68-93` computes `capabilityState`, `effectiveCapabilities`, and `profileId`; `packages/cli/src/rules.ts:120-194` and `packages/cli/src/catalog.ts:64-85` build the desired docs asset set; and `packages/cli/src/skill-catalog.ts:33-67` plus `packages/cli/src/skill-resolver.ts:40-244` build the desired skill asset set when skills are enabled.
4. Planning and mutation: `packages/cli/src/planner.ts:33-200` hashes desired assets, compares them with on-disk content and manifest metadata, and returns sorted `PlannedAction[]`; `packages/cli/src/install.ts:121-157` executes those actions; and `packages/cli/src/manifest.ts:79-101` persists the new managed state.
5. Lifecycle and release verification: backup and uninstall bypass the install planner and instead rely on `packages/cli/src/audit.ts:41-87`, `packages/cli/src/backup.ts:49-158`, and `packages/cli/src/uninstall.ts:52-177`; packaging verification goes through `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32`, and `scripts/smoke-pack.mjs:60-246`.

## Configuration Surfaces

The primary user-facing configuration surface is the CLI itself. `packages/cli/src/cli.ts:488-579` defines capability flags, prompt/template/reference modes, harness toggles, and skill toggles; `packages/cli/src/cli.ts:894-1040` exposes the supported commands and option groupings; and `packages/cli/src/wizard.ts:93-104` plus `packages/cli/src/wizard.ts:838-888` provide the interactive equivalents.

The persisted configuration surface is `.make-docs/manifest.json`. `packages/cli/src/types.ts:87-97` defines its shape, including `schemaVersion`, `profileId`, `selections`, `effectiveCapabilities`, `files`, and `skillFiles`, while `packages/cli/src/manifest.ts:79-101` writes it and `packages/cli/src/manifest.ts:40-77` migrates older selection formats forward.

The contract-and-template configuration surface lives in the shipped assets. `packages/docs/template/docs/assets/references/output-contract.md`, `packages/docs/template/docs/assets/references/execution-workflow.md`, `packages/docs/template/docs/assets/references/planning-workflow.md`, and the `packages/docs/template/docs/assets/templates/*.md` files define the structure of generated outputs, while `packages/cli/src/rules.ts:55-182` controls which subset of those assets installs for a given profile.

The skill configuration surface is split between packaged metadata and remote content sources. `packages/cli/skill-registry.json:3-112` defines which skills exist, which are required, how they are installed, and which extra assets ship with them; `packages/cli/src/skill-registry.ts:25-114` validates that metadata; and `packages/cli/src/skill-resolver.ts:118-244` normalizes and fetches the remote payloads.

The packaging and validation configuration surface is defined by workspace metadata and scripts. `package.json:10-19` delegates root scripts to the publishable CLI workspace, `packages/cli/package.json:9-25` defines the tarball contents and prepack behavior, `packages/cli/tests/consistency.test.ts:33-77` locks in template completeness assumptions, and `scripts/check-instruction-routers.sh:26-60` enforces router line budgets and banned-heading rules across both template and dogfood copies.

## Source Anchors

- `README.md`
- `package.json`
- `packages/cli/package.json`
- `packages/cli/src/index.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/lifecycle-ui.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/renderers.ts`
- `packages/cli/src/utils.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/docs/README.md`
- `packages/docs/template/docs/assets/references/output-contract.md`
- `packages/docs/template/docs/assets/templates/prd-overview.md`
- `packages/docs/template/docs/assets/templates/prd-architecture.md`
- `packages/cli/skill-registry.json`
- `scripts/copy-template-to-cli.mjs`
- `scripts/check-instruction-routers.sh`
- `scripts/smoke-pack.mjs`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
