---
title: "W21 R0 Phase 3 Proportionate Technical Testing"
kind: "plan"
status: "draft"
coordinate: "W21 R0 P3"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md"
---

# W21 R0 Phase 3: Proportionate Technical Testing

## Purpose

Bound automated and performance testing by the current requirement, risk, maturity, and decision value.

## Automated Implementation Testing

Implement the affected-first order:

1. changed behavior;
2. nearest meaningful integration boundary;
3. smallest relevant regression set; and
4. broader proof only after a stated trigger.

Support three levels:

- `focused` is the normal default and needs no interruption;
- `expanded` needs a short reason tied to blast radius or failure cost; and
- `release-grade` needs accepted product or release authority.

The normal stop condition is passing affected proof plus the justified regression boundary. Do not repeat unchanged broad suites for reassurance.

## Performance Testing

Preserve PRD 48 applicability states and evidence contracts.

Add an explicit maturity decision before sophisticated proof:

- `required-now` protects a current accepted outcome or real boundary;
- `characterize-now` supplies a baseline for a current decision on a stable-enough path;
- `defer-required` preserves an accepted future proof with owner and trigger;
- `not-needed` or `not-needed-now` records that current evidence cannot change a decision; and
- `reject-unsupported` blocks an invented or unowned target.

An MVP is not an automatic exemption. It is a strong reason to demand a real current need before production-grade work begins.

## Gate and Evidence Rules

- Automated evidence can block only the correctness claim it covers.
- Performance evidence blocks only an accepted hard outcome or bounded support claim.
- A numeric target is not authority unless the owning current PRD states the protected outcome and the owner accepts it.
- Reuse evidence while scope, implementation, environment, and expiry remain valid.
- Store enough evidence for the decision. Do not retain large raw outputs by default.

## Failure-Revealing Scenarios

Include scenarios where:

- a small local change stops after focused proof;
- a cross-cutting change justifies expanded proof;
- an agent proposes release-grade work without authority;
- an unstable path rejects a copied performance target;
- an MVP feasibility cliff activates bounded proof;
- a passed suite does not justify unrelated support claims; and
- unchanged valid evidence avoids an unnecessary rerun.

## Acceptance

- Agents can act on focused automated testing without owner delay.
- Expanded work always states why it is needed.
- Release-grade work has explicit authority.
- Performance work begins only when evidence can change a current decision.
- Stop conditions are finite and observable.
- Test count is never treated as a quality measure.

## Handoff

Provide scenario and evidence needs to Phase 5 conformance assembly.
