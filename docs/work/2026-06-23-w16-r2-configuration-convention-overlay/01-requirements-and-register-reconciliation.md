# Phase 01: Requirements and Register Reconciliation

## Objective

Land the PRD and register updates needed before implementation starts.

## Inputs

- [Configuration and Convention Overlay](../../designs/2026-06-20-configuration-and-convention-overlay.md)
- [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Tasks

- [x] t1: Add PRD 24 to the active PRD index, source anchors, audience paths, and follow-on backlog list.
- [x] t2: Update affected baseline PRDs to state the presentation-only configuration boundary.
- [x] t3: Update Q-011 to record the structural decision and remaining implementation mechanism.
- [x] t4: Update Q-009, R-010, R-011, R-004, D-014, R-003, R-013, R-014, and Q-012 as needed.
- [x] t5: Keep the older terminology-overlay design as lineage, not active implementation authority.

## Acceptance Criteria

- PRD 24 is discoverable from the active PRD set.
- The risk register captures both the decision and the residual implementation risks.
- No affected baseline PRD implies config can rename canonical structure.

## Implementation Notes

- Confirmed [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) is present in [the PRD index](../../prd/00-index.md), reading order, document map, source anchors, audience paths, and intended follow-on list.
- Confirmed affected baseline PRDs already cite PRD 24 or equivalent configuration-overlay language where they discuss project-owned config, presentation-only labels, persona labels, canonical metadata, package proof, agentic surfaces, plugins, playbooks, and adversarial review.
- Confirmed Q-011 records the structural decision: configuration may relabel presentation prose, but canonical paths, metadata fields, route identifiers, prompt paths, skill names, contract names, and W/R/P lineage remain canonical.
- Confirmed Q-009, R-010, R-011, R-004, D-014, R-003, R-013, R-014, and Q-012 already include PRD 24 where their residual risk or follow-up depends on configuration overlays.
- Confirmed the older [Make Docs Lifecycle Playbook and Terminology Overlay](../../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md) remains lineage evidence via the active [Configuration and Convention Overlay design](../../designs/2026-06-20-configuration-and-convention-overlay.md), not active implementation authority.

## Coverage Decisions

- PRD coverage: no new PRD or risk-register text was needed in this phase. The active PRD namespace already carried PRD 24 through the index, affected baselines, and named risk/register items before implementation began.
- Developer-guide coverage: no developer guide was needed. This phase reconciled requirement authority and did not add durable maintainer procedure beyond the active PRD/backlog state.
- User-guide coverage: no user guide was needed. This phase does not expose a current end-user configuration workflow.
- UAT: deferred until the full W16 R2 wave is complete, per the active wave instruction.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay/01-requirements-and-register-reconciliation.md --json`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for modified and untracked Markdown files.
- `jdocmunch.index_local`
