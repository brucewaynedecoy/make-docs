# Review and New Task — Owner-Defined Outcomes

> Superseded current authority. The 2026-10-08 owner correction replaces the task-creation outcome below. Explain provides background on captured wave facts, findings, inferences, and actions. Work resolves inferred status and/or implements captured recommended action in the same connected agent chat. Neither creates another task. The retained text below is historical. See [PRD 51](../../../../prd/51-backlog-review-and-reporting.md#live-mcp-app) and the [current recovery summary](../../evidence.md#recovery-closeout-summary).


Status: product intent agreed by the owner on 2026-10-07. The [approved source check plan](request-validation-plan.md) now exercises the written correction. No actual host/button/task outcome is claimed. This replaces the earlier general wave-review, review-only new-chat, and manual-only fallback assumptions. It requests no new UI.

## Review

Ask the original report-generating agent for more detail about the selected wave's captured Attention or Inference feedback. The result belongs in the original chat. Explain that feedback, its evidence, reasoning, qualifiers, and limits. Do not substitute a new general wave review or implementation task.

Use the exact validated report, wave path, and captured feedback. Current source reads can validate the reference and explain a limit. They must not silently replace the captured subject with a new conclusion.

Proposed test outcome: one valid request reaches the original generating agent. That agent gives more detail about the same captured Attention/Inference feedback in the original chat. The selected report remains traceable. No new task or unrelated work begins.

## New Task

Send the original report-generating agent a request to create a new task or chat. Pass the selected wave's captured Next/Recommended action text verbatim as a value to a reusable MCP prompt. Resolve that prompt through MCP. Pass the resolved prompt as the task instructions. Do not forward standalone action text or substitute a review-only prompt.

The owner deliberately promotes the captured agent-generated recommendation to instructions through this request. Preserve its exact meaning, qualifiers, provenance, and selected wave. Raw project titles, descriptions, and other project prose remain data. Do not treat unrelated project text as an instruction.

New Task uses registered prompt `make_docs_backlog_wave_task` with required string arguments `own_session_id`, `request_json`, and `recommended_actions_json`. Native list/get is registered in backlog/all. The model-accessible resolver returns the same callback's prompt result as a labelled bridge. This is a New Task workflow requirement; it adds no fourth capability to P1's live delivery rule.

If the agent can create the task, it passes the resolved prompt to the new task and reports the actual created-task identity or link. A message receipt, accepted draft, or empty host response does not prove creation.

If the agent cannot create a new task or chat, it begins work in the original chat using the same resolved MCP prompt. Do not replace this agreed fallback with standalone action text, a manual-only suggestion, or another review. State that no separate task was created. Work stays within the captured action and applicable user authority. Do not add unrelated project or Git actions. Missing or failed prompt resolution must not be bypassed by a hand-built substitute.

Proposed test outcomes:

- Prompt resolution: the exact captured action text is supplied verbatim as a prompt value. The reusable registered MCP prompt resolves without action rewriting or truncation.
- Supported creation: one separate task receives that resolved prompt as instructions. The original chat reports the real task identity. No instruction is silently changed to review-only work.
- Unsupported creation or a known creation failure: no new task exists. The original generating agent uses the same resolved prompt to start work in the original chat and states that destination.
- Uncertain creation: check the actual host state before retry or fallback work. Do not claim creation or start duplicate work from an unconfirmed receipt.

## Control and Strict Checks

Keep one traceable request for each deliberate click. Suppress duplicate pending or already acknowledged requests for the same report. Do not create duplicate tasks or duplicate fallback work.

Validate the trusted report/open context and current selected-wave reference before action. Reject stale session/model/project/snapshot identities, missing paths, conflicting coordinates, ambiguous references, unknown fields, or injected free-form instructions. Never derive expected context from the incoming action. A later message cannot repair an unprepared original open.

These strict checks protect identity and provenance. They do not choose the product outcome. The owner has now fixed that outcome: detail about captured feedback for Review; captured action handoff or work in the original chat for New Task.

No new inline notice, footer wording, CSS, or control is requested. Explain actual agent/host outcomes in the original chat. Host draft/Send steps remain under direct user control.

## Current Authority and Source Correction

The [PRD action contract](../../../../prd/51-backlog-review-and-reporting.md#live-mcp-app) now states captured-feedback Review, the reusable task prompt, same-prompt fallback, expected-session provenance, and truthful execution claims. Its requirement history preserves prior assumptions. No new PRD is created.

The [closed P6 plan scope](../../../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/06-refresh-cache-and-agent-actions.md#scope) records prior named-chat/fixed-review assumptions. It remains historical. The current [P7 plan](../../../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/07-parity-performance-and-acceptance.md#scope) and shipped [controlled request guidance](../../../../../packages/skills/backlog-review/references/review-method.md#keep-agent-requests-controlled) use the owner's replacement contract.

The shipped [live workflow](../../../../../packages/skills/backlog-review/references/review-method.md#live-agent-workflow), [limit guide](../../../../../packages/skills/backlog-review/references/review-method.md#explain-errors-and-limits), and SKILL.md are frozen with captured feedback/action semantics and definite versus unconfirmed host results. MCP prepare/open/resolve needs no local Node, private metadata, connected-folder grant, or Store access.

The written [helper](../../../../../packages/cli/src/operations/work/backlog/agent-contracts.ts) and registered prompt/resolver are under the renewed source checks. Earlier tests are not proof of new agent outcomes. This record creates no task and performs no host/button, Goose, or PERF action.

A59 Guided Progress Review remains advisory. The owner-specific action consultation is now answered; implementation and proof remain pending. The substitute 70-record fixture is not approved. PERF has zero observations.
