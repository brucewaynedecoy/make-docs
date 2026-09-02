---
title: "PRD Authority Maintenance Plan"
kind: "plan"
status: "draft"
coordinate: "W{{W}} R{{R}}"
# source:
#   type: "design"
#   path: "{{SOURCE_PATH}}"
---

# PRD Authority Maintenance Plan

> In v2, plans are directories. Use this template as the shape of the `00-overview.md` file in the plan directory; split additional detail into `0N-<phase>.md` files as needed.

**Date:** {{DATE}}

**Repository:** `{{REPO_ROOT}}`

**Purpose:** Produce a reviewable plan for keeping the active PRD set aligned with the current authoritative shape of the product.

## Objective

State what product authority may change, why maintenance is needed, who the outputs are for, and what counts as completion.

## Governing Invariant

> `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.

Implementation sequencing, migration actions, reconciliation work, and editorial language stay in this plan, downstream work backlogs, and history records.

## Coordinate Decision

- Coordinate: `W{{W}} R{{R}}`
- Classification: `new-wave` or `revision`
- Evidence: Explain the explicit user guidance, design handoff, source lineage, prior plan/work/history records, or highest-wave fallback used to choose this coordinate.

The coordinate identifies this maintenance plan. Product PRDs do not use W/R/P as document identity; carry the coordinate into requirement-history entries and source links only.

## Maintenance Inputs

List every source of truth that feeds into the maintenance plan. Each entry should note its format, location, and confidence level.

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| {{INPUT_NAME}} | {{FORMAT}} | {{LOCATION}} | {{CONFIDENCE}} |

Open questions or ambiguities should be captured here and promoted into `docs/prd/03-open-questions-and-risk-register.md` during execution when appropriate.

## Active Authority Baseline

- Active `docs/prd/` status: {{ACTIVE_PRD_STATUS}}
- Current index: `docs/prd/00-index.md`
- Discovery pass required: {{DISCOVERY_REQUIRED}} <!-- yes | no -->
- Discovery scope if required: {{DISCOVERY_SCOPE}}
- Known noncompliance or legacy editorial PRDs: {{LEGACY_PRD_NOTES}}

## Candidate Decision Matrix

Assign exactly one decision to every candidate requirement: `update-existing`, `create`, `link-only`, or `none`.

| Candidate | Decision | Owning PRD or new product subject | Reason | Evidence |
| --- | --- | --- | --- | --- |
| {{CANDIDATE}} | {{DECISION}} | {{OWNER_OR_SUBJECT}} | {{REASON}} | {{EVIDENCE}} |

## Existing PRDs To Update

List existing product authorities whose subject already owns the changed requirement. Changes must be surgical: current normative text is updated inline and unrelated material is preserved.

| Existing PRD | Owning sections | Current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| `{{PRD_PATH}}` | {{SECTIONS}} | {{CURRENT_UPDATE}} | {{PRESERVATION_NOTES}} |

## Genuinely New Product PRDs

List only coherent, wholesale new capabilities, subsystems, or product boundaries with no suitable existing owner. If none are warranted, record `none` and the reason.

| New PRD | Product-oriented kind | Coherent subject | Why no existing owner is suitable |
| --- | --- | --- | --- |
| `docs/prd/{{NEXT_NUMBER}}-{{PRODUCT_SUBJECT_SLUG}}.md` | {{KIND}} | {{PRODUCT_SUBJECT}} | {{RATIONALE}} |

Do not plan PRDs whose filenames, titles, kinds, or subjects describe additions, enhancements, revisions, removals, migrations, or reconciliation.

## Requirement History Entries

List material prior contracts that should be preserved after the current normative requirement is updated. Requirement history is non-normative and never replaces the current body.

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `{{PRD_PATH}}` | {{DATE_AND_COORDINATE}} | {{REQUIREMENT_OR_SECTION}} | {{PREVIOUS_CONTRACT}} | {{REPLACEMENT_CONTRACT}} | {{RATIONALE}} | {{SOURCE}} |

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Links and index | {{INDEX_OR_LINK_PATH}} | {{LINK_UPDATE}} | Navigation only |
| Risks and decisions | `docs/prd/03-open-questions-and-risk-register.md` | {{RISK_UPDATE}} | Living risk and decision register |
| Plans | {{PLAN_PATHS}} | {{PLAN_UPDATE}} | Sequencing and rationale |
| Work | {{WORK_PATHS}} | {{WORK_UPDATE}} | Implementation queue |
| History | {{HISTORY_PATHS}} | {{HISTORY_UPDATE}} | Execution provenance |

## Output Contract

- Plan directory: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{MAINTENANCE_SLUG}}/`
  - entry point: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{MAINTENANCE_SLUG}}/00-overview.md`
  - phase files: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{MAINTENANCE_SLUG}}/0N-<phase>.md`
- Existing authoritative PRDs to update: {{EXISTING_PRD_TARGETS}}
- Genuinely new authoritative PRDs, if any: {{NEW_PRD_TARGETS}}
- Requirement-history entries: {{HISTORY_ENTRY_TARGETS}}
- Shared PRD surfaces: {{INDEX_AND_RISK_TARGETS}}
- Delta backlog:
  - `docs/work/{{DATE}}-w{{W}}-r{{R}}-{{MAINTENANCE_SLUG}}/`

## Worker Ownership

List delegated workers, their scopes, write scopes, dependencies, and deliverables.

- Assign every output-writing task to a worker when delegation is available.
- Keep existing-owner updates, genuinely new product PRDs, shared index/risk maintenance, delta backlog generation, and validation as separate write scopes whenever practical.
- Include a dedicated validation or fix worker when the harness can support it.
- The coordinator should not appear as the owner of any document-writing task when delegation is available.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| {{WORKER_NAME}} | {{SCOPE}} | {{WRITE_SCOPE}} | {{DEPENDENCIES}} | {{DELIVERABLES}} |

## MCP Strategy

- Preferred servers available: {{MCP_STATUS}}
- Fallback plan if unavailable: {{FALLBACK_PLAN}}

## Validation

Explain how execution will validate the outputs. Validation should confirm:

- every candidate has one decision and a reason
- current normative requirements live inline in their owning PRDs
- every new PRD is a coherent product authority rather than an editorial record
- every material prior contract is preserved only in a standardized, non-normative `## Requirement History` entry
- `docs/prd/00-index.md` uses product-oriented kinds and current-authority links
- removals and deprecations are expressed as current scope, non-goal, limitation, status, or boundary statements before history is recorded
- the delta backlog cites updated authoritative PRDs, not retired change records
- no existing PRD was renumbered or broadly rewritten without an ownership-based reason
