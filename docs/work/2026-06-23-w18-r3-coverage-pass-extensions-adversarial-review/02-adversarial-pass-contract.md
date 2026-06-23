# P2 Adversarial Pass Contract

## Goal

Implement the adversarial candidate model, verdict mapping, persona targeting, and history behavior.

## Tasks

- [ ] Add or update the adversarial-review extension contract in the selected implementation surface.
- [ ] Require every candidate to record `id`, `target`, `challenge`, `evidence`, `persona_target`, `severity`, `verdict`, `reason`, `handoff`, and `validation`.
- [ ] Map `new-gap` to `create`.
- [ ] Map `revise-owner` to `update-existing`.
- [ ] Map `handoff-only` to `link-only`.
- [ ] Map `covered` and `rejected` to `none`.
- [ ] Require a reason for every verdict.
- [ ] Use configured persona slugs when config exists.
- [ ] Use `none` for non-persona adversarial challenges.
- [ ] Apply history idempotency when the pass records session history.

## Acceptance Criteria

- No candidate is skipped silently.
- `covered` and `rejected` are visible outcomes.
- Persona targeting is separate from verdict.
- Exploratory passes can return verdicts without mutating history when history was not requested.

## Validation Notes

Cover every verdict, persona-targeted and non-persona candidates, history update, history create, and no-history exploratory cases.
