---
date: "2026-06-17"
repo: "make-docs"
coordinate: "W16 R0 P6"
status: "closed"
summary: "Added coverage-pass starter prompts and wired them into installable prompt assets."
---

# W16 R0 P6 Coverage-Pass Starter Prompts

## Changes

Phase 06 adds four reusable coverage-pass starter prompts for developer guides,
user guides, PRD reconciliation, and testing/UAT coverage.
Each starter cites the coverage-pass contract, uses its pass-specific verdict
set, requires a reason for every candidate including `none`, references the
history idempotency rule and validation checklist, and points commit-message
work to the existing commit prompt instead of creating a duplicate.

The prompt assets were mirrored into the package template and added to
`PROMPT_RULES` so the install asset pipeline includes them for work-capable
profiles.
The existing guide and history prompt starters now cite the coverage-pass
contract as update-existing prompt coverage.
The dogfood guide routers, shipped template guide routers, and generated
guide-router renderer were also aligned so the coverage-pass guide-routing
contract stays consistent while preserving the existing guide outcome list.

The Phase 06 work checklist was marked complete after the prompt starters,
template mirrors, prompt rules, and existing prompt reconciliations were in
place.

## Documentation

### Project

- Added coverage-pass prompt starters under
  [docs/assets/prompts](../../../../.make-docs/system/prompts/).
- Mirrored the prompt starters under
  [packages/docs/template/.make-docs/references/system/prompts](../../../../packages/docs/template/.make-docs/prompts/system/).
- Updated [rules.ts](../../../../packages/cli/src/rules.ts) to include the new
  prompt assets in `PROMPT_RULES`.
- Aligned guide-router copies under [docs/guides](../../library/),
  [packages/docs/template/docs/assets/library](../../../../packages/docs/template/docs/assets/library/),
  and renderers.ts.
- Marked [Phase 06](../work/2026-06-17-w16-r0-lifecycle-workflow-foundation/06-starter-prompts.md)
  tasks complete.

### Developer

No developer guide or playbook change was needed.
This phase adds reusable prompt starters for documentation closeout coverage,
not new project behavior or maintainer-facing guide content beyond the prompt
assets themselves.

### User

No user guide change was needed.
This phase changes internal documentation workflow prompts, not product
behavior.
