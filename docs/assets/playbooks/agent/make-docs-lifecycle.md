---
title: "Make Docs Lifecycle Playbook"
persona: "agent"
status: "active"
---

# Make Docs Lifecycle Playbook

This is the canonical W9 R3 reader-facing copy for the `agent` persona. Keep `docs/library/playbooks/agent/make-docs-lifecycle.md` readable until references fully migrate.

This playbook is the agent persona's map for working through the
make-docs lifecycle.
It is not automation, does not enforce stage order, and does not gate work.
Use the lifecycle anchor for ordering defaults:
[lifecycle.md](../../references/lifecycle.md).

When user direction or repo evidence warrants a skip, reorder, or revisit,
surface that departure and record the reason in the relevant artifact.

## Optional Inputs

### Purpose

Collect source material that can inform lifecycle work without treating that
material as a required stage.

### Inputs

- User requests, design notes, screenshots, transcripts, analysis, or other
  repo-local artifacts.
- Existing files under `docs/artifacts/`.

### Decision Points

- Use the input as source evidence.
- Ask for clarification when the input conflicts with repo state.
- Defer the input when it does not affect the current work.

### Suggested Assists

- `docs/artifacts/`
- `docs/assets/references/path-and-link-hygiene.md`

Suggested assists are optional.

### Exit Criteria

- Relevant inputs are cited or summarized in the next lifecycle artifact.
- Irrelevant inputs are left out with no extra artifact churn.

### Handoff

The planning segment inherits the selected source evidence and any explicit
constraints.

## Design

### Purpose

Frame the problem, audience, constraints, and intended direction before detailed
planning.

### Inputs

- Optional input artifacts.
- Existing designs, PRDs, plans, and user direction.
- Current repo structure and conventions.

### Decision Points

- Create a new design.
- Update an existing design.
- Skip design when the user gives enough implementation direction or when the
  work is already scoped by a later artifact.

### Suggested Assists

- `docs/assets/references/design-workflow.md`
- `docs/assets/references/design-contract.md`
- `docs/assets/templates/design.md`

Suggested assists are optional.

### Exit Criteria

- The design decision, alternatives, consequences, and intended follow-on are
  clear enough to support planning or a justified direct handoff.

### Handoff

Planning inherits the design's scope, constraints, risks, and follow-on route.

## Plan

### Purpose

Turn the selected direction into an executable route, coordinate lineage, and
work-shaping strategy.

### Inputs

- Design or equivalent source direction.
- Existing plan lineage.
- PRD and work backlog state.

### Decision Points

- Create a new plan.
- Update a plan for an active lineage.
- Continue directly from an existing plan when it already owns the work.

### Suggested Assists

- `docs/assets/references/planning-workflow.md`
- `docs/assets/templates/`
- `docs/plans/`

Suggested assists are optional.

### Exit Criteria

- The plan names the route, scope, dependencies, validation expectations, and
  downstream artifact shape.

### Handoff

PRD generation or update inherits the route, coordinate lineage, and planned
deliverables.

## PRD

### Purpose

Define the product or documentation contract that the work backlog should
implement.

### Inputs

- Plan output.
- Existing active PRDs.
- Risk register, open questions, and confirmed drift.

### Decision Points

- Create a new PRD.
- Update an existing PRD.
- Record no-new-PRD rationale when the active set already covers the change.

### Suggested Assists

- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/output-contract.md`
- `docs/assets/references/prd-change-management.md`
- `docs/prd/03-open-questions-and-risk-register.md`

Suggested assists are optional.

### Exit Criteria

- Requirements, risks, decisions, and unresolved questions are current enough to
  generate or maintain the work backlog.

### Handoff

The work backlog inherits the effective PRD contract and any risk-register
decisions.

## Work Backlog

### Purpose

Convert the effective PRD and plan into phase-sized implementation work.

### Inputs

- PRD contract and risk-register state.
- Plan route and coordinate lineage.
- Existing work backlog files.

### Decision Points

- Create a new work backlog.
- Update an existing backlog.
- Continue phase work from the active backlog.

### Suggested Assists

- `docs/work/`
- `docs/assets/templates/`
- `docs/assets/references/execution-workflow.md`

Suggested assists are optional.

### Exit Criteria

- The backlog has phase files with checkbox tasks, acceptance criteria,
  dependencies, scope hints, and validation expectations.

### Handoff

Implementation inherits the active phase file as the authority for what to do
next.

## Implement

### Purpose

Make the changes described by the active phase while staying within its scope
and the repo's conventions.

### Inputs

- Active work phase.
- Current code, docs, and generated state.
- User direction since the phase was planned.

### Decision Points

- Implement serially.
- Split disjoint work when independent ownership is clear.
- Pause only for a real blocker or risky ambiguity.

### Suggested Assists

- `work-on-phase`
- `work-on-wave`
- Repo-local validation commands

Suggested assists are optional.

### Exit Criteria

- Phase tasks are complete or explicitly deferred.
- Relevant automated tests or focused checks have run.
- The diff matches the phase scope.

### Handoff

The coverage-pass band inherits the completed diff, validation evidence, and
any explicit deferrals.

## Coverage-Pass Band

### Purpose

Close the phase across documentation, history, PRD, guide/playbook coverage,
validation, and UAT or manual-test decisions.

### Inputs

- Completed phase diff.
- Active phase checklist and acceptance criteria.
- Existing guides, playbooks, history records, and PRD state.

### Decision Points

- Create, update, link-only, or record no guide/playbook coverage.
- Create or update a history record.
- Update PRD or risk-register state, or record a no-change rationale.
- Run, defer, or mark UAT/manual testing not applicable.

### Suggested Assists

- [coverage-pass-contract.md](../../../assets/references/coverage-pass-contract.md)
- `closeout-phase`
- `closeout-commit`

Suggested assists are optional.

### Exit Criteria

- Each coverage surface has a verdict and reason.
- History and PRD reconciliation are complete.
- Validation evidence is recorded.

### Handoff

Commit and phase gate inherit the closeout evidence and final phase state.

## Commit And Phase Gate

### Purpose

Create a local commit for the completed phase and verify the phase can hand off
to the next phase.

### Inputs

- Closed phase diff.
- Matching history record.
- Local commit-message convention.
- Checkpoint state.

### Decision Points

- Commit the phase locally when authorized.
- Draft only when commit authorization is absent.
- Skip push unless explicitly requested.

### Suggested Assists

- `docs/assets/references/commit-message-convention.md`
- `phase_gate.py`
- `checkpoint.py`

Suggested assists are optional.

### Exit Criteria

- The commit contains only the intended change set.
- The phase gate has no blockers.
- Push status is explicit.

### Handoff

The next phase inherits a clean committed baseline and any remaining generated
checkpoint state.

## Release / Publish

### Purpose

Make completed work available to its intended audience.

### Inputs

- Completed wave or release candidate.
- Release notes, packaging state, deployment instructions, or handoff material.
- Validation evidence.

### Decision Points

- Deploy code.
- Publish docs.
- Push to source control.
- Hand off a report.
- Defer release when the audience or release vehicle is not ready.

### Suggested Assists

- Repo-local release references
- Packaging or deployment validation commands

Suggested assists are optional.

### Exit Criteria

- The intended audience can access the work through the chosen release path.
- Any deferred release step has an owner and reason.

### Handoff

Archival inherits the released state, release evidence, and deferred follow-ups.

## Archival

### Purpose

Move superseded planning or documentation material out of the active set while
preserving useful history.

### Inputs

- Released or superseded docs.
- Active PRD, plan, guide, and history state.
- Link and path hygiene expectations.

### Decision Points

- Archive outdated material.
- Keep active material in place.
- Repair links or references exposed by the archive move.

### Suggested Assists

- `archive-docs`
- `docs/assets/archive/`
- `docs/assets/references/path-and-link-hygiene.md`

Suggested assists are optional.

### Exit Criteria

- Active docs point to current material.
- Archived docs remain discoverable as history.
- Link hygiene is preserved or documented as baseline debt.

### Handoff

Retrospective inherits the final active/archive state and any lessons from the
release or archive pass.

## Retrospective

### Purpose

Capture what changed, what worked, what should change next, and which follow-up
work deserves a new lifecycle pass.

### Inputs

- Release or handoff results.
- History records.
- Validation and UAT outcomes.
- Deferred questions, risks, and follow-ups.

### Decision Points

- Record lessons only.
- Open follow-up planning.
- Update process guidance when repeated friction is clear.

### Suggested Assists

- `retro`
- `docs/assets/history/`
- `docs/prd/03-open-questions-and-risk-register.md`

Suggested assists are optional.

### Exit Criteria

- Lessons and follow-ups are captured at the right level of detail.
- New work is routed into the lifecycle rather than hidden in prose.

### Handoff

The next lifecycle pass inherits any explicit follow-up, risk, or process
change.
