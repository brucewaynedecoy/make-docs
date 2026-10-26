---
title: "W25 R0 P5 Live Widget and Local Interaction"
kind: "plan"
status: "completed"
coordinate: "W25 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P5 Live Widget and Local Interaction

## Purpose

Build the live widget while preserving the accepted Backlog Review design and keeping display-only actions local.

## Outcome

P5 delivered the live page with the accepted title, project summary, tallies, Attention, Next, Backlog Work and Data tabs, wave list, legend, and footer at its source closeout checkpoint.

The direct 2026-10-06 [supplemental Data request](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence/data-modal/data-modal-review.md) replaces those tabs with an icon-only top Data button and modal. Existing Data content and local state stay intact. This is later source guidance, not a rewrite of P5 test evidence, task status, or closeout.

The user authorized the preflight fixes and implementation on 2026-10-04. The tested pre-commit checkpoint uses the current branch based on `19c19f42`. On 2026-10-06, the owner approved the footer remedy, then separately asked to close P5 and commit it. P5 is closed within source and finite browser scope. t1-t6/A33-A40, 405 unique selected cases across finite runs, required agent review, and final resource hash `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a` support that closeout. These records belong to the P5 phase closeout commit. Root owns staging and the local commit. P6/P7, host setup, installed acceptance, branch changes, push, publication, and release need their own authority.

## Scope

- Reuse the accepted light, dark, responsive, and print presentation.
- Keep Attention before Next.
- Keep Work and Data under Backlog.
- Keep fixed status colors and accepted phase-state colors.
- Keep search, clear, status filters, sort, disclosure, theme, print, Data, and download local.
- Add live connection, refresh, changed-state, and action feedback without hiding report content.
- Keep those feedback states separate from P6 refresh calls, agent messages, and task actions. P5 executes none of them.
- Preserve keyboard, focus, reduced-motion, and narrow-screen behavior.

## Verification

- Local controls make no `tools/call` request and send no agent `ui/message`. Display-size notifications carry layout only.
- Wide, narrow, print, light, and dark results preserve accepted spacing and order.
- All controls have accessible names and visible focus.
- Hostile report text stays inert.
- A missing bridge yields readable report content and a clear limit.
- Compare with the verified [P3 baseline evidence](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md#p3-output-review).
- Use the [P5 common testing decisions](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md#current-testing-decisions). Keep finite affected-first scope and reuse valid prior evidence.
- Required agent Human Experience Review remains distinct. A short optional owner comparison is advisory and creates no response gate.
- See [P5 acceptance evidence](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md#p5-task-and-acceptance-results). Current evidence covers 405 unique cases across finite runs. The final widget48 and overlapping159 pass; unaffected earlier proof is reused. The owner's earlier “Clear; no change” covered the choose-wave/details path only. Footer approval was separate on 2026-10-06.
- The owner answered “Yes, approved” to the footer placement and exact five labels on 2026-10-06. The [scoped finding](../../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md#p5-owner-status-ui-finding--2026-10-06) is resolved by actual-source proof: notices above the masthead are removed; the live footer has permanent plain `Status: <status>`; the static footer and masthead link remain. Final 73-record changed refresh and finite browser review pass. t3/A40 are complete within the recorded inspection limit. No production-host claim follows.

## Dependencies

- Closed P1-P4 contracts and shared source integration.
- P3 shared model and retained exact baseline.
- P4 resource registration at `19c19f42`.
