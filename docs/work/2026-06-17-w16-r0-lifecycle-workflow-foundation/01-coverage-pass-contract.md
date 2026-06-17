# Phase 01: Coverage Pass Contract

## Purpose

Author the coverage-pass contract — the single source for the decision-frame
mechanics shared by every closeout-style coverage pass — and make it
discoverable from the routers. This is the foundation the lifecycle anchor,
playbook, and starter prompts all cite.

## Overview

The contract owns mechanics only (skeleton, verdicts, idempotency, validation),
never the content of any guide, playbook, PRD, or history record. Wiring it into
the references router and de-duplicating the inline verdict lists makes it the
canonical home for the pattern.

## Source PRD Docs

- [14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)
- [06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)

## Stage 1 - Author the contract

### Tasks

- [x] t1: Create `docs/assets/references/coverage-pass-contract.md` with the seven-step pass skeleton.
- [x] t2: Define the base verdict semantics (`create`, `update-existing`, `link-only`, `none`) as a spine, with the rule that pass-specific verdicts map onto it.
- [x] t3: Define the named coverage surfaces (guide/playbook, history, PRD, testing/UAT) with their verdict sets and mappings.
- [x] t4: Document the verdict-vs-persona-target separation, the configured-persona-set rule, and the legacy Developer/User mapping for use before configuration exists.
- [x] t5: Write the history-record idempotency rule (deferring mechanics to `history-record-contract.md`) with the dual-role note.
- [x] t6: Write the verdict-and-reason rule and the prose close-of-pass validation checklist.
- [x] t7: Write the "defining a new coverage pass" recipe and the explicit non-goals.

### Acceptance criteria

- The file defines the skeleton, the spine, the four surfaces with their mappings, the verdict-vs-persona separation, the idempotency rule, the verdict-and-reason rule, the validation checklist, and the non-goals.
- Referenced content contracts remain unchanged except optional back-links.
- No placeholders remain.

### Dependencies

- None. This is the foundation phase.

## Stage 2 - Wire the routers

### Tasks

- [x] t8: Add a one-line entry for the contract to `docs/assets/references/AGENTS.md`.
- [x] t9: Replace the inline guide-verdict list in `docs/CLAUDE.md` with a pointer to the contract.
- [x] t10: Replace the inline verdict restatement in `docs/guides/AGENTS.md` with a pointer to the contract.

### Acceptance criteria

- The references router links the contract.
- `docs/CLAUDE.md` and `docs/guides/AGENTS.md` point at the contract instead of restating the verdict list.

### Dependencies

- Stage 1 (the contract must exist before the routers can point at it).
