___
name: Designs to PRD Authority Maintenance Plan
description: Instructs the agent to review one or more design docs and plan surgical maintenance of the active product authority.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please read the design docs {{DESIGN DOCS}} and inspect each doc's `## Intended Follow-On` section before planning. If a design includes `Coordinate Handoff`, use it as the starting point for W/R resolution.

Confirm that the referenced design docs point to the `change-plan` route. If they point to `baseline-plan`, use the baseline planning prompt instead unless the user explicitly instructs otherwise.

Then inspect the active PRD namespace in `docs/prd/` and create a detailed PRD authority-maintenance plan in `docs/plans/`. Follow the instructions, references, and templates in the `docs` directory, especially `.make-docs/references/system/wave-model.md` and `.make-docs/references/system/prd-change-management.md`.

Resolve the plan coordinate before writing. Source lineage from the user request, design handoff, prior plans, prior work backlogs, and history records takes precedence over the highest existing wave. If the change revises, reworks, corrects, standardizes, or finishes work delivered in an earlier wave, keep that wave and use the next unused revision.

For every candidate requirement, select `update-existing`, `create`, `link-only`, or `none`. The plan must list existing PRD owners to update; genuinely new product PRDs, if any; required non-normative `## Requirement History` entries; and affected links, risks, plans, and work artifacts. Record the plan coordinate and state whether a scoped delta backlog is sufficient. Do not plan standalone PRDs whose subject is an editorial operation.
