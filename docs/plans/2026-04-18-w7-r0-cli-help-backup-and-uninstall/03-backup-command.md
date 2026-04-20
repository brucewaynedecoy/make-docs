# Phase 3 — Backup Command

## Objective

Build `starter-docs backup` on top of the shared audit engine so the CLI can produce a non-destructive, reviewable backup of everything the lifecycle audit considers removable or prunable. This phase owns the backup command flow, same-day backup destination naming, backup copy/layout rules, and the formatted audit/result presentation needed for backup. It does not implement uninstall behavior beyond any shared terminal presentation helpers that backup and uninstall should both consume.

## Depends On

- Phase 1 (needs the expanded command/help surface so `backup` has a registered command entry and command-specific `--help`)
- Phase 2 (needs the shared audit engine, manifest-first fallback behavior, and the audited file/directory classification model)

## Files to Create/Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Register `backup` as a first-class command, parse `--yes` and `--help`, print command-specific help, and dispatch into the backup flow. |
| `packages/cli/src/backup.ts` | **New.** Run the shared audit, resolve the backup destination, render the backup confirmation/result flow, and copy audited files/directories into `.backup/`. |
| `packages/cli/src/lifecycle-ui.ts` | **New.** Shared formatted audit/result presentation helpers for backup and later uninstall flows. |
| `packages/cli/tests/backup.test.ts` | **New.** Cover backup execution, destination naming, `_home` layout, default confirmation vs `--yes`, and same-day ordinal promotion. |
| `packages/cli/tests/cli.test.ts` | Extend CLI parsing/help coverage for `starter-docs backup`, `--yes`, and `backup --help`. |

## Detailed Changes

### 1. Add `backup` to the CLI command surface

Update the CLI parser and dispatcher so `starter-docs backup` behaves like a real top-level command rather than a flag combination on another flow.

Required behavior:

1. Add `backup` to the command union and command inference path.
2. Accept:
   - `starter-docs backup`
   - `starter-docs backup --target <dir>`
   - `starter-docs backup --yes`
   - `starter-docs backup --help`
3. Default to confirmation prompts when `--yes` is omitted.
4. Route `starter-docs backup --help` to a backup-specific help screen without running audit or touching the filesystem.
5. Keep backup command wiring isolated from uninstall-specific flags; `--backup` remains uninstall-only.

The backup help text should describe:

- that the command audits the same managed footprint used by uninstall
- that it creates a dated directory under `.backup/`
- that default mode prompts before copying and `--yes` skips the prompt while still printing the audit summary

### 2. Build the backup orchestration flow on the shared audit engine

Create a dedicated `backup.ts` module that owns the full backup-only execution path.

The flow should be:

1. Load the existing manifest when present and invoke the Phase 2 audit engine for the target directory.
2. Resolve the exact backup destination before rendering the confirmation screen so the user sees the final path that will be created.
3. Render a backup audit summary with:
   - operation label: backup only
   - target directory
   - resolved backup destination
   - grouped counts for files to copy, directories to preserve as empty directories, and paths retained/skipped by the audit
4. By default, prompt once after the audit summary and before any copy occurs.
5. With `--yes`, print the same audit summary and continue without prompting.
6. Copy the audited payload into the resolved destination.
7. Render a completion summary showing the destination and final copied counts.

Backup-specific decisions for this phase:

- If the audit yields no copyable files and no directory-only removals, print a no-op summary and exit successfully without creating a new `.backup/<date>` directory.
- The backup command must use one audit pass only. It should not re-run audit between confirmation and copy.
- The backup flow must trust the audit engine's exclusion of `.backup/`; backup must never recurse into prior backups.

### 3. Preserve both file and directory removal candidates in the backup output

The backup should mirror the same removal surface that uninstall would later act on.

Execution rules:

1. Copy every audited removable file into the backup tree, preserving relative structure.
2. Materialize every audited directory-prune candidate in the backup tree, even when that directory would otherwise be absent after file copy.
3. Do not copy retained or skipped paths; only show them in the audit summary.
4. Never create backup entries for anything under `.backup/`.

This ensures the backup is a faithful pre-removal capture of both leaf files and the directory structure that uninstall would prune after removing those leaves.

### 4. Resolve backup destinations under `.backup/` with deterministic same-day promotion

`backup.ts` should own destination selection for project-local backups rooted at `<targetDir>/.backup/`.

Directory selection rules:

1. Use the current local date in `YYYY-MM-DD` format as the base directory name.
2. If `<targetDir>/.backup/YYYY-MM-DD/` does not exist and there are no numbered siblings for that date, use it directly.
3. If a same-day backup already exists as the plain date directory:
   - rename that existing directory to `YYYY-MM-DD-01`
   - create the new backup as `YYYY-MM-DD-02`
4. If numbered siblings already exist for the date, create the next ordinal directory:
   - `YYYY-MM-DD-03`, `YYYY-MM-DD-04`, and so on
5. If a mixed state exists where both the plain date directory and numbered siblings are present, first promote the plain date directory into the next available missing lowest ordinal slot, then create the new backup as the next ordinal after the highest existing suffix.
6. Ordinals must be zero-padded through `09`, then continue as `10`, `11`, and so on.

This logic should be deterministic and reusable by `uninstall --backup` later, so the destination resolver belongs in this phase even though uninstall execution does not.

### 5. Preserve project-relative paths and segregate home/global paths under `_home/`

The backup layout must preserve enough structure to make the copied tree understandable and restorable.

Path mapping rules:

1. Project-local files keep their normal target-relative paths inside the backup destination.
   - Example: `docs/.starter-docs/manifest.json` becomes `.backup/2026-04-18/docs/.starter-docs/manifest.json`
2. Global/home-directory files are written beneath `.backup/<date>/_home/`, preserving their path relative to the user home directory.
   - Example: `~/.claude/skills/archive-docs/SKILL.md` becomes `.backup/2026-04-18/_home/.claude/skills/archive-docs/SKILL.md`
3. Directory-only prune candidates follow the same mapping rules as files.
4. The backup command must reject audited absolute paths that are neither inside the target directory nor inside the user home directory; those paths should be surfaced as skipped audit entries rather than copied into an invented layout.

### 6. Add shared lifecycle presentation helpers for backup audit and completion output

Create a `lifecycle-ui.ts` helper module in this phase because backup needs structured presentation now and uninstall will need the same rendering conventions later.

The helper should provide reusable renderers for:

- a boxed operation header (`backup only`)
- grouped audit sections with totals
- retained/skipped path sections
- a post-run completion panel with destination and copied counts

Backup should use these helpers immediately. Uninstall-specific prompts or phrasing do not belong in this phase, but the shared renderer should be generic enough that a later uninstall phase can supply different headings and totals without reformatting the terminal UI from scratch.

## Parallelism

- `backup.ts` and `backup.test.ts` can be developed in parallel once Phase 2 lands the shared audit result model.
- `cli.ts` command registration/help work can proceed in parallel with backup execution logic after the command contract is fixed.
- `lifecycle-ui.ts` should be treated as the shared presentation surface for this wave; if a later uninstall phase needs the same module, backup should land the generic renderer first and uninstall should extend it rather than forking its own formatter.
- This phase should not block on uninstall execution logic. The only intentional overlap is the shared presentation helper.

## Acceptance Criteria

- [ ] `starter-docs backup` is a valid top-level command and `starter-docs backup --help` prints command-specific help without running audit.
- [ ] Omitting `--yes` defaults backup to interactive confirmation.
- [ ] `--yes` skips the interactive confirmation prompt but still prints the audit summary before copying.
- [ ] Backup invokes the shared audit engine exactly once per run and uses that single result for presentation and copy execution.
- [ ] If the audit result is empty, backup exits successfully without creating a new `.backup/` destination.
- [ ] Backup copies all audited removable files into `.backup/<date-or-ordinal>/` while preserving project-relative paths.
- [ ] Backup preserves audited home-directory files under `.backup/<date-or-ordinal>/_home/` using home-relative paths.
- [ ] Audited directory-prune candidates are created in the backup tree even when they contain no copied files.
- [ ] Repeated backups on the same date promote the plain-date directory to `-01` and create the new backup as `-02`, with later runs continuing the ordinal sequence.
- [ ] Backup never audits or copies anything already under `.backup/`.
- [ ] `npm run build -w starter-docs` succeeds.
- [ ] `npm test -w starter-docs` passes.
