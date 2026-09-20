# Report Model

Use report schema version `1`. Preserve the complete source snapshot in the report. Do not remove records to make the chat shorter.

## Report fields

The report contains:

- `schemaVersion`, `generatedAt`, `targetRoot`, and `project`;
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

Use repository-relative paths. Preserve line, field, and commit evidence when available.

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

## Status rules

Only these live status values are valid:

- `attention`
- `current`
- `conflict`
- `deferred`
- `complete`
- `history`

Status controls filtering and semantic color. Reason supplies the visible explanation. A finding does not change status.

## Claim rules

A fact needs evidence. An inference needs evidence, confidence, and limits. A recommendation needs rationale and limits. A recommendation can have no direct source only when its rationale names the supporting report facts.

Recommendation ranks are unique and contiguous from one.
