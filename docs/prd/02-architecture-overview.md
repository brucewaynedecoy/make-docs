# 02 Architecture Overview

## Purpose

This document describes how `make-docs` is assembled across template authoring, CLI runtime, packaged distribution, consumer installation, skills delivery, and lifecycle cleanup. It is a synthesis layer above the detailed subsystem docs in `docs/prd/05-installation-profile-and-manifest-lifecycle.md` through `docs/prd/10-packaging-validation-and-release-reference.md`. Those PRDs own current product authority; code in `packages/cli/src/*.ts`, `packages/docs/template/`, `packages/skills/`, and `scripts/` is implementation evidence and may expose drift that the current requirements require later work to reconcile.

At a high level, the architecture is a contract-driven static asset pipeline wrapped in a lifecycle CLI. `packages/cli/src/index.ts` boots `runCli`; `runCli` in `packages/cli/src/cli.ts` resolves the requested operation; `resolveInstallProfile` in `packages/cli/src/profile.ts` and the rule collections in `packages/cli/src/rules.ts` derive the target documentation profile; `getDesiredAssets` in `packages/cli/src/catalog.ts` reads desired assets from the template; and `createInstallPlan` plus `applyInstallPlan` in `packages/cli/src/planner.ts` and `packages/cli/src/install.ts` convert that desired state into deterministic filesystem mutations and manifest state.

## Topology

The architecture has four runtime zones. The authoring zone contains `packages/docs/template/` as the source-of-truth template tree, `packages/skills/` as the authored skill payload source, repo-root `docs/` as the dogfood mirror, and `scripts/` as the maintainer validation and packaging layer (`README.md` and `packages/docs/README.md`).

The build-and-package zone centers on `packages/cli/`. `packages/cli/package.json` declares the publishable bin and the packaged allowlist, while `scripts/copy-template-to-cli.mjs` copies `packages/docs/template/` into `packages/cli/template/` during `prepack`. In development, `resolveTemplateRoot` in `packages/cli/src/utils.ts` resolves the sibling template first; in packed artifacts, the same resolver falls back to that bundled copy.

The consumer-install zone is the target repository plus optional home-directory skill scope. The installed docs surface lives under `docs/**`, root `AGENTS.md` / `CLAUDE.md`, and `.make-docs/manifest.json` / `.make-docs/conflicts/<run-id>/` (`README.md`, `packages/cli/src/manifest.ts`). Explicitly selected skills install canonical shared payloads under `.make-docs/agentics/skills/<skill-name>/` in project scope, or under the user's home-scoped `.make-docs/agentics/skills/<skill-name>/` when `skillScope === "global"`; enabled harnesses receive native skill directories through symlink-preferred exposure or managed copy mirrors under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`.

The external-dependency zone is intentionally narrow but real. The CLI depends on the local filesystem and Node runtime everywhere, on npm packaging behavior during `prepack` and `npm pack` (`packages/cli/package.json`, `scripts/smoke-pack.mjs`), and on remote HTTP fetches for skill payload resolution through `packages/cli/src/skill-resolver.ts`. Base documentation installs are local-template driven; skills are the part of the architecture that still reaches outside the packaged tarball.

## Module Map

- Entry and command orchestration: `packages/cli/src/index.ts` invokes `runCli`; `runCli`, `parseArgs`, and `printHelp` in `packages/cli/src/cli.ts` own command dispatch, validation, and the operator-facing surface.
- Selection and profile modeling: `Capability`, `Harness`, `InstallSelections`, `InstallProfile`, and `InstallManifest` in `packages/cli/src/types.ts` define the core shapes; `CAPABILITY_DEPENDENCIES` and `resolveInstallProfile` in `packages/cli/src/profile.ts` apply dependencies and compute `profileId`; and the interactive surface selects capabilities, harnesses, and an explicit skill set. Prompt starters, document templates, and references are invariant managed assets for their owning capabilities, not independent choices.
- Template and contract asset pipeline: the rule collections in `packages/cli/src/rules.ts` map capabilities to prompt, template, and reference paths; `getDesiredAssets` in `packages/cli/src/catalog.ts` turns those paths into `ResolvedAsset[]`; and `readPackageFile` in `packages/cli/src/utils.ts` reads copied assets from the resolved template root. The authored files being selected and copied live under `packages/docs/template/**`; selected paths are copied as static template bytes.
- Planning, apply, and manifest state: `createInstallPlan` and `createSkillsOnlyInstallPlan` in `packages/cli/src/planner.ts` compute `PlannedAction[]`; `applyInstallPlan`, `applySkillsOnlyInstallPlan`, and their shared internal apply path in `packages/cli/src/install.ts` apply actions, rewrite manifest state, and stage unresolved conflicts under `.make-docs/conflicts/`.
- Skills distribution: `loadSkillRegistry` and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts` load and validate the inventory in `packages/cli/skill-registry.json`; `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` expands selections into shared payload assets plus native harness exposures; `resolveSkillSource` in `packages/cli/src/skill-resolver.ts` resolves payload content; and the command entry in `packages/cli/src/skills-command.ts` runs the skills-only lifecycle without changing the docs scaffold.
- Lifecycle cleanup and validation: `createAuditReport` in `packages/cli/src/audit.ts` classifies removable, preserved, skipped, and prunable paths; `runBackupCommand` and `runUninstallCommand` in `packages/cli/src/backup.ts` and `packages/cli/src/uninstall.ts` build on that audit report; `packages/cli/tests/consistency.test.ts` proves template completeness and default-profile consistency; `scripts/check-instruction-routers.sh` enforces router invariants; and `scripts/smoke-pack.mjs` validates the packaged tarball against install, skills, backup, and uninstall flows.

## Runtime Boundaries

The first important boundary is dev versus packed execution. `resolveTemplateRoot` in `packages/cli/src/utils.ts` switches between sibling template resolution and bundled template resolution, so the same CLI code runs against `packages/docs/template/` during local development but against `packages/cli/template/` after `prepack`. That split is fundamental to both dogfood correctness and release validation, and `scripts/copy-template-to-cli.mjs` is the bridge between the two modes.

The second boundary is installed system resources versus reader-facing project documentation and runtime state. Installed make-docs contracts, references, and templates live under root `.make-docs/{contracts,references,templates}/system/**`; reader-facing project documents and assets live under `docs/**`; and `InstallManifest` state plus staged conflicts remain under root `.make-docs/` through `loadManifest` / `writeManifest` in `packages/cli/src/manifest.ts`. The architecture explicitly prevents `docs/assets/` from becoming either the system-resource root or a hidden runtime-state directory.

The third boundary is project scope versus home scope for skills. Documentation assets always install relative to the target directory through `packages/cli/src/planner.ts` and `packages/cli/src/install.ts`, while selected skills can target either `.` or `os.homedir()` depending on `InstallSelections.skillScope`. The skill catalog applies that scope to both the shared `.make-docs/agentics/skills/**` payload and the harness-native symlink or copy-mirror exposure. That means uninstall and backup need a broader audit model than docs installation alone, which is why `packages/cli/src/audit.ts` and `packages/cli/src/manifest.ts` reason about project, home, and external path scopes.

The fourth boundary is canonical managed content versus local user modifications. `createInstallPlan`, `planDesiredSkillAsset`, and `getCurrentManifestHash` in `packages/cli/src/planner.ts` use manifest hashes and canonical skill content when deciding whether a file is safe to update or remove. When that proof fails, `applyInstallPlan` in `packages/cli/src/install.ts` preserves local edits and moves generated replacements into conflict staging instead of overwriting them.

- System asset materialization distinguishes full-snapshot, provider-backed, and hybrid pinned-cache assets while preserving a non-provider-backed local bootstrap and keeping provider/cache state out of `docs/assets/`; [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md) owns the detailed mode contract.
- Runtime mutation paths must classify manifest and fallback state before writing, and TypeScript CLI/MCP paths must preserve the source-state and disposition taxonomy owned by [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- Runtime state, system/custom tool resources, local bootstrap, provider/cache provenance, and agentics surfaces in the [project tool-directory model](./21-project-tool-directory-and-resource-tiers.md) are distinct from reader-facing `docs/assets/**`.
- [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns the managed project documentation asset namespace. `docs/assets/archive/**`, `docs/assets/archive/history/**`, `docs/assets/artifacts/**`, `docs/assets/library/**`, and `docs/assets/playbooks/**` are the v2 asset surfaces; top-level `docs/artifacts/**` is a hard move to `docs/assets/artifacts/**`; and top-level `docs/archive/**` is not a shipped v2 target. [47-persona-model.md](./47-persona-model.md) separately owns authoritative `persona` frontmatter for persona-scoped library and playbook documents.
- YAML frontmatter is the canonical metadata layer for generated docs, required body handoffs remain the human-readable rendering, and validators report YAML/body drift without turning advisory follow-ons into gates, as detailed by [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Optional `.make-docs/config.yaml` is a project-owned presentation overlay for labels, personas, and generated prose, not routing authority for paths, metadata fields, route identifiers, or coordinate lineage; [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md) owns its detailed contract.

## Data Flow

1. Command ingestion: `packages/cli/src/index.ts` invokes `runCli`; `parseArgs` and `validateParsedArgs` in `packages/cli/src/cli.ts` parse and validate argv; `loadManifest` in `packages/cli/src/manifest.ts` loads current state; and `runCli` decides whether the run is apply, reconfigure, skills, backup, or uninstall.
2. Selection resolution: main install/reconfigure starts from saved manifest selections or `defaultSelections()` in `packages/cli/src/cli.ts` and `packages/cli/src/profile.ts`, while the interactive wizard in `packages/cli/src/wizard.ts` can refine those choices before planning.
3. Desired-state construction: `resolveInstallProfile` in `packages/cli/src/profile.ts` computes `capabilityState`, `effectiveCapabilities`, and `profileId`; the rule collections in `packages/cli/src/rules.ts` plus `getDesiredAssets` in `packages/cli/src/catalog.ts` build the desired docs asset set; and `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` plus `resolveSkillSource` in `packages/cli/src/skill-resolver.ts` build the desired shared payload and native harness exposure asset set when skills are enabled.
4. Planning and mutation: `createInstallPlan` in `packages/cli/src/planner.ts` hashes desired assets, compares them with on-disk content and manifest metadata, and returns sorted `PlannedAction[]`; `applyInstallPlan` in `packages/cli/src/install.ts` executes those actions; and `writeManifest` in `packages/cli/src/manifest.ts` persists the new managed state.
5. Lifecycle and release verification: backup and uninstall bypass the install planner and instead rely on `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts`; packaging verification goes through `packages/cli/package.json`, `scripts/copy-template-to-cli.mjs`, and `scripts/smoke-pack.mjs`.

## Configuration Surfaces

The primary user-facing configuration surface is the CLI itself. It exposes capability and harness selection plus explicit skill enablement, scope, and selected names. It exposes no prompt-inclusion, template-mode, or reference-mode choices or flags; prompt starters, document templates, and references follow their owning capability as invariant managed assets.

The persisted configuration surface is `.make-docs/manifest.json`. `InstallManifest` in `packages/cli/src/types.ts` defines its shape, including `schemaVersion`, `profileId`, `selections`, `effectiveCapabilities`, `files`, and `skillFiles`, while `writeManifest` and `validateAndMigrateManifest` in `packages/cli/src/manifest.ts` persist current state and migrate supported older formats forward.

PRD 24 defines optional `.make-docs/config.yaml` as project-owned convention configuration. That file is separate from manifest/runtime state and may influence rendering only; canonical path selection, metadata validation, package copy, provider/cache behavior, and agentic routing still use canonical identifiers.

The contract-and-template configuration surface lives in the shipped assets. `packages/docs/template/.make-docs/contracts/system/output-contract.md`, `packages/docs/template/.make-docs/references/system/execution-workflow.md`, `packages/docs/template/.make-docs/references/system/planning-workflow.md`, and the `packages/docs/template/.make-docs/templates/system/*.md` files define the structure of generated outputs, while `packages/cli/src/rules.ts` controls which subset of those assets installs for a given profile.

The skill configuration surface is split between packaged metadata and payload sources. `packages/cli/skill-registry.json` defines which skills exist, which source payloads are resolved, and which extra assets belong in the canonical shared payload; `SkillRegistry`, `SkillRegistryEntry`, and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts` define and validate that metadata; `resolveSkillSource` in `packages/cli/src/skill-resolver.ts` normalizes and reads local or remote payloads; and `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` plans native harness exposure from the resolved selection metadata.

The packaging and validation configuration surface is defined by workspace metadata and scripts. `package.json` delegates root scripts to the publishable CLI workspace, `packages/cli/package.json` defines the tarball contents and prepack behavior, `packages/cli/tests/consistency.test.ts` locks in template completeness assumptions, and `scripts/check-instruction-routers.sh` enforces router line budgets and banned-heading rules across both template and dogfood copies.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

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
- `packages/docs/template/.make-docs/contracts/system/output-contract.md`
- `packages/docs/template/.make-docs/templates/system/prd-overview.md`
- `packages/docs/template/.make-docs/templates/system/prd-architecture.md`
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
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
