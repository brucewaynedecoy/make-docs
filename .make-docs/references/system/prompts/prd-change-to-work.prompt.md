___
name: PRD Change to Work Backlog
description: Instructs the agent to generate a dated delta backlog from one or more PRD change docs and the baseline docs they affect.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please review these PRD change docs: {{CHANGE DOCS}}.

Also review the baseline PRD docs they affect: {{AFFECTED PRD DOCS}}.

Then generate a dated delta backlog in `docs/work/`. Follow the instructions, references, and templates in the `docs` directory, especially `.make-docs/references/system/prd-change-management.md`. The backlog should stay scoped to the requested change, remain dependency-ordered, and cite both the new change docs and the affected baseline docs in each phase's source-traceability section.
