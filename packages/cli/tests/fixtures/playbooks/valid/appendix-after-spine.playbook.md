---
kind: playbook
title: "Demo Playbook"
summary: "A demo playbook exercising the fixture suite."
persona: agent
stack: run
status: accepted
schema: "make-docs.playbook.v2"
workflowSchema: make-docs.workflow.v1
---

# Demo Playbook

## Purpose

Explains the demo.

## When To Use

Use in fixture tests.

## Inputs

Repository contracts.

## Dependencies

```playbook
dependencies:
  - id: tooling
    kind: cli
    requirement: required
    source: package install
    used_by: [check-tools]
    fallback: stop with install guidance
  - id: conventions
    kind: reference
    requirement: preferred
    source: .make-docs/contracts/system
    used_by: [review-gate]
    fallback: continue with reduced guidance
```

## Workflow

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
    activation: sequential
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

## Gates

The review gate stops unattended runs.

## Outputs

A run summary.

## Validation

The catalog check must exit zero.

## Packaging Notes

No packaging hints.

## Appendix

Extra notes after the required spine are ignored.
