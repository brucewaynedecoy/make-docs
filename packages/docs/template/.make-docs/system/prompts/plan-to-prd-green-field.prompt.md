___
name: Plan to PRD (Green Field)
description: Instructs the agent to generate a comprehensive set of PRD documents based from a specific plan document. Agent will automatically determine if parallel agents are needed, based on scope and complexity. If there are already requirements documents in `docs/prd`, they will be archived in a dated sub-folder (per agent instructions in `AGENTS.md` and `CLAUDE.md`).
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Read `make-docs://system/contract/human-experience-contract.md`, `make-docs://system/reference/human-experience.md`, and `make-docs://system/reference/lifecycle.md` through valid local bodies or `make-docs resource read`. Reconcile the plan's local human outcome with current product authority. Put each observable outcome or preserved boundary in the PRD that owns the affected surface. Preserve links to the source design, plan, and W/R coordinate. Keep the planned proof or current testing decision, its selected executor, and any accepted obligation route traceable for downstream work. Do not copy the full design intent or Human Experience Standard into the PRD set. Do not add Human Experience frontmatter.

I think we're ready to create the PRD documents in `docs/prd`.  Please be as detailed as possible.  Follow the instructions, references, and templates provided to you in the `docs` directory (and appropriate child directories) on how to do this.  The resulting PRD set should be a comprehensive design based on the details you captured in the {{PLAN DOC}} plan doc.
