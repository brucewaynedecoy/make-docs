# 05 Installation, Profile, and Manifest Lifecycle

## Purpose

This subsystem turns user selections into a deterministic managed footprint and keeps later lifecycle operations narrow, stateful, and non-destructive. `runCli` and `inferInstallIntent` in `packages/cli/src/cli.ts` decide whether a run is a first install, a manifest-backed sync, or an explicit reconfiguration; `resolveInstallProfile` in `packages/cli/src/profile.ts` derives the effective capability set and stable `profileId`; and `createInstallPlan`, `applyInstallPlan`, and `writeManifest` in `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, and `packages/cli/src/manifest.ts` convert desired state into file actions plus persisted manifest state.

The public repo docs describe the same subsystem as the installer surface that writes only the selected footprint and records it under `.make-docs/manifest.json` for future apply/sync runs in `README.md`, with the CLI package README repeating the same contract in `packages/cli/README.md`.

## Scope

- Covers install, sync, and reconfigure orchestration in `runCli`, `getApplyConfirmationMessage`, and `writeApplyCompletionSummary` in `packages/cli/src/cli.ts`, including target resolution, TTY checks, wizard entry, dry-run behavior, apply confirmation, and completion summaries.
- Covers dependency-aware selection resolution in `CAPABILITY_DEPENDENCIES`, `resolveCapabilityState`, and `resolveInstallProfile` in `packages/cli/src/profile.ts`, where `prd` depends on `plans` and `work` depends on both `plans` and `prd`; the dependency behavior is regression-tested in `packages/cli/tests/profile.test.ts`.
- Covers desired-state planning and action selection in `createInstallPlan` and `createSkillsOnlyInstallPlan` in `packages/cli/src/planner.ts`, including create, generate, update, noop, remove-managed, unresolved reviewable diffs, and explicit provenance-aware file dispositions.
- Covers apply semantics and conflict staging in `applyInstallPlan`, `applySkillsOnlyInstallPlan`, and their shared internal apply path in `packages/cli/src/install.ts`, including manifest refresh, skill-file tracking, and staging generated replacements under `.make-docs/conflicts/<run-id>/...`.
- Covers manifest schema, migration, and audit metadata generation in `validateAndMigrateManifest`, `createManifestAuditRecord`, and `createAuditPathMetadata` in `packages/cli/src/manifest.ts`, including legacy `instructionKinds` migration and rejection of deprecated optional-skill manifest shapes.
- Covers backup, audit, and uninstall only where they depend on this subsystem’s managed-path model, manifest hashes, or prior selections in `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts`.
- Does not restate the full static asset-catalog contract owned upstream by `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, and skill asset resolution; this doc treats those modules as desired-state suppliers, consistent with `packages/cli/src/README.md`.

## Component and Capability Map

- Install and sync use `setup`; explicit reconfiguration uses `setup reconfigure`; skills maintenance uses `setup skills`; backup uses `setup backup`; and project uninstall uses `setup remove`. Bare `make-docs` is context-aware: it starts guided setup when no install is present and otherwise shows status and help without auto-sync. `setup` and `setup reconfigure` detect pre-v2 configuration and require warning plus backup or cancellation. The three install modes, dependency-aware selection resolution, planner/apply flow, conflict staging, and reviewed audit-snapshot safety model remain active under these spellings, as defined with the command grammar in [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md).

- CLI intent routing starts with `runCli`, `inferInstallIntent`, `resolveSelections`, and `describeSelectionSource` in `packages/cli/src/cli.ts`, which load the existing manifest, infer `apply` versus `reconfigure`, and record whether selections came from defaults, saved manifest state, flags, or the interactive wizard. Bare apply against an existing manifest intentionally behaves like sync instead of reopening the wizard, as covered by `packages/cli/tests/cli.test.ts`.
- First interactive installs and interactive reconfigure runs pass through the wizard in `runCli` in `packages/cli/src/cli.ts`; non-interactive `--yes` runs skip prompts, and `resolveSelections` combines saved state or `defaultSelections` from `packages/cli/src/profile.ts` with CLI overrides. First-run defaults under `--yes` are verified in `packages/cli/tests/cli.test.ts`.
- The capability graph is encoded by `CAPABILITY_DEPENDENCIES` in `packages/cli/src/profile.ts`; `resolveCapabilityState` keeps explicit selections even when prerequisites are missing, then marks downstream capabilities ineffective until prerequisites return. That “selected but disabled” behavior is also part of the user-facing installer contract in `README.md`.
- Profile identity is deterministic. The stable `profileId` hashes capability state, harness toggles, skill enablement, skill scope, sorted selected skills, and explicit local system-resource projection selections so later syncs compare the target against precise intent instead of a vague “installed” flag. Machine-served contracts, prompts, references, and templates are the default and add no local-file footprint until a user selects a provenance-aware project projection.
- Planning starts in `createInstallPlan` in `packages/cli/src/planner.ts`, which resolves desired docs and skill assets and classifies each selected path by comparing desired content, on-disk content, manifest hashes, prior skill content, and explicit managed-file conflict resolutions. A manifest hash mismatch is evidence that review may be needed, not proof of current ownership; existing selected diffs remain reviewable until the user chooses an accepted file-scoped disposition. Existing managed files that are no longer desired become `remove-managed` only when the planner can prove they are still clean managed content.
- Reconfiguration is the same planner/apply pipeline with a different selection source. `planInstall` in `packages/cli/src/install.ts` always resolves a fresh profile, while `applyInstallPlan` applies actions and writes a new manifest snapshot. The round-trip from full install to partial profile and back is covered in `packages/cli/tests/install.test.ts`.
- Conflict handling is review-first for selected managed files. Divergent paths surface through file-scoped preserve-as-project-owned, export-then-replace, proven-managed overwrite, skip, or stop decisions before apply; unresolved reviewable diffs cannot be applied, and non-interactive runs fail instead of inferring ownership or disposition. Staging under `.make-docs/conflicts/` remains a lifecycle safety mechanism for replacements intentionally preserved for manual review, but selected desired diffs are resolved before writes begin.
- Skills participate in the same lifecycle but keep separate ownership tracking. `packages/cli/src/install.ts` carries `skillFiles` independently from `manifest.files`, and `packages/cli/src/planner.ts` uses prior canonical skill content to decide whether a skill file can be refreshed or removed safely. Harness deselection removes only that harness’s tracked skill files in `packages/cli/tests/install.test.ts`, while `--no-skills` clears stored skill ownership in `packages/cli/tests/cli.test.ts`.

## Contracts and Data

### Selection and Manifest Invariants

- Contracts, prompts, references, and templates are resolved from the machine-installed provider by default through stable `make-docs://system/<type>/<posix-relative-path>` identities. Setup does not eagerly copy the full resource snapshot into a project.
- Interactive setup and `setup reconfigure` offer explicit local projection selection as none, individual resource types, or all, show the resulting file plan, and persist the reviewed choice. Non-interactive operation uses explicit selection input or the saved manifest selection and never silently broadens it.
- A selected projection writes only the chosen resources under `.make-docs/system/{contracts,prompts,references,templates}/**`. Each record includes stable resource URI and type, normalized project-relative POSIX path, selection trigger, ownership (`managed-snapshot` or `project-owned`), provider/package identity and immutable version or ref, hash algorithm and digest, and provenance state (`verified`, `incomplete`, `ambiguous`, or `contradictory`). Non-verified provenance retains evidence and competing claims and fails closed before overwrite, removal, adoption, update, or migration.
- The project manifest also records stable project identity, effective capability and skill selections, router ownership, selected resource projection, managed-file and managed-block snapshots, adoption receipts, last reviewed classification snapshot identity, and lifecycle disposition. A missing, stale, malformed, incomplete, ambiguous, or contradictory manifest cannot authorize destructive change.
- Skills are disabled in fresh defaults with `selectedSkills: []` and inert project scope. Current manifests store explicitly selected names in `selectedSkills`; deprecated `optionalSkills` state is rejected rather than migrated, and `skillFiles` remains separate managed-output ownership tracking rather than merging into `manifest.files`.

### Managed-File Conflict Planning

- Before prompting, the planner identifies every reviewable diff among selected desired managed files: agent instructions, references, templates, prompts, selected skill assets, and other generic managed files.
- Review may group paths for navigation, but every changed path resolves to exactly one explicit disposition: preserve as project-owned, export the current bytes then replace, overwrite only when the frozen snapshot proves clean managed ownership, skip, or stop. Append-merge is not ownership evidence. Agent instruction block ownership remains governed separately by PRD 15.
- Decisions produce an explicit per-path resolution map bound to one frozen classification snapshot. Apply is deterministic from the selected desired set plus that map: it does not reclassify, prompt, infer an absent resolution, perform implicit overwrite, or broaden selection after approval.
- Missing files and matching verified managed files retain automatic behavior. Modified, project-owned, mixed, unknown, or non-verified paths are preserved until explicitly resolved; selected skill and system-resource projection diffs follow the same review boundary while retaining their dedicated ownership records.

- Provider-backed manifest state must record machine-served default resolution separately from explicitly projected local resources, including provider or package source, immutable ref or version, hash algorithm and hash set, stable resource URI, local projection path when present, offline expectation, recovery guidance, ownership, provenance state, and selection trigger, consistent with [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md).
- Before mutation, existing installs must be classified by parseable manifest state, schema/package identity, selections, managed-file records, skill records, materialization provenance, hashes, managed-block state, selected-skill outputs, local bootstrap evidence, and conservative fallback recognition under [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- The manifest must distinguish runtime state, system tool resources, custom overlays, materialization mode, provider/cache identity, and local bootstrap expectations defined by [21-project-tool-directory-and-resource-tiers.md](./21-project-tool-directory-and-resource-tiers.md).
- [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns `.make-docs/system/**`, `.make-docs/archive/**`, `docs/artifacts/**`, and persona testing placement, while [47-persona-model.md](./47-persona-model.md) owns persona metadata. The manifest may record provenance for selected shipped resources, but never claims project-owned documentation merely from directory placement.
- Install, reconfigure, provider refresh, package sync, cache recovery, audit, backup, and uninstall planning must preserve project-owned `.make-docs/config.yaml` separately from make-docs-owned manifest/runtime state under [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md).
- Selected-agentics manifest state must distinguish resolved `selectedSkills`, transitional flat `skillFiles`, canonical shared payload paths, generated harness stub paths, exposure mode, scope, source manifest/version/ref/digest/trust metadata, and migrated duplicated-payload disposition before audit, backup, uninstall, or migration treats v2 agentic state as clean; [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md) owns the exposure contract.
- Make Docs v2 has no current Playbook or Protocol selection, discovery, or execution behavior. Legacy Playbook/Protocol files and Store rows are opaque preservation inputs and never become a managed-file class through setup, reconfigure, update, uninstall, backup, or migration.
- New backup writes use `.make-docs/backup/**`; root `.backup/**` remains protected legacy backup state; and empty managed `.make-docs/agentics/**` directories are pruned only when audit proves no unmanaged descendants remain, consistent with [38-global-store-and-project-state.md](./38-global-store-and-project-state.md).
- Backup snapshots use `.make-docs/backup/<date>`. The first snapshot for a date uses the plain date; later same-day snapshots use deterministic zero-padded ordinals. Home-scoped managed files are stored under `_home/**` within that snapshot.
- Root `.backup/**` is excluded from new snapshot ordinal calculation and remains protected legacy recovery state. Audit, backup, uninstall, fallback recognition, and pruning must not delete it, recurse destructively into it, or treat it as removable managed output; new runs never create snapshots there.
- Backup and uninstall consume one reviewed audit snapshot. `setup remove` with backup writes the `.make-docs/backup/**` snapshot and machine-readable restoration manifest before deletion and removes only verified clean managed paths or blocks approved by that same snapshot. Project-owned, modified, mixed, ambiguous, contradictory, archive, project-documentation, and opaque legacy state is preserved; directories are pruned only when proven empty and safe.
- General lifecycle `runs` and bounded `run_evidence` live in the machine Store keyed by the stable manifest project identifier; no run state is written under `.make-docs/runs/**` or any repository path. The project manifest remains repository authority for installed ownership, and Store receipts prove only their own transaction. Opaque legacy `playbook_runs` is excluded from current listings and untouched under [38-global-store-and-project-state.md](./38-global-store-and-project-state.md).
- Setup mints the stable project identifier and records it in `.make-docs/manifest.json` as the key for project-scoped Store rows. The Store install registry is only a mirror; project removal does not prune Store rows unless a separate explicit reviewed action authorizes that cleanup.

- User intent includes capability and harness toggles, skills, skill scope, selected skills, and explicit local system-resource projection selection. Root instruction enablement derives from harness state; machine-served resources remain available without local projection, and saved projection selections are reused only by setup/reconfigure without silent broadening.
- Effective capability state is stored per capability in `CapabilityState` and aggregated into `InstallProfile` in `packages/cli/src/types.ts`. The important invariant is that explicit intent and effective capability can differ, but `writeManifest` in `packages/cli/src/manifest.ts` stores both the original selections and the final `effectiveCapabilities`.
- Managed install state is persisted in `InstallManifest` in `packages/cli/src/types.ts` and written to `.make-docs/manifest.json` by `writeManifest` in `packages/cli/src/manifest.ts`. Its current contract includes schema and package identity, stable project id, timestamps, profile id, raw and effective selections, selected projection, file and block ownership records, provenance, hashes, routers, dispositions, and adoption receipts.
- Every project-relative path is stored in normalized POSIX form and resolved beneath an explicit root. Planning and apply reject traversal, absolute substitution, Windows drive/UNC ambiguity, platform case collision, symlink escape, unsafe permissions, and non-atomic cross-filesystem replacement; local writes use same-filesystem temporary files plus atomic replacement while the project lifecycle lock is held.
- Backward compatibility is part of the contract where it remains safe. `validateAndMigrateManifest` and `migrateSelections` in `packages/cli/src/manifest.ts` migrate legacy `instructionKinds` installs into harness selections, while deprecated `optionalSkills` manifests are rejected instead of silently preserving older skill-selection semantics. The legacy manifest migration is exercised in `packages/cli/tests/install.test.ts`.
- Planning output is represented by `InstallPlan` and `PlannedAction`. The user-facing plan summarizes missing-file creation as `generate`, an explicitly resolved overwrite as the internal `update` operation, explicit user preservation as `skip`, and managed removal as `remove`. `Update` is never offered as a conflict-resolution choice; unresolved reviewable diffs remain a pre-apply condition rather than a final planned operation.
- Apply output is represented by `ApplyResult` in `packages/cli/src/types.ts` and produced by `applyInstallPlan` / `applySkillsOnlyInstallPlan` in `packages/cli/src/install.ts`. A successful apply always returns the refreshed manifest plus any staged conflict files, even when the plan contained only `noop` actions or only skill-file changes.
- Manifest-derived audit context is normalized into `ManifestAuditContext` and `ManifestAuditRecord` in `packages/cli/src/types.ts`, then built by `getManifestAuditContext` and `createManifestAuditRecord` in `packages/cli/src/manifest.ts`. `createAuditPathMetadata` in the same module is the shared path-normalization contract that decides project-versus-home scope and `_home/...` backup-relative paths.
- Lifecycle consumers operate on `AuditReport`, `BackupDestinationPlan`, and `BackupExecutionResult` in `packages/cli/src/types.ts`. `createAuditReport` in `packages/cli/src/audit.ts` produces the removable, prunable, preserved, and skipped buckets that backup and uninstall trust as their execution boundary.

## Integrations

- The install planner depends on upstream asset suppliers rather than scanning the repo directly: `createInstallPlan` in `packages/cli/src/planner.ts` resolves desired docs assets and desired skill assets before any diffing. This means the lifecycle subsystem owns reconciliation and safety policy, not asset generation itself.
- The CLI surface, wizard, and maintainer docs all assume the same public lifecycle model. `packages/cli/src/README.md` documents wizard checkpoints and post-run manifest inspection while also identifying CLI flags and manifest behavior as compatibility-sensitive contributor surfaces.
- Audit is the bridge from install state to destructive lifecycle work. `createAuditReport` in `packages/cli/src/audit.ts` dispatches manifest-present records through `classifyManifestPresent` and `classifyManifestRecord`, including managed-block checks for instruction files. Its manifest-missing fallback uses canonical default template content and known skill roots, then preserves ambiguous cases rather than guessing.
- Backup consumes a single audit snapshot, maps project paths directly and home-scoped skill paths under `_home`, then copies only audited removable files and materialized empty directories to the reviewed destination in `packages/cli/src/backup.ts` and `packages/cli/src/manifest.ts`. New backups must use `.make-docs/backup/YYYY-MM-DD...`; legacy root `.backup/**` remains protected state and is never a destination for new backup writes. The behavior is verified for project files, global skills, ordinals, cancellation, and noop runs in `packages/cli/tests/backup.test.ts`.
- Uninstall shares the same audit snapshot and can optionally run backup before any deletion. `runUninstallCommand` in `packages/cli/src/uninstall.ts` creates the review plan, optionally executes `prepareBackupExecution()` and `executePreparedBackup()` against the same audit report, then removes only `removableFiles` and prunes only `prunableDirectories`. `packages/cli/tests/uninstall.test.ts` covers success, preservation rules, two-step confirmation, and partial-failure reporting.
- Backup, audit, and uninstall must protect both `.make-docs/backup/**` and legacy root `.backup/**` from recursive self-damage. The legacy root exclusion is asserted in `packages/cli/tests/audit.test.ts` and `packages/cli/tests/lifecycle.test.ts`.

## Rebuild Notes

- Preserve the three install intents exactly under the [current command model](./39-cli-command-model-and-operation-registry.md): first install through `make-docs setup` or the context-aware bare command when no install exists, saved-selection sync through `make-docs setup`, and explicit reconfiguration only through `make-docs setup reconfigure`. Bare `make-docs` against an existing install shows status and help without auto-sync, and `setup reconfigure` without an installed project remains a hard error.
- Preserve the non-destructive selected-file policy. A clean rebuild must never silently overwrite divergent selected files based only on manifest hash mismatch; it requires an explicit preserve-as-project-owned, export-then-replace, proven-managed overwrite, skip, or stop disposition bound to the frozen classification snapshot, fails non-interactive runs with unresolved diffs, and stages replacements only on lifecycle paths that intentionally preserve them for manual review.
- Preserve dual ownership tracking for docs files versus skill files. `applyInstallPlan`, `applySkillsOnlyInstallPlan`, and their `trackSkillFilesInManifestFiles` apply option in `packages/cli/src/install.ts` intentionally let `manifest.skillFiles` contain entries that do not appear in `manifest.files`, so a clean-room rebuild must not collapse these into one map unless `createAuditReport`, `classifyManifestPresent`, and `classifyManifestRecord` in `packages/cli/src/audit.ts` are redesigned at the same time.
- Preserve conservative audit fallback when the manifest is missing. `classifyManifestMissing` in `packages/cli/src/audit.ts` uses `defaultSelections()` and known canonical fingerprints, while `classifyFallbackRecord` preserves ambiguous paths instead of broadening removal. This is an intentional safety tradeoff, not a gap to “optimize away,” and `packages/cli/tests/audit.test.ts` plus `packages/cli/tests/lifecycle.test.ts` confirm that behavior.
- [D-001](03-open-questions-and-risk-register.md#d-001-readme-wording-understates-the-live-idempotent-sync-model) records the documentation drift between README wording and the live idempotent sync model: `createInstallPlan` in `packages/cli/src/planner.ts` emits `noop` for exact matches, while `printPlan` in `packages/cli/src/cli.ts` reports `Already current` and zero planned changes.
- Candidate item for the shared risk register: uninstall and backup can prove removability of manifest-tracked skill files only when `loadCanonicalSkillContentByPath` can regenerate canonical content for `classifyManifestRecord` in `packages/cli/src/audit.ts`; otherwise `classifyFallbackRecord` preserves those files as ambiguous. Any future change to skill packaging, skill asset source layout, or content-loading boundaries should be tracked centrally because manifest-only skill ownership currently depends on regeneration rather than stored hashes.
- Candidate item for the shared risk register: global/home-scoped skill installs are first-class managed state, not incidental extras. `_home/...` backup mapping is encoded in `packages/cli/src/manifest.ts`, audited in `packages/cli/tests/audit.test.ts`, and backed up without deleting the source in `packages/cli/tests/backup.test.ts` and `packages/cli/tests/lifecycle.test.ts`. Any rebuild that assumes all managed paths live under the target directory will break lifecycle safety.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 11, 13, 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Component and Capability Map`, `Selection and Manifest Invariants`, `Managed-File Conflict Planning`, `Contracts and Data`, and `Rebuild Notes`
- Previous contract: Prompt, template, and reference families were invariant eager managed assets; conflicts reduced mainly to overwrite or skip; the manifest lacked the recovered projection, ownership, and provenance contract; and project removal pruned Store rows.
- Replacement contract: Machine-served system resources are the default with explicit setup/reconfigure projection selection; the manifest records stable resource and project identity, `managed-snapshot` versus `project-owned` provenance, hashes, competing claims, routers, dispositions, and adoption receipts; one frozen classification snapshot governs conflict review, backup, rollback, update, uninstall, and separately authorized Store cleanup.
- Rationale: Recovery requires deterministic installed identity without forcing a full local snapshot or treating uncertain and project-owned content as disposable managed state.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- `README.md`
- `packages/cli/README.md`
- `packages/cli/src/README.md`
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/types.ts`
- `packages/cli/tests/profile.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/34-playbook-authoring-contract-and-model.md`
- `docs/prd/38-global-store-and-project-state.md`
- `docs/designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md`
- `docs/plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
