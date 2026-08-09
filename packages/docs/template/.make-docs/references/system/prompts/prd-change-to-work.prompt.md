___
name: PRD Authority Maintenance to Work Backlog
description: Instructs the agent to generate a dated delta backlog from the updated authoritative PRDs and their governing maintenance plan.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please review the approved PRD authority-maintenance plan: {{CHANGE PLAN DOC}}.

Then review the updated or genuinely new authoritative PRDs that own the resulting requirements: {{AUTHORITATIVE PRD DOCS}}.

Generate a dated delta backlog in `docs/work/`. Follow the instructions, references, and templates in the `docs` directory, especially `.make-docs/references/system/prd-change-management.md`. The backlog should stay scoped to the requested maintenance, remain dependency-ordered, and cite the updated authoritative PRDs in each phase's source-traceability section. Use the maintenance plan for sequencing and scope provenance only. Treat current normative PRD sections as product authority; do not treat requirement-history entries or retired change records as effective requirements.
