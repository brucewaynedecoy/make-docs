# Make Docs Lifecycle Foundation

> Consolidates the lifecycle layer built on the coverage-pass contract: the
> lifecycle arc, the always-read anchor, the persona-scoped playbook output
> type, the stage follow-on handoffs, and the optional artifacts seed. It
> supersedes the Sense-A framing in
> [2026-05-28-make-docs-lifecycle-playbook.md](./2026-05-28-make-docs-lifecycle-playbook.md).
> The matching implementation plan is the W16 R0 plan, already drafted.

## Purpose

Define make-docs's full documentation lifecycle as a navigable *map* and the
authoritative-plus-narrative layer that nudges agents through it without
becoming prescriptive. The arc must serve software and non-software work alike
and must preserve the flexibility north star: no required sequence, no
painted-in corners.

## Context

make-docs already covers a narrow slice of the lifecycle well —
design -> plan -> PRD -> work backlog generation, phase execution, and
closeout — through repo-local contracts, templates, and skills. Two gaps
motivate this design:

- **No authoritative ordering.** Routers encode *where* artifacts live, not
  the *order* stages run; the sequence is stated only in optional starter
  prompts marked non-authoritative, so an agent can land on a plan and jump
  straight to implementing (risk register D-012).
- **Uncovered surrounding stages.** Ideation and architecture on the front end
  and release, archival, and retrospective on the back end have little or no
  coverage.

Forces: make-docs must not paint users into corners; repo structure (paths,
frontmatter, skill and contract names) is the contract automation is built
against; stage vocabulary must stay domain-neutral; and the coverage-pass
contract is the prerequisite mechanism that makes new stages cheap to add.

## Decision

1. **Adopt the lifecycle arc** as bands, not a flat list: optional
   `docs/artifacts/` inputs; Segment 1 — Plan (Design -> Plan -> PRD -> Work
   backlog, linear and gated); Segment 2 — Build (Implement -> cross-cutting
   coverage-pass band -> Commit, looped per phase); Segment 3 — Release &
   beyond (Release/publish -> Archival -> Retrospective). The coverage-pass
   band and the persona lens are cross-cutting.
2. **Use the coverage-pass contract as the cross-cutting mechanism** for
   documentation reconciliation across surfaces (guide/playbook, history, PRD,
   testing/UAT), with the verdict axis separate from the persona-target axis.
3. **Add an always-read lifecycle anchor** stating the arc, the default
   ordering ("implementation derives from a work backlog"), and the straddle
   rule: default to the arc, allow skip/reorder/revisit, and surface any
   departure rather than taking it silently — never a hard "never skip" gate.
4. **Treat a playbook as a persona-scoped procedural output type** (not a
   single operating manual); make-docs's own lifecycle playbook is the
   dogfooded build-stack instance, citing the anchor.
5. **Add stage follow-on handoffs** to plans, PRDs, and work backlogs —
   advisable-default-but-overridable, never a gate.
6. **Sanction an optional `docs/artifacts/` seed** as the home for free-form
   pre-design inputs, so ideation and architecture are accommodated as an input
   surface, not contract-bound stages.
7. **Keep all stage vocabulary domain-neutral** ("release / publish" = make the
   work available to its audience), so make-docs serves non-software work.

## Alternatives Considered

**A single operating manual (Sense A).** Rejected: a playbook is a
persona-scoped output type a consuming project authors; make-docs's lifecycle
playbook is one instance of that type, not a special artifact.

**Hard-gated lifecycle enforcement.** Rejected: real workflows skip, reorder,
and revisit; an absolute gate would make make-docs prescriptive — the corner it
exists to avoid.

**Software-specific stage vocabulary (launch/deploy).** Rejected: it steers
agents toward assuming a technical deployment and narrows make-docs's use.

**Per-stage references with no map.** Rejected: it gives no global orientation;
the anchor is the map that makes the references navigable.

## Consequences

- Agents gain a global map plus per-stage forward pointers, so the
  design -> plan -> PRD -> work -> implement chain stops breaking silently.
- Back-end gaps (release, archival, retrospective) become closable cheaply as
  new coverage passes rather than heavyweight stages.
- The arc and contract stay forward-compatible with personas, configuration,
  the restructure, and plugins without implementing them.
- Risks tracked in `docs/prd/03-open-questions-and-risk-register.md`: anchor
  over-gating (R-009), vocabulary bias (R-010), persona-axis forward-reference
  (R-011).

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs:
  [2026-05-28-make-docs-lifecycle-playbook.md](./2026-05-28-make-docs-lifecycle-playbook.md),
  [2026-05-28-coverage-pass-contract-and-skill-evolution.md](./2026-05-28-coverage-pass-contract-and-skill-evolution.md)
- Reason: the playbook concept moved from a single operating manual (Sense A)
  to a persona-scoped output type (Sense B); this design consolidates the
  lifecycle layer built on the coverage-pass contract and supersedes the
  Sense-A framing.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../../../../.make-docs/system/prompts/designs-to-plan.prompt.md)
- Why: this is net-new product surface (the lifecycle layer); the matching plan
  is the W16 R0 plan, already drafted at
  [../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md](../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md).
- Coordinate Handoff: the completed prerequisite is the coverage-pass contract;
  the recommended downstream coordinate is `W16 R0`.
