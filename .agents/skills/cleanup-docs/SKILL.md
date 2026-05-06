---
name: cleanup-docs
description: Inspect and clean Markdown documentation formatting drift under docs/. Use when the user wants docs audited or fixed for hard-wrapped prose, missing blank lines after lists, spacing drift, or document-contract conformance.
---

# Cleanup Docs

Use this skill to audit and clean Markdown documentation while preserving the repository's document contracts.

## Scope

- If the user did not provide a scope, ask which files or directories to inspect. Suggest one or more specific documents, one or more directories, or all of `docs/`.
- If the user provided instructions, infer scope from named files, named directories, or phrases such as "all docs", "active docs", "guides", "plans", "work backlog", or "this phase".
- Before editing, preview the inferred scope and the issue classes found. Edit only after confirmation unless the user explicitly asked for immediate cleanup.

## Workflow

1. Read the nearest `AGENTS.md` or `CLAUDE.md` and the relevant contract/template references for the scoped document type.
2. Run `python3 scripts/check_markdown_style.py --format json <scope>` from this skill to gather deterministic formatting findings.
3. Review a deterministic cross-file sample of findings before fixing: inspect up to 10 findings or 10% of findings, whichever is larger, capped at 25.
4. If the sample has no false positives, run `python3 scripts/check_markdown_style.py --fix <scope>`.
5. If the sample has false positives, divide findings into batches of 10 and spawn worker agents for manual review and repair; when spawning is unavailable, review batches serially.
6. Review the scoped documents for contract fit: required headings, task/acceptance shape, links, frontmatter, and local style.
7. Clean only clear formatting drift:
   - insert one blank line between adjacent Markdown blocks;
   - unwrap only top-level prose paragraphs that were hard-wrapped for visual width;
   - manually review wrapped list-item continuations instead of auto-fixing them;
   - preserve headings, lists, list indentation, tables, blockquotes, code fences, frontmatter, comments, and intentional line-based formats.
8. Report files changed, issues left unchanged, and any contract violations that need separate design, plan, or work follow-up.

## Script Notes

- Default script mode is report-only.
- Use `--format json` when the agent needs structured findings.
- Findings are ordered so block-boundary issues come before paragraph wrapping issues.
- Use `--fix` only after sample review; fix mode first inserts missing blank lines between blocks, then unwraps top-level prose paragraphs.
- Fix mode must not unwrap YAML frontmatter, fenced code blocks, comments, tables, blockquotes, or text inside list items. Treat list indentation as semantic.
