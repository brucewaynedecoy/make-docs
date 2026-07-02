---
kind: playbook
title: "Demo Playbook"
summary: "A demo playbook exercising the fixture suite."
persona: agent
stack: run
status: accepted
schemaVersion: make-docs.playbook.v1
workflowSchemaVersion: make-docs.workflow.v1
---

# Demo Playbook

## Purpose

Explains the demo.

## When To Use

Use in fixture tests.

## Inputs And Authority

Repository contracts.

## Dependencies

| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| tooling | cli | required | package install | check-tools | stop with install guidance |
| conventions | reference | preferred | .make-docs/contracts/system | review-gate | continue with reduced guidance |

## Workflow Contract

```playbook
workflow:
  id: demo
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: check-tools
    title: Check tooling
    executor: cli
    role: check
    activation: event-bound
    event: on-flying-pigs
    mode: deterministic
    requires: [tooling]
    operation: playbook.catalog
    validation:
      expect: exit-zero
    routing:
      on_failure: stop
  - id: review-gate
    title: Review before wrap-up
    executor: human
    role: gate
    activation: sequential
    uses: [conventions]
    gate:
      resolved_by: user
      evidence: review-note
      unattended: false
    routing:
      on_success: wrap-up
  - id: wrap-up
    title: Wrap up
    executor: agent
    role: activity
    activation: sequential
    instructions: Summarize the run.
```

## Step Guidance

Follow the steps in order.

## Gates And Decisions

The review gate stops unattended runs.

## Outputs And Handoff

A run summary.

## Validation

The catalog check must exit zero.

## Packaging Notes

No packaging hints.
