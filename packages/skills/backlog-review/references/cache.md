# Optional Review Cache

The cache can reduce repeat review work. It is not project authority. It is Global Store data that Make Docs can delete or rebuild at any time.

Live session, model, and snapshot identities are separate from cache identity. The existing exact-match cache rules remain unchanged. A Store failure affects optional reuse. It cannot make an available current snapshot unavailable or block a stateless review.

## Route the review

Always get the current deterministic snapshot before any cache operation. Keep that snapshot as the fact source for the report.

For cache lookup:

1. Call the compatible MCP tool `backlog_cache_read` with the project root and the complete current snapshot.
2. If that MCP tool is unavailable, save the snapshot to a temporary JSON file outside the project. Run `make-docs run work backlog-cache lookup --target-root <project-root> --snapshot-json <snapshot.json> --json`.
3. If neither cache surface is available, or if Store access is refused or fails, perform the full stateless review.

Do not run a separate Store-status probe. The cache operation owns the Store check.

Use a returned fragment only when its record state is `hit`. Review `miss` and `rejected` records from the current snapshot. A rejected row is not evidence about the project.

After combining hits and fresh record reviews, rebuild these values from the full current snapshot:

- all four tallies;
- attention findings;
- recommendation order;
- project-wide limits and conflicts; and
- every other cross-record conclusion.

Never reuse a portfolio conclusion from cache.

The source live refresh operation follows the same snapshot and lookup rules. Its optional outer Store admission lets current source facts run first. It calls the existing lookup once with the same execution context. That lookup still checks the active connection key, current grants, target, operation, and Store policy and opens its own Store session. Optional admission does not grant access. Cache refusal, failure, or invalid output limits reuse only. Refresh writes no cache entry or agent conclusion. The standalone lookup and write contracts stay unchanged.

## Save fresh fragments

Validate the full report model first. If the lookup returned one or more `miss` or `rejected` records, attempt to cache each freshly reviewed fragment. Do not write exact-hit fragments again. When every record was an exact hit, the cache is already current and no write is needed.

Reread the latest snapshot before the write gate and validate the whole rebuilt report against it. Stale or invalid full-model validation stops cache/open; it is not an optional Store failure. The report must be rebuilt from current facts before claiming current review.

Use the compatible MCP tool `backlog_cache_write`. If that tool is unavailable, save the current snapshot and record array to temporary JSON files outside the project. Run:

```text
make-docs run work backlog-cache write --target-root <project-root> --snapshot-json <snapshot.json> --records-json <records.json> --json
```

Remove temporary files after the operation. Do not create a project-local cache.

Cache only the validated per-record report fragment. Do not add repository bodies, prompts, secrets, raw logs, absolute paths, the current snapshot, or portfolio conclusions to a cached value.

The write attempt is part of the normal review flow when freshly reviewed fragments exist and the lookup succeeded. Write success is not required for the current report. A denied or failed write does not change the current snapshot, report records, or report result. It affects only reuse during a later review.

The portable `scripts/agent-contract.mjs` exports `prepareBacklogAgentCacheWrite(report, latestSnapshot)` and `attemptBacklogAgentCacheWrite(report, latestSnapshot, callExistingWrite)`. Preparation validates the whole model and returns no intent for an empty record set. Otherwise it returns an input proposal for the existing operation. It performs no write or admission.

The active-agent callback must preserve the rules above. Skip the attempt after failed/unavailable lookup or when no fresh miss/rejected fragment exists. Select only those exact freshly reviewed paths from the helper's validated record array before calling `work.backlog-cache.write`. Do not validate a sliced partial report in place of the whole model. Reuse caller/Store/allowWrite gates; neither report validation, an action click, nor a helper proposal grants write permission. The widget does not perform this write.

The attempt result preserves the validated report with cache state `not-needed`, `attempted`, or `unavailable`. `attempted` does not mean written. Use the actual operation result for any write claim. Thrown or resolved write failure cannot discard the validated current report. Complete the review and fresh confirmed open even when optional cache reuse/write fails.

## Explain cache limits to the human

Do not lead with cache mechanics. Lead with the completed report.

When a cache issue is material, explain it in this order:

1. The report used current project data and is complete.
2. Make Docs could not reuse or save prior record reviews.
3. The issue affects only the time needed for a later repeat review.
4. State whether the human must act. Usually no action is required.
5. Give the exact repair or retry step only when reuse matters.

Keep the machine code as secondary evidence. Do not paste a raw Store error as the human explanation.
