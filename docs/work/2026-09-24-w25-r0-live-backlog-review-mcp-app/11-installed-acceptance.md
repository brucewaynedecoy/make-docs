---
title: "Phase 11: Installed Acceptance"
kind: "work"
status: "complete"
coordinate: "W25 R0 P11"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 11: Installed Acceptance

## Purpose

Prove the W25 user path through one approved package, connection, checkout, and host.

## Overview

This phase owns Bear proposal step 7. P7 remains the historical A51–A60 ledger. Link new evidence to those criteria rather than copying or silently passing them.

## Human Experience Outcome

- Promise: The actual host shows the report, preserves useful local controls, and sends Explain and Work to the connected chat with the intended results.
- Surface and evidence: Real rendered app, same-chat result, fallback, accessibility, and required Human Experience Review.
- Limit: A native-open receipt or accepted message does not prove rendering, explanation, or work.

## Current Testing Decisions

Bind every result to one exact package hash, approved configuration, selected checkout, source version, and host. Use the real report. Use an authorized reversible Work target. Run focused source/package checks first, then actual host checks. Retest affected results after a correction candidate.

## Source PRD Docs

- [PRD 51 Backlog Review](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25 access boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 Store boundary](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

Bear step 7; P7 A51–A60; W26 R0 P3 evidence; approved P10 package and connection; A56 W25-only waiver.

## Stage 1 - Access, cache, and delivery

### Tasks

- [x] t1: Test allowed and missing/read-only/revoked/out-of-scope Store access, all four Store failure states, first cache miss/write/hit, wrong checkout/source/rule/schema rejection, dirty-source invalidation, and sandboxed MCP use. The exact browser-hash package passed the disposable access and cache matrix. The loaded Codex entry returned `ready`, reused current-source cache entries, and disabled stale actions after changed Refresh. Fault cases remain scoped to the disposable Store and client. (Step 7; A55; evidence: result matrix.)
- [x] t2: Prove the complete current report visibly renders, native open/refresh package parity, unchanged/changed refresh and stale judgment, no duplicate action, local-control isolation, chat fallback, and explicit-static meaning parity. The exact 2.0.5 package, installed macOS Codex app, saved HTML model, and local text-only MCP client passed in the [owner-accepted scope](evidence/p11/installed-acceptance-results.md#owner-accepted-p11-scope--2026-10-26). The current saved file has no browser visual result, and a separate unsupported agent host has no user-facing fallback result. The owner accepted these as release-review limits. (Step 7; A51–A54, A57; evidence: real-host and package receipts.)

### Acceptance criteria

- Normal supported access works under approved grants; denial returns the actual reason.
- The visible report is complete and current; optional Store failure keeps source facts usable.
- Changed facts mark old judgment stale. Local controls send no agent request.

### Dependencies

- Approved P10 connection and required W26 R0 P3 results.

## Stage 2 - Connected chat and human checks

### Tasks

- [x] t3: Test Explain and Work against selected captured wave facts in the original connected chat. Check the clear visible action text and one short reference, independent open context, a fresh source-record read, authorized Work effect, stale/duplicate and wrong-wave refusal, and exact result. Do not rely on an unproved hidden Codex message field. A receipt alone does not pass. The installed browser-hash candidate passed clear Explain and Work delivery and strict reference resolution. A bounded P11 record update was the Work effect. Changed source disabled live actions. The strict resolver refused stale and mismatched-wave inputs. A second Explain click showed `Already sent to chat`; only one Explain message reached this chat. These results are scoped to this macOS Codex host and the tested agent resolver. (Step 7; A51–A55, A60; evidence: chat outcomes and P11 installed results.)
- [x] t4: Check wide/narrow, light/dark, no Print button in either report, saved-report browser print layout, keyboard, focus, reduced motion, and safe recovery on the final installed build. Complete the required Human Experience Review. Keep A59 advisory and A56 waived only for W25 R0. (Step 7; A56, A58–A60; evidence: observed review.)
- [x] t5: Update P7 A51–A60 with linked pass, fail, waiver, or unproved scope. The current ledger records A51, A52, and A54 as owner-accepted for their tested scope, with wider host limits still unproved. A53 and A55 pass in their stated package and host scopes. A56 is waived for W25. A57 and A58 pass in stated scope, A59 is advisory, and A60 passes for the tested Codex host and agent resolver. No new correction candidate is justified by the current results. (Step 7; gate: one correction candidate within approved limit.)

### Acceptance criteria

- Explain gives the intended background in the same chat. Work begins the agreed bounded target there.
- A58 and A60 claims match observed installed behavior and the reviewed human surface.
- A56 is a waiver, not a measured pass. A57 carries no unsupported speed or scale claim.
- Each required result has evidence, a failure, or an approved narrower disposition.

### Dependencies

- Stage 1 real report and current action context. Stop at any unapproved effect or exhausted limit.

## Closeout Notes

Keep W25 and P7 open while a required installed or human check lacks proof or an approved partial disposition.

The 2026-10-24 P10 host check passed on the running Codex app. The first P11 access step is complete. The real `project_status` call first returned `store-not-configured`. A setup preview with `--project-resources none` planned removal of many managed files. A reconfigure preview that preserved the current Claude Code MCP choice planned a native Claude Code repair. Neither preview was applied. The owner approved the [one-file Codex project access plan](evidence/p11/project-access-intent-plan.md). The applied YAML adds only Codex MCP access intent. The Claude Code record is unchanged. The running `project_status` call now returns `ready`, and an invalid key returns `store-denied`.

The [installed acceptance results](evidence/p11/installed-acceptance-results.md) record a 76-record snapshot, a full validated report, a 76-miss/cache-write/76-hit sequence, test-only source and schema rejection, and the direct client's sandbox limit. A disposable client checked all four Store failure codes with the installed 2.0.5 package. The owner saw narrow dark, wide dark, and wide light views. The expanded app showed all 76 rows and all 76 Data records. The owner reported `Status: Ready` after Refresh. One W25 Explain action reached this chat. A later changed Refresh showed `Status: Needs review` and disabled stale actions. Keyboard and reduced-motion checks passed in a browser host. The owner accepted guidance to use an explicit static report for printing. The static prompt controls were revised to match the live icon buttons and remove visible prompt text. The owner approved the exact command change to the [isolated static icon candidate](evidence/p11/static-icon-candidate.md). Reopened Codex runs that candidate. Store status is `ready`, and its review tool accepted a current 76-record report. The owner saw that candidate's live app. Its Print control said `Print report`, but a click gave no preview or guidance. Codex exposed `window.print` in that app without a usable preview. A guidance-only candidate passed a browser-host check but was not installed. The installed Codex result remains failed until a new candidate is approved and checked in the host. The tool wrapper exposed no MCP App tab to this agent. Work and print control resolution remain open. Keep t1-t5 open until each task has its complete result or an approved narrower result.

The owner then removed the need for an in-report Print button in both the live and saved reports. The guidance-only candidate was not installed. The current source removes both controls and keeps the static report's browser print layout. An installed check of the no-Print candidate is still needed before the visible host result can close. Same-chat Work and native keyboard and motion proof remain separate checks.

The owner approved the exact [no-Print candidate](evidence/p11/no-print-candidate.md). The saved `make_docs` command changed by one line. The full config parsed. After the owner reopened Codex, the new executable ran and Store status returned `ready`. The loaded tool accepted a current 76-record report. The owner confirmed Theme, Refresh, and Data in the visible live app, with no Print button. Keep P11 t4 open for its other installed checks.

The owner later submitted the saved report's W25 Work prompt in this chat. A fresh installed snapshot still showed W25 active with P11 work open. I used that prompt as review data and updated the [P11 result record](evidence/p11/installed-acceptance-results.md). The submitted prompt reached this chat, but no live `request-task` action or its requested effect was observed. Keep t3 open. The Codex app did not expose the inline app to this agent's UI control, so this turn did not add native keyboard, motion, or live Work proof. No installed connection changed.

The live MCP App then sent `request-task` for W25 R0 into this same chat. The canonical work-item check matched W25. The request used an earlier report session, and W25 source had changed after that session opened. I refused to start its Work effect from stale review facts. This proves live delivery and agent-side stale-source refusal. It does not prove a fresh Work result or duplicate refusal. Keep t3 open and use a current report for the next Work check. No installed connection changed.

I refreshed that app in Codex. It showed `Status: Needs review` and disabled the live action buttons. The expanded W25 wave also showed a second, enabled pair of static copy buttons. I removed that duplicate row from the live source and prepared the [isolated live-controls candidate](evidence/p11/live-action-controls-candidate.md). The 76-record browser preview shows one live Explain icon and one live Work icon. Build, type check, and 88 focused tests passed. The current installed entry has not taken this candidate. P11 t3 and t4 remain open for the fresh Work effect and final host review.

The owner approved that candidate and reopened Codex. The running package hash matched the packet, and the loaded Store check returned `ready`. The visible 76-record app showed one Explain icon and one Work icon on W25, with no extra copy row. Refresh returned `Status: Ready`. This passes the installed duplicate-icon correction. Two Work clicks during the active assistant turn did not show a same-chat result yet. Keep t3 open.

The owner found that the phase bar ran past the W25 row on a narrower wide screen. The installed bar needed 258 pixels in a 201-pixel grid column. I prepared the [layout candidate](evidence/p11/layout-overflow-candidate.md). Its shared report CSS lets the phase cells shrink to the available width. A real browser passed the W25 bounds check at seven widths from 600 to 1200 pixels. Build, type check, and 88 focused tests passed. The installed entry still needs a separately approved move to this candidate before t4 can use it as final host evidence.

The owner approved the exact layout candidate and reopened Codex. The running command and hash matched the packet. The loaded Store check returned `ready`. In the visible 76-record app, the 201-pixel W25 bar fit inside its 702-pixel row with no horizontal overflow. The one live icon pair remained. Refresh returned `Status: Ready`. This passes the installed layout correction. Keep t4 open for the remaining native keyboard, focus, and reduced-motion checks, and keep t3 open for the same-chat Work result.

After a changed-source Refresh, I opened a new report with current W25 facts. The live app sent `request-task` for W25 R0 into this same chat after the assistant turn ended. The canonical path check matched W25, and the current snapshot showed no W25 source edit since that report opened. I used the existing P11 approval to update the [installed result record](evidence/p11/installed-acceptance-results.md) and [P7 claim ledger](07-parity-performance-and-acceptance.md) in this chat. This passes fresh live Work delivery and its bounded authorized effect. Keep t3 open for duplicate refusal and any remaining exact-result check. The record edits make the old report stale for later actions.

The owner then reported that the native keyboard and reduced-motion checks passed in the final installed Codex app. I toggled the final app to light and back to dark. W25 had no horizontal overflow in either mode. The [final Human Experience Review](evidence/p11/installed-acceptance-results.md#final-installed-human-experience-review--2026-10-25) records clarity, control, traceability, safety, and recovery with exact host limits. P11 t4 is complete for the selected host and static browser path. A58 can pass in that scope. Keep t3 and t5 open.

The owner then required clear text for live Explain and Work messages in Codex. The prior installed package sent raw JSON as its one visible `ui/message` text item. The [clear action message candidate](evidence/p11/clear-action-message-candidate.md) changes that text to a fixed request with a readable review reference. It keeps exact old-session and wrong-wave checks, and the agent method now requires a current source-record read before an answer or work. The source and isolated package checks pass. The owner approved the exact saved-command change. The full config parses and differs from its private backup only in that command. Codex still needs a restart and both buttons need installed tests before t3 can close.

The owner later approved and loaded the [action-feedback candidate](evidence/p11/action-feedback-candidate.md). The running Codex connection reported Store access as ready. A fresh 76-record report opened. The owner clicked Explain once. The app showed `Could not send to chat.` The local reason was `Widget hash validation is not active.` No message reached this chat. Work was not tested. The [browser hash correction packet](evidence/p11/browser-hash-action-candidate.md) records the cause, local checks, exact package, and one-value saved-entry plan. The owner approved that exact saved command change. The full config now names the new package and parses with the unchanged `mcp` argument. Codex must restart before the new package can receive the installed button check. Keep t3 and t5 open.

After the owner restarted Codex, the approved browser-hash package ran with its expected hash and Store access ready. A fresh 76-record report opened. The owner clicked Explain and Work separately and controlled when each message reached this chat. Both arrived as clear text with one short reference. I checked both references against the independently rebuilt open context and an unchanged current snapshot. I read the current W25 source before each response. The Work request selected the captured P11 recommendation, and I updated the [installed result record](evidence/p11/installed-acceptance-results.md) here. This record edit made the old report stale. Refresh then showed `Needs review` and disabled its action buttons. The strict resolver refused stale and mismatched-wave inputs. A later fresh report gave an installed duplicate-click check: the second Explain click showed `Already sent to chat`, and one clear Explain action reached this chat. This completes t3 for the tested Codex host and agent resolver.

The P7 A51–A60 review now names each current pass, waiver, advisory result, and missing proof. This completes the t5 claim classification. The exact-package disposable access and cache matrix completes t1 in its stated scope. t2 remains open. It needs full installed report and unsupported-host checks before P11 can close. The new evidence does not authorize P12, a commit, or release.

The latest installed Codex app showed W25 at 58 of 66 tasks and the updated P11 Next action. The owner found that several recent reports lacked Attention. I had supplied an empty `attentionFindings` list while six Backlog records still had conflict states. I opened a corrected report with six source-backed findings. The owner and I both saw Attention in the installed app. The [P11 result record](evidence/p11/installed-acceptance-results.md#installed-report-and-attention-correction--2026-10-26) has the exact scope. Keep t2 open for the remaining cross-host and report parity checks.

I then used one current report for the exact-package saved HTML, installed live Data view, and text-only MCP client. The saved and live full models matched exactly. The text client received the same short summary as the installed tool. Unchanged live Refresh returned to `Ready`. The [one-report result](evidence/p11/installed-acceptance-results.md#one-report-package-live-static-and-text-client-check--2026-10-26) records the hashes and limits. The saved file did not get a browser view because automatic browser review blocked the local file open. A separate unsupported agent host has not shown the fallback to its user. The owner accepted this narrower P11 scope. The two host limits remain for release review. P11's five tasks are complete in that accepted scope. P12 needs its own approval before work starts.
