# Closeout Phase Workflow

Use this workflow to close a completed work backlog phase without treating unchecked boxes as proof of unfinished work or creating unnecessary documentation.

## Inputs

- Target phase document under `docs/work/`.
- Relevant implementation diff, test output, and phase-linked docs.
- Repo contracts for work backlogs, guides, history records, PRD/risk tracking, and commit messages.

## Preflight

1. Read the nearest `AGENTS.md`/`CLAUDE.md` files that apply to every file you expect to touch.
2. Identify the phase coordinate, source plan/PRD docs, and acceptance criteria section.
3. Inspect current git status and preserve unrelated local changes.
4. Prefer indexed lookup for code and docs when available. Reindex stale `jdocmunch` or `jcodemunch` indexes before using direct reads.
5. Build an evidence set from phase artifacts, changed files, tests, history records, and existing guides.
6. Read the repo's guide contract and inspect current guides under `docs/guides/developer/` and `docs/guides/user/` before making guide decisions.

## Gate 1: Acceptance Criteria

For each unchecked acceptance criterion:

1. Determine whether it maps to completed work, unfinished work, failed work, or ambiguous evidence.
2. Treat these as completion evidence:
   - implementation or documentation exists in the expected location
   - tests or validation relevant to the criterion passed
   - linked history, plan, PRD, or guide docs confirm the outcome
   - the user explicitly states the item is complete and the checkbox is stale
3. Mark the criterion complete only when evidence supports completion and no failing validation contradicts it.
4. Do not mark the criterion complete when evidence shows unfinished work, failed tests, or an unresolved blocker.
5. Ask the user before changing the checkbox when the evidence is ambiguous or when completion depends on context that is not present in the repo.

Record any remaining unchecked items and why they stayed open.

## Gate 2: Guide Coverage Decision

Create or update guides only when the phase introduced durable user-facing, maintainer-facing, contributor-facing, operational, validation, or extension knowledge that is not already covered clearly.

Before writing guide files:

1. Read `docs/assets/references/guide-contract.md` when it exists.
2. Read the matching guide templates under `docs/assets/templates/`.
3. Inspect existing guides under `docs/guides/developer/` and `docs/guides/user/` for overlap.
4. Decide the outcome for each documentation-worthy capability: `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`.

Create or update a developer guide when at least one condition is true:

- maintainers need a new operational procedure to work safely with the shipped change
- developers need orientation around new code paths, contracts, generated files, validation flows, or extension points
- the phase created a repeated troubleshooting, release, migration, setup, or first-PR concern
- existing docs mention the capability but do not explain how to maintain, extend, validate, or safely change it

Create or update a user guide when at least one condition is true:

- users need a new or changed workflow to use what the project ships
- novices need orientation to a product concept, command, setup path, or expected result
- advanced users need discoverable deeper usage, configuration, troubleshooting, or workflow expansion
- existing docs mention the capability but do not explain how a user should apply it

Prefer updating an existing guide when it already owns the topic. Use `related` frontmatter and cross-links for companion coverage instead of duplicating full guides across audiences.

Do not create a guide when:

- the phase only moved, archived, or checked off docs with no new user, maintainer, or developer procedure
- existing guides already cover the knowledge clearly
- the only useful content would repeat the phase history entry
- the capability is too internal for users and too narrow for maintainers or contributors

When current behavior is useful now but downstream work is needed to complete or enrich the guide later, write the current coverage now and add `## Future Coverage` to the guide with:

- `Blocked by`: the missing downstream phase, capability, decision, or artifact
- `Update when`: the concrete signal that should trigger the guide update
- `Guide change`: what should be added, revised, or removed later

Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.

When no guide is needed, explicitly record `No new developer guide was needed` and/or `No new user guide was needed` in the history entry with a short reason.

## Gate 3: Gap Capture

Capture only novel gaps that surfaced during or from the phase.

1. Check whether the repo already has `docs/prd/03-open-questions-and-risk-register.md`.
2. If it exists, update it for novel open questions, risks, gaps, drift, decisions, or resolved gaps.
3. If it does not exist, do not create a standalone PRD risk register and do not introduce `docs/architecture/` solely for closeout.
4. When no active PRD risk register exists, capture novel gaps in the phase history entry under the project documentation or changes section, and note that no active PRD risk register exists.
5. If a gap is already documented elsewhere, link the existing coverage instead of duplicating it.
6. Do not create separate questions, decisions, risks, gaps, or architecture-decision files while the active PRD risk register exists unless the user explicitly asks for a new convention.

Each novel gap should state:

- what the gap is
- whether it was filled during the phase
- if unfilled, when it is expected to be resolved
- if there is no planned resolution, what it blocks

When updating the PRD risk register, use one numbered `###` item heading with a `Status` / `Decision` / `Follow-Up` table. Use `D-001`, `D-002`, etc. under `## Confirmed Drift`; `Q-001`, `Q-002`, etc. under `## Open Questions`; and `R-001`, `R-002`, etc. under `## Rebuild Risks`. Assign the next available number within the section and never renumber existing items. Valid statuses are `Open`, `Confirming`, `Deferred`, and `Closed`. Include `Question` or `Issue`, `Why it matters`, `Recommendation`, and `To close`; add `Resolution` only when the item is closed. Do not use `### Change Notes` inside the risk register.

When no novel gaps were found, explicitly record `No novel gaps were found` in the history entry.

## Gate 4: History Entry

Always create or update a phase closeout history entry under `docs/assets/history/`.

The history entry should include:

- phase coordinate and source documents
- acceptance criteria status changes
- guide decisions for both developer and user audiences, including no-guide outcomes
- future coverage notes added to guides, if any
- gap capture decisions, including no-gap outcomes
- validation performed and notable results
- links to any PRD, guide, plan, work, or archived docs changed during closeout

Use the repo's existing history filename and heading conventions. Prefer updating an existing closeout entry for the same phase over creating a duplicate.

## Gate 5: Commit Message Draft

Draft a commit message only; do not commit unless the user explicitly asks.

1. Read `docs/assets/references/commit-message-convention.md` when it exists.
2. If that file does not exist, look for the repo's nearest commit convention.
3. Draft the message from the actual closeout changes, not from the original implementation plan alone.
4. Keep archive/history edits separate from unrelated implementation work unless the user asks for one combined message.

## Validation

Run validation that matches the files changed. Prefer:

- focused tests for touched CLI or code behavior
- markdown link or contract checks when available
- `git diff --check`
- `jdocmunch` and `jcodemunch` refreshes after meaningful docs or code edits

If a requested validation cannot run, state what was skipped and why.
