# 18 Compatibility Classification and Migration Safety

## Purpose

This document defines the current product contract for compatibility classification, conservative migration, and failure-safe adoption. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns compatibility classification, conservative migration, and failure-safe adoption. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

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

TypeScript CLI/MCP compatibility:

- The TypeScript package implementation remains the executable source of truth.
- TypeScript CLI and MCP paths may classify, sync, migrate, backup, uninstall, or provider-resolve only through this taxonomy, manifest compatibility model, and single-audit safety model.
- Package-runner and persistent-install execution must not fork installed-project compatibility semantics.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) applies the same requirement to MCP and no-scripts replacement paths: every install, reconfigure, migration, backup, uninstall, CLI, or MCP write path must classify source state before mutation and reuse the same disposition and audit-snapshot contract.

Dogfood and skills:

- Root dogfood follows the same safety rules but has a narrower managed-product boundary.
- Repo-root authored docs, history, plans, PRDs, guides, and artifact content are not inferred as product-owned just because they live near managed assets.
- Shipped template and packed npm template are package validation surfaces; root `docs/` is dogfood validation.
- Skills remain opt-in. Migration may preserve explicitly selected prior skills only when manifest and file evidence are trustworthy.
- Bare installs and clean v1-to-v2 migration must not silently expand `selectedSkills` or install skill files by default.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) extends that migration gate to first-party helper scripts: managed old skill scripts, managed wrapper scripts, modified local files, and custom user scripts must be classified before removal, and no accepted state may leave a selected first-party skill missing both a script and a CLI/shared-core replacement.
- [08-skills-catalog-and-distribution.md](./08-skills-catalog-and-distribution.md) extends selected-skill evidence with optional purpose and manifest provenance. Audit, backup, uninstall, and migration may explain why a skill was selected, but they must still act from resolved `selectedSkills`, `skillFiles`, trusted manifest evidence, and one reviewed audit snapshot.
- [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md) extends selected-skill migration with shared payload, symlink exposure, copy-mirror, legacy generated-stub, and duplicated-payload classification. Migration must distinguish canonical shared payloads, native harness exposures, legacy generated harness stubs, old duplicated per-harness payloads, modified/custom harness files, missing ownership records, and ambiguous missing-manifest state before mutation.
- [30-plugin-substrate-and-workflow-bundles.md](./30-plugin-substrate-and-workflow-bundles.md) extends migration with selected-plugin payload and generated-exposure classification. Migration must distinguish canonical plugin payloads, generated plugin exposures, modified managed plugin files, user-authored harness plugins, missing ownership records, and ambiguous plugin-shaped files before mutation.

Validation boundary:

- Implementation planning must add explicit fixtures for every state/disposition pair.
- Minimum coverage includes clean v1, clean v2 full-snapshot, provider-backed v2 with provider unavailable, hybrid pinned-cache with stale hashes, modified v1 managed files, malformed managed blocks, malformed manifest, missing manifest with canonical files, missing manifest with ambiguous files, and unknown/non-make-docs shape.
- Validation extends current lifecycle coverage through `npm test -w packages/cli`, targeted audit/backup/uninstall/install/managed-block tests, `npm run validate:defaults`, `npm run smoke:pack`, package dry-run checks when package contents change, and the dogfood/template parity rules owned by [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md), [09-dogfood-and-maintainer-operations.md](./09-dogfood-and-maintainer-operations.md), and [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md).
## Existing-Project Adoption Boundaries

Under [R-OBL-COMPAT](45-deferred-obligation-governance.md#r-obl-compat-existing-project-adoption) and [R-NUAT-COMPAT](46-naive-end-user-acceptance-testing.md#r-nuat-compat-existing-artifact-adoption), existing Make Docs projects adopt the new contracts conservatively at the first qualifying lifecycle, coverage, reconciliation, or phase-close event after upgrade. Historical phases are not retroactively failed, archived artifacts are not rewritten, and existing UAT/manual-test artifacts remain valid evidence unless a later qualifying slice requires them to be supplemented.

Modified managed resources continue to follow the existing conflict-stop and explicit-disposition rules. This documentation-first capability round requires neither a Global Store schema migration nor an automatic database rewrite.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W10 R3

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current compatibility classification, conservative migration, and failure-safe adoption requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Compatibility and migration design](../designs/2026-06-19-compatibility-audit-and-migration-disposition.md)
## Source Anchors

- `docs/designs/2026-06-19-compatibility-audit-and-migration-disposition.md`
- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-19-system-asset-delivery-and-materialization-contract.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/16-package-runtime-and-deployment-boundaries.md`
- `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/30-plugin-substrate-and-workflow-bundles.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/compatibility.ts`
- `packages/cli/src/managed-block.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/types.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/compatibility-fixtures.ts`
- `packages/cli/tests/compatibility-fixtures.test.ts`
- `packages/cli/tests/compatibility.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `scripts/smoke-pack.mjs`
