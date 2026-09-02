# 08 Skills Catalog and Distribution

## Purpose

This subsystem defines which agent skills `make-docs` can install, how users select them, how canonical skill payloads land under `.make-docs/agentics/skills/**`, and how native harness exposure makes those payloads available to Claude Code and Codex install roots. The public entry is `make-docs setup skills` under [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md); `runSkillsCommand` in `packages/cli/src/skills-command.ts` reads the packaged registry in `packages/cli/skill-registry.json` through `loadEffectiveSkillRegistry` and resolves payloads through `resolveSkillSource` in `packages/cli/src/skill-resolver.ts`.

The authoring source tree for shipped skills lives under `packages/skills/`, with the current inventory rooted at `packages/skills/archive-docs/`, `packages/skills/cleanup-docs/`, and `packages/skills/decompose-codebase/`. The package itself is deliberately narrow today; `packages/skills/package.json` describes it as the agent skills catalog, while `packages/skills/README.md` currently contains only the heading "Document Skills".

## Scope

This doc covers the dedicated `make-docs setup skills` lifecycle surface, the registry and resolver model, shared payload installation, native harness exposure, project-vs-global skill placement, manifest-backed skill ownership, and the current shipped skills across `packages/cli` and `packages/skills`. Command-specific validation and help must conform to PRD 39, while `planSkillsOnlyInstall` and `applySkillsOnlyInstallPlan` in `packages/cli/src/install.ts` plus `createSkillsOnlyInstallPlan` in `packages/cli/src/planner.ts` implement the skills-only planner/apply path.

This doc does not define the internal behavior of each skill after the harness exposes the canonical shared payload; those behaviors are owned by the skill payloads themselves, such as `packages/skills/archive-docs/SKILL.md` and `packages/skills/decompose-codebase/SKILL.md`. It also does not redefine the broader docs/template catalog handled elsewhere by `packages/cli/src/catalog.ts` and `packages/docs/template/`.

Code anchors:

- `packages/cli/src/cli.ts` — `runSkillsCommand`, `validateParsedArgs`
- `packages/cli/src/skills-command.ts` — `runSkillsCommand`
- `packages/cli/src/install.ts` — `planSkillsOnlyInstall`, `applySkillsOnlyInstallPlan`
- `packages/cli/src/planner.ts` — `createSkillsOnlyInstallPlan`
- `packages/skills/archive-docs/SKILL.md`
- `packages/skills/decompose-codebase/SKILL.md`

## Component and Capability Map

The resolver normalizes GitHub protocol and tree/blob URLs into `raw.githubusercontent.com` URLs through `normalizeGithubProtocol`, `normalizeGithubUrl`, and `buildGithubRawUrl` in `packages/cli/src/skill-resolver.ts`. `readSourceText` and `readSourceBinary` read Markdown assets as text and other assets as binary. The shipped registry uses GitHub tree URLs under `packages/skills/...`, so the built-in runtime model today is "packaged remote registry plus remote fetch" rather than "packaged local skill payload".

The shipped skill inventory is optional. The registry tracks exactly `archive-docs`, `cleanup-docs`, and `decompose-codebase` so users can explicitly install, update, back up, or remove them, but a default docs scaffold writes no skill files. `packages/cli/tests/install.test.ts` must keep confirming that the default profile records `skillFiles: []`, while explicit selected-skill runs install the requested shared skill payloads and native harness exposures.

Code anchors:

- `packages/cli/src/cli.ts` — `runSkillsCommand`, `resolveSelections`, `validateParsedArgs`
- `packages/cli/src/skills-command.ts` — `runSkillsCommand`
- `packages/cli/src/skills-ui.ts` — `renderSkillsPlanSummary`, `getRenderedSkillActions`
- `packages/cli/src/skill-catalog.ts` — `getDesiredSkillAssets`
- `packages/cli/src/skill-registry.ts` — `loadEffectiveSkillRegistry`, `validateSkillRegistryManifest`
- `packages/cli/src/skill-resolver.ts` — `resolveSkillSource`

## Contracts and Data

### Explicit Selected-Skill Model

- Registry entries describe installable skills and do not carry a `required` category. Fresh defaults use `skills: false`, `selectedSkills: []`, and inert `skillScope: "project"`; default install and default sync write no skill files.
- Persisted selections represent one explicit selected-skill set rather than optional additions to an implicit required set. Current state uses `selectedSkills`; `optionalSkills` is not an active manifest or selection field; and desired skill assets are generated only for selected names while skills are enabled.
- Full-install and skills-only UIs expose no required/default/optional categories. Every row is selectable and deselectable, while the highlighted-skill detail panel and bottom selected-skill summary/instructions remain part of the contract.
- Non-interactive explicit selection, including `--selected-skills all`, remains supported. Deprecated `optionalSkills`, `required` registry metadata, and `--optional-skills` receive no migration or alias. Older alpha footprints must be reinstalled or regenerated from `selectedSkills`.
- `skillFiles` remains separate managed-output ownership tracking. Shared payloads and native harness exposures are written only for explicitly selected skills; bare setup, default sync, and no-skills selection produce no selected-agentic payloads or exposures.

- Skills remain explicitly selected agentic assets with their own delivery and trust decisions; they are not folded into the `full-snapshot`, `provider-backed`, or `hybrid-pinned-cache` system asset modes defined by [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md).
- Migration may preserve prior selected skills only when manifest and file evidence are trustworthy, and it must not silently expand `selectedSkills` or install skill files by default under [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- Lab adapters for future harnesses or model routes do not add current skills install targets or change the `selectedSkills` contract; [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md) owns adapter evidence.
- Selected skills may install prose, references, examples, and metadata, but deterministic make-docs logic must be available from the CLI package/shared-core boundary rather than depending on remote or skill-local script payloads as the only executable source under [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md).
- The built-in registry is the default skills manifest, purpose ids are stable selection metadata, alternate manifests are explicit inputs, and `selectedSkills` plus `skillFiles` remain executable and ownership state.
- The executable selected-skill set comes from `selectedSkills`, while ownership records connect that selection to canonical shared payloads, symlink exposures, managed copy mirrors, legacy generated stubs, source-manifest provenance, exposure mode, scope, and migrated duplicate-payload status under [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md).
- `--selected-skills all` and Skills UI flows select only entries in the effective Skills manifest. They never install plugins, hooks, extensions, workflow bundles, or another agentic artifact class; [30-plugin-substrate-and-workflow-bundles.md](./30-plugin-substrate-and-workflow-bundles.md) owns the current extensibility boundary.

The skills subsystem hangs off the shared install contract. `InstallSelections` carries `harnesses`, `skills`, `skillScope`, and `selectedSkills`, and the skills command mutates only that subset. The skill-specific UI mirrors that reduced surface, keeping command execution independent of broader capability and invariant managed-asset state used by full installs.

The packaged registry contract is defined by `SkillRegistry`, `SkillRegistryEntry`, `SkillManifestSourcePolicy`, and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts`. A registry declares manifest identity, display metadata, source policy, purposes, and skills; each skill entry carries identity and display fields, source and entry-point data, install name, assets, purpose ids, supported harnesses, and provenance. Validation admits `first-party`, explicit `local`, and `remote-pinned` source policies, normalizes local sources relative to their manifest, and requires pinned provenance for non-first-party remote content. `packages/cli/skill-registry.json` declares `$schema: "./skill-registry.schema.json"`, and `packages/cli/tests/skill-registry.test.ts` proves that the schema file ships with the package. The built-in registry uses remote GitHub tree URLs, so its metadata is packaged locally while its payload sources remain external.

The resolver contract is defined by `ResolvedSkill`, `ResolvedSkillAsset`, and `resolveSkillSource` in `packages/cli/src/skill-resolver.ts`. A resolved skill consists of `entryPointContent` plus supporting assets, and each asset keeps both the final `installPath` and upstream `sourcePath`. `readSourceText`, `readSourceBinary`, and `fetchRemote` distinguish explicit local sources from remote fetches; any in-process fetch reuse does not persist between runs or itself establish trust, which remains a registry provenance and source-policy concern.

The installable asset contract is defined by `ResolvedAsset` in `packages/cli/src/types.ts`, while `ResolvedInstallAsset` carries the link and copy-mirror planning metadata needed for native exposure. `buildSharedSkillAssets`, `buildHarnessSkillExposureAsset`, `getSharedSkillSourceId`, and `getSkillExposureSourceId` in `packages/cli/src/skill-catalog.ts` construct shared payload and exposure records; [PRD 28](28-shared-agentics-installation-and-harness-exposure.md) owns symlink exposures, managed copy mirrors, and legacy `skill-stub:<harness>:<name>` records. Project scope uses repo-relative roots, while global scope switches to `os.homedir()`; `packages/cli/tests/skill-catalog.test.ts` treats that home-directory redirect as part of the contract.

The skills-only plan is a reduced `InstallPlan`, not a separate data model. `createSkillsOnlyInstallPlan`, `planDesiredSkillAsset`, and `planDesiredSkillExposure` in `packages/cli/src/planner.ts` build `desiredFiles`, `desiredSkillFiles`, and `PlannedAction[]` only for skill assets; they choose internal desired-file and stale-file actions by comparing live content, manifest hashes, prior managed content, and explicit resolutions. `InstallPlan` and `PlannedAction` are defined in `packages/cli/src/types.ts`, while `renderSkillsPlanSummary` and `getRenderedSkillActions` in `packages/cli/src/skills-ui.ts` report only the final user-facing verbs `generate`, `update`, `skip`, and `remove`.

The manifest keeps skill ownership separate from the general scaffold footprint. `InstallManifest` in `packages/cli/src/types.ts` stores managed scaffold files in `files` and managed skill paths in `skillFiles`. `applySkillsOnlyInstallPlan` in `packages/cli/src/install.ts` calls the shared apply path with its `trackSkillFilesInManifestFiles: false` option, which preserves that split. `packages/cli/tests/install.test.ts` checks that explicitly installed skill paths land in `manifest.skillFiles`, the core ownership boundary used for safe updates and removals.

Code anchors:

- `packages/cli/src/types.ts` — `InstallSelections`, `ResolvedAsset`, `ResolvedInstallAsset`, `InstallManifest`, `InstallPlan`, `PlannedAction`
- `packages/cli/src/skill-registry.ts` — `SkillRegistry`, `SkillRegistryEntry`, `SkillManifestSourcePolicy`, `validateSkillRegistryManifest`
- `packages/cli/src/skill-resolver.ts` — `ResolvedSkill`, `ResolvedSkillAsset`, `resolveSkillSource`
- `packages/cli/src/skill-catalog.ts` — `buildSharedSkillAssets`, `buildHarnessSkillExposureAsset`
- `packages/cli/src/planner.ts` — `createSkillsOnlyInstallPlan`, `planDesiredSkillAsset`, `planDesiredSkillExposure`
- `packages/cli/src/install.ts` — `applySkillsOnlyInstallPlan`, `trackSkillFilesInManifestFiles`
- `packages/cli/src/skills-ui.ts` — `renderSkillsPlanSummary`, `getRenderedSkillActions`

## Integrations

The skills subsystem integrates directly with `parseArgs`, `validateParsedArgs`, and `runSkillsCommand` in `packages/cli/src/cli.ts`. The parser identifies the skills command, lazily loads `packages/cli/src/skills-command.ts`, and validates selected skill ids against `getSkillRegistryNames` from `packages/cli/src/skill-registry.ts` before the command runs. This keeps registry contents and command-line affordances synchronized, but it also means every new skill entry changes user-facing validation behavior immediately.

The skills subsystem also integrates with the shared planner/apply stack rather than maintaining a parallel installer. `planSkillsOnlyInstall` and `applySkillsOnlyInstallPlan` in `packages/cli/src/install.ts` route through profile resolution and reuse the `InstallPlan` / `PlannedAction` vocabulary from `packages/cli/src/types.ts`, while `createSkillsOnlyInstallPlan` in `packages/cli/src/planner.ts` keeps the action set skills-only. That reuse preserves conflict staging and manifest writing while requiring the skill command to leave non-skill managed files alone; the design intent is recorded in `docs/assets/archive/designs/2026-04-21-cli-skills-command.md` and enforced by `packages/cli/tests/skills-ui.test.ts` and `packages/cli/tests/install.test.ts`.

The delivery path currently spans both `packages/skills/` and `packages/cli/`, but not in the originally designed way. The April 16 design in `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md` proposed copying `packages/skills/` into `packages/cli/skills/` during prepack and shipping those local payloads with the published CLI. The live package metadata in `packages/cli/package.json` instead ships `dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, and `README.md`, and the current `prepack` script only runs `scripts/copy-template-to-cli.mjs` plus build. That script copies `packages/docs/template/` into `packages/cli/template/` and validates the registry JSON, but it does not copy `packages/skills/`. The practical integration today is therefore "CLI ships registry and resolver, resolver fetches from GitHub sources under `packages/skills/...` at install time."

The built-in skill path depends on external network and repository layout stability. `DEFAULT_GITHUB_REF` in `packages/cli/src/skill-resolver.ts` defaults `github:` sources to `main` when no ref is supplied, and `fetchRemote` retrieves remote content; trust and pinning are validated from registry metadata rather than invented by the fetch layer. Because current registry entries point at GitHub tree URLs under `packages/skills/` in `packages/cli/skill-registry.json`, a repo move, branch rename, or unavailable network path can block built-in installs or updates even when the CLI package itself is present locally.

Code anchors:

- `packages/cli/src/cli.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/package.json`
- `scripts/copy-template-to-cli.mjs`
- `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md`
- `docs/assets/archive/designs/2026-04-21-cli-skills-command.md`
- `packages/cli/skill-registry.json`

## Skill Purpose Registry and Manifest Requirements

### Purpose-Led Skill Selection

The CLI should let users choose by stable purpose first and concrete skill second. Purpose-led selection is metadata and presentation over the selected-skill model, not a replacement for it.

The first-party purpose ids are:

- `archive-management`
- `codebase-decomposition`
- `documentation-maintenance`
- `lifecycle-closeout`
- `workflow-execution`
- `naive-uat`
- `plan-creation`
- `migration-support`

First-party purpose ids are canonical make-docs ids. Configuration overlays may relabel visible text, but CLI, MCP, manifest, and Skill routing must use canonical purpose ids.

Alternate manifests may define additional purpose ids only when they are namespaced, such as `acme.release-readiness`.

### Skills Manifest Shape

The built-in first-party registry becomes the default skills manifest in logical terms. The physical file may remain `packages/cli/skill-registry.json` during implementation, but the schema must evolve toward one shape that can describe built-in and alternate manifests.

A skills manifest must include:

- `schemaVersion`
- `manifestId`
- `displayName` and optional description
- `purposes` with stable ids, labels, descriptions, and optional ordering
- `skills` with stable skill name, display metadata, purpose ids, source, entry point, install name, assets, supported harnesses, and provenance metadata
- `sourcePolicy` declaring whether the manifest is first-party, local, or remote-pinned

One skill may satisfy multiple purposes, and one purpose may offer multiple candidate skills.

### Selection Behavior

Purpose-led selection must show the purpose, each candidate skill, skill source, supported harnesses, and trust/provenance before selection.

If multiple skills satisfy the same purpose, the UI must not silently choose one unless the active manifest marks exactly one default candidate for that purpose and the user has explicitly opted into skills.

The install manifest remains behavior-first:

- `selectedSkills` stores resolved skill names that should be installed.
- `skillFiles` remains the managed-output ownership list.
- Selection provenance may record selected purpose id, manifest id, candidate skill, source policy class, and source provenance for review, reconfigure, audit, backup, uninstall, and support.
- Selection provenance does not replace `selectedSkills` or `skillFiles`.
- [28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md) consumes the resolved effective manifest and selection provenance when writing shared payloads and native harness exposures. Agentic ownership records should preserve manifest id, purpose id, skill name, source policy, digest/ref, scope, canonical payload path, symlink exposure paths, copy-mirror paths, and legacy generated stub paths without replacing `selectedSkills`.
- [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) prohibits Skills-manifest purpose ids and selection from implying a plugin, hook, extension, workflow-bundle, or other agentic artifact.

### Alternate Manifests

Alternate manifests are explicit inputs, not ambient discovery. A run uses one effective skills manifest: the built-in first-party manifest unless the user supplies an alternate manifest.

make-docs does not automatically merge the built-in manifest into an alternate manifest. If an alternate manifest wants first-party skills, it must include entries for them with first-party provenance.

`--selected-skills all` expands to every selectable skill in the effective manifest after validation. It must not mean every known first-party skill when an alternate manifest is active.

`--selected-skills none` remains an empty selected-skill set.

Bare default installs continue to produce no skill files.

### Source and Trust Policy

File-path alternate manifests are the first supported implementation target.

URL manifests are valid for installation only when the source can be treated as remote-pinned: the manifest reference or caller must supply an immutable ref plus a manifest digest.

Mutable branches such as `main`, unauthenticated HTTP, and unpinned remote manifests are invalid for v2 alternate-manifest installation. The CLI may preview rejected manifests enough to explain the policy failure, but it must not install from them.

Remote skill payload sources inside any manifest follow the same trust rule: immutable ref plus integrity metadata before installation.

Local file sources are allowed only when explicitly supplied by the user and must be displayed as local/custom before selection.

Third-party sources must be labeled third-party even when they satisfy a first-party purpose id.

### No-Scripts Boundary

Purpose metadata may explain why a skill is useful, but it must not become a second source of deterministic workflow logic. Deterministic make-docs-owned behavior still belongs behind CLI/shared-core operations under [25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md).

### First-Party Naive-UAT Skill Boundary

The first-party Naive-UAT Skill is a distributable, explicitly selected adapter for the `naive-uat` purpose. Core Naive-UAT execution remains complete through system workflow resources and the typed CLI/MCP operations owned by [25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md) and [46-naive-end-user-acceptance-testing.md](46-naive-end-user-acceptance-testing.md); local Skill installation or harness exposure is optional.

The Skill contains concise discovery and routing instructions plus thin shims only when a supported harness cannot directly issue shell commands or use MCP. Every shim delegates to the same typed Make Docs CLI operations and may adapt arguments or format returned receipts only. It must not duplicate tester qualification, installed-product targeting, anti-coaching rules, Persona resolution, scenario definitions, evidence semantics or destinations, finding and gate policy, prompts, templates, or run-state behavior.

### Validation Boundary

Implementation must prove:

- default installs still produce no skill files
- explicit first-party skill installs still work
- alternate file-manifest installs work
- unpinned URL manifests are rejected before installation
- remote-pinned URL manifests work only if implemented with immutable refs and digest checks
- remote skill payloads require immutable refs and integrity metadata
- `--selected-skills all` and `none` are interpreted against the effective manifest
- audit, backup, uninstall, and migration explain alternate-manifest and selection provenance
- package contents include the evolved schema and validation fixtures
- the first-party Naive-UAT Skill is absent from default installs and is installed only through explicit selection
- every Naive-UAT shim delegates to a typed CLI operation and contains no duplicated UAT policy or business logic

## Rebuild Notes

A rebuild must preserve explicit selected-Skill semantics, manifest provenance and trust, safe ownership and removal, no default Skill installation, and the rule that deterministic Make Docs behavior belongs behind typed CLI/shared-core operations. The first-party Naive-UAT Skill remains an optional routing adapter and must never become a second UAT policy authority.

## Requirement History

### 2026-07-04 — W18 R11 follow-up

- Affected requirement or section: `Current shipped skill inventory`
- Previous contract: The first-party registry also shipped `closeout-commit`, `closeout-phase`, `work-on-phase`, and `work-on-wave` even though their instructions invoked the retired `make-docs operations` surface.
- Replacement contract: The four lifecycle skills and their source directories are withdrawn; the current registry ships only `archive-docs`, `cleanup-docs`, and `decompose-codebase`. The Q-022 agentics-production lineage owns any later regeneration of lifecycle skills through the playbook packaging pipeline.
- Rationale: Current product authority must match the reachable shipped inventory and must not advertise broken or deleted skill payloads.
- Source: [D-020 lifecycle-skill withdrawal](./03-open-questions-and-risk-register.md#d-020-shipped-lifecycle-skills-instruct-the-removed-make-docs-operations-command-surface)

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 12, 27, 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Skill Purpose Registry and Manifest Requirements; Explicit Selected-Skill Model; First-Party Naive-UAT Skill Boundary`
- Previous contract: The catalog had no first-party Naive-UAT adapter contract, and some agentic cross-links treated plugin or Playbook-derived packaging as a peer selected-asset path.
- Replacement contract: The general Skills registry and explicit-selection model remain; `naive-uat` identifies an optional first-party Skill whose shims delegate only to typed CLI operations and contain no duplicated UAT policy, while Skills selection admits no plugin, hook, extension, workflow-bundle, or Playbook packaging surface.
- Rationale: Core Naive-UAT behavior must remain available through system resources and CLI/MCP, with anti-coaching and evidence policy owned by the UAT authority rather than copied into a harness adapter.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

- `packages/cli/src/cli.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/types.ts`
- `packages/cli/skill-registry.json`
- `packages/cli/package.json`
- `packages/cli/tests/skill-catalog.test.ts`
- `packages/cli/tests/skill-registry.test.ts`
- `packages/cli/tests/skills-ui.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/skills/package.json`
- `packages/skills/README.md`
- `packages/skills/archive-docs/SKILL.md`
- `packages/skills/cleanup-docs/SKILL.md`
- `packages/skills/decompose-codebase/SKILL.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/30-plugin-substrate-and-workflow-bundles.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md`
- `docs/assets/archive/designs/2026-04-21-cli-skills-command.md`
