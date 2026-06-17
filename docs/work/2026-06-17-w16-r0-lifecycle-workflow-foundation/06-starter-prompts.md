# Phase 06: Coverage-Pass Starter Prompts

## Purpose

Ship contract-citing starter prompts that reproduce the closeout coverage chain.
These are optional starters, not skills, and they make the proven hand-run chain
repo-backed.

## Overview

Each prompt opens by citing the coverage-pass contract and the pass-specific
content contract, states the pass's verdict set, and references (rather than
restates) the shared mechanics.

## Source PRD Docs

- [14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)

## Stage 1 - Author the starter prompts

### Tasks

- [ ] t1: Create `docs/assets/prompts/coverage-pass-developer-guide.prompt.md` citing `coverage-pass-contract.md` and `guide-contract.md`, with the developer-guide verdict set and persona-aware targeting.
- [ ] t2: Create `docs/assets/prompts/coverage-pass-user-guide.prompt.md` for the user-guide pass.
- [ ] t3: Create `docs/assets/prompts/coverage-pass-prd-reconciliation.prompt.md` citing `prd-change-management.md` for the PRD pass.
- [ ] t4: Create `docs/assets/prompts/coverage-pass-testing-uat.prompt.md` for the testing/UAT pass, including the "no test warranted -> record why" case.
- [ ] t5: In each prompt, require a verdict and reason for every candidate (including `none`), reference the history idempotency rule and the validation checklist (do not restate them), and use the `*.prompt.md` naming convention.
- [ ] t6: Do not add a commit-message starter — reference the existing `work-to-commit-message.prompt.md`. Optionally reconcile `work-to-guides.prompt.md` and `session-to-history-record.prompt.md` to cite the contract (update-existing, not new files).

### Acceptance criteria

- The four starter prompts exist, cite the contract, and follow the naming convention.
- No duplicate commit-message starter is added.
- No placeholders remain.

### Dependencies

- Phase 01 — the prompts cite the coverage-pass contract.
