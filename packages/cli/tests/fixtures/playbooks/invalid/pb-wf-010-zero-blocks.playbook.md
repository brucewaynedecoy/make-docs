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

The workflow is described in prose only.

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
