# Commit Message Convention

Use this reference when drafting or creating project commits from wave, revision, phase, plan, work, or history artifacts.

Commit messages use one short subject line, then one blank line, then an optional body paragraph. The body paragraph is copied from the authoritative source document described below.

## Document Commits

Use document commits for documentation changes that don't fit into the other categories.

Subject:

If a wave or revision is indicated, use `[W{wave} R{revision}]` to indicate the wave and revision.  Example:
```text
docs: [W{wave} R{revision}] {documentation target purpose}
```

If documentation is specific to a phase, use `[W{wave} R{revision} P{phase}]` to indicate the wave, revision, and phase.  Example:
```text
docs: [W{wave} R{revision} P{phase}] {documentation target purpose}
```

Otherwise simply capture the document purpose in the subject line.

```text
docs: {document target purpose}
```

Rules:

- If a wave or revision was not specified or defined while creating the documentation, do not include them in the subject line.
- Otherwise, include them in the subject line.
- Do not make up wave, revision, or phase coordinates that are not present in the source document.

Body:

- Summarize the changes made to the documentation in a single paragraph.
- Do not include tables, verification lists, or extra commentary in the commit body.
- DO include links to relevant documentation sections or files, but only if they are directly relevant to the changes.
- Favor the principle of progressive-disclosure, and only include links that, if followed, would provide immediate context for the changes.

## Feature Commits

Use feature commits for implemented phase work.

Subject:

```text
feat: [W{wave} R{revision} P{phase-or-range}] {wave name} - {phase name}
```

Rules:

- Include wave, revision, and phase inside square brackets.
- Use `P1`, `P5`, or a phase range such as `P1-2`.
- Do not include commas in the coordinate. Use `[W8 R0 P5]`, not legacy `[W8, R0, P5]`.
- Use the wave name from the plan/work/history title.
- Use the phase name from the implemented work phase or matching history record.
- If the phase commit intentionally spans multiple phases, use the exact phase range and a concise combined phase label.

Body:

- Copy the first paragraph under `## Changes` from the matching history record.
- Prefer `docs/assets/history/`.
- If the repo has not migrated yet, accept legacy history records identified by the legacy router.
- Do not include tables, documentation sections, verification lists, or extra commentary in the commit body.

Example:

```text
feat: [W8 R0 P5] CLI command simplification - Apply and sync output polish

Implemented a Wave 8 follow-up phase for the `make-docs` apply/sync review output, framed by [the command simplification design](../archive/designs/2026-04-20-cli-command-simplification.md) and the completed Phase 4 validation work in [the Phase 4 history record](2026-04-20-w8-r0-p4-cli-command-simplification.md). This phase focused on making the already-installed no-op sync readout clearer, less redundant, and consistent with Clack-rendered CLI screens.
```

## Plan Commits

Use plan commits for pre-work planning, design, decomposition, or backlog generation that establishes a wave/revision before implementation phases are committed.

Subject:

```text
plan: [W{wave} R{revision}] {wave name}
```

Rules:

- Include wave and revision inside square brackets.
- Do not include phase in plan commit coordinates.
- Do not include commas in the coordinate. Use `[W9 R0]`, not legacy `[W9, R0]`.
- Use the wave name from the design, plan overview, or work index.

Body:

- Copy the first paragraph under `## Purpose` from the design document that seeded the plan.
- If there is no clear design document, copy the first paragraph under `## Purpose` from the plan overview.
- If neither source has a clean first paragraph, omit the body instead of inventing one.

Example:

```text
plan: [W9 R1] Docs Assets Resource Namespace Overhaul

Define the replacement architecture for non-project document resources under `docs/` after Wave 9. The new model removes the collection of top-level hidden resource directories, consolidates document resources under one visible `docs/assets/` directory, and moves make-docs runtime state out of `docs/` into root `.make-docs/`.
```

## Inference Workflow

Use this workflow when the user asks for a commit message but does not provide the exact commit kind, coordinate, or label.

Commit kind:

- Use `feat:` when the change set implements phase work, especially source, tests, generated template assets, packaged docs, or behavior described by a work phase.
- Use `plan:` when the change set creates or updates pre-implementation design, plan, decomposition, or backlog artifacts and does not implement the phase itself.
- If the change set includes both planning docs and implementation work, prefer `feat:` when implementation files are part of the requested commit; otherwise prefer `plan:`.

Coordinate:

Resolve the coordinate in this order, stopping at the first unambiguous match:

1. Explicit user-provided coordinate or commit kind.
2. Matching history record frontmatter, title, or filename.
3. Changed work phase path such as `docs/work/YYYY-MM-DD-w8-r0-<slug>/05-<phase>.md`.
4. Changed plan phase path such as `docs/plans/YYYY-MM-DD-w8-r0-<slug>/05-<phase>.md`.
5. Changed plan overview, work index, or design metadata for wave/revision-only plan work.
6. Branch name or current task name if it contains `w{wave}-r{revision}` and optional `p{phase}`.
7. Nearby recent commit subjects that share the same changed wave slug and continue the phase sequence.

Names:

- Derive the wave name from the design H1, plan overview H1, work index H1, or history record H1.
- Remove suffixes such as `- Implementation Plan`, `- Work Backlog`, or `- Phase N: ...` when deriving the wave name.
- Derive the phase name from the matching work phase heading, plan phase heading, or history record title.
- Remove leading `Phase N`, `Phase N:`, or equivalent numbering from the phase name before placing it after ` - `.

Body source:

- For `feat:`, use the matching history record `## Changes` first paragraph.
- For `plan:`, use the seeding design `## Purpose` first paragraph, then the plan overview `## Purpose` first paragraph.
- If the expected body source is missing, draft the best subject and explain that the body source could not be found. Do not invent a body paragraph.

Ambiguity:

- If one coordinate is clearly dominant from changed paths and docs, use it.
- If multiple plausible coordinates remain, draft the best candidate with a source note, but do not create a commit without user confirmation.
- If staged files and unstaged files point to different coordinates, use only the staged set when the user has staged changes; otherwise ask which change set should be committed.

## Source Resolution

Before drafting or committing:

- Inspect `git status --short` to understand the staged and unstaged change set.
- Inspect recent history with `git log --format='%h %s' -n 30` to preserve the current naming style.
- Find the relevant coordinate from the changed files, branch name, plan/work paths, history record frontmatter, or nearby commit subjects.
- For feature commits, read the matching history record and extract only the first `## Changes` paragraph.
- For plan commits, read the seeding design first, then the plan overview if needed, and extract only the first `## Purpose` paragraph.
- If the source documents disagree, prefer the artifact closest to the committed work: history records for feature work, design or plan overview for plan work.

## Commit Execution

Only create the commit when the user explicitly asks for a commit.

When committing:

- Stage only files that belong to the requested change set.
- Do not stage unrelated user edits.
- Do not rewrite, revert, or clean existing user changes to make the commit easier.
- Use `git commit` with the subject and body exactly as drafted.
- Verify the final message with `git log -1 --format=%B`.
