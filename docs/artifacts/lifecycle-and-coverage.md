---
title: "make-docs Lifecycle and Coverage Model"
date: "2026-06-17"
kind: "reference"
status: "draft"
---

# make-docs Lifecycle and Coverage Model

Supplemental reference notes preserving the lifecycle and coverage model worked
out for make-docs's own evolution. This is seed material, not a contract; the
authoritative versions live in the references, the active plan, and the PRD as
they are built.

## The Lifecycle Arc

make-docs moves work through a documentation-first arc. The arc is a *map*, not
a required sequence — stages may be skipped, reordered, or revisited — and its
vocabulary is deliberately domain-neutral so it serves software and
non-software work alike.

- **Optional inputs** — a `docs/artifacts/` seed (this directory): free-form
  pre-design inputs that hydrate the pipeline. An input surface, not a stage.
- **Segment 1 — Plan** (linear, gated, roughly one-time):
  Design -> Plan -> PRD -> Work backlog.
- **Segment 2 — Build** (looped per phase): Implement (including automated
  tests) -> cross-cutting coverage-pass band -> Commit / phase gate.
- **Segment 3 — Release & beyond** (per release): Release / publish ->
  Archival -> Retrospective. "Release / publish" means *make the work available
  to its audience* — deploy code, publish docs, push to source control, or hand
  off a report.
- **Cross-cutting**: the coverage-pass band and the persona lens.

A rendered map of the arc is saved alongside this note as
[make-docs-lifecycle-arc.svg](make-docs-lifecycle-arc.svg).

Default ordering principle: implementation normally *derives from a work
backlog*, which derives from a PRD, which derives from a plan. Route through
them by default, and **surface any departure** rather than taking it silently.

## The Coverage-Pass Model

A **coverage pass** is a structured, post-work reconciliation of one
documentation or requirements surface against completed work, producing an
explicit recorded verdict per candidate — without duplicating history records
or skipping the decision.

- **Skeleton** (every pass): load authority first -> enumerate candidates ->
  assign exactly one verdict per candidate -> prefer update-over-create ->
  reconcile the session history record (idempotency rule) -> validate ->
  closeout summary.
- **Base verdict semantics (spine):** `create`, `update-existing`,
  `link-only`, `none`. A semantic spine, not a strict superset —
  pass-specific verdict sets *map onto* it.
- **Surfaces and their verdict sets:**
  - Guide / playbook (persona-scoped): base verdicts, each carrying target
    persona(s).
  - History (non-persona): base verdicts.
  - PRD reconciliation (non-persona): `prd-change-doc`->create;
    `baseline-change-note`, `risk-register-update`, `index-only`->update-existing;
    `link-only`; `none`.
  - Testing / UAT (non-persona): base verdicts, including "no test warranted ->
    record why."
- **Verdict vs persona-target are separate axes.** The verdict says *what to
  do*; the persona target says *for whom*, drawn from the configured persona
  set (never hard-coded). Before configuration exists, a legacy mapping applies:
  `developer` = (create, {developer}); `user` = (create, {user}); `both` =
  (create, {developer, user}).
- **History idempotency rule:** check for a session record; update it if
  present; create it if not; never duplicate; record the decision and rationale
  regardless of verdict, including `none`. History is both step 5 of every pass
  and a standalone coverage surface.
- **Verdict-and-reason rule:** every candidate records a verdict and a reason;
  `none` is first-class and never silent.
- **Defining a new pass:** name the surface, cite its content contract +
  template + router, declare its verdict set and how it maps to the spine,
  declare persona-targeting if persona-scoped, and reuse the skeleton,
  idempotency rule, and validation checklist by reference.

## Build Stack vs Run Stack

- **Build stack** — the docs and process used to *build* a thing
  (design -> plan -> PRD -> work -> looped build). What make-docs has
  historically been.
- **Run stack** — the runtime process a *deployed* agent uses to *operate*
  (its own playbooks, in a separate location). The "turn a process into a named
  agent" direction.

Both are expressed as persona-scoped procedural docs (playbooks); they differ
only by which stack they serve.

## The Design-to-Build Workflow

A two-segment workflow drives the arc end to end.

- **Segment 1 — Planning (linear, no code).** Read repo contracts; research the
  project and requirements; then produce design -> plan -> PRD -> work backlog.
  When a human is in the loop, each transition is a separate approval gate
  (research, design, plan, PRD, work backlog). Running unattended collapses the
  gates. Hard rules: no source changes, no archiving, prefer repo contracts over
  generic advice.
- **Segment 2 — Build (looped).** For each work backlog and each phase, run a
  staged sequence: implement the phase (orchestrating parallel work where
  possible), then the coverage-pass band — testing/UAT, developer-guide,
  user-guide, PRD reconciliation, docs hygiene — then a commit / phase gate.
  Testing/UAT and the commit gate are in-loop-only and are skipped on
  unattended runs.
