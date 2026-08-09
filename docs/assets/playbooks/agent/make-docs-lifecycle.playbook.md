---
title: "Make Docs Lifecycle Playbook"
kind: "playbook"
persona: "agent"
status: "accepted"
stack: "build"
summary: "Guide agents through the Make Docs lifecycle from source evidence to implementation and closeout."
schema: "make-docs.playbook.v2"
workflowSchema: "make-docs.workflow.v1"
---

# Make Docs Lifecycle Playbook

This is the canonical reader-facing copy for the `agent` persona under the W9 R5 asset layout.

## Purpose

This playbook is the agent persona's map for working through the make-docs lifecycle. It is not automation, does not enforce stage order, and does not gate work. Use the lifecycle anchor for ordering defaults: [lifecycle.md](../../../../.make-docs/references/system/lifecycle.md).

## When To Use

Use this playbook whenever an agent works a Make Docs lifecycle stage, from optional source inputs through design, planning, PRD, work backlog, implementation, coverage pass, commit, release, archival, and retrospective. When user direction or repo evidence warrants a skip, reorder, or revisit, surface that departure and record the reason in the relevant artifact.

## Inputs

Lifecycle inputs arrive with an authority and precedence order; use authority in this order:

1. Explicit user direction for the current task.
2. Repo-local `AGENTS.md` and routed Make Docs instructions.
3. Active designs, plans, PRDs, work backlogs, and risk-register state.
4. Current code, docs, manifests, templates, and validation output.
5. Archived history as evidence of past state, not as current contract.

## Dependencies

```playbook
dependencies:
  - id: lifecycle-reference
    kind: reference
    requirement: required
    source: .make-docs/references/system/lifecycle.md
    used_by: [identify-stage]
    fallback: stop and ask the user for the intended stage order
  - id: docs-router
    kind: reference
    requirement: required
    source: docs/AGENTS.md and docs/CLAUDE.md
    used_by: [read-stage-authority]
    fallback: follow explicit user direction and current repo evidence
  - id: system-templates
    kind: reference
    requirement: optional
    source: .make-docs/templates/system/
    used_by: [produce-stage-artifact]
    fallback: author the artifact from the matching contract alone
  - id: coverage-pass-contract
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/coverage-pass-contract.md
    used_by: [run-coverage-pass]
    fallback: record manual coverage verdicts with reasons
  - id: make-docs-cli
    kind: cli
    requirement: required
    probe: make-docs
    source: package install of the make-docs CLI
    used_by: [validate-playbook-coverage]
    fallback: stop with install guidance
  - id: history-record-contract
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/history-record-contract.md
    used_by: [record-handoff]
    fallback: summarize the handoff in the final response
  - id: commit-message-convention
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/commit-message-convention.md
    used_by: [enforce-commit-convention]
    fallback: draft the commit message for user review
```

## Workflow

```playbook
workflow:
  id: make-docs-lifecycle
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: identify-stage
    title: Identify the active lifecycle stage
    executor: agent
    role: decision
    activation: sequential
    mode: delegated
    uses: [lifecycle-reference]
    instructions: Identify the active lifecycle stage or the stage departure requested by the user, and surface any skip, reorder, or revisit with its reason.

  - id: read-stage-authority
    title: Read the routed stage authority
    executor: agent
    role: activity
    activation: sequential
    mode: delegated
    uses: [docs-router]
    instructions: Read the routed instructions and source artifact for the stage before writing, honoring the authority order in Inputs.

  - id: produce-stage-artifact
    title: Produce or update the stage artifact
    executor: agent
    role: activity
    activation: sequential
    mode: delegated
    uses: [system-templates]
    instructions: Implement or update the required artifact while preserving active authority boundaries, following the matching stage section in Step Guidance.

  - id: run-coverage-pass
    title: Run the stage coverage and validation checks
    executor: agent
    role: check
    activation: sequential
    mode: delegated
    uses: [coverage-pass-contract]
    instructions: Run the relevant coverage, validation, and closeout checks for the stage and record a verdict and reason for each coverage surface.

  - id: validate-playbook-coverage
    title: Validate playbook coverage output
    executor: cli
    role: check
    activation: sequential
    mode: deterministic
    requires: [make-docs-cli]
    operation: playbook.validate
    validation:
      expect: exit-zero
    routing:
      on_failure: stop

  - id: closeout-review-gate
    title: Review closeout evidence before commit
    executor: human
    role: gate
    activation: sequential
    mode: delegated
    gate:
      resolved_by: user
      evidence: closeout-verdicts
      unattended: false

  - id: record-handoff
    title: Record the handoff and history evidence
    executor: agent
    role: handoff
    activation: sequential
    mode: delegated
    uses: [history-record-contract]
    instructions: Record the handoff, history, or completion evidence requested by the active workflow so the next stage inherits a clean baseline.

  - id: enforce-commit-convention
    title: Apply the commit message convention
    executor: agent
    role: check
    activation: event-bound
    event: on-pre-commit
    mode: delegated
    uses: [commit-message-convention]
    instructions: Apply the repo commit-message convention to any lifecycle commit, drafting the message for user review when commit authorization is absent.
```

## Step Guidance

The workflow steps above walk one lifecycle pass: identify the stage, read its routed authority, produce the stage artifact, run the coverage and validation checks, clear the closeout review gate, and record the handoff. The stage sections below carry the per-stage purpose, inputs, decision points, suggested assists, exit criteria, and handoff that the `produce-stage-artifact` and `run-coverage-pass` steps follow. Suggested assists are optional.

### Optional Inputs

#### Purpose

Collect source material that can inform lifecycle work without treating that material as a required stage.

#### Inputs

- User requests, design notes, screenshots, transcripts, analysis, or other repo-local artifacts.
- Existing files under `docs/assets/artifacts/`.

#### Decision Points

- Use the input as source evidence.
- Ask for clarification when the input conflicts with repo state.
- Defer the input when it does not affect the current work.

#### Suggested Assists

- `docs/assets/artifacts/`
- `.make-docs/references/system/path-and-link-hygiene.md`

#### Exit Criteria

- Relevant inputs are cited or summarized in the next lifecycle artifact.
- Irrelevant inputs are left out with no extra artifact churn.

#### Handoff

The planning segment inherits the selected source evidence and any explicit constraints.

### Design

#### Purpose

Frame the problem, audience, constraints, and intended direction before detailed planning.

#### Inputs

- Optional input artifacts.
- Existing designs, PRDs, plans, and user direction.
- Current repo structure and conventions.

#### Decision Points

- Create a new design.
- Update an existing design.
- Skip design when the user gives enough implementation direction or when the work is already scoped by a later artifact.

#### Suggested Assists

- `.make-docs/references/system/design-workflow.md`
- `.make-docs/contracts/system/design-contract.md`
- `.make-docs/templates/system/design.md`

#### Exit Criteria

- The design decision, alternatives, consequences, and intended follow-on are clear enough to support planning or a justified direct handoff.

#### Handoff

Planning inherits the design's scope, constraints, risks, and follow-on route.

### Plan

#### Purpose

Turn the selected direction into an executable route, coordinate lineage, and work-shaping strategy.

#### Inputs

- Design or equivalent source direction.
- Existing plan lineage.
- PRD and work backlog state.

#### Decision Points

- Create a new plan.
- Update a plan for an active lineage.
- Continue directly from an existing plan when it already owns the work.

#### Suggested Assists

- `.make-docs/references/system/planning-workflow.md`
- `.make-docs/templates/system/`
- `docs/plans/`

#### Exit Criteria

- The plan names the route, scope, dependencies, validation expectations, and downstream artifact shape.

#### Handoff

PRD generation or update inherits the route, coordinate lineage, and planned deliverables.

### PRD

#### Purpose

Define the current product or documentation contract that the work backlog should implement. `docs/prd/` describes the current authoritative shape of the product and never the editorial operation used to change that authority.

#### Inputs

- Plan output.
- Existing active PRDs.
- Risk register, open questions, and confirmed drift.

#### Decision Points

- Update an existing PRD surgically when its subject owns the changed requirement.
- Create a new PRD only for a coherent, wholesale new capability, subsystem, or product boundary with no suitable owner.
- Add a standardized, non-normative requirement-history entry after updating the current normative requirement when a material prior contract should remain visible.
- Update navigation only when current authority is sufficient but discoverability needs a pointer.
- Record no-PRD rationale when the active set already covers the decision.
- Keep implementation sequencing, migration, reconciliation, and editorial change language in plans, work backlogs, and history records rather than standalone PRDs.

#### Suggested Assists

- `.make-docs/references/system/execution-workflow.md`
- `.make-docs/contracts/system/output-contract.md`
- `.make-docs/references/system/prd-change-management.md`
- `docs/prd/03-open-questions-and-risk-register.md`

#### Exit Criteria

- Current normative requirements are inline in their owning PRDs, any new PRD represents a coherent product authority, history is explicitly non-normative, risks and decisions are current, and `make-docs run prd authority validate --target-root <project>` exits zero before the work backlog consumes the set; invalid or escaping documentation roots block handoff.

#### Handoff

The work backlog inherits the current normative PRD contract and any risk-register decisions. It may use the maintenance plan for sequencing and history for provenance, but neither overrides the current PRD body.

### Work Backlog

#### Purpose

Convert the effective PRD and plan into phase-sized implementation work.

#### Inputs

- PRD contract and risk-register state.
- Plan route and coordinate lineage.
- Existing work backlog files.

#### Decision Points

- Create a new work backlog.
- Update an existing backlog.
- Continue phase work from the active backlog.

#### Suggested Assists

- `docs/work/`
- `.make-docs/templates/system/`
- `.make-docs/references/system/execution-workflow.md`

#### Exit Criteria

- The backlog has phase files with checkbox tasks, acceptance criteria, dependencies, scope hints, and validation expectations.

#### Handoff

Implementation inherits the active phase file as the authority for what to do next.

### Implement

#### Purpose

Make the changes described by the active phase while staying within its scope and the repo's conventions.

#### Inputs

- Active work phase.
- Current code, docs, and generated state.
- User direction since the phase was planned.

#### Decision Points

- Implement serially.
- Split disjoint work when independent ownership is clear.
- Pause only for a real blocker or risky ambiguity.

#### Suggested Assists

- Repo-local validation commands

#### Exit Criteria

- Phase tasks are complete or explicitly deferred.
- Relevant automated tests or focused checks have run.
- The diff matches the phase scope.

#### Handoff

The coverage-pass band inherits the completed diff, validation evidence, and any explicit deferrals.

### Coverage-Pass Band

#### Purpose

Close the phase across documentation, history, PRD, guide/playbook coverage, validation, and UAT or manual-test decisions.

#### Inputs

- Completed phase diff.
- Active phase checklist and acceptance criteria.
- Existing guides, playbooks, history records, and PRD state.

#### Decision Points

- Create, update, link-only, or record no guide/playbook coverage.
- Create or update a history record.
- Update PRD or risk-register state, or record a no-change rationale.
- Run, defer, or mark UAT/manual testing not applicable.

#### Suggested Assists

- [coverage-pass-contract.md](../../../../.make-docs/contracts/system/coverage-pass-contract.md)

#### Exit Criteria

- Each coverage surface has a verdict and reason.
- History and PRD reconciliation are complete.
- Validation evidence is recorded.

#### Handoff

Commit and phase gate inherit the closeout evidence and final phase state.

### Commit And Phase Gate

#### Purpose

Create a local commit for the completed phase and verify the phase can hand off to the next phase.

#### Inputs

- Closed phase diff.
- Matching history record.
- Local commit-message convention.
- Checkpoint state.

#### Decision Points

- Commit the phase locally when authorized.
- Draft only when commit authorization is absent.
- Skip push unless explicitly requested.

#### Suggested Assists

- `.make-docs/contracts/system/commit-message-convention.md`
- `phase_gate.py`
- `checkpoint.py`

#### Exit Criteria

- The commit contains only the intended change set.
- The phase gate has no blockers.
- Push status is explicit.

#### Handoff

The next phase inherits a clean committed baseline and any remaining generated checkpoint state.

### Release / Publish

#### Purpose

Make completed work available to its intended audience.

#### Inputs

- Completed wave or release candidate.
- Release notes, packaging state, deployment instructions, or handoff material.
- Validation evidence.

#### Decision Points

- Deploy code.
- Publish docs.
- Push to source control.
- Hand off a report.
- Defer release when the audience or release vehicle is not ready.

#### Suggested Assists

- Repo-local release references
- Packaging or deployment validation commands

#### Exit Criteria

- The intended audience can access the work through the chosen release path.
- Any deferred release step has an owner and reason.

#### Handoff

Archival inherits the released state, release evidence, and deferred follow-ups.

### Archival

#### Purpose

Move superseded planning or documentation material out of the active set while preserving useful history.

#### Inputs

- Released or superseded docs.
- Active PRD, plan, guide, and history state.
- Link and path hygiene expectations.

#### Decision Points

- Archive outdated material.
- Keep active material in place.
- Repair links or references exposed by the archive move.

#### Suggested Assists

- `archive-docs`
- `docs/assets/archive/`
- `.make-docs/references/system/path-and-link-hygiene.md`

#### Exit Criteria

- Active docs point to current material.
- Archived docs remain discoverable as history.
- Link hygiene is preserved or documented as baseline debt.

#### Handoff

Retrospective inherits the final active/archive state and any lessons from the release or archive pass.

### Retrospective

#### Purpose

Capture what changed, what worked, what should change next, and which follow-up work deserves a new lifecycle pass.

#### Inputs

- Release or handoff results.
- History records.
- Validation and UAT outcomes.
- Deferred questions, risks, and follow-ups.

#### Decision Points

- Record lessons only.
- Open follow-up planning.
- Update process guidance when repeated friction is clear.

#### Suggested Assists

- `retro`
- `docs/assets/archive/history/`
- `docs/prd/03-open-questions-and-risk-register.md`

#### Exit Criteria

- Lessons and follow-ups are captured at the right level of detail.
- New work is routed into the lifecycle rather than hidden in prose.

#### Handoff

The next lifecycle pass inherits any explicit follow-up, risk, or process change.

## Gates

Every stage section in Step Guidance carries its own decision points, and stage departures are themselves decisions: surface a skip, reorder, or revisit and record the reason in the relevant artifact. The `closeout-review-gate` step is the one hard gate in the linear walk: the user resolves it against the recorded closeout verdicts, and unattended continuation past it is not allowed. Commit, push, and release remain user decisions; the workflow never assumes commit or push authorization.

## Outputs

Each pass through the workflow leaves the stage artifact it produced, the recorded coverage verdicts, and the handoff evidence for the next stage. The per-stage Handoff notes in Step Guidance describe what the next stage inherits; history and breadcrumb records land under `docs/assets/archive/history/` when the active workflow requests them.

## Validation

The playbook is complete when the current lifecycle stage has a clear output, handoff, or documented reason for stopping, and the relevant validators or coverage decisions have been recorded. The `validate-playbook-coverage` step runs the deterministic `playbook.validate` operation so any playbook coverage output from the stage stays contract-clean. At the PRD stage, the read-only `make-docs run prd authority validate --target-root <project>` operation must pass before handoff to work.

## Packaging Notes

This playbook is a shipped Make Docs default: it is authored upstream in the template source of truth, dogfooded into consuming repos by install and sync, and packaged for harness surfaces by the packaging compiler. Packaged copies must stay aligned with the template source; this document declares no packaging hints and leaves materialization decisions to the packaging lineage.
