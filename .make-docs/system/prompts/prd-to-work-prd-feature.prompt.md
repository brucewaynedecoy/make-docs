___
name: PRD to Work (for Single PRD Feature)
description: Instructs the agent to generate a work backlog document or set of documents for a single requirement document from the PRD set. Generally, a requirement document encapsulates a single feature or epic.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Read `make-docs://system/contract/human-experience-contract.md`, `make-docs://system/reference/human-experience.md`, and `make-docs://system/reference/lifecycle.md` through valid local bodies or `make-docs resource read`. For each applicable current PRD outcome or preserved boundary, create work tasks and observable acceptance criteria that retain the intended human outcome, owning requirement, affected surface, source design and plan lineage, and W/R coordinate. Name the evidence source or current testing decision and its selected executor when current authority has selected one. Route accepted deferral through the current obligation contract. Do not copy the full design intent or Human Experience Standard into the backlog. Do not add Human Experience frontmatter.

Please review the requirement document {{REQUIREMENT DOC}} to understand the requirements for the specific epic or feature captured in that document. Then generate a document (or possibly documents) for our work backlog in `docs/work/`.  Follow the instructions, references, and templates provided to you in the `docs` directory (and appropriate child directories) on how to do this.
