# Adversarial Pass Contract

## Objective

Define the pass-specific contract for adversarial review while preserving the shared coverage-pass skeleton.

## Scope

- Add an adversarial-review extension that inherits the seven-step coverage-pass skeleton.
- Define adversarial candidates as challenges against claims, assumptions, workflows, support statements, or artifact boundaries.
- Require every candidate to record `id`, `target`, `challenge`, `evidence`, `persona_target`, `severity`, `verdict`, `reason`, `handoff`, and `validation`.
- Map adversarial verdicts onto the base coverage-pass spine:
  - `new-gap` -> `create`
  - `revise-owner` -> `update-existing`
  - `handoff-only` -> `link-only`
  - `covered` -> `none`
  - `rejected` -> `none`
- Treat `covered` and `rejected` as explicit outcomes with reasons, not silent skips.

## Dependencies

- PRD 14 for the lifecycle workflow foundation.
- [coverage-pass-contract.md](../../assets/references/coverage-pass-contract.md) for shared mechanics.
- PRD 22 and PRD 24 for persona schema and config boundary.

## Acceptance Criteria

- Every adversarial candidate has exactly one verdict and a reason.
- Pass-specific verdicts map cleanly to the base coverage-pass spine.
- Persona targeting is conditional and uses configured personas when they exist.
- History idempotency follows the shared coverage-pass contract.

## Validation Notes

Implementation should add fixtures for new-gap, revise-owner, handoff-only, covered, rejected, persona-targeted, non-persona, history-mutating, and no-history exploratory passes.
