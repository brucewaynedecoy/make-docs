---
name: backlog-review
description: Review all Make Docs work records and explain current focus, attention, and recommended order. Use when a user asks to review, summarize, triage, or report on a Make Docs backlog.
---

# Backlog Review

Review the full Make Docs work portfolio. Give the maintainer a short report that shows what matters now and keeps exact evidence within reach. Do not change backlog records during the review.

## Review method

Read [the review method](references/review-method.md), [the report model](references/report-model.md), and [the cache workflow](references/cache.md). Start every review with one fact source in this order:

1. Call the compatible MCP tool `make_docs_work_backlog_snapshot`.
2. If that tool is not available, run `make-docs run work backlog snapshot --target-root <project-root> --json`.
3. If neither deterministic surface is available, use [the portable fallback](references/fallback.md).

State which method supplied the facts. Do not say that the deterministic operation ran when the fallback supplied the facts. Do not use file age alone to set priority.

After a deterministic snapshot succeeds, try the optional cache lookup. Use the compatible MCP cache tool first. Use the cache CLI only when that MCP tool is unavailable. Reuse only returned `hit` fragments. Review every `miss` and `rejected` record from the current snapshot. Rebuild all tallies, attention findings, order, and other portfolio conclusions from the full current snapshot and the combined record set.

A cache refusal or failure must not block the report. Complete the full stateless review. Explain the effect in natural language only when it matters. After the full report model validates, attempt a cache write for every freshly reviewed `miss` or `rejected` record when the cache lookup succeeded. Do not write when every record was an exact hit. A denied or failed write affects only later reuse and does not change the completed report.

Build one report record for every discovered live and archived record. Give each live record exactly one `waveStatus`. Give every record a clear `statusReason` with source evidence. Keep report findings separate from wave status.

Give every Next item one `recordPath` that matches exactly one report record. An Attention item can use one exact report `recordPath` or null. Null means a backlog-wide finding. Validate these references before writing chat or HTML. Show the matched wave coordinate outside agent-written claim text. Use the same visible hierarchy for Next and Attention: sourced coordinate or `Backlog finding` as compact metadata, then the claim as the main heading. Do not repeat the item's own wave coordinate in its claim only to identify the item. Use a local phase label such as `P5` for a phase in the displayed wave. Use another wave's full coordinate when that relationship matters. Label a null Attention item `Backlog finding`.

Use the six fixed live statuses only: `attention`, `current`, `conflict`, `deferred`, `complete`, and `history`. Archived records use a null status and remain in the archived tally.

Build the project lead from bounded project-summary context before you write report prose. Run `scripts/collect-project-lead-context.mjs` with the project root and up to three report records that represent the current focus. Use only the returned excerpts for the lead. Write two or three source-backed sentences that state what the project is and its current status or objective. Do not mention report counts, backlog totals, filters, sorting, search, or instructions for using the report. Do not add unsupported project details. When the context packet does not contain both project purpose and current status or objective, set `projectLead` to null and explain the omission to the user. Never invent a generic lead.

Lead the chat report with current focus, **Next**, and **Attention**. Show the linked wave coordinate for every Next item and every wave-specific Attention item. Label a backlog-wide Attention item `Backlog finding`. Separate facts, inferences, and recommendations. Omit empty sections. Keep material limits visible. Link to repository-relative sources.

Create an HTML report only when the user asks for it. Read [the HTML report guide](references/html-report.md), confirm the exact output path, and render the same normalized report model with the bundled renderer. The result must be one offline `.html` file. Do not create a site or keep a hidden report copy. The report may expose its own embedded model through the Backlog Data tab and its user-started JSON download. Ask before replacing an existing file.

When a tool returns an error, warning, or material limit, explain it in natural language. Name the subject, what happened, why it matters now, what remains known or unknown, the next useful action, and whether human action is required, optional, or not needed. Keep exact codes and raw details as secondary evidence. Never soften or hide the machine result.

Read [the rule map](references/rule-map.md) when changing review logic. Read [the chat examples](examples/chat-reports.md) when the report size or conflict density makes the layout unclear. The examples are patterns, not fixed prose.
