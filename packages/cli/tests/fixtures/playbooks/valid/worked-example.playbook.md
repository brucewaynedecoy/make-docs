---
kind: playbook
title: "Make Docs Lifecycle"
summary: "Standalone fixture equivalent of the contract's canonical worked example."
persona: agent
stack: run
status: accepted
schema: "make-docs.playbook.v2"
workflowSchema: make-docs.workflow.v1
---

# Make Docs Lifecycle

## Purpose

Exercises the contract's canonical worked example as a standalone fixture.

## When To Use

Whenever the parser must prove R-WF-7 conformance from a fixture file.

## Inputs

The Playbook contract is the authority.

## Dependencies

```playbook
dependencies:
  - id: make-docs-cli
    kind: cli
    requirement: required
    probe: make-docs
    source: package install of the make-docs CLI
    used_by: [validate-catalog, enforce-commit-convention]
    fallback: stop with install guidance
```

## Workflow

```playbook
workflow:
  id: make-docs-lifecycle
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: validate-catalog
    title: Validate the Playbook catalog
    executor: cli
    role: check
    activation: sequential
    mode: deterministic
    requires: [make-docs-cli]
    operation: playbook.catalog
    validation:
      expect: exit-zero
    routing:
      on_failure: stop

  - id: review-gate
    title: Human review before packaging
    executor: human
    role: gate
    activation: sequential
    mode: delegated
    gate:
      resolved_by: user
      evidence: review-note
      unattended: false

  - id: enforce-commit-convention
    title: Enforce commit message convention
    executor: cli
    role: check
    activation: event-bound
    event: on-pre-commit
    mode: deterministic
    requires: [make-docs-cli]
    operation: commit.validate-message
```

## Step Guidance

Follow the workflow contract.

## Gates

The review gate requires user resolution.

## Outputs

A validated catalog.

## Validation

Zero parse or validation diagnostics.

## Packaging Notes

None.
