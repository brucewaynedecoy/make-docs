___
name: Plan to PRD Authority Maintenance
description: Instructs the agent to execute an approved maintenance plan by surgically updating the active product authority.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please review the approved PRD authority-maintenance plan {{CHANGE PLAN DOC}} and then execute it against the active PRD namespace in `docs/prd/`.

Follow the instructions, references, and templates in the `docs` directory, especially `.make-docs/references/system/prd-change-management.md`. Update current normative requirements inline in their existing owners. Create a new numbered PRD only for a coherent, wholesale new capability, subsystem, or product boundary with no suitable owner. Add standardized, non-normative `## Requirement History` entries for material prior contracts, update the risk register and index where needed, and record `none` decisions outside the active PRD tree. Do not create addition, enhancement, revision, removal, migration, or reconciliation PRDs. Do not renumber existing PRDs. PRD document identity is the product subject, not W/R; carry the plan coordinate only in source links and requirement-history entries.
