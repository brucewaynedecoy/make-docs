# 08 Skills Catalog and Distribution

## Purpose

This subsystem defines which agent skills `make-docs` can install, how users select them, how canonical skill payloads land under `.make-docs/agentics/skills/**`, and how generated stubs expose those payloads to Claude Code and Codex install roots. The live runtime starts at the top-level `skills` command in `packages/cli/src/cli.ts:27`, dispatches into `packages/cli/src/skills-command.ts:32`, reads the packaged registry in `packages/cli/skill-registry.json`, and resolves skill payloads through `packages/cli/src/skill-resolver.ts:40`.

The authoring source tree for shipped skills lives under `packages/skills/`, with current skill roots at `packages/skills/archive-docs/` and `packages/skills/decompose-codebase/`. The package itself is deliberately narrow today; `packages/skills/package.json` describes it as the agent skills catalog, while `packages/skills/README.md` currently contains only the heading "Document Skills".

## Scope

This doc covers the dedicated `make-docs skills` lifecycle surface, the registry and resolver model, shared payload installation, generated harness stubs, project-vs-global skill placement, manifest-backed skill ownership, and the current shipped skills across `packages/cli` and `packages/skills`. The command-specific validation and help surface live in `packages/cli/src/cli.ts:400`, `packages/cli/src/cli.ts:622`, and `packages/cli/src/cli.ts:894`, while the skills-only planner/apply path lives in `packages/cli/src/install.ts:45`, `packages/cli/src/install.ts:96`, and `packages/cli/src/planner.ts:204`.

This doc does not define the internal behavior of each skill after an agent follows a generated harness stub to the canonical shared payload; those behaviors are owned by the skill payloads themselves, such as `packages/skills/archive-docs/SKILL.md` and `packages/skills/decompose-codebase/SKILL.md`. It also does not redefine the broader docs/template catalog handled elsewhere by `packages/cli/src/catalog.ts` and `packages/docs/template/`.

Code anchors:

- `packages/cli/src/cli.ts:27`
- `packages/cli/src/skills-command.ts:32`
- `packages/cli/src/install.ts:45`
- `packages/cli/src/planner.ts:204`
- `packages/skills/archive-docs/SKILL.md`
- `packages/skills/decompose-codebase/SKILL.md`

## Component and Capability Map

### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for required/default skill grouping, selected-by-default behavior, and optional-only selection behavior.
- Clarified by the W15 source-authority reconciliation: selected skills, skill-local references/templates, generated harness exposure files, and any installed skill copies are secondary workflow surfaces. They may guide agents or provide fallback projections, but they must not be treated as primary backlog-shape authority when live repo contracts and accepted lifecycle artifacts are available.
- Enhanced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) for install shape. Selected skills install one canonical shared payload under `.make-docs/agentics/skills/` per scope and expose harness-specific generated text stubs under `.claude/skills/` and `.agents/skills/`; symlinks, junctions, or shell links are not required for v2 correctness.
- Enhanced by [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) for the plugin boundary. Skills and plugins share the selected-agentics store and generated-exposure primitive, but plugin selection remains explicit and separate from `selectedSkills`.

The top-level CLI exposes `skills` as a first-class command beside `reconfigure`, `backup`, and `uninstall` in `packages/cli/src/cli.ts:27`. The command-specific help in `packages/cli/src/cli.ts:942` limits the surface to target directory, dry run, non-interactive apply, harness selection, removal, skill scope, and selected-skill input; it intentionally avoids the broader content/template/reference flags that belong to initial install and reconfigure flows. Argument validation in `packages/cli/src/cli.ts:641` through `packages/cli/src/cli.ts:719` rejects non-skills selection flags on `make-docs skills`, prevents selected-skill input during `--remove`, and checks requested selected skills against the packaged registry.

The executor in `packages/cli/src/skills-command.ts:32` is thin on purpose. It loads the existing manifest, derives base selections from either the saved manifest or `defaultSelections()`, optionally runs the dedicated UI, then calls `planSkillsOnlyInstall()` and `applySkillsOnlyInstallPlan()` in `packages/cli/src/install.ts:45` and `packages/cli/src/install.ts:96`. The same module keeps skills output isolated from the main scaffold flow by printing a skills-specific review summary in `packages/cli/src/skills-command.ts:176` and by reporting completion against the manifest path in `packages/cli/src/skills-command.ts:193`.

The interactive UX is a dedicated five-step skills flow, not a filtered version of the full installer. `packages/cli/src/skills-ui.ts:102` drives an action -> platforms -> scope -> skills -> review loop, `packages/cli/src/skills-ui.ts:91` maps harness labels to Claude Code and Codex, and `packages/cli/src/skills-ui.ts:298` renders summaries that enumerate only skill-managed file operations. Removal is intentionally shorter: when the action is `remove`, the flow skips platform, scope, and selected-skill screens and jumps to review. That behavior is locked in by `packages/cli/tests/skills-ui.test.ts`, which also verifies that the review summary excludes docs/template/reference paths.

The catalog layer translates selections into installable assets. `packages/cli/src/skill-catalog.ts` reserves `.make-docs/agentics/skills` for canonical shared skill payloads, maps harness stubs to `.claude/skills` and `.agents/skills`, and expands explicitly selected skills into concrete `ResolvedAsset` records for project or global scope. The current tests in `packages/cli/tests/skill-catalog.test.ts` confirm the critical behaviors: default selections install no skills, selected skills produce one shared payload plus stubs for selected harnesses, global scope redirects installs into `os.homedir()`, and explicit all-skill selection includes every registry entry.

The registry is the catalog authority at runtime. `packages/cli/src/skill-registry.ts:25` loads `packages/cli/skill-registry.json`, validates entry structure, and skips malformed entries without aborting the whole registry. The shipped registry contains first-party skill entries, but none are required to make the docs scaffold work. `packages/cli/tests/skill-registry.test.ts` verifies that the packaged registry and schema are both shipped and that local-only sources are rejected.

The resolver in `packages/cli/src/skill-resolver.ts:40` turns registry entries into fetched content. It supports `github:`, `url:`, `https://`, and `http://` sources through `packages/cli/src/skill-resolver.ts:109`, normalizes GitHub tree/blob URLs into `raw.githubusercontent.com` URLs through `packages/cli/src/skill-resolver.ts:118`, `packages/cli/src/skill-resolver.ts:139`, and `packages/cli/src/skill-resolver.ts:159`, and reads Markdown assets as text while treating non-Markdown assets as binary in `packages/cli/src/skill-resolver.ts:50`. The shipped registry uses GitHub tree URLs under `packages/skills/...`, so the runtime model today is "packaged remote registry plus remote fetch" rather than "packaged local skill payload".

The shipped skill inventory is optional. `archive-docs`, `cleanup-docs`, closeout skills, decompose skills, and work-on-wave/work-on-phase skills are tracked in the registry so users can explicitly install, update, back up, or remove them, but a default docs scaffold writes no skill files. `packages/cli/tests/install.test.ts` confirms that the default profile records `skillFiles: []`, while explicit selected-skill runs install the requested shared skill payloads and generated harness stubs.

Code anchors:

- `packages/cli/src/cli.ts:27`
- `packages/cli/src/cli.ts:622`
- `packages/cli/src/cli.ts:942`
- `packages/cli/src/skills-command.ts:32`
- `packages/cli/src/skills-ui.ts:102`
- `packages/cli/src/skill-catalog.ts:18`
- `packages/cli/src/skill-registry.ts:25`
- `packages/cli/src/skill-resolver.ts:40`

## Contracts and Data

### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for the `required` registry field, `optionalSkills` persisted-selection model, and selected-by-default behavior. The effective requirement is an explicit selected-skill set over all registry entries.
- Enhanced by [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) for the package-boundary effect on skills delivery. Bare installs keep no-default-skills behavior under the TypeScript package runtime, but remote-fetch versus bundled-local delivery and remote-source integrity remain open under Q-001 and Q-007.
- Enhanced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) for the system asset boundary. Skills and plugins remain selected agentic assets with separate delivery and trust decisions; they are not folded into `full-snapshot`, `provider-backed`, or `hybrid-pinned-cache` system asset modes.
- Enhanced by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) for skills migration safety. Migration may preserve prior selected skills only when manifest and file evidence are trustworthy, and it must not silently expand `selectedSkills` or install skill files by default.
- Enhanced by [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) for future adapter evidence. Lab adapters for future harnesses or model routes do not add current skills install targets or change the `selectedSkills` contract.
- Enhanced by [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) for first-party skill refactor requirements. Selected skills may still install prose, references, examples, and metadata, but deterministic make-docs logic must be available from the CLI package/shared-core boundary rather than depending on remote or skill-local script payloads as the only executable source.
- Enhanced by [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) for purpose-led selection and alternate manifests. The built-in registry becomes the default skills manifest in logical terms, purpose ids become stable selection metadata, alternate manifests are explicit inputs, and `selectedSkills` plus `skillFiles` remain the executable and ownership state.
- Enhanced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) for shared payload and exposure metadata. The executable selected-skill set still comes from `selectedSkills`, but ownership records must connect that selection to the canonical shared payload, generated stubs, source manifest provenance, exposure mode, scope, and migrated duplicate payload status.
- Enhanced by [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) for plugin substrate separation. Plugin records may reuse purpose and source metadata concepts, but `--selected-skills all` and existing skills UI flows must not select or install plugins.

The skills subsystem hangs off the shared install contract in `packages/cli/src/types.ts:31`. `InstallSelections` carries `harnesses`, `skills`, `skillScope`, and `selectedSkills`, and the skills command mutates only that subset in `packages/cli/src/skills-command.ts:152` and `packages/cli/src/skills-ui.ts:280`. The skill-specific UI state mirrors that reduced surface in `packages/cli/src/skills-ui.ts:28`, which keeps command execution from depending on the broader capability/prompt/template/reference state used by full installs.

The packaged registry contract is defined in `packages/cli/src/skill-registry.ts:4` through `packages/cli/src/skill-registry.ts:19`. Every `SkillRegistryEntry` needs `name`, `source`, `entryPoint`, `installName`, `description`, and an `assets` array, and `packages/cli/src/skill-registry.ts:83` rejects entries whose `source` is not remote. `packages/cli/skill-registry.json` also declares `$schema: "./skill-registry.schema.json"`, and `packages/cli/tests/skill-registry.test.ts` proves that the schema file is expected to ship with the package. The current registry uses remote GitHub tree URLs, which means the registry is packaged locally but the payload sources remain external.

The resolver contract is defined in `packages/cli/src/skill-resolver.ts:22` and `packages/cli/src/skill-resolver.ts:28`. A resolved skill consists of `entryPointContent` plus supporting assets, and each asset keeps both the final `installPath` and the upstream `sourcePath`. The in-process caches at `packages/cli/src/skill-resolver.ts:19` reduce duplicate remote fetches during a single run, but they do not persist between runs and they do not add integrity pinning beyond the remote URL itself.

The installable asset contract is defined by `ResolvedAsset` in `packages/cli/src/types.ts:75`. The catalog stamps shared payload files with synthetic `skill:shared:<name>` and `skill-shared-asset:<skill>:<installPath>` source ids, and generated harness stubs with `skill-stub:<harness>:<name>` source ids. Project scope uses repo-relative roots, while global scope switches to `os.homedir()`; the tests in `packages/cli/tests/skill-catalog.test.ts` treat that home-directory redirect as part of the contract.

The skills-only plan is a reduced `InstallPlan`, not a separate data model. `packages/cli/src/planner.ts:204` builds `desiredFiles`, `desiredSkillFiles`, and `PlannedAction[]` only for skill assets. `packages/cli/src/planner.ts:276` chooses internal `create`, `noop`, `update`, or `skip-conflict` actions for desired skill files by comparing live content, manifest hashes, and prior managed content. `packages/cli/src/planner.ts:348` chooses internal `remove-managed` or `skip-conflict` actions for stale skill files. Those internal action types come from `packages/cli/src/types.ts:23` and `packages/cli/src/types.ts:105`, while the review summary in `packages/cli/src/skills-ui.ts:298` deliberately reports only skills-file operations with final user-facing verbs: `generate`, `update`, `skip`, and `remove`.

The manifest keeps skill ownership separate from the general scaffold footprint. `InstallManifest` in `packages/cli/src/types.ts:86` stores managed scaffold files in `files` and managed skill paths in `skillFiles`. `packages/cli/src/install.ts:96` calls the shared apply path with `trackSkillFilesInManifestFiles: false`, which preserves that split. `packages/cli/tests/install.test.ts` checks that explicitly installed skill paths land in `manifest.skillFiles`, which is the core ownership boundary used for safe updates and removals.

Code anchors:

- `packages/cli/src/types.ts:31`
- `packages/cli/src/types.ts:75`
- `packages/cli/src/types.ts:86`
- `packages/cli/src/skill-registry.ts:4`
- `packages/cli/src/skill-resolver.ts:22`
- `packages/cli/src/planner.ts:204`
- `packages/cli/src/planner.ts:276`
- `packages/cli/src/install.ts:96`

## Integrations

### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for CLI validation that only accepts formerly optional skill ids. Validation now applies to the selected-skill set over all registry skills.
- Enhanced by [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) for shared plugin/skill install boundaries. MCP is required and TypeScript-owned, and PRD 30 now owns plugin substrate while implementation proof remains open under Q-012.
- Enhanced by [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) for effective-manifest routing. Future plugin, MCP, or skill surfaces must route by canonical purpose ids and resolved skill names, not configured labels or ambient manifest discovery.
- Enhanced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) for the selected-agentics store/exposure primitive. Skills use generated harness stubs over a shared payload store.
- Enhanced by [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) for plugin substrate and workflow bundle metadata. Plugin runtime implementation, public per-bundle UX, and remote delivery remain separate decisions.

The skills subsystem integrates directly with the main CLI parser and help system in `packages/cli/src/cli.ts`. The parser decides when the top-level command becomes `skills`, lazily loads `packages/cli/src/skills-command.ts`, and validates selected skill ids against the packaged registry before the command runs. This keeps registry contents and command-line affordances synchronized, but it also means every new skill entry changes user-facing validation behavior immediately.

The skills subsystem also integrates with the shared planner/apply stack rather than maintaining a parallel installer. `packages/cli/src/install.ts:45` routes the command through `resolveInstallProfile()`, and `packages/cli/src/planner.ts:204` reuses the same `InstallPlan` and `PlannedAction` vocabulary as the broader installer while keeping the action set skills-only. That reuse is important because the same conflict staging and manifest-writing code paths still apply, but the skill command is required to leave non-skill managed files alone; the design intent is recorded in `docs/assets/archive/designs/2026-04-21-cli-skills-command.md` and enforced by `packages/cli/tests/skills-ui.test.ts` and `packages/cli/tests/install.test.ts`.

The delivery path currently spans both `packages/skills/` and `packages/cli/`, but not in the originally designed way. The April 16 design in `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md` proposed copying `packages/skills/` into `packages/cli/skills/` during prepack and shipping those local payloads with the published CLI. The live package metadata in `packages/cli/package.json` instead ships `dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, and `README.md`, and the current `prepack` script only runs `scripts/copy-template-to-cli.mjs` plus build. That script copies `packages/docs/template/` into `packages/cli/template/` and validates the registry JSON, but it does not copy `packages/skills/`. The practical integration today is therefore "CLI ships registry and resolver, resolver fetches from GitHub sources under `packages/skills/...` at install time."

The subsystem depends on external network and repository layout stability. `packages/cli/src/skill-resolver.ts:6` defaults `github:` sources to the `main` branch when no ref is supplied, and `packages/cli/src/skill-resolver.ts:226` fetches remote content without checksum verification. Because current registry entries point at `https://github.com/brucewaynedecoy/make-docs/tree/main/...` in `packages/cli/skill-registry.json`, any repo move, branch rename, or unavailable network path can block new installs or updates even when the CLI package itself is present locally.

Code anchors:

- `packages/cli/src/cli.ts:400`
- `packages/cli/src/install.ts:45`
- `packages/cli/src/planner.ts:204`
- `packages/cli/package.json`
- `scripts/copy-template-to-cli.mjs`
- `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md`
- `docs/assets/archive/designs/2026-04-21-cli-skills-command.md`
- `packages/cli/skill-registry.json`

## Rebuild Notes

### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) where rebuild guidance depends on required/default versus optional skill categories. Skill command separation, remote resolver behavior, and `skillFiles` ownership remain active constraints.

A clean-room rebuild needs to preserve the hard separation between the full scaffold lifecycle and the skills-only lifecycle. The skills command should continue to behave like a dedicated maintenance surface, not a partial invocation of the broader installer. That means preserving the top-level command split in `packages/cli/src/cli.ts:27`, the isolated UI flow in `packages/cli/src/skills-ui.ts:102`, and the skills-only planner path in `packages/cli/src/planner.ts:204`. Rebuilders should treat the tests in `packages/cli/tests/skills-ui.test.ts`, `packages/cli/tests/skill-catalog.test.ts`, and `packages/cli/tests/install.test.ts` as behavioral guardrails, not just unit coverage.

A rebuild also needs to keep manifest ownership split across `files` and `skillFiles`. The safe-update logic in `packages/cli/src/planner.ts:276` and the safe-removal logic in `packages/cli/src/planner.ts:348` depend on knowing which skill files were previously managed and whether local edits diverged from the last known managed content. Collapsing skill ownership into the general manifest file map would make `make-docs skills --remove` much harder to reason about and would blur the subsystem boundary that `packages/cli/src/install.ts:96` currently preserves.

Factual drift note: the current implementation does not match the earlier "bundle skill payloads into the CLI package" design from `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md`. The live package metadata in `packages/cli/package.json`, the current prepack script in `scripts/copy-template-to-cli.mjs`, and the remote GitHub entries in `packages/cli/skill-registry.json` describe a different delivery model. Candidate shared risk-register item: decide whether the intended long-term contract is remote-fetch delivery, bundled local payload delivery, or dual-mode fallback, then align code, docs, and release checks around that single model.

Factual risk note: current source resolution accepts `http://`, `https://`, `github:`, and `url:` in `packages/cli/src/skill-registry.ts:134`, while the resolver defaults GitHub sources to `main` in `packages/cli/src/skill-resolver.ts:6` and performs unauthenticated remote fetches in `packages/cli/src/skill-resolver.ts:226`. Candidate shared risk-register item: tighten allowed source protocols and define whether mutable branch-based URLs are acceptable for production skill delivery.

Factual documentation gap: `packages/skills/README.md` currently provides almost no release or authoring guidance even though the live registry depends on the structure and naming of `packages/skills/archive-docs/` and `packages/skills/decompose-codebase/`. Candidate shared risk-register item: document the source-of-truth contract for adding, packaging, and releasing skills so the authoring tree, registry, tests, and package metadata do not drift independently.

Code anchors:

- `packages/cli/src/cli.ts:27`
- `packages/cli/src/skills-ui.ts:102`
- `packages/cli/src/planner.ts:276`
- `packages/cli/src/planner.ts:348`
- `packages/cli/src/install.ts:96`
- `packages/cli/package.json`
- `scripts/copy-template-to-cli.mjs`
- `packages/skills/README.md`

## Source Anchors

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
- `packages/skills/archive-docs/`
- `packages/skills/decompose-codebase/`
- `packages/skills/closeout-commit/`
- `packages/skills/closeout-phase/`
- `packages/skills/work-on-wave/`
- `packages/skills/work-on-phase/`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md`
- `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`
- `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`
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
