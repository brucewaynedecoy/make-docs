# 03 Open Questions and Risk Register

## Purpose

This document centralizes confirmed drift, unresolved product-contract questions, resolved decisions, clean-room rebuild risks, and closeout findings across install/profile state, template assets, CLI command routing, skills distribution, dogfood operations, and release packaging. The current system is the combined behavior of `docs/prd/01-product-overview.md`, `docs/prd/02-architecture-overview.md`, `packages/cli/src/cli.ts:77-244`, `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/skill-catalog.ts:33-138`, `packages/cli/src/utils.ts:33-55`, and `scripts/smoke-pack.mjs:60-246`, so drift in any one layer can mislead contributors or break packaged behavior.

The fixed-core overview layer now exists, but this living register still carries the unresolved cross-cutting gaps those overview docs intentionally call out, especially where current code, current READMEs, packaged artifacts, and future-facing workspace plans do not yet agree. Agents should update this file directly for newly discovered or resolved gaps instead of creating separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks for a new convention.

Status values are `Open`, `Confirming`, `Deferred`, and `Closed`. `Closed` requires an explicit recorded resolution.

This register also tracks cross-cutting workflow, lifecycle, contract, and product-evolution decisions and risks that reach beyond the CLI, install, and packaging surface, including items not yet scoped to a specific wave.

## Confirmed Drift

### D-001 README Wording Understates the Live Idempotent Sync Model

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Align README wording with the planner and CLI output model. |

**Issue**: `README.md:101-107` and `packages/cli/README.md:84-89` say unchanged managed files are updated in place, but `packages/cli/src/planner.ts:19-189` plans `noop` for exact matches and `packages/cli/src/cli.ts:725-805` reports `Already current`.

**Why it matters**: Contributors can misread the installer as more write-heavy than it really is.

**Recommendation**: Rewrite the affected README text to describe exact-match no-op behavior and update-only-when-needed behavior.

**To close**: README text matches the current planner behavior and focused CLI tests still pass.

### D-002 Public Command Guidance Lags the Shipped Command Taxonomy

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Audit public command docs against the live parser and help output. |

**Issue**: `packages/cli/src/cli.ts:894-1019` exposes `skills`, `backup`, and `uninstall`, while `README.md:73`, `packages/cli/README.md:56`, and older docs still frame the product mostly as install/reconfigure/dry-run and still discuss removed `init` or `update` paths rejected by `packages/cli/src/cli.ts:589-612`.

**Why it matters**: Operator docs and design lineage can point people toward commands the parser no longer accepts.

**Recommendation**: Bring public docs and package README command examples in line with the no-command install flow and explicit lifecycle commands.

**To close**: Public command docs only describe accepted command paths or clearly label archived command history as historical.

### D-003 Template and Reference Mode Labels Promise More Than the Selector Enforces

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md), which makes prompt/template/reference controls invariant managed assets. | Verify whether the W14 asset-selection simplification fully removed or reworded the public mode surface. |

**Issue**: The wizard exposed `templatesMode` and `referencesMode` choices in `packages/cli/src/wizard.ts:354-889`, but `packages/cli/src/rules.ts:130-194` ignored `templatesMode` and used `referencesMode` only to optionally add `docs/assets/references/harness-capability-matrix.md`.

**Why it matters**: The user-visible control surface was broader than the live implementation.

**Recommendation**: Treat the W14 asset-selection simplification as the likely resolution path, then remove this item or mark it closed only after the current code/docs confirm the mismatch no longer exists.

**To close**: Current wizard, manifest, rules, README, and tests agree on asset-selection behavior.

### D-004 ResolvedAsset Asset Class May Still Be Wider Than the Catalog

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide whether `static` is future surface or dead type surface. |

**Issue**: `packages/cli/src/types.ts:75-80` allows `"static"`, but `packages/cli/src/catalog.ts:7-20` currently emits `scoped-static` for scaffold assets.

**Why it matters**: Type-level contracts no longer cleanly describe actual asset generation behavior.

**Recommendation**: Shrink the union unless a concrete upcoming feature needs a third live value.

**To close**: The type union, catalog output, and tests agree on every live asset class.

### D-005 Skills Delivery Diverges From Earlier Bundled-Payload Expectations

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Selected-skill category behavior is superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md), package ownership is narrowed by [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md), skills are explicitly outside the system asset modes in [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), and [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) permits preserving selected skills during migration only when manifest/file evidence is trustworthy; the skills delivery model decision remains open. | Decide and document the long-term skills delivery contract. |

**Issue**: Runtime behavior comes from `packages/cli/src/skill-registry.ts:25-134` and `packages/cli/src/skill-resolver.ts:40-226`, which load a packaged registry and fetch skill payloads remotely; earlier design material such as `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md` described bundling skill payloads into the CLI package.

**Why it matters**: Packaging, offline behavior, release validation, and security expectations depend on which model is actually intended.

**Recommendation**: Choose remote-fetch, bundled-local, or dual-mode fallback as the explicit product contract and align release validation around it.

**To close**: Registry, resolver, package metadata, release docs, and tests all reflect the selected model.

### D-006 Packaged README and Maintainer README Do Not Match the Current Tarball Allowlist

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) makes `packages/cli/package.json`, packed package behavior, and smoke-pack validation authoritative for the npm package boundary; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) keeps full-snapshot package validation as the default system asset proof; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) adds migration/classification docs to the package-facing safety surface; [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) makes generated `packages/cli/template/` and source-of-truth wording part of the package surface. README wording still needs implementation cleanup. | Align package-surface docs with dry-run pack output and the accepted npm/Rust deployment, system asset materialization, compatibility migration, and template/package source-of-truth boundaries. |

**Issue**: `packages/cli/package.json:9-15` ships `dist`, `template`, registry files, and `README.md`, but `packages/cli/src/README.md:181-204` and `packages/cli/README.md:91-120` still describe tarball-root `docs/`, `AGENTS.md`, and `CLAUDE.md`.

**Why it matters**: Maintainers and consumers can reason about the wrong package contents.

**Recommendation**: Treat `packages/cli/package.json` and pack/smoke behavior as authoritative, then revise README package-surface guidance.

**To close**: `npm pack --dry-run` output and README package-surface descriptions agree.

### D-007 Dogfood Re-Seeding Remains Manual Without a Freshness Proof

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Manual re-seeding remains intentional for now; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) requires existing dogfood/template installs to be classified by ownership evidence rather than path alone; [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) requires targeted parity checks for files expected to match exactly; [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) may use dogfood freshness as scenario evidence without replacing parity checks; [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) adds `.make-docs/**` tool resources to future dogfood proof; [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) adds reader-facing guide/playbook parity and archive-migration proof. | Add or improve parity, migration-classifier, conformance scenario, tool-directory, reader-facing asset, and archive checks that prove dogfood freshness without removing reviewability. |

**Issue**: `packages/docs/README.md:86-121` makes manual re-seeding an intentional maintainer workflow, but no automated check proves repo-root `docs/assets/**` still matches `packages/docs/template/docs/assets/**` after template edits.

**Why it matters**: The dogfood surface can drift silently between template changes and re-seed passes.

**Recommendation**: Keep manual propagation, but add focused parity tests for contract files that should remain identical.

**To close**: A focused check catches stale dogfood template/reference copies after package-template edits.

### D-008 Historical Hidden-Dot Paths Remain Easy to Mistake for Current Routing

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) makes `.make-docs/**` the explicit tool directory and keeps historical `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json` paths non-current. | Add clearer historical disclaimers or repair active links that imply hidden-dot paths are live. |

**Issue**: Current state lives under `docs/assets/**` and root `.make-docs/**` per `README.md:16-46` and `packages/cli/src/manifest.ts:18-20`, yet migration docs still refer to `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json`.

**Why it matters**: Contributors can accidentally treat migration history as live contract.

**Recommendation**: Ensure active docs consistently point at `docs/assets/**` and archived docs are clearly historical when linked.

**To close**: Active docs no longer imply hidden-dot paths are current; historical links remain only as lineage.

### D-009 Future packages/content Boundary Is Undefined

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Deferred | `packages/content/` is reserved but not active product surface. | Define the package/content contract before adding rendered content fragments. |

**Issue**: `README.md:10-17` reserves `packages/content/`, but there is no selector in `packages/cli/src/catalog.ts:64-85` and no command/help surface in `packages/cli/src/cli.ts:894-1019`.

**Why it matters**: Future content fragments still have no shipping or ownership contract.

**Recommendation**: Leave the package reserved until a specific content-fragment design exists.

**To close**: A future design or PRD defines ownership, packaging, rendering, and dogfood rules for `packages/content/`.

### D-010 Skills Authoring and Release Guidance Is Thin Relative to Runtime Dependence

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | `packages/skills/README.md` now documents the skill authoring, registry, mirror, and validation flow. | No further package-level authoring guidance follow-up is required for this gap. |

**Issue**: `packages/skills/README.md` is minimal, while the runtime depends on the structure of `packages/skills/archive-docs/`, `packages/skills/decompose-codebase/`, `packages/skills/closeout-commit/`, and `packages/skills/closeout-phase/` via `packages/cli/skill-registry.json`, `packages/cli/src/skill-catalog.ts:90-138`, and `packages/cli/src/skill-resolver.ts:40-226`.

**Why it matters**: Adding or changing a skill still relies too much on tribal knowledge across registry, assets, and packaging steps.

**Recommendation**: Add a maintainer guide or package README section that describes source-of-truth files, registry updates, mirrors, and validation.

**To close**: New skill authors can follow one repo-native guide from package files through registry, tests, dogfood mirrors, and release checks.

**Resolution**: Closed by the `packages/skills/README.md` authoring flow added with the `work-on-phase` skill. The README now names the package source tree, `agents/openai.yaml`, `references/`, `scripts/`, `packages/cli/skill-registry.json`, `.agents` and `.claude` dogfood mirrors, focused CLI tests, build, and pack smoke checks.

### D-011 PRD 05 Still Carries the Pre-W14 R2 Conflict Model

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | PRD 05 now carries the W14 R2 managed-file conflict lifecycle annotation. | No further PRD 05 conflict-model follow-up is required for W14 R2 P5. |

**Issue**: `docs/prd/05-installation-profile-and-manifest-lifecycle.md` described the pre-W14 R2 conflict model after [13-revise-cli-conflict-resolution.md](./13-revise-cli-conflict-resolution.md) superseded instruction-specific review with batch-first overwrite/skip review for divergent selected managed files.

**Why it matters**: PRD 05 remains important lifecycle context, so stale planner/apply language could make manifest hash mismatches look like proof of local modification or imply that unresolved selected diffs can still apply.

**Recommendation**: Keep PRD 05 aligned with the shipped P5 behavior: manifest hash mismatch is only review evidence, selected desired diffs require explicit resolution, and non-interactive runs fail when reviewable diffs are unresolved.

**To close**: Closed by the W14 R2 P5 PRD reconciliation updates to PRD 05 and PRD 13.

**Resolution**: PRD 05 now records the selected managed-file review boundary and PRD 13 now covers prompts, desired skill assets, and generic selected managed files in addition to instructions, references, and templates.

### D-012 Authoritative Layer Encodes Structure but Not Lifecycle Ordering

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Addressed by the W16 R0 lifecycle anchor and stage follow-on handoffs. | Land the anchor and handoffs, then re-evaluate. |

**Issue**: Routers and contracts encode where artifacts live but not the order stages run. The design → plan → PRD → work → implement sequence is stated only in `docs/assets/prompts/` starters, which `docs/assets/prompts/AGENTS.md` marks as non-authoritative, so an agent can land on a plan and jump straight to implementing.

**Why it matters**: Agents silently skip PRD and work-backlog generation, breaking the documentation-first pipeline make-docs exists to enforce.

**Recommendation**: Add an always-read lifecycle anchor (default ordering, "implementation derives from a work backlog," surface-departures-not-silent) plus per-stage `## Intended Follow-On` handoffs.

**To close**: The anchor and handoffs ship and an agent reading any stage output is nudged to the next stage without a hard gate.

### D-013 W16 Design Docs Trail the Re-Scoped Plan

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Reconciliation notes added to both designs; a fuller Sense-B playbook design is still pending. | Author the persona-scoped playbook design; verify the coverage-pass design matches the deferred skill scope. |

**Issue**: The lifecycle-playbook design still frames a playbook as a single operating manual rather than a persona-scoped output type, and the coverage-pass design lists the four-skill refactor as active rather than deferred.

**Why it matters**: Design docs carry rationale; if they contradict the active plan, contributors inherit the wrong intent.

**Recommendation**: Keep the dated reconciliation notes and produce the persona-scoped playbook design as part of the playbook work.

**To close**: Both designs agree with the current plan and the persona-scoped playbook framing.

### D-014 W16 R0 Product Assets Authored in the Dogfood Instead of the Template Source

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | W16 R0 product assets were authored in repo-root dogfood `docs/` instead of `packages/docs/template/docs/`; resolved by reverse-seeding the template from the dogfood and restoring parity. [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) makes the template-first correction an active v2 requirement, PRD 21 applies the same source-of-truth rule to future `.make-docs/**` tool resources, and PRD 22 applies it to future shipped reader-facing guide/playbook defaults. | Sync `.make-docs/manifest.json` via reconfigure to track the newly managed template assets and preserve template-first authoring for future reader-facing assets. |

**Issue**: The W16 R0 plan and work backlog specified building product assets (the coverage-pass contract, `lifecycle.md`, router/contract/template edits, starter prompts, and the artifacts router) directly in repo-root `docs/`. The implementing agent followed those paths, so the source-of-truth template `packages/docs/template/docs/**` was left missing assets that existed only in the dogfood — the dogfood/template parity gap D-007 warns about.

**Why it matters**: `packages/docs/template/docs/**` is what ships to consuming projects. Product assets that exist only in the dogfood are not shipped, and the two layers silently diverge.

**Recommendation**: Author product assets in the template first, then re-seed to the dogfood. Keep repo-root `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, and make-docs's own content (the lifecycle playbook, `docs/artifacts/` content, guides) dogfood-only.

**To close**: Template and dogfood agree on the W16 product assets, and the plan and work-backlog specs reflect the template-first flow.

**Resolution**: The W16 product assets were reverse-seeded from the dogfood into `packages/docs/template/docs/**` (the contract, `lifecycle.md`, the references and templates edits, the root routers, and the artifacts routers); `diff -rq` confirms parity, with only make-docs's own history, archive, guide, playbook, and artifact content remaining dogfood-only. The W16 R0 plan and work-backlog index now state the template-first authoring and re-seed flow.

## Open Questions

### Q-001 What Is the Long-Term Skills Delivery Contract?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Selected-skill UX and the `selectedSkills` manifest requirement are superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md); [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) preserves no-default-skills and TypeScript npm ownership; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) clarifies that skills are not system assets; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) prevents migration from silently expanding `selectedSkills` or installing skills by default. It still does not choose remote skill delivery. | Choose remote-fetch, bundled-local, or dual-mode fallback for skills. |

**Question**: What is the intended long-term skills delivery contract: remote-fetch, bundled-local, or dual-mode fallback?

**Why it matters**: Current runtime is remote-fetch (`packages/cli/src/skill-registry.ts:134`, `packages/cli/src/skill-resolver.ts:6-226`), while prior design work expected bundled payloads. Release policy, offline behavior, integrity checks, and smoke-pack acceptance all depend on this decision.

**Recommendation**: Make one delivery mode authoritative before public release hardening.

**To close**: The chosen delivery model is reflected in resolver behavior, package metadata, release docs, and tests.

### Q-002 Should Template and Reference Modes Remain Public Options?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md), which controls whether template and reference modes remain public options. | Verify current code and docs after the W14 simplification. |

**Question**: Should `templatesMode` and `referencesMode` remain public options, and if so what should `required` vs `all` actually mean?

**Why it matters**: The option surfaces existed in `packages/cli/src/wizard.ts:354-889`, but selector behavior was narrow in `packages/cli/src/rules.ts:130-194`. The current UI may be broader than the live rule set, but removing the knobs also changes the public contract.

**Recommendation**: Use the W14 asset-selection simplification as the controlling decision and close this only after the current code confirms the removed or invariant behavior.

**To close**: Current wizard, manifest, rules, docs, and tests agree on asset and reference selection.

### Q-003 Should ResolvedAsset Keep a Third Asset Class?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide whether `static` should be removed or implemented. |

**Question**: Does `ResolvedAsset.assetClass` need a third live value, or should the type shrink to two?

**Why it matters**: `packages/cli/src/types.ts:75-80` and `packages/cli/src/catalog.ts:7-20` disagree today. This is either an unfinished feature hook or dead type surface.

**Recommendation**: Shrink to live values unless a near-term feature needs `static`.

**To close**: Type declarations, catalog behavior, and tests agree.

### Q-004 How Should packages/content Participate in the Product?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Deferred | Reserved for future content-fragment work. | Draft a future design before making `packages/content/` active. |

**Question**: How should `packages/content` participate in the product?

**Why it matters**: `README.md:10-17` reserves the workspace, but there is no runtime integration point in `packages/cli/src/catalog.ts:64-85` or `scripts/smoke-pack.mjs:60-246`. Without an explicit answer, later content work will invent its own packaging and dogfood rules.

**Recommendation**: Keep it reserved and inactive until a specific feature requires it.

**To close**: A future design defines content ownership, package inclusion, rendering, dogfood, and release checks.

### Q-005 How Should Maintainers Prove Dogfood Freshness?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Manual re-seeding remains intentional for now; compatibility migration must classify repo-root dogfood and template state conservatively when ownership is not trustworthy; PRD 19 requires reviewed reseeding plus targeted dogfood/template parity checks; PRD 22 extends the proof surface to reader-facing guide/playbook defaults and archive migration. | Add contract-level parity checks for dogfood/template drift, reader-facing guide/playbook parity, archive migration, and migration classifier coverage. |

**Question**: How should maintainers prove dogfood freshness if manual re-seeding remains the chosen workflow?

**Why it matters**: `packages/docs/README.md:86-121` values reviewability and selective propagation, but current checks such as `scripts/check-instruction-routers.sh:1-58` do not prove template parity. The repo needs a deliberate stance on reviewability versus automated freshness.

**Recommendation**: Preserve manual review while expanding consistency tests for files that are expected to match exactly.

**To close**: CI or focused local tests fail when dogfood contract files drift from the package template unexpectedly.

### Q-006 What Defines Public Release Readiness?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | First public release readiness uses scoped package `@brucewaynedecoy/make-docs`, Apache-2.0 licensing, repository metadata, version `1.0.0-rc.1`, and the `next` dist-tag. | Publish the scoped rc with `npm publish --access public --tag next -w packages/cli`. |

**Question**: What minimum metadata and legal prerequisites define public release ready for `make-docs`?

**Why it matters**: Public release readiness depends on legal posture, npm package identity, package metadata, and a first-release tag strategy agreeing with the publishable tarball.

**Recommendation**: Publish the first public release under the scoped package name with `--access public --tag next`, then verify `npx @brucewaynedecoy/make-docs@next` from a clean directory.

**To close**: Closed by scoped package metadata, Apache-2.0 license files, repository metadata, version `1.0.0-rc.1`, and `next` release commands.

**Resolution**: The unscoped `make-docs` publish was blocked by npm's similarity guard against existing package names. The first public release path is now the scoped package `@brucewaynedecoy/make-docs`, with the installed `make-docs` binary preserved.

### Q-007 How Should Remote Skill Sources Be Constrained?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) resolves selected-skill UX, [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) constrains command/deployment ownership, [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) defers remote system asset providers until protocol, pinning, caching, trust, and confirmation policy are resolved, [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) requires provider/cache evidence before provider-backed or hybrid installs classify as clean, [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) treats provider-routed model results as evidence for that tuple only, and PRD 21 reserves `.make-docs/agentics/` without deciding remote delivery. Remote skill source policy remains unresolved. | Define source protocol, pinning, and integrity policy for remote skills and any future remote system asset provider. |

**Question**: How should remote skill sources be constrained?

**Why it matters**: `packages/cli/src/skill-registry.ts:134` accepts `http://`, `https://`, `github:`, and `url:`, while `packages/cli/src/skill-resolver.ts:6` defaults GitHub sources to `main` and `packages/cli/src/skill-resolver.ts:226` performs unauthenticated fetches. Mutable refs and permissive protocols have security and reproducibility implications.

**Recommendation**: Define a constrained source policy before public release or before relying on remote skills for high-trust workflows.

**To close**: Registry schema, resolver validation, docs, and tests enforce the chosen policy.

### Q-008 What Is the Package and Directory Rename Target?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) fixes the v2 identity as `make-docs`, `Make Docs`, and `MakeDocs`; no broad rename or default command aliases are active. | None. |

**Question**: What does make-docs rename to, and what do its installed directories (currently `.make-docs/`) rename to?

**Why it matters**: The name appears in the package, CLI, directories, contracts, and generated docs; the rename touches all of them and any docs authored now carry the old name.

**Recommendation**: Keep the stable v2 identity in new docs and implementation work; do not plan broad rename or default alias work unless a later accepted design reopens it.

**To close**: Closed by `docs/prd/16-revise-package-and-deployment-boundaries.md`.

**Resolution**: The package/command identifier remains `make-docs`, the prose display name is `Make Docs`, and `MakeDocs` is reserved for compact contexts. `.make-docs/` remains the installed-project state directory unless a later package-ownership design changes it.

### Q-009 What Is the Persona Model Schema?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) defines primitives `agent`, `maintainer`, and `user`; default personas `agent`, `developer`, and `user`; and custom persona fields `slug`, `label`, `description`, and `primitive`. PRD 20 may record persona-sensitive scenarios later, but it does not redefine the schema. | Implement the schema in configuration/defaults and validation fixtures without renaming PRD 22's canonical fields. |

**Question**: What are the exact persona primitives, default personas, and configuration fields?

**Why it matters**: The coverage-pass contract's persona-target axis and the persona-scoped guide and playbook directories depend on a stable schema.

**Recommendation**: Confirm the schema; until then the contract describes the persona set abstractly with a legacy Developer/User mapping.

**To close**: Closed by PRD 22; implementation must still add configuration/defaults and validation fixtures.

### Q-010 Where Do Starter Prompts Live After the Restructure?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide the post-restructure home for reusable starter prompts. |

**Question**: After the planned move of `docs/assets/**` into the in-project tool directory, where do reusable starter prompts live?

**Why it matters**: The planned restructure tree has no prompts directory under either the tool directory or `docs/`, yet W16 ships starter prompts.

**Recommendation**: Settle the prompts home before executing the restructure, not before authoring the prompts.

**To close**: The restructure defines a prompts location and the prompts move there.

### Q-011 Should Coordinate and Prefix Conventions Be Configurable?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Configurability intended; mechanism unresolved. PRD 23 allows generated metadata to record known coordinates and lifecycle vocabulary, but it does not make coordinate or prefix conventions configurable. | Decide where convention mappings live and the prefix options. |

**Question**: Should teams redefine structural vocabulary (designs/plans/prd/work), coordinates (wave/revision/phase), and file-prefix style (slug-date vs version-number), and where is that controlled?

**Why it matters**: All logic and agent instructions that map to directories and coordinates would need to read the mapping instead of hard-coded conventions.

**Recommendation**: Treat the overlay as presentation only — rename presented vocabulary, never paths, frontmatter, skill names, or contract names.

**To close**: A configuration mechanism defines convention mappings and the prefix-style choice.

### Q-012 How Do Plugins and Skills Share an Install and Respect Config Mapping?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) assigns long-term MCP startup ownership to Rust and preserves one `make-docs` command; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) requires future Rust/plugin install paths to preserve compatibility classification and migration dispositions; [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) can test shared-install behavior only after the product contract exists; PRD 21 reserves `.make-docs/agentics/skills` and `.make-docs/agentics/plugins` for that future decision. Shared skill/plugin install and config-aware routing remain unresolved. | Define a cross-platform redirection model and how plugins read config relabels. |

**Question**: How are skills and plugins installed once and exposed to each harness without duplication, and how does a plugin that guides (for example) requirements → design → plan respect a config that relabels "designs" to "ideas"?

**Why it matters**: Skills are duplicated across agent directories today; plugins will face the same problem and must honor the customization mapping.

**Recommendation**: Evaluate filesystem redirection (symlinks, Linux/Mac/Windows) versus CLI routing that returns the mapped contracts, instructions, and paths.

**To close**: A cross-platform shared-install and config-aware routing model is defined.

### Q-013 What Are the Plugin Flow and Exposure Boundaries?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | PRD 20 treats plugin and playbook scenarios as future conformance inputs only after shared agentics install, plugin substrate, and Run Playbook decisions land. | Resolve request-vs-change, docs visibility, scaffold exposure, and which plugin claims require conformance evidence. |

**Question**: Is "file a request" a separate flow from "make a change"? Are generated docs shown, hidden, or toggle-able for non-technical users? Is the scaffold/build entry point user-facing or maintainer-only?

**Why it matters**: Plugins are the sanctioned entry point for non-maintainers; these boundaries decide the guardrails against doc-set corruption.

**Recommendation**: Decide per plugin before building the plugin bundles.

**To close**: Each plugin's flow and exposure are specified.

### Q-014 Does the `docs/library/` Move Land in W16 or the Broader Restructure?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | Create only `docs/library/playbooks/` in W16; defer any `docs/guides/` move to the broader restructure. PRD 22 keeps the W16 decision historically valid while making `docs/library/playbooks/**` transitional and `docs/assets/playbooks/**` the v2 canonical target. | Track guide and playbook relocation in the broader restructure; do not retroactively treat W16 R0 as the final path model. |

**Question**: W16 authors a playbook under `docs/library/playbooks/`, but moving `docs/guides/` to `docs/library/guides/` is part of the broader restructure.

**Why it matters**: Creating the playbook home early without the guides move leaves a partial `docs/library/` layout.

**Recommendation**: Either create only the playbook subtree now and move guides later, or sequence both with the restructure.

**Resolution (2026-06-17)**: W16 R0 creates the playbook subtree only. The broader `docs/library/guides/` move remains out of scope for W16 R0.

**To close**: Closed on 2026-06-17 by the W16 R0 Phase 03 lifecycle playbook decision.

## Rebuild Risks

### R-001 Home-Scoped Skills Are Easy to Drop From a Clean-Room Rebuild

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Home-scoped skill ownership remains active product behavior; old `optionalSkills` and required/default skill assumptions are superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md). | Preserve home-scope backup, audit, and manifest handling in any rebuild. |

**Issue**: A rebuild that assumes all managed files live under the target repo will break global skill installs, backup mapping, and uninstall safety.

**Why it matters**: Home-scoped paths are encoded in `packages/cli/src/skill-catalog.ts:33-46`, `packages/cli/src/manifest.ts:135-183`, `packages/cli/src/audit.ts:745-796`, and `packages/cli/src/backup.ts:252-300`.

**Recommendation**: Treat home-scope skill management as first-class lifecycle behavior, not an incidental install detail.

**To close**: Any rebuild plan explicitly covers project-scope and home-scope managed skill paths.

### R-002 Audit Removability Depends on Regenerated Canonical Skill Content

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Current safety model depends on regeneration. | Revisit if skill delivery or content resolution changes. |

**Issue**: If skills delivery, registry, or content resolution changes without a matching audit update, uninstall and backup can become too conservative or too destructive.

**Why it matters**: The current model is anchored in `packages/cli/src/planner.ts:393-408`, `packages/cli/src/install.ts:96-163`, and `packages/cli/src/audit.ts:745-793`.

**Recommendation**: Keep audit, backup, install, and skill resolution changes coupled in the same implementation plan.

**To close**: The audit model is documented and tested for the selected skill delivery contract.

### R-003 Dev-Template and Packed-Template Resolution Can Diverge

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Dual dev/packed resolution remains active; [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) adds the requirement that packed npm and future Rust artifacts preserve the same command and shared contract boundaries; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) keeps full-snapshot materialization as the default validation baseline; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) adds source-state/disposition fixtures to the release-sensitive validation matrix; [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) requires packed validation to exercise generated `packages/cli/template/` after copy/prepack; [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) may consume smoke-pack as scenario evidence but cannot replace it; PRD 21 adds future `.make-docs/**` tool-resource package proof; PRD 22 adds reader-facing guide/playbook package proof. | Preserve smoke-pack checks for template, package-boundary, system asset materialization, compatibility migration, package-template copy, conformance-lab, tool-directory, and reader-facing asset changes. |

**Issue**: Testing only local dev paths can miss failures that appear only after `prepack` copies the template into `packages/cli/template`.

**Why it matters**: Local resolution uses `packages/cli/src/utils.ts:33-55`, while packed artifacts depend on `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32`, and `scripts/smoke-pack.mjs:60-246`.

**Recommendation**: Run both focused dev-path tests and pack/smoke validation for release-sensitive template changes.

**To close**: Release validation proves both local and packed template resolution.

### R-004 Path Knowledge Is Duplicated Across Modules and Docs

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Literal path duplication remains accepted but risky; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) adds provider/cache provenance and asset identity as future duplication-sensitive surfaces, [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) makes fallback path recognition a mutation gate, [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) adds template/dogfood/package copy paths to the proof surface, PRD 20 adds conformance scenario/result paths that must stay out of shipped copies by default, PRD 21 adds `.make-docs/**` tool-resource paths, PRD 22 adds `docs/assets/guides/**`, `docs/assets/playbooks/**`, and `docs/archive/**`, and PRD 23 adds generated metadata field names, route identifiers, and body-rendered handoff sections as duplication-sensitive surfaces. | Add parity, provenance, classifier, package-template copy, conformance asset exclusion, tool-directory path, reader-facing asset path, generated metadata, and YAML/body handoff drift checks when moving, adding, or provider-resolving template-owned paths. |

**Issue**: Adding or moving a template-owned path can drift across `rules.ts`, `catalog.ts`, tests, package docs, and dogfood copies.

**Why it matters**: The duplication spans `packages/cli/src/rules.ts:8-194`, `packages/cli/src/catalog.ts:7-85`, `packages/cli/tests/consistency.test.ts:33-77`, and `packages/docs/README.md:86-121`.

**Recommendation**: Prefer focused consistency tests when a full centralization refactor is not in scope.

**To close**: Either path constants are centralized or tests cover every duplicated path surface that matters.

### R-005 The No-Command CLI Workflow Is Easy to Simplify Incorrectly

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | No-command install remains the public default. | Preserve parser rejection and help-output tests. |

**Issue**: Reintroducing `init`/`update`, collapsing wizard review with generic apply confirmation, or treating lifecycle commands as install flags would break the shipped public UX.

**Why it matters**: This behavior is anchored in `packages/cli/src/cli.ts:119-244`, `packages/cli/src/cli.ts:589-612`, `packages/cli/src/wizard.ts:487-550`, `packages/cli/src/backup.ts:86-127`, and `packages/cli/src/uninstall.ts:63-116`.

**Recommendation**: Keep install/reconfigure flow, lifecycle commands, and parser rejection behavior covered by focused CLI tests.

**To close**: Public help, parser behavior, docs, and tests all describe the same command model.

### R-006 Backup and Uninstall Depend on a Single Reviewed Audit Snapshot

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Single reviewed audit snapshot remains the shared safety model for the TypeScript CLI, any future Rust implementation, any on-demand materialization path introduced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), the `backup-and-reinstall` disposition defined by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md), and future `.make-docs/**` tool-resource migration in PRD 21. PRD 20 may test this as a scenario but cannot loosen it. | Keep backup/uninstall implementation, provider-backed writes, migration backup-and-reinstall, conformance scenarios, tool-directory migration, and docs aligned around one reviewed audit/classification snapshot. |

**Issue**: Re-auditing between warning, backup, and delete steps can invalidate what the user already approved and break the current safety model.

**Why it matters**: The behavior depends on `packages/cli/src/backup.ts:86-127`, `packages/cli/src/uninstall.ts:81-116`, and `packages/cli/src/audit.ts:41-79`.

**Recommendation**: Treat any re-audit refactor as a lifecycle-safety change requiring explicit design and tests.

**To close**: Backup and uninstall docs/tests continue to show one reviewed audit snapshot driving subsequent actions.

### R-007 Manual Dogfood Re-Seeding Can Hide Product Drift

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Manual re-seeding remains intentional for reviewability; full-snapshot materialization remains the package validation baseline under [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md); [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) makes dogfood/template ownership evidence part of migration safety; [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) makes reviewed reseeding and targeted parity proof mandatory; PRD 20 can cite reviewed parity results as lab evidence only when scenario records exist; PRD 21 adds future `.make-docs/**` tool-resource parity; PRD 22 adds reader-facing guide/playbook parity. | Add proof points for dogfood/template freshness, full-snapshot package parity, package-template copy parity, classifier behavior, conformance result records, tool-directory parity, and reader-facing asset parity. |

**Issue**: Because repo-root `docs/` is both a maintainer workspace and a product rehearsal surface, stale dogfood files can make local behavior look correct while the shipped template has drifted.

**Why it matters**: Dogfood and template behavior are described in `README.md:6-46`, `packages/docs/README.md:50-121`, and `packages/cli/src/utils.ts:33-55`.

**Recommendation**: Preserve manual review but add tests that catch contract drift between template and dogfood copies.

**To close**: Template contract changes cannot pass focused tests while dogfood copies are stale.

### R-008 Deferring the Skill Refactor Prolongs Reliance on Script-Gated Skills

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Skill refactor deferred to the no-scripts / CLI-migration wave. | Ship the W16 starter prompts as the interim path; revisit if that wave slips. |

**Issue**: The closeout and work skills keep their current script-gated behavior until the no-scripts wave rewrites them to cite the coverage-pass contract.

**Why it matters**: Users stay on the less-effective skills longer than the contract alone would require.

**Recommendation**: Use the contract-citing starter prompts as the interim chain; sequence the skill refactor with the no-scripts migration so the skills change once.

**To close**: The four skills cite the contract, carry no standalone script references, and pass parity across install locations.

### R-009 The Lifecycle Anchor Could Drift Toward a Hard Gate

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Anchor is advisory: default the arc and surface departures, never forbid them. | Keep the straddle wording and non-goals when editing the anchor. |

**Issue**: An always-read ordering reference can creep into a "never skip stages" rule.

**Why it matters**: A hard gate would make make-docs prescriptive and break non-linear real workflows — the corner make-docs exists to avoid.

**Recommendation**: Keep the nudge as "default to the arc and surface any departure," not enforcement.

**To close**: The anchor contains no hard-gate language and still nudges effectively.

### R-010 make-docs Vocabulary Could Re-Introduce a Software Bias

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Stage vocabulary is domain-neutral (e.g., "release / publish," not "launch / deploy"). | Audit anchor, playbook, and contract text for software-specific terms. |

**Issue**: Terms like "launch" or "deploy" steer agents toward assuming a technical deployment outcome.

**Why it matters**: make-docs serves non-software documentation work; biased vocabulary narrows its use.

**Recommendation**: Define release-style stages as "make the work available to its audience" and keep all stage vocabulary neutral.

**To close**: Lifecycle and contract docs use domain-neutral vocabulary throughout.

### R-011 The Persona-Target Axis References a Future Configuration

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | PRD 22 defines the persona schema, default personas, and primitive mapping, so the remaining risk is implementation/configuration drift rather than an undefined schema. PRD 23 consumes `persona` as the generated-doc frontmatter field for persona-scoped guides and playbooks. | Replace legacy mapping with the configured persona set when personas land and add validation fixtures for default/custom personas, invalid values, path/frontmatter drift, and generated `persona` frontmatter presence. |

**Issue**: The coverage-pass contract's persona-target axis points at a configuration file that does not yet exist.

**Why it matters**: A dangling reference could confuse agents before the persona system ships.

**Recommendation**: Describe the persona set abstractly and rely on the legacy mapping until configuration exists.

**To close**: The contract reads from the real persona configuration once available.

### R-012 Playbooks and Plugins Could Become Overlapping Deliverables

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Resolved by the content-vs-invocation boundary; PRD 22 defines playbooks as persona-scoped content under `docs/assets/playbooks/**`, and the Run-Playbook plugin is the future invocation seam. | Keep the boundary explicit when designing plugins and do not make storage under `docs/assets/playbooks/**` executable by itself. |

**Issue**: Both playbooks and plugins can look like "the thing that runs a workflow."

**Why it matters**: Without a boundary, the project risks building two systems that do the same job.

**Recommendation**: A playbook is a persona-scoped *process definition* (content); a plugin is an *invocation* (a slash command) wrapping a built-in workflow or the generic Run-Playbook executor.

**To close**: Plugin and playbook designs cite and respect the boundary.

### R-013 The Restructure and Rename Will Relocate Newly Authored Assets

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Authored now at current paths; PRD 22 defines concrete target mappings for guide/playbook/archive assets: `docs/guides/**` to `docs/assets/guides/**`, `docs/library/playbooks/**` to `docs/assets/playbooks/**`, and `docs/assets/archive/**` to `docs/archive/**`. PRD 23 metadata backfill must avoid broad opportunistic rewrites during relocation and only add metadata to planned template/package/touched-file surfaces. | Record and execute migration mappings for the coverage contract, prompts, guides, playbooks, archive, history follow-on, and metadata backfill without breaking links. |

**Issue**: Assets authored in W16 (the coverage-pass contract, starter prompts, library playbook) will move when `docs/assets/**` migrates into the renamed tool directory.

**Why it matters**: Links and references authored now can break on the restructure if mappings are not tracked.

**Recommendation**: Author at current paths, record each item's target location, and treat relocation as one sweep during the restructure.

**To close**: Migration mappings exist and the restructure relocates the assets without broken links.

### R-014 The No-Scripts Migration Has a Transitional Break Window

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Move deterministic logic into the CLI without stranding skills between TypeScript, future Rust ownership, the provider/cache surfaces introduced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), the migration classifier required by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md), lab scenarios introduced by [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md), future `.make-docs/scripts/{system,custom}` tiers introduced by PRD 21, and generated metadata validation introduced by PRD 23; sequence the skill refactor into the same wave. | Avoid rewriting skills, scripts, conformance scenarios, or metadata validation to cite the contract before the CLI provides their logic and before system assets, migration classification, and YAML/body drift checks remain locally recoverable without script helpers. |

**Issue**: Moving all script logic into the CLI while skills still reference standalone scripts creates a window where skills could break.

**Why it matters**: Skills depend on standalone scripts today; removing them without the CLI replacement in place breaks closeout and work flows.

**Recommendation**: Land the CLI logic and the contract-citing skill rewrite together in the no-scripts wave.

**To close**: Skills source their deterministic logic from the CLI with no standalone script dependencies.

## Source Anchors

- `README.md:6-46`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/16-revise-package-and-deployment-boundaries.md`
- `docs/prd/17-revise-system-asset-materialization-contract.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/20-revise-agent-harness-model-conformance-lab.md`
- `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`
- `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`
- `docs/prd/23-revise-generated-metadata-lifecycle-handoffs.md`
- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-19-system-asset-delivery-and-materialization-contract.md`
- `docs/designs/2026-06-19-compatibility-audit-and-migration-disposition.md`
- `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`
- `docs/designs/2026-06-19-agent-harness-and-model-conformance-lab.md`
- `docs/designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md`
- `docs/designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md`
- `docs/designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md`
- `docs/plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md`
- `docs/plans/2026-06-23-w10-r2-system-asset-materialization-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/00-overview.md`
- `docs/plans/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/00-overview.md`
- `docs/plans/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md`
- `docs/plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md`
- `docs/plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md`
- `packages/docs/README.md:50-121`
- `packages/skills/README.md`
- `packages/cli/package.json:9-25`
- `packages/cli/src/cli.ts:77-244`
- `packages/cli/src/rules.ts:130-194`
- `packages/cli/src/catalog.ts:64-85`
- `packages/cli/src/skill-registry.ts:25-134`
- `packages/cli/src/skill-resolver.ts:40-226`
- `packages/cli/src/manifest.ts:18-245`
- `packages/cli/src/audit.ts:41-940`
- `scripts/copy-template-to-cli.mjs:24-32`
- `scripts/smoke-pack.mjs:60-246`
- `docs/assets/references/output-contract.md`
