---
title: "W20 R0 Phase 5 Delivery Conformance and Delta Handoff"
kind: "plan"
status: "draft"
coordinate: "W20 R0 P5"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md"
---

# W20 R0 Phase 5: Delivery, Conformance, and Delta Handoff

## Purpose

Prove that the enhancement reaches real agents and installed projects and changes a real human outcome.

The phase must not close with document parity alone. It must show that supported agents can apply the standard and that at least one human-facing product path improves in a way that the stated evidence can reveal.

## Sources

- [Plan overview](00-overview.md)
- [Phase 2](02-contract-reference-and-design-entry.md)
- [Phase 3](03-lifecycle-propagation-and-routing.md)
- [Phase 4](04-evidence-review-and-acceptance.md)
- Approved PRDs 06, 14, 15, 23, 45, 46, 47, 49, and 50

## Preconditions

- Upstream resources and consumers are review-ready.
- Structural and propagation fixtures pass.
- The required Human Experience Review lens and the four-type testing boundaries are current authority.
- Package and dogfood operations have separate implementation authority.

## Package And Dogfood Proof

Validate the accepted source order:

1. reviewed upstream resources exist in `packages/docs/template/`;
2. rules, catalog, resource discovery, validation, and manifest expectations include the new resources;
3. the CLI package projection contains the reviewed files;
4. affected repository dogfood resources match reviewed upstream authority;
5. a packed package installs the intended resources in a clean project;
6. an update preserves modified project-owned content and applies managed changes safely;
7. stable URIs resolve through supported resource operations while offline behavior remains correct.

Do not treat the root dogfood copy as upstream source.

## Structural Validation Matrix

Run or extend focused checks for:

- contract and template agreement;
- required heading position;
- direct, indirect, and none conditional fields;
- invalid, missing, duplicate, and unresolved content;
- prospective historical compatibility;
- internal links and stable URIs;
- catalog, rules, tool-directory, and manifest parity;
- package projection and dogfood parity;
- modified router preservation;
- no unexpected resource type or mandatory local projection.

Use affected-first proof. Run focused checks during implementation and one expanded integration pass because the change crosses templates, routers, package projection, and installed projects. Do not run release-grade testing without separate product or release authority.

Expected repository checks include the current equivalents of:

- `npm run validate:defaults`;
- focused CLI and template tests;
- package smoke installation;
- path hygiene;
- Markdown link validation;
- `git diff --check`.

The backlog must name exact commands after implementation preflight confirms the current scripts.

## Agent Conformance

Test supported harnesses against the installed resource surface.

Each supported harness must produce and explain:

- one direct-impact design with a coherent goal, observable promises, hidden complexity, and evidence;
- one indirect-impact design with a real human effect;
- one valid none design with preserved experience and boundary proof;
- one misleading agent-facing or headless case where a human effect still exists;
- one case where the agent stops for a missing product choice instead of exposing the internal model by default.

Deterministic checks judge structure. Human review judges whether the interpretation is coherent.

## Real Human Outcome Proof

Use at least one realistic installed-product flow.

The flow must show that the standard changes the human result, not only the documents. The selected path should contain meaningful relationships, state, or internal detail so the test can reveal the original failure mode.

Evidence must record:

- the intended human and goal;
- the public or installed starting point;
- the prior failure or risk;
- the experience promises under test;
- the visible result;
- orientation, continuity, meaning, information amount, next action, recovery, and control findings where applicable;
- the Automated Implementation Testing decision and outcome;
- the required Human Experience Review conclusion against each applicable promise;
- the optional Guided Progress Review result;
- the Unassisted Goal Testing decision and result when one bounded scenario activates;
- specialist evidence only when its current authority applies; and
- remediation, accepted caveat, or valid obligation links for material findings.

The test must not use the agent that built the result as the only judge.

## Prospective Adoption Proof

Test:

- a new project after activation;
- an existing project with historical designs;
- a substantial design update;
- a project with modified user-owned router text;
- a valid no-human-impact change;
- a direct or indirect change that activates full intent.

Historical documents must remain readable. The system must not force repository-wide rewriting.

## Finite Closeout Rules

Close the phase only when:

- every accepted PRD requirement has implementation or an explicit disposition;
- every testing type has an explicit current decision, including valid `not-needed-now` where no evidence can change a current decision;
- required Human Experience Review conclusions cover every applicable promise;
- no material finding lacks a completed remediation, accepted bounded caveat, or valid obligation for an accepted future outcome;
- package, dogfood, installed-project, and stable-URI proof agree;
- supported agent conformance has no unexplained failure;
- the real human outcome proof is complete;
- release claims remain bounded to the evidence.

Do not rerun unchanged checks without a new failure signal, changed implementation, or an expiring evidence rule.

## Delta Backlog Contract

After PRD approval and separate backlog authority, create:

`docs/work/2026-08-28-w20-r0-human-experience-standard-and-intent/`

The backlog must:

- use the five phases in this plan;
- cite current PRD 49 and every applicable owner PRD;
- assign ordinal task IDs across each phase;
- include source, implementation, review, validation, and closeout tasks;
- keep upstream and dogfood writes in the required order;
- include a real human outcome task, not only fixture work;
- require Human Experience Review without creating a fifth testing type or duplicate test run;
- keep Guided Progress Review optional and Unassisted Goal Testing conditional;
- route accepted deferrals through durable obligations;
- preserve the original context in each phase overview and acceptance block.

## Closeout Package

The eventual W20 R0 closeout must include:

- approved current PRDs;
- completed delta backlog state;
- structural and propagation validation results;
- package and installed-project evidence;
- supported harness conformance evidence;
- Human Experience Review conclusions against applicable promises;
- the optional Guided Progress Review result;
- the conditional Unassisted Goal Testing decision and any applicable result;
- material findings and their final disposition;
- one history record that preserves the implementation outcome and source lineage.

## Acceptance

- The package contains the new contract and reference.
- Stable URIs resolve in a clean installed project.
- Dogfood agrees with reviewed upstream authority.
- Modified user content survives update.
- Supported agents handle direct, indirect, none, and misleading cases.
- A realistic human path shows a material and observable result.
- Technical success cannot hide an unresolved human finding.
- No release claim exceeds tested paths and evidence.
- The next backlog is a scoped W20 R0 delta.

## Handoff

When the PRDs are approved, use `.make-docs/system/prompts/prd-change-to-work.prompt.md` to create the W20 R0 delta backlog. Do not start implementation until the owner accepts that backlog and gives separate execution authority.
