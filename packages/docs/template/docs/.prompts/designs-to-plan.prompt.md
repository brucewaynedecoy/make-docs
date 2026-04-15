___
name: Design to Plan
description: Instructs the agent to review referenced design docs and then generate a detailed plan.
___

Please read the design docs {{DESIGN DOCS}} and inspect each doc's `## Intended Follow-On` section before planning.

Confirm that the referenced design docs point to the `baseline-plan` route. If they point to `change-plan`, use the change-planning prompt instead unless the user explicitly instructs otherwise.

Then help me create a detailed plan document in `docs/plans` to implement this design idea.
