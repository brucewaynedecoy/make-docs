---
title: "W25 R0 P1 Authority and Live Delivery Contract"
kind: "history"
status: "completed"
date: "2026-09-30"
client: "Codex Desktop"
coordinate: "W25 R0 P1"
repo: "make-docs"
branch: "w25-r0-p1-live-delivery-contract"
summary: "Completed and tested pure live-delivery contracts and source guidance."
---

# W25 R0 P1 Authority and Live Delivery Contract

## Changes

Implemented P1 on the user-requested branch from `0ed2501d`. Pure contracts select one delivery route, wrap unchanged `BacklogReportV1`, identify current source and review state, validate fixed actions, and preserve the prior model through refresh limits. The module reads no files, uses no Store operation, and starts no task.

The new suite passed 41 tests. The existing contract, Skill, and cache suites passed 76 tests. The final affected Skill rerun passed the same 14 Skill cases. Type checks passed. All 53 repository default checks passed after a retired path literal in D-044 was changed to plain wording. Final PRD authority checked 35 PRDs, 586 Markdown files, and 1,103 links with no diagnostics. Path hygiene passed for 11 selected files. The indexed link check found no broken link in the new or edited P1 sections. Final code review found no material gap. The [central evidence report](../../../docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md) records exact commands, tested source, review, and limits.

P1 is closed for source contracts. The user authorized closeout and a local commit on 2026-09-30. This includes staging the reviewed P1 file set. The test evidence identifies the pre-commit checkpoint based on `0ed2501d`. All six tasks and A1-A8 have evidence. Performance Testing and Unassisted Goal Testing remain `not-needed-now`. Guided owner review was advisory. The owner said “Clear; no change” for three consent and fallback wording scenarios. That feedback does not prove a live host or UI. No broad lived reaction, installed parity, mounted app, transport, or task creation is inferred. At the implementation checkpoint, no staging or commit had been performed. P2, push, installation, publication, and release remain outside the closeout and local commit authority. This record does not claim that the local commit has already been created.

[D-044](../../../docs/prd/03-open-questions-and-risk-register.md#d-044-local-history-router-gives-retired-paths) records a local nested history router with retired paths. P1 used the current history contract. The installed router stayed unchanged. A separate ownership and source check must precede repair.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [PRD 51](../../../docs/prd/51-backlog-review-and-reporting.md) | Exact current delivery, envelope, action, and refresh contracts plus non-normative history. |
| [Risk register](../../../docs/prd/03-open-questions-and-risk-register.md) | Local-only D-044 finding and separate repair route. |
| [P1 work record](../../../docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/01-authority-and-live-delivery-contract.md) | Stable task and acceptance IDs, final status, review decisions, and evidence links. |
| [W25 work index](../../../docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md) | P1 contract completion and later-phase authority boundary. |
| [Evidence report](../../../docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md) | P1 results, per-promise agent review, optional experience handoff, and limits. |
| [Source Skill references](../../../packages/skills/backlog-review/references/review-method.md) | Consent and fallback rules. Related model, HTML, and cache references preserve the same meaning. |

### Maintainer

None this session. Source Skill references already own the P1 guidance. No new runnable maintainer flow was added.

### User

None this session. P1 adds contracts and source guidance. Later phases must prove the live user path before new live-use guides claim it works.
