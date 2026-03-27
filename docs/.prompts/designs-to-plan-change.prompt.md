___
name: Designs to Plan Change
description: Instructs the agent to review one or more design docs and generate a change plan for the active PRD namespace.
___

Please read the design docs {{DESIGN DOCS}} and inspect each doc's `## Intended Follow-On` section before planning.

Confirm that the referenced design docs point to the `change-plan` route. If they point to `baseline-plan`, use the baseline planning prompt instead unless the user explicitly instructs otherwise.

Then inspect the active PRD namespace in `docs/prd/` and create a detailed change plan in `docs/plans/`. Follow the instructions, references, and templates in the `docs` directory, especially `docs/.references/prd-change-management.md`.

The plan should classify the request as an addition, enhancement, revision, or removal; identify the impacted baseline docs; define the new PRD change docs that should be created; define the required baseline annotations; and state whether a scoped delta backlog is sufficient.
