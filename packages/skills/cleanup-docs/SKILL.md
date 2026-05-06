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
2. Run `python3 scripts/check_markdown_style.py <scope>` from this skill to gather deterministic formatting findings.
3. Review the scoped documents for contract fit: required headings, task/acceptance shape, links, frontmatter, and local style.
4. Clean only clear formatting drift:
   - unwrap only top-level prose that was hard-wrapped for visual width;
   - insert one blank line between a list and following paragraph text;
   - manually review wrapped list-item continuations instead of auto-fixing them;
   - preserve headings, lists, list indentation, tables, blockquotes, code fences, frontmatter, and intentional line-based formats.
5. Report files changed, issues left unchanged, and any contract violations that need separate design, plan, or work follow-up.

## Script Notes

- Default script mode is report-only.
- Use `--format json` when the agent needs structured findings.
- Use `--fix` only after preview confirmation; fix mode is conservative and limited to top-level prose unwrapping and missing blank lines after list blocks.
- Fix mode must not unwrap YAML frontmatter, fenced code blocks, or text inside list items. Treat list indentation as semantic.
