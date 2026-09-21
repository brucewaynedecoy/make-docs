# Review Method

## Keep authority clear

The snapshot supplies recorded facts. The report adds review conclusions. A review must not write lifecycle status, close records, accept closeout, create a commit, release work, or archive a record.

Use the project root selected by the request or the current project context. Report one source method:

- `MCP snapshot` when `make_docs_work_backlog_snapshot` returned the facts;
- `CLI snapshot` when the JSON CLI command returned the facts; or
- `agentic fallback` when the file method supplied the facts.

An unavailable surface permits the next method. A material failure from an available surface is not the same as absence. Explain the failure before changing methods. Do not use a later method to claim that the failed method succeeded.

## Classify each record

Keep archived scope from the snapshot or archive namespace. Archived records have `waveStatus: null`. Give them a source-backed reason such as “Archived record retained for history.”

Classify each live record with judgment over accepted authority, recorded status, task state, dependencies, blockers, closeout evidence, current work evidence, source conflicts, and owner direction. Use this order to resolve competing signals:

1. `conflict` when recorded facts materially disagree or source authority is not safe enough to support the claimed state.
2. `deferred` when accepted evidence says paused, deferred, or superseded and no stronger conflict applies.
3. `attention` when the record needs a near-term action before it can be treated as clean current, complete, or historical work. This includes closeout debt and unresolved blockers.
4. `current` when accepted evidence shows active or ready in-scope work and no stronger status applies.
5. `complete` when implementation evidence is complete and the record remains useful in the active portfolio without a current-work signal.
6. `history` when completed or closed work is retained as historical evidence and no current-work signal exists.

Historical classification is an inference. Cite the complete or closed facts and state the limit. Completed tasks alone do not prove accepted closeout, a commit, closed history, release, or archive.

Write a short `statusReason` that explains the decisive evidence. Use two to eight words when possible. Do not write a sentence, repeat the wave name, or include evidence links. The reason is flexible text. It never changes filter membership or color.

## Build claims

Use these claim classes:

- `fact`: recorded or measured evidence. Include one or more repository-relative evidence links.
- `inference`: a conclusion from facts. Include evidence, `low`, `medium`, or `high` confidence, and material limits.
- `recommendation`: a proposed action. Include its facts, rationale, and limits.

Use only decisive evidence in report-layer claims. The source snapshot already retains the full record. Use one to three references for a status reason or fact and no more than five for an inference or recommendation. Remove duplicate references. Do not attach every source line that mentions the subject.

Keep a report-level attention finding separate from wave status. A current or complete wave can still have a finding.

Do not choose an attention icon or severity. The fixed renderer maps a `conflict` wave to `error`, an `attention` wave to `warning`, and every other record or portfolio finding to `info`.

## Recommend order

Recommend order only for useful next work. Explain why one item comes before another. Consider accepted authority, explicit dependencies, blockers, active edits, closeout debt, evidence conflicts, supersession, and owner direction. Age can support context. Age cannot prove priority.

Use contiguous ranks from one. If evidence cannot support a useful order, say so and leave the order empty.

## Write the chat report

Use this compact order:

1. project and fact-source method;
2. the four full-portfolio tallies;
3. **Current focus**;
4. **Next**;
5. **Needs attention**;
6. nonempty state groups for open or current, closeout needed, blocked or conflicted, paused or superseded, completed, and historical work;
7. material evidence limits and diagnostics.

The first screenful must show current focus, material conflicts, and the next useful actions. Use normal names before internal codes. Put exact codes and machine detail after the human account.

For each displayed wave, link its coordinate or name to its repository-relative `00-index.md` when that file exists. Keep the default summary short. Add compact facts, inference, recommendation, confidence, and limit detail only when it helps the current decision.

Omit empty sections. Never omit a material failure, conflict, limit, or required action.

## Explain errors and limits

Build the human explanation from meaning, not from a fixed sentence:

- subject;
- what happened and in what context;
- effect on this request;
- facts that remain known;
- facts that remain unknown or limited;
- next useful action; and
- human action level: required, optional, or none.

Keep diagnostic codes, stack traces, and raw tool output available as secondary evidence. Do not lead with them. Preserve the exact severity and action requirement.

The structured examples in `examples/human-errors.json` define required meaning. They do not define required prose.
