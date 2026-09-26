---
title: "W25 R0 P6 Refresh Cache and Agent Actions"
kind: "plan"
status: "draft"
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

## Scope

- Call `backlog.review.refresh` through `tools/call`.
- Report new snapshot identity, cache availability, hits, misses, rejections, and exact changed records.
- Keep the current model when no source facts changed.
- Ask the active agent to rebuild changed conclusions when facts changed.
- Use `work.backlog-cache.write` only after the full model validates.
- Reopen the live resource with the new model after validation.
- Send fixed action identifiers and exact record references through `ui/message`.
- Make separate-task creation an explicit request to the active agent.

## Verification

- Unchanged refresh does not request new agent review.
- One changed record invalidates only its exact cache identity.
- Store absence or denial completes a stateless refresh.
- Failed cache write does not invalidate the current report.
- Message fixtures contain no project-authored prompt instructions.
- Task requests do not claim success before the active agent confirms host support and creates the task.

## Dependencies

- P2 bridge proof.
- P4 tools.
- P5 widget.
