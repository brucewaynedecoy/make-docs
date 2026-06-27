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
| Open | [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) preserves the installer-first `npx` posture, meaningful no-command install/sync behavior, accepted lifecycle commands, and removed command rejections; public docs still need implementation cleanup. | Audit public command docs against the live parser, help output, and future runtime/version disclosure language. |

**Issue**: `packages/cli/src/cli.ts:894-1019` exposes `skills`, `backup`, and `uninstall`, while `README.md:73`, `packages/cli/README.md:56`, and older docs still frame the product mostly as install/reconfigure/dry-run and still discuss removed `init` or `update` paths rejected by `packages/cli/src/cli.ts:589-612`.

**Why it matters**: Operator docs and design lineage can point people toward commands the parser no longer accepts.

**Recommendation**: Bring public docs and package README command examples in line with the no-command install flow, explicit lifecycle commands, and CLI/MCP boundary wording.

**To close**: Public command docs only describe accepted command paths or clearly label archived command history as historical.

### D-003 Template and Reference Mode Labels Promise More Than the Selector Enforces

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md), which makes prompt/template/reference controls invariant managed assets. | Verify whether the W14 asset-selection simplification fully removed or reworded the public mode surface. |

**Issue**: The wizard exposed `templatesMode` and `referencesMode` choices in `packages/cli/src/wizard.ts:354-889`, but `packages/cli/src/rules.ts:130-194` ignored `templatesMode` and used `referencesMode` only to optionally add `.make-docs/references/system/harness-capability-matrix.md`.

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
| Open | Selected-skill category behavior is superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md), package ownership is narrowed by [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md), skills are explicitly outside the system asset modes in [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) permits preserving selected skills during migration only when manifest/file evidence is trustworthy, [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) requires deterministic first-party skill behavior to be available from the CLI package/shared-core boundary rather than only remote or skill-local script payloads, [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) defines purpose metadata and alternate-manifest source policy without choosing bundled-local versus remote-fetch delivery, [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) decides shared local placement and generated harness exposure without choosing bundled-local versus remote-fetch delivery, and [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) adds plugin source/provenance/trust metadata without choosing skills delivery; the skills delivery model decision remains open. | Decide and document the long-term skills delivery contract. |

**Issue**: Runtime behavior comes from `packages/cli/src/skill-registry.ts:25-134` and `packages/cli/src/skill-resolver.ts:40-226`, which load a packaged registry and fetch skill payloads remotely; earlier design material such as `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md` described bundling skill payloads into the CLI package.

**Why it matters**: Packaging, offline behavior, release validation, and security expectations depend on which model is actually intended.

**Recommendation**: Choose remote-fetch, bundled-local, or dual-mode fallback as the explicit product contract and align release validation around it.

**To close**: Registry, resolver, package metadata, release docs, and tests all reflect the selected model.

### D-006 Packaged README and Maintainer README Do Not Match the Current Tarball Allowlist

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | W10 R1 Phase 3 ran `npm pack --dry-run --json --ignore-scripts` against `packages/cli` on 2026-06-24 and verified the tarball-root boundary as `LICENSE`, `README.md`, `dist/`, `package.json`, `skill-registry.json`, `skill-registry.schema.json`, and `template/`; `README.md`, `packages/cli/README.md`, and `packages/cli/src/README.md` now describe that package boundary and exclude repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source workspaces, scripts, and scratch planning material. | Closed by W10 R1 Phase 3 dry-run pack evidence and package-surface README cleanup. |

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
| Open | [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) makes `.make-docs/**` the explicit tool directory and keeps historical `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json` paths non-current; [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) keeps future managed project documentation assets under `docs/assets/{archive,artifacts,library,playbooks}/` plus on-demand `docs/assets/archive/history/**` rather than treating all `docs/assets/**` content as tool resources. | Add clearer historical disclaimers or repair active links that imply hidden-dot paths, top-level artifact/archive roots, old guide/breadcrumb/history roots, or broad `docs/assets/**` tool-resource ownership are live. |

**Issue**: Current state is split between transitional docs asset copies and root `.make-docs/**` state per `README.md:16-46` and `packages/cli/src/manifest.ts:18-20`, while migration docs still refer to `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json`.

**Why it matters**: Contributors can accidentally treat migration history as live contract.

**Recommendation**: Ensure active docs consistently point tool resources at `.make-docs/**`, managed project documentation assets at `docs/assets/{archive,artifacts,library,playbooks}/` plus on-demand `docs/assets/archive/history/**`, and archived docs as clearly historical when linked.

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

**Issue**: Routers and contracts encode where artifacts live but not the order stages run. The design → plan → PRD → work → implement sequence is stated only in `.make-docs/references/system/prompts/` starters, which `.make-docs/references/system/prompts/AGENTS.md` marks as non-authoritative, so an agent can land on a plan and jump straight to implementing.

**Why it matters**: Agents silently skip PRD and work-backlog generation, breaking the documentation-first pipeline make-docs exists to enforce.

**Recommendation**: Add an always-read lifecycle anchor (default ordering, "implementation derives from a work backlog," surface-departures-not-silent) plus per-stage `## Intended Follow-On` handoffs.

**To close**: The anchor and handoffs ship and an agent reading any stage output is nudged to the next stage without a hard gate.

### D-013 W16 Design Docs Trail the Re-Scoped Plan

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md), [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md), and [31-revise-coverage-pass-extensions-adversarial-review.md](./31-revise-coverage-pass-extensions-adversarial-review.md) reconcile the drift: playbooks are persona-scoped content, deferred skills remain outside the base coverage-pass contract, and adversarial review is optional coverage-pass behavior rather than a mandatory gate or default shipped surface. | No design-doc drift follow-up remains; implement the selected backlogs and keep any future coverage-pass extension reconciled through PRD 31. |

**Issue**: The lifecycle-playbook design previously framed a playbook as a single operating manual rather than a persona-scoped output type, and the coverage-pass design listed the four-skill refactor as active rather than deferred.

**Why it matters**: Design docs carry rationale; if they contradict the active plan, contributors inherit the wrong intent.

**Recommendation**: Keep the dated reconciliation notes and use the accepted persona, playbook, and optional adversarial-review PRDs as the active authority for future implementation.

**To close**: Closed by PRD 22, PRD 29, and PRD 31.

### D-014 W16 R0 Product Assets Authored in the Dogfood Instead of the Template Source

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | W16 R0 product assets were authored in repo-root dogfood `docs/` instead of `packages/docs/template/docs/`; resolved by reverse-seeding the template from the dogfood and restoring parity. [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) makes the template-first correction an active v2 requirement, PRD 21 applies the same source-of-truth rule to future `.make-docs/**` tool resources, PRD 22 applies it to future shipped reader-facing guide/playbook defaults, PRD 24 applies it to any future default config template, and PRD 31 applies it to any future shipped adversarial-review prompt, reference, playbook, starter, plugin, CLI, MCP, or conformance asset. | Sync `.make-docs/manifest.json` via reconfigure to track the newly managed template assets and preserve template-first authoring for future reader-facing, default config, and adversarial-review assets. |

**Issue**: The W16 R0 plan and work backlog specified building product assets (the coverage-pass contract, `lifecycle.md`, router/contract/template edits, starter prompts, and the artifacts router) directly in repo-root `docs/`. The implementing agent followed those paths, so the source-of-truth template `packages/docs/template/docs/**` was left missing assets that existed only in the dogfood — the dogfood/template parity gap D-007 warns about.

**Why it matters**: `packages/docs/template/docs/**` is what ships to consuming projects. Product assets that exist only in the dogfood are not shipped, and the two layers silently diverge.

**Recommendation**: Author product assets in the template first, then re-seed to the dogfood. Keep repo-root `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, and make-docs's own content (the lifecycle playbook, migrated `docs/assets/artifacts/**` seed material, library docs, and archive history records) dogfood-only unless a later phase explicitly promotes template-owned bytes.

**To close**: Template and dogfood agree on the W16 product assets, and the plan and work-backlog specs reflect the template-first flow.

**Resolution**: The W16 product assets were reverse-seeded from the dogfood into `packages/docs/template/docs/**` (the contract, `lifecycle.md`, the references and templates edits, the root routers, and the artifacts routers); `diff -rq` confirms parity, with only make-docs's own history, archive, guide, playbook, and artifact content remaining dogfood-only. The W16 R0 plan and work-backlog index now state the template-first authoring and re-seed flow.

## Open Questions

### Q-001 What Is the Long-Term Skills Delivery Contract?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Selected-skill UX and the `selectedSkills` manifest requirement are superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md); [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) preserves no-default-skills and TypeScript npm ownership; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) clarifies that skills are not system assets; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) prevents migration from silently expanding `selectedSkills` or installing skills by default; [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) prevents deterministic first-party skill behavior from depending only on remote or skill-local script payloads; [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) adds purpose-led metadata and effective-manifest selection while preserving resolved `selectedSkills`, with W17 R1 validating bare no-skill installs, alternate local manifests, persisted provenance, and remote policy stops; [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) chooses shared local payload placement plus generated harness stubs for selected agentics; [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) keeps plugin selection explicit and separate from skill selection. It still does not choose remote skill delivery. | Choose remote-fetch, bundled-local, or dual-mode fallback for skills. |

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
| Open | [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) resolves selected-skill UX, [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) constrains command/deployment ownership, [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) defers remote system asset providers until protocol, pinning, caching, trust, and confirmation policy are resolved, [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) requires provider/cache evidence before provider-backed or hybrid installs classify as clean, [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) treats provider-routed model results as evidence for that tuple only, PRD 21 reserves `.make-docs/agentics/` without deciding remote delivery, [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) prevents remote skill sources from being the only executable source for deterministic first-party logic, [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) rejects unpinned remote alternate manifests and unpinned remote skill payloads before installation, [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) requires source provenance, digest/ref, and trust metadata in shared agentic ownership records, and [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) requires plugin source manifest, source ref or version, digest, provenance, and trust policy. Broader remote skill and plugin source policy remains unresolved. | Define source protocol, pinning, and integrity policy for remote skills, plugins, and any future remote system asset provider. |

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
| Closed | [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) defines primitives `agent`, `maintainer`, and `user`; default personas `agent`, `developer`, and `user`; and custom persona fields `slug`, `label`, `description`, and `primitive`. W9 R3 P3 implements those defaults and validation fixtures in the closeout guide coverage helper. PRD 24 confirms config may add or relabel personas but must preserve that schema and primitive set. PRD 31 confirms adversarial-review candidates use persona targets only when the challenge concerns persona-scoped content or audience-specific usability. PRD 20 may record persona-sensitive scenarios later, but it does not redefine the schema. | Integrate PRD 24 configuration overlays and include adversarial-review candidate fixtures for persona-targeted and `none` cases if that extension is implemented. |

**Question**: What are the exact persona primitives, default personas, and configuration fields?

**Why it matters**: The coverage-pass contract's persona-target axis and the persona-scoped guide and playbook directories depend on a stable schema.

**Recommendation**: Confirm the schema; until then the contract describes the persona set abstractly with a legacy Developer/User mapping.

**To close**: Closed by PRD 22 and W9 R3 P3 schema/default validation. Future configuration overlays and adversarial-review extensions remain separate follow-ons.

### Q-010 Where Do Starter Prompts Live After the Restructure?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide the post-restructure home for reusable starter prompts. |

**Question**: After PRD 21 moves reusable starter prompts out of reader-facing `docs/assets/**` and into the in-project tool directory model, where do reusable starter prompts live?

**Why it matters**: The planned restructure tree has no prompts directory under either the tool directory or `docs/`, yet W16 ships starter prompts.

**Recommendation**: Settle the prompts home before executing the restructure, not before authoring the prompts.

**To close**: The restructure defines a prompts location and the prompts move there.

### Q-011 Should Coordinate and Prefix Conventions Be Configurable?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [23-revise-generated-metadata-lifecycle-handoffs.md](./23-revise-generated-metadata-lifecycle-handoffs.md) settles that generated documents may carry canonical W/R/P `coordinate` metadata when lineage is known, and unknown coordinate levels are omitted rather than filled with placeholders. W16 R1 implements the generated-document metadata template surface, generator prompt requirements, package/dogfood parity checks, and CLI-owned metadata drift validation in `packages/cli/src/document-metadata.ts`. [24-revise-configuration-convention-overlay.md](./24-revise-configuration-convention-overlay.md) answers the structural side: configuration is presentation-only. Projects may relabel lifecycle/document/coordinate prose, but paths, metadata fields, route identifiers, prompt paths, skill names, contract names, and W/R/P lineage remain canonical. | Implement `.make-docs/config.yaml` schema, defaults, loader, diagnostics, generated-prose rendering tests, and configuration integration that proves display labels cannot structurally rename canonical coordinates or generated metadata fields. Keep metadata validators in CLI-owned code as downstream generated-document consumers expand. |

**Question**: Should teams redefine structural vocabulary (designs/plans/prd/work), coordinates (wave/revision/phase), and file-prefix style (slug-date vs version-number), and where is that controlled?

**Why it matters**: All logic and agent instructions that map to directories and coordinates would need to read the mapping instead of hard-coded conventions.

**Recommendation**: Treat the overlay as presentation only — rename presented vocabulary, never paths, frontmatter, skill names, or contract names.

**To close**: Closed for structural configurability by PRD 23 and PRD 24; W16 R1 closes the initial generated-document metadata validator. Implementation remains open for the config schema, loader, diagnostics, rendering tests, and downstream config-to-metadata integration.

### Q-012 How Do Plugins and Skills Share an Install and Respect Config Mapping?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) and [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) now assign v2 runtime and MCP ownership to the TypeScript package CLI; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) requires TypeScript CLI/MCP/plugin install paths to preserve compatibility classification and migration dispositions; [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) can test shared-install behavior only after the product contract exists; PRD 21 reserves `.make-docs/agentics/skills` and `.make-docs/agentics/plugins`; PRD 24 allows plugins and skills to display configured labels while routing through canonical identifiers; [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) provides the concrete script-to-operation sequence those future surfaces must reuse; [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) requires future surfaces to use canonical purpose ids and one effective skills manifest; [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) chooses generated text stubs over symlinks as the v2 cross-platform selected-agentics exposure direction; [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) specifies selected plugin payloads under `.make-docs/agentics/plugins/<plugin-id>/`, generated harness exposure files, explicit plugin selection, and config-after-canonical-resolution behavior. W17 R2 Phase 4 validates the selected-skill portion for project and global scopes through shared payloads, generated stubs, role-labeled dry-run/audit output, packed CLI smoke coverage, and preservation/review behavior for modified or custom harness files. The question remains open for selected plugin exposure, config-label rendering after canonical routing, richer structured ownership records, TypeScript operation-domain delegation, and CLI/MCP parity. | Implement and validate shared selected-agentics exposure for skills and plugins, structured ownership records, config-label rendering after canonical routing, TypeScript operation-domain delegation, and CLI/MCP parity. |

**Question**: How are skills and plugins installed once and exposed to each harness without duplication, and how does a plugin that guides (for example) requirements → design → plan respect a config that relabels "designs" to "ideas"?

**Why it matters**: Skills are duplicated across agent directories today; plugins will face the same problem and must honor the customization mapping.

**Recommendation**: Use the shared selected-agentics store plus generated harness exposure as the default cross-platform redirection model; treat symlinks as a later optional optimization only if manifest, audit, fallback, and platform behavior are specified.

**To close**: The shared-install and config-aware routing model is implemented and validated for selected skills and selected plugins.

### Q-013 What Are the Plugin Flow and Exposure Boundaries?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | PRD 20 treats plugin and playbook scenarios as conformance inputs after shared agentics install, plugin substrate, and Run Playbook decisions land. [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) provides purpose-led skill metadata that plugins may present later. [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) unblocks a shared payload/stub primitive for plugin storage and exposure. [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md) defines playbook validity and generic Run Playbook invocation. [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) defines plugin substrate, productized bundle families, bundle audience metadata, and the substrate-level non-maintainer guardrail, but leaves exact per-bundle UX unresolved. | Resolve request-vs-change, docs visibility, scaffold exposure, and implementation-specific support-claim evidence per bundle. |

**Question**: Is "file a request" a separate flow from "make a change"? Are generated docs shown, hidden, or toggle-able for non-technical users? Is the scaffold/build entry point user-facing or maintainer-only?

**Why it matters**: Plugins are the sanctioned entry point for non-maintainers; these boundaries decide the guardrails against doc-set corruption.

**Recommendation**: Decide per bundle before building public plugin entrypoints.

**To close**: Each plugin bundle's flow, audience, exposure boundary, gate behavior, support evidence, and docs visibility are specified and validated.

### Q-014 How Did the Transitional `docs/library/` Move Resolve?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | W16 created only `docs/library/playbooks/` as transitional dogfood. W9 R5 supersedes the later W9 R4 guide/breadcrumb decisions, migrates guide/persona docs into `docs/assets/library/**`, migrates transitional playbook material into `docs/assets/playbooks/**`, and removes `docs/library/**` as a shipped-current target. | Preserve W16 and W9 R4 references as historical evidence only; future work must use `docs/assets/library/**` and `docs/assets/playbooks/**`. |

**Question**: W16 authored a playbook under `docs/library/playbooks/`, while guide/persona docs and the broader v2 asset IA were still being settled.

**Why it matters**: Creating the playbook home early without the guide/library correction left a partial `docs/library/` layout that could be mistaken for the final v2 contract.

**Recommendation**: Treat `docs/library/**` as completed transitional evidence and route future persona documentation through `docs/assets/library/**` and `docs/assets/playbooks/**`.

**Resolution (2026-06-17)**: W16 R0 created the playbook subtree only. The broader move remained out of scope for W16 R0.

**Correction (2026-06-25)**: W9 R5 completed the corrective IA decision: `docs/assets/library/**` replaces guide/persona docs, `docs/assets/playbooks/**` remains the playbook home, and `docs/library/**` is removed from shipped-current use.

**To close**: Closed on 2026-06-17 by the W16 R0 Phase 03 lifecycle playbook decision.

## Rebuild Risks

### R-001 Home-Scoped Skills Are Easy to Drop From a Clean-Room Rebuild

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Home-scoped skill ownership remains active product behavior; old `optionalSkills` and required/default skill assumptions are superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md), [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) adds effective-manifest and selection-provenance context without changing project/global ownership, and [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) extends the project/global split to shared payloads and generated harness stubs. W17 R2 Phase 4 adds implementation evidence for project and home-scoped selected skills: shared payloads and generated stubs are installed, audited, backed up, uninstalled, and smoke-packed without repo-only or symlink assumptions. | Preserve home-scope backup, audit, manifest, shared-payload, generated-stub, and selection-provenance handling in any rebuild. |

**Issue**: A rebuild that assumes all managed files live under the target repo will break global skill installs, backup mapping, and uninstall safety.

**Why it matters**: Home-scoped paths are encoded in `packages/cli/src/skill-catalog.ts:33-46`, `packages/cli/src/manifest.ts:135-183`, `packages/cli/src/audit.ts:745-796`, and `packages/cli/src/backup.ts:252-300`.

**Recommendation**: Treat home-scope skill management as first-class lifecycle behavior, not an incidental install detail.

**To close**: Any rebuild plan explicitly covers project-scope and home-scope managed skill paths.

### R-002 Audit Removability Depends on Regenerated Canonical Skill Content

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Current safety model depends on regeneration; [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) adds managed old-script, managed wrapper, modified local file, and custom user script classification to the audit/removal boundary; [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) adds alternate-manifest provenance and W17 R1 Phase 4 now loads saved local-manifest registries when reviewing/removing alternate selected-skill files, but removability still requires canonical skill content; [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) adds canonical shared payload and generated-stub removability as first-class audit cases. W17 R2 Phase 4 adds tests for regenerated canonical content across shared payloads, generated stubs, and legacy duplicated payloads, including clean migration and preservation or review of modified/custom skill files. | Revisit if skill delivery, content resolution, script wrappers, alternate manifests, shared payloads, generated stubs, or CLI/shared-core operation ownership changes. |

**Issue**: If skills delivery, registry, or content resolution changes without a matching audit update, uninstall and backup can become too conservative or too destructive.

**Why it matters**: The current model is anchored in `packages/cli/src/planner.ts:393-408`, `packages/cli/src/install.ts:96-163`, and `packages/cli/src/audit.ts:745-793`.

**Recommendation**: Keep audit, backup, install, and skill resolution changes coupled in the same implementation plan.

**To close**: The audit model is documented and tested for the selected skill delivery contract.

### R-003 Dev-Template and Packed-Template Resolution Can Diverge

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | W10 R1 Phase 3 proved both sides of the template-resolution boundary on 2026-06-24: local-template behavior passed `npm --prefix packages/cli test -- tests/install.test.ts tests/consistency.test.ts tests/lifecycle.test.ts tests/backup.test.ts tests/uninstall.test.ts`, and packed-template behavior passed `node scripts/smoke-pack.mjs` after `prepack` copied `packages/docs/template/` into `packages/cli/template/`, packed the CLI, installed from the tarball, verified no-default-skills, explicit skills, backup, and uninstall. | Closed by W10 R1 Phase 3 local-template and packed-template validation evidence; preserve both checks for future release-sensitive template changes. |

**Issue**: Testing only local dev paths can miss failures that appear only after `prepack` copies the template into `packages/cli/template`.

**Why it matters**: Local resolution uses `packages/cli/src/utils.ts:33-55`, while packed artifacts depend on `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32`, and `scripts/smoke-pack.mjs:60-246`.

**Recommendation**: Run both focused dev-path tests and pack/smoke validation for release-sensitive template changes.

**To close**: Release validation proves both local and packed template resolution.

### R-004 Path Knowledge Is Duplicated Across Modules and Docs

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Literal path duplication remains accepted but risky; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) adds provider/cache provenance and asset identity as future duplication-sensitive surfaces, [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) makes fallback path recognition a mutation gate, [19-revise-template-package-dogfood-source-of-truth-contract.md](./19-revise-template-package-dogfood-source-of-truth-contract.md) adds template/dogfood/package copy paths to the proof surface, PRD 20 adds conformance scenario/result paths that must stay out of shipped copies by default, PRD 21 adds `.make-docs/**` tool-resource paths, PRD 22 adds `docs/assets/archive/**`, `docs/assets/archive/history/**`, `docs/assets/artifacts/**`, `docs/assets/library/**`, and `docs/assets/playbooks/**`, PRD 23 adds generated metadata field names, route identifiers, lifecycle departure slugs, and body-rendered handoff sections as duplication-sensitive surfaces, PRD 24 adds display-label/config schema surfaces that must not become alternate routing tables, [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) adds CLI/MCP operation-contract names and canonical routing identifiers, and [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) adds first-party operation names plus helper/wrapper script paths across registry, template, dogfood, and package copies. W16 R1 adds generated metadata template, prompt, package-copy, YAML/body handoff drift, and lifecycle-departure checks for the PRD 23 surface. | Keep extending parity, provenance, classifier, package-template copy, conformance asset exclusion, tool-directory path, managed project asset path, generated metadata, YAML/body handoff drift, lifecycle departure, config structural-rename, CLI/MCP shared-operation, and no-scripts helper/wrapper checks when moving, adding, generating, validating, or provider-resolving template-owned paths. |

**Issue**: Adding or moving a template-owned path can drift across `rules.ts`, `catalog.ts`, tests, package docs, and dogfood copies.

**Why it matters**: The duplication spans `packages/cli/src/rules.ts:8-194`, `packages/cli/src/catalog.ts:7-85`, `packages/cli/tests/consistency.test.ts:33-77`, and `packages/docs/README.md:86-121`.

**Recommendation**: Prefer focused consistency tests when a full centralization refactor is not in scope.

**To close**: Either path constants are centralized or tests cover every duplicated path surface that matters.

### R-005 The No-Command CLI Workflow Is Easy to Simplify Incorrectly

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | No-command install remains the public default, and [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) explicitly rejects replacing it with an `init`/`update` command-router model for package-runner, persistent-install, or MCP surfaces. | Preserve parser rejection, help-output, and CLI/MCP parity tests. |

**Issue**: Reintroducing `init`/`update`, collapsing wizard review with generic apply confirmation, or treating lifecycle commands as install flags would break the shipped public UX.

**Why it matters**: This behavior is anchored in `packages/cli/src/cli.ts:119-244`, `packages/cli/src/cli.ts:589-612`, `packages/cli/src/wizard.ts:487-550`, `packages/cli/src/backup.ts:86-127`, and `packages/cli/src/uninstall.ts:63-116`.

**Recommendation**: Keep install/reconfigure flow, lifecycle commands, and parser rejection behavior covered by focused CLI tests.

**To close**: Public help, parser behavior, docs, and tests all describe the same command model.

### R-006 Backup and Uninstall Depend on a Single Reviewed Audit Snapshot

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Single reviewed audit snapshot remains the shared safety model for the TypeScript CLI, required MCP writes constrained by [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md), any on-demand materialization path introduced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), the `backup-and-reinstall` disposition defined by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md), future `.make-docs/**` tool-resource migration in PRD 21, old-script or wrapper removal introduced by [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md), alternate-manifest provenance introduced by [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md), and shared-payload/generated-stub classification introduced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md). W17 R1 Phase 4 adds selected-skill manifest/provenance review data to audit reports, lifecycle summaries, and compatibility evidence without creating a second review snapshot. W17 R2 Phase 4 validates shared-payload/generated-stub classification through the same audit snapshot used by backup and uninstall rather than a second review path. PRD 20 may test this as a scenario but cannot loosen it. | Keep backup/uninstall implementation, provider-backed writes, migration backup-and-reinstall, conformance scenarios, tool-directory migration, MCP permissions, old-script removals, wrapper classification, alternate-manifest provenance, shared-payload/stub classification, and docs aligned around one reviewed audit/classification snapshot. |

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
| Open | Skill refactor is now scoped by [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md): deterministic logic must move into modular TypeScript CLI/shared-core operations first, and `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase` skills must be rewritten in the same implementation window before standalone helper scripts are removed or downgraded. W16 R3 implements the lifecycle-critical operation boundary, rewrites those four skills to call `make-docs operations`, removes the replaced lifecycle helper scripts from selected-skill registry assets, and adds selected-skill install/audit/backup/uninstall/smoke-pack validation. W10 R8 Phase 2 modularizes the closeout, work, and lifecycle operation domains while preserving the `make-docs operations ...` compatibility facade. W10 R8 Phase 3 ships the first read-first TypeScript MCP surface through `make-docs mcp` with direct operation-domain parity tests. W10 R8 Phase 4 proves the packed package can run through npm, pnpm, and Bun package runners before the existing selected-skill install/audit/backup/uninstall smoke assertions continue. The risk remains open for remaining helper scripts, purpose metadata, MCP write/permission expansion, plugin/shared-agentics parity, and broader skill delivery decisions. | Keep the W16 R3 evidence as the lifecycle-helper mitigation, the W10 R8 Phase 2 domain split as modularization evidence, the W10 R8 Phase 3 read-first MCP tools as the initial TypeScript MCP parity evidence, and the W10 R8 Phase 4 package-runner smoke as release-boundary evidence; close this only after remaining first-party skill helper dependencies, package/template validation, purpose metadata, MCP write/permission expansion, plugin/shared-agentics parity, and delivery-model work prove selected skills no longer rely on standalone scripts for make-docs-owned deterministic behavior. |

**Issue**: W16 R3 removed the lifecycle-helper break window for closeout and work skills, but first-party skill delivery still includes narrower helper scripts and unresolved purpose/delivery metadata.

**Why it matters**: Users should not need skill-local scripts for make-docs-owned lifecycle behavior, and future selected-skill changes must not reintroduce a second deterministic behavior owner.

**Recommendation**: Treat W16 R3 as the lifecycle-helper mitigation baseline and require later skill, purpose-manifest, MCP, operation-domain, and shared-agentics work to reuse the packaged TypeScript CLI/shared-core boundary.

**To close**: First-party skills source make-docs-owned deterministic behavior from the CLI/shared-core boundary, remaining helper scripts are classified or retired intentionally, and parity passes across install, audit, backup, uninstall, and package smoke locations.

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
| Open | Stage vocabulary is domain-neutral (e.g., "release / publish," not "launch / deploy"), and PRD 24 adds presentation labels so projects can render domain-appropriate terms without renaming canonical contracts. | Audit anchor, playbook, contract, generated prose, and CLI text for software-specific terms; implement config labels as presentation only. |

**Issue**: Terms like "launch" or "deploy" steer agents toward assuming a technical deployment outcome.

**Why it matters**: make-docs serves non-software documentation work; biased vocabulary narrows its use.

**Recommendation**: Define release-style stages as "make the work available to its audience" and keep all stage vocabulary neutral.

**To close**: Lifecycle and contract docs use domain-neutral vocabulary throughout.

### R-011 The Persona-Target Axis References a Future Configuration

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | PRD 22 defines the persona schema, default personas, and primitive mapping. W9 R3 P3 implements default/custom persona validation plus guide/playbook `persona` frontmatter drift checks, and W9 R3 P4 proves the default reader-facing router package flow through catalog/install assertions and `npm run smoke:pack`. The remaining risk is PRD 24 configuration-overlay integration and downstream consumers, not schema ambiguity or default package parity. PRD 23 consumes `persona` only as the generated-doc frontmatter field for persona-scoped guides and playbooks; W16 R1 adds that field to generated guide templates and parity tests. PRD 29 adds Run Playbook validation that must fail closed on missing or invalid playbook `persona` metadata. PRD 31 keeps adversarial-review persona targeting conditional and requires configured personas when the challenge is persona-scoped. | Wire PRD 24 configuration overlays into the implemented persona schema and extend downstream fixtures for generated guide/playbook metadata, Run Playbook persona validation, and adversarial-review candidate records with configured persona targets or `none`. |

**Issue**: The coverage-pass contract's persona-target axis now has implemented defaults, but future project configuration overlays still need to feed the same schema.

**Why it matters**: Overlay drift could confuse agents if custom personas relabel or extend targets without preserving `slug`, `label`, `description`, `primitive`, and primitive membership.

**Recommendation**: Use the implemented default persona set now, then feed PRD 24 overlays through the same validator before downstream generated metadata or playbook execution consume custom targets.

**To close**: The PRD 24 configuration overlay reads from and validates against the implemented persona schema.

### R-012 Playbooks and Plugins Could Become Overlapping Deliverables

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | Resolved by the content-vs-invocation boundary; PRD 22 defines playbooks as persona-scoped content under `docs/assets/playbooks/**`, PRD 29 defines Run Playbook as a generic invocation model that can be exposed by agents, CLI, MCP, plugins, or skills without making plugin exposure mandatory, and PRD 30 defines plugins as optional harness-visible invocation packages rather than playbook storage. | Keep the boundary explicit when designing plugins and do not make storage under `docs/assets/playbooks/**` executable by itself. |

**Issue**: Both playbooks and plugins can look like "the thing that runs a workflow."

**Why it matters**: Without a boundary, the project risks building two systems that do the same job.

**Recommendation**: A playbook is a persona-scoped process definition; Run Playbook is the generic invocation model; a plugin is an optional packaged exposure path over that model.

**To close**: Closed by PRD 29 and reinforced by PRD 30. Future plugin designs must cite and respect the boundary.

### R-013 The Restructure and Rename Will Relocate Newly Authored Assets

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | W9 R4 implemented the first pivot mappings: make-docs-owned tool resources now live under `.make-docs/{contracts,references,templates,scripts}/system/**`, top-level `docs/artifacts/**` hard-moved to `docs/assets/artifacts/**`, and top-level `docs/archive/**` is not shipped as a v2 target. W9 R5 supersedes W9 R4 for the guide/library and history/breadcrumb decisions: future guide/persona docs target `docs/assets/library/**`, future history/breadcrumb records target `docs/assets/archive/history/**`, and `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, and `docs/library/**` are not shipped-current targets. PRD 23 metadata backfill is therefore limited to planned template/package work or touched current files; historical records and completed backlog evidence are not invalid merely because they predate v2 metadata. | Keep remaining generated metadata, configuration overlay, playbook runner, and adversarial-review work with PRDs 23, 24, 29, and 31. Those follow-ons must consume W9 R5 for library/history paths and W9 R4 for the hard artifact/archive/tool-resource moves, without broad historical-document rewrites. |

**Issue**: Assets authored in W16 and W9 (the coverage-pass contract, starter prompts, artifact seed material, history records, and library playbook) spanned tool-resource, managed project asset, and lifecycle-storage targets; treating all of them as a single current-path migration would have blurred the PRD 21 and PRD 22 namespace split.

**Why it matters**: Links and references authored before W9 R4 could have broken on the restructure if mappings were not tracked and validated.

**Recommendation**: Treat W9 R5 as the authoritative IA layer for remaining unimplemented v2 guide/library and history/breadcrumb work, while preserving W9 R4 as the artifact/archive/tool-resource hard-move evidence. Historical records and completed pre-W9 R5 backlogs remain evidence; future-facing package, router, PRD, and work references must consume `.make-docs/**`, `docs/assets/{archive,artifacts,library,playbooks}/**`, and on-demand `docs/assets/archive/history/**`.

**To close**: Closed by W9 R4 implementation and validation. Any later metadata, config, playbook, plugin, or adversarial-review relocation belongs to the owning downstream PRD without reopening the settled W9 R4 path decisions.

### R-014 The No-Scripts Migration Has a Transitional Break Window

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Move deterministic logic into the TypeScript CLI without stranding skills, plugins, or MCP tools between operation-domain ownership, the provider/cache surfaces introduced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), the migration classifier required by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md), lab scenarios introduced by [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md), future `.make-docs/scripts/{system,custom}` tiers introduced by PRD 21, generated metadata validation introduced by PRD 23, config validation introduced by PRD 24, the CLI/MCP operation boundary introduced by [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md), the concrete W16 R3 sequence in [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md), the purpose-manifest metadata in [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md), generated stubs/shared payloads introduced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md), generic Run Playbook behavior introduced by [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md), plugin substrate/workflow bundle metadata introduced by [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md), and optional adversarial-review surfaces introduced by [31-revise-coverage-pass-extensions-adversarial-review.md](./31-revise-coverage-pass-extensions-adversarial-review.md); sequence the skill, plugin, and MCP rewrites into the same operation-first wave where they depend on deterministic behavior. W16 R3 proves the first operation-first wave for closeout and work lifecycle helpers, including old-script classification and packed selected-skill smoke coverage. W10 R8 Phase 2 modularizes those closeout, work, and lifecycle operation domains. W10 R8 Phase 3 ships the first read-first TypeScript MCP surface through `make-docs mcp`, reusing operation domains for closeout/work/lifecycle helpers while leaving broader write, plugin, and shared-agentics parity open. W10 R8 Phase 4 adds package-runner proof for the packed TypeScript CLI across npm, pnpm, and Bun so remote execution does not depend on a persistent local install. | Avoid rewriting skills, scripts, conformance scenarios, config validation, purpose manifests, shared stubs, shared payloads, plugin exposure files, workflow bundles, Run Playbook surfaces, adversarial-review prompts/playbooks/plugins, or future MCP tools to cite a contract before the CLI/shared-core provides their logic and before system assets, migration classification, structural-rename checks, old-script classification, wrapper delegation, selected-skill install/remove behavior, plugin selection behavior, alternate-manifest provenance, stub/payload classification, playbook runner validation, and adversarial candidate validation remain locally recoverable without standalone script helpers. |

**Issue**: Moving deterministic logic into the CLI while skills, plugins, or future harness surfaces still reference standalone scripts can create a break window.

**Why it matters**: W16 R3 covered closeout/work lifecycle helpers, but later script, plugin, MCP, operation-domain, and shared-agentics moves can recreate the same sequencing failure if they are not operation-first.

**Recommendation**: Continue the W16 R3 pattern: land CLI/shared-core logic first, rewrite dependent guidance in the same implementation window, then retire managed old assets with audit/install/remove/package evidence.

**To close**: Skills, plugins, MCP tools, and shared harness surfaces source make-docs-owned deterministic logic from the CLI/shared-core boundary with no unclassified standalone script dependency.

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
- `docs/prd/24-revise-configuration-convention-overlay.md`
- `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md`
- `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`
- `docs/prd/29-revise-playbook-contract-run-playbook.md`
- `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`
- `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md`
- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-19-system-asset-delivery-and-materialization-contract.md`
- `docs/designs/2026-06-19-compatibility-audit-and-migration-disposition.md`
- `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`
- `docs/designs/2026-06-19-agent-harness-and-model-conformance-lab.md`
- `docs/designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md`
- `docs/designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md`
- `docs/designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md`
- `docs/designs/2026-06-20-configuration-and-convention-overlay.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md`
- `docs/plans/2026-06-23-w10-r2-system-asset-materialization-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/00-overview.md`
- `docs/plans/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-overview.md`
- `docs/plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/00-overview.md`
- `docs/plans/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-overview.md`
- `docs/plans/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md`
- `docs/plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md`
- `docs/plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
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
- `.make-docs/contracts/system/output-contract.md`
