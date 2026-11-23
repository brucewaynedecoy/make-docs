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

## Check and Repair

Use the first way that works, for the check and for the repair:

1. MCP tool: when the session has the Make Docs tools, call `project_markdown_validate` with the scope as `paths`. To see the planned repair, call `project_markdown_repair` with the same `paths` and `allowWrite: true`, without `apply`. It writes nothing. To write the changes, call it again and add `apply: true`.
2. CLI: otherwise run `make-docs project markdown validate --path <scope>`. Give `--path` once for each file or folder. To repair, run `make-docs project markdown repair --path <scope>` to see the planned changes, then add `--apply` to write them.
3. Manual review: otherwise check each rule in [Formatting Rules](#formatting-rules) by hand, and name the rule ID of each problem that you find.

A manual result says that it is a manual review and uses the proof state `agent-reviewed`. It does not say that a Make Docs check ran. Do not install the CLI or any other tool without the person's consent. A manual repair needs the person's agreement before you change a file.

The tool and the command skip `AGENTS.md` and `CLAUDE.md` routers, files that hold a Make Docs managed block, and protected folders such as `.make-docs/archive`, and they name each skipped file. Do not repair those files by hand either: `make-docs setup` owns them.

## Workflow

1. Read the nearest `AGENTS.md` or `CLAUDE.md` and the relevant contract/template references for the scoped document type.
2. Check the scope as [Check and Repair](#check-and-repair) says, to gather formatting findings.
3. Review a deterministic cross-file sample of findings before fixing: inspect up to 10 findings or 10% of findings, whichever is larger, capped at 25.
4. If the sample has no false positives, run the repair: preview the planned changes, then apply them.
5. If the sample has false positives, divide findings into batches of 10 and spawn worker agents for manual review and repair; when spawning is unavailable, review batches serially.
6. Review the scoped documents for contract fit: required headings, task/acceptance shape, links, frontmatter, and local style.
7. Clean only clear formatting drift under the [Formatting Rules](#formatting-rules). Preserve headings, lists, list indentation, tables, blockquotes, code fences, frontmatter, comments, and intentional line-based formats.
8. Report files changed, issues left unchanged, and any contract violations that need separate design, plan, or work follow-up.

## Formatting Rules

These rules are the agent form of the Make Docs Markdown style check. The tool and the command check the same rules, and each finding names one of these rule IDs. A change to a rule here needs the same change in the check, and the reverse.

| Rule ID | Repair fixes it | Rule |
| --- | --- | --- |
| `markdown-style.block-spacing` | Yes | Put one blank line between two adjacent Markdown blocks, such as a heading and a paragraph, or a list and a code fence. |
| `markdown-style.paragraph-wrap` | Yes | Write a top-level prose paragraph on one source line. Join its lines with one space. |
| `markdown-style.list-continuation-wrap` | No | A list item goes on to an indented next line. Review it by hand. Do not auto-fix it. |

## Repair Notes

- A check only reads. A repair writes only after you preview it and apply it.
- Findings are ordered so `markdown-style.block-spacing` findings come before `markdown-style.paragraph-wrap` findings.
- Use the repair only after sample review. It first inserts missing blank lines between blocks, then unwraps top-level prose paragraphs.
- The repair must not unwrap YAML frontmatter, fenced code blocks, comments, tables, blockquotes, or text inside list items. Treat list indentation as semantic.
- The repair keeps each file's line endings.
