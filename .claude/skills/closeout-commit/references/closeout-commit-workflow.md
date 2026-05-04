# Closeout Commit Workflow

Use this workflow to turn an uncommitted change set or current-session work into closeout documentation and a commit-message draft.

## Inputs

- Current git status, staged diff, unstaged diff, and relevant untracked files.
- Current turn or session context when available.
- Validation results and known failures from the change set.
- Repo contracts for history records, gap tracking, and commit messages.

## Preflight

1. Read the nearest `AGENTS.md`/`CLAUDE.md` files that apply to every file you expect to touch.
2. Inspect `git status --short`.
3. If files are staged, treat the staged set as the commit candidate unless the user says otherwise.
4. If nothing is staged, inspect the unstaged and untracked files that belong to the requested change set.
5. Preserve unrelated local changes. Do not stage, revert, or clean files unless explicitly asked.
6. Prefer indexed lookup for code and docs when available. Reindex stale `jdocmunch` or `jcodemunch` indexes before using direct reads.

## Gate 1: Change Set Discovery

Build a concise evidence set from:

- `git diff --stat`
- `git diff --cached --stat` when staged files exist
- relevant file diffs
- changed docs, code, tests, manifests, and generated assets
- validation commands already run during the session
- current-session notes that explain why the change exists

If staged and unstaged files point to different work, draft for the staged set and note that unstaged work is excluded. If no staged set exists and the working tree mixes unrelated work, ask which change set should be closed out.

## Gate 2: Gap Capture

Capture only novel gaps discovered during the turn, session, validation, or changed files.

1. Check whether `docs/prd/03-open-questions-and-risk-register.md` exists.
2. If it exists, update it for novel open questions, risks, gaps, drift, decisions, or resolved gaps.
3. If it does not exist, do not create a standalone PRD risk register solely for commit closeout.
4. When no active PRD risk register exists, record novel gaps in the history entry and state that no active PRD risk register exists.
5. If a gap is already documented elsewhere, link the existing coverage instead of duplicating it.
6. Do not create separate questions, decisions, risks, gaps, or architecture-decision files while the active PRD risk register exists unless the user explicitly asks for a new convention.

Each novel gap should state:

- what the gap is
- whether it was filled by this change set
- if unfilled, when it is expected to be resolved
- if there is no planned resolution, what it blocks

When updating the PRD risk register, use one `###` item heading with a `Status` / `Decision` / `Follow-Up` table. Valid statuses are `Open`, `Confirming`, `Deferred`, and `Closed`. Include `Question` or `Issue`, `Why it matters`, `Recommendation`, and `To close`; add `Resolution` only when the item is closed.

When no novel gaps were found, explicitly record `No novel gaps were found` in the history entry.

## Gate 3: History Entry

Always create or update a history entry under `docs/assets/history/`.

The history entry should include:

- change set purpose and source context
- files or doc areas changed at a useful level of detail
- gap decisions, including no-gap outcomes
- validation performed and notable results
- commit-message source used
- links to relevant PRD, guide, plan, work, history, or archive docs

Use the repo's existing history filename, heading, and table conventions. Prefer updating an existing history entry for the same change set over creating a duplicate.

Do not create developer guides by default. If the user explicitly asks for maintainer or developer guides, or if the work is also a phase closeout, use the appropriate guide or `$closeout-phase` workflow.

## Gate 4: Commit Convention Resolution

Resolve the commit-message convention in this order:

1. Read `docs/assets/references/commit-message-convention.md` when it exists.
2. When working inside the `make-docs` repo on template/package maintenance, also inspect `packages/docs/template/docs/assets/references/commit-message-convention.md`. If the convention itself changes, keep the root and template copies aligned.
3. If no repo convention exists, use normal commit-message judgment and state that no convention file was found.

When the convention file exists, follow its source-resolution rules. In particular:

- inspect `git status --short`
- inspect recent history with `git log --format='%h %s' -n 30`
- derive coordinates only from explicit user input, changed artifacts, history records, work/plan paths, branch names, or nearby commit subjects
- for feature commits, use the first paragraph under `## Changes` from the matching history record
- for plan commits, use the first paragraph under `## Purpose` from the seeding design, then the plan overview if needed
- do not invent a body paragraph when the expected source is missing

## Gate 5: Commit Message Draft

Draft the message from the actual closeout changes and selected change set.

The final response should include:

- the drafted commit message
- the convention source used, or that no convention was found
- whether staged files, unstaged files, or the full working tree was used
- validation that supports the draft
- any excluded unrelated files

Only create the commit when the user explicitly asks for a commit. If committing, stage only files that belong to the requested change set and verify the final message with `git log -1 --format=%B`.

## Validation

Run validation that matches the files changed. Prefer:

- focused tests for touched CLI or code behavior
- markdown link or contract checks when available
- `git diff --check`
- `jdocmunch` and `jcodemunch` refreshes after meaningful docs or code edits

If a requested validation cannot run, state what was skipped and why.
