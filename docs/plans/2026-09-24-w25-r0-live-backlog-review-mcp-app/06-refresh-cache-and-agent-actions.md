---
title: "W25 R0 P6 Refresh Cache and Agent Actions"
kind: "plan"
status: "completed"
coordinate: "W25 R0 P6"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P6 Refresh Cache and Agent Actions

## Purpose

Connect the live widget to current facts, exact cache reuse, and controlled requests to the active agent.

## Outcome

P6 delivers unchanged and changed refresh paths, best-effort cache refresh after model validation, bounded review requests, and an explicit separate-task request.

The user authorized P6 implementation and then closeout/local commit on client date 2026-10-06. Its pre-commit base is `04edf4f6`. P6 is closed within source and bounded mock-host/static scope. Tyler approved the exact `v1.2-feedback-removed` preview and directly requested the later wave-layout and Data-modal supplements. t1-t6/A41-A50 and required agent reviews have evidence. The original P6 e4 checkpoint has 304 unique passing cases; the final 3bde UI has separate 137-case affected proof. Repeated cases are not added to old totals. These records belong to the P6 closeout commit. P7 real-host/installed/PERF-002 work needs separate authority.

## Scope

- Call `backlog.review.refresh` through `tools/call`.
- Report new snapshot identity, cache availability, hits, misses, rejections, and exact changed records.
- Keep the current model when no source facts changed.
- Ask the active agent to rebuild changed conclusions when facts changed.
- Use `work.backlog-cache.write` only after the full model validates.
- Reopen the live resource with the new model after validation.
- Send fixed action identifiers and exact record references through `ui/message`.
- Make separate-task creation an explicit request to the active agent.
- Resolve each fixed action against a trusted validated report/open context and a fresh current snapshot. Do not derive expected session identity from the received action.
- Prepare a fresh UUID and validated report with the trusted portable helper. Its candidate envelope is provisional. Promote the authoritative envelope only after confirmation of the actual own successful open result. Report-only open keeps default fresh UUID behavior; missing trusted action context must fail safely.
- Resolve a refresh request against the old retained session/model and exact snapshot/change fields. Validate its incoming whole rebuilt report against the latest checked project/snapshot. A fresh confirmed open uses a new session and report-derived model identity. Do not assert an extra request token or automatic unsolicited-result rejection beyond the tested controller.
- A `request-task` click authorizes only the named separate chat. Default to the current saved project and local environment. It grants no implementation, branch/worktree, staging, commit, push, or installation authority. Do not interpolate project prose as task instructions.

## P6 Live UI Design Gate

The gate comes from the user's direct 2026-10-06 instruction. Reviewer: Tyler. Scope: any new or changed live UI element, word, or behavior. Surface: a concrete preview of exact controls, icons, accessible names, text, placement, outcomes, and recovery states. Question: approve this exact preview for live activation? Effect: `blocking-current-work` for that activation; the affected A50 whole-surface claim depends on approval. It does not block isolated logic or source Skill work.

The owner said “Alright. The preview is now approved.” for the exact [v1.2-feedback-removed preview](http://127.0.0.1:57749/). It keeps icon-only Review/New Task inside expanded details and Refresh beside icon-only Mode/Print. It removes all rejected per-wave request feedback. No replacement location, request copy, or new footer words are approved. Preserve existing footer labels/layout. The pre-integration UI baseline is `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a`. The original approved P6 source checkpoint is 441,531 bytes, SHA-256 `e4c41748a6418243fcc137013dca7daa77d24f4522832518435348d1c5efc438`. Its [bounded acceptance evidence](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md#p6-implementation-and-acceptance-evidence--2026-10-06) is separate from preview approval. Later exact supplemental requests have final 3bde source proof. No production-host, installed-state, or real chat-creation result is claimed.

## Verification

- Unchanged refresh does not request new agent review.
- One changed record invalidates only its exact cache identity.
- Store absence or denial completes a stateless refresh.
- Failed cache write does not invalidate the current report.
- Message fixtures contain no project-authored prompt instructions.
- Task requests do not claim success before the active agent confirms host support and creates the task.
- A received message or host-accepted draft is not proof of a created chat. Record the actual host result.
- Required agent Human Experience Review is separate. Guided Progress Review is advisory under [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md). The explicit UI design gate is separate and blocking.
- Use the [finite P6 decisions](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/06-refresh-cache-and-agent-actions.md#current-testing-decisions) and existing central evidence. No test quantity or preview direction alone proves acceptance.

## Dependencies

- Closed P1-P5 contracts, shared model, bounded bridge proof, source tools, and widget at `04edf4f6`.
- Executable trusted-context/current-snapshot resolution and existing write/allowWrite gates.
- Tyler's preview approval and exact supplemental requests are recorded. The user authorizes P6 closeout and a local commit on 2026-10-06. P7 needs separate implementation authority.
