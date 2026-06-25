# Phase 02: Metadata Schema and Templates

## Purpose

Add canonical metadata fields to generated document templates and generation guidance.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Tasks

- [x] t1: Inventory generated document templates and prompt outputs that produce design, plan, PRD, work, history, guide, or playbook docs.
- [x] t2: Add common `title`, `kind`, and `status` metadata to generated document templates where generation owns the output.
- [x] t3: Add conditional `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` metadata where applicable.
- [x] t4: Preserve existing body sections required by design, output, PRD, work, guide, and history contracts.
- [x] t5: Avoid opportunistic rewrites of historical docs that are not part of the touched implementation surface.

## Acceptance Criteria

- Generated templates can produce PRD 23 metadata.
- `persona` is present only where persona-scoped guide/playbook docs require it.
- Unknown coordinate levels are omitted rather than filled with placeholder values.

## Validation

- Run metadata fixture tests added in this phase.
- Run Markdown lint/link checks for touched templates and docs.

## Implementation Notes

- Added PRD 23 frontmatter to generated-document templates in `packages/docs/template/.make-docs/templates/system/` and the root dogfood `.make-docs/templates/system/` copy.
- Added generator prompt guidance in `packages/docs/template/.make-docs/references/system/prompts/` and the root dogfood `.make-docs/references/system/prompts/` copy so future generated outputs include common metadata and applicable conditional fields.
- Added focused consistency fixtures for generated-template metadata and prompt guidance in `packages/cli/tests/consistency.test.ts`.
- Left `packages/cli/template/` unchanged for this phase because Phase 04 owns package-copy parity and manifest refresh.
- No playbook template exists in the current system template set; playbook generation remains covered by router/PRD requirements until a dedicated playbook template is added.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/02-metadata-schema-and-templates.md --json`
- `npm test -w packages/cli -- consistency.test.ts --reporter=dot`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for modified and untracked Markdown files, excluding intentional template scaffold links.
- `jdocmunch.index_local`
- `jcodemunch.index_folder`
