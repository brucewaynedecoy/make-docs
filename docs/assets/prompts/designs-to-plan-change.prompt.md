___
name: Designs to Plan Change
description: Instructs the agent to review one or more design docs and generate a change plan for the active PRD namespace.
___

Please read the design docs {{DESIGN DOCS}} and inspect each doc's `## Intended Follow-On` section before planning. If a design includes `Coordinate Handoff`, use it as the starting point for W/R resolution.

Confirm that the referenced design docs point to the `change-plan` route. If they point to `baseline-plan`, use the baseline planning prompt instead unless the user explicitly instructs otherwise.

Then inspect the active PRD namespace in `docs/prd/` and create a detailed change plan in `docs/plans/`. Follow the instructions, references, and templates in the `docs` directory, especially `docs/assets/references/wave-model.md` and `docs/assets/references/prd-change-management.md`.

Resolve the plan coordinate before writing. Source lineage from the user request, design handoff, prior plans, prior work backlogs, and history records takes precedence over the highest existing wave. If the change revises, reworks, corrects, standardizes, or finishes work delivered in an earlier wave, keep that wave and use the next unused revision.

The plan should classify the request as an addition, enhancement, revision, or removal; record the coordinate decision; identify the impacted baseline docs; define the new PRD change docs that should be created; define the required baseline annotations; and state whether a scoped delta backlog is sufficient.
