# 05 Installation, Profile, and Manifest Lifecycle

## Purpose

This subsystem turns user selections into a deterministic managed footprint and keeps later lifecycle operations narrow, stateful, and non-destructive. The CLI entrypoint in `packages/cli/src/cli.ts:77` decides whether a run is a first install, a manifest-backed sync, or an explicit reconfiguration; the profile resolver in `packages/cli/src/profile.ts:68` derives the effective capability set and stable `profileId`; the planner and applier in `packages/cli/src/planner.ts:19` and `packages/cli/src/install.ts:107` convert that desired state into file actions plus persisted manifest state in `packages/cli/src/manifest.ts:79`.

The public repo docs describe the same subsystem as the installer surface that writes only the selected footprint and records it under `.make-docs/manifest.json` for future apply/sync runs in `README.md:58` and `README.md:92`, with the CLI package README repeating the same contract in `packages/cli/README.md:41` and `packages/cli/README.md:75`.

## Scope

- Covers install, sync, and reconfigure orchestration in `packages/cli/src/cli.ts:77-265`, including target resolution, TTY checks, wizard entry, dry-run behavior, apply confirmation, and completion summaries.
- Covers dependency-aware selection resolution in `packages/cli/src/profile.ts:10-110`, where `prd` depends on `plans` and `work` depends on both `plans` and `prd`; the dependency behavior is regression-tested in `packages/cli/tests/profile.test.ts:4-35`.
- Covers desired-state planning and action selection in `packages/cli/src/planner.ts:19-201` and `packages/cli/src/planner.ts:204-390`, including create, generate, update, noop, remove-managed, unresolved reviewable diffs, and explicit overwrite/skip resolutions.
- Covers apply semantics and conflict staging in `packages/cli/src/install.ts:64-250`, including manifest refresh, skill-file tracking, and staging generated replacements under `.make-docs/conflicts/<run-id>/...`.
- Covers manifest schema, migration, and audit metadata generation in `packages/cli/src/manifest.ts:17-255`, including legacy `instructionKinds` migration and rejection of deprecated optional-skill manifest shapes.
- Covers backup, audit, and uninstall only where they depend on this subsystem’s managed-path model, manifest hashes, or prior selections in `packages/cli/src/audit.ts:41-88`, `packages/cli/src/backup.ts:49-158`, and `packages/cli/src/uninstall.ts:52-177`.
- Does not restate the full static asset-catalog contract owned upstream by `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, and skill asset resolution; this doc treats those modules as desired-state suppliers, consistent with `packages/cli/src/README.md:22-29`.

## Component and Capability Map

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference asset choices, which are becoming invariant managed selections.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for skill selection, which is moving from optional additions, implicit required skills, and selected-by-default behavior to an explicit selected-skill set that defaults to no skills.
- Superseded by [13-revise-cli-conflict-resolution.md](./13-revise-cli-conflict-resolution.md) for selected managed-file conflict review, where manifest hash mismatch alone is not treated as proof of local modification and unresolved selected diffs block apply.
- Superseded by [15-revise-agent-instruction-file-ownership.md](./15-revise-agent-instruction-file-ownership.md) for root agent instruction files, which now use block-scoped ownership, preserve project-owned text outside the block, and carry make-docs routing directly in mirrored root `AGENTS.md` and `CLAUDE.md` managed blocks.

- CLI intent routing starts with `packages/cli/src/cli.ts:119-147`, which loads the existing manifest, infers `apply` versus `reconfigure`, and records whether selections came from defaults, saved manifest state, flags, or the interactive wizard. Bare apply against an existing manifest intentionally behaves like sync instead of reopening the wizard, as covered by `packages/cli/tests/cli.test.ts:173-203`.
- First interactive installs and interactive reconfigure runs pass through the wizard in `packages/cli/src/cli.ts:150-175`, but non-interactive `--yes` runs skip prompts and rely on default or saved selections from `packages/cli/src/cli.ts:128-137` and `packages/cli/src/cli.ts:295-346`. First-run defaults under `--yes` are verified in `packages/cli/tests/cli.test.ts:210-229`.
- The capability graph is encoded directly in `packages/cli/src/profile.ts:10-15`; `packages/cli/src/profile.ts:42-65` keeps explicit selections even when prerequisites are missing, then marks downstream capabilities ineffective until prerequisites return. That “selected but disabled” behavior is also part of the user-facing installer contract in `README.md:64-71`.
- Profile identity is deterministic. `packages/cli/src/profile.ts:74-92` hashes capability state, prompts, template/reference modes, harness toggles, skill enablement, skill scope, and sorted selected skills into a stable `profileId`, so later syncs compare the current target against a precise profile instead of a vague “installed” flag.
- Planning starts by resolving all desired docs and skill assets in `packages/cli/src/planner.ts:33-45`, then classifies each selected path by comparing desired content, on-disk content, manifest hashes, prior skill content, and explicit managed-file conflict resolutions in `packages/cli/src/planner.ts:51-140` and `packages/cli/src/planner.ts:276-346`. A manifest hash mismatch is evidence that review may be needed, not proof that the user locally modified a selected desired managed file; existing selected diffs become reviewable until the user explicitly chooses overwrite or skip. Existing managed files that are no longer desired become `remove-managed` only when the subsystem can prove they are still managed in `packages/cli/src/planner.ts:142-189` and `packages/cli/src/planner.ts:348-390`.
- Reconfiguration is the same planner/apply pipeline with a different selection source. `packages/cli/src/install.ts:26-62` always resolves a fresh profile, while `packages/cli/src/install.ts:107-164` applies actions and writes a new manifest snapshot. The round-trip from full install to partial profile and back is covered in `packages/cli/tests/install.test.ts:741-763`.
- Conflict handling is review-first for selected managed files. Divergent selected files surface through batch or per-file overwrite/skip decisions before apply; unresolved reviewable diffs cannot be applied, and non-interactive runs fail instead of inferring skip or overwrite. Staging under `.make-docs/conflicts/` remains a lifecycle safety mechanism for generated replacements that are intentionally preserved for manual review, but selected desired diffs are resolved before writes begin. The managed-file review boundary is covered in `packages/cli/tests/install.test.ts` and `packages/cli/tests/cli.test.ts`.
- Skills participate in the same lifecycle but keep separate ownership tracking. `packages/cli/src/install.ts:114-156` carries `skillFiles` independently from `manifest.files`, and `packages/cli/src/planner.ts:204-390` uses prior canonical skill content to decide whether a skill file can be refreshed or removed safely. Harness deselection removes only that harness’s tracked skill files in `packages/cli/tests/install.test.ts:765-781`, while `--no-skills` clears stored skill ownership in `packages/cli/tests/cli.test.ts:272-289`.

## Contracts and Data

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for `prompts`, `templatesMode`, and `referencesMode` as user-facing persisted choices.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for replacing `optionalSkills`, required/default skills, selected-by-default skills, and legacy optional-skill backfill with current-manifest `selectedSkills`.
- Superseded by [13-revise-cli-conflict-resolution.md](./13-revise-cli-conflict-resolution.md) for planner/apply behavior around selected managed-file diffs and non-interactive conflict handling.
- Superseded by [15-revise-agent-instruction-file-ownership.md](./15-revise-agent-instruction-file-ownership.md) for manifest hashing of root agent instruction files. Manifest entries for `AGENTS.md` and `CLAUDE.md` now hash the managed block body rather than whole-file content; W17's dedicated `.make-docs/AGENTS.md` and `.make-docs/CLAUDE.md` instruction assets are removed when they are still manifest-clean.
- Enhanced by [16-revise-package-and-deployment-boundaries.md](./16-revise-package-and-deployment-boundaries.md) for package provenance and shared lifecycle safety contracts. `.make-docs/manifest.json`, audit snapshots, backup, uninstall, conflict staging, and selected-skill ownership remain TypeScript-owned until an accepted Rust parity plan moves them, and any Rust distribution must preserve those contracts.
- Enhanced by [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) for asset-set provenance and provider/cache safety. Future manifest state must record materialization mode, provider or package source, immutable ref or version, hash algorithm and hash set, logical asset id, local materialization path, offline expectation, recovery guidance, and selection trigger before provider-backed mode can become reliable.
- Enhanced by [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) for manifest compatibility and migration disposition. Existing installs must be classified by parseable manifest state, schema/package identity, selections, managed-file records, skill records, materialization provenance, hashes, managed-block state, selected-skill outputs, local bootstrap evidence, and conservative fallback recognition before any mutation.
- Enhanced by [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) for tool-resource provenance. Manifest evolution must eventually distinguish runtime state, system tool resources, custom overlays, materialization mode, provider/cache identity, and local bootstrap expectations.
- Enhanced by [22-revise-new-docs-assets-playbooks-persona-model.md](./22-revise-new-docs-assets-playbooks-persona-model.md) for reader-facing guide/playbook persona metadata. Future manifest or validation work may record provenance for shipped guide/playbook defaults, but persona authority remains the `persona` frontmatter field, not directory placement alone.
- Enhanced by [24-revise-configuration-convention-overlay.md](./24-revise-configuration-convention-overlay.md) for local convention configuration. Install, reconfigure, provider refresh, package sync, cache recovery, audit, backup, and uninstall planning must preserve project-owned `.make-docs/config.yaml` separately from make-docs-owned manifest/runtime state.
- Enhanced by [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) for selected-agentics ownership. Future manifest schema must distinguish resolved `selectedSkills`, transitional flat `skillFiles`, canonical shared payload paths, generated harness stub paths, exposure mode, scope, source manifest/version/ref/digest/trust metadata, and migrated duplicated-payload disposition before audit, backup, uninstall, or migration treats v2 agentic state as clean.

- User intent is captured by `InstallSelections` in `packages/cli/src/types.ts:38`, which includes capability toggles, prompt/template/reference modes, harness toggles, `skills`, `skillScope`, and `selectedSkills`. Root instruction enablement is derived from harness state by `getActiveInstructionKinds()` in `packages/cli/src/types.ts:49`.
- Effective capability state is stored per capability in `CapabilityState` at `packages/cli/src/types.ts:61` and aggregated into `InstallProfile` at `packages/cli/src/types.ts:68`. The important invariant is that explicit intent and effective capability can differ, but the manifest stores both the original selections and the final `effectiveCapabilities` via `packages/cli/src/manifest.ts:79-96`.
- Managed install state is persisted in `InstallManifest` at `packages/cli/src/types.ts:87` and written to `.make-docs/manifest.json` by `packages/cli/src/manifest.ts:98-101`. The manifest carries `schemaVersion`, package identity, `updatedAt`, `profileId`, raw selections, effective capabilities, `files`, and `skillFiles`.
- Backward compatibility is part of the contract where it remains safe. `packages/cli/src/manifest.ts:40-76` migrates legacy `instructionKinds` installs into harness selections, while deprecated `optionalSkills` manifests are rejected instead of silently preserving older skill-selection semantics. The legacy manifest migration is exercised in `packages/cli/tests/install.test.ts`.
- Planning output is represented by `InstallPlan` and `PlannedAction` in `packages/cli/src/types.ts:105` and `packages/cli/src/types.ts:114`. The user-facing plan summarizes missing-file creation as `generate`, selected existing-file overwrite as `update`, explicit user preservation as `skip`, and managed removal as `remove`; unresolved reviewable diffs remain a pre-apply condition rather than a final planned operation.
- Apply output is represented by `ApplyResult` in `packages/cli/src/types.ts:129` and produced by `packages/cli/src/install.ts:148-163`. A successful apply always returns the refreshed manifest plus any staged conflict files, even when the plan contained only `noop` actions or only skill-file changes.
- Manifest-derived audit context is normalized into `ManifestAuditContext` and `ManifestAuditRecord` in `packages/cli/src/types.ts:202-211`, then built from manifest entries and skill-file paths in `packages/cli/src/manifest.ts:104-133` and `packages/cli/src/manifest.ts:226-239`. `createAuditPathMetadata()` in `packages/cli/src/manifest.ts:135-183` is the shared path-normalization contract that decides project-versus-home scope and `_home/...` backup-relative paths.
- Lifecycle consumers operate on `AuditReport`, `BackupDestinationPlan`, and `BackupExecutionResult` in `packages/cli/src/types.ts:241`, `packages/cli/src/types.ts:253`, and `packages/cli/src/types.ts:271`. `packages/cli/src/audit.ts:79-87` produces the removable, prunable, preserved, and skipped buckets that backup and uninstall trust as their execution boundary.

## Integrations

- The install planner depends on upstream asset suppliers rather than scanning the repo directly: `packages/cli/src/planner.ts:33-36` resolves desired docs assets and desired skill assets before any diffing. This means the lifecycle subsystem owns reconciliation and safety policy, not asset generation itself.
- The CLI surface, wizard, and maintainer docs all assume the same public lifecycle model. `packages/cli/src/README.md:81-99` documents the wizard checkpoints and post-run manifest inspection, while contributor notes in `packages/cli/src/README.md:208-211` explicitly call out CLI flags and manifest behavior as compatibility-sensitive.
- Audit is the bridge from install state to destructive lifecycle work. In manifest-present mode, `packages/cli/src/audit.ts:90-147` reads manifest hashes, handles instruction files by managed block, and marks clean matches removable in `packages/cli/src/audit.ts:233-321`. In manifest-missing mode, `packages/cli/src/audit.ts:323-430` falls back to canonical default template content and known skill roots, then preserves ambiguous cases in `packages/cli/src/audit.ts:432-575`.
- Backup consumes a single audit snapshot, maps project paths directly and home-scoped skill paths under `_home`, then copies only audited removable files and materialized empty directories to `.backup/YYYY-MM-DD...` in `packages/cli/src/backup.ts:86-158` and `packages/cli/src/manifest.ts:155-160`. The behavior is verified for project files, global skills, ordinals, cancellation, and noop runs in `packages/cli/tests/backup.test.ts:127-360`.
- Uninstall shares the same audit snapshot and can optionally run backup before any deletion. `packages/cli/src/uninstall.ts:81-177` creates the review plan, optionally executes `prepareBackupExecution()` and `executePreparedBackup()` against the same audit report, then removes only `removableFiles` and prunes only `prunableDirectories`. Success, preservation rules, two-step confirmation, and partial-failure reporting are covered in `packages/cli/tests/uninstall.test.ts:156-345` and `packages/cli/tests/uninstall.test.ts:458-540`.
- Backup and uninstall both protect the project backup root from recursive self-damage. Audit excludes `.backup/` in `packages/cli/src/audit.ts:168-178` and `packages/cli/src/audit.ts:451-461`, while uninstall refuses to delete anything inside `.backup/` in `packages/cli/src/uninstall.ts:191-199`. The exclusion is also asserted in `packages/cli/tests/audit.test.ts:493-518` and `packages/cli/tests/lifecycle.test.ts:76-100`.

## Rebuild Notes

- Preserve the three install modes exactly: first install when no manifest exists, bare sync when a manifest exists and the user does not ask to reconfigure, and explicit reconfigure only through `make-docs reconfigure` in `packages/cli/src/cli.ts:119-147` and `packages/cli/src/cli.ts:794-802`. Reconfigure without a manifest is a hard error in `packages/cli/src/cli.ts:122-126` and is covered by `packages/cli/tests/cli.test.ts:672-678`.
- Preserve the non-destructive selected-file policy. A clean rebuild must never silently overwrite divergent selected managed files based only on manifest hash mismatch; it must require explicit overwrite/skip resolution before apply, fail non-interactive runs with unresolved reviewable diffs, and continue staging generated replacements under `.make-docs/conflicts/<run-id>/...` only for the lifecycle paths that intentionally preserve replacement content for manual review. Tests in `packages/cli/tests/install.test.ts` and `packages/cli/tests/cli.test.ts` are the practical acceptance boundary.
- Preserve dual ownership tracking for docs files versus skill files. `packages/cli/src/install.ts:130-145` and `packages/cli/src/install.ts:148-156` intentionally let `manifest.skillFiles` contain entries that do not appear in `manifest.files`, so a clean-room rebuild must not collapse these into one map unless the audit and removal logic in `packages/cli/src/audit.ts:129-145`, `packages/cli/src/audit.ts:274-310`, and `packages/cli/src/audit.ts:745-793` is redesigned at the same time.
- Preserve conservative audit fallback when the manifest is missing. `packages/cli/src/audit.ts:331-399` assumes `defaultSelections()` and known canonical fingerprints, then keeps ambiguous paths preserved in `packages/cli/src/audit.ts:567-575` instead of broadening removal. This is an intentional safety tradeoff, not a gap to “optimize away,” and `packages/cli/tests/audit.test.ts:467-487` plus `packages/cli/tests/lifecycle.test.ts:103-127` confirm that behavior.
- Candidate item for the shared risk register: the README says “unchanged managed files are updated in place” in `README.md:101-107` and `packages/cli/README.md:84-89`, but the code plans `noop` actions for exact matches in `packages/cli/src/planner.ts:66-74` and reports `Already current` / `Changes planned: 0` in `packages/cli/src/cli.ts:745-779`. The behavior is correct in code and tests; the wording appears drifted.
- Candidate item for the shared risk register: uninstall and backup can prove removability of manifest-tracked skill files only when canonical skill content can be regenerated in `packages/cli/src/audit.ts:129-145` and `packages/cli/src/audit.ts:745-793`; otherwise those files are preserved as ambiguous in `packages/cli/src/audit.ts:274-310`. Any future change to skill packaging, skill asset source layout, or content-loading boundaries should be tracked centrally because manifest-only skill ownership currently depends on regeneration rather than stored hashes.
- Candidate item for the shared risk register: global/home-scoped skill installs are first-class managed state, not incidental extras. `_home/...` backup mapping is encoded in `packages/cli/src/manifest.ts:155-160`, audited in `packages/cli/tests/audit.test.ts:575-603`, and backed up without deleting the source in `packages/cli/tests/backup.test.ts:219-250` and `packages/cli/tests/lifecycle.test.ts:181-205`. Any rebuild that assumes all managed paths live under the target directory will break lifecycle safety.

## Source Anchors

- `README.md:58`
- `README.md:92`
- `packages/cli/README.md:41`
- `packages/cli/README.md:75`
- `packages/cli/src/README.md:22`
- `packages/cli/src/README.md:81`
- `packages/cli/src/cli.ts:77`
- `packages/cli/src/profile.ts:10`
- `packages/cli/src/planner.ts:19`
- `packages/cli/src/planner.ts:204`
- `packages/cli/src/install.ts:26`
- `packages/cli/src/install.ts:107`
- `packages/cli/src/manifest.ts:17`
- `packages/cli/src/audit.ts:41`
- `packages/cli/src/backup.ts:49`
- `packages/cli/src/uninstall.ts:52`
- `packages/cli/src/types.ts:38`
- `packages/cli/tests/profile.test.ts:4`
- `packages/cli/tests/install.test.ts:584`
- `packages/cli/tests/cli.test.ts:173`
- `packages/cli/tests/audit.test.ts:439`
- `packages/cli/tests/backup.test.ts:127`
- `packages/cli/tests/uninstall.test.ts:156`
- `packages/cli/tests/lifecycle.test.ts:76`
- `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`
- `docs/prd/24-revise-configuration-convention-overlay.md`
- `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
