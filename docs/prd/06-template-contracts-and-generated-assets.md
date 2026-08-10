# 06 Template Contracts and Generated Assets

## Purpose

This subsystem owns the shipped documentation template, the contract/reference/template assets under `packages/docs/template/.make-docs/`, the managed project-asset routers under `packages/docs/template/docs/assets/`, and the static asset catalog that decides which template files become managed consumer artifacts. The canonical authoring tree is `packages/docs/template/`; `packages/cli/template/` is a packaged copy produced by `scripts/copy-template-to-cli.mjs`.

The CLI no longer dynamically renders scaffold documents. What is in `packages/docs/template/` is what gets copied into the target project, with install selections controlling only which paths are included. Agent instruction files are the only special reconciliation case: every installed `AGENTS.md` and `CLAUDE.md` is still sourced from the template bytes, but the manifest hashes and updates operate on the make-docs managed block so user text outside the markers survives.

## Scope

- Covered here: the template tree under `packages/docs/template/`, static path selection in `packages/cli/src/rules.ts`, asset construction in `packages/cli/src/catalog.ts`, template resolution in `packages/cli/src/utils.ts`, managed-block hashing in `packages/cli/src/manifest.ts`, and planner reconciliation in `packages/cli/src/planner.ts`.
- The shipped surface is the consumer tree described in `README.md` and `packages/docs/README.md`: `.make-docs/{contracts,references,templates,scripts}/system/**` holds product-owned system resources, `docs/assets/{archive,artifacts,library,playbooks}/**` holds managed project documentation assets, on-demand history records are written under `docs/assets/archive/history/**`, visible capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` hold authored outputs, and mutable CLI state stays at `.make-docs/manifest.json` plus `.make-docs/conflicts/<run-id>/`.
- Not covered here: skill payload packaging under `packages/cli/src/skill-catalog.ts`, lifecycle backup/uninstall semantics, or the authored contents of PRDs, plans, and work backlogs that consume these contracts.

## Component and Capability Map

- Prompt, template, and reference assets are selected by static path rules rather than public wizard modes.
- Root and nested `AGENTS.md` and `CLAUDE.md` files are template-sourced managed-block files; no dedicated `.make-docs/AGENTS.md` or `.make-docs/CLAUDE.md` instruction files are shipped. [15-agent-instruction-ownership-and-managed-blocks.md](./15-agent-instruction-ownership-and-managed-blocks.md) owns their block-scoped behavior.
- The product has no dynamic scaffold renderer or `buildable` asset concept. Rebuilders must not introduce generated router, reference, or template content unless a future PRD explicitly changes the product contract.
- Shipped work-backlog guidance is authored template-first, then dogfooded and bundled; root `docs/` copies and installed skill projections do not replace `packages/docs/template/` as the source for template-owned work guidance.
- Full-snapshot materialization remains the default static-template path; immutable product-owned contracts, templates, prompts, and routers are system assets; and mutable authored docs, overlays, local config, skills, and plugins are not provider-resolved system assets, per [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md).
- [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns the canonical managed project documentation asset defaults. Shipped asset routers live under `docs/assets/{archive,artifacts,library,playbooks}/`, and history records are created on demand under `docs/assets/archive/history/**`. [47-persona-model.md](./47-persona-model.md) owns the machine-readable `persona` audience target for persona-scoped library documents and playbooks. Both surfaces follow template-first authoring before dogfood reseeding or package copy.
- Generated templates must carry common `title`, `kind`, and `status` frontmatter plus conditional `follow_on`, `source`, `lifecycle`, `coordinate`, and `persona` metadata when required by [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Any default config template starts in the template source, and generated prose may use configured labels only while preserving canonical metadata and required body contracts under [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md).
- Template-owned playbooks use `docs/assets/playbooks/<persona-slug>/<playbook-slug>.playbook.md`, required playbook frontmatter, and build/run stack metadata when shipped through the static template pipeline, as defined by [34-playbook-authoring-contract-and-model.md](./34-playbook-authoring-contract-and-model.md).

### Invariant Managed Asset Contract

- Included prompt starters, document templates, and reference files are invariant managed assets whenever their owning capability surface is installed. Capabilities select complete path families; users do not select these three families independently.
- Static asset rules and the catalog must include every prompt, template, and reference belonging to the effective capability surface on install, sync, and reconfigure. Divergent local content enters the explicit managed-file conflict flow owned by PRD 05 instead of causing a partial asset-selection mode.
- No template, rule, catalog, renderer, or manifest schema may reintroduce `prompts`, `templatesMode`, or `referencesMode` as current selection fields.

### Template Ownership and Mutation Order

- Template-owned files include root and docs instruction routers, managed project-asset routers, shipped workflow references, shipped templates, shipped prompt starters, starter documentation structure, and static helper files recorded by the installer as managed assets.
- Project-owned files include generated designs, plans, PRDs, work backlogs, local library content, history and archive records, artifact review content, overlays, and local config. Repo-root location does not convert them into template-owned assets.
- Mixed directories such as `docs/assets/archive/` and its on-demand `history/` subtree are directory-contract surfaces: routers and starter structure may be template-owned, while local records remain project-owned unless deliberately selected as starter content. `.make-docs/` runtime state is never reseeded through `docs/`.
- Shipped asset mutation order is: edit `packages/docs/template/`; update rules, catalog, validation, and manifest expectations when the managed set changes; reseed only affected template-owned dogfood files; refresh `packages/cli/template/` through copy/prepack; then run dogfood and packed-package validation before claiming the asset is shipped.
- Conformance-lab assets, generated run evidence, and other maintainer-only material do not enter the shipped template, dogfood reseed, or bundled template unless a later current PRD explicitly promotes a subset.

- The physical source of truth is `packages/docs/template/`. Root instructions live at `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md`; docs routers and managed project-asset routers live under `packages/docs/template/docs/**`; authoritative contracts, references, prompts, and templates live under `packages/docs/template/.make-docs/{contracts,references,templates}/system/**`.
- Install profile resolution starts in `packages/cli/src/profile.ts`, where `prd` depends on `plans` and `work` depends on both `plans` and `prd`. `defaultSelections()` enables documentation capabilities and harnesses but disables skills by default.
- Rule-based path selection happens in `packages/cli/src/rules.ts`. Prompt starters, reference files, templates, and capability routers are selected by path. These rules never rewrite file content.
- Harness and directory router expansion happens in `packages/cli/src/types.ts` and `packages/cli/src/catalog.ts`. Enabled harnesses become active instruction kinds (`AGENTS.md`, `CLAUDE.md`), and each active instruction kind is fanned out to root, `docs/`, `docs/assets/`, managed asset subdirectories, `.make-docs/**` resource subdirectories, and capability directories when those path families are installed.
- Asset materialization happens in `packages/cli/src/catalog.ts`. `buildAsset()` reads template bytes through `readPackageFile()`, marks scaffold assets as `scoped-static`, assigns a `file:<path>` source id, and returns sorted `ResolvedAsset[]` entries.
- Validation is built into the subsystem. `packages/cli/tests/consistency.test.ts` asserts that desired scaffold assets match packaged template bytes, that every template file is covered by the static asset pipeline, and that every template `AGENTS.md` / `CLAUDE.md` has a valid managed block.

## Contracts and Data

- Root and docs instruction routers remain always-local bootstrap surfaces in every materialization mode, and provider/cache-backed assets must be pinned rather than silently replacing static template bytes; [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md) owns the detailed provenance contract.
- Repo-root authored docs are not product-owned merely because they live under `docs/`; existing dogfood/template installs use reviewed migration dispositions rather than path-only ownership assumptions under [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- Shipped template-owned assets are authored in `packages/docs/template/` first, dogfooded into repo-root `docs/` under review, and copied into `packages/cli/template/` only through the package preparation path.
- Product-owned contracts, references, templates, scripts, and deterministic helpers migrate toward `.make-docs/**/system/` only through an accepted implementation plan, leaving managed project documentation assets under `docs/assets/**` as divided by [21-project-tool-directory-and-resource-tiers.md](./21-project-tool-directory-and-resource-tiers.md).
- The [managed project asset model](./22-project-documentation-asset-model.md) limits `docs/assets/**` to archive, artifacts, library, playbooks, and on-demand archive history records; top-level `docs/artifacts/**` moves to `docs/assets/artifacts/**`; top-level `docs/archive/**` is not a shipped v2 target; and tool resources remain governed by PRD 21.
- Template changes preserve YAML as the canonical machine-readable layer while keeping required body sections for readers under [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Template selection and package copy remain canonical path operations; config may affect display labels in generated text but must not generate alternate schemas, filenames, or frontmatter keys, per [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md).
- Static template validation must fail or report drift when shipped playbooks have missing required frontmatter, invalid `kind`, invalid `persona`, path/persona mismatch, invalid `stack`, or incomplete body contract sections under [34-playbook-authoring-contract-and-model.md](./34-playbook-authoring-contract-and-model.md).

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
- Historical design and plan docs may still describe generated routers or hidden namespaces. Treat this PRD as product authority and current code plus `packages/docs/template/**` as implementation evidence; reconcile any drift through authoritative PRD maintenance rather than allowing implementation to override the contract.

## Reference

- The authoritative contract files for this subsystem live under `packages/docs/template/.make-docs/{contracts,references,templates}/system/**`, with managed project-asset routers installed into `docs/assets/**` through the planner/apply pipeline.
- Static asset selection and materialization are governed by `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/utils.ts`, and the manifest persistence layer in `packages/cli/src/manifest.ts`.
- The packaged delivery boundary remains `packages/docs/template/` during authoring and `packages/cli/template/` after `scripts/copy-template-to-cli.mjs` prepares the CLI tarball.

## Deferred-Obligation and UAT Asset Boundaries

The current product does not ship dedicated deferred-obligation or naive-UAT contracts, templates, prompts, playbooks, or agent instructions. If those system resources become part of the product, they belong in the upstream template authority at `packages/docs/template/`; installed `.make-docs/` and `docs/` copies remain generated projections rather than independent product authorities.

The authority and state boundaries are owned by [R-OBL-AUTH](45-deferred-obligation-governance.md#r-obl-auth-authority-chain-and-backlinks), [R-OBL-STATE](45-deferred-obligation-governance.md#r-obl-state-repository-and-project-state-boundary), and [R-NUAT-FUTURE](46-naive-end-user-acceptance-testing.md#r-nuat-future-documentation-first-and-future-automation). Any future deterministic CLI or validator is explicitly later work and must consume those documentation contracts rather than redefining them.

## Template Source Authority

`packages/docs/template/` is the upstream authoring authority for shipped Make Docs system resources and default assets. Generated package copies and the repository dogfood instance are downstream projections and must not become competing sources of truth.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 11, 19.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

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
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
- `docs/prd/34-playbook-authoring-contract-and-model.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
