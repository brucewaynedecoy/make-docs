# 07 CLI Command Surface and Lifecycle

## Purpose

This subsystem owns the project-facing review and execution flows behind the current `make-docs` operator surface: context-aware bare setup, `setup`, `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove`. [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md) owns the complete command grammar, registry-derived `run` surface, MCP exposure, and machine-level `update` and `uninstall`; this PRD owns the wizard, selection, plan/apply, and safety-first shared-audit behavior that those project lifecycle commands invoke.

The user-facing contract is broader than a thin command parser. `runCli`, `validateParsedArgs`, and the removed-command validation helpers in `packages/cli/src/cli.ts` define interactive boundaries, pre-mutation review, and legacy-command rejection; `LifecycleRenderer` and `createClackLifecycleRenderer` in `packages/cli/src/lifecycle-ui.ts` summarize lifecycle risk.

## Scope

This document covers:

- top-level command parsing, validation, dispatch, and help text in `Command`, `ParsedArgs`, `parseArgs`, `validateParsedArgs`, `runCli`, and `printHelp` in `packages/cli/src/cli.ts`
- the interactive selection wizard, review loop, and conflict-resolution prompts in `runSelectionWizard`, `renderWizardReviewSummary`, and `promptForManagedFileConflictResolutions` in `packages/cli/src/wizard.ts`
- lifecycle rendering and confirmation checkpoints in `LifecycleRenderer` and `createClackLifecycleRenderer` in `packages/cli/src/lifecycle-ui.ts`
- project backup and removal execution behavior behind `setup backup` and `setup remove` in `runBackupCommand` and `runUninstallCommand` in `packages/cli/src/backup.ts` and `packages/cli/src/uninstall.ts`
- the shared audit model that decides removable, preserved, skipped, and prunable paths in `createAuditReport` and `classifyPrunableDirectories` in `packages/cli/src/audit.ts`
- the public CLI promises captured by tests in `packages/cli/tests/cli.test.ts`, `packages/cli/tests/wizard.test.ts`, `packages/cli/tests/backup.test.ts`, `packages/cli/tests/uninstall.test.ts`, and `packages/cli/tests/lifecycle.test.ts`

This document does not re-specify the full install asset catalog, manifest schema, or skill-packaging internals. Those are only covered here where they change the user-visible command surface, selection semantics, or lifecycle safety contract, for example when `runCli` delegates through `runSkillsCommand` in `packages/cli/src/cli.ts` or when `createAuditReport` in `packages/cli/src/audit.ts` consults manifest- and profile-derived expectations.

Code anchors:

- `packages/cli/src/cli.ts` — `runCli`, `parseArgs`, `validateParsedArgs`, `printHelp`
- `packages/cli/src/wizard.ts` — `runSelectionWizard`, `renderWizardReviewSummary`, `promptForManagedFileConflictResolutions`
- `packages/cli/src/lifecycle-ui.ts` — `LifecycleRenderer`, `createClackLifecycleRenderer`
- `packages/cli/src/backup.ts` — `runBackupCommand`, `prepareBackupExecution`, `executePreparedBackup`
- `packages/cli/src/uninstall.ts` — `runUninstallCommand`, `UninstallReviewPlan`
- `packages/cli/src/audit.ts` — `createAuditReport`, `classifyPrunableDirectories`

## Component and Capability Map

### Public command model

- The [current command taxonomy](./39-cli-command-model-and-operation-registry.md) has seven top-level commands: `setup` with `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove`; `project` for project-surface operations; `resource` with `resource list`, `resource read`, and `resource ensure`; `run` for registry operations; `mcp`; and top-level `update` and `uninstall` for machine-footprint tool self-management. Bare `make-docs` starts guided setup when no install is present and otherwise shows status and help without auto-sync. There are no compatibility aliases; review, confirmation, and lifecycle-safety semantics apply under these spellings.

The root parser and help system must present that taxonomy directly, route only registry-admitted operations below `run`, and reject every noncurrent spelling with guidance naming the accepted command. Implementation and test anchors from the pre-PRD 39 parser are provenance, not command authority; their historical taxonomy is recorded only under Requirement History.

The existing Playbook and Protocol CLI and MCP surfaces are a staged compatibility exception. P3 freezes those surfaces and adds no legacy behavior or support claim. P5 is the quiescence stop barrier. P8 owns the fresh trace, backup, and removal.

### Interactive wizard and review flow

- [05-installation-profile-and-manifest-lifecycle.md](./05-installation-profile-and-manifest-lifecycle.md) owns prompt, template, and reference wizard questions and review rows.
- [08-skills-catalog-and-distribution.md](./08-skills-catalog-and-distribution.md) owns skill selection and review language; no required/default/optional category contract exists.

### Interactive Selection Contract

- The setup and reconfigure wizard defaults to machine-served contract, prompt, reference, and template bodies with no eager project snapshot. It always plans the configured-harness router foundation at the project root, `docs/`, `docs/assets/`, `.make-docs/`, `.make-docs/system/`, and the four typed system directories. It adds `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` routers only when the resolved effective profile and its dependencies enable the matching document type. It plans only one managed router at the `docs/assets/` root. It keeps `.make-docs/archive/`, `docs/artifacts/`, and Persona testing on demand. It offers an explicit optional local body choice of none, individual resource types, or all and shows the resulting file plan before approval.
- The retired `--no-prompts`, `--templates`, and `--references` spellings remain invalid rather than aliases. Non-interactive setup/reconfigure accepts only the canonical explicit projection input defined by the command model or the saved manifest selection and never infers or broadens a projection choice.
- Full-install and skills-only selection surfaces present one explicitly selectable skill list. They do not render `Default`, `Optional`, `Required skills`, or `Optional skills` categories; every skill row is selectable and deselectable; and the highlighted detail panel plus bottom selected-skill summary and instructions remain.
- Non-interactive opt-in selection, including `--selected-skills all`, may install first-party skills. The CLI has no `--optional-skills` alias and performs no compatibility migration for deprecated skill-selection state.

### Conflict Review Contract

- When reviewable selected-file diffs exist, the CLI reports the frozen classification and ownership/provenance evidence for each affected path before collecting a disposition.
- Review may group paths for navigation, but each file resolves to preserve as project-owned, export then replace, overwrite only when clean managed ownership is proven, skip, or stop. Append-merge is not ownership evidence, and no batch action erases file-scoped provenance.
- Interactive review produces the complete per-path resolution map and exact mutation plan before apply. Non-interactive execution fails on unresolved, incomplete, ambiguous, or contradictory evidence rather than inferring ownership, overwrite, preservation, or removal.

Interactive selection is a first-class capability, not just a prompt wrapper. `runCli` and `inferInstallIntent` in `packages/cli/src/cli.ts` open the wizard only for first install and explicit reconfigure; a bare run against an existing manifest stays on saved selections and does not reopen the wizard, as verified in `packages/cli/tests/cli.test.ts`.

The wizard is a four-step state machine in `WizardStep` and `runSelectionWizardWithRenderer` in `packages/cli/src/wizard.ts`: capabilities, harnesses, options, and review. Capability selection is dependency-aware through `normalizeWizardSelections` and `buildCapabilityChecklistState` in the same module, so `prd` is disabled without `plans` and `work` is disabled without both `plans` and `prd`; the tests pin those lockouts in `packages/cli/tests/wizard.test.ts`.

The options step controls whether skills are installed, skill scope, explicitly selected skills, and the optional local projection of machine-served system-resource types. Skills default to disabled; resource projection defaults to none; reconfigure starts from stored selection state; and every changed selection appears in the review plan before apply.

Review is a mutable checkpoint, not a final dead end. `renderWizardReviewSummary` composes a human-readable summary in `packages/cli/src/wizard.ts`, and `WizardReviewAction` plus `runSelectionWizardWithRenderer` allow the review step to return to capabilities, harnesses, or options before apply; `packages/cli/tests/wizard.test.ts` pins that loop.

### Plan review, confirmation, and apply orchestration

- Conflict review is provenance-first across divergent selected paths, with an explicit file-scoped disposition inside any navigation group. The active conflict flow has no generic user-facing `Update` action; [05-installation-profile-and-manifest-lifecycle.md](./05-installation-profile-and-manifest-lifecycle.md) owns the planner/apply contract.
- Agent instruction files use the delimited managed-block inline-routing model owned by [15-agent-instruction-ownership-and-managed-blocks.md](./15-agent-instruction-ownership-and-managed-blocks.md), preserving user and project-specific content outside the block rather than claiming whole-file overwrite/skip ownership.

After selections are resolved, the CLI freezes compatibility classification, computes an install plan, collects required file-scoped conflict resolutions, rejects plans with no effective capabilities, prints target, mode, manifest and provenance state, selection source, exact actions, backup/rollback boundary, and only then applies writes while holding the lifecycle lock. Apply may proceed only against the approved snapshot.

Final user-facing planned operations use four verbs: `generate` means a missing selected file will be created, `update` means an existing selected file will be overwritten from the desired content after any required resolution, `skip` means the user explicitly chose to preserve the existing file, and `remove` means a previously managed file will be removed because it is no longer selected. Review-only conflict states must be resolved before the final plan is presented; they are not surfaced as a separate final operation label.

The generic post-plan confirmation is conditional. When the wizard has already collected review-and-apply intent, `runCli` sets its local `skipApplyConfirm` state in `packages/cli/src/cli.ts`, so the CLI does not immediately ask the user to confirm a second time. Interactive sync flows that did not use the wizard still show the plan and then use `getApplyConfirmationMessage` for confirmation.

Prompting is also the boundary between interactive and non-interactive conflict handling. Interactive runs may collect the accepted file-scoped dispositions for reviewable diffs; non-interactive runs fail when a disposition or ownership/provenance claim is unresolved instead of guessing.

When apply succeeds, `writeApplyCompletionSummary` in `packages/cli/src/cli.ts` varies completion language by mode and surfaces staged conflict files for manual review. That behavior matches the install/readme promise that conflicting replacements are staged rather than overwritten in `README.md` and `packages/cli/README.md`.

### Lifecycle commands

`make-docs setup backup` starts a named workflow, prepares one audit snapshot, renders a review summary, optionally prompts once, then copies only audited files and materializes prunable directories into a dated backup tree through `runBackupCommand`, `prepareBackupExecution`, `executePreparedBackup`, and `resolveBackupDestinationPlan` in `packages/cli/src/backup.ts`. New backup trees must live under `.make-docs/backup/**`, while legacy root `.backup/**` remains protected state. `packages/cli/tests/backup.test.ts` verifies that originals stay in place, same-day backups promote to ordinal form, and global skill paths land under `_home/`.

`make-docs setup remove` is deliberately two-checkpoint and destructive for the current project. `runUninstallCommand` in `packages/cli/src/uninstall.ts` shows a warning, requests warning approval, loads one audit report, renders the `UninstallReviewPlan`, requests final approval, optionally performs backup from the already-prepared audit, and only then removes files and prunes directories. `packages/cli/tests/uninstall.test.ts` verifies warning-stage and final-stage cancellation semantics. Top-level `make-docs uninstall` is a separate machine-footprint self-management command owned by PRD 39.

`setup`, `setup reconfigure`, `update`, `setup remove`, and top-level `uninstall` classify before mutation and fail closed on missing, malformed, incomplete, ambiguous, contradictory, newer-unknown, or corrupt authority. Destructive plans acquire the project or machine lifecycle lock, create the required backup and rollback manifest before the first write, remove only verified clean managed assets or blocks, preserve project-owned, modified, mixed, unknown, archive, project-documentation, and opaque legacy state, and prune only proven-empty safe directories. Project removal does not implicitly delete Store rows; Store cleanup is a separate reviewed action.

### System Resource Discovery

- `make-docs resource list [--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json]` lists resources sorted by stable URI. The default effective view applies project overrides first, then verified managed snapshots, then the installed-machine provider, and reports origin as `project-override`, `managed-snapshot`, or `installed-machine`.
- `make-docs resource read <make-docs://system/...> [--origin <effective|local|installed>] [--format raw|json]` reads exactly one resource. Raw format emits only resource bytes; JSON includes the content plus stable URI, type, origin, provider/package identity, version or immutable ref, digest, local path when applicable, and provenance state.
- `make-docs resource ensure <make-docs://system/...>` creates or refreshes the selected local projection for exactly one resource through the reviewed managed-file path. It never broadens the saved projection selection.
- Resource list and read are read-only and deterministic. Resource ensure is a reviewed mutation. Invalid URIs, unknown types, not-found resources, unavailable installed providers, and incomplete, ambiguous, or contradictory local provenance have distinct nonzero diagnostics and machine-readable error kinds; there is no network fallback.
- Resource URI and prefix paths use normalized POSIX separators. Local resolution stays beneath the explicit project or installed-provider root, rejects traversal, absolute substitution, Windows drive/UNC ambiguity, platform case collision, and symlink escape, treats bytes as data, and never executes a resource or referenced script.
- Each resource operation projects to an MCP tool. Native MCP `resources/list` and `resources/read`, where supported, delegate to `resource.list` and `resource.read`. Native MCP resources do not provide `resource.ensure`.

Lifecycle presentation is mediated through `LifecycleRenderer` in `packages/cli/src/lifecycle-ui.ts`, not hard-coded into backup or uninstall. `createClackLifecycleRenderer` emits semantic workflow summaries, explicit safer alternatives, and prompt guidance; `packages/cli/tests/lifecycle.test.ts` pins the renderer boundary.

### Shared audit engine

Backup and uninstall share one audit contract. `createAuditReport` in `packages/cli/src/audit.ts` returns the `AuditReport` shape defined in `packages/cli/src/types.ts`, including `removableFiles`, `prunableDirectories`, `preservedPaths`, and `skippedPaths`; `runBackupCommand` and `runUninstallCommand` build on that same shape.

When a manifest exists, `classifyManifestPresent` and `classifyManifestRecord` in `packages/cli/src/audit.ts` treat manifest-managed files, manifest skill files, and the CLI state file itself as candidates, but remove instruction files only when the managed block still matches the manifest and no user content exists outside the block, or when a legacy full-file hash proves the file is clean. Without a manifest, `classifyManifestMissing` and `classifyFallbackRecord` use the default profile, canonical static template assets, and known project/home skill roots while preserving ambiguous paths rather than guessing.

Directory pruning is leaf-first and conservative. `classifyPrunableDirectories` only proposes directories whose remaining contents can be proven empty after audited removals in `packages/cli/src/audit.ts`, while backup-root guardrails prevent lifecycle operations from recursing into `.make-docs/backup/**` or legacy root `.backup/**`. Empty managed `.make-docs/agentics/**` parent directories may be pruned only when no unmanaged descendants remain. [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md) owns selected-agentics lifecycle safety, [30-plugin-substrate-and-workflow-bundles.md](./30-plugin-substrate-and-workflow-bundles.md) owns plugin cleanup, and [38-global-store-and-project-state.md](./38-global-store-and-project-state.md) owns machine-level state lifecycle. The preservation tests in `packages/cli/tests/lifecycle.test.ts` and `packages/cli/tests/uninstall.test.ts` lock down those guarantees.

Code anchors:

- `packages/cli/src/cli.ts` — `runCli`, `printPlan`, `renderNoopExplanation`, `getApplyConfirmationMessage`, `writeApplyCompletionSummary`
- `packages/cli/src/wizard.ts` — `runSelectionWizardWithRenderer`, `promptForManagedFileConflictResolutions`
- `packages/cli/src/lifecycle-ui.ts` — `LifecycleRenderer`, `createClackLifecycleRenderer`
- `packages/cli/src/backup.ts` — `runBackupCommand`, `prepareBackupExecution`, `executePreparedBackup`, `resolveBackupDestinationPlan`
- `packages/cli/src/uninstall.ts` — `runUninstallCommand`, `UninstallReviewPlan`
- `packages/cli/src/audit.ts` — `createAuditReport`, `classifyManifestPresent`, `classifyManifestRecord`, `classifyPrunableDirectories`

## Contracts and Data

- Any provider-backed or hybrid pinned-cache path must be explicit, explain provider outage recovery locally, and route on-demand writes through the same review and managed-file conflict safety as ordinary install; [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md) owns the mode and provenance details.
- Ordinary setup/reconfigure may recommend `backup-and-reinstall`, but it must not perform that destructive disposition implicitly. Migration flows surface `sync`, `migrate`, `migrate-with-review`, `backup-and-reinstall`, or `manual-review-required` before apply under [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md).
- Shipped harness behavior remains Codex and Claude Code; OpenCode, Goose, Pi, and future IDEs are lab adapter targets until supported by the evidence contract in [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md).
- MCP tools delegate to the same TypeScript operation-domain contracts as CLI surfaces rather than defining a second behavior model; [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) owns that runtime boundary.
- First-party helper behavior moves into tested modular TypeScript CLI/shared-core operations before standalone scripts are removed or reduced to thin wrappers, and CLI commands plus MCP tools share those operation semantics.
- `setup skills` and every full-install skill-selection surface use one effective skills manifest per run, interpret `all` and `none` against that manifest, preserve resolved `selectedSkills` behavior, and reject untrusted alternate manifests before mutation under [08-skills-catalog-and-distribution.md](./08-skills-catalog-and-distribution.md).
- `setup skills` command, dry-run, review, `setup backup`, and `setup remove` output distinguish canonical shared payloads, native harness exposures, symlink links, managed copy mirrors, legacy generated stubs, and custom harness files; bare installs remain skill-free, and managed copy-mirror fallback is available when symlink creation is unavailable or disabled under [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md).
- `setup backup` output, `setup remove --backup` behavior, audit exclusions, and smoke-pack proof use `.make-docs/backup/**` for new backup writes, preserve legacy root `.backup/**`, and prune empty managed `.make-docs/agentics/**` directories only when audit proves them safe under [38-global-store-and-project-state.md](./38-global-store-and-project-state.md).
- The root parser implements the seven-command tree: project lifecycle under `setup`, project-surface operations under `project`, read-only resource discovery under `resource`, registry operations under `run`, MCP serving under `mcp`, and machine-footprint `update` and `uninstall` that never guess before destructive global change. `update`, `setup`, and `setup reconfigure` detect pre-v2 state and require classification plus backup or cancellation. Selection resolution, wizard behavior, lifecycle permissions, the shared audit snapshot, and backup naming remain active under the [current command model](./39-cli-command-model-and-operation-registry.md).

The root command contract must encode the PRD 39 tree and retain the established flag partitions: `--backup` belongs only to `setup remove`, `--remove` belongs only to `setup skills`, selection flags are invalid on other lifecycle commands, and selected skill identifiers must be known registry entries. `Command`, `InstallIntent`, `ParsedArgs`, `parseArgs`, and `validateParsedArgs` in `packages/cli/src/cli.ts` are implementation seams for that contract, not an independent source of command spellings.

The selection-resolution contract is “saved manifest first, then CLI overrides.” `resolveSelections` clones either manifest selections or defaults, and `describeSelectionSource` emits the user-facing provenance string; both live in `packages/cli/src/cli.ts`. A subtle but important rule is that `--no-skills` clears selected skills but does not blindly rewrite stored skill scope, which is preserved across reconfigure.

The wizard contract is explicit and testable. `RunSelectionWizardOptions`, `WizardRenderer`, and `WizardReviewAction` separate the state machine from the terminal renderer. Capability selection leaves at least one capability enabled, harness selection leaves at least one harness selected, and the options step carries skill enablement, skill scope, explicitly selected skills, and optional local system-resource projection. Resource content stays machine-served when no projection is selected.

Project lifecycle commands use a shared permission model: `setup backup` and `setup remove` map `--yes` to `"allow-all"` and default to `"confirm"`. Non-interactive `setup` and `setup reconfigure` are also contractual: interactive apply requires a TTY, and lifecycle confirmations throw actionable “re-run with --yes” errors when no TTY is present. The existing CLI and lifecycle tests preserve those permission semantics while the parser adopts the current spellings.

The shared audit data contract is the backbone of lifecycle safety. `AuditReport` in `packages/cli/src/types.ts` returns `mode`, `targetDir`, `manifestPath`, `removableFiles`, `prunableDirectories`, `preservedPaths`, and `skippedPaths`. `PrepareBackupExecutionOptions` and `PreparedBackupExecution` in `packages/cli/src/backup.ts` freeze the copy plan, while `UninstallReviewPlan` and `runUninstallCommand` in `packages/cli/src/uninstall.ts` freeze and execute project-removal review state. That is what lets `make-docs setup remove --backup` reuse one audit snapshot instead of re-auditing between copy and delete, as enforced by `packages/cli/tests/uninstall.test.ts`.

Backup destination naming is also contractual. `resolveBackupDestinationPlan` in `packages/cli/src/backup.ts` produces a dated backup root under `.make-docs/backup/**`, promotes the plain directory to `-01` when a later same-day run occurs, and keeps incrementing zero-padded ordinals. Legacy root `.backup/**` is excluded from new ordinal calculation. The determinism is pinned in `packages/cli/tests/backup.test.ts` and `packages/cli/tests/lifecycle.test.ts`.

Code anchors:

- `packages/cli/src/cli.ts` — `Command`, `InstallIntent`, `ParsedArgs`, `parseArgs`, `validateParsedArgs`, `resolveSelections`, `describeSelectionSource`
- `packages/cli/src/wizard.ts` — `RunSelectionWizardOptions`, `WizardRenderer`, `WizardReviewAction`
- `packages/cli/src/backup.ts` — `PrepareBackupExecutionOptions`, `PreparedBackupExecution`, `resolveBackupDestinationPlan`
- `packages/cli/src/uninstall.ts` — `UninstallReviewPlan`, `runUninstallCommand`
- `packages/cli/src/lifecycle-ui.ts` — `LifecycleRenderer`
- `packages/cli/src/types.ts` — `AuditReport`

## Integrations

The CLI command surface is tightly integrated with the install pipeline. `setup` and `setup reconfigure` load project state, build an install plan with `planInstall`, and then apply it with `applyInstallPlan`. The lifecycle described here therefore depends on manifest fidelity and plan/apply semantics even though those deeper install internals are documented elsewhere; the context-aware bare command invokes guided setup only when no install exists.

Skills are exposed through the distinct `setup skills` project-lifecycle boundary rather than mixed into the main apply path. Its dedicated loader and registry validation preserve skills-only planning, so `make-docs setup skills --remove` can operate without creating a new manifest and can use skills-specific output language.

The wizard and audit logic both depend on the profile/capability graph. `normalizeWizardSelections` and `buildCapabilityChecklistState` in `packages/cli/src/wizard.ts` use the same normalized selection model that `createAuditReport` in `packages/cli/src/audit.ts` relies on for fallback classification, so “what can be selected” and “what fallback mode considers canonical” are intentionally aligned. If those graphs diverge, both the wizard surface and lifecycle safety would drift.

Terminal UX is implemented through prompt/rendering libraries but intentionally abstracted behind renderer interfaces. The wizard uses `WizardRenderer` and `createClackWizardRenderer` in `packages/cli/src/wizard.ts`, while backup and uninstall use `LifecycleRenderer` and `createClackLifecycleRenderer` in `packages/cli/src/lifecycle-ui.ts`. The tests assert behavior at the renderer boundary in `packages/cli/tests/wizard.test.ts` and `packages/cli/tests/lifecycle.test.ts`, which keeps prompt-library churn from redefining the subsystem contract.

The command surface also integrates with the README and packaged CLI help, but [PRD 39](./39-cli-command-model-and-operation-registry.md) is the spelling and taxonomy authority. README text, help output, parser behavior, and tests must conform to that authority; archived designs, plans, and pre-cutover implementation matrices remain provenance only and cannot restore a noncurrent spelling or alias.

Code and documentation anchors:

- `packages/cli/src/cli.ts` — `runCli`, `runSkillsCommand`
- `packages/cli/src/install.ts` — `planInstall`, `applyInstallPlan`
- `packages/cli/src/wizard.ts` — `WizardRenderer`, `createClackWizardRenderer`, `buildCapabilityChecklistState`
- `packages/cli/src/lifecycle-ui.ts` — `LifecycleRenderer`, `createClackLifecycleRenderer`
- `packages/cli/src/audit.ts` — `createAuditReport`
- `README.md`
- `packages/cli/README.md`
- `docs/assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md`
- `docs/assets/archive/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md`

## Rebuild Notes

- Rebuilders must preserve the command and lifecycle boundaries and the current simplified selection surface; legacy wizard option groupings are not part of the current contract.
- Bare `make-docs` is context-aware: it begins guided `setup` with no install present and otherwise shows status and help without auto-sync. `update` performs detect-and-delegate tool self-management beside machine-footprint `uninstall`; project removal is only `setup remove`. Rebuilders preserve flag partitions, the shared audit snapshot, and conservative ownership rules under these spellings.

Any clean-room rebuild must preserve the context-aware bare command and the distinct top-level `update` command. It must not restore the retired install-or-sync bare-command behavior or introduce an `init` alias.

Do not collapse the wizard review and the generic apply confirmation into one unconditional prompt. `runCli` intentionally uses its local `skipApplyConfirm` state in `packages/cli/src/cli.ts` so the wizard review is the apply checkpoint for first install and reconfigure, while `getApplyConfirmationMessage` remains the checkpoint for interactive sync flows that skipped the wizard. `packages/cli/tests/cli.test.ts` pins the no-double-confirm behavior. This is easy to regress if the implementation is simplified without understanding why `skipApplyConfirm` exists.

Preserve the flag partitions. `setup backup` and `setup remove` are project lifecycle operations, not alternate install modes, so they reject content-selection flags. `setup skills` is a sibling boundary, not a flag on the main `setup` command, so `--remove` and skill selectors stay constrained to that path.

Preserve the shared audit snapshot between project backup and removal. `make-docs setup remove --backup` audits once, backs up from that prepared state, then deletes from the same reviewed snapshot. Re-auditing between those phases would change the reviewed contract after the user has already approved it.

Preserve conservative ownership rules. `classifyManifestRecord` and `classifyFallbackRecord` in `packages/cli/src/audit.ts` remove root instruction files only on canonical-content or fingerprint match; `.make-docs/backup/**` and legacy root `.backup/**` are always excluded from destructive lifecycle operations; and `classifyPrunableDirectories` proposes parent directories only when they are proven empty. The preservation cases in `packages/cli/tests/lifecycle.test.ts` and `packages/cli/tests/uninstall.test.ts` should be treated as safety invariants, not incidental tests.

Command-surface drift belongs in Requirement History and the shared risk register. Active rebuild requirements, README/help guidance, and tests must use the PRD 39 grammar; neither pre-cutover code nor archived design and plan artifacts are command authority.

Code and documentation anchors:

- `packages/cli/src/cli.ts` — `runCli`, local `skipApplyConfirm`, `getApplyConfirmationMessage`
- `packages/cli/src/uninstall.ts` — `runUninstallCommand`, `UninstallReviewPlan`
- `packages/cli/src/audit.ts` — `createAuditReport`, `classifyPrunableDirectories`
- `README.md`
- `packages/cli/README.md`
- `docs/assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md`
- `docs/assets/archive/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md`

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 11, 12.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-08 — W18 R11

- Affected requirement or section: `Public command model`, `Lifecycle commands`, `Contracts and Data`, `Integrations`, and `Rebuild Notes`
- Previous contract: The pre-cutover implementation exposed top-level `reconfigure`, `skills`, `backup`, and project-level `uninstall`, rejected top-level `update`, and treated the implementation help/test matrix as canonical.
- Replacement contract: [PRD 39](./39-cli-command-model-and-operation-registry.md) owns the five-command tree, uses `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove` for project lifecycle, requires top-level `update` and machine-level `uninstall`, derives `run` and MCP exposure from the operation registry, and provides no compatibility aliases.
- Rationale: Active requirements must teach the clean-break v2 command grammar while preserving the existing wizard, selection, conflict-review, shared-audit, permission, and confirmation invariants under their current command paths.
- Source: [39 CLI Command Model and Operation Registry](./39-cli-command-model-and-operation-registry.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Public command model`, `Interactive Selection Contract`, `Conflict Review Contract`, `Plan review, confirmation, and apply orchestration`, `Lifecycle commands`, `System Resource Discovery`, and `Contracts and Data`
- Previous contract: The CLI exposed five top-level families, omitted first-party system-resource list/read commands, treated prompt/template/reference assets as nonselectable eager content, and reduced conflicts mainly to overwrite or skip without the recovered provenance and rollback boundary.
- Replacement contract: The seven-command tree adds `project` operations plus read-only `resource list` and `resource read`, defaults setup to machine-served resources with explicit optional projection during setup/reconfigure, binds file-scoped conflict decisions to one frozen classification snapshot, and makes backup, rollback, update, project removal, and machine uninstall fail closed while preserving uncertain, project-owned, and opaque legacy state.
- Rationale: Recovery requires one inspectable command surface that exposes installed resources without local duplication and never converts ownership uncertainty into destructive automation.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-09-02 — W19 R1 P4 Documentation Surface Recovery

- Affected requirement or section: `Interactive Selection Contract`
- Previous contract: Setup and reconfigure planned the system-router skeleton but did not enumerate the full documentation-router topology.
- Replacement contract: Setup and reconfigure always plan the unconditional foundation, derive capability-local documentation routers from the resolved effective profile and its dependencies, keep one root-only `docs/assets/` router, and keep archive, artifact, and Persona testing surfaces on demand.
- Rationale: D-030 found that the P4 authority and closeout omitted required documentation surfaces.
- Source: [D-030](./03-open-questions-and-risk-register.md#d-030-w19-r1-documentation-surface-router-topology-was-omitted)

## Source Anchors

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- `packages/cli/src/cli.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/lifecycle-ui.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/wizard.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/lifecycle.test.ts`
- `README.md`
- `packages/cli/README.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/38-global-store-and-project-state.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md`
- `docs/assets/archive/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md`
