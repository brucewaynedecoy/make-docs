# Backlog Review Skill

The Backlog Review Skill reviews every live and archived Make Docs work record in a project. It produces a concise chat report or an optional single-file HTML report.

The Skill always starts with current project data. It can use an optional cache to reuse unchanged record-level review work, but the cache never becomes the source of truth.

This README explains that cache in detail. It covers what Make Docs stores, how exact reuse works, when the Skill reads and writes the cache, the CLI and MCP operations, and how to validate the behavior.

## Cache flow

```text
Current project
  -> new deterministic snapshot
  -> exact cache lookup
  -> reuse valid hits
  -> review misses and rejected entries
  -> rebuild and validate the complete report
  -> save newly reviewed record fragments
```

The current project snapshot always comes first. The cache never replaces the snapshot.

## What the cache stores

The cache stores one report fragment for one work record. A fragment is the record-level part of the report.

Each fragment has this top-level shape:

```ts
{
  recordPath,
  scope,
  createdAt,
  lastUpdatedAt,
  waveStatus,
  statusReason,
  statusEvidence[],
  facts[],
  inferences[],
  recommendations[]
}
```

The cache does not store:

- the complete deterministic snapshot;
- report tallies;
- Attention findings that apply to the complete backlog;
- the Next order;
- the project summary;
- prompts or repository document bodies;
- raw logs;
- absolute local paths; or
- secret values.

Make Docs defines and validates this exact fragment contract in its CLI source. This code is part of the Make Docs product, not part of the installed Backlog Review Skill: [BacklogReportRecordV1Schema in `schemas.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/src/operations/work/backlog/schemas.ts#L806-L828).

## How Make Docs identifies an entry

The full cache key is:

```text
checkout ID
+ record path
+ record digest
+ snapshot schema version
+ rule catalog version
+ Skill version
```

The record digest is a SHA-256 fingerprint of the complete deterministic work-record object. Make Docs first puts object keys into a stable order. Array order stays significant.

Any change to a deterministic record fact changes the digest. This includes task state, phases, dependencies, source evidence, dates, or Git evidence.

The current versions are:

| Contract | Version |
| --- | ---: |
| Global Store database | 6 |
| Cache result | 1 |
| Backlog snapshot | 1 |
| Backlog rule catalog | 1 |
| Backlog Review Skill | 1 |

Make Docs implements the key and digest in its CLI cache service. This is product code outside the installed Skill: [`cache-service.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/src/operations/work/backlog/cache-service.ts#L24-L110).

## Physical Store schema

Global Store schema 6 added the `backlog_review_cache` SQLite table.

| Column | Purpose |
| --- | --- |
| `checkout_id` | Separates cache data by project checkout. |
| `record_path` | Identifies the work-record directory. |
| `record_digest` | Identifies the exact deterministic record state. |
| `snapshot_schema_version` | Stops reuse across snapshot contract changes. |
| `rule_catalog_version` | Stops reuse across review-rule changes. |
| `skill_version` | Stops reuse across Skill behavior changes. |
| `fragment_json` | Contains the validated record-level report fragment. |
| `created_at` | Records the first write time. |
| `updated_at` | Records the most recent write time. |

The first six columns form the primary key.

The table has a foreign key to the installation checkout. Removing that checkout also removes its cache entries.

A fragment can contain no more than 65,536 bytes. One checkout can keep no more than 512 entries. Make Docs removes the oldest excess entries after a write.

Make Docs defines this table in its Global Store migration code. This is product code outside the installed Skill: [`database.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/src/store/database.ts#L295-L331).

## When the Skill reads the cache

The Skill uses this order:

1. Create a fresh snapshot from the current project.
2. Pass that complete snapshot to the cache lookup.
3. Use only records returned as `hit`.
4. Review every `miss` or `rejected` record from the new snapshot.
5. Rebuild all project-wide conclusions from the combined record set.

The lookup operation does not create or migrate a Store. It does not create a checkout binding.

If the Store exists but the project has no checkout binding, every record returns:

```json
{
  "state": "miss",
  "reason": "checkout-not-bound"
}
```

For a bound checkout, Make Docs first selects rows with matching snapshot, rule, and Skill versions. It then requires an exact record path and digest match.

A result can have three states:

- `hit`: The entry matched and passed all validation.
- `miss`: No exact entry was present.
- `rejected`: An entry existed, but its JSON, schema, facts, or privacy checks failed.

The lookup result also contains:

```ts
{
  schemaVersion: 1,
  service: {
    state: "available",
    checkout: "bound" | "unbound"
  },
  key: {
    snapshotSchemaVersion,
    ruleCatalogVersion,
    skillVersion
  },
  records: [...],
  counts: {
    total,
    hits,
    misses,
    rejected
  }
}
```

## When the Skill writes the cache

The Skill writes only after the complete report model passes validation.

It writes only the fragments that were freshly reviewed because their earlier result was `miss` or `rejected`.

It does not rewrite exact hits. It does not write anything when every record was a hit.

Before Make Docs accepts a fragment, it checks that:

- the record exists in the current snapshot;
- the record appears only once in the write input;
- the fragment matches the report-record schema;
- its path, scope, created date, and updated date match the current snapshot;
- it contains no absolute path;
- it does not appear to contain a secret; and
- it is no larger than 65,536 bytes.

For each accepted fragment, the write transaction:

1. Deletes older keys for the same checkout and record path.
2. Inserts or updates the exact current entry.
3. Removes entries above the 512-entry limit.
4. Commits the complete transaction.

A successful write returns counts for `stored`, `rejected`, `invalidated`, and `pruned`.

A changed record becomes a miss during the first review after the change. The Skill reviews it again and saves its new fragment. It can become a hit during the next review.

The product-level lookup and write logic is in the Make Docs CLI cache service: [`cache-service.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/src/operations/work/backlog/cache-service.ts#L185-L443).

## Store failure behavior

The cache is optional.

The cache operation checks Store access itself. An agent must not run a separate Store-status probe before it attempts the cache operation.

If the Store is not configured, unavailable, unsafe, or denied:

- the current snapshot remains valid;
- the agent performs the full review;
- the report remains complete;
- no project file changes because of the cache failure; and
- only possible future reuse is lost.

A failed cache write also does not invalidate the completed report. It only means that a later review must do more work.

## CLI and MCP operations

The Make Docs CLI provides three snapshot and cache operations.

Create the current deterministic snapshot:

```text
make-docs run work backlog snapshot \
  --target-root <project-root> \
  --json
```

Look up exact cached fragments:

```text
make-docs run work backlog-cache lookup \
  --target-root <project-root> \
  --snapshot-json <file-or-json> \
  --json
```

Save validated fresh fragments:

```text
make-docs run work backlog-cache write \
  --target-root <project-root> \
  --snapshot-json <file-or-json> \
  --records-json <file-or-json> \
  --json
```

The MCP equivalents are:

```text
backlog_snapshot
backlog_cache_read
backlog_cache_write
```

Lookup needs Store-read and project-read access. Write needs Store-write and project-read access.

Make Docs defines these shared CLI and MCP operations in product code outside the installed Skill: [`cache-operation.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/src/operations/work/backlog/cache-operation.ts#L17-L68). The Make Docs operation registry defines their public CLI routes: [`registry.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/src/operations/registry.ts#L160-L222).

There is no single CLI command that performs the full agent review. The Skill coordinates snapshot, lookup, review, validation, cache write, and report rendering.

There is also no dedicated cache `list`, `status`, or `clear` command. The read-only lookup operation is the supported way to inspect reuse for a current snapshot.

The source registry also defines `backlog.review.open` and `backlog.review.refresh`. Their MCP names are `backlog_review_open` and `backlog_review_refresh`. They belong to the `backlog` profile and its exact `all` union. Open accepts `{report: BacklogReportV1, sessionId?: UUID}`. A report-only call keeps fresh server-generated UUID behavior. A trusted agent can supply a fresh UUID to retain its own open context. Refresh accepts `{envelope: BacklogLiveEnvelopeV1}`. Both reject unknown fields. Open validates the full report and returns unchanged V1 text/summary/client payload shapes. It needs no Store access. Refresh reads the current snapshot before one optional exact cache lookup. That nested lookup retains the active-key, current-grant, and Store gates. Refresh writes no review conclusion or cache entry.

Both tools link `ui://make-docs/backlog-review/v1.html`. The widget shows the complete validated report with the accepted layout. Search, filter, sort, disclosure, theme, print, the Data modal, and user-started JSON download change only the local view. They make no tool call and send no agent message. The icon-only top Data button sits to the right of Refresh and opens the existing Data content. Work/Data tabs are absent. Display-size notifications do not request agent work. Icon-only Refresh sits beside Mode/Print. Explain this wave and Work on this wave sit inside expanded wave details. They send fixed messages to the connected agent's current chat and create no task. The app renders no per-wave request feedback and adds no replacement request words to the footer. Request controls follow the controlled flow below. Missing bridge support keeps useful prior data and a clear limit; if no valid report exists, state that limit. The active agent reports actual host results in chat. Tool success does not prove host display. Message receipt does not prove explanation or work. Installed host behavior needs separate proof. Read [the delivery rules](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/skills/backlog-review/references/review-method.md#select-one-delivery-route) before making a live claim.

The live view keeps a permanent plain `Status: <status>` line in the footer. It replaces only the live footer's `Open the project` link. The static report footer and masthead link stay unchanged. No notices sit above the masthead. Loaded reports use `Ready`, `Checking source facts`, `Needs review`, `Last reviewed report — source unavailable`, or `Last reviewed report — update failed`. Checking requires validated refresh input; the widget starts no refresh action. Source unavailable means a source-refresh failure. A failed update or missing/failed bridge keeps a valid prior report, shows update failed, and leaves local controls usable. Continue the review in chat when that limit matters.

Before any valid report is loaded, the footer says `Status: Report unavailable`. The empty view says `No report is loaded. Ask for a backlog review in chat.` Invalid data or unavailable browser crypto keeps that empty state. The footer stays status text; the empty view and guidance carry the next action.

## Validate the cache

The easiest live test is:

1. Generate a report.
2. Save a fresh snapshot.
3. Run the lookup command with that snapshot.
4. Inspect `counts.hits`, `counts.misses`, and `counts.rejected`.
5. Change one work record.
6. Create a new snapshot.
7. Run lookup again.
8. Confirm that the changed record is now a miss while unchanged cacheable records remain hits.
9. Generate the report again.
10. Run lookup once more.
11. Confirm that the changed record is now a hit, if its fragment is below the size limit.

During the original 70-record Make Docs test, the warm result was 67 hits and 3 misses. Those three report fragments each exceeded the 65,536-byte per-record limit. This was not a three-entry count limit. The report safely reviewed those three records again each time.

Make Docs maintainers can also run the focused product test:

```text
npm test -w packages/cli -- tests/backlog-cache.test.ts
```

This test is part of the Make Docs repository, not the installed Skill. It covers exact hits, changed-record misses, corrupt-entry rejection, privacy rejection, invalidation, pruning, and the rule that cache work cannot change project files: [`backlog-cache.test.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/tests/backlog-cache.test.ts).

## How agents know what to do

The Skill tells agents to:

- start with the current snapshot;
- use MCP first;
- use the CLI only when MCP is unavailable;
- reuse only `hit` fragments;
- review all `miss` and `rejected` records;
- rebuild all project-wide conclusions;
- validate the complete report;
- write newly reviewed fragments as a best-effort final step;
- continue without the cache when Store access fails; and
- explain material cache problems in human terms.

The main agent instructions are in [`SKILL.md`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/skills/backlog-review/SKILL.md). The detailed cache routing rules are in [`references/cache.md`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/skills/backlog-review/references/cache.md).

The Make Docs test suite also checks that the shipped Skill contains the required cache routes and safety rules: [`backlog-review-skill.test.ts`](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/cli/tests/backlog-review-skill.test.ts).

## Report data is not a live cache view

The HTML report's Data modal shows the normalized report model embedded in that report file. It is not a live view of the Global Store cache.

The report model's `records` array has the same record-fragment shape. However, the report can contain records that the cache rejected or could not store. The report data and the cache are related, but they are not exact copies of each other.

## Shared model and delivery limits

The source uses one unchanged `BacklogReportV1` for static, chat, Data, and full live payload meaning. A separate `BacklogLiveEnvelopeV1` adds live identity. The portable static validator is generated from the shared report contracts. Local filters and other display state do not become authority or reduce exported data.

The live payload builder supplies a concise model-visible summary and full client data. It writes no static report and does not open a host widget. Client-only metadata is readable by the host and client. It is not secure storage. Open and refresh tools connect the report view to the shared registry. The live widget provides local controls and visible review-state feedback. Explain this wave and Work on this wave send prompts to the connected agent's current chat. They do not create a task or another chat. Installed host results need their own proof. The Skill completes its chat review and creates a saved report only after an explicit request. Source links keep the record path available when a host cannot open the file; use that path in the active chat.

Read [the report model](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/skills/backlog-review/references/report-model.md) for the shared boundaries and [the HTML guide](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/skills/backlog-review/references/html-report.md) for the saved-file path and replacement consent. Cache rules and identities are unchanged.

The optional `scripts/agent-contract.mjs` uses Node built-ins and the shared contracts. It needs no CLI, `node_modules`, Store, or network to validate supplied data. It does not acquire facts or create permission. The active agent obtains the latest snapshot and calls existing tools. The module exports preparation/confirmation for live open, fixed message creation/parsing/resolution, full rebuilt-model validation, and optional cache write preparation/attempt.

Host tool-result notifications have no RPC request ID. The controller can accept the first strictly validated, scoped refresh view, including its prior reviewed envelope when no open result exists. It ignores exact duplicates. Once checked facts exist, a different uncorrelated notification cannot advance them; notifications during an owned Refresh call also cannot replace its result. This blocks late A from replacing checked B. Effect: a later unsolicited notification may not advance the view. Use the widget's Refresh for the next source check. Its owned RPC reply is current-facts authority. Invalid or wrong-session input never replaces the report. A matching external tool-input has a 30-second limit so it cannot leave Refresh disabled indefinitely.

Preparation is provisional. Promote only a confirmed authoritative envelope from the actual own successful open result. A received action or message cannot confirm an open. Missing trusted context fails safely. Each action and cache/open check needs current facts. Preserve gated cache writes, fresh-fragment selection, and skipped all-hit or failed-lookup writes. An attempted write is not a written cache. Explain provides background on captured facts, findings, inferences, and action items. Work resolves captured inferred status and/or implements captured recommended actions within user permissions. Keep selected recommendation text and order. Caller instructions and raw source prose cannot replace those captured targets. An accepted message or draft does not prove work started. Read [the live agent workflow](https://github.com/brucewaynedecoy/make-docs/blob/main/packages/skills/backlog-review/references/review-method.md#live-agent-workflow) for exact APIs and boundaries.
