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
  - `baseline-plan` → `make-docs://system/prompt/designs-to-plan.prompt.md`
  - `change-plan` → `make-docs://system/prompt/designs-to-plan-change.prompt.md`
- Resolve the selected prompt with `make-docs resource read <uri>`. Do not require a local projection.
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

## Human Experience Intent and Validation

Use the [Human Experience Contract](../contracts/human-experience-contract.md) and [reference](human-experience.md) before drafting the intent. Classify the proposed change, not the act of reading a design. Resolve configured human Personas or clear human roles. State the goal before internal detail. Use observable promises and planned evidence. Stop for a missing product choice when no coherent human path follows from accepted authority.

The contract applies to new generated designs and substantial agent-authored updates. The authoring context selects this rule. Do not infer activation from dates, names, Git status, or diff size. An older design with a minor edit does not need a new section. If a section exists, check its form.

For maintainers and internal callers, the existing `validateGeneratedDocumentMetadata(markdown, { sourcePath, humanExperienceMode: "required" })` call checks the required section as well as existing metadata. Select this mode explicitly for new or substantial design work. The default `if-present` mode preserves historical documents without a section. The dedicated `validateDesignBody(markdown, "required")` helper checks only the design body. These are internal TypeScript APIs, not new CLI or MCP commands. Consumer agents apply the same contract by review; do not tell them to import maintainer source from their project.

The internal closeout helpers accept `humanExperienceRequiredPaths`, a list of project-relative changed design paths selected by the authoring context. They inspect other changed designs in `if-present` mode. This list does not expand the selected Git scope or certify unchanged, missing, or deleted files. Call the document validator directly for work outside that scope. Do not treat an empty closeout findings list as proof that the author selected required mode or that the result is good for people.

Review misleading headless and `none` claims against their human effect. Structural checks cannot judge their meaning. Reuse suitable evidence for per-promise Human Experience Review and retain the reviewer's limits.
