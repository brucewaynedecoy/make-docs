---
title: "W16 R0 — Coverage Pass Contract, Lifecycle Anchor, and Playbook"
date: "2026-05-28"
revised: "2026-06-17"
coordinate: "W16 R0"
status: "draft"
---

# W16 R0 — Coverage Pass Contract, Lifecycle Anchor, and Playbook

## Revision Note

**Originally** (2026-05-28) this plan scoped only the coverage-pass contract
plus a refactor of the closeout and work-execution skills.

**Expanded 2026-06-17** to the full lifecycle-workflow foundation the
contract enables: the always-read lifecycle anchor, the dogfooded lifecycle
playbook, stage follow-on handoffs, and the optional `docs/artifacts/` seed
directory — alongside the contract and its starter prompts.

The skill refactor and three-location skill mirror remain **deferred** to the
later no-scripts / CLI-migration wave, so those skills are rewritten once
(contract-citing and script-free together) rather than twice.

All stage vocabulary is kept **domain-neutral** (e.g., "release / publish,"
not "launch / deploy") so make-docs stays usable for non-software
documentation work.

## Authoring Location and Re-Seed

Product assets in this wave — the references and templates under
`docs/assets/**`, the routers (`docs/CLAUDE.md`, `docs/AGENTS.md`,
`docs/guides/AGENTS.md`, the `docs/assets/references/` routers), the starter
prompts, and the `docs/artifacts/` router — are **shipped product** and must be
authored in the source-of-truth template `packages/docs/template/docs/...`
first, then re-seeded to the repo-root dogfood `docs/...`.

make-docs's own content stays dogfood-only and is not authored in the template:
the planning docs (`docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`),
the guides under `docs/guides/`, the lifecycle playbook content under
`docs/library/playbooks/`, and the `docs/artifacts/` content (the SVG and
digests).

The phase files below name dogfood `docs/...` paths for brevity; every
product-asset task follows the template-first rule stated here. See risk
register D-014.

## Purpose

Build the authoritative-plus-narrative layer that lets make-docs nudge agents
through its whole lifecycle without becoming prescriptive. One foundation —
the coverage-pass contract — carries five companion artifacts: an always-read
lifecycle anchor (authoritative default ordering), a dogfooded lifecycle
playbook (the human-facing map), stage follow-on handoffs (so the
design → plan → PRD → work → implement chain stops breaking), an optional
artifacts seed directory (a zero-contract home for pre-design inputs), and the
coverage-pass starter prompts.

This plan produces documentation only. Implementation derives from the work
backlog generated after this plan and its PRD reconciliation land.

## Objective

Active scope is complete when each phase's acceptance criteria (in the phase
files) are met:

1. The coverage-pass contract exists and is the single source for the
   decision-frame mechanics, with four named surfaces (guide/playbook,
   history, PRD, testing/UAT).
2. The lifecycle anchor states the arc, the default ordering, the
   derive-from-backlog principle, and the surface-departures straddle — with
   no hard "never skip" gate.
3. The lifecycle playbook exists as the dogfooded, persona-scoped narrative
   map citing the anchor.
4. Plans, PRDs, and work backlogs carry an advisory-default-but-overridable
   `## Intended Follow-On` handoff.
5. `docs/artifacts/` is sanctioned as an optional, zero-contract recommended
   input surface.
6. The coverage-pass starter prompts reproduce the closeout chain in
   contract-citing form.

## Coordinate Decision

- Coordinate: `W16 R0`
- Classification: `new-wave`
- Evidence: introduces a new cross-cutting workflow-contract surface plus the
  lifecycle layer built on it; no prior plan or backlog covers it. The highest
  prior wave is `W15 R0`. Confirm the coordinate before generating PRD/work
  artifacts.

## Scope

### Active (this wave) — one phase file each

| Phase | File | Builds |
| --- | --- | --- |
| 01 | [01-coverage-pass-contract.md](01-coverage-pass-contract.md) | The coverage-pass contract + router wiring. |
| 02 | [02-lifecycle-anchor.md](02-lifecycle-anchor.md) | The always-read lifecycle anchor. |
| 03 | [03-lifecycle-playbook.md](03-lifecycle-playbook.md) | The dogfooded build-stack lifecycle playbook. |
| 04 | [04-stage-follow-on-handoffs.md](04-stage-follow-on-handoffs.md) | Intended-Follow-On handoffs for plan/PRD/work. |
| 05 | [05-artifacts-seed.md](05-artifacts-seed.md) | The optional `docs/artifacts/` seed directory. |
| 06 | [06-starter-prompts.md](06-starter-prompts.md) | The coverage-pass starter prompts. |

### Deferred — to the no-scripts / CLI-migration wave

- Refactor of `closeout-phase`, `closeout-commit`, `work-on-phase`, and
  `work-on-wave` to cite the contract.
- The three-location skill mirror (`packages/skills` → `.agents`/`.claude`).
- Rationale: these touch the same skills the no-scripts migration rewrites;
  doing them here means touching each skill twice.

### Out of scope — later waves

- Persona/config implementation, terminology and convention overlay, plugins,
  the package rename, and the broader `docs/` restructure. The contract and
  playbook are written to be *forward-compatible* with these but do not
  implement them.

## Dependencies

- Active scope depends on existing content contracts (`guide-contract.md`,
  `history-record-contract.md`, `output-contract.md`,
  `prd-change-management.md`, `path-and-link-hygiene.md`) remaining stable;
  they are referenced, not rewritten.
- The contract's persona-target axis is forward-written against a future
  configuration; it ships with the legacy Developer/User mapping so it is
  correct before that configuration exists.
- Documentation-only; no code dependencies.

## Validation

- Each phase's acceptance criteria hold.
- Repo checks pass: markdown/style, docs index refresh, link hygiene,
  `git diff --check`, placeholder scan.
- No new guide/playbook is marked `status: published`; the anchor contains no
  hard "never skip" language; all stage vocabulary is domain-neutral.

## Risks and Open Questions

The full risk and decision set for this wave (and the broader make-docs
evolution it sits within) is reconciled in
`docs/prd/03-open-questions-and-risk-register.md`. Plan-local highlights:

- **R-1:** Contract scope creep into pass-specific content or persona
  definition. Mitigation: mechanics only; defer content to existing contracts
  and persona definition to configuration.
- **R-2:** The anchor drifts toward prescriptiveness or a hard gate.
  Mitigation: the surface-departures straddle and explicit non-goals; no
  "never skip" language.
- **R-3:** Terminology re-introduces a software bias. Mitigation:
  domain-neutral vocabulary is an explicit acceptance criterion and a register
  entry.
- **Q-1:** The post-restructure home for starter prompts.
- **Q-2:** Confirm the `W16 R0` coordinate.
- **Q-3:** Whether `docs/library/playbooks/` is created now or with the
  broader restructure.
