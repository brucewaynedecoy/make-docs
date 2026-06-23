# Phase 02: Metadata Schema and Templates

## Purpose

Add canonical metadata fields to generated document templates and generation guidance.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Tasks

- [ ] `W16R1-P2-T1` Inventory generated document templates and prompt outputs that produce design, plan, PRD, work, history, guide, or playbook docs.
- [ ] `W16R1-P2-T2` Add common `title`, `kind`, and `status` metadata to generated document templates where generation owns the output.
- [ ] `W16R1-P2-T3` Add conditional `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` metadata where applicable.
- [ ] `W16R1-P2-T4` Preserve existing body sections required by design, output, PRD, work, guide, and history contracts.
- [ ] `W16R1-P2-T5` Avoid opportunistic rewrites of historical docs that are not part of the touched implementation surface.

## Acceptance Criteria

- Generated templates can produce PRD 23 metadata.
- `persona` is present only where persona-scoped guide/playbook docs require it.
- Unknown coordinate levels are omitted rather than filled with placeholder values.

## Validation

- Run metadata fixture tests added in this phase.
- Run Markdown lint/link checks for touched templates and docs.
