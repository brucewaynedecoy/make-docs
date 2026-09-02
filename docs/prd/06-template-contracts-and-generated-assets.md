# 06 Template Contracts and Generated Assets

## Purpose

This subsystem owns the shipped documentation template, the contract/prompt/reference/template resources under `packages/docs/template/.make-docs/`, the configured bootstrap and on-demand-surface routers under `packages/docs/template/`, and the static asset catalog that decides which template files become managed consumer artifacts. The canonical authoring tree is `packages/docs/template/`; `packages/cli/template/` is a packaged copy produced by `scripts/copy-template-to-cli.mjs`, and the installed package resource provider is the default runtime source.

The CLI no longer dynamically renders scaffold documents. What is in `packages/docs/template/` is what gets copied into the target project, with install selections controlling only which paths are included. Agent instruction files are the only special reconciliation case: every installed `AGENTS.md` and `CLAUDE.md` is still sourced from the template bytes, but the manifest hashes and updates operate on the make-docs managed block so user text outside the markers survives.

## Scope

- Covered here: the template tree under `packages/docs/template/`, static path selection in `packages/cli/src/rules.ts`, asset construction in `packages/cli/src/catalog.ts`, template resolution in `packages/cli/src/utils.ts`, managed-block hashing in `packages/cli/src/manifest.ts`, and planner reconciliation in `packages/cli/src/planner.ts`.
- The shipped surface is the consumer tree described in `README.md` and `packages/docs/README.md`: the installed provider exposes product-owned `contract`, `prompt`, `reference`, and `template` bodies; configured-harness routers are always installed at the project root, `docs/`, `.make-docs/`, `.make-docs/system/`, and all four typed directories; an explicitly selected projection may add resource bodies under `.make-docs/system/{contracts,prompts,references,templates}/`; Make Docs-managed archive/provenance records use on-demand `.make-docs/archive/**`; non-authoritative source and analysis inputs use on-demand `docs/artifacts/**`; persona-scoped reader assets and testing evidence use on-demand `docs/assets/<persona-slug>/**`; visible capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` hold authored outputs; and mutable CLI state stays at `.make-docs/manifest.json` plus `.make-docs/conflicts/<run-id>/`.
- Not covered here: skill payload packaging under `packages/cli/src/skill-catalog.ts`, lifecycle backup/uninstall semantics, or the authored contents of PRDs, plans, and work backlogs that consume these contracts.

## Component and Capability Map

- The Human Experience Contract and Human Experience Reference are peer system resources that carry the canonical standard and its application guidance. See [PRD 49](49-human-experience-standard-and-intent.md).

- Contracts, prompts, references, and templates are peer system-resource types. Each resource has stable identity `make-docs://system/<type>/<posix-relative-path>` independent of its installed-provider or optional local-projection origin.
- Maintainer-facing shipped resources that define this four-type authority use plain words where possible. Each necessary special term is explained at first use. A term is also defined in [PRD 04](./04-glossary.md) only when it is stable product vocabulary.
- Configured project-root, `docs/`, `.make-docs/`, `.make-docs/system/`, typed-directory, and on-demand-surface `AGENTS.md` or `CLAUDE.md` routers are template-sourced managed-block files for supported harnesses. [15-agent-instruction-ownership-and-managed-blocks.md](./15-agent-instruction-ownership-and-managed-blocks.md) owns their block-scoped behavior.
- The product has no dynamic scaffold renderer or `buildable` asset concept. Rebuilders must not introduce generated router, reference, or template content unless a future PRD explicitly changes the product contract.
- Shipped work-backlog guidance is authored template-first, projected into the package, then dogfooded at the repository root; root `docs/` copies and installed skill projections do not replace `packages/docs/template/` as the source for template-owned work guidance.
- Machine-served installed resource bodies are the default. Local resource-body materialization under the always-local `.make-docs/system/**` router skeleton is optional, selection-scoped, and provenance-aware. Mutable authored docs, overlays, local config, skills, and plugins are not provider-resolved system resources, per [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md).
- [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns the canonical project documentation asset destinations and on-demand directory contract. Shipped routers describe `.make-docs/archive/`, `docs/artifacts/`, and `docs/assets/<persona-slug>/` without requiring empty placeholder trees. [47-persona-model.md](./47-persona-model.md) owns the machine-readable audience target for persona-scoped reader assets and testing evidence. Template-owned routers follow upstream authoring -> package projection -> root dogfood order.
- Generated templates must carry common `title`, `kind`, and `status` frontmatter plus conditional `follow_on`, `source`, `lifecycle`, `coordinate`, and `persona` metadata when required by [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Any default config template starts in the template source, and generated prose may use configured labels only while preserving canonical metadata and required body contracts under [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md).
- Playbooks and Protocols are not current product resources or generated-asset kinds and must not be introduced by the template, catalog, provider, projection, or dogfood copy.

### Invariant Managed Asset Contract

- Every shipped contract, prompt, reference, and template is an invariant provider resource whenever its owning capability surface is installed. The provider inventory remains complete even when no local resource bodies are selected.
- Static asset rules and the catalog must include every resource belonging to the effective capability surface on install, sync, and reconfigure. Optional resource-body selection may choose none, a resource type, or the full system set; it never removes a router. Divergent local projected content enters the explicit managed-file conflict flow owned by PRD 05 instead of changing provider availability.
- No template, rule, catalog, renderer, or manifest schema may reintroduce `prompts`, `templatesMode`, or `referencesMode` as current selection fields.

### Template Ownership and Mutation Order

Human Experience resources and every changed design, plan, PRD, work, coverage, and UAT resource follow the same upstream-first order, package projection, affected dogfood reseed, and installed-package proof.

- Template-owned files include project-root, `docs/`, `.make-docs/`, `.make-docs/system/`, typed-directory, and on-demand-surface instruction routers, shipped workflow references, shipped templates, shipped prompt starters, starter documentation structure, and static helper files recorded by the installer as managed assets.
- Project-owned files include generated designs, plans, PRDs, work backlogs, persona-scoped reader assets, history records, artifact review content, overlays, and local config. Repo-root location does not convert them into template-owned assets.
- On-demand `.make-docs/archive/`, `docs/artifacts/`, and `docs/assets/<persona-slug>/` paths are directory-contract surfaces: routers may be template-owned, while local records remain project-owned or explicitly managed according to the owning contract. `.make-docs/` runtime state and archive/provenance records are never reseeded through `docs/`.
- Shipped asset mutation order is: edit `packages/docs/template/`; update rules, catalog, validation, and manifest expectations when the managed set changes; refresh `packages/cli/template/` through copy/prepack; reseed only affected template-owned dogfood files; then validate the root dogfood and representative packed-package install before claiming the asset is shipped.
- Conformance-lab assets, generated run evidence, and other maintainer-only material do not enter the shipped template, dogfood reseed, or bundled template unless a later current PRD explicitly promotes a subset.
- Performance Evidence Governance adds exactly four peer system resources: the `performance-evidence-governance.md` contract, `performance-coverage.prompt.md` prompt, `performance-evidence.md` reference, and `performance-evidence-profile.md` template. They are authored in the matching `packages/docs/template/.make-docs/system/{contracts,prompts,references,templates}/` family, copied into `packages/cli/template/` only through copy/prepack, and dogfooded only when the corresponding resource or router is selected.
- Performance-facing instruction routers remain thin: they point to the governing contract and expose the coverage prompt or profile template only when a performance candidate exists. Routers, lifecycle templates, and this delivery PRD do not duplicate the substantive applicability, profile, evidence, outcome, budget, expiry, or escalation policy owned by [PRD 48](./48-performance-evidence-governance.md).

- The physical source of truth is `packages/docs/template/`. Root instructions live at `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md`; docs routers and managed project-asset routers live under `packages/docs/template/docs/**`; authoritative contracts, prompts, references, and templates live in their upstream template resource families and are indexed into the installed provider with stable resource URIs.
- Install profile resolution starts in `packages/cli/src/profile.ts`, where `prd` depends on `plans` and `work` depends on both `plans` and `prd`. `defaultSelections()` enables documentation capabilities and harnesses but disables skills by default.
- Rule-based path selection happens in `packages/cli/src/rules.ts`. Prompt starters, reference files, templates, and capability routers are selected by path. These rules never rewrite file content.
- Harness and directory router expansion happens in `packages/cli/src/types.ts` and `packages/cli/src/catalog.ts`. Enabled harnesses become active instruction kinds (`AGENTS.md`, `CLAUDE.md`), and each supported instruction kind is installed at the project root, `docs/`, `.make-docs/`, `.make-docs/system/`, all four typed directories, and selected or first-created on-demand surfaces; unsupported router shapes are reported rather than invented.
- Asset materialization happens in `packages/cli/src/catalog.ts`. `buildAsset()` reads template bytes through `readPackageFile()`, marks scaffold assets as `scoped-static`, assigns a `file:<path>` source id, and returns sorted `ResolvedAsset[]` entries.
- Validation is built into the subsystem. `packages/cli/tests/consistency.test.ts` asserts that desired scaffold assets match packaged template bytes, that every template file is covered by the static asset pipeline, and that every template `AGENTS.md` / `CLAUDE.md` has a valid managed block.

## Contracts and Data

The Human Experience Contract uses stable URI `make-docs://system/contract/human-experience-contract.md`. The Human Experience Reference uses stable URI `make-docs://system/reference/human-experience.md`. Both use the existing stable URI and optional projection model. They do not create a new resource type or a mandatory project projection.

- Project-root, `docs/`, `.make-docs/`, `.make-docs/system/`, and typed-directory instruction routers remain always-local bootstrap surfaces. The installed provider supplies resource bodies without local snapshots, and any selected body projection must retain trustworthy provenance rather than silently replacing package bytes; [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md) owns the detailed contract.
- Repo-root authored docs are not product-owned merely because they live under `docs/`; existing dogfood/template installs use reviewed migration dispositions rather than path-only ownership assumptions under [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- Shipped template-owned assets are authored in `packages/docs/template/` first, copied into `packages/cli/template/` only through the package preparation path, and then dogfooded into repository-root `.make-docs/` or `docs/` under review.
- Product-owned contracts, prompts, references, and templates are package-provider resources. Only explicitly selected local resource bodies belong beside the always-local routers under `.make-docs/system/{contracts,prompts,references,templates}/`; deterministic runtime helpers remain package code rather than a fifth content-resource type. Project documentation and managed archival surfaces use the on-demand destinations divided by [21-project-tool-directory-and-resource-tiers.md](./21-project-tool-directory-and-resource-tiers.md).
- The Performance Evidence Governance resource set uses the stable peer URIs `make-docs://system/contract/performance-evidence-governance.md`, `make-docs://system/prompt/performance-coverage.prompt.md`, `make-docs://system/reference/performance-evidence.md`, and `make-docs://system/template/performance-evidence-profile.md`. The installed provider remains the default source; an explicitly selected project-local projection may materialize the same bytes under the matching `.make-docs/system/{contracts,prompts,references,templates}/` path, but project-authored profiles, results, work, and evidence never become shipped defaults.
- The governing contract and [PRD 48](./48-performance-evidence-governance.md) own substantive performance policy. Templates and prompts progressively disclose only qualification, canonical-profile linkage, finite budget and stop references, and outcome/evidence handoff fields; they must not prefill targets, universal counts, or statistical recipes.
- The [managed project asset model](./22-project-documentation-asset-model.md) assigns Make Docs-managed archive/provenance records to `.make-docs/archive/**`, non-authoritative inputs to `docs/artifacts/**`, and persona-scoped reader assets and testing evidence to `docs/assets/<persona-slug>/**`; old archive, artifact, library, and workflow-shaped paths are migration inputs, and system resources remain governed by PRD 21.
- Template changes preserve YAML as the canonical machine-readable layer while keeping required body sections for readers under [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Template selection and package copy remain canonical path operations; config may affect display labels in generated text but must not generate alternate schemas, filenames, or frontmatter keys, per [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md).
- Static template validation must fail or report drift when a resource lacks a valid type/path identity, maps to a URI outside `make-docs://system/<type>/<posix-relative-path>`, or differs between the upstream template, packaged provider inventory, and declared projection bytes.

- Template content is authoritative. If a scaffold document needs different text, edit `packages/docs/template/` first, re-seed `packages/cli/template/`, and then dogfood the same template-owned file into repo-root `docs/` when appropriate.
- Install selections are path selection only. Capabilities and harnesses may include or exclude template files, but they must not generate alternate file bodies.
- `ResolvedAsset` carries `relativePath`, `assetClass`, `sourceId`, and final `content`. Scaffold assets use static template content and `file:<path>` provenance.
- All installed instruction-router files are managed-block files. Manifest hashing for any `AGENTS.md` or `CLAUDE.md` path records the block body; updates replace only the block; user text outside markers is preserved.
- Stale instruction-router files are removable only when the managed block still matches the manifest and no user content exists outside the block, or when a legacy full-file hash proves the file is clean. Locally modified legacy routers remain conflicts.
- Non-instruction managed files keep whole-file hash ownership and whole-file overwrite/skip behavior.

## Integrations

- [PRD 49](49-human-experience-standard-and-intent.md) owns Human Experience semantics. This PRD owns the upstream resources, package projection, affected dogfood reseed, and installed parity.

- Packaging integration is deliberate and two-stage. `packages/docs/README.md` describes `packages/docs/template/` as the shippable docs package, `scripts/copy-template-to-cli.mjs` copies that tree into `packages/cli/template`, and `packages/cli/package.json` includes the bundled `template/` directory in published CLI artifacts.
- Consumer-install integration uses the same static asset catalog for first install, sync, and reconfigure. The planner decides create, update, noop, removal, and conflict behavior; it does not ask the catalog to synthesize alternate content.
- Dogfood integration is manual by design. Repository-root `.make-docs/` and `docs/` are downstream dogfood instances of the template, but `packages/docs/template/` remains the source of truth for template-owned files.
- Validation integration spans code and docs: static template parity, instruction-router blocks, smoke-pack packaging, and router-pair checks all need to pass when template-owned files change.
- Performance governance integrates through [PRD 48](./48-performance-evidence-governance.md) and the accepted W19 R2 design and plan: this subsystem ships and projects the four resources and thin routers, while PRD 48 remains the single current owner of their substantive product semantics.

## Rebuild Notes

- Preserve the static-template contract. A rebuild should keep `packages/docs/template/` as the single content source and keep `packages/cli/template/` as the packaged copy.
- Do not reintroduce dynamic scaffold rendering, `renderBuildableAsset()`, `isBuildablePath()`, renderer-only helper constants, or `buildable` scaffold assets.
- Preserve path selection separately from content ownership. Capability and harness decisions choose paths; they do not mutate the bytes of selected scaffold files.
- Preserve managed-block semantics for every installed `AGENTS.md` / `CLAUDE.md` file, not just root instructions.
- When adding or renaming any template-owned asset, update `packages/docs/template/`, `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts` only if path selection changes, the consistency tests, the packaging sync path, and the manual re-seed guidance in `packages/docs/README.md`.
- Historical design and plan docs may still describe generated routers or hidden namespaces. Treat this PRD as product authority and current code plus `packages/docs/template/**` as implementation evidence; reconcile any drift through authoritative PRD maintenance rather than allowing implementation to override the contract.

## Reference

The Human Experience Reference is a peer system reference. It explains the canonical standard, principles, impact choices, evidence modes, examples, and common errors without creating a second normative source.

- The authoritative system-resource files for this subsystem live under `packages/docs/template/`; the package provider exposes peer contract, prompt, reference, and template inventories, while configured-harness routers and explicitly selected resource-body projections are installed through the planner/apply pipeline.
- Static asset selection and materialization are governed by `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/utils.ts`, and the manifest persistence layer in `packages/cli/src/manifest.ts`.
- The packaged delivery boundary remains `packages/docs/template/` during authoring and `packages/cli/template/` after `scripts/copy-template-to-cli.mjs` prepares the CLI tarball.

## Deferred-Obligation and UAT Asset Boundaries

Naive end-user UAT keeps one durable workflow contract delivered through peer system resources and, where selected, a thin first-party Skill adapter that delegates deterministic work to typed CLI operations. Those resources are authored in the upstream template authority at `packages/docs/template/`; installed-provider copies, optional resource bodies under the always-local `.make-docs/system/**` router skeleton, and repository dogfood copies remain downstream, and no Playbook- or Protocol-shaped wrapper survives. Any future deferred-obligation-specific system resources follow the same upstream and projection boundary only after their owning authority accepts them.

The authority and state boundaries are owned by [R-OBL-AUTH](45-deferred-obligation-governance.md#r-obl-auth-authority-chain-and-backlinks), [R-OBL-STATE](45-deferred-obligation-governance.md#r-obl-state-repository-and-project-state-boundary), and [R-NUAT-FUTURE](46-naive-end-user-acceptance-testing.md#r-nuat-future-documentation-first-and-future-automation). Any future deterministic CLI or validator is explicitly later work and must consume those documentation contracts rather than redefining them.

## Template Source Authority

The Human Experience Contract and Reference are authored under `packages/docs/template/.make-docs/`. Package, install, upgrade, reconfigure, manifest, and dogfood behavior must preserve existing ownership and conflict rules. Installed-product evidence must prove that packaged resources, generated artifacts, and agent discovery match upstream authority.

`packages/docs/template/` is the upstream authoring authority for shipped Make Docs system resources and default assets. Generated package copies and the repository dogfood instance are downstream projections and must not become competing sources of truth.

## Proportionate Testing Resource Authority

The upstream template must ship one common testing contract and reference, body-record guidance, lifecycle and prompt routing, and concise managed-router discovery for [PRD 50](50-proportionate-testing-and-human-centered-validation.md).

The resource set must:

- expose exactly four core testing types without activating all four by default;
- carry current-decision, maturity, scope, executor, gate, effort, stop, evidence, and rerun semantics;
- preserve PRD 48 as the detailed Performance Testing owner;
- preserve PRD 46 as the detailed Unassisted Goal Testing owner;
- preserve PRD 49 as the built-result Human Experience owner and review lens;
- support short non-gate Guided Progress Review instructions;
- keep testing decisions in document bodies for the first release; and
- require neither a Skill nor a new runtime command.

Author these resources first under `packages/docs/template/`. Then use the reviewed dogfood and installed-package paths. Routers must point to authority instead of copying it.

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

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Purpose`, `Scope`, `Component and Capability Map`, `Invariant Managed Asset Contract`, `Template Ownership and Mutation Order`, `Contracts and Data`, `Reference`, and `Deferred-Obligation and UAT Asset Boundaries`
- Previous contract: Shipped prompts, references, and templates were treated as mandatory local snapshot families alongside Playbook assets and archive/artifact/library directories beneath `docs/assets/**`, with no stable cross-surface resource identity or installed-provider-first contract.
- Replacement contract: Contracts, prompts, references, and templates are peer package-provider resources with stable `make-docs://system/<type>/<posix-relative-path>` identity; local projection and archive/artifact/persona-asset directories are optional and on demand at their accepted targets; Naive UAT uses upstream system resources and a thin optional Skill adapter; Playbooks and Protocols are absent; and `packages/docs/template/` remains upstream of the package and root dogfood projections.
- Rationale: Template and generated-asset authority must match the accepted v2 product boundary before implementation derives catalogs, manifests, or projection behavior.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-15 — W19 R1

- Date: 2026-08-15
- Coordinate: W19 R1
- Affected requirement or section: `Component and Capability Map`
- Previous contract: The four peer resource types had no plain-language rule for their maintainer-facing shipped resources.
- Replacement contract: Maintainer-facing shipped resources that define the four-type authority use plain words where possible, explain each necessary special term at first use, and add a term to PRD 04 only when it is stable product vocabulary.
- Rationale: Q-021 records the owner's bounded P1 decision. The wider repository sweep and coverage-pass policy remain open.
- Source: [Q-021 bounded P1 decision](./03-open-questions-and-risk-register.md#q-021-maintainer-facing-terminology-needs-a-plain-language-rule-and-glossary-backing)

### 2026-08-28 — W20 R0

- Affected requirement or section: `Component and Capability Map`, `Contracts and Data`, `Integrations`, and `Human Experience Resource Authority`.
- Previous contract: The template package delivered peer contracts, references, prompts, and templates, but it did not own Human Experience resources.
- Replacement contract: The template package now owns stable Human Experience Contract and Reference resources, optional projection, upstream-first delivery, dogfood parity, and installed-resource proof.
- Rationale: A product-wide standard must have one stable authority and must reach installed agents without policy copies or package drift.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: component map, contracts and data, integrations, and testing resource authority.
- Previous contract: The template package delivered specialist naive-UAT and performance resources, but it did not own one common testing standard or Guided Progress Review resource path.
- Replacement contract: The upstream template must deliver the PRD 50 testing contract, reference, body-record guidance, prompts, templates, and thin router pointers while preserving specialized PRD 46, PRD 48, and PRD 49 resources.
- Rationale: Agents need one normal discovery path for proportionate testing without requiring a Skill or copying policy into routers.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [Accepted Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 Performance Evidence Governance plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [PRD 48 — Performance Evidence Governance](./48-performance-evidence-governance.md)
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
