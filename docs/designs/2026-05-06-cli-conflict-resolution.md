# CLI Conflict Resolution

> Filename: `2026-05-06-cli-conflict-resolution.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Standardize how the CLI handles existing files whose contents differ from the make-docs managed version.

When managed agent instructions, references, or templates already exist and differ from the desired content, the CLI should first ask for one batch-level decision across all detected diffs. Users who want a quick outcome can overwrite or skip all diffs in one step. Users who need finer control can choose a review flow that walks each diff one file at a time.

## Context

The installer already inspects desired assets against files on disk in `packages/cli/src/planner.ts`. Existing files that match the desired content become `noop`; existing files with matching manifest ownership become `update` or `generate`; divergent files without safe managed state become `skip-conflict`.

The current interactive exception is agent instruction handling. `packages/cli/src/wizard.ts` exposes `promptForInstructionConflictResolutions`, which asks for each `AGENTS.md` or `CLAUDE.md` conflict individually and offers:

- `Update`: append generated instructions to the existing file.
- `Overwrite`: replace the file with the managed make-docs version.
- `Skip`: leave the file unchanged.

That is better than silently skipping important instruction diffs, but it creates three problems:

- The user must make the same decision repeatedly when several files differ.
- The `Update` option is specific to instruction-file merge behavior and does not generalize to references or templates.
- References and templates that differ from the desired managed content are planned as skipped conflicts instead of receiving the same interactive decision path.

This issue is adjacent to, but distinct from, the earlier CLI asset-selection simplification. That work made included prompts, templates, and references part of the always-managed product surface; this design closes the remaining conflict-handling gap when always-managed references and templates already exist locally with different content.

The CLI should continue to use Clack for styling, notes, grouped context, and prompts. Any new interaction should read like the rest of the installer instead of introducing ad hoc terminal output.

## Decision

Replace instruction-only conflict review with a general managed-file diff review flow for agent instructions, references, and templates.

### 1. Classify Reviewable Diffs

The planner should continue to inspect all desired files before applying changes, but it should classify reviewable diffs by asset group:

- `agent instructions`: `AGENTS.md` and `CLAUDE.md` files at root, docs routers, and asset-router locations.
- `references`: managed files under `docs/assets/references/`.
- `templates`: managed files under `docs/assets/templates/`.

The implementation should preserve existing safe automatic behavior:

- Missing files are created.
- Files already matching desired content are noops.
- Managed files whose manifest hash proves local content is unchanged are updated automatically.
- Managed skill-file refresh behavior remains separate.

The new review flow applies only when a file exists and differs in a way that would otherwise require a user decision.

### 2. Ask Once for the Batch

When one or more reviewable diffs are found, the CLI should first show a Clack note summarizing the batch:

- total diff count
- count by group
- the affected groups in review order
- a short explanation that overwrite and skip can apply to every diff at once

Then the CLI should ask:

`How should make-docs handle these existing files?`

Options:

- `Overwrite all`: replace every detected conflicting agent instruction, reference, and template with the managed make-docs version.
- `Skip all`: leave every detected conflicting agent instruction, reference, and template unchanged.
- `Review each`: walk each file and choose `Overwrite` or `Skip`.

This batch prompt should be the first user decision after diff discovery. It should not ask per-file questions before this point.

### 3. Review by Group When Requested

If the user selects `Review each`, the CLI should review files in this order:

1. agent instructions
2. references
3. templates

Before each group, show a Clack note or equivalent styled boundary that names the group and summarizes progress, for example:

`Reviewing references (2 of 3 groups, 5 files)`

For each file, show:

- group name
- file path
- conflict reason
- progress indicator such as `File 4 of 9`
- available decision for that file

Per-file options should be only:

- `Overwrite`
- `Skip`

The previous `Update` option should be removed from this review flow. Appending generated instructions into existing instruction files is too specialized to use as the general conflict model and makes the grouped review harder to reason about.

### 4. Keep Planning and Application Deterministic

Conflict decisions should be represented as explicit per-path resolutions before the final install plan is applied.

The batch choices can be expanded into per-path resolutions internally:

- `Overwrite all` maps every reviewable diff to `overwrite`.
- `Skip all` maps every reviewable diff to `skip`.
- `Review each` maps each reviewed file to its selected resolution.

Planning should then convert `overwrite` resolutions to normal `update` or `generate` actions with the desired content. `skip` resolutions should remain `skip-conflict` actions with clear reasons.

The implementation should avoid having the apply phase prompt or infer behavior. Applying an install plan should remain deterministic from the plan and resolution map.

### 5. Preserve Clack Style and Existing CLI Expectations

The new prompt path should use the same Clack primitives and renderer pattern already used by the installer:

- `note` for context and group boundaries
- `select` for batch and per-file decisions
- existing cancellation handling through `isCancel`
- concise labels and hints consistent with the current wizard

The progress display should be visible during review without adding noisy custom formatting. A simple `File N of M` and `Group X of Y` is enough.

### 6. Update Tests Around Conflict Coverage

Tests should cover the new conflict model at both planning and wizard boundaries:

- instruction conflicts no longer offer `Update`
- references with local divergent content can be overwritten through the review resolution path
- templates with local divergent content can be overwritten through the review resolution path
- `Overwrite all` affects every reviewable diff across all groups
- `Skip all` preserves every reviewable diff across all groups
- `Review each` orders groups as agent instructions, references, then templates
- cancellation exits without applying partial resolutions
- existing automatic update/noop behavior remains unchanged for manifest-owned files

## Alternatives Considered

### Keep Instruction-Only Review

Keeping the current instruction-only review preserves the existing narrow safety guard, but it leaves references and templates in the bad state described by this design: they can be detected as different and then skipped without a direct user decision.

### Add Per-File Review for Every Asset Immediately

Reviewing every conflict one by one would fix references and templates, but it would worsen the current repetitive interaction. The batch-first prompt is the important UX change because most users will want the same answer for the whole set.

### Keep the Instruction `Update` Option

The append-style `Update` option is useful only for agent instructions. Keeping it would force references and templates into a different decision vocabulary or require group-specific behavior inside the review flow. Removing it makes the conflict model consistent: overwrite or preserve local content.

### Treat References and Templates as Always Overwritten

Always overwriting would align with the always-managed asset model, but it would be too destructive for unmanaged or locally modified files. The CLI should make the user's choice explicit when local content differs.

## Consequences

Users get one fast decision for common cases and a predictable review path for careful installs.

References and templates become first-class managed assets during conflict handling, matching the product direction established by the asset-selection simplification. A locally divergent reference or template is no longer silently skipped just because it is not an instruction router.

The implementation will need to rename and broaden instruction-specific types such as `InstructionConflictResolution` and `InstructionConflictResolutions`. The planner should model reviewable managed-file resolutions independently from instruction-kind detection, while still preserving instruction-kind metadata where useful for labels.

Removing `Update` is a behavior change for instruction conflicts. Users who previously appended make-docs guidance into an existing `AGENTS.md` or `CLAUDE.md` will now choose between replacing the file or preserving it. That is acceptable because this flow is about resolving managed-file diffs consistently, and append-merge behavior can create ambiguous ownership.

Downstream docs and tests should use the term `diff` or `conflict` consistently. User-facing text should avoid implying that only agent instructions require review.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-28-cli-asset-selection-simplification.md](../assets/archive/designs/2026-04-28-cli-asset-selection-simplification.md), [2026-04-22-cli-lifecycle-clack-standardization.md](../assets/archive/designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- Reason: this design builds on the always-managed asset model from asset-selection simplification and applies the Clack interaction standard to the remaining install-time conflict workflow.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../assets/prompts/designs-to-plan-change.prompt.md)
- Why: this is a targeted correction to existing CLI planning and interactive install behavior, not a new baseline planning track.
- Coordinate Handoff: related completed coordinates include `W7 R1` for CLI lifecycle Clack standardization and `W14 R0` for CLI asset-selection simplification. Recommended downstream coordinate is unresolved; planner must confirm the next active W/R coordinate before writing.
