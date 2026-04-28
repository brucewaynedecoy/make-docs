# 06 Template Contracts and Generated Assets

## Purpose

This subsystem owns the shipped documentation template, the contract/reference/template assets under `packages/docs/template/docs/assets/`, and the renderer/catalog logic that decides which of those files become managed consumer artifacts. The canonical authoring tree is `packages/docs/template/`, the packaged delivery vehicle is `packages/cli/template` via `scripts/copy-template-to-cli.mjs:24-27` and `packages/cli/package.json:9-25`, and the active consumer-facing contract lives in shipped files such as `packages/docs/template/docs/assets/references/output-contract.md` and `packages/docs/template/docs/assets/templates/prd-subsystem.md`.

Profile-specific installs do not invent a second contract layer. Instead, `packages/cli/src/profile.ts:68-93`, `packages/cli/src/rules.ts:120-194`, `packages/cli/src/catalog.ts:64-85`, and `packages/cli/src/renderers.ts:54-570` select, copy, or render subsets of the same template-owned assets so the installed `docs/assets/**` tree remains consistent with the chosen capabilities and harnesses.

## Scope

- Covered here: the physical template tree under `packages/docs/template/`, the router/reference/template assets under `packages/docs/template/docs/assets/`, harness instruction routing from `packages/cli/src/catalog.ts:23-61`, capability gating from `packages/cli/src/profile.ts:10-15` and `packages/cli/src/rules.ts:120-194`, buildable asset generation from `packages/cli/src/renderers.ts:40-570`, and manifest-backed delivery in `packages/cli/src/planner.ts:19-201`, `packages/cli/src/install.ts:85-223`, and `packages/cli/src/manifest.ts:17-100`.
- The shipped surface is the consumer tree described in `README.md` and `packages/docs/README.md`: `docs/assets/` holds document resources, visible capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` hold authored outputs, and mutable CLI state stays at `.make-docs/manifest.json` plus `.make-docs/conflicts/<run-id>/`.
- Not covered here: skill asset packaging under `packages/cli/src/skill-catalog.ts`, lifecycle backup/uninstall semantics, or the authored contents of PRDs, plans, and work backlogs that consume these contracts. Those are downstream clients of this subsystem, not its primary implementation surface.

## Component and Capability Map

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference asset selection. Included prompts, templates, and references are becoming always-managed assets rather than wizard-selected asset groups.

- The physical source of truth is `packages/docs/template/`: root instructions live at `packages/docs/template/AGENTS.md`, the docs router lives at `packages/docs/template/docs/AGENTS.md`, document-resource routers live at `packages/docs/template/docs/assets/AGENTS.md`, `packages/docs/template/docs/assets/references/AGENTS.md`, and `packages/docs/template/docs/assets/templates/AGENTS.md`, and the authoritative shipped contracts/templates live under `packages/docs/template/docs/assets/references/*.md` and `packages/docs/template/docs/assets/templates/*.md`.
- Install profile resolution starts in `packages/cli/src/profile.ts:10-15`, where `prd` depends on `plans` and `work` depends on both `plans` and `prd`. `packages/cli/src/profile.ts:42-93` turns raw selections into `capabilityState`, `effectiveCapabilities`, and a stable `profileId`, while `packages/cli/src/types.ts:38-80` defines the `InstallSelections`, `InstallProfile`, `InstructionKind`, and `ResolvedAsset` shapes used across the pipeline.
- Rule-based selection happens in `packages/cli/src/rules.ts:8-109`. `PROMPT_RULES` gates prompt starters by capability, `PLAN_TEMPLATE_PATHS` / `PRD_TEMPLATE_PATHS` / `WORK_TEMPLATE_PATHS` plus `ALWAYS_TEMPLATE_PATHS` determine which templates are installable, and `REQUIRED_REFERENCE_PATHS` plus `ALWAYS_REFERENCE_PATHS` do the same for references. `getPromptPaths()`, `getTemplatePaths()`, and `getReferencePaths()` in `packages/cli/src/rules.ts:120-194` produce the actual per-profile asset lists.
- Harness and directory router expansion happens in `packages/cli/src/types.ts:49-58` and `packages/cli/src/catalog.ts:23-61`. Enabled harnesses become active instruction kinds (`AGENTS.md`, `CLAUDE.md`), and each active instruction kind is fanned out to root, `docs/`, `docs/assets/`, `docs/assets/history/`, `docs/assets/archive/`, `docs/guides/`, and capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` only when those resource families are actually installed.
- Asset materialization happens in `packages/cli/src/catalog.ts:7-20` and `packages/cli/src/catalog.ts:64-85`. `buildAsset()` marks a path as `buildable` when `isBuildablePath(relativePath)` is true and otherwise as `scoped-static`, then assigns a stable `sourceId` of `build:<path>` or `file:<path>`. `getDesiredAssets()` unions references, templates, prompts, and instruction routers into one sorted `ResolvedAsset[]`.
- Profile-aware rendering is intentionally narrow. `packages/cli/src/renderers.ts:40-50` limits `buildable` content to root instructions, router instructions, and the design workflow/contract/template trio. `renderDocsRouter()` in `packages/cli/src/renderers.ts:99-155` omits links to missing capabilities, `renderAssetsRouter()` in `packages/cli/src/renderers.ts:173-185` keeps `docs/assets/` document-only, `renderTemplatesRouter()` in `packages/cli/src/renderers.ts:204-244` names only valid template families, `renderPromptsRouter()` in `packages/cli/src/renderers.ts:246-277` suppresses output claims when prompts are disabled, and `renderDesignWorkflow()` / `renderDesignContract()` / `renderDesignTemplate()` in `packages/cli/src/renderers.ts:279-562` degrade design guidance when planning assets or prompt starters are absent.
- Validation is built into the subsystem. `packages/cli/tests/consistency.test.ts:33-77` asserts that every file under `TEMPLATE_ROOT` is covered by `getDesiredAssets(profile)` and that every `buildable` path renders exactly to the checked-in full-profile file. `packages/cli/tests/renderers.test.ts:17-73` confirms reduced-profile router behavior and verifies that design workflow fallback text removes links to unavailable prompts.

## Contracts and Data

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for mode-sensitive prompt/template/reference selection. The effective W14 requirement is to normalize these asset families to the included managed set before planning and manifest writes.

- The shipped contract files are explicit artifacts, not inferred conventions. `packages/docs/template/docs/assets/references/output-contract.md` fixes required paths such as `docs/prd/00-index.md` through `docs/prd/04-glossary.md`, requires directory-based plan/work outputs, and defines section contracts for PRD and work documents. `packages/docs/template/docs/assets/templates/prd-subsystem.md`, `packages/docs/template/docs/assets/templates/prd-index.md`, and `packages/docs/template/docs/assets/templates/work-index.md` provide the structural starters that generated docs must follow.
- The consumer-visible contract surface is mirrored into this repository's dogfood docs at `docs/assets/references/output-contract.md`, `docs/assets/references/execution-workflow.md`, and `docs/assets/templates/prd-subsystem.md`, but `packages/docs/template/docs/assets/**` remains the template package source of truth. `packages/docs/README.md` explicitly instructs contributors to edit `packages/docs/template/` first and then re-seed dogfood copies when template-owned files change.
- `ResolvedAsset` in `packages/cli/src/types.ts:75-80` is the core data shape for generated assets: each entry carries `relativePath`, `assetClass`, `sourceId`, and final `content`. `InstallManifest` and `ManifestFileEntry` in `packages/cli/src/types.ts:82-97` persist the hash and provenance for each managed file so apply/sync runs can detect whether an installed contract file still matches the last managed version.
- Capability-gated asset selection is driven by `packages/cli/src/rules.ts:120-194` plus `packages/cli/src/catalog.ts:51-60`. If no references are selected, `docs/assets/references/AGENTS.md` and `docs/assets/references/CLAUDE.md` are not installed. If no templates are selected, `docs/assets/templates/AGENTS.md` and `docs/assets/templates/CLAUDE.md` are not installed. If prompts are disabled, `docs/assets/prompts/**` disappears entirely. This means the installed `docs/assets/` tree is not a blind copy of `packages/docs/template/docs/assets/`; it is the profile-valid subset of that tree.
- Most contract and template files are copied verbatim from the template package through `packages/cli/src/utils.ts:49-55`. The main exceptions are router files and the design fallback trio, which are rendered to avoid dangling references. That split is enforced by `packages/cli/src/renderers.ts:54-96` and by the exact-match tests in `packages/cli/tests/consistency.test.ts:44-50`.
- Consumer installs carry these contracts forward through the planner/apply/manifest pipeline. `createInstallPlan()` in `packages/cli/src/planner.ts:33-45` hashes every desired asset into `desiredFiles[relativePath] = { hash, sourceId }`, `packages/cli/src/planner.ts:51-189` decides whether each asset should be created, generated, updated, skipped as a conflict, or removed, `applyInstallPlanInternal()` in `packages/cli/src/install.ts:107-157` writes the selected files and rebuilds the manifest, and `writeManifest()` in `packages/cli/src/manifest.ts:98-101` stores the resulting managed contract surface in `.make-docs/manifest.json`. Skipped conflicts are staged under `.make-docs/conflicts/<run-id>/` via `packages/cli/src/install.ts:212-223`.

## Integrations

- Packaging integration is deliberate and two-stage. `packages/docs/README.md` describes `packages/docs/template/` as the shippable docs package, `scripts/copy-template-to-cli.mjs:24-27` copies that tree into `packages/cli/template`, and `packages/cli/package.json:9-25` includes the bundled `template/` directory in published CLI artifacts. In development, `packages/cli/src/utils.ts:33-42` prefers the sibling `packages/docs/template/` tree so local template edits are immediately visible without a manual sync.
- Consumer-install integration uses the same asset catalog for first install, sync, and reconfigure. `README.md` states that the installer writes only profile-valid capability directories, only valid prompt/reference/template assets, generated routers that avoid missing-path guidance, and `.make-docs/manifest.json`. The non-destructive update rules described in `README.md` align with planner/apply behavior in `packages/cli/src/planner.ts:77-189` and `packages/cli/src/install.ts:177-225`.
- Dogfood integration is manual by design. `README.md` defines the repo-root `docs/` tree as a dogfood instance of the template, and `docs/designs/2026-04-22-docs-assets-resource-namespace.md` says "template first, dogfood second": the template and CLI must agree on new paths before the repo's own `docs/` tree is migrated. `packages/docs/README.md` further limits re-seeding to template-owned routers, references, and templates; it explicitly forbids overwriting authored content such as designs, plans, PRDs, work backlogs, and guides.
- Validation integration spans both code and docs. `packages/cli/tests/consistency.test.ts:54-77` guards full template coverage, `packages/cli/tests/renderers.test.ts:33-73` guards profile-aware rendering, and `packages/docs/README.md` describes manual re-seed verification by diffing template-owned files after copying them into the dogfood tree.

## Rebuild Notes

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for rebuild guidance around public template/reference modes. Rebuilders should preserve full managed asset coverage while removing the obsolete user-facing selection knobs.

- A clean-room rebuild should preserve three separate layers instead of collapsing them into one: the authoring tree in `packages/docs/template/`, the profile-selection rules in `packages/cli/src/profile.ts`, `packages/cli/src/rules.ts`, and `packages/cli/src/catalog.ts`, and the managed-install state in `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, and `packages/cli/src/manifest.ts`. Losing that separation would blur template ownership, selection policy, and manifest-safe apply behavior.
- Preserve the `buildable` vs copied-file boundary. Today the pipeline renders only routers and the design fallback trio (`packages/cli/src/renderers.ts:40-96`) and copies most contract/template files verbatim from the template package (`packages/cli/src/utils.ts:49-55`). If a rebuild starts rendering every reference and template file dynamically, `packages/cli/tests/consistency.test.ts:44-50` will no longer be able to prove that the checked-in full-profile template matches generated output.
- When adding or renaming any template-owned asset, the minimum update set spans `packages/docs/template/`, `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/renderers.ts` when the asset is buildable, the consistency/renderers tests, the packaging sync path in `scripts/copy-template-to-cli.mjs:24-27`, and the manual re-seed guidance in `packages/docs/README.md`. The design and history docs in `docs/designs/2026-04-16-asset-pipeline-completeness.md` and `docs/designs/2026-04-22-docs-assets-resource-namespace.md` show how easy it is for those layers to drift when only one is updated.
- Factual drift note: several historical design and plan docs such as `docs/designs/2026-04-16-asset-pipeline-completeness.md` and `docs/plans/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md` still describe older hidden namespaces like `docs/.references` or `docs/.assets`. They are useful lineage for why the current system exists, but rebuilders should treat current code plus `packages/docs/template/docs/assets/**` as authoritative.
- Candidate shared risk register item: the wizard promises "all" vs "required" modes for both templates and references in `packages/cli/src/wizard.ts:93-104` and `packages/cli/src/wizard.ts:838-889`, but the implementation uses `referencesMode` only to optionally add `docs/assets/references/harness-capability-matrix.md` in `packages/cli/src/rules.ts:177-179` and does not branch on `templatesMode` at all in `packages/cli/src/rules.ts:130-159`. The mode labels currently express a broader contract than the selector logic enforces.
- Candidate shared risk register item: `ResolvedAsset.assetClass` still allows `"static"` in `packages/cli/src/types.ts:75-80`, but `buildAsset()` in `packages/cli/src/catalog.ts:7-20` currently emits only `"buildable"` and `"scoped-static"`. Either a third asset class is planned and unimplemented, or the type has gone stale.
- Candidate shared risk register item: `README.md` reserves `packages/content/` for CLI-rendered content fragments, but the current template asset pipeline resolves only `packages/docs/template/` or bundled `packages/cli/template/` via `packages/cli/src/utils.ts:33-55`, and no selector in `packages/cli/src/catalog.ts:64-85` or renderer in `packages/cli/src/renderers.ts:54-570` consumes `packages/content/`. Future rendered fragment support does not yet have a contract or integration point.
- Candidate shared risk register item: path knowledge is still duplicated across `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/renderers.ts`, tests, and package docs even after the `docs/assets/**` migration. `docs/designs/2026-04-22-docs-assets-resource-namespace.md` explicitly preferred centralized path constants, but the live implementation still relies on overlapping literal path sets. Adding new router families or moving resource directories can still create path drift across modules.
- Candidate shared risk register item: dogfood re-seeding remains manual. `packages/docs/README.md` intentionally avoids an automated re-seed script, which keeps contributors reviewing propagated changes, but it also means the active repo-root `docs/assets/**` tree can drift from `packages/docs/template/docs/assets/**` between template edits and re-seed passes.

## Reference

- The authoritative contract files for this subsystem live under `packages/docs/template/docs/assets/references/` and `packages/docs/template/docs/assets/templates/`, with consumer-facing copies installed into `docs/assets/**` through the planner/apply pipeline.
- Asset selection and materialization are governed by `packages/cli/src/rules.ts:120-194`, `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/renderers.ts:40-570`, and the manifest persistence layer in `packages/cli/src/manifest.ts:17-100`.
- The packaged delivery boundary remains `packages/docs/template/` during authoring and `packages/cli/template/` after `scripts/copy-template-to-cli.mjs:24-27` prepares the CLI tarball.

## Source Anchors

- `README.md`
- `packages/docs/README.md`
- `packages/docs/template/AGENTS.md`
- `packages/docs/template/docs/AGENTS.md`
- `packages/docs/template/docs/assets/AGENTS.md`
- `packages/docs/template/docs/assets/references/output-contract.md`
- `packages/docs/template/docs/assets/references/execution-workflow.md`
- `packages/docs/template/docs/assets/templates/prd-subsystem.md`
- `scripts/copy-template-to-cli.mjs:24-27`
- `packages/cli/package.json:9-25`
- `packages/cli/src/types.ts:38-97`
- `packages/cli/src/profile.ts:10-110`
- `packages/cli/src/rules.ts:8-194`
- `packages/cli/src/catalog.ts:7-85`
- `packages/cli/src/renderers.ts:40-570`
- `packages/cli/src/utils.ts:33-55`
- `packages/cli/src/planner.ts:19-201`
- `packages/cli/src/install.ts:107-223`
- `packages/cli/src/manifest.ts:17-100`
- `packages/cli/src/wizard.ts:93-104`
- `packages/cli/src/wizard.ts:838-889`
- `packages/cli/tests/consistency.test.ts:9-77`
- `packages/cli/tests/renderers.test.ts:6-73`
- `docs/designs/2026-04-16-asset-pipeline-completeness.md`
- `docs/designs/2026-04-22-docs-assets-resource-namespace.md`
- `docs/plans/2026-04-16-w4-r0-asset-pipeline-completeness/00-overview.md`
- `docs/plans/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md`
- `docs/plans/2026-04-21-w10-r0-make-docs-rename/02-template-renderers-and-assets.md`
