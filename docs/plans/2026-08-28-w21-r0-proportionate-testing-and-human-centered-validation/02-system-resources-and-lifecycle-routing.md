---
title: "W21 R0 Phase 2 System Resources and Lifecycle Routing"
kind: "plan"
status: "draft"
coordinate: "W21 R0 P2"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md"
---

# W21 R0 Phase 2: System Resources and Lifecycle Routing

## Purpose

Make the accepted testing model easy for agents to find and apply through normal Make Docs resources.

## Sources

- [Plan overview](00-overview.md)
- [Governing testing design](../../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- Accepted PRD 50 and related owner PRDs

## Preconditions

- The W21 R0 PRD set is accepted.
- Resource names and stable URI decisions are recorded.
- The upstream-first template contract is active.
- W20 R0 remains paused.

## Common Resource Set

Author upstream resources under `packages/docs/template/` first.

The minimum set is:

- one product-wide testing contract for normative shared rules;
- one testing reference for selection questions, examples, and result interpretation;
- template guidance for the compact body record;
- prompt guidance for design, plan, implementation preflight, phase close, and human testing requests; and
- concise router pointers that send agents to the shared and specialized owners.

The first release must not require a Skill or a new CLI command.

## Lifecycle Routing

Update lifecycle and coverage resources so an agent:

1. identifies the current decision;
2. selects only the testing types that can change it;
3. records the smallest useful scope;
4. assigns the correct executor;
5. states the gate effect;
6. sets an effort budget and stop condition;
7. reuses valid evidence; and
8. records a rerun trigger.

A phase number, user-visible slice, or candidate list does not activate all four types.

## Document and Handoff Shape

Keep the common record in Markdown bodies. Reuse existing metadata and links where possible.

Handoffs must preserve:

- the decision informed;
- the selected or skipped testing types;
- the gate effect;
- valid evidence references;
- any accepted future obligation; and
- the rerun trigger.

Do not add frontmatter fields in the first release.

## Router Design

Managed agent instructions should contain a short universal rule and pointers.

They should not copy the whole contract. They should not imply that tests are mandatory because a resource exists. They should route performance details to PRD 48 resources, unassisted-human details to PRD 46 resources, and built-result experience rules to PRD 49 resources.

## Dogfood Order

1. author and validate upstream resources;
2. update package manifests and generated-asset expectations;
3. materialize the accepted upstream set into the repo's installed instance;
4. verify that managed blocks preserve user content;
5. compare upstream and dogfood resources; and
6. test a clean installed project.

## Acceptance

- An agent can find the common testing rule from normal routers.
- The common decision record is body-based.
- Templates permit `not-needed-now` without invented work.
- Lifecycle guidance does not make advisory tests into gates.
- Upstream resources and dogfood copies agree.
- A clean installed project receives the accepted testing resources.

## Handoff

Phase 3 and Phase 4 can proceed after the common resource and routing shape is stable.
