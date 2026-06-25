# Phase 01: Requirements and Register Reconciliation

## Purpose

Finalize PRD and risk-register changes before implementation modifies templates or validation.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Tasks

- [x] t1: Confirm PRD 23 is linked from [../../prd/00-index.md](../../prd/00-index.md), audience paths, source anchors, and intended follow-on.
- [x] t2: Ensure affected PRDs cite PRD 23 where they discuss templates, generated docs, lifecycle follow-ons, persona metadata, or validation.
- [x] t3: Update `Q-011`, `R-004`, `R-011`, `R-013`, and `R-014` to distinguish settled metadata requirements from remaining implementation/configuration work.

## Acceptance Criteria

- PRD 23 is discoverable from the active PRD set.
- Existing docs are not treated as invalid merely because they lack v2 metadata.
- Risk-register follow-ups are narrower and implementation-facing.

## Validation

- Run `git diff --check`.
- Run touched-file Markdown link checks.
- Reindex jdocmunch.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | Confirmed [PRD 23](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md) is present in the PRD index reading order, document map, source anchors, audience paths, and intended follow-on list. |
| t2 | Confirmed affected docs already cite PRD 23 where they discuss architecture metadata, template metadata, package proof, lifecycle handoffs, and persona-scoped metadata. The checked docs were [02 Architecture Overview](../../prd/02-architecture-overview.md), [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md), [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md), [14 Add Lifecycle Workflow Foundation](../../prd/14-add-lifecycle-workflow-foundation.md), [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md), [24 Revise Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md), and [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md). |
| t3 | Updated [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) for `Q-011`, `R-004`, `R-011`, `R-013`, and `R-014` so settled PRD 23 metadata requirements are separated from remaining configuration, validation, no-scripts, and historical-backfill work. |

## Coverage Decisions

- PRD coverage: updated the existing risk register in place. No new PRD change doc was needed because PRD 23 already owns the generated metadata requirement surface.
- Developer-guide coverage: none for Phase 1. This phase reconciled requirements and does not add durable maintainer behavior beyond PRD/register state.
- User-guide coverage: none for Phase 1. This phase does not change current user-facing CLI behavior.
- UAT: deferred until the full W16 R1 wave is complete, per the active wave instruction.
