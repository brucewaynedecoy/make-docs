# PRD Change Plan

> In v2, plans are directories. Use this template as the shape of the `00-overview.md` file in the plan directory; split additional detail into `0N-<phase>.md` files as needed.

**Date:** {{DATE}}
**Repository:** `{{REPO_ROOT}}`
**Purpose:** Produce a reviewable plan for evolving the active PRD namespace through an additive change, enhancement, revision, or removal.

## Objective

State what is changing, why the change is needed, who the outputs are for, and what counts as completion.

## Change Classification

- Requested change type: {{CHANGE_TYPE}} <!-- addition | enhancement | revision | removal -->
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: {{CLEANUP_REWRITE}} <!-- no | yes -->
- Full backlog regeneration requested: {{FULL_BACKLOG_REGEN}} <!-- no | yes -->

## Change Inputs

List every source of truth that feeds into the change plan. Each entry should note its format, location, and confidence level.

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| {{INPUT_NAME}} | {{FORMAT}} | {{LOCATION}} | {{CONFIDENCE}} |

Open questions or ambiguities should be captured here and promoted into `03-open-questions-and-risk-register.md` during execution when appropriate.

## Baseline Context

- Active `docs/prd/` status: {{ACTIVE_PRD_STATUS}}
- Impacted baseline docs: {{IMPACTED_DOCS}}
- Discovery pass required: {{DISCOVERY_REQUIRED}} <!-- yes | no -->
- Discovery scope if required: {{DISCOVERY_SCOPE}}

## Output Contract

- Plan directory: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{CHANGE_SLUG}}/`
  - entry point: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{CHANGE_SLUG}}/00-overview.md`
  - phase files: `docs/plans/{{DATE}}-w{{W}}-r{{R}}-{{CHANGE_SLUG}}/0N-<phase>.md`
- New change docs:
  - `docs/prd/{{NEXT_NUMBER}}-{{CHANGE_SLUG}}.md`
  - add more if the change must split across multiple docs
- Baseline docs to annotate: {{ANNOTATION_TARGETS}}
- Delta backlog:
  - `docs/work/{{DATE}}-w{{W}}-r{{R}}-{{CHANGE_SLUG}}/`

## Change Doc Strategy

List the change docs that will be added and the reason each one exists.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| `{{NEXT_NUMBER}}-{{CHANGE_SLUG}}.md` | {{KIND}} | {{RATIONALE}} | {{AFFECTED_DOCS}} |

## Baseline Annotation Plan

List the existing docs and sections that need `### Change Notes` updates.

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| `{{DOC_PATH}}` | {{SECTIONS}} | {{NOTE_VERB}} | `{{CHANGE_DOC}}` |

## Worker Ownership

List the delegated workers, their scopes, write scopes, dependencies, and deliverables.

- Assign every output-writing task to a worker when delegation is available.
- Keep change-doc authoring, baseline annotations, index updates, and delta backlog generation as separate write scopes whenever practical.
- Include a dedicated validation or fix worker when the harness can support it.
- The coordinator should not appear as the owner of any document-writing task when delegation is available.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| {{WORKER_NAME}} | {{SCOPE}} | {{WRITE_SCOPE}} | {{DEPENDENCIES}} | {{DELIVERABLES}} |

## MCP Strategy

- Preferred servers available: {{MCP_STATUS}}
- Fallback plan if unavailable: {{FALLBACK_PLAN}}

## Validation

Explain how the execution step will validate the generated outputs. Validation should confirm:

- every new change doc uses the right template and change type
- every impacted baseline doc includes the required backlinks
- `docs/prd/00-index.md` reflects the new status and lineage
- the delta backlog traces back to the change docs and impacted baseline docs
- no existing PRD docs were renumbered or silently rewritten
