# Report Model

Use report schema version `1`. Preserve the complete source snapshot in the report. Do not remove records to make the chat shorter.

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
