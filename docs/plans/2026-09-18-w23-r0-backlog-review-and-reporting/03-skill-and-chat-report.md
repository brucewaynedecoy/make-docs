---
title: "W23 R0 P3 Skill and Chat Report"
kind: "plan"
status: "draft"
coordinate: "W23 R0 P3"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W23 R0 P3 Skill and Chat Report

## Purpose

Build the first-party Skill that interprets snapshot facts and produces the default concise in-chat review.

## Outcome

The `backlog-review` Skill works from MCP, CLI, or the honest agentic fallback. It produces a stable report model and an easy-to-scan chat review that separates facts, inferences, recommendations, and limits.

## Scope

- Author the Skill entrypoint, routing instructions, references, examples, and fallback method under `packages/skills/backlog-review/`.
- Use MCP first when the compatible tool exists, then CLI, then the documented fallback.
- Record which method supplied the facts.
- Translate every received tool error, warning, or material limit into a natural human explanation that names its context, effect on the request, evidence limit, next useful action, and whether the user must act.
- Keep raw errors, diagnostic codes, stack traces, and internal identifiers as secondary evidence. Do not use them as the primary explanation or assume that the user knows Make Docs internals.
- Preserve the full severity and meaning of the machine result. Natural language must not hide a failure, risk, limit, or required action.
- Assign exactly one fixed `waveStatus` and one evidence-backed `statusReason` to each included wave.
- Assign a fixed `waveStatus` to every live record before calculating the four portfolio tallies.
- Report work records found, records in scope, historical records, and archived records from the full portfolio.
- Implement current-focus, closeout-needed, blocked or conflicted, paused or superseded, historical, and recommended-order sections.
- Keep empty sections out of the default report.
- Keep exact evidence available through repository-relative links and compact detail.
- Build the shared report model that the HTML template also consumes.
- Add paired deterministic-agentic fixtures and change-review checks.
- Verify required agent-response meaning without requiring one fixed sentence or style.

## Interpretation Rules

- Current priority comes from accepted authority, explicit status, dependencies, current work evidence, and owner direction. Age alone is not enough.
- Historical classification is an inference and retains its source facts.
- Recommendation order explains why one item should precede another.
- Conflicts stay visible until authority resolves them.
- The Skill never writes backlog status as part of review.
- `waveStatus` uses only `attention`, `current`, `conflict`, `deferred`, `complete`, or `history`.
- `statusReason` remains flexible agent-written text and cannot change filter membership or semantic color.
- Report-level attention findings do not change a wave's status.
- Summary or detail selection does not change portfolio totals.
- Work records found must equal records in scope plus historical and archived records.

## Verification

- Chat output remains readable with small, medium, and large fixture sets.
- Every material claim can reach its supporting facts.
- Chat examples use the same fixed wave status and status reason as the shared report model.
- Chat examples use the four fixed tally labels and satisfy the tally invariant.
- The fallback makes no false deterministic-run claim.
- Changes to mapped rules trigger twin review.
- Guided Progress Review confirms that the summary and detail balance supports the current decisions.
