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

| Name | Type |
| --- | --- |
| tooling | cli |

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
    activation: sequential
    mode: deterministic
    operation: playbook.catalog
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
