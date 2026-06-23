# Phase 01: Requirements and Register Reconciliation

## Purpose

Finalize PRD and risk-register changes before implementation modifies templates or validation.

## Source PRDs

- [../../prd/23-revise-generated-metadata-lifecycle-handoffs.md](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)

## Tasks

- [ ] `W16R1-P1-T1` Confirm PRD 23 is linked from [../../prd/00-index.md](../../prd/00-index.md), audience paths, source anchors, and intended follow-on.
- [ ] `W16R1-P1-T2` Ensure affected PRDs cite PRD 23 where they discuss templates, generated docs, lifecycle follow-ons, persona metadata, or validation.
- [ ] `W16R1-P1-T3` Update `Q-011`, `R-004`, `R-011`, `R-013`, and `R-014` to distinguish settled metadata requirements from remaining implementation/configuration work.

## Acceptance Criteria

- PRD 23 is discoverable from the active PRD set.
- Existing docs are not treated as invalid merely because they lack v2 metadata.
- Risk-register follow-ups are narrower and implementation-facing.

## Validation

- Run `git diff --check`.
- Run touched-file Markdown link checks.
- Reindex jdocmunch.
