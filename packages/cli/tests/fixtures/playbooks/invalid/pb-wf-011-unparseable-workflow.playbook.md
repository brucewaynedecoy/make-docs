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
workflow: [unclosed
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
