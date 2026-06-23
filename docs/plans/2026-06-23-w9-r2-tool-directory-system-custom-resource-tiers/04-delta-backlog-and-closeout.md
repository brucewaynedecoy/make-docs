# Delta Backlog and Closeout

## Purpose

Generate the paired work backlog and close this planning round with validation and a local plan commit.

## Required Work Outputs

- `docs/work/2026-06-23-w9-r2-tool-directory-system-custom-resource-tiers/00-index.md`
- Phase files for requirements/register reconciliation, directory/tier implementation, migration/validation, and closeout.

## Validation

- `git diff --check`
- `bash scripts/check-wave-numbering.sh`
- Touched-file local Markdown link check
- `mcp__jdocmunch.index_local` refresh after edits

## Commit

Use the plan commit convention:

```text
plan: [W9 R2] Tool Directory System and Custom Resource Tiers

Define the v2 in-project tool directory model for make-docs-owned resources.
```
