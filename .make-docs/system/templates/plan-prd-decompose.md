---
title: "Codebase Decomposition Plan"
kind: "plan"
status: "draft"
coordinate: "W{{W}} R{{R}}"
# source:
#   type: "manual-request"
#   path: "{{SOURCE_PATH}}"
---

# Codebase Decomposition Plan

> In v2, plans are directories. Use this template as the shape of the `00-overview.md` file in the plan directory; split additional detail into `0N-<phase>.md` files as needed.

**Date:** {{DATE}}

**Repository:** `{{REPO_ROOT}}`

**Purpose:** Produce a reviewable plan for reverse-engineering the repository into a structured PRD set and rebuild backlog.

## Objective

State what the decomposition should preserve, who the outputs are for, and what counts as completion.

## Coordinate Decision

- Coordinate: `W{{W}} R{{R}}`
- Classification: `new-wave` or `revision-wave` (the legacy value `revision` means `revision-wave`)
- Evidence: Name the explicit user guidance, the outcome test result for a new wave, or the revision Wave test that passed, with the design handoff, source lineage, and prior plan/work/history records used. Apply the `## Decision Procedure` in `.make-docs/system/references/wave-model.md`. An in-place amendment of a committed plan keeps this section and records the change in `## Change History`.

## Output Contract

- Plan directory: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{SLUG}}/`
  - entry point: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{SLUG}}/00-overview.md`
  - phase files: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{SLUG}}/0N-<phase>.md`
- PRD core:
  - `docs/prd/00-index.md`
  - `docs/prd/01-product-overview.md`
  - `docs/prd/02-architecture-overview.md`
  - `docs/prd/03-open-questions-and-risk-register.md`
  - `docs/prd/04-glossary.md`
  - adaptive numbered subsystem/reference docs starting at `05-*`
- Rebuild work:
  - `docs/work/{{DATE}}-w{{W}}-r{{R}}-{{SLUG}}/`

## Existing PRD Handling

- Active `docs/prd/` status: {{ACTIVE_PRD_STATUS}}
- Archive step required before execution: {{ARCHIVE_REQUIRED}}
- Planned archive target if approved: `{{ARCHIVE_TARGET}}`
- Active root entries to archive: {{ARCHIVE_ENTRIES}}

## Coordinator Policy

- Highest intended delegation tier: {{DELEGATION_TIER}}
- Coordinator role: `coordination only`
- Coordinator write scope: `none` when delegation is available
- Coordinator responsibilities: preflight, approvals, routing, worker spawning, progress tracking, blocker handling, final status reporting

## Proposed Catalog

List the fixed core docs plus adaptive docs and explain whether the tree should stay flat or use numbered subfolders.

## Worker Ownership

List the delegated workers, their scopes, write scopes, dependencies, and deliverables.

- Assign every output-writing task to a worker when delegation is available.
- Include a dedicated shared-doc assembly worker for `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md`, and the rebuild backlog.
- Include a dedicated validation/fix worker when the harness can support it.
- The coordinator should not appear as the owner of any document-writing task when delegation is available.

## MCP Strategy

- Preferred servers available: {{MCP_STATUS}}
- Fallback plan if unavailable: {{FALLBACK_PLAN}}

## Validation

Explain how the execution step will validate the generated outputs and which review pass happens at the end.

## Change History

<!-- Optional. Add this section only after this plan has been committed and its scope changes. One entry per coherent scope edit, newest last. Progress updates need no entry. See the `## Change History` section of `.make-docs/system/references/wave-model.md`. `PRD decision` is `update-existing`, `create`, `link-only`, or `none`. `Source` is a relative Markdown link to the governing design, plan, work, history, owner decision, or evidence. Remove this comment and the example entry when the section is not needed. -->

### {{DATE}} — {{COORDINATE}}

- Kind: `{{EDIT_REVISION_PHASE_PIVOT_REBUILD_OR_REVISION_WAVE}}`
- Affected scope: {{PHASES_OR_TASKS}}
- Previous scope: {{PREVIOUS_SCOPE}}
- Replacement scope: {{REPLACEMENT_SCOPE}}
- Rationale: {{RATIONALE}}
- PRD decision: `{{PRD_DECISION}}` — {{REASON_WHEN_NONE}}
- Owner approval: {{APPROVAL_SOURCE_OR_NOT_REQUIRED}}
- Source: {{RELATIVE_SOURCE_REFERENCE}}
