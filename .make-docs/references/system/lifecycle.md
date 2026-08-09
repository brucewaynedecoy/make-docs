# Lifecycle Anchor

## Purpose

Use this anchor to orient documentation lifecycle work before choosing the next
workflow step.
It states the default arc and the expected departure behavior without turning
the arc into an absolute gate.

## Lifecycle Arc

The lifecycle is organized as bands.

### Optional Inputs

`docs/assets/artifacts/` may hold source material, notes, screenshots, analysis, or
other inputs that inform later work.
It is an input surface, not a lifecycle stage.
If present, read it to hydrate the design and plan.

### Segment 1 - Plan

The planning segment usually moves in this order:

1. Design
2. Plan
3. PRD
4. Work backlog

This segment establishes the problem, implementation shape, product contract,
and executable work queue.

The PRD stage maintains one current product authority. `docs/prd/` describes the
current authoritative shape of the product and never the editorial operation
used to change that authority. Update an existing owning PRD surgically, create
a new PRD only for a coherent product subject with no owner, or record why no
PRD change is needed. Preserve material prior contracts in non-normative
requirement history; keep maintenance sequencing in plans, work, and history
records.

### Segment 2 - Build

The build segment loops per work phase:

1. Implement, including relevant automated tests.
2. Run the coverage-pass band.
3. Commit and pass the phase gate.

Use [coverage-pass-contract.md](../../contracts/system/coverage-pass-contract.md) for the coverage-pass
band.
The band covers guide and playbook coverage, history, PRD reconciliation,
documentation hygiene, validation, and UAT or manual-test decisions.

### Segment 3 - Release And Beyond

The post-build segment usually moves in this order:

1. Release / publish
2. Archival
3. Retrospective

Release / publish means making work available to its audience.
Examples include deploying code, publishing docs, pushing to source control, or
handing off a report.

## Cross-Cutting Lenses

The coverage-pass band is a repeatable lens used during build closeout.
The persona lens separates developer-facing coverage, user-facing coverage, and
project/history coverage so one audience does not quietly substitute for another.

## Default Ordering

Implementation normally derives from a work backlog.
The work backlog normally derives from a PRD.
The PRD normally derives from a plan, but the plan's maintenance actions do not
become standalone PRDs; downstream work reads the resulting current PRD
authority.
The plan normally derives from a design or another explicit source input.

When the current request is ambiguous, prefer the next step implied by that
chain.
If a work backlog already exists, treat it as the implementation authority for
phase work unless the user directs a different source of truth.

## Straddle Rule

Default to the lifecycle arc, but do not treat it as an absolute skip ban.
Skip, reorder, or revisit stages when the user directs it or when the situation
warrants it.
When departing from the default arc, say so explicitly and record the reason in
the relevant plan, work, history, or closeout artifact.

The failure mode to avoid is silent departure.

## Router Use

Routers should point here for lifecycle orientation instead of restating this
policy.
Read this anchor when selecting the next stage, deciding whether an existing
artifact is sufficient, or noticing that a request skips, reorders, or revisits a
stage.

## Non-Goals

This anchor does not replace the phase backlog, PRD, plan, or stage-specific
contracts.
It does not require creating every artifact for every request.
