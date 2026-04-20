# CLI Lifecycle UX — Help, Backup, and Uninstall

## Purpose

Define the next baseline CLI lifecycle improvements after install/update: a more readable help system, a non-destructive `backup` command, and a safety-first `uninstall` command. This document exists to turn the current install-focused CLI into a fuller operator tool that can explain itself clearly, audit managed files conservatively, and support reversible cleanup workflows.

## Context

The current CLI is strong at install and reconfigure flows, but it still has three operational gaps:

1. The `--help` output is terse, flat, and difficult to scan. It exposes the current flags, but it does not organize commands or explain their intent well enough for someone approaching the CLI fresh.
2. There is no first-class way to back up the files that the CLI installed or generated.
3. There is no first-class uninstall workflow that can safely remove managed outputs without also deleting unrelated user files.

The repo already has pieces that should shape this design instead of being replaced:

- the CLI manifest at `docs/.starter-docs/manifest.json`
- install planning and managed-file removal behavior in the planner/install pipeline
- harness-specific root instruction files: `CLAUDE.md` and `AGENTS.md`
- project-scoped and global/home-directory skill installs

Those existing mechanisms mean this design does not need a separate ownership database or an entirely new lifecycle engine. It needs a shared audit model layered on top of the manifest and expected managed paths, plus clearer CLI surfaces for destructive and non-destructive maintenance tasks.

This is a new decision area rather than another revision of the `w5` skill-installation wave. It builds on the shipped manifest- and harness-aware install model, but it introduces new lifecycle commands and a broader safety/UX contract for operating the CLI after installation.

## Decision

### 1. Expand the CLI into a clearer lifecycle surface

The CLI should expose five top-level user-facing help surfaces:

- `starter-docs --help`
- `starter-docs init --help`
- `starter-docs update --help`
- `starter-docs backup [--target <dir>] [--yes] [--help]`
- `starter-docs uninstall [--target <dir>] [--backup] [--yes] [--help]`

Top-level help should no longer be a flat usage block. It should become a structured summary page with:

- a short purpose statement
- grouped command listings with one-line descriptions
- grouped flag sections instead of one long flag run
- short explanations for value-bearing flags
- a compact examples section
- clearer wording for harness, skill, and reconfigure behavior

Command-specific help screens should follow the same structure at a smaller scale: short summary, usage, grouped options, and a few concrete examples.

### 2. Use one shared audit engine for `backup` and `uninstall`

`backup` and `uninstall` should both run through the same audit engine so they operate on the same candidate file set and produce the same classification results.

The audit source of truth should be:

- manifest-first when `docs/.starter-docs/manifest.json` exists
- conservative expected-path fallback when the manifest is missing

When a manifest is present, the audit should use it as the primary ownership record for managed files, skill files, selected harnesses, and other installed outputs. When the manifest is absent, the audit should limit itself to known starter-docs-managed locations and should remain conservative rather than guessing broadly across the tree.

Audit results should classify:

- files eligible for backup/removal
- directories eligible for pruning after leaf removal
- retained paths that look starter-docs-related but must be preserved
- skipped or conflicted paths that require preservation because they are not clearly CLI-owned

The audit must never consider anything under `.backup/` as a removal candidate.

### 3. Preserve user-owned content by evaluating leaves first and pruning upward

Removal behavior should be leaf-first:

1. identify individual files that are safe to remove
2. remove those files
3. prune parent directories only when they become empty
4. stop pruning as soon as any non-managed file or directory remains

This applies to both project-local and global/home-directory install roots. The CLI should never remove a directory that still contains any file outside the audited removal set, even if the directory name matches a managed location that the CLI often creates.

For root instruction files, path-only ownership is not sufficient. `CLAUDE.md` and `AGENTS.md` should be inspected by content:

- remove them only when their current contents exactly match the generated starter-docs instruction content for the applicable harness selection
- preserve them when contents differ, because that indicates preexisting user files or post-install customization

This file-content rule is intentionally stricter than the directory-pruning rule because root instruction files are user-visible authoring surfaces and are especially likely to be customized.

### 4. Add a dedicated `backup` command with deterministic backup roots

`starter-docs backup` should be a non-destructive maintenance command that:

- runs the shared audit
- shows the audited file set in a clean terminal summary
- asks for confirmation by default
- copies the audited files into `./.backup/<date-or-sequence>/`
- leaves the original files untouched

The backup tree should preserve relative structure:

- project-local files keep their normal project-relative paths inside the backup root
- global/home-directory files are copied beneath a dedicated subtree such as `_home/`

Same-day backup naming should be deterministic:

- first backup of the day: `.backup/YYYY-MM-DD/`
- second backup on that date:
  - rename the existing plain-date directory to `YYYY-MM-DD-01`
  - create the new backup as `YYYY-MM-DD-02`
- subsequent same-day backups continue with the next ordinal
- ordinals are zero-padded through `09`, then continue naturally as `10`, `11`, and so on

`backup` should accept `--yes` to skip interactive confirmation prompts. By default, it should ask for confirmation after printing the audit/result summary.

### 5. Add a safety-first `uninstall` command with optional pre-removal backup

`starter-docs uninstall` should be a destructive maintenance command that removes the same audited file set that `backup` would copy.

The uninstall flow should be deliberately explicit:

1. show an initial warning panel before execution proceeds
2. if `--backup` is not present, that warning must explicitly suggest `starter-docs backup` and `starter-docs uninstall --backup` as safer alternatives
3. run the shared audit
4. show a detailed audit summary listing exactly what will be removed and what will be preserved
5. show a final confirmation that removal cannot be undone
6. remove audited files and prune only the emptied parent directories

`starter-docs uninstall --backup` should be a single combined flow:

- run the audit once
- present uninstall messaging that also states the exact backup destination that will be created
- confirm
- execute backup from the in-memory audit results
- execute uninstall from the same audit results

The combined flow must not re-run audit between backup and removal. The audit is the shared execution contract for both steps.

Like `backup`, `uninstall` should accept `--yes` to skip interactive confirmation prompts. By default, it should ask for confirmation after printing the warning and audit summaries.

### 6. Treat terminal presentation as part of the safety contract

The `backup` and `uninstall` flows should not dump raw path lists without structure. Their terminal output should be intentionally formatted for review:

- boxed or visually separated warning sections
- clear command outcome labels such as backup-only vs backup-and-remove vs remove-only
- grouped audit sections for files, directories, and preserved paths
- aligned path lists or tables where that improves readability
- explicit totals so the user can see the scale of the operation

The goal is not ornamental UI. The goal is to make destructive and semi-destructive operations readable enough that users can confidently review what the CLI is about to do.

## Alternatives Considered

**Keep help output minimal and only tweak wording.** Rejected because the current problem is structural as much as textual. The CLI needs grouped command- and flag-level presentation, not just slightly longer one-line descriptions.

**Add `backup` as a flag on `update` or `uninstall` only, without a standalone command.** Rejected because non-destructive backup is valuable on its own and should be usable independently of removal.

**Implement uninstall as a manifest-only delete pass.** Rejected because the manifest is the best source of truth when present, but the CLI still needs conservative fallback behavior when the manifest is missing and content-aware handling for `CLAUDE.md` and `AGENTS.md`.

**Delete whole managed directories directly instead of pruning upward from leaves.** Rejected because directory-level deletion is too risky when users may have added their own files under harness or skill directories after installation.

**Always delete root instruction files if their names match expected starter-docs outputs.** Rejected because filename matching is not enough to distinguish generated instructions from user-authored or user-modified files.

## Consequences

### Benefits

- The CLI becomes easier to discover and use without external documentation.
- Users gain a reversible cleanup path before destructive operations.
- Uninstall behavior becomes safer because ownership is evaluated conservatively and at file level.
- The install manifest becomes more valuable as a lifecycle record, not just an install artifact.

### Costs and constraints

- The CLI will need a richer command parser, help renderer, and confirmation/audit presentation layer.
- Backup and uninstall logic must account for both project-local and global/home-directory paths.
- Root instruction file removal now depends on exact content matching, which means the CLI must be able to reproduce or fingerprint the generated instruction content reliably.
- Manifest-missing fallback must remain intentionally conservative, which means uninstall may preserve more than it removes in ambiguous cases.

### Follow-on implications

- Planning should treat the audit engine as the primary subsystem, with help rendering and command parsing layered around it.
- Testing must cover repeated same-day backups, modified root instruction files, unmanaged files inside managed-looking directories, and combined uninstall-with-backup execution.
- The final implementation should avoid deleting any `.backup/` contents, even when uninstalling from a project that previously used the new backup flow.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation-r2.md](2026-04-16-cli-skill-installation-r2.md)
- Reason: this design builds on the shipped install manifest, harness selection, and managed skill layout introduced by the current CLI, but it defines a new post-install lifecycle surface rather than revising the skill-installation decision itself.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: this is a new end-to-end initiative with new commands, a new shared audit subsystem, and a broader CLI UX surface that should be planned as a fresh baseline rather than as an incremental change to the prior skill-installation wave.
