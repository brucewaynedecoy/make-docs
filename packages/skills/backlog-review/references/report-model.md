# Report Model

Use report schema version `1`. Preserve the complete source snapshot in the report. Do not remove records to make the chat shorter.

Keep `BacklogReportV1` unchanged. A separate `BacklogLiveEnvelopeV1` wraps the validated report and its live identities. The envelope does not change report facts or authorize an action. Its definitions exist in `packages/cli/src/operations/work/backlog/live-contracts.ts`. Use the shared report boundary for static output, concise chat data, and the live payload. Production delivery and live UI behavior remain planned work for later phases.

## Shared model and payloads

Validate the complete V1 report before building any presentation. Use the same normalized report for the static renderer, full client payload, Data view, and user-started JSON download. A shorter model-visible summary does not reduce the full report's records, tallies, findings, order, or limits.

Keep the portable static validator generated from the shared contracts. Static and live boundaries must enforce the same report rules. Keep facts, inferences, recommendations, and cache fragments distinct. Filters, search, sort, theme, active tab, and disclosure state remain local display choices. They do not become report authority.

Use concise `structuredContent` for model-visible orientation. Use the full live envelope as client payload in `_meta`. Client-only transport placement is not secure storage. The host and client can read that data. It must not be treated as secret. The live payload builder returns data. It does not write a saved report, call a host, or prove that a widget opened.

Session and action versions remain separate from report schema version. A breaking report change requires a new report version, migration rule, and compatibility and meaning-parity fixtures. P3 requires no report migration.

P4 uses this payload boundary in the shared open operation. The MCP adapter validates the registered result schema and preserves `content`, `structuredContent`, and `_meta`. It does not copy the full client report into generic text narration. P5 uses the same normalized model and accepted static presentation in the full local widget. Local controls and inbound state feedback do not change report conclusions. P6 calls, messages, and task actions remain planned. A synthetic browser view is not production host or installed proof.

## Report fields

The report contains:

- `schemaVersion`, `generatedAt`, `targetRoot`, and `project`;
- `projectLead`, or an explicit null value when supported project-summary context is not available;
- the unchanged source `snapshot`;
- `tallies`;
- one report `records` item for every snapshot record;
- `attentionFindings`;
- `recommendationOrder`; and
- source diagnostics.

Each report record contains:

- `recordPath` and unchanged `scope`;
- unchanged `createdAt` and `lastUpdatedAt` facts;
- one fixed `waveStatus` for a live record, or null for an archived record;
- a nonempty `statusReason` and at least one `statusEvidence` link;
- `facts`;
- `inferences`; and
- `recommendations`.

Use repository-relative paths. Preserve line, field, and commit evidence when available. Keep report-layer evidence selective because the unchanged snapshot already preserves the full source record. Use one to three decisive references for `statusEvidence` and each fact. Use no more than five decisive references for an inference or recommendation. Remove duplicate references. Never copy a whole record's evidence catalog into one claim.

The wave display name is deterministic. Remove the exact wave coordinate prefix and the standard `Work Backlog` or `Work` document-type suffix from the sourced index title. Preserve the remaining recorded words and case. If a supported title is not available, derive the display name from the dated work-directory slug. Do not invent, expand, or summarize a wave name.

## Project lead

The project lead is a short project description. It is not a report summary or help text.

Before writing it, run:

```text
node <skill-root>/scripts/collect-project-lead-context.mjs --target-root <project-root> [--current-record <record-path>]...
```

Use one to three current-focus record paths from the normalized report. The collector uses a fixed source order. It prefers the product overview, then the root README, then the package description for project purpose. It uses an explicit current-status section in the PRD index when present. It uses `Purpose`, `Objective`, or `Overview` sections from the supplied current-focus records for the current objective. It returns bounded excerpts, repository-relative paths, headings, line locations, and file hashes.

`projectLead.sources` contains only those returned context items. `projectLead.sentences` contains exactly two or three items:

1. `purpose` states what the project is or does.
2. `currentStatus` or `currentObjective` states the present state or goal.
3. The optional final item uses the remaining current role.

Each sentence cites one to three source ids from its own role. Keep each sentence on one line and under 320 characters. Use only claims supported by the cited excerpts. Keep the language at the project level. Do not include backlog counts, report metrics, filter or sorting instructions, report-use help, or low-level implementation detail.

Good pattern:

> Make Docs gives software projects a structured documentation system and shared guidance for product work. Its current objective is to finish a reliable backlog-review experience that helps maintainers understand the project's present state and next work.

Bad pattern:

> Review of 70 work records. Use In Scope to focus on current work and All to review the full portfolio.

Set `projectLead` to null when the context packet lacks either purpose or current status or objective. Tell the user which supported context was missing. Do not invent replacement text. The HTML template hides the lead when this value is null.

## Fixed tallies

Use these field and display names:

| Field | Display label | Meaning |
| --- | --- | --- |
| `workRecordsFound` | work records found | Every live and archived record. |
| `workRecordsStillInScope` | records in scope | Live records whose status is not `history`. |
| `historicalRecords` | historical records | Live records whose status is `history`. |
| `archivedRecords` | archived records | Records from the archive work namespace. |

The invariant is:

`workRecordsFound = workRecordsStillInScope + historicalRecords + archivedRecords`

The report record count must equal `workRecordsFound`. Each snapshot path must appear exactly once with the same scope and date evidence.

Every `recommendationOrder` item is wave-specific. Its `recordPath` must match exactly one report record. Every `attentionFindings` item either uses one `recordPath` that matches exactly one report record or uses null for a backlog-wide finding. Reject a missing or dangling reference before chat or HTML rendering.

For chat and HTML, derive the visible wave coordinate from the matched report record and unchanged snapshot. Use the coordinate, or `Backlog finding`, as compact metadata. Use the claim as the item's main heading in both Next and Attention. Do not depend on the claim text to repeat the coordinate. Display a null Attention reference with the fixed label `Backlog finding`.

## Status rules

Only these live status values are valid:

- `attention`
- `current`
- `conflict`
- `deferred`
- `complete`
- `history`

Status controls filtering and semantic color. Reason supplies the visible explanation. A finding does not change status.

Keep `statusReason` compact. Use two to eight words when the evidence permits it. Do not write a sentence, repeat the wave name, or include evidence links in the reason.

Attention severity is deterministic presentation data. A finding for a `conflict` wave uses `error`. A finding for an `attention` wave uses `warning`. Every other record or backlog finding uses `info`. The severity changes the icon and its color. It does not change wave status.

## Claim rules

A fact needs evidence. An inference needs evidence, confidence, and limits. A recommendation needs rationale and limits. A recommendation can have no direct source only when its rationale names the supporting report facts.

Do not repeat an item's own wave coordinate in its claim only to identify the item. Use a local phase label such as `P5` for a phase in the displayed wave. Use another wave's full coordinate when that relationship is material. This rule keeps the sourced metadata and agent-written heading distinct without hiding a needed cross-wave reference.

Evidence stays in the normalized report data. The compact wave detail displays claim text only. It does not print evidence-link lists, confidence labels, rationale labels, or limit labels in the visual panel.

Recommendation ranks are unique and contiguous from one. Each visible Next item shows its matched wave coordinate as compact metadata outside the recommendation prose.

## Live identities

The live envelope contains `schemaVersion: 1`, `report`, `projectKey`, `snapshotId`, `modelId`, and `sessionId`.

| Identity | Meaning |
| --- | --- |
| `projectKey` | SHA-256 identity derived from the snapshot's resolved project root and nullable project ID. Store access is not required. |
| `snapshotId` | SHA-256 identity over stable JSON for the validated snapshot's source facts. |
| `modelId` | SHA-256 identity over stable JSON for the validated report, including its review conclusions. |
| `sessionId` | A new opaque UUID for each future live open. The caller supplies it. Tests can supply a fixed UUID. |

Exclude generation timestamps from snapshot and model identities. Retain source evidence times and other facts. A timestamp-only regeneration does not create a new identity. A source-fact change changes snapshot identity. A report-conclusion change changes model identity. These identities do not replace the existing cache identity or version rules.

Before an action, compare the envelope's project and snapshot identities with a current validated snapshot. Compare the message's model and session identities with the envelope. A valid schema alone does not prove that the reference is current.

## Fixed live actions

Strict schemas reject unknown fields. They accept no free-form instruction field. All actions use `schemaVersion: 1`.

| Action | Allowed fields after `schemaVersion` and `action` | Purpose |
| --- | --- | --- |
| `review-wave` | `sessionId`, `modelId`, `projectKey`, `snapshotId`, `recordPath`, `coordinate` | Ask the active agent to review one exact included wave. |
| `request-task` | `sessionId`, `modelId`, `projectKey`, `snapshotId`, `recordPath`, `coordinate` | Ask the active agent to start a separate task for that wave. The host performs task creation. |
| `review-backlog` | `sessionId`, `modelId`, `projectKey`, `previousSnapshotId`, `snapshotId`, `added`, `changed`, `removed` | Ask the active agent to review a changed snapshot. |

For wave actions, match one report `recordPath` and its sourced snapshot coordinate. Reject a missing path, stale identity, coordinate conflict, or ambiguous source reference. Never use title or claim text to recover a failed match.

For a refresh review request, match the previous snapshot to the reviewed envelope and the new snapshot to the current facts. Recompute the added, changed, and removed paths. Reject any difference from the request's exact lists. A global source-fact change can have empty record-change lists.

## Refresh states

The pure refresh contract compares the last reviewed envelope with the available current snapshot. It reads no files, uses no Store operation, and writes no cache.

| State | Identity and record changes | Review state and next action |
| --- | --- | --- |
| `unchanged` | The snapshot ID is unchanged. No record change exists. | `current`: keep the current validated model. |
| `changed` | Carry previous and current snapshot IDs plus exact `added`, `changed`, and `removed` path lists. | `needs-review`: retain the old model as the last reviewed result. Request a new agent review before treating its conclusions as current. |
| `unavailable` | Current source facts could not be read. Use `source-unavailable`, `source-denied`, or `source-unsafe` as the exact secondary reason. | `last-known`: retain the prior result with a clear source-access limit. Retry source access before claiming a current review. |

The refresh review request carries both snapshot IDs and all three exact change lists. The UI cannot write new conclusions itself. The agent reviews nonmatching records, rebuilds all portfolio conclusions, and validates the full report before opening a new model in a later phase.

Keep source failure separate from optional cache failure. A Store failure must not turn an available current snapshot into `unavailable`. Search, filter, sort, disclosure, theme, print, Data view, and JSON download remain local display choices. They do not become report authority or cache content.

P4's shared refresh operation connects the pure comparison to the existing snapshot operation and one exact cache lookup. The nested lookup keeps the accepted caller and Store checks. An invalid cache result also limits reuse only. The operation writes no new conclusion. A changed or unavailable result keeps the prior model with its exact review-state limit. The live agent review flow remains planned work.
