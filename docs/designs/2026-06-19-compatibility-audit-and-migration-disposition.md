# Compatibility, Audit, and Migration Disposition

> Filename: `2026-06-19-compatibility-audit-and-migration-disposition.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Define how v2 treats existing make-docs installs while packaging, asset materialization, and future Rust CLI work are in flight.

This design classifies source states, assigns safe dispositions, and records audit, backup, rollback, and coexistence expectations for root dogfood installs, shipped template installs, npm installer runs, and future standalone Rust CLI installs.

## Context

This design is the third doc in Batch 1 of the [v2 proposed design and roadmap](../artifacts/v2-proposed-design-and-roadmap.md). It intentionally straddles the normal lifecycle: artifact roadmap inputs are being promoted into design docs before the repo returns to the default design -> plan -> PRD -> work -> implementation arc.

Two accepted Batch 1 designs are stronger authority than the roadmap proposal:

- [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md) keeps `make-docs` as the shared command name, keeps the TypeScript npm package as the current npm/`npx` installer authority, and requires TypeScript and Rust implementations to share durable manifest, package metadata, and user-visible command contracts.
- [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md) defines `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache` materialization modes, keeps full local materialization as the safe default, requires local bootstrap files in every mode, and requires provider/cache provenance before provider-backed mode can become reliable.

Current implementation evidence gives v2 a safety model to build on rather than replace. `../../packages/cli/src/manifest.ts` owns `.make-docs/manifest.json` schema version 1, manifest validation, selection migration, file hashes, `selectedSkills`, and `skillFiles`. `../../packages/cli/src/audit.ts` already separates `manifest-present` and `manifest-missing` audits and classifies removable, preserved, skipped, and prunable paths. `../../packages/cli/src/backup.ts` and `../../packages/cli/src/uninstall.ts` execute backup and removal from reviewed audit results. `../../packages/cli/src/install.ts`, `../../packages/cli/src/planner.ts`, and `../../packages/cli/src/managed-block.ts` provide managed-file conflict review and managed-block detection.

Earlier designs remain important lineage. The archived [CLI Lifecycle UX - Help, Backup, and Uninstall](../assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md) design established one shared audit engine for backup and uninstall. [CLI Conflict Resolution](2026-05-06-cli-conflict-resolution.md) broadened conflict handling from instruction-only review to reviewable managed-file diffs. The archived [CLI Asset Selection Simplification](../assets/archive/designs/2026-04-28-cli-asset-selection-simplification.md) and [CLI Skill Selection Simplification](../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md) designs removed stale asset-mode fields and moved skills toward explicit selection state.

This design references open PRD/risk-register entries in [03-open-questions-and-risk-register.md](../prd/03-open-questions-and-risk-register.md) but does not mutate them.

## Decision

v2 compatibility is state-classification first. Every install, reconfigure, migration, backup, uninstall, and future Rust execution path must classify the current source state before it writes managed files.

The compatibility classifier must use this priority order:

1. Determine whether `.make-docs/manifest.json` exists and can be parsed.
2. If present, validate schema, package identity, selections, managed file records, skill records, and materialization provenance for v2 manifests.
3. Compare recorded managed-file hashes, managed-block state, selected-skill outputs, and required local bootstrap files against the filesystem.
4. If the manifest is absent or unusable, use only conservative fallback recognition for known make-docs-managed paths and canonical content.
5. If fallback recognition is ambiguous, stop before mutation.

The classifier must produce one source state:

| State | Meaning | Default disposition |
| --- | --- | --- |
| `clean-v1` | Schema version 1 TypeScript/npm full-snapshot install with valid package metadata, no removed asset-selection fields, trusted selections, and managed files that match manifest hashes or valid managed blocks. | `migrate` |
| `clean-v2-full-snapshot` | v2 manifest with full local materialization provenance, required local bootstrap, and matching managed files. | `sync` |
| `clean-v2-provider-backed` | v2 manifest with provider-backed provenance, required local bootstrap, reachable approved provider, and matching provider hash set. | `sync` |
| `clean-v2-hybrid-pinned-cache` | v2 manifest with pinned cache provenance, required local bootstrap, reachable cache or rehydratable provider, and matching hash set. | `sync` |
| `modified-v1` | Supported v1 manifest, but one or more managed files, managed blocks, or skill outputs differ from recorded ownership. | `migrate-with-review` |
| `partial-install` | Some recognizable make-docs outputs exist, but manifest records, managed files, bootstrap files, or selected skill outputs are incomplete. | `migrate-with-review` when ownership is reviewable; otherwise `backup-and-reinstall` |
| `malformed-manifest` | Manifest JSON, schema version, required fields, removed asset fields, or materialization provenance cannot be trusted. | `backup-and-reinstall` when fallback recognition is sufficient; otherwise `manual-review-required` |
| `missing-manifest-recognizable` | No manifest exists, but known make-docs-managed paths or canonical fingerprints are present. | `migrate-with-review` when every mutation is reviewable; otherwise `backup-and-reinstall` |
| `unknown-shape` | The tree does not have enough trusted make-docs evidence to classify ownership. | `manual-review-required` |

`sync` means the CLI may perform ordinary idempotent install or reconfigure behavior after the audit report shows no unreviewed ownership ambiguity. It may update managed files whose current content still matches recorded ownership. It must route local deltas through managed-file conflict review.

`migrate` is allowed only when the prior state is clean and fully trusted. The migration may rewrite manifest shape, add v2 provenance, and update records for files that still match known ownership. It must not silently overwrite user-modified content, broaden skill selection, or move runtime state into `docs/assets/`.

`migrate-with-review` is the path for supported but locally changed or partial states. It must show the classification, show the relevant audit summary, and route file changes through managed-file conflict review. Review decisions are overwrite or skip at the managed-file level; migration must not reintroduce append-merge ownership for instruction files.

`backup-and-reinstall` is the fallback for unsupported but recognizable shapes. It must:

- run one audit/classification pass;
- show the exact files that will be backed up, removed, preserved, and skipped;
- create a dated backup before any destructive action;
- remove only files the same reviewed audit result marks removable;
- install fresh from the selected v2 mode after removal;
- never re-audit between user approval, backup, removal, and reinstall.

Ordinary install may detect and recommend `backup-and-reinstall`, but it must not perform that destructive path implicitly. Execution belongs to a dedicated migration flow, or to an explicit future flag or confirmation path that is semantically equivalent to a migration command. A bare `make-docs` or `make-docs reconfigure` run may not convert a malformed or unsupported install by surprise.

`manual-review-required` means make-docs must stop before writing. It should explain which evidence failed, preserve the tree, and suggest manual backup or a fresh install into a clean tree. Unknown shapes are not automatically migrated just because their paths collide with desired managed files.

Backup and rollback share the audit contract. A destructive migration must create a backup first, and rollback is restore-from-backup rather than an implicit inverse migration. If rollback automation is added later, it must consume the same backup manifest and path metadata that backup created.

The TypeScript npm implementation remains the current executable source of truth for these behaviors. The future Rust CLI may classify, sync, migrate, backup, uninstall, or provider-resolve only after it preserves this same taxonomy, manifest compatibility, and single-audit safety model. When both TypeScript and Rust distributions are installed, PATH order may choose the runtime, but the selected runtime must not fork the installed-project compatibility contract.

Root dogfood follows the same safety rules but has a narrower managed-product boundary. Repo-root authored docs, history, plans, PRDs, guides, and artifact content are not inferred as product-owned just because they live near managed assets. The shipped template and packed npm template are the package validation surfaces; root `docs/` is dogfood validation.

Skills remain opt-in. Migration may preserve explicitly selected prior skills only when the manifest and file evidence are trustworthy. Bare installs and clean v1-to-v2 migration must not silently expand `selectedSkills` or install skill files by default.

## Alternatives Considered

### Migrate Every Recognizable Shape

Rejected. The audit engine can recognize some canonical files without a manifest, but that is not enough evidence to claim ownership over every hand-mutated install. Broad migration would turn path matching into destructive authority and weaken the backup/uninstall safety model.

### Treat Malformed Manifests as Manifest-Missing Installs

Rejected as the default. A malformed manifest is evidence that an install may have been partially written, edited, or produced by an unsupported version. Conservative fallback recognition may still support backup-and-reinstall, but malformed manifest state should not be promoted to clean migration without review.

### Put Backup-and-Reinstall Inside Ordinary Install

Rejected for implicit execution. Ordinary install can diagnose and recommend the path, but a destructive uninstall/reinstall sequence needs migration-level intent and explicit approval. Keeping execution in a dedicated migration flow or explicit future flag prevents a routine reconfigure from becoming a destructive operation.

### Make Rust Compatibility a Later Concern

Rejected. The first Batch 1 design already chooses one `make-docs` command name across npm, Homebrew, and Crates. Compatibility must be a product contract now so the Rust CLI cannot accidentally define a different manifest or audit behavior later.

## Consequences

The next Batch 1 design can reason about template/package/dogfood ownership without reopening migration safety. It should treat `packages/docs/template/` as the future implementation target, root `docs/` as dogfood validation, and `packages/cli/template/` plus pack/smoke checks as package proof, while keeping this classifier as the guardrail for existing installs.

Implementation planning must add explicit fixtures for every state/disposition pair. Minimum coverage should include clean v1, clean v2 full-snapshot, provider-backed v2 with provider unavailable, hybrid pinned-cache with stale hashes, modified v1 managed files, malformed managed blocks, malformed manifest, missing manifest with canonical files, missing manifest with ambiguous files, and unknown/non-make-docs shape.

Validation should extend the current lifecycle suite rather than bypass it. Expected gates include `npm test -w packages/cli`, targeted audit/backup/uninstall/install/managed-block tests, `npm run validate:defaults`, `npm run smoke:pack`, package dry-run checks when package contents change, and dogfood/template parity checks once the template/package/dogfood design defines exact parity rules.

The manifest schema will need a v2 revision before provider-backed or hybrid cache modes can be treated as clean v2 states. Schema version 1 can support clean v1 classification, but it cannot prove provider identity, hash sets, cache provenance, or offline recovery policy.

Several risk-register items remain intentionally open. R-006 remains the safety guardrail for one reviewed audit snapshot. R-003, R-004, R-007, and Q-005 remain tied to template/package/dogfood and duplicated path validation. R-014 remains active for no-scripts migration. D-005, Q-001, and Q-007 remain open for skill delivery and remote trust. D-006 remains open for package README/tarball alignment. Q-012 remains open for shared plugin/skill install behavior.

This design does not mutate the PRD/risk register, prior designs, plans, work backlogs, package templates, or source code. Those updates belong to later plan, PRD, work, and implementation phases after the v2 design set is accepted.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-06-19-package-and-deployment-boundaries.md](2026-06-19-package-and-deployment-boundaries.md), [2026-06-19-system-asset-delivery-and-materialization-contract.md](2026-06-19-system-asset-delivery-and-materialization-contract.md), [2026-05-06-cli-conflict-resolution.md](2026-05-06-cli-conflict-resolution.md), [2026-04-18-cli-help-backup-and-uninstall.md](../assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md), [2026-04-28-cli-asset-selection-simplification.md](../assets/archive/designs/2026-04-28-cli-asset-selection-simplification.md), [2026-04-28-cli-skill-selection-simplification.md](../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md)
- Reason: this design extends the Batch 1 package and asset materialization contracts, applies the earlier single-audit backup/uninstall safety model to v2 migration, and reuses managed-file conflict review as the review path for modified or partial installs.

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../assets/prompts/designs-to-plan-change.prompt.md)

Why: This design changes and extends existing installer, manifest, audit, backup, uninstall, conflict-review, package, dogfood, and future Rust compatibility behavior. It should feed additive change planning against the active PRD namespace after the complete v2 design set is accepted.

Coordinate Handoff: Prior lineage anchors include W7 R0, W9 R1, W14 R0/R1/R2, W17 R0, and the accepted Batch 1 package/materialization designs; recommended downstream W/R coordinate unresolved; planner must resolve before writing.
