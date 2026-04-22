# Design Workflow

## Purpose

Use this workflow when the user wants to turn a request into one or more design docs before planning, PRD generation, or backlog generation.

This workflow ends with design docs in `docs/designs/` using the form `docs/designs/YYYY-MM-DD-<slug>.md`. It does not draft a plan.

## Preflight

Before writing:

1. Inspect `docs/designs/` for related design docs.
2. Inspect related plans, PRD docs, or work backlogs only as needed for context or route classification.
3. Determine whether the request belongs to the same decision area as an existing design.
4. Choose whether to update an existing design or create a new dated design doc.

## Create Vs Update Rules

- Prefer updating an existing design when the request clearly concerns the same decision area and the existing doc can absorb the change without obscuring prior intent.
- Create a new dated design doc when no clear related design exists, when the request spans a distinct decision area, or when a substantial direction change would make the existing design misleading.
- One design doc is the default output unit. Create more than one only when the request clearly spans multiple distinct decision areas.

## Lineage Rules

- If a generated update materially changes prior design intent, add an optional `## Design Lineage` section before `## Intended Follow-On`.
- Use `## Design Lineage` to record:
  - `Update Mode:` `updated-existing` or `new-doc-related`
  - `Prior Design Docs:` relative links to the earlier design docs
  - `Reason:` a short explanation of why the prior design was updated or why a related new design doc was needed
- If the request is only a minor clarification and does not materially change prior design intent, the lineage section is optional.

## Intended Follow-On Rules

- Every generated design doc must include `## Intended Follow-On`.
- Allowed `Route` values:
  - `baseline-plan`
  - `change-plan`
- Required prompt links:
  - `baseline-plan` → `docs/assets/prompts/designs-to-plan.prompt.md`
  - `change-plan` → `docs/assets/prompts/designs-to-plan-change.prompt.md`
- Downstream planners should treat the explicit route in `## Intended Follow-On` as authoritative unless the user explicitly overrides it.
- Route guidance:
  - use `baseline-plan` when the design should feed a fresh baseline planning flow
  - use `change-plan` when the design should feed additive change, enhancement, revision, or removal planning against the active PRD namespace

## Stop Rule

- Stop after the design docs are created or updated.
- Do not draft a plan as part of the request-to-design workflow.

## Validation Checklist

Before closing the task, confirm:

1. The output lives in `docs/designs/` and follows `YYYY-MM-DD-<slug>.md` naming.
2. The generated design uses the required design template structure.
3. The create-vs-update choice is justified by the current design tree.
4. `## Design Lineage` is present when the design materially updates prior intent.
5. `## Intended Follow-On` includes both the route and the matching prompt link.
