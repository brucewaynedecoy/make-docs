___
name: PRD to Work Backlog (Full PRD Set)
description: Instructs the agent to generate a work backlog document or set of documents from the full PRD.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Read `make-docs://system/contract/human-experience-contract.md`, `make-docs://system/reference/human-experience.md`, and `make-docs://system/reference/lifecycle.md` through valid local bodies or `make-docs resource read`. For each applicable current PRD outcome or preserved boundary, create work tasks and observable acceptance criteria that retain the intended human outcome, owning requirement, affected surface, source design and plan lineage, and W/R coordinate. Name the evidence source or current testing decision and its selected executor when current authority has selected one. Route accepted deferral through the current obligation contract. Do not copy the full design intent or Human Experience Standard into the backlog. Do not add Human Experience frontmatter.

Please generate a work backlog based on what's in the PRD set (in `docs/prd/`).  We will need a work backlog document or documents (in `docs/work/`) for a full implementation of all of the features.  Follow the instructions, references, and templates provided to you in the `docs` directory (and appropriate child directories) on how to do this.
