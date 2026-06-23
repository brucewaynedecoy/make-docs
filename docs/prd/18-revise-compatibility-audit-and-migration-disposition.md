# 18 Revise Compatibility Audit and Migration Disposition

## Purpose

This revision records the effective compatibility, audit, and migration disposition contract for v2 Make Docs. It reconciles the accepted compatibility design and the W10 R3 plan into the active PRD set so future installer, package, dogfood, system asset, Rust, and MCP work classify existing installs before mutating them.

The change keeps the current TypeScript npm implementation as the executable source of truth while defining the taxonomy a future Rust CLI must share before it can sync, migrate, back up, uninstall, or provider-resolve existing Make Docs installs.

## Change Type

Revision.

This document enhances active manifest, audit, backup, uninstall, conflict-review, package, dogfood, skills, system asset, and future Rust compatibility requirements.

## Baseline Being Revised or Removed

This revision updates these baseline assumptions:

- Every install, reconfigure, migration, backup, uninstall, and future Rust execution path must classify source state before writing managed files.
- Compatibility is state-classification first, not command-path first.
- Ordinary install and reconfigure may recommend migration but must not perform destructive backup-and-reinstall implicitly.
- Unsupported recognizable shapes use backup-and-reinstall only through an explicit migration flow or equivalent explicit confirmation path.
- Unknown shapes stop before mutation.
- Root dogfood follows the same safety rules, but repo-root authored docs are not inferred as product-owned merely because they live near managed assets.
- Skills remain opt-in. Migration may preserve explicitly selected prior skills only when manifest and file evidence are trustworthy.

## Rationale

The accepted compatibility design closes the safety gap between W10 R1 package ownership and W10 R2 system asset materialization. Existing installs can be clean, modified, partial, malformed, provider-backed, cache-backed, or unknown. Treating all of those states as ordinary install targets would either overwrite local changes, trust malformed manifests, or strand users between TypeScript and future Rust behavior.

The current implementation has useful safety primitives already. `packages/cli/src/manifest.ts` validates schema version 1, tracks file hashes, records selected skills and skill files, and builds manifest audit context. `packages/cli/src/audit.ts` separates manifest-present from manifest-missing audits. `packages/cli/src/backup.ts` and `packages/cli/src/uninstall.ts` execute from reviewed audit results. `packages/cli/src/planner.ts` and `packages/cli/src/managed-block.ts` support managed-file and managed-block conflict review. The PRD set should preserve those primitives while requiring a classifier above them.

Code anchors:

- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/managed-block.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `scripts/smoke-pack.mjs`

## Effective Requirement

Classification priority:

1. Determine whether `.make-docs/manifest.json` exists and can be parsed.
2. If present, validate schema, package identity, selections, managed file records, skill records, and materialization provenance for v2 manifests.
3. Compare recorded managed-file hashes, managed-block state, selected-skill outputs, and required local bootstrap files against the filesystem.
4. If the manifest is absent or unusable, use only conservative fallback recognition for known make-docs-managed paths and canonical content.
5. If fallback recognition is ambiguous, stop before mutation.

Source states:

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

Disposition meanings:

- `sync` allows ordinary idempotent install or reconfigure behavior only after the audit report shows no unreviewed ownership ambiguity.
- `migrate` is allowed only when prior state is clean and fully trusted. It may rewrite manifest shape, add v2 provenance, and update records for files that still match known ownership.
- `migrate-with-review` must show classification, show the relevant audit summary, and route file changes through managed-file conflict review.
- `backup-and-reinstall` is the fallback for unsupported but recognizable shapes and belongs to a dedicated migration flow or equivalent explicit future confirmation path.
- `manual-review-required` stops before writing, explains which evidence failed, preserves the tree, and suggests manual backup or a fresh install into a clean tree.

Migration safety:

- Migration must not silently overwrite user-modified content.
- Migration must not broaden skill selection or install skill files by default.
- Migration must not move runtime state into `docs/assets/`.
- Review decisions are overwrite or skip at the managed-file level.
- Migration must not reintroduce append-merge ownership for instruction files.

Backup-and-reinstall safety:

- Run one audit/classification pass.
- Show the exact files that will be backed up, removed, preserved, and skipped.
- Create a dated backup before any destructive action.
- Remove only files the same reviewed audit result marks removable.
- Install fresh from the selected v2 mode after removal.
- Never re-audit between user approval, backup, removal, and reinstall.

Rollback:

- Rollback is restore-from-backup, not an implicit inverse migration.
- If rollback automation is added later, it must consume the same backup manifest and path metadata that backup created.

TypeScript/Rust compatibility:

- The TypeScript npm implementation remains the current executable source of truth.
- A future Rust CLI may classify, sync, migrate, backup, uninstall, or provider-resolve only after it preserves this taxonomy, manifest compatibility, and single-audit safety model.
- When both TypeScript and Rust distributions are installed, PATH order may choose the runtime, but the selected runtime must not fork the installed-project compatibility contract.

Dogfood and skills:

- Root dogfood follows the same safety rules but has a narrower managed-product boundary.
- Repo-root authored docs, history, plans, PRDs, guides, and artifact content are not inferred as product-owned just because they live near managed assets.
- Shipped template and packed npm template are package validation surfaces; root `docs/` is dogfood validation.
- Skills remain opt-in. Migration may preserve explicitly selected prior skills only when manifest and file evidence are trustworthy.
- Bare installs and clean v1-to-v2 migration must not silently expand `selectedSkills` or install skill files by default.

Validation boundary:

- Implementation planning must add explicit fixtures for every state/disposition pair.
- Minimum coverage includes clean v1, clean v2 full-snapshot, provider-backed v2 with provider unavailable, hybrid pinned-cache with stale hashes, modified v1 managed files, malformed managed blocks, malformed manifest, missing manifest with canonical files, missing manifest with ambiguous files, and unknown/non-make-docs shape.
- Validation should extend current lifecycle coverage through `npm test -w packages/cli`, targeted audit/backup/uninstall/install/managed-block tests, `npm run validate:defaults`, `npm run smoke:pack`, package dry-run checks when package contents change, and dogfood/template parity checks once the template/package/dogfood design defines exact parity rules.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/02-architecture-overview.md` | Enhances runtime boundaries with a compatibility classification gate before mutation. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhances manifest validation, source-state taxonomy, migration dispositions, schema migration, and stale-manifest safety. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhances template/dogfood/package ownership during migration and prevents repo-root authored docs from being inferred as product-owned. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Enhances lifecycle UX with dedicated migration flow expectations and forbids implicit destructive migration during ordinary install/reconfigure. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhances selected-skill preservation rules during migration and preserves no-default-skills behavior. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhances validation with the required source-state and disposition fixture matrix. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Enhances TypeScript/Rust coexistence by requiring a shared compatibility taxonomy. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Enhances materialization modes with clean-state classification requirements. |
| `docs/prd/20-revise-agent-harness-model-conformance-lab.md` | Uses compatibility classification, fallback, and backup-and-reinstall behavior as evidence scenarios without changing mutation safety semantics. |
| `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md` | Applies migration classification and managed-file conflict safety to future `.make-docs/**` tool-resource moves. |
| `docs/prd/03-open-questions-and-risk-register.md` | Updates existing package, skill, remote-source, template, dogfood, lifecycle, no-scripts, and plugin entries without duplicating them. |

The paired delta backlog for implementation work should be generated under `docs/work/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/` and trace back to this revision, the W10 R3 plan, the accepted compatibility design, W10 R1 package-boundary revision, W10 R2 system asset revision, and current TypeScript CLI lifecycle surfaces.

## Required Baseline Annotations

The following active PRD docs must carry `Change Notes` backlinks to this revision:

| Baseline doc | Note verb | Required note focus |
| --- | --- | --- |
| `docs/prd/02-architecture-overview.md` | Enhanced by | Runtime classification gate before mutation. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhanced by | State taxonomy, migration dispositions, schema and provenance validation, and conservative fallback recognition. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhanced by | Template/package/dogfood ownership during migration. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Enhanced by | Migration flow, backup-and-reinstall recommendation, review UX, and no implicit destructive conversion. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhanced by | Trusted selected-skill preservation only; no default skill expansion during migration. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhanced by | Source-state and disposition fixture matrix. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Enhanced by | Shared TypeScript/Rust classifier and disposition contract. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Enhanced by | Clean v2 materialization states require trusted provenance and provider/cache evidence. |

Do not add `Change Notes` to `docs/prd/03-open-questions-and-risk-register.md`; update its existing numbered D/Q/R items directly.

## Source Anchors

- `docs/designs/2026-06-19-compatibility-audit-and-migration-disposition.md`
- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-19-system-asset-delivery-and-materialization-contract.md`
- `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/00-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/16-revise-package-and-deployment-boundaries.md`
- `docs/prd/17-revise-system-asset-materialization-contract.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/managed-block.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `scripts/smoke-pack.mjs`
