# 03 Open Questions and Risk Register

## Purpose

This document centralizes confirmed drift, unresolved product-contract questions, and clean-room rebuild risks across install/profile state, template assets, CLI command routing, skills distribution, dogfood operations, and release packaging. The current system is the combined behavior of `docs/prd/01-product-overview.md`, `docs/prd/02-architecture-overview.md`, `packages/cli/src/cli.ts:77-244`, `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/skill-catalog.ts:33-138`, `packages/cli/src/utils.ts:33-55`, and `scripts/smoke-pack.mjs:60-246`, so drift in any one layer can mislead contributors or break packaged behavior.

The fixed-core overview layer now exists, but this register still carries the unresolved cross-cutting gaps those overview docs intentionally call out, especially where current code, current READMEs, packaged artifacts, and future-facing workspace plans do not yet agree.

## Confirmed Drift

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference controls that are becoming invariant managed assets.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for skill registry and selection behavior that is moving from required/optional categories to one selected-skill set.

| Item | Evidence | Why it matters |
| --- | --- | --- |
| README wording understates the live idempotent sync model. | `README.md:101-107` and `packages/cli/README.md:84-89` say unchanged managed files are updated in place, but `packages/cli/src/planner.ts:19-189` plans `noop` for exact matches and `packages/cli/src/cli.ts:725-805` reports `Already current`. | Contributors can misread the installer as more write-heavy than it really is. |
| Public command guidance lags the shipped command taxonomy. | `packages/cli/src/cli.ts:894-1019` exposes `skills`, `backup`, and `uninstall`, while `README.md:73`, `packages/cli/README.md:56`, and older docs still frame the product mostly as install/reconfigure/dry-run and still discuss removed `init` or `update` paths rejected by `packages/cli/src/cli.ts:589-612`. | Operator docs and design lineage can point people toward commands the parser no longer accepts. |
| Template and reference mode labels currently promise more than the selector enforces. | The wizard exposes `templatesMode` and `referencesMode` choices in `packages/cli/src/wizard.ts:354-889`, but `packages/cli/src/rules.ts:130-194` ignores `templatesMode` and uses `referencesMode` only to optionally add `docs/assets/references/harness-capability-matrix.md`. | The user-visible control surface is broader than the live implementation. |
| The `ResolvedAsset.assetClass` union is stale relative to the catalog. | `packages/cli/src/types.ts:75-80` allows `\"static\"`, but `packages/cli/src/catalog.ts:7-20` emits only `\"buildable\"` and `\"scoped-static\"`. | Type-level contracts no longer cleanly describe actual asset generation behavior. |
| The live skills delivery model diverges from earlier bundled-payload expectations. | Runtime behavior comes from `packages/cli/src/skill-registry.ts:25-134` and `packages/cli/src/skill-resolver.ts:40-226`, which load a packaged registry and fetch skill payloads remotely; earlier design material such as `docs/assets/archive/designs/2026-04-16-cli-skill-installation.md` described bundling skill payloads into the CLI package. | Packaging, offline behavior, release validation, and security expectations depend on which model is actually intended. |
| The packaged README and maintainer README do not match the current tarball allowlist. | `packages/cli/package.json:9-15` ships `dist`, `template`, registry files, and `README.md`, but `packages/cli/src/README.md:181-204` and `packages/cli/README.md:91-120` still describe tarball-root `docs/`, `AGENTS.md`, and `CLAUDE.md`. | Maintainers and consumers can reason about the wrong package contents. |
| Dogfood re-seeding remains manual without a freshness proof. | `packages/docs/README.md:86-121` makes manual re-seeding an intentional maintainer workflow, but no automated check proves repo-root `docs/assets/**` still matches `packages/docs/template/docs/assets/**` after template edits. | The dogfood surface can drift silently between template changes and re-seed passes. |
| Historical hidden-dot paths remain easy to mistake for current routing. | Current state lives under `docs/assets/**` and root `.make-docs/**` per `README.md:16-46` and `packages/cli/src/manifest.ts:18-20`, yet migration docs still refer to `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json`. | Contributors can accidentally treat migration history as live contract. |
| The future `packages/content` boundary is still undefined in the live product. | `README.md:10-17` reserves `packages/content/`, but there is no selector in `packages/cli/src/catalog.ts:64-85`, no renderer in `packages/cli/src/renderers.ts:54-570`, and no command/help surface in `packages/cli/src/cli.ts:894-1019`. | Future rendered content fragments still have no shipping or ownership contract. |
| Skills authoring and release guidance is still thin relative to runtime dependence on it. | `packages/skills/README.md` is minimal, while the runtime depends on the structure of `packages/skills/archive-docs/` and `packages/skills/decompose-codebase/` via `packages/cli/skill-registry.json`, `packages/cli/src/skill-catalog.ts:90-138`, and `packages/cli/src/skill-resolver.ts:40-226`. | Adding or changing a skill still relies too much on tribal knowledge across registry, assets, and packaging steps. |

## Open Questions

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for whether template and reference modes should remain public options.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for selected-skill UX and persisted-selection continuity; remote source policy remains an unresolved delivery-security question.

| Question | Current evidence | Why unresolved |
| --- | --- | --- |
| What is the intended long-term skills delivery contract: remote-fetch, bundled-local, or dual-mode fallback? | Current runtime is remote-fetch (`packages/cli/src/skill-registry.ts:134`, `packages/cli/src/skill-resolver.ts:6-226`), while prior design work expected bundled payloads. | Release policy, offline behavior, integrity checks, and smoke-pack acceptance all depend on this decision. |
| Should `templatesMode` and `referencesMode` remain public options, and if so what should `required` vs `all` actually mean? | The option surfaces exist in `packages/cli/src/wizard.ts:354-889`, but selector behavior is narrow in `packages/cli/src/rules.ts:130-194`. | The current UI is broader than the live rule set, but removing the knobs would also change the public contract. |
| Does `ResolvedAsset.assetClass` need a third live value, or should the type shrink to two? | `packages/cli/src/types.ts:75-80` and `packages/cli/src/catalog.ts:7-20` disagree today. | This is either an unfinished feature hook or dead type surface. |
| How should `packages/content` participate in the product? | `README.md:10-17` reserves the workspace, but there is no runtime integration point in `packages/cli/src/catalog.ts:64-85`, `packages/cli/src/renderers.ts:54-570`, or `scripts/smoke-pack.mjs:60-246`. | Without an explicit answer, later content work will invent its own packaging and dogfood rules. |
| How should maintainers prove dogfood freshness if manual re-seeding remains the chosen workflow? | `packages/docs/README.md:86-121` values reviewability and selective propagation, but current checks such as `scripts/check-instruction-routers.sh:1-58` do not prove template parity. | The repo needs a deliberate stance on reviewability versus automated freshness. |
| What minimum metadata and legal prerequisites define “public release ready” for `make-docs`? | `packages/cli/package.json:2-25` still lacks `repository`, `homepage`, and `bugs`; license files are absent; the first-publish design still treats these as prerequisites. | The package can be built and smoke-tested today, but public-release readiness remains ambiguous. |
| How should remote skill sources be constrained? | `packages/cli/src/skill-registry.ts:134` accepts `http://`, `https://`, `github:`, and `url:`, while `packages/cli/src/skill-resolver.ts:6` defaults GitHub sources to `main` and `packages/cli/src/skill-resolver.ts:226` performs unauthenticated fetches. | Mutable refs and permissive protocols have security and reproducibility implications. |

## Rebuild Risks

### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) where rebuild risk depends on the old `optionalSkills` or required/default skill assumptions; home-scoped skill ownership and audit safety remain active constraints.

| Risk | Failure mode | Key anchors |
| --- | --- | --- |
| Home-scoped skills are easy to drop from a clean-room rebuild. | A rebuild that assumes all managed files live under the target repo will break global skill installs, backup mapping, and uninstall safety. | `packages/cli/src/skill-catalog.ts:33-46`, `packages/cli/src/manifest.ts:135-183`, `packages/cli/src/audit.ts:745-796`, `packages/cli/src/backup.ts:252-300` |
| Audit removability depends on regenerated canonical skill content, not only stored manifest hashes. | If skills delivery, registry, or content resolution changes without a matching audit update, uninstall and backup can become too conservative or too destructive. | `packages/cli/src/planner.ts:393-408`, `packages/cli/src/install.ts:96-163`, `packages/cli/src/audit.ts:745-793` |
| Dev-template and packed-template resolution can diverge. | Testing only local dev paths can miss failures that appear only after `prepack` copies the template into `packages/cli/template`. | `packages/cli/src/utils.ts:33-55`, `packages/cli/package.json:19-25`, `scripts/copy-template-to-cli.mjs:24-32`, `scripts/smoke-pack.mjs:60-246` |
| Path knowledge is still duplicated across multiple modules and docs. | Adding or moving a template-owned path can drift across `rules.ts`, `catalog.ts`, `renderers.ts`, tests, package docs, and dogfood copies. | `packages/cli/src/rules.ts:8-194`, `packages/cli/src/catalog.ts:7-85`, `packages/cli/src/renderers.ts:40-570`, `packages/cli/tests/consistency.test.ts:33-77`, `packages/docs/README.md:86-121` |
| The no-command CLI workflow is easy to simplify incorrectly. | Reintroducing `init`/`update`, collapsing wizard review with generic apply confirmation, or treating lifecycle commands as install flags would break the shipped public UX. | `packages/cli/src/cli.ts:119-244`, `packages/cli/src/cli.ts:589-612`, `packages/cli/src/wizard.ts:487-550`, `packages/cli/src/backup.ts:86-127`, `packages/cli/src/uninstall.ts:63-116` |
| Backup and uninstall depend on a single reviewed audit snapshot. | Re-auditing between warning, backup, and delete steps can invalidate what the user already approved and break the current safety model. | `packages/cli/src/backup.ts:86-127`, `packages/cli/src/uninstall.ts:81-116`, `packages/cli/src/audit.ts:41-79` |
| Manual dogfood re-seeding can hide product drift behind repo-local familiarity. | Because repo-root `docs/` is both a maintainer workspace and a product rehearsal surface, stale dogfood files can make local behavior look correct while the shipped template has drifted. | `README.md:6-46`, `packages/docs/README.md:50-121`, `packages/cli/src/utils.ts:33-55` |
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
