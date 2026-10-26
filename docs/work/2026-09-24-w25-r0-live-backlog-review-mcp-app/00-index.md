---
title: "W25 R0 Live Backlog Review MCP App Work Backlog"
kind: "work"
status: "complete"
coordinate: "W25 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from PRD 51 and the W25 R0 plan."
  coordinate_handoff: "P1-P6 are historical closed work. P7 retains A51-A60 history and the W25-only A56 waiver. P8-P13 have bounded closeout. W26 R0 supplied the shared access path. The owner approved one local W25 commit. Push and release need separate authority."
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# W25 R0 Live Backlog Review MCP App Work Backlog

## Current State

The owner rejected the earlier live app for release on 2026-10-08. The repair-1 version 2.0.4 has bounded Codex proof for the 73-record display, Data, Explain, read-only Work, and Refresh. Its cache lookup returned `store-denied`; the connection that produced it was not proved. The visible report treated unsupported task counts as zero. P7 and W25 remain active. [P8](08-evidence-and-scope-correction.md#a51a60-claim-ledger) records those older limits and closes its sequencing gate after the W26 R0 merge. W25 took that merged foundation at `93c0ae63`. P9 source work and the approved count display pass their local checks. A P10 intermediate config stopped Codex startup. The owner commented both Make Docs entries and all their tool settings. A safer first-party setup added one complete 2.0.5 `make_docs` entry. The restarted Codex app loaded it. P11 has approved project Store access, a 76-record cache miss/write/hit result, visible narrow and wide app views, and owner-run Refresh to `Status: Ready`. A changed Refresh showed `Status: Needs review` and disabled stale actions. The owner removed the need for a Print button. The installed no-Print candidate shows Theme, Refresh, and Data in the live app. The saved report keeps browser print layout. The owner passed the native keyboard and reduced-motion checks. The final Human Experience Review covers the observed host and browser paths. A short-reference package failed to send Explain, and an action-feedback package showed a browser hash failure. The approved browser-hash correction now runs in Codex. Its clear Explain and Work messages reached this chat with short references. Both references resolved against the independently rebuilt open context and unchanged source facts. The Work request led to a bounded P11 record update. A second Explain click in the installed app showed `Already sent to chat`. The strict agent resolver refused stale and mismatched-wave inputs. One current report matched across the live Codex Data view and exact-package saved HTML model. A local text-only MCP client received a useful summary. The owner accepted that tested scope for P11, with the saved browser view and separate unsupported agent host unproved. P11 is complete in this accepted scope. The owner approved P12 inventory. Earlier failed packages and host limits remain in the evidence. No release result is claimed.

The owner approved the revised P12 saved-entry plan. A fresh 2.0.5 archive passed isolated checks and was installed in a lasting location. Make Docs setup replaced the saved `make_docs` block with that package and a new Store key. The normal setup preview is `unchanged`; Store status is `ready`; a direct client listed 45 tools and read 76 records. After Codex restarted, the new live app showed 76 records and refreshed to `Status: Ready`. Explain and Work each sent clear W25 messages to this chat. The [P12 retention decision](evidence/p12/final-retention-decision.md) keeps the old package and private backups as local recovery data. P12 is complete in that kept-path scope. P13 remains open for release and commit disposition. No release result is claimed.

P13 corrected stale Print and action-status text in the shipped Skill guide and the related design. A new exact 2.0.5 package passed isolated CLI, MCP, app-asset, Store read, cache read, report open, refresh, and affected source tests. The owner approved its lasting install and saved-entry change. Make Docs setup returned `configured` and `verified`; the saved identity passed direct MCP, Store, 76-record snapshot, and cache checks. Codex restarted and now runs this exact package. The live app showed current counts, six Attention findings, Theme, and Data. Refresh returned to `Status: Ready` on the current report. Explain and Work each sent clear W25 R0 text to this chat. The owner approved bounded closeout for the tested macOS Codex and local text-client scope, then approved the exact local W25 commit. The [P13 packet](evidence/p13/closeout-review.md) keeps unproved host and release cases as obligations. P13 and W25 are complete in that bounded scope. Publication still needs separate approval.

After the local commit, the owner checked the saved HTML report in a browser. Wide, narrow, light, dark, Print preview, keyboard focus, and both copied prompts passed in that test. The owner also ran a GitHub Copilot CLI review and reported that its text result appeared in the terminal. The [P13 packet](evidence/p13/closeout-review.md#owner-checks-after-the-local-w25-commit) records the evidence and its limits. A host without app support, Windows, and Linux remain unproved. These later checks do not change the accepted bounded closeout or authorize publication.

The owner authorized the [P7 recovery plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/07-parity-performance-and-acceptance.md) on 2026-10-08. The separate local P7 recovery summary holds exact package and host receipts. P8 classified those claims in its ledger. Earlier phase permissions and results remain historical.

## Purpose

Provide the implementation queue for [PRD 51](../../prd/51-backlog-review-and-reporting.md), the [W25 R0 design](../../designs/2026-09-24-live-backlog-review-mcp-app.md), and the [W25 R0 plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-overview.md).

The user authorized P1 implementation on 2026-09-30. The user then authorized P1 closeout and a local commit on that date. This includes staging the reviewed P1 file set. P2 and later phases, push, publication, installation, and release remain outside that authority.

The user separately authorized P2 implementation on 2026-09-30. It uses the current branch after P1 commit `2a8fc509`. The user then authorized P2 closeout and a local commit on that date. This includes staging the reviewed P2 file set. P3 and later phases, push, publication, installation, and release remain outside that authority.

The user separately authorized P3 implementation on 2026-09-30. Its tested source checkpoint uses the current branch after P2 commit `0c112e57`. The user then authorized P3 closeout and a local commit on that date. This includes staging the reviewed P3 file set. These records belong to the P3 phase closeout commit. P3 keeps the unchanged V1 report and separate P1 live envelope. P4 and later phases, branch changes, push, publication, installation, and release remain outside that authority.

The user separately authorized P4 implementation on 2026-10-04. Its tested source checkpoint uses the current branch at `bdd21481`. Accepted W24 authority is merged at `26bdf1ce`, from W24 completion `b4c253c1`. The user then authorized P4 closeout and a local commit on 2026-10-04, including staging the reviewed P4 file set. P4 is closed with A25-A32 evidence. These records belong to the P4 phase closeout commit. Its scope is shared tool/resource integration and useful no-UI results. P5 is next eligible and needs separate implementation authority. Later phases, branch changes, push, publication, installation, release, Store writes, and host changes remain outside this authority.

The user separately authorized P5 preflight fixes and implementation on 2026-10-04. Its tested pre-commit checkpoint uses the current branch based on P4 commit `19c19f42`. On 2026-10-06, the owner approved live-only footer placement and exact five labels, then separately asked to close P5 and commit it. P5 is closed within source and finite browser scope. t1-t6/A33-A40, final 73-record changed proof, and 405 unique selected cases across finite runs support the closeout. These records belong to the P5 phase closeout commit. Root owns staging the reviewed file set and the local commit. P6/P7, installation, Store writes, host changes, branch changes, push, publication, and release remain outside this authority.

The user separately authorized P6 implementation and then closeout/local commit on client date 2026-10-06. Its pre-commit base is `04edf4f61ee5af21c319dbc4698cc578fb5362c7`. Tyler approved the feedback-removed preview and directly requested the later wave-layout and Data-modal supplements. P6 is closed within source and bounded mock-host/static scope. t1-t6/A41-A50 and required agent reviews have evidence. The original e4/304-case checkpoint and final 3bde/137-case affected set stay distinct. The Data modal meets the tested 66 percent visible-height floors with honest bounds. These records belong to the P6 closeout commit. Root owns staging and the authorized local commit. P7, push, release, installation, Store/host changes, and branch changes remain outside this authority.

## Human Experience Trace

| Promise | Source | Owner | Phase | Evidence | Gate |
| --- | --- | --- | --- | --- | --- |
| Compatible hosts open a live Backlog Review by default. | Design and plan | PRD 51 | P1-P5 | Contracts, bounded host proof, source tests, required agent review; owner feedback is advisory | A1-A8, A9-A16, A25-A40 |
| Static HTML is written only after an explicit request. | Same | PRD 51 | P1, P3, P7 | Route fixtures and installed proof | A1-A4, A17-A24, A51-A60 |
| Live, static, and chat fallback keep the same report meaning. | Same | PRD 51 | P3, P7 | Golden parity fixtures and Human Experience Review | A17-A24 and A51-A60 |
| Refresh says whether facts changed and preserves safe fallback. | Same | PRD 51 and PRD 38 | P4, P6, P7 | Operation, Store-state, and browser tests | A25-A32, A41-A50, A51-A60 |
| Agent actions use exact wave identity and user intent. | Same | PRD 51 | P1, P6, P7 | Message fixtures and guided host review | A5-A8, A41-A50, A51-A60 |
| Local report controls stay fast and do not call the server. | Same | PRD 51 | P5 | Browser instrumentation and accessibility review | A33-A40 |

## Phase Map

| Phase | Status | File | Required result |
| --- | --- | --- | --- |
| P1 | Closed: source contracts | [Authority and Live Delivery Contract](01-authority-and-live-delivery-contract.md) | Tested pure delivery, model, action, and fallback contracts. Live integration remains later work. |
| P2 | Closed: bounded host proof | [Host and Transport Proof](02-host-and-transport-proof.md) | Claude Desktop `2.16120.0` passed the unshipped resource, tool, fixed message, capability, stdio, and fallback proof. Temporary host setup was restored. Production integration remains later work. |
| P3 | Closed: shared source model | [Shared Model and Dual Renderer](03-shared-model-and-dual-renderer.md) | Unchanged V1 with the separate P1 envelope, shared static rendering, concise chat/live payloads, and exact meaning parity. User-authorized closeout and local commit. No production live widget is claimed. |
| P4 | Closed: source tools and resource | [Backlog Profile Tools and UI Resource](04-backlog-profile-tools-and-ui-resource.md) | Two shared read-only operations, derived tools, useful no-UI results, and one versioned UI resource in the accepted W24 profiles. A25-A32 pass. User-authorized closeout and local commit. Product widget behavior remains later work. |
| P5 | Closed: source widget and local controls | [Live Widget and Local Interaction](05-live-widget-and-local-interaction.md) | Owner-approved live footer, larger-input repair, and affected actual-source proof pass. t1-t6/A33-A40 have bounded evidence. User-authorized closeout and local commit. P6 action execution remains later work. |
| P6 | Closed: bounded source refresh and actions | [Refresh Cache and Agent Actions](06-refresh-cache-and-agent-actions.md) | t1-t6/A41-A50, exact active-agent context, optional cache, controlled requests, and user-requested layout/modal have bounded proof. User-authorized closeout/local commit. Real-host, installed, and PERF-002 acceptance remain P7. |
| P7 | Active: historical claim ledger | [Parity Performance and Acceptance](07-parity-performance-and-acceptance.md) | The exact installed 2.0.5 package displays the report, refreshes, and sends Explain and Work to the connected agent. The owner accepted P11's tested scope for A51, A52, and A54, with wider host limits stated in the ledger. A56 is waived for W25. Final installed accessibility has bounded macOS Codex evidence. |
| P8 | Closed: sequencing gate resolved | [Evidence and Scope Correction](08-evidence-and-scope-correction.md) | Four tasks and the claim ledger remain intact. W26 merged; W25 keeps its own app proof. |
| P9 | Source checks passed; installed proof stays in P11 | [Source and App Remediation](09-source-and-app-remediation.md) | Source repair, cache selection, report delivery, same-chat actions, and approved task count display have local proof. The owner approved the final W25 source commit. |
| P10 | Closed: running Codex host bound to candidate | [Candidate and Connection](10-candidate-and-connection.md) | The 2.0.5 tarball and isolated install passed. The first-party setup added one complete managed entry. The restarted app ran its read-only tools. The crash cause and owner repair are recorded. |
| P11 | Closed: owner-accepted installed scope | [Installed Acceptance](11-installed-acceptance.md) | The exact 2.0.5 package passed Store access, cache, live report, Refresh, Explain, Work, duplicate refusal, final host layout, keyboard, and reduced motion checks in the stated macOS Codex scope. Its saved HTML model matched the live model. A local text-only client received the current summary. The owner later checked the saved browser view and reported a Copilot CLI text review. A host with no app support remains unproved. |
| P12 | Complete: recovery paths kept | [Recovery Cleanup](12-recovery-cleanup.md) | The [applied result](evidence/p12/cleanup-results.md) records 52 removed paths. The [final decision](evidence/p12/final-retention-decision.md) keeps the remaining 15 paths and new private recovery data. The lasting 2.0.5 entry passed the restarted Codex live checks in the named scope. |
| P13 | Complete: bounded closeout | [Closeout and Commit Disposition](13-closeout-and-commit-disposition.md) | The owner approved bounded closeout and the exact local commit. The [review packet](evidence/p13/closeout-review.md) records the corrected Skill guide, exact package, saved-entry setup, passed macOS Codex live check, release hold, open limits, and commit allowlist. |

## Usage Notes

- Read P1–P6 as closed history. P7 retains acceptance history; read P8–P13 in dependency order for remaining work.
- The Bear F1–F3 and W1–W6 labels are mapping labels only. Make Docs phase and task coordinates use W26 R0 P1–P3 and W25 R0 P8–P13.
- Do not treat prior private-candidate or native-open proof as normal Store setup, cache reuse, final accessibility, or release acceptance.
- Do not start any phase without separate owner authority.
- W24 R0 supplied accepted MCP profile authority. Its closed P1-P4 work is merged into this branch at `26bdf1ce`. P4 implementation uses that existing registry and profile model.
- P2 may run a bounded proof before W24 closes. It cannot create a parallel registry or profile system.
- Keep the static report as an explicit option. Do not create it during live open or fallback.
- Keep the snapshot Store-free. Keep cache writes best-effort and after full model validation.
- Keep project text inert. UI messages use fixed actions and exact record references.
- Explain and Work send fixed requests to the connected agent chat. Neither requests another task. Task-creation support cannot disable Work.
- Recheck branch, HEAD, dirty files, profile authority, package state, and concurrent work before each phase.
- Never create or switch a branch or worktree without explicit user permission.
- Create one central `evidence.md` only after evidence exists.
- [Evidence report](evidence.md): P1 contracts, the bounded P2 host proof, P3 shared-model checks, the [2026-10-04 merge handoff](evidence.md#2026-10-04-w24-merge-handoff), [P4 implementation state](evidence.md#p4-implementation-state), and [P5 acceptance](evidence.md#p5-task-and-acceptance-results), with exact limits.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: stage and commit only the approved [77-file allowlist](evidence/p13/commit-allowlist.txt). Keep the prior working package and private backup for rollback. Review the named release limits before requesting separate push or publication authority.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md)
- Why: The backlog is the implementation queue derived from PRD 51 and the W25 R0 plan.
- Coordinate Handoff: P1–P6 remain historical. P7 retains A51–A60 and the W25-only A56 waiver. P8–P13 are complete in the owner-approved bounded scope; W26 R0 P1–P3 supplied the shared access path. The owner approved this exact local commit. Branch/worktree changes, push, publication, and release need separate authority.
