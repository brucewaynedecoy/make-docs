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
| Open | [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) preserves the installer-first `npx` posture, meaningful no-command install/sync behavior, accepted lifecycle commands, and removed command rejections; public docs still need implementation cleanup. [39-revise-cli-command-reorganization-and-operation-registry.md](./39-revise-cli-command-reorganization-and-operation-registry.md) now supersedes the shipped taxonomy itself with the five-command tree (`setup`, `run`, `mcp`, `update`, `uninstall`), `setup remove` replacing project-level `uninstall`, context-aware bare invocation, and no back-compatibility aliases, so the documentation target moves from the current parser to the W18 R11 surface, and any template-owned router, guide, or README naming old spellings such as `operations` updates upstream in `packages/docs/template/` first per the maintainer dogfooding rule. W18 R11 P2 landed the five-command tree and moved the package README, the maintainer README, the lifecycle UI strings, and the dogfood library guides onto the new spellings; a grep of `packages/docs/template/` found no old command spellings, so the upstream-first template consequence is currently a verification obligation rather than a rewrite. | Audit public command docs against the W18 R11 five-command tree, help output, and pre-v2 warning language once the wave completes — the root README, MCP tool descriptions, and pre-v2 warning language remain for the self-management, MCP-derivation, and closing phases; route any template-owned spelling updates upstream before dogfooding. |

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
| Open | Selected-skill category behavior is superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md), package ownership is narrowed by [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md), skills are explicitly outside the system asset modes in [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) permits preserving selected skills during migration only when manifest/file evidence is trustworthy, [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) requires deterministic first-party skill behavior to be available from the CLI package/shared-core boundary rather than only remote or skill-local script payloads, [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) defines purpose metadata and alternate-manifest source policy without choosing bundled-local versus remote-fetch delivery, [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) decides shared local placement and native harness exposure without choosing bundled-local versus remote-fetch delivery, and [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) adds plugin source/provenance/trust metadata without choosing skills delivery; the skills delivery model decision remains open. | Decide and document the long-term skills delivery contract. |

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
| Open | Selected-skill UX and the `selectedSkills` manifest requirement are superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md); [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) preserves no-default-skills and TypeScript npm ownership; [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) clarifies that skills are not system assets; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) prevents migration from silently expanding `selectedSkills` or installing skills by default; [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) prevents deterministic first-party skill behavior from depending only on remote or skill-local script payloads; [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) adds purpose-led metadata and effective-manifest selection while preserving resolved `selectedSkills`, with W17 R1 validating bare no-skill installs, alternate local manifests, persisted provenance, and remote policy stops; [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) now chooses shared local payload placement plus native harness exposure with symlink preferred and managed copy-mirror fallback for selected agentics; [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) keeps plugin selection explicit and separate from skill selection. It still does not choose remote skill delivery. | Choose remote-fetch, bundled-local, or dual-mode fallback for skills. |

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
| Open | [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) and [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) now assign v2 runtime and MCP ownership to the TypeScript package CLI; [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) requires TypeScript CLI/MCP/plugin install paths to preserve compatibility classification and migration dispositions; [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) can test shared-install behavior only after the product contract exists; PRD 21 reserves `.make-docs/agentics/skills` and `.make-docs/agentics/plugins`; PRD 24 allows plugins and skills to display configured labels while routing through canonical identifiers; [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) provides the concrete script-to-operation sequence those future surfaces must reuse; [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) requires future surfaces to use canonical purpose ids and one effective skills manifest; [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) now supersedes the W17 R2 generated-stub default with native harness exposure, symlink-preferred directories, managed copy-mirror fallback, and legacy stub migration; [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) specifies selected plugin payloads under `.make-docs/agentics/plugins/<plugin-id>/`, explicit plugin selection, and config-after-canonical-resolution behavior while inheriting the W17 R3 native-exposure correction. W17 R2 Phase 4 remains evidence for shared payload placement and lifecycle classification, not for the final exposure primitive. The question remains open for selected plugin exposure, config-label rendering after canonical routing, richer structured ownership records, TypeScript operation-domain delegation, and CLI/MCP parity. | Implement and validate shared selected-agentics exposure for skills and plugins, structured ownership records, config-label rendering after canonical routing, TypeScript operation-domain delegation, and CLI/MCP parity. |

**Question**: How are skills and plugins installed once and exposed to each harness without duplication, and how does a plugin that guides (for example) requirements → design → plan respect a config that relabels "designs" to "ideas"?

**Why it matters**: Skills are duplicated across agent directories today; plugins will face the same problem and must honor the customization mapping.

**Recommendation**: Use the shared selected-agentics store plus native harness exposure. Prefer directory symlinks where available, use managed copy mirrors as the compatibility fallback, and treat generated stubs as legacy migration inputs or explicit diagnostics rather than the default installed skill.

**To close**: The shared-install and config-aware routing model is implemented and validated for selected skills and selected plugins.

### Q-013 What Are the Plugin Flow and Exposure Boundaries?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | PRD 20 treats plugin and playbook scenarios as conformance inputs after shared agentics install, plugin substrate, and Run Playbook decisions land. [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) provides purpose-led skill metadata that plugins may present later. [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) unblocks a shared payload/native-exposure primitive for plugin storage and exposure. [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md) defines playbook validity and generic Run Playbook invocation. [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) defines plugin substrate, productized bundle families, bundle audience metadata, and the substrate-level non-maintainer guardrail, but leaves exact per-bundle UX unresolved. | Resolve request-vs-change, docs visibility, scaffold exposure, and implementation-specific support-claim evidence per bundle. |

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
| Open | Home-scoped skill ownership remains active product behavior; old `optionalSkills` and required/default skill assumptions are superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md), [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) adds effective-manifest and selection-provenance context without changing project/global ownership, and [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) extends the project/global split to shared payloads, native harness exposures, symlink links, copy mirrors, and legacy generated stubs. W17 R2 Phase 4 adds implementation evidence for project and home-scoped shared payload/stub handling; W17 R3 Phase 4 adds implementation evidence for symlink-preferred and copy-mirror native exposure in both scopes. | Preserve home-scope backup, audit, manifest, shared-payload, symlink-exposure, copy-mirror, legacy-stub, and selection-provenance handling in any rebuild. |

**Issue**: A rebuild that assumes all managed files live under the target repo will break global skill installs, backup mapping, and uninstall safety.

**Why it matters**: Home-scoped paths are encoded in `packages/cli/src/skill-catalog.ts:33-46`, `packages/cli/src/manifest.ts:135-183`, `packages/cli/src/audit.ts:745-796`, and `packages/cli/src/backup.ts:252-300`.

**Recommendation**: Treat home-scope skill management as first-class lifecycle behavior, not an incidental install detail.

**To close**: Any rebuild plan explicitly covers project-scope and home-scope managed skill paths.

### R-002 Audit Removability Depends on Regenerated Canonical Skill Content

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Current safety model depends on regeneration and exposure classification; [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) adds managed old-script, managed wrapper, modified local file, and custom user script classification to the audit/removal boundary; [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) adds alternate-manifest provenance and W17 R1 Phase 4 now loads saved local-manifest registries when reviewing/removing alternate selected-skill files, but removability still requires canonical skill content; [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) adds canonical shared payload, symlink exposure, copy-mirror, legacy generated-stub, and duplicated-payload removability as first-class audit cases. W17 R2 Phase 4 adds tests for regenerated canonical content across shared payloads, generated stubs, and legacy duplicated payloads; W17 R3 Phase 4 adds link-aware and copy-mirror tests, including clean migration and preservation or review of modified/custom skill files. | Revisit if skill delivery, content resolution, script wrappers, alternate manifests, shared payloads, native exposure, copy mirrors, legacy stubs, or CLI/shared-core operation ownership changes. |

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
| Open | No-command install remains the public default, and [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) explicitly rejects replacing it with an `init`/`update` command-router model for package-runner, persistent-install, or MCP surfaces. [39-revise-cli-command-reorganization-and-operation-registry.md](./39-revise-cli-command-reorganization-and-operation-registry.md) preserves the installer-first posture while making bare `make-docs` context-aware — guided `setup` with no install present, status and help without auto-sync with one — and reintroduces `update` only as machine-footprint tool self-management, never as an install router; the simplification hazard now includes collapsing context-aware bare into a forced router or blurring `setup remove` with tool `uninstall`. | Preserve context-aware bare behavior, tool-versus-project lifecycle separation, help-output, and registry-derived CLI/MCP parity tests. |

**Issue**: Reintroducing `init`/`update`, collapsing wizard review with generic apply confirmation, or treating lifecycle commands as install flags would break the shipped public UX.

**Why it matters**: This behavior is anchored in `packages/cli/src/cli.ts:119-244`, `packages/cli/src/cli.ts:589-612`, `packages/cli/src/wizard.ts:487-550`, `packages/cli/src/backup.ts:86-127`, and `packages/cli/src/uninstall.ts:63-116`.

**Recommendation**: Keep install/reconfigure flow, lifecycle commands, and parser rejection behavior covered by focused CLI tests.

**To close**: Public help, parser behavior, docs, and tests all describe the same command model.

### R-006 Backup and Uninstall Depend on a Single Reviewed Audit Snapshot

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Single reviewed audit snapshot remains the shared safety model for the TypeScript CLI, required MCP writes constrained by [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md), any on-demand materialization path introduced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), the `backup-and-reinstall` disposition defined by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md), future `.make-docs/**` tool-resource migration in PRD 21, old-script or wrapper removal introduced by [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md), alternate-manifest provenance introduced by [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md), shared-payload/native-exposure classification introduced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md), and backup-root plus selected-agentics pruning correction introduced by [32-revise-lifecycle-backup-state-agentics-pruning.md](./32-revise-lifecycle-backup-state-agentics-pruning.md). W17 R1 Phase 4 adds selected-skill manifest/provenance review data to audit reports, lifecycle summaries, and compatibility evidence without creating a second review snapshot. W17 R2 Phase 4 validates shared-payload/generated-stub classification through the same audit snapshot used by backup and uninstall rather than a second review path. W17 R3 Phase 4 extends that snapshot to symlink exposures and copy mirrors without following symlink targets destructively. W17 R4 keeps backup and uninstall on that same snapshot while moving new backup writes to `.make-docs/backup/**`, protecting legacy root `.backup/**`, and pruning empty managed `.make-docs/agentics/**` directories only when audit proves no unmanaged descendants remain. PRD 20 may test this as a scenario but cannot loosen it. | Keep backup/uninstall implementation, provider-backed writes, migration backup-and-reinstall, conformance scenarios, tool-directory migration, MCP permissions, old-script removals, wrapper classification, alternate-manifest provenance, shared-payload/native-exposure classification, backup-root protection, selected-agentics pruning, and docs aligned around one reviewed audit/classification snapshot. |

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
| Open | Move deterministic logic into the TypeScript CLI without stranding skills, plugins, or MCP tools between operation-domain ownership, the provider/cache surfaces introduced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md), the migration classifier required by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md), lab scenarios introduced by [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md), future `.make-docs/scripts/{system,custom}` tiers introduced by PRD 21, generated metadata validation introduced by PRD 23, config validation introduced by PRD 24, the CLI/MCP operation boundary introduced by [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md), the concrete W16 R3 sequence in [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md), the purpose-manifest metadata in [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md), shared payload/native-exposure behavior introduced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md), generic Run Playbook behavior introduced by [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md), plugin substrate/workflow bundle metadata introduced by [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md), and optional adversarial-review surfaces introduced by [31-revise-coverage-pass-extensions-adversarial-review.md](./31-revise-coverage-pass-extensions-adversarial-review.md); sequence the skill, plugin, and MCP rewrites into the same operation-first wave where they depend on deterministic behavior. W16 R3 proves the first operation-first wave for closeout and work lifecycle helpers, including old-script classification and packed selected-skill smoke coverage. W10 R8 Phase 2 modularizes those closeout, work, and lifecycle operation domains. W10 R8 Phase 3 ships the first read-first TypeScript MCP surface through `make-docs mcp`, reusing operation domains for closeout/work/lifecycle helpers while leaving broader write, plugin, and shared-agentics parity open. W10 R8 Phase 4 adds package-runner proof for the packed TypeScript CLI across npm, pnpm, and Bun so remote execution does not depend on a persistent local install. | Avoid rewriting skills, scripts, conformance scenarios, config validation, purpose manifests, shared payloads, native harness exposures, legacy generated stubs, plugin exposure files, workflow bundles, Run Playbook surfaces, adversarial-review prompts/playbooks/plugins, or future MCP tools to cite a contract before the CLI/shared-core provides their logic and before system assets, migration classification, structural-rename checks, old-script classification, wrapper delegation, selected-skill install/remove behavior, plugin selection behavior, alternate-manifest provenance, exposure classification, playbook runner validation, and adversarial candidate validation remain locally recoverable without standalone script helpers. |

**Issue**: Moving deterministic logic into the CLI while skills, plugins, or future harness surfaces still reference standalone scripts can create a break window.

**Why it matters**: W16 R3 covered closeout/work lifecycle helpers, but later script, plugin, MCP, operation-domain, and shared-agentics moves can recreate the same sequencing failure if they are not operation-first.

**Recommendation**: Continue the W16 R3 pattern: land CLI/shared-core logic first, rewrite dependent guidance in the same implementation window, then retire managed old assets with audit/install/remove/package evidence.

**To close**: Skills, plugins, MCP tools, and shared harness surfaces source make-docs-owned deterministic logic from the CLI/shared-core boundary with no unclassified standalone script dependency.

### R-015 Backup State and Agentics Pruning Could Drift Across Lifecycle Consumers

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [32-revise-lifecycle-backup-state-agentics-pruning.md](./32-revise-lifecycle-backup-state-agentics-pruning.md) moves future backup writes to `.make-docs/backup/**`, protects legacy root `.backup/**`, keeps backup and uninstall on one reviewed audit snapshot, and requires empty managed `.make-docs/agentics/**` pruning only when audit proves no unmanaged descendants remain. W17 R4 Phase 4 implemented and validated the CLI/package portion through backup, audit, uninstall, selected-skill sync, build, default consistency, smoke-pack, and isolated manual UAT coverage. W18 R2 plugin lifecycle work must still inherit this before adding selected-plugin backup, uninstall, migration, or cleanup. | Keep backup, audit, uninstall, lifecycle UI, package smoke, selected-agentics removal, and future plugin lifecycle tests aligned with PRD 32. Close the residual risk only after plugin lifecycle work proves it consumes the same backup-state and pruning contract. |

**Issue**: Backup destination, audit exclusion, uninstall pruning, selected-agentics cleanup, package smoke validation, and future plugin lifecycle work can drift if they each encode backup or agentics paths independently.

**Why it matters**: A partial migration could create new root `.backup/**` state, delete historical backup evidence, leave stale empty `.make-docs/agentics/**` directories, or prune user-authored agentics content.

**Recommendation**: Treat W17 R4 as the active lifecycle-state prerequisite for any backup, uninstall, selected-agentics cleanup, package-smoke, or plugin lifecycle change.

**To close**: Focused lifecycle and package-smoke tests prove new backups use `.make-docs/backup/**`, root `.backup/**` is protected, selected-agentics pruning is safe, and plugin lifecycle work consumes the same contract. The CLI/package portion is complete as of W17 R4 Phase 4; the remaining closure condition is downstream plugin lifecycle inheritance.

### R-016 Run Playbook Orchestration Could Drift Across Runner Surfaces

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md) and W18 R4 define one Run Playbook orchestration model: `persona/slug` resolver identity, stack metadata disambiguation, reviewed harness capability records in `.make-docs/config.yaml`, explicit nested-playbook permission, and concurrency conflict checks. [34-revise-playbook-contract-and-model.md](./34-revise-playbook-contract-and-model.md) adds the W18 R6 single-model rule: every runner surface must consume the parsed Playbook model and its shared step-status vocabulary rather than re-parsing Playbook Markdown or inventing a parallel status set. [35-revise-run-playbook-state-machine.md](./35-revise-run-playbook-state-machine.md) adds the W18 R7 engine rules: Make Docs-owned run state relocates from `.make-docs/runs/playbooks/**` to the global store keyed by project id plus run id, progression happens only through `playbook.start`/`status`/`next`/`advance`/`gate`/`resume`/`close` with `playbook.next` side-effect free, and resume blocks by default on a source-digest mismatch. [39-revise-cli-command-reorganization-and-operation-registry.md](./39-revise-cli-command-reorganization-and-operation-registry.md) adds the W18 R11 surface rules: the progression operations are registry operations with stable append-only identifiers surfaced under `run playbook`, the CLI `run` tree and MCP tool list are derived from or conformance-checked against the same registry so runner surfaces cannot drift as hand-maintained mirrors, and Playbook `operation:` steps reference identifiers rather than command spellings. W18 R11 P1 landed the registry with the full playbook identifier set fixed: `validate`, `catalog`, `resolve`, `capabilities`, `start`, `invoke`, and `status` are active over today's create/invoke/read capabilities per PRD 35 R-OP-2, while `next`, `advance`, `gate`, `resume`, and `close` are registered as `pending` identifiers that refuse invocation naming the W18 R7 lineage — the sequencing inversion (R11 surface before the R7 engine) is deliberate so the identifiers cannot drift while the engine lands behind them. | Keep W18 R1, W18 R2, W18 R3, CLI, MCP, plugin, conformance, and package validation work aligned with W18 R4, the W18 R6 Playbook model, the W18 R7 state machine, and the W18 R11 registry-derived surfaces before any public runner or support claim ships; when the W18 R7 engine lands, flip the five pending registry identifiers to active handlers without renaming them. |

**Issue**: CLI, MCP, plugin, skill, and harness-assisted playbook execution could each invent their own resolver, capability, run-state, nested-run, or concurrency behavior.

**Why it matters**: Divergent runner behavior would make playbook selection ambiguous, lose resume state after interruptions, over-trust unknown harness capabilities, and allow parallel child playbooks to edit overlapping output surfaces without review.

**Recommendation**: Treat W18 R4 as the blocking orchestration authority before implementing W18 R1, W18 R2, or W18 R3 runner-related work.

**To close**: Future implementation validation proves one shared resolver, config schema, unknown-capability path, run-state writer, resume flow, nested-playbook guard, concurrency conflict check, and CLI/MCP/plugin parity behavior.

### R-017 Playbook Packaging Could Blur Source and Generated Agentic Outputs

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [33-enhance-playbook-packaging-and-harness-adapter-registry.md](./33-enhance-playbook-packaging-and-harness-adapter-registry.md) makes Playbook packaging a required v2 deliverable while preserving the existing source/invocation boundary: Playbooks remain source under `docs/assets/playbooks/**`, generated plugins and skills bundles are distribution artifacts, and package plans must be reviewed before semantic or ambiguous writes. [34-revise-playbook-contract-and-model.md](./34-revise-playbook-contract-and-model.md) additionally requires the packaging rails to compile from the single parsed W18 R6 Playbook model rather than re-parsing Playbook Markdown independently. [36-revise-playbook-packaging-compiler-and-harness-adapters.md](./36-revise-playbook-packaging-compiler-and-harness-adapters.md) adds the W18 R8 compiler rules: the output writer produces a real multi-file harness-native distributable and never a Make Docs descriptor, harness-specific packaging knowledge lives in a capability descriptor, `outputKind` is interpreted through the two-granularities native/portable profile model, and adapter paths, manifest shapes, and registration steps must be verified against the real harness. | Keep W18 R1, W18 R2, W18 R3, W18 R5, W18 R6, W18 R8, CLI, MCP, shared-agentics, package validation, and conformance work aligned so generated outputs carry provenance, lifecycle ownership, support status, and review state without becoming Playbook source. |

**Issue**: A package pipeline can accidentally make generated plugin or skills-bundle outputs look like the authoritative Playbook, or can treat generic standard skill locations as a fake harness instead of a surface selected by a real harness adapter.

**Why it matters**: If source and generated outputs blur, Make Docs may ship stale generated files, delete user-authored harness content, overstate harness support, or make future harness additions require broad package-planner rewrites.

**Recommendation**: Treat package planning as a reviewed bridge. Keep deterministic validation, writes, provenance, lifecycle, and conformance in TypeScript operation domains; allow agents to draft semantic package-plan fields only behind review; and put harness-specific behavior in adapter modules with fixtures and support evidence.

**To close**: W18 R5 implementation proves package-plan generation, adapter registry extension, `plugin` and `skills-bundle` output writers, source digest provenance, review/manual stops, lifecycle safety, package smoke coverage, and conformance tuple evidence.

### R-018 The Playbook Contract, Validator, and Template Copies Could Drift Out of Parity

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | [34-revise-playbook-contract-and-model.md](./34-revise-playbook-contract-and-model.md) makes `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` the normative Playbook authority, requires strict contract/validator parity so neither carries a requirement the other omits, requires every diagnostic code to have a failing fixture, and requires migrated and shipped default Playbooks to validate with zero errors in both the upstream template and the dogfood instance. W18 R6 Phase 1 landed the contract prose upstream and dogfooded it with byte-identical copies plus router discovery updates. W18 R6 Phase 2 landed the single Playbook model and staged parser as the pure library at `packages/cli/src/playbook/`, encoding the contract's schema once (statuses, spine, dependency registry, worked-example structure) with parser-owned diagnostic codes, and its test suite extracts the Worked Example fence from the dogfooded contract copy and asserts it parses with zero diagnostics and a runnable model — a first executable contract/parser parity check. W18 R6 Phase 3 landed the layered validator at `packages/cli/src/playbook/validator/` — six independently reporting layers (structural, registry, workflow, cross-reference, consistency, and orchestration-policy shape) behind `validatePlaybook` and the canonical `parseAndValidatePlaybook` entry point — and completed the diagnostic catalog at twenty-four codes (PB-DOC-001 through PB-WF-024) whose records each carry a stable code, severity, section/field/span location, message, and fix hint, with a test that machine-checks the contract's diagnostic table against the exported catalog and a worked-example test asserting zero errors and zero warnings through the full validator. The Phase 3 t10 parity reconciliation found two genuine contract-side drifts and fixed them upstream-first with a byte-identical dogfood copy — the known event set is now enumerated to match `PLAYBOOK_KNOWN_EVENTS`, and the invocation-form rule was corrected from exactly-one to at-most-one because the design's canonical worked example includes a gate step that declares no form — and PRD 34's R-WF-5 transcription was corrected in place to match, recorded as PRD-side wording drift from the design's normative statement rather than a requirement change, so no new change doc was minted. W18 R6 Phase 4 wired the library into the operation surface and migrated the shipped default: the `playbook.validate` and `playbook.catalog` operations at `packages/cli/src/operations/playbook/contract.ts` wrap `parseAndValidatePlaybook` with every parsed fact and diagnostic coming solely from the library (R-MODEL-2, R-MODEL-6), exposed on both the CLI (`operations playbook-validate` and `playbook-catalog`) and MCP (`make_docs_playbook_validate` new, `make_docs_playbook_catalog` repointed) inside the operation-domain boundary per PRD 25, consuming the registry-minted `playbook.validate`/`playbook.catalog` identifiers as an external contract (R-SCOPE-2); both operations detect the suffix form and the deprecated plain form, with PB-FILE-007 surfacing in catalog diagnostics (R-DOC-2, R-DOC-4). The default lifecycle Playbook was migrated upstream-first to `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` with a byte-identical dogfood copy and the deprecated plain files deleted in both locations (R-AUTH-1, R-AUTH-5), restructured to the eleven-heading spine with a seven-row dependency registry and an eight-step workflow contract, and it validates with zero errors and zero warnings in both locations, with a new consistency test asserting all shipped default Playbooks validate clean (R-TEST-3) and the `packages/cli/template/` copy confirmed build-generated. W18 R6 Phase 5 closed the remaining bar with the D7 verification suite: `packages/cli/tests/playbook-fixtures.test.ts` gives every one of the twenty-four catalog codes at least one failing fixture under `packages/cli/tests/fixtures/playbooks/`, with completeness double-enforced by a compile-time `Record` keyed over the full diagnostic-code union plus a runtime walk of the exported catalog, and each fixture asserting exact code, catalog severity, non-empty message and hint, no undeclared co-diagnostics, and severity-exact runnability; the contract/catalog machine-check now reads both the upstream template and dogfood contract copies and a new parity test asserts the two copies are byte-identical; the shipped-default sweeps enumerate the playbook directories in both the upstream template and the dogfood instance and assert zero errors, auto-covering future defaults; and a full contract parity walk against the implemented layers and catalog found zero drift. | Keep contract edits, validator/diagnostic-catalog changes, default-Playbook changes, and upstream/dogfood reseeding coupled in the same implementation window; the fixture-completeness, contract/catalog, byte-identity, and shipped-default checks now fail the suite when the coupling is broken. |

**Issue**: The Playbook contract is stated three times — as contract prose, as validator code with a diagnostic catalog, and as upstream template plus dogfood copies — and any of the three can be edited without the others, silently recreating the substring-era gap where a Playbook passes validation while violating the stated contract or vice versa.

**Why it matters**: The runner, packaging compiler, and conformance designs all compile against the W18 R6 model; a contract/validator mismatch or a stale template/dogfood copy would propagate wrong behavior into every downstream W18 surface and into shipped default Playbooks.

**Recommendation**: Treat contract text, validator rules, diagnostic fixtures, and template/dogfood copies as one change unit. Require a failing fixture per diagnostic code, zero-error validation of default Playbooks in both locations, and reviewed reseeding whenever the upstream contract or default Playbooks change.

**To close**: W18 R6 implementation lands the contract, validator, and diagnostic catalog with per-code fixtures, and focused parity checks fail when contract text, validator behavior, or template/dogfood copies diverge.

**Resolution**: All five W18 R6 phases are implemented and the three statements of the contract are now coupled by machine checks that fail the suite when any one drifts. Contract text versus validator behavior: the contract's diagnostic table is machine-checked against the exported twenty-four-code catalog in both the upstream template and dogfood contract copies, the two copies are asserted byte-identical, and the Phase 5 parity walk of every contract section against the implemented layers found zero drift. Validator behavior versus fixtures: every catalog code has at least one failing fixture asserting exact code, severity, message, hint, and runnability, with completeness enforced at compile time and at runtime so a new code cannot land without a fixture. Template versus dogfood copies: the shipped-default sweeps enumerate playbook directories in both locations and assert zero errors, and the migrated default plus contract copies are byte-identical. Closed at W18 R6 P5 with the full CLI suite green (604 tests across 34 files), build and pack smoke green, and a manual UAT run of `playbook-catalog` and `playbook-validate` against the installed instance recorded in [the Phase 5 history record](../assets/archive/history/2026-07-01-w18-r6-p5-tests-fixtures-and-verification.md).

### R-019 Run-State Relocation Depends on an Unlanded Global Store

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [35-revise-run-playbook-state-machine.md](./35-revise-run-playbook-state-machine.md) relocates Playbook run state to the global store at `~/.make-docs/`, keyed by a stable project identifier plus a run identifier, with no in-repo copy and a test asserting nothing is written under `.make-docs/runs/` or any repository path. The Runtime and Global Store lineage has now landed as W18 R10: [38-revise-global-store-and-project-state.md](./38-revise-global-store-and-project-state.md) owns the store at `~/.make-docs/` with its global config, global manifest, and SQLite database, the schema version and migration strategy, WAL concurrency and locking discipline, graceful recovery, and the manifest-minted stable project identifier that is never path-keyed, and its unified project-state model carries Playbook run-state and work-execution evidence as two facets of one schema. W18 R10 P1 has now landed the store bootstrap and database as `packages/cli/src/store/`: the `~/.make-docs/` bootstrap creates the global config, global manifest, and SQLite database on every installer apply, the database carries a recorded schema version with append-only transactional migrations, WAL concurrency with a documented locking discipline, explicit newer-schema refusal, and corrupt-database quarantine and recovery, and schema version 1 already includes the `playbook_runs` table keyed by project identifier plus run identifier with an opaque record payload, exposed through the module's public seam for W18 R7 run-state storage. W18 R10 P2 has now landed the manifest-minted stable project identity: `mintProjectId()` mints a random identifier exactly once, on the first apply that writes the project's `.make-docs/manifest.json`, records it as `projectId` (pre-identifier installs gain it on their next manifest-writing apply with a one-time migration notice, every re-apply preserves it verbatim, and lifecycle reads never mint), and `resolveProjectIdentity` in `packages/cli/src/store/project-identity.ts` is the read-only resolver seam — returning `resolved`, `unminted`, `no-manifest`, or `unreadable` and never minting or touching the database — that W18 R7 run-state storage and the W18 R11 work operations consume. W18 R10 P3 has now landed the unified project-state model and evidence migration: `packages/cli/src/store/project-state.ts` and `state-rows.ts` carry both facets on schema version 1 with one migration path, the run-state storage seam W18 R7 consumes is live — `createPlaybookRunRecord`, `readPlaybookRunRecord`, `transitionPlaybookRunRecord`, and `listPlaybookRunRecords`, keyed by project identifier plus run identifier with the record payload fully opaque so the runner lineage owns its shape and progression semantics — the `checkpoint` operation writes work-execution evidence to the store instead of `.make-docs/runs/<wave-slug>/state.json` with no repository-path fallback (an unresolvable identity or unavailable store fails the mutating operation explicitly), and the install-registry mirror upsert deferred from P2 is wired into the CLI apply flow immediately after the store bootstrap. W18 R10 P4 has now landed the lifecycle and privacy behavior seam-first, because the command tree that names `setup remove` and the tool-level `uninstall`/`update` is owned by W18 R11: `pruneProjectFromStore` and `removeGlobalStore` in `packages/cli/src/store/lifecycle.ts` are the seams those commands will surface — pruning deletes exactly one project's rows across all three tables in one transaction and accepts a pre-resolved identifier because uninstall must capture identity before the manifest is removed, while store removal unlinks only the fixed known store filenames, refuses a root carrying project `.make-docs/` markers, and is structurally incapable of deleting repository content — and today's repo-level `make-docs uninstall` prunes the target project's rows and always prints the store's disposition, so the store is never silently orphaned; R-LIFE-1's remove-or-prompt choice completes when the W18 R11 tool-level `uninstall` calls `removeGlobalStore`, with prompting deliberately deferred there as a recorded interpretation in the store README. Update migration and pre-v2 detection (R-LIFE-3) were verified at the existing `bootstrapGlobalStore` and `classifyCompatibilityState`/`guardCompatibilityDisposition` seams with no new code, PRD 32 backup, protection, and pruning behavior is byte-identical with the baseline suites unmodified, and the R-PRIV-1 local-only rule is documented in the store README Privacy section and structurally enforced by tests keeping store code and the CLI's one network-capable module mutually import-free. W18 R10 P5 has now landed the runtime-state guidance and verification, completing all five phases of the wave: the template `.make-docs/` routers (`packages/docs/template/.make-docs/AGENTS.md` and `CLAUDE.md`, dogfooded byte-identically) no longer name `.make-docs/runs/` as a runtime-state location — project `.make-docs/` retains `manifest.json`, `conflicts/`, and project config while run-state and work-execution evidence live in the machine-level global store — and the D11 verification suite `packages/cli/tests/store-verification.test.ts` plus extended packed-CLI validation in `scripts/smoke-pack.mjs` (sandboxed `MAKE_DOCS_HOME` for every packed-CLI invocation, store bootstrap with no repository-path state writes, template/dogfood router guidance parity, and an end-of-run assertion that no `.make-docs/runs/` exists under the target) prove the store contract end to end at both the module seams and the packaged surface. The item stays Open on its stated close bar: W18 R7 storage work has not yet built on the store — the Playbook runner still writes `.make-docs/runs/playbooks/**`, a boundary deliberately left to the gated W18 R7 relocation — so the R-TEST-5 no-repo-run-state assertion for Playbook runs remains outstanding. | The store prerequisite is fully resolved; what remains is the W18 R7 consumption: build run-state storage on the landed `packages/cli/src/store/` run-record seam, relocate the runner's `.make-docs/runs/playbooks/**` writes onto `playbook_runs`, and pass the R-TEST-5 no-repo-run-state assertion. PRD 35 defines only what run state requires of the store, and no interim repository-path fallback is ever shipped. |

**Issue**: The W18 R7 progression engine is specified against a global store that does not exist yet, so implementation pressure could either write run state back into the repository as an interim location, invent a provisional store schema or project-identifier scheme that later conflicts with the Runtime and Global Store design, or stall the engine entirely on store delivery.

**Why it matters**: An interim in-repo location would recreate the exact per-repo operational-noise pattern PRD 35 supersedes, a provisional identifier scheme would orphan run state for clones, moves, and worktrees once the real scheme lands, and either would leak into PRD 30 plugin delegation and W18 R1 runner implementation.

**Recommendation**: Treat the global store, its concurrency model, and the stable project identifier as blocking prerequisites for R-STORE-1 and R-STORE-2 implementation; keep the engine's operation semantics, mode execution, resume, and guardrail work separable so it can land against a storage seam, and never ship a repository-path fallback for run state.

**To close**: The Runtime and Global Store design lands and its implementation provides the store, locking, and identifier scheme; W18 R7 storage work builds on it and the R-TEST-5 no-repo-run-state assertion passes.

### R-020 W18 R3 Adversarial-Review Surface Exposure Predates the New Playbook, CLI, and State Architecture

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Deferred | W18 R3 is unimplemented (all four phases untouched, no history record) and is deferred and split. The adversarial-review contract work is architecture-independent: P2 defines surface-neutral candidate, verdict, persona, and history mechanics and needs no rewrite (PRD 31), and P1's PRD and register reconciliation should fold into the reconciliation pass for the new Playbook, CLI, and state designs rather than run standalone against a shifting PRD set. The surface-exposure and closeout work (P3, P4) depends on the operation registry, the run-playbook state machine, the packaging and adapter pipeline, and conformance defined by the [Run Playbook State Machine](../designs/2026-07-01-run-playbook-state-machine.md), [Packaging Compiler and Harness Adapters](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), [Global Store and Project State](../designs/2026-07-01-global-store-and-project-state.md), and [CLI Command Reorganization and Operation Registry](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md) designs, so it is deferred until those land, and P3 must be rewritten to target the new surfaces, with a Playbook as the recommended surface. Related forward risks: R-016, R-017, R-018, R-019. | After the new architecture is implemented, rewrite P3 and adjust P4 validation to expose adversarial review as a Playbook through the new run, package, and conformance path; fold P1 into the new PRD reconciliation; author P2 whenever convenient. |

**Issue**: W18 R3 P3 "optional surface exposure" and its instruction to delegate deterministic behavior to accepted CLI or shared-core operations predate the CLI reorganization into `setup`, `run`, `mcp`, `update`, and `uninstall`, the operation registry and shared core, the deterministic run-playbook state machine, the packaging and adapter redesign, and the pruning of the wave, phase, and closeout operations. Implementing P3 and P4 as written would build adversarial-review exposure on command shapes, operation names, and a runtime that are being replaced.

**Why it matters**: Building the surface half now would couple new work to superseded surfaces and create immediate rework, while the contract half (P2) is stable and the adversarial-review concept is not deprecated, so its value should not be discarded by retiring the whole backlog.

**Recommendation**: Keep W18 R3 and do not implement it wholesale ahead of the new architecture. Proceed with the contract half independently, folding P1's reconciliation into the new PRD pass, and defer P3 and P4 until the new Playbook, CLI, packaging, and state work lands, rewriting P3 to a Playbook-first surface. Exposing adversarial review as a Playbook also dogfoods the new run, package, and install pipeline.

**To close**: Adversarial review is exposed through the new architecture, as a Playbook and optionally a packaged distributable, with P3 rewritten accordingly and P4 validation updated, or W18 R3 is explicitly retired with its contract intent absorbed elsewhere.

### R-021 Adapter Contracts Can Regress to Assumed Paths and Outrun Conformance Evidence

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [36-revise-playbook-packaging-compiler-and-harness-adapters.md](./36-revise-playbook-packaging-compiler-and-harness-adapters.md) requires every adapter's paths, manifest shapes, and registration steps to be verified against the real harness, with each adapter declaration carrying a verification reference and status; an unverified adapter may produce only export-only or provisional output and never a support claim. The verified shapes are fixed: Codex plugins are `.codex-plugin/plugin.json` folders registered through a marketplace entry with skills bundles on `.agents/skills/{id}/SKILL.md`, Claude Code lowers to `.claude/plugins/{id}/plugin.json` and `.claude/skills/{id}/SKILL.md`, and Pi's richest container is an extension without hooks. Real-harness recognition, installation, and invocation evidence is owned by the conformance lineage, now active as W18 R9 through [37-enhance-playbook-and-package-conformance.md](./37-enhance-playbook-and-package-conformance.md): support tuples live in a queryable registry under `docs/assets/conformance/` with `provisional`, `implementation-validated`, and `conformance-validated` statuses derived from run verdicts, a tuple may reach `conformance-validated` only through the install-discover-invoke-uninstall evidence bar, verdicts of `inconsistent`, `unsupported`, or `blocked` never advance a tuple, and a meta-verification check asserts no tuple is marked `conformance-validated` without a qualifying recorded run. | Sequence public support wording for any generated-output tuple after the W18 R9 first-pass scenarios produce recorded evidence; until then every W18 R8 adapter support status stays provisional in the tuple registry and unit or integration tests are never cited as harness-recognition evidence per PRD 36 R-TEST-5 and PRD 37 R-LAYER-2. |

**Issue**: The triggering W18 R5 failure came from an assumed path template, and the same regression can recur: a new or edited adapter can declare plausible-looking paths or manifest shapes without re-verification, harness vendors can change their plugin contracts after verification, and passing unit tests can be misread as proof that a harness recognizes the generated output.

**Why it matters**: An unverified or stale adapter contract silently produces distributables no harness recognizes — the exact defect W18 R8 corrects — and a support claim made ahead of conformance evidence would overstate harness support to users while the conformance design that owns the evidence bar has not landed.

**Recommendation**: Treat the verification reference and status on every adapter declaration as mandatory review material, keep the fixture adapter's fail-closed scenarios in the required test suite, keep support statuses provisional and tuple-bound until conformance scenarios exist, and re-verify an adapter's contract whenever its declared paths, manifest shapes, or registration steps change.

**To close**: W18 R8 implementation lands verified Codex, Claude Code, and Pi adapters with verification references, the R-TEST-1 through R-TEST-4 suites pass, and the W18 R9 conformance requirements in [37-enhance-playbook-and-package-conformance.md](./37-enhance-playbook-and-package-conformance.md) are implemented with real-harness recognition scenarios recorded in the tuple registry for the claimed tuples.

### R-022 First-Pass Conformance Scenarios Depend on Real Harness Availability

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [37-enhance-playbook-and-package-conformance.md](./37-enhance-playbook-and-package-conformance.md) requires the first conformance pass to prove real user outcomes against the current product harnesses, Codex first: a generated skills bundle is discovered and invocable, a generated plugin installs through a marketplace and works in a new thread, generated dependency checks behave correctly in both directions, and uninstall and backup remove managed outputs cleanly. Scenarios that cannot run for a missing precondition report `blocked` rather than inventing evidence, Pi and additional harnesses are future scenarios whose absence must be reported rather than implied as covered, and a meta-verification check asserts the required scenarios exist and are runnable. | Keep the R-SCEN-1 scenarios, harness environments, and any faithful-simulation mechanics reviewed together so `blocked` verdicts stay honest and no unavailable scenario is silently marked as passing or covered. |

**Issue**: The required first-pass scenarios need a real or faithfully simulated harness, working credentials or environments, and marketplace plumbing; schedule pressure could substitute passing internal tests for the evidence bar, quietly narrow a scenario until it no longer proves the user outcome, or leave an unavailable scenario looking covered instead of `blocked`.

**Why it matters**: Any of those substitutions recreates the files-written-equals-works failure at the evidence layer itself — the tuple registry would then certify support that no harness has demonstrated, which is the exact defect the W18 R9 design exists to prevent.

**Recommendation**: Treat harness availability as a scenario precondition that resolves to `blocked` when unmet, document any faithful-simulation mechanics as an implementer choice per D8 with review, keep R-BAR-2 and R-LAYER-2 absolute so internal tests never advance a tuple, and keep the R-TEST-2 runnability check in the required suite.

**To close**: The first pass runs against Codex with recorded runs meeting the install-discover-invoke-uninstall bar for the R-SCEN-1 scenarios, unavailable harness scenarios show `blocked` in the tuple registry, and the R-TEST-2 check passes.

### R-023 The Global Store Could Drift Into a Second Source of Truth or Lose Evidence in the Checkpoint Migration

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Closed | [38-revise-global-store-and-project-state.md](./38-revise-global-store-and-project-state.md) fixes the guards: the install and directory registry is a mirror and index whose canonical source remains each project's `.make-docs/manifest.json` and must not become a second source of truth (R-MIR-1), run-state and work-execution evidence are relocated and canonical in the store with no in-repo copy (R-MIR-2), the two project-state facets share one model rather than becoming parallel stores (R-PS-2), and the per-repo checkpoint JSON is not ported verbatim — its genuine-state fields (validation-passed, review-passed or waived, closeout-approved) become work-execution evidence keyed to the canonical work-item identity while its re-derivable fields are dropped per [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md). W18 R10 P1's schema version 1 encodes the guards structurally: the `projects` table is mirror-only, keyed by the manifest-minted `project_id` with `root_path` as secondary lookup metadata never used as the key, and the `playbook_runs` and `work_evidence` facets share one database, one keying discipline, and one append-only migration path with a single recorded schema version; W18 R10 P2 has now made identity resolution structurally path-free: `resolveProjectIdentity` reads only the manifest-minted `projectId` — a random identifier never derived from path, git remote, or environment, so clone/move/worktree stability holds by construction — and no store table or query resolves project identity from a directory path, with `root_path` stored solely as secondary lookup metadata; W18 R10 P3 has now closed the three items that were open for it: `readAuthoritativeInstallRecord` always resolves a project's install record from its `.make-docs/manifest.json` and never from the mirror row, `rebuildProjectRegistry` drops all mirror rows and re-mirrors from project manifests in one transaction without touching the relocated-canonical facets — demonstrating rebuild-from-manifests, with the mirror-versus-relocated role of every table encoded in `PROJECT_STATE_TABLE_ROLES` — and the checkpoint-to-evidence field mapping was reviewed against the inventory's keep/remove disposition and recorded as a table in [the store module README](../../packages/cli/src/store/README.md): validation, review, closeout, commit, push, notes, and the wave-level commit policy are kept as evidence kinds, while phase status, resolver outputs, and file-format bookkeeping are dropped as re-derivable. Migration is lazy and loss-averse by rule: the mutating `checkpoint` operation migrates a legacy `.make-docs/runs/<wave-slug>/state.json` by writing evidence rows only for kinds the store does not already hold — legacy data never overwrites recorded store evidence — then deletes the file so relocated-canonical state keeps no in-repo copy, while read-only operations consult unmigrated files read-only and never write or delete them. W18 R10 P4 has now landed the lifecycle assertions that were open for it (R-TEST-4): `packages/cli/tests/store-lifecycle.test.ts` proves pruning against a store holding rows for multiple projects — `pruneProjectFromStore` deletes exactly the target project's rows from all three tables in one transaction while every other project's rows survive — and proves uninstall with store handling active is non-destructive to repository content, with root `.backup/**` and `.make-docs/backup/**` both surviving and the pre-existing uninstall, backup, and audit suites unmodified as the PRD 32 byte-identity baseline; `removeGlobalStore` is additionally structurally incapable of deleting repository content because it unlinks only fixed known store filenames and refuses roots carrying project `.make-docs/` markers. Every literal to-close assertion passed at P4 — R-TEST-1 through R-TEST-4, the demonstrated rebuild-from-manifests, and the reviewed checkpoint-to-evidence mapping — and the P5 verification pass the P4 close bar required has now re-proven the guards end to end: the D11 suite `packages/cli/tests/store-verification.test.ts` proves R-TEST-1 by repo-snapshot equality (checkpoint evidence and Playbook run records written through the real seams leave the repository byte-for-byte untouched), R-TEST-2 move/clone survival with the stored `root_path` proven secondary to the manifest-minted identity, R-TEST-3 missing-and-corrupt-database degradation reported as recoverable operational-state loss with the repository staying readable, and R-TEST-4 multi-project prune scoping with `removeGlobalStore` leaving repositories byte-identical; the extended `scripts/smoke-pack.mjs` re-proves store bootstrap, no repository-path state writes, and template/dogfood router guidance parity against the packed CLI; and the guidance refresh landed alongside it, so the shipped `.make-docs/` routers now describe exactly the proven behavior. | Closed at W18 R10 P5. Keep the mirror subordinate to project manifests in every registry read path, keep both facets on the shared project-state schema and migration path, and keep the recorded checkpoint-to-evidence mapping stable; the D11 suite and the packed-CLI smoke assertions are the standing regression guards. |

**Issue**: The store plays two roles with opposite authority rules — mirror for install records, canonical for operational state — and implementation pressure can blur them: registry reads could start trusting the mirror over the manifest, the run-state and evidence facets could grow separate ad-hoc schemas, or the checkpoint-JSON migration could either drop genuine sign-off evidence or port re-derivable noise the disposition removed.

**Why it matters**: A mirror treated as truth would misreport installs after out-of-band project changes, parallel facet schemas would recreate the two-vocabularies-two-migration-paths problem the unified model exists to prevent, and lost sign-off evidence is unrecoverable by definition — it is exactly the state that cannot be re-derived from the repository or git.

**Recommendation**: Implement the registry as rebuildable cache semantics with the manifest as the always-authoritative source, land both facets against one project-state schema with one migration path, and treat the checkpoint field disposition (keep genuine state, drop derivation) as reviewed mapping work rather than a mechanical port.

**To close**: W18 R10 implementation lands the store with the R-TEST-1 through R-TEST-4 assertions passing, registry rebuild-from-manifests behavior is demonstrated, and the checkpoint-to-evidence migration is reviewed against the inventory's keep/remove disposition with no genuine-state field lost.

**Resolution**: All five W18 R10 phases are implemented and the guards this item named are proven end to end and held by standing regression checks. Mirror subordination: `readAuthoritativeInstallRecord` resolves install records only from each project's `.make-docs/manifest.json`, `rebuildProjectRegistry` demonstrates lossless rebuild-from-manifests, and every table's mirror-versus-relocated role is encoded in `PROJECT_STATE_TABLE_ROLES`. No repository run-state: the D11 suite `packages/cli/tests/store-verification.test.ts` proves by repo-snapshot equality that checkpoint evidence and Playbook run records write only to the store, and `scripts/smoke-pack.mjs` asserts the packed CLI bootstraps the store, writes no repository-path state, ships router guidance byte-identical to the dogfood copies, and leaves no `.make-docs/runs/` under the target. Evidence integrity: the checkpoint-to-evidence field mapping was reviewed against [the migrated-operations inventory](../assets/artifacts/migrated-operations-inventory.md) and recorded in [the store module README](../../packages/cli/src/store/README.md), lazy migration writes only kinds the store does not already hold and never overwrites recorded evidence, and R-TEST-4 proves prune scoping and non-destructive store removal with the PRD 32 baseline suites unmodified. Closed at W18 R10 P5 with the full CLI suite green (610 tests across 35 files), build and pack smoke green, and a manual UAT run of install, checkpoint, and uninstall against an isolated store recorded in [the Phase 5 history record](../assets/archive/history/2026-07-01-w18-r10-p5-runtime-state-guidance-and-verification.md).

### R-024 The Command-Surface Hard Cutover Can Strand Consumers or Leave a Half-Migrated Surface

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | [39-revise-cli-command-reorganization-and-operation-registry.md](./39-revise-cli-command-reorganization-and-operation-registry.md) fixes the guards: there are no back-compatibility aliases, so the old spellings — the flat `operations` and `mcp`-beside-install top level and the project-level `uninstall` — are removed rather than aliased (R-MIG-1); `update`, `setup`, and `setup reconfigure` detect pre-v2 configurations by fingerprint and present a warning-and-backup-or-cancel flow instead of upgrading silently (R-MIG-2); MCP tool names derive from the same registry identifiers so the MCP renames cannot diverge from the CLI renames (R-MIG-3); the operation core, the registry, and the reorganized tree land first with all retained operation logic behind the registry in the same wave so no half-migrated state exists (R-SEQ-1); and `uninstall`'s new machine-footprint meaning is a hard cutover that confirms before removing, never deletes repository content, and never guesses before a destructive global change (R-SELF-1, R-SELF-3). W18 R11 P1 landed the first half of the R-SEQ-1 gate: the registry and shared core exist, every retained operation (twelve playbook, three package, three work identifiers) is registered with typed inputs, mutation classifications, and uniform context-enforced gating, and both existing surfaces — the legacy `operations` command and the MCP tools — now route the retained operations through `invokeOperation`, so no retained operation remains hand-wired; the pruned cluster deliberately stays hand-wired on the legacy surface until the pruning phase removes it. W18 R11 P2 landed the five-command tree: `setup`/`setup reconfigure`/`setup skills`/`setup backup`/`setup remove` carry the install lifecycle unchanged, `run` is derived from the registry (identifier segments are the command path, with an adapter/registry parity test), bare invocation is context-aware and never auto-syncs, the old `reconfigure`/`skills`/`backup`/`operations` spellings and the project-level `uninstall` meaning fail with new-spelling guidance, and top-level `update`/`uninstall` parse as reserved self-management commands that refuse to act until the self-management phase lands their behavior. W18 R11 P3 landed that behavior: `uninstall` removes the machine footprint through `removeGlobalStore` behind an explicit confirmation listing the store path and detected binary, reports no-binary for remote execution, withholds the binary action and prints the exact command when install-manager ownership is ambiguous, and never touches repository content — completing the R-LIFE-1 remove-or-prompt obligation carried from W18 R10 P4; `update` detects and delegates to the owning install manager, prints the exact command on ambiguity, reports nothing-persistent for remote execution, and applies pending store schema migrations on every run; pre-v2 installs (fingerprinted from classifier evidence as manifest schema version 1 or a v1 state) hit the R-MIG-2 warning-and-backup-or-cancel choice on `setup`, `setup reconfigure`, and `update` with non-interactive runs never upgrading silently; and the t5 verification confirmed no removed spelling or alias survives in the parser or help. | Keep the no-alias removal, pre-v2 detection, registry-derived MCP renames, same-wave registry migration, and uninstall-confirmation behavior in one implementation wave, and update template-owned routers, guides, and READMEs naming old spellings upstream in `packages/docs/template/` in that same window. Carry `playbook.validate` onto the reorganized `run playbook` surface: PRD 34 R-MODEL-6 mandates the operation and it is registered, but PRD 39 R-RUN-1's verb enumeration omits it, so the surface phase must include it deliberately rather than dropping it by literal reading. The W18 R10 P4 carried item is resolved by P3: the tool-level `uninstall` calls `removeGlobalStore` and owns the prompt. The remaining exposure is the hand-maintained MCP tool list, which the derivation phase replaces, plus the pruning-absence and closing R-TEST checks. |

**Issue**: The reorganization is a hard cutover — old command spellings are removed with no aliases, `uninstall` changes meaning from project removal to machine-footprint removal, and every operation moves behind the registry — so schedule pressure could ship a partial rename where some surfaces speak old spellings and some new, leave MCP tool names on the old hand-maintained list, skip the pre-v2 warning flow, or leave template-owned docs teaching removed commands.

**Why it matters**: A half-migrated surface is exactly the drift the registry exists to end and would strand Playbook steps, MCP consumers, and documentation on spellings the parser no longer accepts; and a user typing the old project-level `uninstall` against the new machine-level meaning without the confirmation guard would face a destructive surprise rather than a rename.

**Recommendation**: Treat R-SEQ-1 as a delivery gate, not a preference: land the core, registry, and tree together, derive or conformance-check both surfaces from the registry in the same change, implement the pre-v2 fingerprint warning before or with the renames, and carry the upstream template spelling updates in the same backlog so no shipped router or README survives with old commands.

**To close**: W18 R11 implementation lands the five-command tree with R-TEST-1 through R-TEST-4 passing — registry parity with no one-surface-only operation, no lifecycle commands under `run`, the pre-v2 warning-and-choice flow, confirmed non-destructive `uninstall`, and the pruned operations absent — and the template-owned command-spelling updates are dogfooded from upstream.

### R-025 Cross-Artifact Coordinate Handoffs Can Drift From Their Assigned Waves and PRDs

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Design `Coordinate Handoff` lines, plan and work directory coordinates, and PRD frontmatter can fall out of sync because nothing deterministically verifies they agree; the W18 R6-R11 designs kept `unresolved` handoffs after their coordinates were assigned and PRDs 34-39 were generated, and the four predecessor designs likewise required a manual tidy. The proposed mitigation is a deterministic coordinate-consistency check: a `run` validation operation that confirms each design's assigned coordinate and PRD match its downstream plan, PRD, and work backlog, surfaced also as a pre-commit hook so drift fails fast. By the [NORTHSTAR](../assets/artifacts/NORTHSTAR.md) filter this earns a slot, being a fiddly, reused, correctness-critical fact-check rather than agent-derivable prose. | After the operation registry (W18 R11) and the Playbook and agentics surfaces land, add the coordinate-consistency validation operation and a pre-commit hook, and consider shipping it as a first-party Playbook that dogfoods the run and packaging pipeline. |

**Issue**: Nothing deterministically verifies that a design's assigned wave and PRD agree with its downstream plan, PRD, and work artifacts, so coordinate handoffs, directory coordinates, and PRD frontmatter can drift; the W18 R6-R11 designs demonstrated this by keeping `unresolved` handoffs after coordinates were assigned.

**Why it matters**: Coordinate drift misleads implementers about which wave and PRD own a design, which is the class of cross-artifact inconsistency that contributed to the earlier W18 drift, and catching it by hand does not scale.

**Recommendation**: Implement a deterministic coordinate-consistency check as a `run` validation operation over design, plan, PRD, and work artifacts, and enforce it with a pre-commit hook; a first-party Playbook wrapper is a natural early dogfood of the run and packaging pipeline.

**To close**: A coordinate-consistency operation exists, is exposed on the CLI and as a hook, and fails when a design's coordinate or PRD disagrees with its downstream plan and work artifacts.

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
- `docs/prd/32-revise-lifecycle-backup-state-agentics-pruning.md`
- `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`
- `docs/prd/34-revise-playbook-contract-and-model.md`
- `docs/prd/35-revise-run-playbook-state-machine.md`
- `docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md`
- `docs/prd/37-enhance-playbook-and-package-conformance.md`
- `docs/prd/38-revise-global-store-and-project-state.md`
- `docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md`
- `docs/designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md`
- `docs/designs/2026-06-30-playbook-contract-and-model.md`
- `docs/designs/2026-07-01-run-playbook-state-machine.md`
- `docs/designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md`
- `docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md`
- `docs/designs/2026-07-01-playbook-and-package-conformance.md`
- `docs/designs/2026-07-01-global-store-and-project-state.md`
- `docs/designs/2026-07-01-cli-command-reorganization-and-operation-registry.md`
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
- `docs/designs/2026-06-27-lifecycle-backup-state-and-agentics-pruning-correction.md`
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
- `docs/plans/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/00-overview.md`
- `docs/plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md`
- `docs/work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md`
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
