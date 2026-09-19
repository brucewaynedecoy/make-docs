___
name: Request to Design
description: Instructs the agent to turn a user request into a design doc by updating an existing related design or creating a new dated design doc.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please review the request below and then either generate or update a design doc for the request.

Before writing anything, inspect `docs/designs/` for related design docs. If a related design clearly covers the same decision area, update it. Otherwise create a new dated design doc in `docs/designs/`.

Follow the instructions, references, and templates in the `docs` directory, especially `.make-docs/system/references/design-workflow.md`, `.make-docs/system/contracts/design-contract.md`, and `.make-docs/system/templates/design.md`.

Read `make-docs://system/contract/human-experience-contract.md` and `make-docs://system/reference/human-experience.md` through a valid local body or `make-docs resource read`. Use their conditional intent form once, after Context and before Decision. Classify the change's effect, resolve human roles or configured Personas, and state the goal and observable promises before internal detail. Name evidence as planned work. If current authority cannot support a coherent human path, stop for the missing product choice. Follow the design workflow's required-validation route for new and substantial design work; do not force older or minor-edited designs into a rewrite.

The resulting design doc should include an explicit `## Intended Follow-On` section with either `baseline-plan` or `change-plan` and the matching prompt link. Do not create a plan as part of this workflow.

Here is the request:

{{REQUEST}}
