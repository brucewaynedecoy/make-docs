# 07 CLI Command Surface and Lifecycle

## Purpose

This subsystem owns the public operator surface for `make-docs`: parsing argv, deciding whether a run is install/sync, reconfigure, skills-only, backup, uninstall, or help, and then routing the user into the correct review and execution flow in `packages/cli/src/cli.ts:77` and `packages/cli/src/cli.ts:894`. It also owns the safety-first lifecycle behavior for backup and uninstall through the shared audit engine in `packages/cli/src/backup.ts:49`, `packages/cli/src/uninstall.ts:52`, and `packages/cli/src/audit.ts:41`.

The user-facing contract is broader than a thin command parser. The CLI defines when interactive flows are allowed in `packages/cli/src/cli.ts:135`, what gets reviewed before mutation in `packages/cli/src/cli.ts:210`, how lifecycle commands summarize risk in `packages/cli/src/lifecycle-ui.ts:82`, and which legacy commands are intentionally rejected with migration guidance in `packages/cli/src/cli.ts:589` and `packages/cli/src/cli.ts:599`.

## Scope

This document covers:

- top-level command parsing, validation, dispatch, and help text in `packages/cli/src/cli.ts:455`, `packages/cli/src/cli.ts:653`, and `packages/cli/src/cli.ts:894`
- the interactive selection wizard, review loop, and conflict-resolution prompts in `packages/cli/src/wizard.ts:481` and `packages/cli/src/wizard.ts:579`
- lifecycle rendering and confirmation checkpoints in `packages/cli/src/lifecycle-ui.ts:54`
- backup and uninstall execution behavior in `packages/cli/src/backup.ts:49` and `packages/cli/src/uninstall.ts:52`
- the shared audit model that decides removable, preserved, skipped, and prunable paths in `packages/cli/src/audit.ts:41`
- the public CLI promises captured by tests in `packages/cli/tests/cli.test.ts:121`, `packages/cli/tests/wizard.test.ts:69`, `packages/cli/tests/backup.test.ts:127`, `packages/cli/tests/uninstall.test.ts:155`, and `packages/cli/tests/lifecycle.test.ts:75`

This document does not re-specify the full install asset catalog, manifest schema, or skill-packaging internals. Those are only covered here where they change the user-visible command surface, selection semantics, or lifecycle safety contract, for example when `runCli` delegates to skills-only mode in `packages/cli/src/cli.ts:104` or when the audit engine consults manifest- and profile-derived expectations in `packages/cli/src/audit.ts:90` and `packages/cli/src/audit.ts:323`.

Code anchors:

- `packages/cli/src/cli.ts:77`
- `packages/cli/src/cli.ts:455`
- `packages/cli/src/cli.ts:653`
- `packages/cli/src/cli.ts:894`
- `packages/cli/src/wizard.ts:481`
- `packages/cli/src/lifecycle-ui.ts:54`
- `packages/cli/src/backup.ts:49`
- `packages/cli/src/uninstall.ts:52`
- `packages/cli/src/audit.ts:41`

## Component and Capability Map

### Public command model

`runCli` resolves the target directory, short-circuits `--help`, and then dispatches lifecycle or skills-specific commands before any install planning happens in `packages/cli/src/cli.ts:79`, `packages/cli/src/cli.ts:86`, `packages/cli/src/cli.ts:94`, and `packages/cli/src/cli.ts:104`. The default no-command path is intentionally meaningful: it behaves as first install when no manifest exists and as saved-selection sync when a manifest is present, while `reconfigure` explicitly switches intent in `packages/cli/src/cli.ts:119` and `packages/cli/src/cli.ts:267`.

The parser recognizes four explicit subcommands, a no-command primary workflow, and a shared flag vocabulary in `packages/cli/src/cli.ts:455`. The implemented public help surface is the top-level help plus command-specific help for `reconfigure`, `skills`, `backup`, and `uninstall` in `packages/cli/src/cli.ts:894`. Tests lock that public taxonomy and explicitly assert that `init`, `update`, `--reconfigure`, and `--skills` are not part of the active surface in `packages/cli/tests/cli.test.ts:790` and `packages/cli/tests/cli.test.ts:868`.

### Interactive wizard and review flow

#### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference wizard questions and review rows.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for default/optional skill grouping and selected-skill review language.

Interactive selection is a first-class capability, not just a prompt wrapper. The CLI opens the wizard only for first install and explicit reconfigure in `packages/cli/src/cli.ts:150` and `packages/cli/src/cli.ts:163`; a bare run against an existing manifest stays on saved selections and does not reopen the wizard, as verified in `packages/cli/tests/cli.test.ts:173`.

The wizard is a four-step state machine in `packages/cli/src/wizard.ts:124` and `packages/cli/src/wizard.ts:487`: capabilities, harnesses, options, and review. Capability selection is dependency-aware through `normalizeWizardSelections` and `buildCapabilityChecklistState` in `packages/cli/src/wizard.ts:222` and `packages/cli/src/wizard.ts:396`, so `prd` is disabled without `plans` and `work` is disabled without both `plans` and `prd`; the tests pin those lockouts in `packages/cli/tests/wizard.test.ts:70`.

The options step controls skills, skill scope, optional skills, prompt starters, template mode, and reference mode in `packages/cli/src/wizard.ts:354` and `packages/cli/src/wizard.ts:761`. Default skills are rendered as read-only rows while optional skills remain selectable in `packages/cli/src/wizard.ts:267`, `packages/cli/src/wizard.ts:795`, and `packages/cli/src/wizard.ts:1011`; `packages/cli/tests/wizard.test.ts:130` and `packages/cli/tests/wizard.test.ts:327` confirm that the wizard can proceed with only default skills selected.

Review is a mutable checkpoint, not a final dead end. `renderWizardReviewSummary` composes a human-readable summary in `packages/cli/src/wizard.ts:437`, and the review step can bounce the user back to capabilities, harnesses, or options before apply in `packages/cli/src/wizard.ts:550` and `packages/cli/tests/wizard.test.ts:385`.

### Plan review, confirmation, and apply orchestration

After selections are resolved, `runCli` computes an install plan, optionally collects instruction-conflict resolutions, rejects plans with no effective capabilities, prints a structured plan, and only then applies writes in `packages/cli/src/cli.ts:178`, `packages/cli/src/cli.ts:185`, `packages/cli/src/cli.ts:205`, `packages/cli/src/cli.ts:210`, and `packages/cli/src/cli.ts:244`. The review summary includes target, mode, manifest state, selection source, and action counts in `packages/cli/src/cli.ts:725`, while noop runs emit mode-specific guidance in `packages/cli/src/cli.ts:805`.

The generic post-plan confirmation is conditional. When the wizard has already collected review-and-apply intent, `runCli` sets `skipApplyConfirm` in `packages/cli/src/cli.ts:148`, `packages/cli/src/cli.ts:162`, and `packages/cli/src/cli.ts:174`, so the CLI does not immediately ask the user to confirm a second time. For interactive sync flows that did not use the wizard, the CLI still shows the plan and then asks for confirmation in `packages/cli/src/cli.ts:226`.

When apply succeeds, completion language differs by mode in `packages/cli/src/cli.ts:869`, and staged conflict files are surfaced for manual review in `packages/cli/src/cli.ts:259`. That behavior matches the install/readme promise that conflicting replacements are staged rather than overwritten in `README.md:101` and `packages/cli/README.md:84`.

### Lifecycle commands

`make-docs backup` starts a named workflow, prepares one audit snapshot, renders a review summary, optionally prompts once, then copies only audited files and materializes prunable directories into a dated `.backup/` tree in `packages/cli/src/backup.ts:49`, `packages/cli/src/backup.ts:86`, `packages/cli/src/backup.ts:127`, and `packages/cli/src/backup.ts:160`. Tests verify that originals stay in place, same-day backups promote to ordinal form, and global skill paths land under `_home/` in `packages/cli/tests/backup.test.ts:127`, `packages/cli/tests/backup.test.ts:219`, and `packages/cli/tests/backup.test.ts:253`.

`make-docs uninstall` is deliberately two-checkpoint and destructive. It shows a warning, requests warning approval, loads one audit report, renders the audit summary, requests final approval, optionally performs backup using the already-prepared audit, and only then removes files and prunes directories in `packages/cli/src/uninstall.ts:63`, `packages/cli/src/uninstall.ts:69`, `packages/cli/src/uninstall.ts:81`, `packages/cli/src/uninstall.ts:96`, `packages/cli/src/uninstall.ts:101`, and `packages/cli/src/uninstall.ts:116`. Tests verify both warning-stage and final-stage cancellation semantics in `packages/cli/tests/uninstall.test.ts:345` and `packages/cli/tests/uninstall.test.ts:382`.

Lifecycle presentation is mediated through `LifecycleRenderer` in `packages/cli/src/lifecycle-ui.ts:54`, not hard-coded into backup or uninstall. The clack-backed implementation emits semantic workflow summaries, explicit safer alternatives, and prompt guidance in `packages/cli/src/lifecycle-ui.ts:146`, `packages/cli/src/lifecycle-ui.ts:167`, and `packages/cli/src/lifecycle-ui.ts:393`; the renderer boundary is pinned by `packages/cli/tests/lifecycle.test.ts:238` and `packages/cli/tests/lifecycle.test.ts:278`.

### Shared audit engine

Backup and uninstall share one audit contract. `createAuditReport` returns `removableFiles`, `prunableDirectories`, `preservedPaths`, and `skippedPaths` in `packages/cli/src/audit.ts:41` and `packages/cli/src/audit.ts:79`, and both lifecycle commands build on that same shape in `packages/cli/src/backup.ts:91` and `packages/cli/src/uninstall.ts:81`.

When a manifest exists, audit is manifest-first in `packages/cli/src/audit.ts:52` and `packages/cli/src/audit.ts:90`: manifest-managed files, manifest skill files, and the CLI state file itself are candidates, but root instruction files are only removable when their content exactly matches the canonical generated content in `packages/cli/src/audit.ts:233`. When no manifest exists, fallback mode uses the default profile, canonical generated assets, and known project/home skill roots, but preserves ambiguous paths rather than guessing in `packages/cli/src/audit.ts:323`, `packages/cli/src/audit.ts:351`, `packages/cli/src/audit.ts:420`, and `packages/cli/src/audit.ts:567`.

Directory pruning is leaf-first and conservative. `classifyPrunableDirectories` only proposes directories whose remaining contents can be proven empty after audited removals in `packages/cli/src/audit.ts:577`, while `assertNotInsideBackupRoot` in `packages/cli/src/uninstall.ts:191` and the `.backup/` exclusions in `packages/cli/src/audit.ts:168` and `packages/cli/src/audit.ts:451` prevent lifecycle operations from recursing into backup state. The preservation tests in `packages/cli/tests/lifecycle.test.ts:129` and `packages/cli/tests/uninstall.test.ts:288` lock down those guarantees.

Code anchors:

- `packages/cli/src/cli.ts:79`
- `packages/cli/src/cli.ts:150`
- `packages/cli/src/cli.ts:178`
- `packages/cli/src/cli.ts:226`
- `packages/cli/src/cli.ts:259`
- `packages/cli/src/cli.ts:894`
- `packages/cli/src/wizard.ts:222`
- `packages/cli/src/wizard.ts:487`
- `packages/cli/src/wizard.ts:550`
- `packages/cli/src/wizard.ts:761`
- `packages/cli/src/lifecycle-ui.ts:82`
- `packages/cli/src/backup.ts:49`
- `packages/cli/src/backup.ts:160`
- `packages/cli/src/uninstall.ts:52`
- `packages/cli/src/uninstall.ts:191`
- `packages/cli/src/audit.ts:41`
- `packages/cli/src/audit.ts:323`
- `packages/cli/src/audit.ts:577`

## Contracts and Data

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) for prompt/template/reference selection flags as active installer decisions.
- Superseded by [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for optional-skill CLI validation and selected-skill flag language.

The root command contract is encoded in `Command`, `InstallIntent`, and `ParsedArgs` in `packages/cli/src/cli.ts:27`, `packages/cli/src/cli.ts:28`, and `packages/cli/src/cli.ts:30`. `parseArgs` normalizes the public flags in `packages/cli/src/cli.ts:455`, while `validateParsedArgs` enforces cross-command boundaries in `packages/cli/src/cli.ts:653`: `--backup` is uninstall-only, `--remove` is skills-only, selection flags are invalid on lifecycle commands, and optional skill identifiers must be known optional registry entries in `packages/cli/src/cli.ts:705`.

The selection-resolution contract is “saved manifest first, then CLI overrides.” `resolveSelections` clones either manifest selections or defaults in `packages/cli/src/cli.ts:295`, and `describeSelectionSource` emits the user-facing provenance string in `packages/cli/src/cli.ts:271`. A subtle but important rule is that `--no-skills` clears optional skills but does not blindly rewrite stored skill scope, which is preserved across reconfigure in `packages/cli/tests/cli.test.ts:585`.

The wizard contract is explicit and testable. `RunSelectionWizardOptions`, `WizardRenderer`, and `WizardReviewAction` in `packages/cli/src/wizard.ts:132`, `packages/cli/src/wizard.ts:198`, and `packages/cli/src/wizard.ts:125` separate the state machine from the terminal renderer. Capability selection must leave at least one capability enabled in `packages/cli/src/wizard.ts:703`, harness selection must leave at least one harness selected in practice because the state machine re-prompts if the selection is empty in `packages/cli/src/wizard.ts:527`, and the options step carries skill scope, optional skill list, prompt inclusion, template mode, and reference mode in `packages/cli/src/wizard.ts:155`.

Lifecycle commands use a shared permission model: `runCli` maps `--yes` to `"allow-all"` and the default to `"confirm"` when invoking backup or uninstall in `packages/cli/src/cli.ts:87`, `packages/cli/src/cli.ts:99`, `packages/cli/tests/cli.test.ts:949`, and `packages/cli/tests/cli.test.ts:1009`. Non-interactive install/reconfigure is also contractual: interactive apply requires a TTY in `packages/cli/src/cli.ts:135`, and lifecycle confirmations throw actionable “re-run with --yes” errors when no TTY is present in `packages/cli/src/lifecycle-ui.ts:118`, `packages/cli/src/lifecycle-ui.ts:163`, `packages/cli/src/lifecycle-ui.ts:203`, and `packages/cli/tests/lifecycle.test.ts:401`.

The shared audit data contract is the backbone of lifecycle safety. `AuditReport` returns `mode`, `targetDir`, `manifestPath`, `removableFiles`, `prunableDirectories`, `preservedPaths`, and `skippedPaths` in `packages/cli/src/audit.ts:79`. `PrepareBackupExecution` and `PreparedBackupExecution` in `packages/cli/src/backup.ts:33` and `packages/cli/src/backup.ts:41` freeze the copy plan, while `UninstallReviewPlan` in `packages/cli/src/uninstall.ts:30` freezes the uninstall review state. That is what lets `make-docs uninstall --backup` reuse one audit snapshot instead of re-auditing between copy and delete, as enforced in `packages/cli/src/uninstall.ts:116` and `packages/cli/tests/uninstall.test.ts:421`.

Backup destination naming is also contractual. `resolveBackupDestinationPlan` in `packages/cli/src/backup.ts:160` produces `.backup/YYYY-MM-DD` for the first run of a day, promotes the plain directory to `-01` when a later same-day run occurs, and keeps incrementing zero-padded ordinals. The determinism is pinned in `packages/cli/tests/backup.test.ts:253` and `packages/cli/tests/lifecycle.test.ts:161`.

Code anchors:

- `packages/cli/src/cli.ts:27`
- `packages/cli/src/cli.ts:30`
- `packages/cli/src/cli.ts:271`
- `packages/cli/src/cli.ts:295`
- `packages/cli/src/cli.ts:455`
- `packages/cli/src/cli.ts:653`
- `packages/cli/src/cli.ts:705`
- `packages/cli/src/wizard.ts:125`
- `packages/cli/src/wizard.ts:132`
- `packages/cli/src/wizard.ts:155`
- `packages/cli/src/wizard.ts:198`
- `packages/cli/src/backup.ts:33`
- `packages/cli/src/backup.ts:41`
- `packages/cli/src/backup.ts:160`
- `packages/cli/src/uninstall.ts:30`
- `packages/cli/src/lifecycle-ui.ts:393`
- `packages/cli/src/audit.ts:79`

## Integrations

The CLI command surface is tightly integrated with the install pipeline. The no-command and `reconfigure` paths load the manifest in `packages/cli/src/cli.ts:119`, build an install plan with `planInstall` in `packages/cli/src/cli.ts:178`, and then apply it with `applyInstallPlan` in `packages/cli/src/cli.ts:244`. The lifecycle described here therefore depends on manifest fidelity and plan/apply semantics even though those deeper install internals are documented elsewhere.

Skills are exposed as a separate command boundary rather than mixed into the main apply path. `runCli` routes `skills` through a dedicated loader in `packages/cli/src/cli.ts:104` and `packages/cli/src/cli.ts:400`, and validation consults the skill registry in `packages/cli/src/cli.ts:705`. That separation is what allows `make-docs skills --remove` to operate without creating a new manifest in `packages/cli/tests/cli.test.ts:490` and to use skills-specific output language in `packages/cli/tests/cli.test.ts:530`.

The wizard and audit logic both depend on the profile/capability graph. The capability dependency UI in `packages/cli/src/wizard.ts:396` uses the same normalized selection model that the audit fallback relies on in `packages/cli/src/audit.ts:331`, so “what can be selected” and “what fallback mode considers canonical” are intentionally aligned. If those graphs diverge, both the wizard surface and lifecycle safety would drift.

Terminal UX is implemented through prompt/rendering libraries but intentionally abstracted behind renderer interfaces. The wizard uses the renderer contract in `packages/cli/src/wizard.ts:198` and the clack-backed implementation in `packages/cli/src/wizard.ts:634`, while backup/uninstall use the lifecycle renderer in `packages/cli/src/lifecycle-ui.ts:54`. The tests assert behavior at the renderer boundary in `packages/cli/tests/wizard.test.ts:234` and `packages/cli/tests/lifecycle.test.ts:238`, which keeps prompt-library churn from redefining the subsystem contract.

The command surface also integrates with the README layer, but the code is more current than the prose. Both `README.md:73` and `packages/cli/README.md:56` still teach install/reconfigure/dry-run first, while the canonical public command matrix now lives in `packages/cli/src/cli.ts:1015` and `packages/cli/tests/cli.test.ts:790`. The originating design and implementation-plan docs in `docs/designs/2026-04-18-cli-help-backup-and-uninstall.md` and `docs/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md` remain useful lineage, but they now describe some surfaces that the implementation intentionally removed.

Code anchors:

- `packages/cli/src/cli.ts:104`
- `packages/cli/src/cli.ts:119`
- `packages/cli/src/cli.ts:178`
- `packages/cli/src/cli.ts:244`
- `packages/cli/src/cli.ts:400`
- `packages/cli/src/cli.ts:705`
- `packages/cli/src/cli.ts:1015`
- `packages/cli/src/wizard.ts:198`
- `packages/cli/src/wizard.ts:396`
- `packages/cli/src/wizard.ts:634`
- `packages/cli/src/lifecycle-ui.ts:54`
- `packages/cli/src/audit.ts:331`
- `README.md:73`
- `packages/cli/README.md:56`
- `docs/designs/2026-04-18-cli-help-backup-and-uninstall.md`
- `docs/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md`

## Rebuild Notes

### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md) and [12-revise-cli-skill-selection-simplification.md](./12-revise-cli-skill-selection-simplification.md) for rebuild guidance around the wizard options step. Rebuilders should preserve the command and lifecycle boundaries while applying the W14 selection-surface simplifications.

Any clean-room rebuild needs to preserve the meaning of “no command.” The current UX deliberately treats `make-docs` as install-or-sync based on manifest presence in `packages/cli/src/cli.ts:119` and `packages/cli/src/cli.ts:794`, not as a separate `init` or `update` command family. Reintroducing explicit `init` or `update` commands without also revisiting the migration errors in `packages/cli/src/cli.ts:589` and `packages/cli/src/cli.ts:599` would break the shipped public model captured in `packages/cli/tests/cli.test.ts:790`.

Do not collapse the wizard review and the generic apply confirmation into one unconditional prompt. The current system intentionally uses the wizard review as the apply checkpoint for first install and reconfigure, then reserves the generic confirmation for interactive sync flows that skipped the wizard in `packages/cli/src/cli.ts:148`, `packages/cli/src/cli.ts:226`, and `packages/cli/tests/cli.test.ts:121`. This is easy to regress if the implementation is simplified without understanding why `skipApplyConfirm` exists.

Preserve the flag partitions. `backup` and `uninstall` are lifecycle operations, not alternate install modes, so they must reject content-selection flags through `packages/cli/src/cli.ts:683`. `skills` is a sibling boundary, not a flag on the main apply command, so `--remove` and skill selectors stay constrained by `packages/cli/src/cli.ts:660`, `packages/cli/src/cli.ts:666`, and `packages/cli/tests/cli.test.ts:419`.

Preserve the shared audit snapshot between backup and uninstall. `make-docs uninstall --backup` currently audits once, backs up from that prepared state, then deletes from the same reviewed snapshot in `packages/cli/src/uninstall.ts:88` and `packages/cli/src/uninstall.ts:116`. Re-auditing between those phases would change the reviewed contract after the user has already approved it and would break the expectation captured in `packages/cli/tests/uninstall.test.ts:421`.

Preserve conservative ownership rules. Root instruction files are removable only on canonical-content or fingerprint match in `packages/cli/src/audit.ts:233` and `packages/cli/src/audit.ts:527`; `.backup/` contents are always excluded in `packages/cli/src/audit.ts:168` and `packages/cli/src/audit.ts:451`; parent directories are pruned only when proven empty in `packages/cli/src/audit.ts:577`. The preservation cases in `packages/cli/tests/lifecycle.test.ts:129` and `packages/cli/tests/uninstall.test.ts:259` should be treated as safety invariants, not incidental tests.

Factual drift and ambiguity that should also surface in the shared risk register:

- `docs/designs/2026-04-18-cli-help-backup-and-uninstall.md` and `docs/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md` still describe help surfaces for `make-docs init` and `make-docs update`, but the shipped CLI rejects those commands and points users to the default command or `reconfigure` in `packages/cli/src/cli.ts:589`, `packages/cli/src/cli.ts:599`, and `packages/cli/tests/cli.test.ts:868`.
- `README.md:73` and `packages/cli/README.md:56` still teach install/reconfigure/dry-run as the visible workflow and do not document the shipped `skills`, `backup`, or `uninstall` surfaces that appear in `packages/cli/src/cli.ts:1019` and `packages/cli/tests/cli.test.ts:790`.
- `packages/content/package.json` exists, but there is no content-specific command/help entry in `packages/cli/src/cli.ts:104` or `packages/cli/src/cli.ts:1019`. If `packages/content` becomes a supported downstream artifact, the top-level command taxonomy and help model will need a documented expansion rather than an implicit one.

Code anchors:

- `packages/cli/src/cli.ts:119`
- `packages/cli/src/cli.ts:148`
- `packages/cli/src/cli.ts:226`
- `packages/cli/src/cli.ts:589`
- `packages/cli/src/cli.ts:599`
- `packages/cli/src/cli.ts:660`
- `packages/cli/src/cli.ts:683`
- `packages/cli/src/cli.ts:1019`
- `packages/cli/src/uninstall.ts:88`
- `packages/cli/src/uninstall.ts:116`
- `packages/cli/src/audit.ts:168`
- `packages/cli/src/audit.ts:233`
- `packages/cli/src/audit.ts:451`
- `packages/cli/src/audit.ts:527`
- `packages/cli/src/audit.ts:577`
- `README.md:73`
- `packages/cli/README.md:56`
- `docs/designs/2026-04-18-cli-help-backup-and-uninstall.md`
- `docs/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md`
- `packages/content/package.json`

## Source Anchors

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
- `docs/designs/2026-04-18-cli-help-backup-and-uninstall.md`
- `docs/plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md`
