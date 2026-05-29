---
title: "Coverage Pass Contract and Skill Decision-Frame Refactor"
date: "2026-05-28"
coordinate: "W16 R0"
status: "draft"
---

# Coverage Pass Contract and Skill Decision-Frame Refactor

## Purpose

This plan codifies the "decision-frame" pattern — used informally in the
user's ad-hoc closeout prompt chain — into a first-class repo contract at
`docs/assets/references/coverage-pass-contract.md`, then refactors the
existing closeout and work-execution skills to reference that contract
instead of restating its rules inline. The goal is to make every closeout
pass (guide coverage, PRD coverage, future testing/launch/archive passes)
share one set of named decision outcomes, one history-record idempotency
rule, and one set of skip-conditions, so future passes can be added by
authoring a single thin skill plus a single short reference entry.

This plan does not change the high-level wave/phase/PRD model. It changes
how individual "closeout-style" passes are specified and how the skills
that execute them are written.

## Objective

A reviewer should be able to confirm completion when all of the following are true:

1. `docs/assets/references/coverage-pass-contract.md` exists, defines the
   shared decision-frame vocabulary, and is linked from the references
   router (`docs/assets/references/AGENTS.md`) and from `docs/CLAUDE.md`
   where appropriate.
2. `closeout-phase`, `closeout-commit`, `work-on-phase`, and `work-on-wave`
   reference the coverage-pass contract for any rule the contract now owns,
   and remove duplicated language they previously embedded.
3. The existing guide-coverage and gap-capture gates inside
   `packages/skills/closeout-phase/references/closeout-workflow.md` are
   rewritten as invocations of the coverage-pass contract rather than
   self-contained gate text.
4. The user's ad-hoc prompts for developer-guide, user-guide, and PRD
   reconciliation passes can be re-expressed as short stage prompts that
   point at the contract; we ship those as starters under
   `docs/assets/prompts/`.
5. No existing skill regresses: each refactored skill still produces the
   same artifact set (guide changes, history record, gap-register updates,
   commit-message draft) for the same inputs.

## Coordinate Decision

- Coordinate: `W16 R0`
- Classification: `new-wave`
- Evidence: There is no prior plan or work backlog for a cross-cutting
  workflow-contract refactor. The highest existing wave in `docs/plans/`
  is `W15 R0` (`work-backlog-source-authority`). This work introduces a
  new contract surface and a coordinated skill refactor, which is
  distinct enough to warrant a new wave rather than a revision of W14
  or W15. Confirm the coordinate during plan review before generating
  the PRD/work artifacts.

## Background

The user has been running a four-prompt closeout chain (plan-and-implement,
developer-guide coverage, user-guide coverage, PRD reconciliation, commit
message) across other Make Docs–consuming projects. That chain has, in
practice, outperformed the bundled `work-on-wave`, `work-on-phase`,
`closeout-phase`, and `closeout-commit` skills.

The wins are pattern-level, not content-level:

- **Explicit decision outcomes.** Every pass forces one of a fixed set of
  verdicts (e.g. `developer`, `user`, `both`, `update-existing`,
  `link-only`, `none`) and requires the agent to record the verdict and a
  reason — including the "no change needed" case.
- **History-record idempotency.** A single rule — "check if a history
  record already exists for this session; update it or create one, but
  never duplicate" — is restated identically across passes.
- **Contracts cited first, then acted on.** The prompts open by pointing
  at contract and template files, instead of restating their rules.
- **Validation as a closing checklist**, not a mid-flow script the agent
  has to satisfy to proceed.

Today these rules are partially duplicated inside `closeout-workflow.md`,
partially embedded inline in `closeout-phase/SKILL.md` and
`closeout-commit/SKILL.md`, and partially scattered across the prompt
chain the user maintains by hand. The decision-frame pattern should live
in one place.

## Scope

In scope:

- A new reference: `docs/assets/references/coverage-pass-contract.md`.
- Edits to:
  - `docs/assets/references/AGENTS.md` (router entry).
  - `docs/CLAUDE.md` (router link, only if needed for discoverability).
  - `packages/skills/closeout-phase/SKILL.md`
  - `packages/skills/closeout-phase/references/closeout-workflow.md`
  - `packages/skills/closeout-commit/SKILL.md`
  - `packages/skills/closeout-commit/references/closeout-commit-workflow.md`
  - `packages/skills/work-on-phase/SKILL.md`
  - `packages/skills/work-on-wave/SKILL.md`
- New starter prompts under `docs/assets/prompts/` capturing the
  developer-guide, user-guide, and PRD-reconciliation passes as short,
  contract-citing prompts.
- Mirror updates to the published skill copies under `.agents/skills/`
  and `.claude/skills/` so each harness sees the same content.

Out of scope (will be addressed in follow-on waves):

- The broader "make-docs playbook" table-of-contents work the user wants
  to discuss after this plan is approved.
- Any terminology-overlay configuration (e.g. mapping `wave` to `sprint`).
- Deprecation or merging of `closeout-phase` and `closeout-commit` into a
  single skill.
- New stage skills for testing, soft launch, archive, etc. — those become
  trivial to add once the contract is in place.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-coverage-pass-contract.md` | Author the new reference contract and wire it into the references router and `docs/CLAUDE.md` if needed. |
| `02-closeout-phase-refactor.md` | Rewrite `closeout-phase` SKILL and its `closeout-workflow.md` to delegate guide/gap rules to the new contract. |
| `03-closeout-commit-refactor.md` | Rewrite `closeout-commit` SKILL and its `closeout-commit-workflow.md` to delegate gap/history rules to the new contract. |
| `04-work-skill-refactor.md` | Update `work-on-phase` and `work-on-wave` SKILLs to cite the contract for closeout handoff language and remove duplicated rules. |
| `05-starter-prompts.md` | Add starter prompts under `docs/assets/prompts/` for developer-guide, user-guide, and PRD-reconciliation passes, plus a short commit-message starter. |
| `06-mirror-and-validate.md` | Mirror updated skills to `.agents/skills/` and `.claude/skills/`, run docs/style validation, refresh indexes, sanity-check link hygiene. |

## Phase 01 — Coverage Pass Contract

Author `docs/assets/references/coverage-pass-contract.md`. The contract
must define, at minimum:

- **Purpose**: what a "coverage pass" is and when one is run (typically
  during closeout, but the contract is reusable for any pass that has to
  make a documentation decision).
- **Named outcomes**: the canonical verdict vocabulary, with definitions:
  - `create` (new artifact)
  - `update-existing` (modify existing artifact)
  - `link-only` (cross-link without content change)
  - `none` (explicitly no change needed)
  - plus pass-specific outcome subsets, e.g. guide passes also allow
    `developer`, `user`, `both`.
- **History-record idempotency rule**: one normative paragraph that every
  pass references verbatim — check for a session record; update if found;
  create if not; never duplicate.
- **Verdict-and-reason rule**: every pass must record the chosen outcome
  *and* a short reason, including for `none`.
- **Validation checklist template**: the common close-of-pass checks
  (markdown style, docs index refresh, broken links, `git diff --check`,
  placeholder scan).
- **Pass authoring guidance**: how to author a new pass (developer
  guide, user guide, PRD reconciliation, testing, launch, archive, …)
  by referencing the contract instead of restating it.
- **Non-goals**: the contract does not own what *should* be in a guide,
  PRD, or history record — those remain in `guide-contract.md`,
  `output-contract.md`, `prd-change-management.md`,
  `history-record-contract.md`.

Update `docs/assets/references/AGENTS.md` and `docs/CLAUDE.md` so the
new contract is discoverable from the normal router path.

Acceptance criteria:

- File exists at the specified path.
- File defines the verdict vocabulary, the idempotency rule, the
  verdict-and-reason rule, and the validation checklist.
- File is linked from at least the references router.
- Existing contracts referenced from the new file remain unchanged
  in this phase.

## Phase 02 — `closeout-phase` Refactor

Rewrite `packages/skills/closeout-phase/SKILL.md` so it:

- References `coverage-pass-contract.md` for the verdict vocabulary,
  the history-record idempotency rule, and the validation checklist.
- Keeps phase-specific behavior (task-completion verification using
  `work_phase_state.py`, `scope_guard` integration, `phase_gate`).

Rewrite `closeout-workflow.md` to:

- Replace duplicated guide-decision text with a reference to the
  coverage-pass contract, then state only the phase-specific guide pass
  responsibilities (e.g. "decide guide coverage for the implementation
  changes in this phase").
- Replace duplicated gap-capture text with a reference to the contract
  plus PRD-specific routing rules (still owned by
  `prd-change-management.md`).

Acceptance criteria:

- No rule that lives in the new contract is restated verbatim inside
  the skill or workflow.
- All previous outcomes (guide change decisions, gap capture, history
  entry, validation, commit-message draft) are still reachable through
  the rewritten workflow.

## Phase 03 — `closeout-commit` Refactor

Same shape as Phase 02, applied to `closeout-commit`:

- Update SKILL and `closeout-commit-workflow.md` to reference the
  coverage-pass contract for shared rules.
- Keep commit-specific behavior (working-tree scope inspection, change
  set discovery, commit-convention lookup).
- Confirm the skill still does *not* run a guide pass unless the user
  asks or a phase is in scope.

## Phase 04 — Work-Execution Skill Refactor

For `work-on-phase` and `work-on-wave`:

- Replace any restated closeout rule with a reference to
  `closeout-phase` (which in turn references the contract).
- Remove rule duplication around history records, gap routing, and
  validation language.
- Leave delegation, planning, scope-guard, and phase-gate logic intact.

## Phase 05 — Starter Prompts

Add (or refactor, if equivalents exist) starter prompts under
`docs/assets/prompts/`:

- `coverage-pass-developer-guide.md`
- `coverage-pass-user-guide.md`
- `coverage-pass-prd-reconciliation.md`
- `commit-message-from-convention.md`

Each prompt should:

- Open by pointing the agent at `coverage-pass-contract.md` and any
  pass-specific contract (guide, PRD, history).
- State the pass-specific outcome subset.
- Require a verdict-and-reason for every documentation-worthy
  capability.
- Include the history-record idempotency rule by reference, not by
  restating it.
- Use the same closing-validation checklist by reference.

These are starters, not skills. They mirror the chain the user already
runs by hand, but now backed by the contract.

## Phase 06 — Mirror and Validate

- Mirror updated SKILL and reference files from `packages/skills/...`
  to `.agents/skills/...` and `.claude/skills/...` so all harnesses load
  the same content.
- Run the repo's markdown/style checks (`make-docs` validation if
  available; otherwise the closest equivalent the repo ships).
- Refresh the `jdocmunch` docs index for `docs/`.
- Run `git diff --check`.
- Sanity-check relative links in the new contract and the rewritten
  workflows.
- Confirm no placeholders (`TODO`, `TBD`, `{{...}}`) remain in
  contract-owned text.

## Dependencies

- The plan assumes the existing references (`guide-contract.md`,
  `history-record-contract.md`, `output-contract.md`,
  `prd-change-management.md`, `execution-workflow.md`,
  `path-and-link-hygiene.md`) remain stable. They are *referenced* by
  the new contract, not rewritten.
- No code dependencies. All changes are documentation and skill prose.

## Validation

The plan is complete when:

- `coverage-pass-contract.md` is the single source for the
  decision-frame vocabulary, history-record idempotency rule,
  verdict-and-reason rule, and validation checklist.
- All four target skills (`closeout-phase`, `closeout-commit`,
  `work-on-phase`, `work-on-wave`) reference the contract for every
  rule it now owns.
- Starter prompts under `docs/assets/prompts/` reproduce the user's
  current four-prompt chain in contract-citing form.
- Skill copies under `.agents/skills/` and `.claude/skills/` match
  `packages/skills/`.
- Repo-level validation passes (markdown/style, docs index refresh,
  link hygiene, `git diff --check`, placeholder scan).

## Risks and Open Questions

- **R-1:** The contract may overreach if it tries to encode pass-specific
  language (e.g. guide audience selection) that already lives in
  `guide-contract.md`. Mitigation: keep the new contract focused on
  *decision frame* mechanics; defer content rules to the existing
  contracts.
- **Q-1:** Should `closeout-phase` and `closeout-commit` eventually merge
  into a single skill once the contract centralizes their shared rules?
  Defer this question to a follow-on plan after the refactor lands and
  the duplication is concretely measurable.
- **Q-2:** Should the verdict vocabulary be enforced by a script (e.g.
  a closeout validator that fails if a history record omits the verdict
  field) or only by prose? Defer; prose-first now, scripted enforcement
  later if drift appears.
- **Q-3:** Confirm the `W16 R0` coordinate before generating PRD/work
  artifacts from this plan.
