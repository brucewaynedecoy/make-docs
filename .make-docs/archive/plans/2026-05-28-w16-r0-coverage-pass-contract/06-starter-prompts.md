# Phase 06 — Coverage-Pass Starter Prompts

## Purpose

Ship contract-citing starter prompts under `docs/assets/prompts/` that
reproduce the closeout coverage chain. These are optional starters, not skills.

## What to build

- `coverage-pass-developer-guide.prompt.md`
- `coverage-pass-user-guide.prompt.md`
- `coverage-pass-prd-reconciliation.prompt.md`
- `coverage-pass-testing-uat.prompt.md` (the testing/UAT surface)

Each prompt:

- Opens by citing `coverage-pass-contract.md` and the pass-specific content
  contract (`guide-contract.md`, `prd-change-management.md`, or
  `history-record-contract.md`).
- States the pass's verdict set; for guide passes, draws target personas from
  the configured set (defaulting to Developer/User before any configuration
  exists).
- Requires a verdict and reason for every candidate, including `none`.
- References (does not restate) the history idempotency rule and the
  validation checklist.

## Key decisions

- Use the existing `*.prompt.md` naming convention.
- Do **not** add a commit-message starter — `work-to-commit-message.prompt.md`
  already exists; reference it from the chain instead.
- Optionally reconcile the existing `work-to-guides.prompt.md` and
  `session-to-history-record.prompt.md` to cite the contract (treat as
  update-existing, not new files).

## Open

- The post-restructure home for starter prompts is unsettled (the planned tree
  has no prompts directory yet). Resolve before the restructure, not before
  this phase.

## Acceptance criteria

- The four starters exist, cite the contract, follow the naming convention, and
  add no duplicate commit starter. No placeholders remain.

## Dependencies

Cites the coverage-pass contract (01).
