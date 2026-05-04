# 03 Open Questions and Risk Register

## Purpose

Capture drift, ambiguities, unresolved behavior, decisions, and rebuild risks that should remain visible instead of being buried inside subsystem docs.

Use this as the active PRD namespace's living register. When agents discover or resolve gaps, drift, open questions, risks, decisions, or closeout findings, update this document directly instead of creating a separate questions, decisions, risks, gaps, or architecture-decision file unless the user explicitly asks.

Each item under `## Confirmed Drift`, `## Open Questions`, and `## Rebuild Risks` should use one `###` heading, a state table, and the body fields below. Use `Open`, `Confirming`, `Deferred`, or `Closed` for `Status`. Add `Resolution` only when the item is closed.

```markdown
### <Gap, Question, Drift, or Risk Title>

| Status | Decision | Follow-Up |
| --- | --- | --- |
| Open | None yet | <next action or owner/path> |

**Question** or **Issue**: <what needs to be answered, corrected, or tracked>

**Why it matters**: <impact on rebuild, maintenance, users, release, or future work>

**Recommendation**: <current recommendation or "None yet">

**To close**: <evidence, decision, or implementation needed to close the item>
```

## Confirmed Drift

List code-versus-doc or code-versus-behavior mismatches that are verified.

Code anchors:

- `{{DRIFT_PATHS}}`

## Open Questions

List unanswered questions and unresolved decisions that matter for a faithful rebuild or future maintenance.

Code anchors:

- `{{QUESTION_PATHS}}`

## Rebuild Risks

List the places where a clean-room rebuild is likely to go wrong without careful constraints.

Code anchors:

- `{{RISK_PATHS}}`

## Source Anchors

- `{{PRIMARY_FILES}}`
