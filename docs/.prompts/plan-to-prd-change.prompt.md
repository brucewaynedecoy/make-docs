___
name: Plan to PRD Change
description: Instructs the agent to execute an approved change plan by appending change docs to the active PRD namespace and updating affected baseline docs non-destructively.
___

Please review the approved change plan {{CHANGE PLAN DOC}} and then execute it against the active PRD namespace in `docs/prd/`.

Follow the instructions, references, and templates in the `docs` directory, especially `docs/.references/prd-change-management.md`. Append the required new change docs using the next available numbers, update the impacted baseline docs with the required `### Change Notes` backlinks, and update `docs/prd/00-index.md` so status and lineage are clear. Do not renumber or reorder existing PRD docs, and do not perform a cleanup rewrite unless the plan or the user explicitly asks for it.
