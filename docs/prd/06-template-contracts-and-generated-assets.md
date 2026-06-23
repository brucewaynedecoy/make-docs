# 06 Template Contracts and Static Assets

## Purpose

This subsystem owns the shipped documentation template, the contract/reference/template assets under `packages/docs/template/docs/assets/`, and the static asset catalog that decides which template files become managed consumer artifacts. The canonical authoring tree is `packages/docs/template/`; `packages/cli/template/` is a packaged copy produced by `scripts/copy-template-to-cli.mjs`.

The CLI no longer dynamically renders scaffold documents. What is in `packages/docs/template/` is what gets copied into the target project, with install selections controlling only which paths are included. Agent instruction files are the only special reconciliation case: every installed `AGENTS.md` and `CLAUDE.md` is still sourced from the template bytes, but the manifest hashes and updates operate on the make-docs managed block so user text outside the markers survives.

## Scope

- Covered here: the template tree under `packages/docs/template/`, static path selection in `packages/cli/src/rules.ts`, asset construction in `packages/cli/src/catalog.ts`, template resolution in `packages/cli/src/utils.ts`, managed-block hashing in `packages/cli/src/manifest.ts`, and planner reconciliation in `packages/cli/src/planner.ts`.
- The shipped surface is the consumer tree described in `README.md` and `packages/docs/README.md`: `docs/assets/` holds document resources, visible capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` hold authored outputs, and mutable CLI state stays at `.make-docs/manifest.json` plus `.make-docs/conflicts/<run-id>/`.
- Not covered here: skill payload packaging under `packages/cli/src/skill-catalog.ts`, lifecycle backup/uninstall semantics, or the authored contents of PRDs, plans, and work backlogs that consume these contracts.

## Component and Capability Map

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference asset selection. Included prompts, templates, and references are managed by static path rules rather than public wizard modes.
- Superseded by [15-revise-agent-instruction-file-ownership.md](./15-revise-agent-instruction-file-ownership.md) for instruction-file ownership. Root and nested `AGENTS.md` / `CLAUDE.md` files are template-sourced managed-block files; no dedicated `.make-docs/AGENTS.md` or `.make-docs/CLAUDE.md` instruction files are shipped.
- Corrected by the W17 static-template follow-up: the dynamic scaffold renderer and `buildable` asset concept are removed. Rebuilders must not reintroduce generated router/reference/template content unless a future PRD explicitly changes the product contract.
- Clarified by the W15 source-authority reconciliation: shipped work-backlog guidance is authored template-first, then dogfooded and bundled, so root `docs/` copies and installed skill projections do not replace `packages/docs/template/` as the source for template-owned work guidance.
- Enhanced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) for the system asset boundary. Full-snapshot materialization remains the default static-template path, immutable product-owned contracts/templates/prompts/routers are system assets, and mutable authored docs, overlays, local config, skills, and plugins are not provider-resolved system assets.

- The physical source of truth is `packages/docs/template/`. Root instructions live at `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md`; docs routers and resource routers live under `packages/docs/template/docs/**`; authoritative contracts and templates live under `packages/docs/template/docs/assets/references/*.md` and `packages/docs/template/docs/assets/templates/*.md`.
- Install profile resolution starts in `packages/cli/src/profile.ts`, where `prd` depends on `plans` and `work` depends on both `plans` and `prd`. `defaultSelections()` enables documentation capabilities and harnesses but disables skills by default.
- Rule-based path selection happens in `packages/cli/src/rules.ts`. Prompt starters, reference files, templates, and capability routers are selected by path. These rules never rewrite file content.
- Harness and directory router expansion happens in `packages/cli/src/types.ts` and `packages/cli/src/catalog.ts`. Enabled harnesses become active instruction kinds (`AGENTS.md`, `CLAUDE.md`), and each active instruction kind is fanned out to root, `docs/`, `docs/artifacts/`, `docs/assets/`, resource subdirectories, and capability directories when those path families are installed.
- Asset materialization happens in `packages/cli/src/catalog.ts`. `buildAsset()` reads template bytes through `readPackageFile()`, marks scaffold assets as `scoped-static`, assigns a `file:<path>` source id, and returns sorted `ResolvedAsset[]` entries.
- Validation is built into the subsystem. `packages/cli/tests/consistency.test.ts` asserts that desired scaffold assets match packaged template bytes, that every template file is covered by the static asset pipeline, and that every template `AGENTS.md` / `CLAUDE.md` has a valid managed block.

## Contracts and Data

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for mode-sensitive prompt/template/reference selection.
- Superseded by [15-revise-agent-instruction-file-ownership.md](./15-revise-agent-instruction-file-ownership.md) for generated instruction assets and whole-file instruction hashing.
- Enhanced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) for local bootstrap and asset provenance. Root and docs instruction routers remain always-local bootstrap surfaces in every materialization mode, and provider/cache-backed assets must be pinned rather than silently replacing static template bytes.
- Enhanced by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) for template and dogfood migration boundaries. Repo-root authored docs are not product-owned merely because they live under `docs/`, and existing dogfood/template installs must use reviewed migration dispositions rather than path-only ownership assumptions.
- Enhanced by [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) for source-of-truth order. Shipped template-owned assets are authored in `packages/docs/template/` first, dogfooded into repo-root `docs/` under review, and copied into `packages/cli/template/` only through the package preparation path.

- Template content is authoritative. If a scaffold document needs different text, edit `packages/docs/template/` first, re-seed `packages/cli/template/`, and then dogfood the same template-owned file into repo-root `docs/` when appropriate.
- Install selections are path selection only. Capabilities and harnesses may include or exclude template files, but they must not generate alternate file bodies.
- `ResolvedAsset` carries `relativePath`, `assetClass`, `sourceId`, and final `content`. Scaffold assets use static template content and `file:<path>` provenance.
- All installed instruction-router files are managed-block files. Manifest hashing for any `AGENTS.md` or `CLAUDE.md` path records the block body; updates replace only the block; user text outside markers is preserved.
- Stale instruction-router files are removable only when the managed block still matches the manifest and no user content exists outside the block, or when a legacy full-file hash proves the file is clean. Locally modified legacy routers remain conflicts.
- Non-instruction managed files keep whole-file hash ownership and whole-file overwrite/skip behavior.

## Integrations

- Packaging integration is deliberate and two-stage. `packages/docs/README.md` describes `packages/docs/template/` as the shippable docs package, `scripts/copy-template-to-cli.mjs` copies that tree into `packages/cli/template`, and `packages/cli/package.json` includes the bundled `template/` directory in published CLI artifacts.
- Consumer-install integration uses the same static asset catalog for first install, sync, and reconfigure. The planner decides create, update, noop, removal, and conflict behavior; it does not ask the catalog to synthesize alternate content.
- Dogfood integration is manual by design. The repo-root `docs/` tree is a dogfood instance of the template, but `packages/docs/template/` remains the source of truth for template-owned files.
- Validation integration spans code and docs: static template parity, instruction-router blocks, smoke-pack packaging, and router-pair checks all need to pass when template-owned files change.

## Rebuild Notes

- Preserve the static-template contract. A rebuild should keep `packages/docs/template/` as the single content source and keep `packages/cli/template/` as the packaged copy.
- Do not reintroduce dynamic scaffold rendering, `renderBuildableAsset()`, `isBuildablePath()`, renderer-only helper constants, or `buildable` scaffold assets.
- Preserve path selection separately from content ownership. Capability and harness decisions choose paths; they do not mutate the bytes of selected scaffold files.
- Preserve managed-block semantics for every installed `AGENTS.md` / `CLAUDE.md` file, not just root instructions.
- When adding or renaming any template-owned asset, update `packages/docs/template/`, `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts` only if path selection changes, the consistency tests, the packaging sync path, and the manual re-seed guidance in `packages/docs/README.md`.
- Historical design and plan docs may still describe generated routers or hidden namespaces. Treat current code plus `packages/docs/template/**` as authoritative.

## Reference

- The authoritative contract files for this subsystem live under `packages/docs/template/docs/assets/references/` and `packages/docs/template/docs/assets/templates/`, with consumer-facing copies installed into `docs/assets/**` through the planner/apply pipeline.
- Static asset selection and materialization are governed by `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/utils.ts`, and the manifest persistence layer in `packages/cli/src/manifest.ts`.
- The packaged delivery boundary remains `packages/docs/template/` during authoring and `packages/cli/template/` after `scripts/copy-template-to-cli.mjs` prepares the CLI tarball.

## Source Anchors

- `README.md`
- `packages/docs/README.md`
- `packages/docs/template/`
- `packages/cli/template/`
- `scripts/copy-template-to-cli.mjs`
- `packages/cli/package.json`
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/utils.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/install.test.ts`
