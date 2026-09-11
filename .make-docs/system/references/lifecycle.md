# Lifecycle Anchor

## Purpose

Use this anchor to orient documentation lifecycle work before choosing the next
workflow step.
It states the default arc and the expected departure behavior without turning
the arc into an absolute gate.

## Lifecycle Arc

The lifecycle is organized as bands.

### Optional Inputs

`docs/assets/project/` may hold source material, notes, screenshots, analysis, or
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

Use [coverage-pass-contract.md](../contracts/coverage-pass-contract.md) for the coverage-pass
band.
The band covers guide and system-resource coverage, history, PRD reconciliation,
documentation hygiene, validation, deferred-obligation consumption, and UAT or manual-test decisions.

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
The Persona lens separates maintainer-facing coverage, user-facing coverage, and
project/history coverage so one audience does not quietly substitute for another.
Testing types keep separate decisions. Each activated Unassisted Goal Test selects one eligible configured Persona for audience framing and evidence routing. Persona selection does not prove executor qualification.

### Human Experience

Human Experience is a cross-cutting lens. It is not a new lifecycle stage. Use the [Human Experience Contract](../contracts/human-experience-contract.md) as authority and the [Human Experience Reference](human-experience.md) for explanation and examples. Link to that authority from local artifacts. Do not copy the standard into each plan, PRD, backlog, prompt, or router.

| Lifecycle point | Local action |
| --- | --- |
| Design | Record the impact and Human Experience Intent before product and architecture decisions. |
| Plan | For `direct` or `indirect` impact, map each accepted promise to its owning PRD, affected human-facing surface or indirect effect, work phase, evidence source or selected testing type, and any accepted obligation. For `none`, name the preserved human boundary and how it will be proved unchanged. |
| PRD | Put each current observable human outcome in the PRD that owns the capability. Link to the canonical contract instead of creating an editorial Human Experience PRD. |
| Work backlog | Trace tasks and observable acceptance to the owning requirement and promise, or to the preserved boundary for `none`. Keep phase order, evidence decisions, and the implementation gate visible. |
| Implementation | Preserve the intended human path and the required technical result. Keep useful meaning, state, next action, and recovery clear on the affected surface. |
| Review | Inspect the actual human-facing surface for `direct` impact when it exists. Tie `indirect` evidence to the stated human effect. Record the reviewer and the limits of the observation. |
| Coverage | Apply Human Experience Review as a lens over suitable evidence for each applicable promise. Reuse evidence that answers the promise. If evidence is insufficient, use current testing authority to select the smallest useful added activity. Human Experience Review is not a separate testing type. |
| Acceptance | Record the promise, evidence, observation, conclusion, reviewer, and limit. Keep an accepted material gap open or route later owed work through an accepted obligation. |
| Release / publish | Keep claims within the accepted evidence and the human paths that were reviewed. Preserve an accepted obligation when later work remains owed. |
| Retrospective | Route a repeatable lesson through the normal change process to the contract, reference, or PRD that owns it. Do not turn one local preference into universal policy. |

This lens does not replace architecture, accessibility, visual design, security, privacy, safety, performance, Persona, or testing authority. Use those owners when their specialized decision is required. Direct impact does not activate Unassisted Goal Testing by itself.

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

## Optional State Capture

Ordinary project work does not depend on Make Docs state capture. If the CLI is not installed, cannot run, or reports `run-capture-unavailable` for optional lifecycle capture, continue the project work and report that capture was unavailable. Do not claim capture succeeded, write directly to the Store, queue a later write, or create project-local fallback state. Project documents, history breadcrumbs, and optional work backlog updates remain valid project knowledge. They must not act as installation or recovery records.

CLI-managed installs, upgrades, migrations, and other managed changes must save their required records in the global Make Docs Store. If required recording fails, the CLI must stop before further project writes and preserve recovery evidence. Optional capture failure never waives this requirement. Use `make-docs project state status` to inspect installation state and follow its safe next action.

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
