---
title: "Conformance Skill Probe"
kind: "playbook"
persona: "agent"
status: "accepted"
stack: "run"
summary: "Minimal probe workflow packaged by the W18 R9 conformance scenarios to prove harness discovery and invocation of a generated distributable."
schema: "make-docs.playbook.v2"
workflowSchema: "make-docs.workflow.v1"
---

# Conformance Skill Probe

This fixture is maintainer-only conformance input (W18 R9 P2, PRD 37 R-SCEN-1). It is deliberately tiny: the scenarios copy it into a disposable fixture workspace, package it, and then assert that the real harness discovers and can invoke the result. It is never shipped and proves nothing by existing — only a recorded scenario run does.

## Purpose

Give the packaging conformance scenarios a v2-form source Playbook whose invocation is unambiguous: when a harness actually runs the packaged skill, the probe marker `MAKE-DOCS-CONFORMANCE-SKILL-PROBE-OK` appears in the thread, so the scenario's invoke assertion greps for evidence instead of judging vibes.

## When To Use

Only inside a W18 R9 conformance scenario run, in a disposable fixture workspace. Never install this Playbook into a real project; it carries no product value.

## Inputs

Authority order for a probe run: explicit scenario spec direction first, then this document, then nothing else — the probe consumes no repo state, no user artifacts, and no archived history.

## Dependencies

```playbook
dependencies:
  - id: scenario-spec
    kind: reference
    requirement: required
    source: the invoking scenario spec under docs/assets/conformance/scenarios/
    used_by: [emit-probe-marker]
    fallback: stop; a probe run outside a conformance scenario proves nothing
```

## Workflow

```playbook
workflow:
  id: conformance-skill-probe
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: emit-probe-marker
    title: Emit the conformance probe marker
    executor: agent
    role: activity
    activation: sequential
    mode: delegated
    uses: [scenario-spec]
    instructions: Reply with exactly the line MAKE-DOCS-CONFORMANCE-SKILL-PROBE-OK followed by one sentence naming the harness and thread you are running in.

  - id: confirm-fresh-thread
    title: Confirm the invocation context
    executor: agent
    role: check
    activation: sequential
    mode: delegated
    instructions: State whether this invocation happened in a fresh thread started after the package was installed, so the scenario can attribute discovery to the installed distributable rather than session residue.
```

## Step Guidance

The probe has two observable behaviors. `emit-probe-marker` produces the exact marker line the scenario's invoke assertion matches. `confirm-fresh-thread` makes the new-thread requirement of the plugin scenario checkable from the transcript itself.

## Gates

None. The probe must run unattended inside a scenario: any gate would block the invoke assertion on a human and confound the evidence.

## Outputs

A transcript containing the probe marker and the invocation-context statement. The scenario's result record inherits both as invoke-stage evidence; nothing is written to disk.

## Validation

The fixture is valid when `playbook.validate` reports zero errors and the packaged skill, once invoked by the target harness, produces the probe marker verbatim.

## Packaging Notes

Packaged only by conformance scenarios, into disposable fixture workspaces, via the `plan`/`preview`/`write`/`ship` grammar. This fixture must stay out of the shipped template, the packaged copy, and npm tarballs with the rest of `docs/assets/conformance/` (R-KEEP-1, R-TEST-3).
