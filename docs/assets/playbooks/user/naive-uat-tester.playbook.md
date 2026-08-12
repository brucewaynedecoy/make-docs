---
title: "Naive UAT Tester Playbook"
kind: "playbook"
persona: "user"
status: "accepted"
stack: "build"
summary: "Guide a qualified tester through a black-box naive-UAT attempt using only public product information."
schema: "make-docs.playbook.v2"
workflowSchema: "make-docs.workflow.v1"
---

# Naive UAT Tester Playbook

This shipped Playbook is a temporary compatibility seam while Make Docs still materializes Playbook assets. Treat it as contract-driven guidance, not as approval to expand the legacy Playbook runtime.

## Purpose

Use this playbook when you are the qualified tester for a naive end-user acceptance run. It explains how to attempt the goal honestly, use only allowed public help, avoid hidden implementation context, and report what happened without coaching.

## When To Use

Use this playbook when a facilitator or project authority has activated a `NUAT-###` scenario for a genuinely user-observable installed-product goal. Do not use it for knowledgeable manual testing, architecture review, accessibility-only evaluation, conformance, or automated regression work.

## Inputs

Use authority in this order:

1. The tester packet rendered from the canonical `NUAT-###` scenario.
2. The installed product and ordinary environment a real user can obtain.
3. Allowed public resources explicitly listed in the tester packet.
4. Facilitator safety instructions only when they are genuine constraints rather than hidden success-path guidance.

Do not use source code, PRDs, plans, private conversations, implementation history, hidden setup notes, or internal terminology.

## Dependencies

```playbook
dependencies:
  - id: naive-uat-contract
    kind: reference
    requirement: required
    source: .make-docs/contracts/system/naive-uat-contract.md
    used_by: [confirm-qualification, attempt-goal, record-observations]
    fallback: stop and ask the facilitator for the governing naive-UAT contract
  - id: scenario-packet
    kind: reference
    requirement: required
    source: canonical tester packet rendered from the owning PRD's `NUAT-###` scenario
    used_by: [confirm-qualification, review-goal, attempt-goal]
    fallback: stop until a valid tester packet exists
  - id: public-help
    kind: reference
    requirement: conditional
    source: user-facing help, installation docs, or task guidance explicitly allowed by the tester packet
    used_by: [attempt-goal]
    fallback: continue without extra help and record that no public help was used
```

## Workflow

```playbook
workflow:
  id: naive-uat-tester
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: confirm-qualification
    title: Confirm tester qualification and boundaries
    executor: human
    role: decision
    activation: sequential
    mode: manual
    requires: [naive-uat-contract, scenario-packet]
    instructions: Confirm you do not have private implementation context for the slice under test and that you will use only the installed product plus the allowed public resources.

  - id: review-goal
    title: Review the tester-visible situation and goal
    executor: human
    role: activity
    activation: sequential
    mode: manual
    requires: [scenario-packet]
    instructions: Read only the tester-visible packet, understand the visible starting state and goal, and ask the facilitator to restart only if the packet itself leaks hidden steps or answers.

  - id: attempt-goal
    title: Attempt the goal as a real user would
    executor: human
    role: activity
    activation: sequential
    mode: manual
    uses: [public-help]
    requires: [naive-uat-contract, scenario-packet]
    instructions: Attempt the goal honestly, use only allowed public help, and never ask for hidden-path coaching or internal explanations.

  - id: record-observations
    title: Report outcome and observations
    executor: human
    role: handoff
    activation: sequential
    mode: manual
    requires: [naive-uat-contract]
    instructions: Report completion, confusion, hesitation, recovery, accessibility observations, misleading cues, and any facilitator intervention accurately even when the attempt was unsuccessful.
```

## Step Guidance

- If you realize you know a hidden answer or implementation detail, disclose it immediately so the run can be invalidated or reassigned.
- If public help is genuinely allowed, use only the exact public resources a real user could have found.
- If the product feels confusing but eventually works, report that confusion; naive UAT can still produce `revise` after eventual completion.
- If the facilitator intervenes for safety or setup, report what changed and whether it revealed the route.

## Gates

Stop the run if the tester packet leaks hidden steps, if you discover you are not actually naive, or if continuing would create harm, privacy exposure, unauthorized effects, or unexpected spending.

## Outputs

The output is an honest tester-side account of the attempt: what goal you tried, whether you completed it, what public resources you used, where you were confused, what barriers or accessibility issues you observed, and whether any intervention occurred.

## Validation

This playbook is complete when the tester attempted or honestly could not attempt the goal within the allowed boundary and reported the outcome without hidden-answer coaching.

## Packaging Notes

This document exists as a shipped default only while Make Docs still distributes Playbook-form guidance. Use it as a compatibility seam and keep any later Protocol migration routed through the active plan authority rather than expanding Playbook runtime behavior.
