___
name: Design to Plan
description: Instructs the agent to review referenced design docs and then generate a detailed plan.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please read the design docs {{DESIGN DOCS}} and inspect each doc's `## Intended Follow-On` section before planning. If a design includes `Coordinate Handoff`, use it as the starting point for W/R resolution.

Confirm that the referenced design docs point to the `baseline-plan` route. If they point to `change-plan`, use the change-planning prompt instead unless the user explicitly instructs otherwise.

Then help me create a detailed plan document in `docs/plans` to implement this design idea. Follow `.make-docs/references/system/wave-model.md` and record the coordinate decision in the plan.
