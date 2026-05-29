# Coverage Pass Contract and Skill Evolution

## Purpose

Capture the decision to introduce a single repo-level "coverage pass"
contract that codifies the decision-frame pattern used by every
closeout-style documentation pass, and to evolve the existing
closeout and work-execution skills to reference that contract instead
of restating its rules inline.

The motivation is concrete: a four-prompt closeout chain that the user
maintains by hand (developer-guide pass → user-guide pass → PRD
reconciliation pass → commit-message draft) has, in practice,
outperformed the bundled `work-on-wave`, `work-on-phase`,
`closeout-phase`, and `closeout-commit` skills. The wins are
pattern-level: explicit named outcomes (including `none`), a single
history-record idempotency rule, contracts cited first instead of
restated, and validation as a closing checklist. The skills today
re-implement and partially duplicate these patterns without naming
them. This design names them, centralizes them, and rewires the
skills around them.

## Context

Today the relevant rules live in four overlapping places:

- `packages/skills/closeout-phase/SKILL.md` and its embedded
  `references/closeout-workflow.md`, which inline the guide-decision
  vocabulary, the gap-capture routing rules, and most of the
  validation checklist.
- `packages/skills/closeout-commit/SKILL.md` and its embedded
  `references/closeout-commit-workflow.md`, which restate a subset of
  the same rules for the no-phase commit case.
- `packages/skills/work-on-phase/SKILL.md` and
  `packages/skills/work-on-wave/SKILL.md`, which add their own
  language for closeout handoff and validation.
- The user's hand-maintained prompt chain, which silently fixes the
  gaps these skills leave open (notably the verdict-and-reason rule
  and the history-record idempotency rule).

`docs/assets/references/` already holds focused contracts for
adjacent surfaces: `guide-contract.md`, `history-record-contract.md`,
`output-contract.md`, `prd-change-management.md`,
`execution-workflow.md`, `path-and-link-hygiene.md`. None of these
own the *cross-cutting* mechanics of how an agent makes, records,
and validates a documentation-coverage decision during closeout.

That gap is what the prompt chain exploits. Until it is closed in
the repo, every new closeout-style pass we add (testing-coverage
pass, launch-readiness pass, archival pass, etc.) will either
re-introduce the duplication or quietly diverge from the existing
skills.

A separate but related forces:

- The decision-frame mechanics are stable. The verdict vocabulary
  (`create`, `update-existing`, `link-only`, `none`, plus
  pass-specific subsets like `developer` / `user` / `both`), the
  history-record idempotency rule, and the verdict-and-reason rule
  have not changed across the four ad-hoc prompts.
- The content rules of individual passes are *not* stable and
  already have their own contracts (e.g. `guide-contract.md`
  defines what a guide contains). The new contract must not
  encroach on that.
- Make Docs already has the right discoverability surface for
  contracts (`docs/assets/references/AGENTS.md` router, `docs/CLAUDE.md`
  router). A new contract only needs one router entry to become
  discoverable.

## Decision

1. **Author one new reference contract** at
   `docs/assets/references/coverage-pass-contract.md` that owns
   only the decision-frame mechanics shared across closeout-style
   passes:

   - The named-outcome vocabulary (`create`, `update-existing`,
     `link-only`, `none`, plus the rule for defining pass-specific
     extensions like `developer` / `user` / `both`).
   - The history-record idempotency rule — check for an existing
     session record, update if found, create if not, never
     duplicate.
   - The verdict-and-reason rule — every documentation-worthy
     capability must record an outcome *and* a reason, including
     the `none` case.
   - The closing-validation checklist template (markdown/style,
     docs index refresh, broken-link check, `git diff --check`,
     placeholder scan).
   - A short pass-authoring guide describing how to write a new
     coverage pass by referencing this contract instead of
     restating it.

   The contract explicitly does **not** own:

   - What goes in a guide, PRD, or history record. Those remain
     in their existing contracts.
   - Wave/phase resolution, scope guarding, or any
     implementation-stage mechanics. Those remain in the work
     skills.

2. **Refactor the four existing skills** to reference the new
   contract for any rule it now owns, and to remove duplicated
   prose:

   - `closeout-phase` — SKILL and embedded workflow.
   - `closeout-commit` — SKILL and embedded workflow.
   - `work-on-phase` — SKILL only.
   - `work-on-wave` — SKILL only.

   Each skill retains its pass-specific behavior (phase-state
   probing, scope guarding, working-tree scope inspection, etc.).
   The shared rules are referenced, not restated.

3. **Promote the user's prompt chain to starter prompts** under
   `docs/assets/prompts/`:

   - `coverage-pass-developer-guide.md`
   - `coverage-pass-user-guide.md`
   - `coverage-pass-prd-reconciliation.md`
   - `commit-message-from-convention.md`

   Each starter opens by pointing at the coverage-pass contract
   and the relevant content contract (guide-contract,
   prd-change-management, etc.), states the pass-specific outcome
   subset, and inherits the closing-validation checklist by
   reference. These are optional starters, not new skills.

4. **Mirror updated skills** from `packages/skills/...` to
   `.agents/skills/...` and `.claude/skills/...` so every harness
   loads the same content.

The implementation of this decision is captured in the in-progress
plan at
[../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md](../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md).

## Alternatives Considered

**Alternative A — Leave the prompt chain external.** Keep the
skills as they are; treat the prompt chain as the user's personal
workflow. Rejected because the duplication across skills will keep
producing the same drift the chain was invented to fix, and because
later stages (testing, launch, archive) would have nothing to
inherit from when we add them.

**Alternative B — Merge `closeout-phase` and `closeout-commit`
into one skill with a phase/no-phase mode flag.** Rejected for now.
The duplication between these skills is largely the shared rules
that the new contract will centralize. After the contract lands,
the remaining differences are small enough that merging may be the
right next step — but it is a follow-on decision, not a
prerequisite, and merging first would mix two refactors.

**Alternative C — Add the rules directly to each existing content
contract (`guide-contract.md`, `prd-change-management.md`, etc.).**
Rejected because the decision-frame mechanics are genuinely
cross-cutting. Putting the history-record idempotency rule inside
`guide-contract.md` would force `prd-change-management.md` to
re-state it, recreating the duplication at a different layer.

**Alternative D — Encode the decision-frame as a script or
validator instead of a contract.** Rejected at this stage. A
script would force a single representation of the verdict (e.g. a
frontmatter field on every history record) before we have
operational evidence that prose-level guidance has failed.
Prose-first now; scripted enforcement later if drift appears.

**Alternative E — Make the contract pass-specific from the start
(separate contracts for guide pass, PRD pass, testing pass, etc.).**
Rejected. The whole point is that these passes share mechanics.
Splitting them up front recreates the original duplication problem
under a new name.

## Consequences

**Positive:**

- A single canonical place to learn how a coverage pass behaves;
  every pass becomes shorter and more uniform.
- New stages (testing, launch, archival, retrospective) can be
  added by writing a thin reference entry plus a starter prompt,
  with no new mechanics.
- The user's ad-hoc chain becomes part of the repo, discoverable,
  and version-controlled.
- The four existing skills shrink, which makes their unique
  responsibilities (phase-state probing, scope guarding,
  working-tree inspection) more visible.

**Negative / risks:**

- One more file in `docs/assets/references/`. Mitigated because the
  references router already exists and the new file replaces prose
  duplicated across at least five existing files.
- Risk of contract scope creep — the new contract could be tempted
  to absorb guide-audience selection, PRD change classification,
  or history-record content rules. Mitigated by stating the
  non-goals explicitly inside the contract and in this design.
- The verdict vocabulary becomes a small breaking-change surface.
  Adding or renaming an outcome later means updating every pass
  that references it. Mitigated by keeping the base vocabulary
  small and stable; pass-specific extensions live in the
  pass-specific prompt or skill, not in the contract itself.
- Skill mirror directories (`.agents/skills/`, `.claude/skills/`)
  add churn during the rollout. Mitigated by treating the mirror
  step as its own plan phase with explicit validation.

**Operational:**

- After the contract lands, the closeout chain the user has been
  running manually becomes a sequence of three starter prompts +
  one commit-message prompt, all of which point at the same
  contract. The chain no longer has to encode the mechanics; it
  only specifies the pass-specific outcome subset and the
  pass-specific content contract.
- The `work-on-phase` and `work-on-wave` skills delegate closeout
  to `closeout-phase`, which now delegates shared rules to the
  contract. The chain becomes: skill → closeout skill → contract.
  Each layer is responsible for one concern.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../assets/prompts/designs-to-plan.prompt.md)
- Why: This is a net-new contract and skill-evolution surface; no
  active PRD namespace covers it. The matching plan is already in
  draft at
  [../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md](../plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md)
  under the proposed coordinate `W16 R0`.
- Coordinate Handoff: not applicable — `baseline-plan` route.
