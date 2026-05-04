# 03 Open Questions and Risk Register

## Purpose

This document centralizes confirmed drift, unresolved product-contract questions, resolved decisions, clean-room rebuild risks, and closeout findings across install/profile state, template assets, CLI command routing, skills distribution, dogfood operations, and release packaging. The current system is the combined behavior of `docs/prd/01-product-overview.md`, `docs/prd/02-architecture-overview.md`, `packages/cli/src/cli.ts:77-244`, `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/skill-catalog.ts:33-138`, `packages/cli/src/utils.ts:33-55`, and `scripts/smoke-pack.mjs:60-246`, so drift in any one layer can mislead contributors or break packaged behavior.

The fixed-core overview layer now exists, but this living register still carries the unresolved cross-cutting gaps those overview docs intentionally call out, especially where current code, current READMEs, packaged artifacts, and future-facing workspace plans do not yet agree. Agents should update this file directly for newly discovered or resolved gaps instead of creating separate questions, decisions, risks, gaps, or architecture-decision files unless the user explicitly asks for a new convention.

Status values are `Open`, `Confirming`, `Deferred`, and `Closed`. `Closed` requires an explicit recorded resolution.

## Confirmed Drift

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference controls that are becoming invariant managed assets.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for skill registry and selection behavior that is moving from required/optional categories to one selected-skill set.

### README Wording Understates the Live Idempotent Sync Model

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Align README wording with the planner and CLI output model. |

**Issue**: `README.md:101-107` and `packages/cli/README.md:84-89` say unchanged managed files are updated in place, but `packages/cli/src/planner.ts:19-189` plans `noop` for exact matches and `packages/cli/src/cli.ts:725-805` reports `Already current`.

**Why it matters**: Contributors can misread the installer as more write-heavy than it really is.

**Recommendation**: Rewrite the affected README text to describe exact-match no-op behavior and update-only-when-needed behavior.

**To close**: README text matches the current planner behavior and focused CLI tests still pass.

### Public Command Guidance Lags the Shipped Command Taxonomy

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Audit public command docs against the live parser and help output. |

**Issue**: `packages/cli/src/cli.ts:894-1019` exposes `skills`, `backup`, and `uninstall`, while `README.md:73`, `packages/cli/README.md:56`, and older docs still frame the product mostly as install/reconfigure/dry-run and still discuss removed `init` or `update` paths rejected by `packages/cli/src/cli.ts:589-612`.

**Why it matters**: Operator docs and design lineage can point people toward commands the parser no longer accepts.

**Recommendation**: Bring public docs and package README command examples in line with the no-command install flow and explicit lifecycle commands.

**To close**: Public command docs only describe accepted command paths or clearly label archived command history as historical.

### Template and Reference Mode Labels Promise More Than the Selector Enforces

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md). | Verify whether the W14 asset-selection simplification fully removed or reworded the public mode surface. |

**Issue**: The wizard exposed `templatesMode` and `referencesMode` choices in `packages/cli/src/wizard.ts:354-889`, but `packages/cli/src/rules.ts:130-194` ignored `templatesMode` and used `referencesMode` only to optionally add `docs/assets/references/harness-capability-matrix.md`.

**Why it matters**: The user-visible control surface was broader than the live implementation.

**Recommendation**: Treat the W14 asset-selection simplification as the likely resolution path, then remove this item or mark it closed only after the current code/docs confirm the mismatch no longer exists.

**To close**: Current wizard, manifest, rules, README, and tests agree on asset-selection behavior.

### ResolvedAsset Asset Class Is Stale Relative to the Catalog

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide whether `static` is future surface or dead type surface. |

**Issue**: `packages/cli/src/types.ts:75-80` allows `"static"`, but `packages/cli/src/catalog.ts:7-20` emits only `"buildable"` and `"scoped-static"`.

**Why it matters**: Type-level contracts no longer cleanly describe actual asset generation behavior.

**Recommendation**: Shrink the union unless a concrete upcoming feature needs a third live value.

**To close**: The type union, catalog output, and tests agree on every live asset class.

### Skills Delivery Diverges From Earlier Bundled-Payload Expectations

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide and document the long-term skills delivery contract. |

**Issue**: Runtime behavior comes from `packages/cli/src/skill-registry.ts:25-134` and `packages/cli/src/skill-resolver.ts:40-226`, which load a packaged registry and fetch skill payloads remotely; earlier design material such as `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md` described bundling skill payloads into the CLI package.

**Why it matters**: Packaging, offline behavior, release validation, and security expectations depend on which model is actually intended.

**Recommendation**: Choose remote-fetch, bundled-local, or dual-mode fallback as the explicit product contract and align release validation around it.

**To close**: Registry, resolver, package metadata, release docs, and tests all reflect the selected model.

### Packaged README and Maintainer README Do Not Match the Current Tarball Allowlist

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Update package-surface docs after confirming intended tarball contents. |

**Issue**: `packages/cli/package.json:9-15` ships `dist`, `template`, registry files, and `README.md`, but `packages/cli/src/README.md:181-204` and `packages/cli/README.md:91-120` still describe tarball-root `docs/`, `AGENTS.md`, and `CLAUDE.md`.

**Why it matters**: Maintainers and consumers can reason about the wrong package contents.

**Recommendation**: Treat `packages/cli/package.json` and pack/smoke behavior as authoritative, then revise README package-surface guidance.

**To close**: `npm pack --dry-run` output and README package-surface descriptions agree.

### Dogfood Re-Seeding Remains Manual Without a Freshness Proof

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Manual re-seeding remains intentional for now. | Add or improve parity checks that prove dogfood freshness without removing reviewability. |

**Issue**: `packages/docs/README.md:86-121` makes manual re-seeding an intentional maintainer workflow, but no automated check proves repo-root `docs/assets/**` still matches `packages/docs/template/docs/assets/**` after template edits.

**Why it matters**: The dogfood surface can drift silently between template changes and re-seed passes.

**Recommendation**: Keep manual propagation, but add focused parity tests for contract files that should remain identical.

**To close**: A focused check catches stale dogfood template/reference copies after package-template edits.

### Historical Hidden-Dot Paths Remain Easy to Mistake for Current Routing

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Add clearer historical disclaimers or repair active links that imply hidden-dot paths are live. |

**Issue**: Current state lives under `docs/assets/**` and root `.make-docs/**` per `README.md:16-46` and `packages/cli/src/manifest.ts:18-20`, yet migration docs still refer to `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json`.

**Why it matters**: Contributors can accidentally treat migration history as live contract.

**Recommendation**: Ensure active docs consistently point at `docs/assets/**` and archived docs are clearly historical when linked.

**To close**: Active docs no longer imply hidden-dot paths are current; historical links remain only as lineage.

### Future packages/content Boundary Is Undefined

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Deferred | `packages/content/` is reserved but not active product surface. | Define the package/content contract before adding rendered content fragments. |

**Issue**: `README.md:10-17` reserves `packages/content/`, but there is no selector in `packages/cli/src/catalog.ts:64-85`, no renderer in `packages/cli/src/renderers.ts:54-570`, and no command/help surface in `packages/cli/src/cli.ts:894-1019`.

**Why it matters**: Future rendered content fragments still have no shipping or ownership contract.

**Recommendation**: Leave the package reserved until a specific content-fragment design exists.

**To close**: A future design or PRD defines ownership, packaging, rendering, and dogfood rules for `packages/content/`.

### Skills Authoring and Release Guidance Is Thin Relative to Runtime Dependence

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Expand maintainer guidance for adding and releasing package-shipped skills. |

**Issue**: `packages/skills/README.md` is minimal, while the runtime depends on the structure of `packages/skills/archive-docs/`, `packages/skills/decompose-codebase/`, `packages/skills/closeout-commit/`, and `packages/skills/closeout-phase/` via `packages/cli/skill-registry.json`, `packages/cli/src/skill-catalog.ts:90-138`, and `packages/cli/src/skill-resolver.ts:40-226`.

**Why it matters**: Adding or changing a skill still relies too much on tribal knowledge across registry, assets, and packaging steps.

**Recommendation**: Add a maintainer guide or package README section that describes source-of-truth files, registry updates, mirrors, and validation.

**To close**: New skill authors can follow one repo-native guide from package files through registry, tests, dogfood mirrors, and release checks.

## Open Questions

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for whether template and reference modes should remain public options.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for selected-skill UX and the `selectedSkills` manifest requirement; remote source policy remains an unresolved delivery-security question.

### What Is the Long-Term Skills Delivery Contract?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Choose remote-fetch, bundled-local, or dual-mode fallback. |

**Question**: What is the intended long-term skills delivery contract: remote-fetch, bundled-local, or dual-mode fallback?

**Why it matters**: Current runtime is remote-fetch (`packages/cli/src/skill-registry.ts:134`, `packages/cli/src/skill-resolver.ts:6-226`), while prior design work expected bundled payloads. Release policy, offline behavior, integrity checks, and smoke-pack acceptance all depend on this decision.

**Recommendation**: Make one delivery mode authoritative before public release hardening.

**To close**: The chosen delivery model is reflected in resolver behavior, package metadata, release docs, and tests.

### Should Template and Reference Modes Remain Public Options?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Confirming | Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md). | Verify current code and docs after the W14 simplification. |

**Question**: Should `templatesMode` and `referencesMode` remain public options, and if so what should `required` vs `all` actually mean?

**Why it matters**: The option surfaces existed in `packages/cli/src/wizard.ts:354-889`, but selector behavior was narrow in `packages/cli/src/rules.ts:130-194`. The current UI may be broader than the live rule set, but removing the knobs also changes the public contract.

**Recommendation**: Use the W14 asset-selection simplification as the controlling decision and close this only after the current code confirms the removed or invariant behavior.

**To close**: Current wizard, manifest, rules, docs, and tests agree on asset and reference selection.

### Should ResolvedAsset Keep a Third Asset Class?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Decide whether `static` should be removed or implemented. |

**Question**: Does `ResolvedAsset.assetClass` need a third live value, or should the type shrink to two?

**Why it matters**: `packages/cli/src/types.ts:75-80` and `packages/cli/src/catalog.ts:7-20` disagree today. This is either an unfinished feature hook or dead type surface.

**Recommendation**: Shrink to live values unless a near-term feature needs `static`.

**To close**: Type declarations, catalog behavior, and tests agree.

### How Should packages/content Participate in the Product?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Deferred | Reserved for future content-fragment work. | Draft a future design before making `packages/content/` active. |

**Question**: How should `packages/content` participate in the product?

**Why it matters**: `README.md:10-17` reserves the workspace, but there is no runtime integration point in `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/renderers.ts:54-570`, or `scripts/smoke-pack.mjs:60-246`. Without an explicit answer, later content work will invent its own packaging and dogfood rules.

**Recommendation**: Keep it reserved and inactive until a specific feature requires it.

**To close**: A future design defines content ownership, package inclusion, rendering, dogfood, and release checks.

### How Should Maintainers Prove Dogfood Freshness?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Manual re-seeding remains intentional for now. | Add contract-level parity checks for dogfood/template drift. |

**Question**: How should maintainers prove dogfood freshness if manual re-seeding remains the chosen workflow?

**Why it matters**: `packages/docs/README.md:86-121` values reviewability and selective propagation, but current checks such as `scripts/check-instruction-routers.sh:1-58` do not prove template parity. The repo needs a deliberate stance on reviewability versus automated freshness.

**Recommendation**: Preserve manual review while expanding consistency tests for files that are expected to match exactly.

**To close**: CI or focused local tests fail when dogfood contract files drift from the package template unexpectedly.

### What Defines Public Release Readiness?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Resolve metadata, license, and first-release prerequisites. |

**Question**: What minimum metadata and legal prerequisites define public release ready for `make-docs`?

**Why it matters**: `packages/cli/package.json:2-25` still lacks `repository`, `homepage`, and `bugs`; license files are absent; the first-publish design still treats these as prerequisites. The package can be built and smoke-tested today, but public-release readiness remains ambiguous.

**Recommendation**: Treat this as a release-readiness checklist item before the first public npm publish.

**To close**: Package metadata, license posture, registry-name verification, and first-release version/tag strategy are documented and implemented.

### How Should Remote Skill Sources Be Constrained?

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | Define source protocol, pinning, and integrity policy for remote skills. |

**Question**: How should remote skill sources be constrained?

**Why it matters**: `packages/cli/src/skill-registry.ts:134` accepts `http://`, `https://`, `github:`, and `url:`, while `packages/cli/src/skill-resolver.ts:6` defaults GitHub sources to `main` and `packages/cli/src/skill-resolver.ts:226` performs unauthenticated fetches. Mutable refs and permissive protocols have security and reproducibility implications.

**Recommendation**: Define a constrained source policy before public release or before relying on remote skills for high-trust workflows.

**To close**: Registry schema, resolver validation, docs, and tests enforce the chosen policy.

## Rebuild Risks

### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) where rebuild risk depends on the old `optionalSkills` or required/default skill assumptions; home-scoped skill ownership and audit safety remain active constraints.

### Home-Scoped Skills Are Easy to Drop From a Clean-Room Rebuild

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Home-scoped skill ownership remains active product behavior. | Preserve home-scope backup, audit, and manifest handling in any rebuild. |

**Issue**: A rebuild that assumes all managed files live under the target repo will break global skill installs, backup mapping, and uninstall safety.

**Why it matters**: Home-scoped paths are encoded in `packages/cli/src/skill-catalog.ts:33-46`, `packages/cli/src/manifest.ts:135-183`, `packages/cli/src/audit.ts:745-796`, and `packages/cli/src/backup.ts:252-300`.

**Recommendation**: Treat home-scope skill management as first-class lifecycle behavior, not an incidental install detail.

**To close**: Any rebuild plan explicitly covers project-scope and home-scope managed skill paths.

### Audit Removability Depends on Regenerated Canonical Skill Content

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Current safety model depends on regeneration. | Revisit if skill delivery or content resolution changes. |

**Issue**: If skills delivery, registry, or content resolution changes without a matching audit update, uninstall and backup can become too conservative or too destructive.

**Why it matters**: The current model is anchored in `packages/cli/src/planner.ts:393-408`, `packages/cli/src/install.ts:96-163`, and `packages/cli/src/audit.ts:745-793`.

**Recommendation**: Keep audit, backup, install, and skill resolution changes coupled in the same implementation plan.

**To close**: The audit model is documented and tested for the selected skill delivery contract.

### Dev-Template and Packed-Template Resolution Can Diverge

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Dual dev/packed resolution remains active. | Preserve smoke-pack checks for template changes. |

**Issue**: Testing only local dev paths can miss failures that appear only after `prepack` copies the template into `packages/cli/template`.

**Why it matters**: Local resolution uses `packages/cli/src/utils.ts:33-55`, while packed artifacts depend on `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32`, and `scripts/smoke-pack.mjs:60-246`.

**Recommendation**: Run both focused dev-path tests and pack/smoke validation for release-sensitive template changes.

**To close**: Release validation proves both local and packed template resolution.

### Path Knowledge Is Duplicated Across Modules and Docs

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Literal path duplication remains accepted but risky. | Add parity checks when moving or adding template-owned paths. |

**Issue**: Adding or moving a template-owned path can drift across `rules.ts`, `catalog.ts`, `renderers.ts`, tests, package docs, and dogfood copies.

**Why it matters**: The duplication spans `packages/cli/src/rules.ts:8-194`, `packages/cli/src/catalog.ts:7-85`, `packages/cli/src/renderers.ts:40-570`, `packages/cli/tests/consistency.test.ts:33-77`, and `packages/docs/README.md:86-121`.

**Recommendation**: Prefer focused consistency tests when a full centralization refactor is not in scope.

**To close**: Either path constants are centralized or tests cover every duplicated path surface that matters.

### The No-Command CLI Workflow Is Easy to Simplify Incorrectly

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | No-command install remains the public default. | Preserve parser rejection and help-output tests. |

**Issue**: Reintroducing `init`/`update`, collapsing wizard review with generic apply confirmation, or treating lifecycle commands as install flags would break the shipped public UX.

**Why it matters**: This behavior is anchored in `packages/cli/src/cli.ts:119-244`, `packages/cli/src/cli.ts:589-612`, `packages/cli/src/wizard.ts:487-550`, `packages/cli/src/backup.ts:86-127`, and `packages/cli/src/uninstall.ts:63-116`.

**Recommendation**: Keep install/reconfigure flow, lifecycle commands, and parser rejection behavior covered by focused CLI tests.

**To close**: Public help, parser behavior, docs, and tests all describe the same command model.

### Backup and Uninstall Depend on a Single Reviewed Audit Snapshot

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Single reviewed audit snapshot remains the safety model. | Keep backup/uninstall implementation and docs aligned around one audit snapshot. |

**Issue**: Re-auditing between warning, backup, and delete steps can invalidate what the user already approved and break the current safety model.

**Why it matters**: The behavior depends on `packages/cli/src/backup.ts:86-127`, `packages/cli/src/uninstall.ts:81-116`, and `packages/cli/src/audit.ts:41-79`.

**Recommendation**: Treat any re-audit refactor as a lifecycle-safety change requiring explicit design and tests.

**To close**: Backup and uninstall docs/tests continue to show one reviewed audit snapshot driving subsequent actions.

### Manual Dogfood Re-Seeding Can Hide Product Drift

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | Manual re-seeding remains intentional for reviewability. | Add proof points for dogfood/template freshness. |

**Issue**: Because repo-root `docs/` is both a maintainer workspace and a product rehearsal surface, stale dogfood files can make local behavior look correct while the shipped template has drifted.

**Why it matters**: Dogfood and template behavior are described in `README.md:6-46`, `packages/docs/README.md:50-121`, and `packages/cli/src/utils.ts:33-55`.

**Recommendation**: Preserve manual review but add tests that catch contract drift between template and dogfood copies.

**To close**: Template contract changes cannot pass focused tests while dogfood copies are stale.

## Source Anchors

- `README.md:6-46`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
- `packages/docs/README.md:50-121`
- `packages/skills/README.md`
- `packages/cli/package.json:9-25`
- `packages/cli/src/cli.ts:77-244`
- `packages/cli/src/rules.ts:130-194`
- `packages/cli/src/catalog.ts:64-85`
- `packages/cli/src/renderers.ts:54-570`
- `packages/cli/src/skill-registry.ts:25-134`
- `packages/cli/src/skill-resolver.ts:40-226`
- `packages/cli/src/manifest.ts:18-245`
- `packages/cli/src/audit.ts:41-940`
- `scripts/copy-template-to-cli.mjs:24-32`
- `scripts/smoke-pack.mjs:60-246`
- `docs/assets/references/output-contract.md`
