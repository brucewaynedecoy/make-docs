# Delta Backlog and Closeout

## Purpose

Generate the paired work backlog and close the planning round with validation and a local plan commit.

## Required Work Outputs

- `docs/work/2026-06-23-w10-r4-template-package-dogfood-source-of-truth-contract/00-index.md`
- Phase files for requirements/register reconciliation, source ownership, dogfood/package copy behavior, and validation/closeout.

## Validation

- `git diff --check`
- `bash scripts/check-wave-numbering.sh`
- Touched-file local Markdown link check
- `mcp__jdocmunch.index_local` refresh after edits

## Commit

Use the plan commit convention:

```text
plan: [W10 R4] Template Package Dogfood Source of Truth Contract

Define the v2 source-of-truth contract between the shipped documentation template, this repository's dogfood `docs/` tree, and the npm package's bundled template copy.
```
