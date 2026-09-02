# 02 Architecture Overview

## Purpose

This document describes how `make-docs` is assembled across upstream template authoring, package/provider projection, the shared TypeScript operation registry, CLI and MCP projections, optional project-local resources, manifest and Store state, consumer installation, root dogfood, skills delivery, and lifecycle cleanup. It is a synthesis layer above the detailed subsystem PRDs. Those PRDs own current product authority; code in `packages/cli/src/*.ts`, `packages/docs/template/`, `packages/skills/`, and `scripts/` is implementation evidence and may expose drift that later work must reconcile.

At a high level, the architecture is a contract-driven resource provider and static asset pipeline behind one lifecycle and operation core. `packages/docs/template/` is upstream authority; package preparation produces installed immutable resource bytes; the TypeScript operation registry owns stable identifier normalization, effective local-first resolution, provenance, typed results, lifecycle run capture, and mutation gates; and CLI commands plus MCP tools or native resources project the same core without duplicating behavior. Install planning remains manifest-backed and turns explicit selections into deterministic, reviewable filesystem mutations.

## Topology

The architecture has four runtime zones. The authoring zone contains `packages/docs/template/` as the source-of-truth template tree, `packages/skills/` as the authored skill payload source, repo-root `docs/` as the dogfood mirror, and `scripts/` as the maintainer validation and packaging layer (`README.md` and `packages/docs/README.md`).

The build-and-package zone centers on `packages/cli/`. `packages/cli/package.json` declares the publishable bin and the packaged allowlist, while `scripts/copy-template-to-cli.mjs` copies `packages/docs/template/` into `packages/cli/template/` during `prepack`. In development, `resolveTemplateRoot` in `packages/cli/src/utils.ts` resolves the sibling template first; in packed artifacts, the same resolver falls back to that bundled copy.

The consumer-install zone is the target repository plus optional home-directory skill scope. Its unconditional bootstrap consists of configured-harness routers at the project root, `docs/`, `docs/assets/`, `.make-docs/`, `.make-docs/system/`, and `.make-docs/system/{contracts,prompts,references,templates}/`, plus `.make-docs/manifest.json`. The resolved effective profile and its dependencies add capability-local routers at `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` only for enabled document types. The `docs/assets/` surface has a root router only. Optional managed surfaces include system-resource bodies, `.make-docs/archive/**`, `docs/artifacts/**`, Persona asset or testing children beneath `docs/assets/`, and `.make-docs/conflicts/<run-id>/` when first needed. Explicitly selected skills install canonical shared payloads under `.make-docs/agentics/skills/<skill-name>/` in project scope, or under the user's home-scoped `.make-docs/agentics/skills/<skill-name>/` when `skillScope === "global"`; enabled harnesses receive native skill directories through symlink-preferred exposure or managed copy mirrors under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`.

The external-dependency zone is intentionally narrow but real. The CLI depends on the local filesystem and Node runtime everywhere, on npm packaging behavior during `prepack` and `npm pack` (`packages/cli/package.json`, `scripts/smoke-pack.mjs`), and on remote HTTP fetches for skill payload resolution through `packages/cli/src/skill-resolver.ts`. Base documentation installation and system-resource reads use packaged provider bytes; skills are the part of the architecture that still reaches outside the packaged tarball.

## Module Map

- Entry and command orchestration: `packages/cli/src/index.ts` invokes `runCli`; `runCli`, `parseArgs`, and `printHelp` in `packages/cli/src/cli.ts` own command dispatch, validation, and the operator-facing surface.
- Selection and profile modeling: `Capability`, `Harness`, `InstallSelections`, `InstallProfile`, and `InstallManifest` define the core shapes; profile resolution applies documentation dependencies; and setup or reconfiguration selects capabilities, harnesses, optional skills/agentics, and `none`, individual types, or `all` for local resource projection. It never silently broadens a saved selection.
- Template, provider, and resolver pipeline: contracts, prompts, references, and templates are peer resource types authored in `packages/docs/template/`, projected into the package/provider, and identified as `make-docs://system/<type>/<posix-relative-path>`. One operation-domain resolver applies trustworthy project-local precedence, then the installed provider, then a typed absence or provenance failure; CLI `resource list`/`resource read` and native MCP `resources/list`/`resources/read` where supported use the same identities, bytes, metadata, and errors.
- Planning, apply, and manifest state: `createInstallPlan` and `createSkillsOnlyInstallPlan` in `packages/cli/src/planner.ts` compute `PlannedAction[]`; `applyInstallPlan`, `applySkillsOnlyInstallPlan`, and their shared internal apply path in `packages/cli/src/install.ts` apply actions, rewrite manifest state, and stage unresolved conflicts under `.make-docs/conflicts/`.
- Skills distribution: `loadSkillRegistry` and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts` load and validate the inventory in `packages/cli/skill-registry.json`; `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` expands selections into shared payload assets plus native harness exposures; `resolveSkillSource` in `packages/cli/src/skill-resolver.ts` resolves payload content; and the command entry in `packages/cli/src/skills-command.ts` runs the skills-only lifecycle without changing the docs scaffold.
- Lifecycle cleanup and validation: `createAuditReport` in `packages/cli/src/audit.ts` classifies removable, preserved, skipped, and prunable paths; `runBackupCommand` and `runUninstallCommand` in `packages/cli/src/backup.ts` and `packages/cli/src/uninstall.ts` build on that audit report; `packages/cli/tests/consistency.test.ts` proves template completeness and default-profile consistency; `scripts/check-instruction-routers.sh` enforces router invariants; and `scripts/smoke-pack.mjs` validates the packaged tarball against install, skills, backup, and uninstall flows.

## Runtime Boundaries

The first important boundary is dev versus packed execution. `resolveTemplateRoot` in `packages/cli/src/utils.ts` switches between sibling template resolution and bundled template resolution, so the same CLI code runs against `packages/docs/template/` during local development but against `packages/cli/template/` after `prepack`. That split is fundamental to both dogfood correctness and release validation, and `scripts/copy-template-to-cli.mjs` is the bridge between the two modes.

The second boundary is immutable installed-provider resources versus optional project resource bodies, reader-facing project documentation, and runtime state. Contracts, prompts, references, and templates share stable logical identity independent of installation path; selected clean managed bodies or explicit project-owned overrides may live under `.make-docs/system/{contracts,prompts,references,templates}/`; configured-harness routers remain local in that tree when the bodies are absent; reader-facing project documents and assets live under `docs/**`; and manifest, conflicts, ownership, and provenance remain under root `.make-docs/`. The architecture explicitly prevents `docs/assets/` from becoming either the system-resource root or a hidden runtime-state directory.

The third boundary is project scope versus home scope for skills. Documentation assets always install relative to the target directory through `packages/cli/src/planner.ts` and `packages/cli/src/install.ts`, while selected skills can target either `.` or `os.homedir()` depending on `InstallSelections.skillScope`. The skill catalog applies that scope to both the shared `.make-docs/agentics/skills/**` payload and the harness-native symlink or copy-mirror exposure. That means uninstall and backup need a broader audit model than docs installation alone, which is why `packages/cli/src/audit.ts` and `packages/cli/src/manifest.ts` reason about project, home, and external path scopes.

The fourth boundary is canonical managed content versus local user modifications. `createInstallPlan`, `planDesiredSkillAsset`, and `getCurrentManifestHash` in `packages/cli/src/planner.ts` use manifest hashes and canonical skill content when deciding whether a file is safe to update or remove. When that proof fails, `applyInstallPlan` in `packages/cli/src/install.ts` preserves local edits and moves generated replacements into conflict staging instead of overwriting them.

- System-resource delivery uses the installed provider for bodies by default, always creates the configured-harness router skeleton under `.make-docs/system/**`, and creates resource bodies only for an explicit provenance-aware local projection, while keeping provider/projection state out of `docs/assets/`; [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md) owns the detailed contract.
- Runtime mutation paths must classify manifest and fallback state before writing, and TypeScript CLI/MCP paths must preserve the source-state and disposition taxonomy owned by [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- Runtime state, system/custom tool resources, local bootstrap, provider/cache provenance, and agentics surfaces in the [project tool-directory model](./21-project-tool-directory-and-resource-tiers.md) are distinct from reader-facing `docs/assets/**`.
- Make Docs v2 has no Playbook or Protocol document, workflow, operation, packaging, compiler, harness-adapter, support, or Store capability. Historical records remain provenance and opaque legacy Store rows are preserved, but no current architecture component may create, discover, interpret, or promise interoperability for those subjects.
- [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns the reader-facing project documentation asset namespace. Make Docs-managed archival/provenance records belong under on-demand `.make-docs/archive/**`, non-authoritative source and analysis inputs under on-demand `docs/artifacts/**`, and Persona-scoped reader assets and testing evidence under on-demand children of the unconditional `docs/assets/` root. Those children do not have managed routers. Old archive, artifact, library, or workflow-shaped layouts are migration inputs rather than current shipped targets.
- Naive end-user UAT remains a product workflow delivered through the peer system-resource resolver and an optional thin first-party Skill adapter. Persona resolution and typed deterministic operations remain in the shared TypeScript core, while versioned scenario authority and evidence stay in project documents under the selected persona's testing surface.
- YAML frontmatter is the canonical metadata layer for generated docs, required body handoffs remain the human-readable rendering, and validators report YAML/body drift without turning advisory follow-ons into gates, as detailed by [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Optional `.make-docs/config.yaml` is a project-owned presentation overlay for labels, personas, and generated prose, not routing authority for paths, metadata fields, route identifiers, or coordinate lineage; [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md) owns its detailed contract.

## Data Flow

1. Command ingestion: `packages/cli/src/index.ts` invokes `runCli`; `parseArgs` and `validateParsedArgs` in `packages/cli/src/cli.ts` parse and validate argv; `loadManifest` in `packages/cli/src/manifest.ts` loads current state; and `runCli` decides whether the run is apply, reconfigure, skills, backup, or uninstall.
2. Selection resolution: main install/reconfigure starts from saved manifest selections or `defaultSelections()` in `packages/cli/src/cli.ts` and `packages/cli/src/profile.ts`, while the interactive wizard in `packages/cli/src/wizard.ts` can refine those choices before planning.
3. Desired-state construction: `resolveInstallProfile` in `packages/cli/src/profile.ts` computes `capabilityState`, `effectiveCapabilities`, and `profileId`; the rule collections in `packages/cli/src/rules.ts` plus `getDesiredAssets` in `packages/cli/src/catalog.ts` build the desired docs asset set; and `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` plus `resolveSkillSource` in `packages/cli/src/skill-resolver.ts` build the desired shared payload and native harness exposure asset set when skills are enabled.
4. Planning and mutation: `createInstallPlan` in `packages/cli/src/planner.ts` hashes desired assets, compares them with on-disk content and manifest metadata, and returns sorted `PlannedAction[]`; `applyInstallPlan` in `packages/cli/src/install.ts` executes those actions; and `writeManifest` in `packages/cli/src/manifest.ts` persists the new managed state.
5. Lifecycle and release verification: backup and uninstall bypass the install planner and instead rely on `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts`; packaging verification goes through `packages/cli/package.json`, `scripts/copy-template-to-cli.mjs`, and `scripts/smoke-pack.mjs`.

Resource reads follow a separate non-mutating path: normalize the stable URI, resolve a trustworthy local projection or installed provider through the shared operation domain, verify identity and provenance, and project the same typed result to CLI and native MCP. General lifecycle run mutations resolve project identity from the manifest, transact bounded `lifecycle` run state or evidence references in the machine Store, and return a typed receipt without changing repository authority.

## Configuration Surfaces

The primary user-facing configuration surface is the CLI itself. It exposes capability and harness selection, explicit skill enablement, scope, selected names, and resource-projection selection by `none`, individual peer types, or `all`. Resource availability through the installed CLI/MCP provider does not depend on local projection, and non-interactive setup or reconfiguration requires explicit flags or saved manifest selection rather than silently broadening the footprint.

The persisted configuration surface is `.make-docs/manifest.json`. `InstallManifest` in `packages/cli/src/types.ts` defines its shape, including `schemaVersion`, `profileId`, `selections`, `effectiveCapabilities`, `files`, and `skillFiles`, while `writeManifest` and `validateAndMigrateManifest` in `packages/cli/src/manifest.ts` persist current state and migrate supported older formats forward.

PRD 24 defines optional `.make-docs/config.yaml` as project-owned convention configuration. That file is separate from manifest/runtime state and may influence rendering only; canonical path selection, metadata validation, package copy, provider/cache behavior, and agentic routing still use canonical identifiers.

The system-resource surface lives in upstream shipped assets. `packages/docs/template/.make-docs/system/{contracts,prompts,references,templates}/**` defines peer resources; package preparation supplies provider bytes; the manifest records selection, ownership, provenance, and hashes for any local resource bodies; and `.make-docs/config.yaml` remains a project-owned presentation overlay that cannot redefine stable resource identity, resolver precedence, operation identifiers, or lifecycle receipt semantics.

The skill configuration surface is split between packaged metadata and payload sources. `packages/cli/skill-registry.json` defines which skills exist, which source payloads are resolved, and which extra assets belong in the canonical shared payload; `SkillRegistry`, `SkillRegistryEntry`, and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts` define and validate that metadata; `resolveSkillSource` in `packages/cli/src/skill-resolver.ts` normalizes and reads local or remote payloads; and `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts` plans native harness exposure from the resolved selection metadata.

The packaging and validation configuration surface is defined by workspace metadata and scripts. `package.json` delegates root scripts to the publishable CLI workspace, `packages/cli/package.json` defines the tarball contents and prepack behavior, `packages/cli/tests/consistency.test.ts` locks in template completeness assumptions, and `scripts/check-instruction-routers.sh` enforces router line budgets and banned-heading rules across both template and dogfood copies.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Purpose`, `Topology`, `Module Map`, `Runtime Boundaries`, `Data Flow`, and `Configuration Surfaces`
- Previous contract: Architecture centered mandatory local resource families, active Playbook surfaces, and archive/artifact/library paths beneath `docs/assets/**` without one stable resource resolver or general lifecycle-run receipt boundary.
- Replacement contract: Upstream template authority projects immutable package/provider bytes; one TypeScript operation core resolves peer system resources for CLI and native MCP; local `.make-docs/system/` projection is optional and provenance-aware; managed archive, non-authoritative artifacts, and persona assets use their accepted on-demand targets; Naive UAT uses system resources plus an optional thin Skill; root dogfood remains downstream; Playbooks and Protocols are absent from current architecture; and bounded lifecycle run mutations return typed Store receipts.
- Rationale: The architecture synthesis must state the accepted W19 R1 product boundary and recovery invariants in present tense.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
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
- `packages/docs/template/.make-docs/system/contracts/output-contract.md`
- `packages/docs/template/.make-docs/system/templates/prd-overview.md`
- `packages/docs/template/.make-docs/system/templates/prd-architecture.md`
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
