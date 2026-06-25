---
title: "W16 R1 P2 Metadata Schema and Templates"
kind: "history"
status: "completed"
date: "2026-06-25"
coordinate: "W16 R1 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Added generated-document metadata to templates and prompt guidance."
---

# W16 R1 P2 Metadata Schema and Templates

## Changes

Completed W16 R1 Phase 2 by adding PRD 23 generated-document metadata to the package-source and dogfood system templates, updating generator prompts so new or materially rewritten make-docs documents include common frontmatter and applicable conditional fields, and adding focused consistency fixtures for generated-template metadata and prompt guidance.

### Coverage Decisions

- PRD coverage: no new PRD update was needed. [PRD 23](../../../prd/23-revise-generated-metadata-lifecycle-handoffs.md) already owns the generated metadata field contract, and this phase implements that contract in templates and prompt guidance.
- Developer-guide coverage: no developer guide was needed. This phase changes internal template and prompt behavior that is covered by package consistency tests.
- User-guide coverage: no user guide was needed. No current end-user workflow changes in this phase.
- UAT: deferred until the full W16 R1 wave is complete, per the active wave instruction.

### Validation

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/02-metadata-schema-and-templates.md --json`
- `npm test -w packages/cli -- consistency.test.ts --reporter=dot`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for modified and untracked Markdown files, excluding intentional template scaffold links.
- `jdocmunch.index_local`
- `jcodemunch.index_folder`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [.make-docs/templates/system/](../../../../.make-docs/templates/system/) | Added PRD 23 frontmatter to root dogfood generated-document templates. |
| [.make-docs/references/system/prompts/](../../../../.make-docs/references/system/prompts/) | Added generated-document metadata guidance to root dogfood prompt starters. |
| [docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/02-metadata-schema-and-templates.md](../../../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/02-metadata-schema-and-templates.md) | Marked Phase 2 complete and recorded implementation evidence. |
| [docs/assets/archive/history/2026-06-25-w16-r1-p2-metadata-schema-and-templates.md](2026-06-25-w16-r1-p2-metadata-schema-and-templates.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [packages/docs/template/.make-docs/templates/system/](../../../../packages/docs/template/.make-docs/templates/system/) | Added PRD 23 frontmatter to package-source generated-document templates. |
| [packages/docs/template/.make-docs/references/system/prompts/](../../../../packages/docs/template/.make-docs/references/system/prompts/) | Added prompt guidance requiring PRD 23 metadata for generated make-docs documents. |
| [packages/cli/tests/consistency.test.ts](../../../../packages/cli/tests/consistency.test.ts) | Added metadata fixture coverage for generated templates and prompt guidance. |

### User

None this session.
