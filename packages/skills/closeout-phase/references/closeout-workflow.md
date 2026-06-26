# Closeout Phase Workflow

Use this workflow to close a completed work backlog phase without treating unchecked task boxes as proof of unfinished work or creating unnecessary documentation.

## Inputs

- Target phase document under `docs/work/`.
- Relevant implementation diff, test output, and phase-linked docs.
- Repo contracts for work backlogs, guides, history records, PRD/risk tracking, and commit messages.

## Preflight

1. Read the nearest `AGENTS.md`/`CLAUDE.md` files that apply to every file you expect to touch.
2. Run `make-docs operations work-phase-state TARGET_PHASE --json` before manually reading phase details. Use the JSON for the phase coordinate, source links, task list, unchecked tasks, acceptance criteria, and syntax warnings.
3. Run `make-docs operations closeout-probe --repo-root . --scope auto --json` before broad diff or contract discovery. Use explicit staged, unstaged, or full scope if the user specified it.
4. Run `scripts/guide_coverage_probe.py --repo-root . --changed-files-json PROBE_JSON` before opening guide files.
5. Inspect current git status only as needed to confirm the probe scope, and preserve unrelated local changes.
6. Prefer indexed lookup for code and docs when available. Reindex stale `jdocmunch` or `jcodemunch` indexes before using direct reads.
7. Build an evidence set from the phase-state JSON, closeout probe, guide probe, changed files, tests, history records, and only the existing guides that remain relevant after probing.
8. If the phase includes PR, CI, merge, push, or other externally visible tasks, treat them as documented handoffs unless the user explicitly authorized the action in the active turn.

## Scripted Fast Path

Use the packaged operation boundary before broad manual analysis:

- `make-docs operations work-phase-state TARGET_PHASE --json > /tmp/work-phase-state.json` summarizes phase coordinates, `tN` tasks, unchecked tasks, acceptance criteria bullets, source links, and task-syntax warnings.
- `make-docs operations closeout-probe --repo-root . --scope auto --json > /tmp/closeout-probe.json` summarizes changed files, repo contracts, history candidates, risk-register IDs, and validation hints.
- `scripts/guide_coverage_probe.py --repo-root . --changed-files-json /tmp/closeout-probe.json > /tmp/guide-coverage.json` lists guide candidates before manual guide reads.
- `make-docs operations closeout-validate --repo-root . --probe-json /tmp/closeout-probe.json --print-only` lists focused validation commands. Use `--run` only when you are ready to execute them.
- `make-docs operations closeout-history --mode phase --repo-root . --probe-json /tmp/closeout-probe.json --phase-json /tmp/work-phase-state.json` drafts a phase history skeleton. Add `--write` only after the task, guide, and gap decisions are ready.

Only read phase-linked docs, guide files, diffs, or references that the probes identify as relevant or that remain unresolved after reviewing the JSON.

For long closeouts, keep the coordinator or user informed at these boundaries: probe complete, task decisions complete, guide/gap decision complete, validation selected or run, and final closeout summary.

## Gate 1: Task Completion

For each unchecked `### Tasks` item reported by `make-docs operations work-phase-state`:

1. Determine whether it maps to completed work, unfinished work, failed work, or ambiguous evidence.
2. Treat these as completion evidence:
   - implementation or documentation exists in the expected location
   - tests or validation relevant to the criterion passed
   - linked history, plan, PRD, or guide docs confirm the outcome
   - the user explicitly states the item is complete and the checkbox is stale
3. Use `### Acceptance criteria` bullets as evidence for the related task; do not add checkbox syntax to acceptance criteria.
4. Mark the task complete only when evidence supports completion and no failing validation contradicts it.
5. Do not mark the task complete when evidence shows unfinished work, failed tests, or an unresolved blocker.
6. Ask the user before changing the checkbox when the evidence is ambiguous or when completion depends on context that is not present in the repo.

Record any remaining unchecked task items and why they stayed open.

## Gate 2: Guide Coverage Decision

Create or update guides only when the phase introduced durable user-facing, maintainer-facing, contributor-facing, operational, validation, or extension knowledge that is not already covered clearly.

Before writing guide files:

1. Read `docs/assets/references/guide-contract.md` when it exists.
2. Read the matching guide templates under `docs/assets/templates/`.
3. Inspect `guide_coverage_probe.py` output before opening existing guide files.
4. Inspect only existing library docs under `docs/assets/library/developer/` and `docs/assets/library/user/` that overlap the phase, changed files, or guide decision.
5. Decide the outcome for each documentation-worthy capability: `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`.

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

After creating or updating guide content, re-check overlapping existing guides and add reciprocal links, `related` frontmatter, or concise supplemental context when it improves discoverability. Record the reconciliation changes made, or explicitly record `No existing guide enrichment was needed` with a short reason.

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

Always create or update a phase closeout history entry under `docs/assets/archive/history/`.

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

- the focused command list from `make-docs operations closeout-validate`
- focused tests for touched CLI or code behavior
- markdown link or contract checks when available
- `git diff --check`
- `jdocmunch` refresh after meaningful doc, guide, history, or router edits
- `jcodemunch` refresh only after meaningful code, script, TypeScript, or public API edits

If a requested validation cannot run, state what was skipped and why.
