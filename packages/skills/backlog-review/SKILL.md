---
name: backlog-review
description: Review all Make Docs work records and explain current focus, attention, and recommended order. Use when a user asks to review, summarize, triage, or report on a Make Docs backlog.
---

# Backlog Review

Review the full Make Docs work portfolio. Give the maintainer a short report that shows what matters now and keeps exact evidence within reach. Do not change backlog records during the review.

## Review method

Read [the review method](references/review-method.md) and [the report model](references/report-model.md). Use one fact source in this order:

1. Call the compatible MCP tool `make_docs_work_backlog_snapshot`.
2. If that tool is not available, run `make-docs run work backlog snapshot --target-root <project-root> --json`.
3. If neither deterministic surface is available, use [the portable fallback](references/fallback.md).

State which method supplied the facts. Do not say that the deterministic operation ran when the fallback supplied the facts. Do not use Store access. Do not use file age alone to set priority.

Build one report record for every discovered live and archived record. Give each live record exactly one `waveStatus`. Give every record a clear `statusReason` with source evidence. Keep report findings separate from wave status.

Use the six fixed live statuses only: `attention`, `current`, `conflict`, `deferred`, `complete`, and `history`. Archived records use a null status and remain in the archived tally.

Lead the chat report with current focus, **Next**, and needs attention. Separate facts, inferences, and recommendations. Omit empty sections. Keep material limits visible. Link to repository-relative sources.

When a tool returns an error, warning, or material limit, explain it in natural language. Name the subject, what happened, why it matters now, what remains known or unknown, the next useful action, and whether human action is required, optional, or not needed. Keep exact codes and raw details as secondary evidence. Never soften or hide the machine result.

Read [the rule map](references/rule-map.md) when changing review logic. Read [the chat examples](examples/chat-reports.md) when the report size or conflict density makes the layout unclear. The examples are patterns, not fixed prose.
