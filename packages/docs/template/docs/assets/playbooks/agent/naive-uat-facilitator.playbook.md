---
title: "Naive UAT Facilitator Playbook"
kind: "playbook"
persona: "agent"
status: "accepted"
stack: "build"
summary: "Guide a facilitator through setup, isolation, anti-coaching, evidence capture, and finding routing for a naive-UAT run."
schema: "make-docs.playbook.v2"
workflowSchema: "make-docs.workflow.v1"
---

# Naive UAT Facilitator Playbook

This shipped Playbook is a temporary compatibility seam while Make Docs still materializes Playbook assets. Treat it as contract-driven guidance, not as approval to expand the legacy Playbook runtime.

## Purpose

Use this playbook when you are facilitating a naive end-user acceptance run. It explains how to verify tester qualification, prepare the installed-product environment, enforce anti-coaching, capture evidence, classify the outcome, and route findings or valid future-trigger `none` decisions back into product authority.

## When To Use

Use this playbook when a `NUAT-###` scenario is active or when a phase-close testing/UAT pass determines that a genuinely user-observable slice requires naive UAT. Do not use it as a substitute for conformance, automated tests, accessibility-only review, or architecture approval.

## Inputs

Use authority in this order:

1. The canonical `NUAT-###` scenario in the owning PRD plus the linked `O-###` when future work remains owed.
2. `.make-docs/contracts/system/naive-uat-contract.md` and `.make-docs/contracts/system/deferred-obligation-contract.md`.
3. The installed product build, supported-scope claim, and public resources allowed for the tester.
4. Repo-local lifecycle, coverage, history, and PRD-maintenance authority needed to route the result.

## Dependencies

```playbook
dependencies:
  - id: naive-uat-contract
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/naive-uat-contract.md
    used_by: [verify-scenario, prepare-run, observe-run, route-result]
    fallback: stop until the governing naive-UAT contract is available
  - id: deferred-obligation-contract
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/deferred-obligation-contract.md
    used_by: [route-result]
    fallback: stop before routing any future-trigger `none` or deferred finding
  - id: coverage-pass-contract
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/coverage-pass-contract.md
    used_by: [route-result]
    fallback: record a manual routing note for follow-up review
  - id: history-record-contract
    kind: reference
    requirement: optional
    source: .make-docs/contracts/system/history-record-contract.md
    used_by: [route-result]
    fallback: summarize the durable delta in the final closeout response
```

## Workflow

```playbook
workflow:
  id: naive-uat-facilitator
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: verify-scenario
    title: Verify the scenario and activation state
    executor: agent
    role: check
    activation: sequential
    mode: delegated
    requires: [naive-uat-contract]
    instructions: Confirm that a real user-observable slice is active, that the canonical `NUAT-###` exists or a valid future-trigger `none` route is in scope, and that the claimed support scope is explicit.

  - id: prepare-run
    title: Prepare tester isolation and environment
    executor: agent
    role: activity
    activation: sequential
    mode: delegated
    requires: [naive-uat-contract]
    instructions: Verify tester qualification, prepare a clean or characterized installed-product environment, confirm consent and capture boundaries, and keep operator-only success criteria out of the tester packet.

  - id: observe-run
    title: Observe without coaching
    executor: agent
    role: activity
    activation: sequential
    mode: delegated
    requires: [naive-uat-contract]
    instructions: Let the tester attempt the goal using only allowed public resources, log any intervention, and capture completion, confusion, accessibility observations, and recovery without compensating for discoverability defects.

  - id: route-result
    title: Route the outcome, findings, and follow-up
    executor: agent
    role: handoff
    activation: sequential
    mode: delegated
    requires: [naive-uat-contract, deferred-obligation-contract, coverage-pass-contract]
    uses: [history-record-contract]
    instructions: Record the outcome as pass, fail, revise, or blocked; update findings and evidence refs; preserve separate testing-mode verdicts; and route any future owed work through the linked `O-###` or current register path.
```

## Step Guidance

- Verify that the tester packet includes only the realistic situation, visible starting state, allowed public resources, genuine constraints, consent notice, and tester-owned teardown steps.
- Never reveal internal terms, hidden navigation, preferred answers, requirement IDs, work coordinates, or operator-only success outcomes.
- Safety intervention is always allowed, but every intervention must be recorded and cannot be counted as naive success.
- A crash-free attempt can still be `revise` when the tester is materially confused.
- `blocked` means a valid attempt did not occur; it does not become `none` after activation.

## Gates

Stop before execution if the scenario is not authoritative, the tester is not actually naive, the environment is not a meaningful installed-product boundary, or the facilitator cannot preserve anti-coaching. Stop after execution if the result lacks enough routing to support the phase gate.

## Outputs

The output is a routed naive-UAT result: scenario reference, tester-qualification evidence, environment, interventions, outcome, findings, evidence refs, separate testing-mode verdicts, any linked `O-###` disposition, and explicit phase versus capability status.

## Validation

This playbook is complete when the run is either validly executed or honestly blocked, the result is routed through the canonical scenario and obligation authority, and no hidden coaching or missing evidence is left unrecorded.

## Packaging Notes

This document exists as a shipped default only while Make Docs still distributes Playbook-form guidance. Use it as a compatibility seam and keep any later Protocol migration routed through the active plan authority rather than expanding Playbook runtime behavior.
