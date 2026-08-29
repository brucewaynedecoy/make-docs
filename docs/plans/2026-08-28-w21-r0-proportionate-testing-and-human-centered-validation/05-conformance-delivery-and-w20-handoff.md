---
title: "W21 R0 Phase 5 Conformance Delivery and W20 Handoff"
kind: "plan"
status: "draft"
coordinate: "W21 R0 P5"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md"
---

# W21 R0 Phase 5: Conformance, Delivery, and W20 Handoff

## Purpose

Prove that supported agents make better testing decisions, deliver the accepted resources, and prepare a safe review of W20 R0.

## Conformance Scope

Conformance must reveal both failure directions:

- insufficient evidence for a material current decision; and
- excess, early, duplicate, unauthoritative, or needlessly difficult testing.

It must also detect:

- wrong executor selection;
- false gate creation;
- invalid evidence reuse;
- missing stop conditions;
- invented deferred obligations;
- coached unassisted attempts; and
- poor human testing instructions.

## Scenario and Lab Rules

Each scenario should state:

- product maturity and current decision;
- available authority;
- expected testing selection;
- expected skipped types;
- executor boundaries;
- effort budget and stop condition;
- evidence and reuse state;
- gate effect; and
- the failure the scenario must reveal.

Lab sessions must keep agent-run proof, guided owner activity, and qualified unassisted human activity distinct. Human results remain evidence, not manufactured approval.

## Installed-Product Exercise

Run at least one realistic installed-product exercise through the public product path.

The exercise must show that the new testing experience is:

- shorter than the prior technical walkthrough pattern;
- easier to understand;
- focused on a recognizable goal;
- free of duplicate automated assertions;
- honest about effort and gate effect; and
- useful for natural owner feedback.

## Delivery and Dogfood

Validate upstream resources before materialization. Then verify:

- package manifests include the new resources;
- clean installs receive them;
- managed routers point to them;
- dogfood copies match upstream authority;
- user-owned content survives updates; and
- stale naive-UAT language does not remain in active generated paths except where compatibility requires it.

## W20 R0 Review Package

After the owner accepts the testing PRD set, prepare a joint review of the existing W20 R0 plan and backlog.

The review should identify exact items that:

- treat Human Experience Review as a separate test;
- require naive UAT merely because a slice is user-visible;
- make advisory human work a gate;
- duplicate automated assertions;
- ask the owner to run technical setup or internal commands without need;
- create false deferred obligations;
- require performance work without a current maturity-qualified decision; or
- need a Guided Progress Review to make progress visible and enjoyable.

Do not edit W20 R0 until the owner reviews this package. Preserve existing task IDs and completed evidence.

## W21 R0 Backlog Handoff

After PRD acceptance and the W20 review, use `.make-docs/system/prompts/prd-change-to-work.prompt.md` to create a scoped W21 R0 delta backlog.

The backlog must preserve the five phases in this plan. It must cite current PRD authority. It must keep W21 testing implementation distinct from W20 Human Experience implementation while recording real dependencies.

## Acceptance

- Conformance fails for both under-testing and over-testing.
- Supported agents state reason, scope, executor, budget, stop, evidence, and gate in plain language.
- Human testing is shorter and more meaningful in an installed product.
- All shipped resources come from upstream template authority.
- Dogfood and clean-install validation pass.
- The W20 R0 review package is ready for owner discussion.
- No W20 R0 file changes occur without separate owner authority.

## Handoff

Present the accepted PRD set and the W20 R0 impact review to the owner. Stop before backlog revision or implementation unless the owner gives new authority.
