___
name: Request to Design
description: Instructs the agent to turn a user request into a design doc by updating an existing related design or creating a new dated design doc.
___

Please review the request below and then either generate or update a design doc for the request.

Before writing anything, inspect `docs/designs/` for related design docs. If a related design clearly covers the same decision area, update it. Otherwise create a new dated design doc in `docs/designs/`.

Follow the instructions, references, and templates in the `docs` directory, especially `.make-docs/references/system/design-workflow.md`, `.make-docs/contracts/system/design-contract.md`, and `.make-docs/templates/system/design.md`.

The resulting design doc should include an explicit `## Intended Follow-On` section with either `baseline-plan` or `change-plan` and the matching prompt link. Do not create a plan as part of this workflow.

Here is the request:

{{REQUEST}}
