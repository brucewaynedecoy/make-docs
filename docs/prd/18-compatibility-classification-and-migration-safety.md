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
2. If present, validate schema, package identity, stable project identity, saved projection selections, managed file and block records, skill records, resource provenance, and every competing ownership claim for v2 manifests.
3. Compare recorded hashes, managed snapshots, selected-skill outputs, selected `.make-docs/system/**` projections, routers, and other owned paths against the filesystem without following links outside the approved project or machine root.
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

Classification is multidimensional. The top-level state and disposition above summarize, but never erase, these orthogonal facets:

- resource layout, prompt layout, archive layout, artifact layout, persona-testing assets, legacy Playbook/Protocol assets, path-hygiene scripts, router/bootstrap state, manifest ownership, Store schema, and optional agentics state;
- filesystem ownership for every affected path as `absent`, `managed-clean`, `managed-modified`, `project-owned`, `mixed`, or `unknown`;
- manifest provenance as `absent`, `verified`, `incomplete`, `ambiguous`, or `contradictory`, retaining the evidence and competing claims behind any non-verified result; and
- Store compatibility as `absent`, `supported-current`, `supported-legacy`, `newer-unknown`, or `corrupt`, without letting recoverable machine state weaken repository preservation.

Classification is monotonic and fail-closed: incomplete, ambiguous, contradictory, newer-unknown, or corrupt evidence can only retain or strengthen safety constraints. One frozen classification snapshot drives the reviewed plan, backup, transformation, validation, rollback receipt, update, and uninstall disposition; a command must not silently reclassify between approval and mutation.

### Quiescence and Mutation Barrier

- Before the first migration write, Make Docs must acquire an exclusive project lifecycle lock and establish a durable quiescence barrier at every public legacy Playbook/Protocol discovery or write boundary, including CLI, MCP, plugin, skill, and helper entry points.
- The barrier remains held through backup, transformation, validation, manifest replacement, and receipt publication. If any bypass exists, any writer remains active, or the lock cannot be proved exclusive, migration fails closed before mutation.
- Quiescence does not authorize interpretation or conversion of legacy Playbook/Protocol content or `playbook_runs`; those remain opaque and preserved unless a separate accepted authority explicitly adopts them.

### Ordered Migration

The migration order is normative and cannot be silently reordered:

1. Classify once and freeze the reviewed evidence snapshot.
2. Back up every path that may be transformed or removed and record preserved or exported user content.
3. Mint or upgrade manifest identity and provenance without claiming ambiguous ownership.
4. Install the minimal manifest and configured routers.
5. Establish top-level prompt identity and machine resource list/read operations before changing router fallbacks.
6. Move or install only selected clean local resources under `.make-docs/system/**`.
7. Establish on-demand archive, artifact, and persona-testing routing, then transform only clean managed legacy paths.
8. Install TypeScript path-hygiene operations, update references, and remove only a hash-proven managed Python helper.
9. Add general Store run tables while leaving `playbook_runs` opaque and untouched.
10. Rehome naive-UAT system resources, add the thin first-party Skill adapter, reconcile `user` and `maintainer` execution with the `user` default, and establish `docs/assets/<persona-slug>/testing/**`.
11. Retire traced Playbook and Protocol runtime, packaging, tests, conformance, and support surfaces while preserving the quiescence barrier through validation.
12. Install only explicitly selected, evidence-backed optional agentics.
13. Validate fresh install, representative legacy migrations, package projection, and dogfood parity before any release recommendation.

A proposed reorder must cite this authority, explain how every earlier safety invariant remains preserved, and receive owner approval before implementation planning or mutation.

Migration safety:

- Migration must not silently overwrite user-modified content.
- Migration must not broaden skill selection or install skill files by default.
- Migration must not move runtime state into `docs/**` or move project knowledge into the machine Store.
- Each affected file receives an explicit disposition: preserve as project-owned, export then replace, overwrite only when clean managed ownership is proven, skip, or stop. Append-merge is not ownership evidence, and a batch choice must still resolve to a file-scoped plan.
- Migration must not reintroduce append-merge ownership for instruction files.
- Migration may change only the selected facets in the reviewed plan. It preserves unselected and user-owned content, including legacy Library, Playbook, Protocol, archive, history, breadcrumb, guide, artifact, persona, script, config, and agentics material.
- Repository and manifest paths are normalized as project-relative POSIX paths. Classification and mutation reject traversal, absolute-path substitution, unsafe Windows drive or UNC forms, case-folding collisions, symlink escape, and reads or writes outside explicit project and machine roots.

Backup-and-reinstall safety:

- Run one audit/classification pass.
- Show the exact files that will be backed up, removed, preserved, and skipped.
- Create a dated backup and machine-readable backup manifest before any destructive action; the manifest records source, destination, ownership/provenance classification, content digest, and restoration order for every affected path.
- Remove only files the same reviewed audit result marks removable.
- Install fresh from the selected v2 mode after removal.
- Never re-audit between user approval, backup, removal, and reinstall.

Rollback:

- Rollback is restore-from-backup, not an implicit inverse migration. It restores the filesystem and project manifest together from the approved backup manifest; the machine Store is operational state and is not an independent repository rollback authority.
- Rollback automation must consume the same backup manifest and path metadata that backup created, use the held lifecycle lock, and emit a typed restoration receipt. Partial failure preserves the journal and remaining backup, reports restored and unrestored paths, and stops rather than declaring success.
- `update`, project removal, and machine uninstall use the same fail-closed classification and reviewed-snapshot boundary. They remove only verified clean managed assets or managed blocks, preserve project-owned, modified, mixed, unknown, archive, project-documentation, and opaque legacy state, and prune directories only when the approved snapshot proves them empty and safe.

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
- Final recovery validation must cover fresh installation, representative legacy migrations across the state/disposition and facet matrix, generated package projection, root dogfood parity, path and symlink safety, privacy-preserving Store behavior, and Windows/macOS/Linux fixtures before any release recommendation.
## Existing-Project Adoption Boundaries

Under [R-OBL-COMPAT](45-deferred-obligation-governance.md#r-obl-compat-existing-project-adoption) and [R-NUAT-COMPAT](46-naive-end-user-acceptance-testing.md#r-nuat-compat-existing-artifact-adoption), existing Make Docs projects adopt the new contracts conservatively at the first qualifying lifecycle, coverage, reconciliation, or phase-close event after upgrade. Historical phases are not retroactively failed, archived artifacts are not rewritten, and existing UAT/manual-test artifacts remain valid evidence unless a later qualifying slice requires them to be supplemented.

Performance Evidence Governance is adopted only at the first qualifying design, change-plan, PRD-maintenance, work-generation, coverage, or phase-close event after adoption. That event inventories active current PRDs and work and routes each performance candidate through its existing owner; it does not retroactively fail a completed phase, relabel historical evidence, invent or tighten a target, promote an observed baseline, fabricate a missing run or pass, broaden supported scope, rerun an existing benchmark, or certify prior green output. Existing benchmark scripts and results remain implementation or evidence assets according to their actual ownership and are not deleted, moved, rewritten, or treated as current proof merely because [PRD 48](./48-performance-evidence-governance.md) exists.

Modified managed resources continue to follow the fail-closed classification and explicit-disposition rules. PRD maintenance itself performs no Store rewrite; implementation of the general `runs` and `run_evidence` contract follows the separately reviewed Store migration boundary, and opaque legacy `playbook_runs` is never converted automatically.

## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.

## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.

Performance adoption integrates with [PRD 48](./48-performance-evidence-governance.md), the [accepted guardrails design](../designs/2026-08-12-performance-testing-guardrails.md), and the [W19 R2 plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md); this compatibility PRD owns conservative adoption and migration safety, not performance profile semantics.

## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W10 R3

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current compatibility classification, conservative migration, and failure-safe adoption requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Compatibility and migration design](../designs/2026-06-19-compatibility-audit-and-migration-disposition.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Classification priority`, `Source states`, `Disposition meanings`, `Quiescence and Mutation Barrier`, `Ordered Migration`, `Migration safety`, `Backup-and-reinstall safety`, `Rollback`, and `Validation boundary`
- Previous contract: Compatibility used a mostly one-dimensional state/disposition table, allowed overwrite-or-skip review, treated rollback as a future restore concept, and did not require a verified quiescence barrier or bounded facet plan before migration.
- Replacement contract: Classification is fail-closed across top-level states plus resource, filesystem, manifest-provenance, Store, legacy-asset, path-safety, and optional-agentics facets; one locked snapshot governs explicit file dispositions, backup, transform, rollback, update, uninstall, and cross-platform release validation while opaque legacy state and user-owned content remain preserved.
- Rationale: Recovery must make ownership uncertainty non-destructive and make every migration repeatable, reviewable, restorable, and unable to race a legacy writer.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
## Source Anchors

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- [Accepted Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 Performance Evidence Governance plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [PRD 48 — Performance Evidence Governance](./48-performance-evidence-governance.md)
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
