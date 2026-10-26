---
title: "Phase 8: Evidence and Scope Correction"
kind: "work"
status: "complete"
coordinate: "W25 R0 P8"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 8: Evidence and Scope Correction

## Purpose

Set the true W25 boundary and correct the claim ledger before further repair.

## Overview

This phase owns Bear proposal step 1 and the W25 inventory part of step 15. P7 remains the A51–A60 acceptance record. P1–P6 retain their closed, bounded history. The owner rejected the current release result.

## Human Experience Outcome

- Promise: The owner can see what works, what failed, and what still needs proof.
- Surface and evidence: W25 index, claim ledger, risk register, and exact connection/candidate inventory.
- Limit: Inventory and prior private-candidate results do not pass normal installed acceptance.

## Current Testing Decisions

Use read-only status, diff, connection, package, and evidence checks. Do not run a new candidate, alter grants, or delete recovery material in this phase.

## Source PRD Docs

- [PRD 51 Backlog Review](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25 access boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

Bear steps 1 and 15; P7 A51–A60; owner release rejection; `store-denied`; unknown counts displayed as zero; final-installed accessibility still open.

## Stage 1 - Inventory and claim correction

### Tasks

- [x] t1: Record branch, HEAD, staged and dirty allowlist, active connection, installed package, candidate paths, and ownership of each change. Mark exact dependencies on temporary recovery files. (Step 1; evidence: dated inventory.)
- [x] t2: Classify every W25 claim as source test, mock/synthetic, private candidate, supported installed path, or observed host action. Link the exact package/configuration/source where known. Reopen only claims without required proof. (Step 1; A51–A60; evidence: claim ledger.)
- [x] t3: Correct the W25 index, P7 progress, risk entries, and single summary to show the owner's release rejection, normal Store-access gap, false unknown-count display, and remaining accessibility checks. Preserve earlier failures and useful proof. (Step 1; evidence: authority diff.)
- [x] t4: Record earlier P7 time windows as historical. Cost W26 R0 P1–P3 and W25 P9–P13 together before seeking a new work limit. (Step 15; gate: finite scope review.)

### Acceptance criteria

- The current status does not claim release readiness or normal Store access.
- Each A51–A60 claim names its exact proof scope or open gap.
- P1–P6 and P7 history remain readable without retroactive renumbering.

### Dependencies

- Read-only checkout and connection access. W26 R0 P1 consumes this inventory; P9 uses its dirty-file ownership list.

## Closeout Notes

### 2026-10-09 checkout and file inventory

This is the read-only state before P8 document edits. The current checkout is branch `w25-r0-p1-live-delivery-contract` at HEAD `58106b675fd89c27b47992898f7b37da4ba097e1` (`plan: [W25 R0] Live Backlog Review MCP App`). The index has no staged files. Git shows 24 modified tracked files and 1,318 untracked files. The 24-file diff has 773 added and 189 removed lines. No P8 source test or new installed-host action ran.

| File set | Count and exact scope | Current owner and next gate |
| --- | --- | --- |
| W25 plan and work records | Five modified tracked files: plan `06-refresh-cache-and-agent-actions.md`, plan `07-parity-performance-and-acceptance.md`, work `06-refresh-cache-and-agent-actions.md`, work `07-parity-performance-and-acceptance.md`, and `evidence.md` under this W25 plan/work pair. | Earlier P7 recovery history. P8 may make additive status corrections. P13 owns final reconciliation. Preserve existing changes. |
| MCP app and backlog operation source | Eleven modified tracked files: `packages/cli/src/mcp/assets/backlog-review-v1.html`, `backlog-review-v1.ts`, `default-app-resources.ts`, `server.ts`, five files under `packages/cli/src/mcp/widget/` (`container-size.ts`, `entry.ts`, `live-view.ts`, `request-controller.ts`, `state.ts`), and `packages/cli/src/operations/work/backlog/agent-contracts.ts` and `review-operation.ts`. | Earlier P7 repair; W25 P9 owns app-specific disposition. W26 P1 must name any shared access overlap before W26 P2 or P9 edits `server.ts` or operation context. |
| Tests and new source | Three modified tracked tests: `packages/cli/tests/backlog-request-controller.test.ts`, `backlog-widget.test.ts`, and `mcp-profiles.test.ts`. Six untracked files: `packages/cli/src/mcp/backlog-transport.ts`, `packages/cli/src/mcp/widget/diagnostics.ts`, `packages/cli/src/operations/work/backlog/source-failure.ts`, `packages/cli/tests/backlog-action-surface.test.ts`, `backlog-transport.test.ts`, and `backlog-widget-diagnostics.test.ts`. | Earlier P7 repair. W25 P9 owns review, source checks, and candidate inclusion. No file is safe to drop by inference. |
| Shipped Skill | Five modified tracked files under `packages/skills/backlog-review/`: `README.md`, `SKILL.md`, `references/report-model.md`, `references/review-method.md`, and `scripts/agent-contract.mjs`. | Earlier P7 repair; W25 P9 owns shipped-text parity. W26 P2 owns only an approved shared contract change. |
| Local recovery and proof | 1,282 untracked `.codex/` files, plus 30 untracked P7 evidence files. `.codex/` uses about 276 MB. `docs/work/.../evidence/p7/` uses about 12 MB. | P7 proof and active local state. P10 owns connection/candidate review; P11 owns new host proof; P12 owns an exact cleanup proposal. No broad deletion or Git add is allowed. |

This table and the next inventory describe the P8 state on 2026-10-09. P12 later found that the checkout no longer has `./.codex/`. The [P12 file status record](evidence/p12/recovery-link-disposition.md) lists the missing local receipts. Do not use the old paths as current dependencies.

The `.codex/w25-recovery/` Git inventory had three candidate entries, 60 host files, six installed-tree file entries, 1,203 qualification file entries, and `current-candidate.json`. Git counts excluded ignored files; the disk-size estimate included them. The large qualification and install trees were local test material. Their counts did not establish that every file was useful evidence. P12 now lists current paths and active use before any deletion.

### Connection and candidate boundary

At the P8 check, `codex mcp list --json` reported three enabled entries. Global `make-docs` launched `~/.nvm/versions/node/v24.19.0/bin/make-docs mcp` without an entry environment. Global `make_docs` launched the global 2.0.4 `dist/index.js mcp` with a caller-identity environment value. Project `make_docs_current_backlog` launched Node v24.19.0 with `.codex/w25-recovery/installed/repair-1/node_modules/@brucewaynedecoy/make-docs/dist/index.js mcp --profile backlog` and this checkout as its working directory. These were distinct connection records. This inventory did not prove which one received each earlier call, what grant it had, or that they used the same bytes. Do not copy the caller-identity value into a new connection by assumption.

The P8 project connection depended on `.codex/config.toml` and the repair-1 installed runtime. Its binding receipt was `.codex/w25-recovery/host/repair-1-binding.json`; its backup and proposed configuration were under `.codex/w25-recovery/host/`. The candidate pointer named version 2.0.4, source HEAD `fe9d312cafd54dff39d2e4c30cb3a480abc97b0c`, source-input SHA-256 `5718cfddf873f40ecf3ddeb41022ae8ac2e39963d12c6bc43cf8a56fbb9af39d`, repair-1 tarball SHA-256 `922beaf930f7374ccab83dc126d5a38c7dc8412c2cb1157fe05f77aa9dcd4a2f`, installed runtime SHA-256 `26a848500b3e62cb638c2c41b812c9d79cc16981345b2b09ae9d1c4d005d9863`, and widget SHA-256 `e9f5867cab1604de2cf429960070e7b253eb13ff8fcf9c420beb2bebf265dc97`. P8 checked the tarball and runtime hashes against files present then. Those local files are now absent. The global installed runtime had a different SHA-256, `97d38f20a7ff7e2f90dc1d998acc66de9277df7040aacc2b7babfbe8cd051c14`. P10 later built and bound a new candidate; old proof did not move to it.

The P8 instruction was to keep `.codex/config.toml`, the repair-1 runtime and tarball, the candidate pointer, binding and configuration backups, final host receipts, and referenced P7 evidence until P10–P12 decided their exact disposition. The user later removed the checkout's `.codex/` tree. The P7 evidence under `docs/` remains a separate review set. This historical inventory did not approve retention in a commit or deletion.

### A51–A60 claim ledger

Each row names the strongest retained proof and its present limit. The [single recovery summary](evidence.md#recovery-closeout-summary) holds the detailed historical chain. The common private candidate is repair-1 SHA-256 `922beaf930f7374ccab83dc126d5a38c7dc8412c2cb1157fe05f77aa9dcd4a2f` under the project connection above. The owner's later release trial is a separate observed host result. P11 must bind new proof to one approved package, connection, checkout, and host.

| Claim | Evidence class and exact result | P8 disposition |
| --- | --- | --- |
| A51: source and installed parity | Source tests reported 300 affected passes. The private installed package reported 91 functional checks. The repair-1 Codex host rendered 73 records. The [qualification status](evidence/p12/recovery-link-disposition.md#h13) and [native display status](evidence/p12/recovery-link-disposition.md#h07) show that the old local receipts are absent. The recorded hashes and result text remain. | Historical bounded claim for the old candidate only. Later package proof is separate. |
| A52: live default and fallback | The private installed checks cover live selection and chat fallback. Codex visibly rendered the live report. Other supported-host behavior was not observed in this final run. | Partial. P11 must prove the approved normal path and the required fallback scope. |
| A53: static only on request | Private installed functional checks cover explicit static output and no hidden static file. No real-host static output was observed in the final run. | Bounded installed check. P11 must carry this result to the new package and requested path. |
| A54: meaning across paths | Installed parity checks and native Data show a complete model. The owner's visible report showed `0 of 0 tasks complete` for unsupported records with unknown counts. | Failed for the visible unknown-count claim. P9 needs approved text/display correction; P11 must retest meaning parity. |
| A55: Store state and cache failure | A different attempt-2 package passed 28 temporary Store-fault checks, including `store-denied`, `store-unavailable`, `store-unsafe`, and `store-not-configured`. The owner observed `store-denied` on the normal cache lookup, while Store-free review continued. No normal cache miss/write/hit was proved. | Open. Temporary faults and current-source fallback do not prove approved Store access or reuse. W26 P3 and W25 P11 own the missing proof. |
| A56: PERF-002 | The recorded W25-only waiver has zero measured observations. The 73-record fixture is a delivery input. [Waiver status](evidence/p12/recovery-link-disposition.md#h02). | Waived for W25 R0 only. No speed or scale pass. |
| A57: no unsupported speed claim | No qualified timing result or scale claim exists. The recorded waiver expressly leaves the other criteria intact. | Constraint met as a record limit. Do not turn delivery counts into a performance result. |
| A58: accessibility | The final private candidate has wide light/dark host observations. Narrow, print, keyboard, focus, and reduced-motion checks are missing on that installed build. [Agent review status](evidence/p12/recovery-link-disposition.md#h04). | Open. P11 must check the final installed surface. |
| A59: Guided Progress Review | The earlier invitation offered Search, Data, and close Data. A response is optional. | Advisory invitation recorded. Silence is no acceptance gate. |
| A60: Human Experience Review | The agent review supports bounded core native/installed behavior. The owner then rejected the current app for release. Store refusal, false visible zero, and missing A58 proof limit the broader claim. | Bounded historical review retained. Current release-level experience claim is open until P11 reviews the corrected real result and the owner makes any named release decision. |

The P8 record says that same-chat Explain produced an explanation and Work produced a read-only evidence review. It does not claim a task edit or general implementation result. Native changed Refresh showed `Needs review` and disabled stale actions. These host outcomes support only their observed paths; they do not prove a later package or normal Store access. The old local files for [Explain](evidence/p12/recovery-link-disposition.md#h03), [Work](evidence/p12/recovery-link-disposition.md#h08), and [changed Refresh](evidence/p12/recovery-link-disposition.md#h05) are unavailable. This paragraph retains the historical result text, not the raw receipts.

The risk register already has the matching narrow state. D-046 is closed only for repair-1 Codex display. D-047 remains open for normal Store cache access. D-048 remains open for the false visible zero. The W25 index, P7 progress, and single summary now point to this claim ledger. Earlier P1–P7 proof and failures remain in place.

### Input for W26 R0 P1

P1 starts from the three enabled connection entries and the observed `work.backlog-cache.lookup` refusal. That refusal named required `store:read` and `project:read` but effective `store:none` and `project:none`. Which enabled connection produced `store-denied` is unknown. The caller entry, grant source, policy decision, and reason for the mismatch are also unproved. P1 must trace setup, caller context, operation registry, cache lookup/write, Store session, and result serialization for the connection that produced the refusal. It must separate the project repair-1 package from the different global 2.0.4 runtime and record package and configuration hashes before comparing results. The current file ownership table flags `packages/cli/src/mcp/server.ts` and backlog operation context as a shared-edit boundary with W25 P9. P1 must return the keep/move/remove check matrix, exact policy and PRD proposal, migration and revocation rules, test list, and refined combined work limit. No hand-supplied caller value or private report file is an acceptance substitute.

### Combined next-work estimate and P8 gate

The estimate covers W26 foundation work that W25 acceptance needs. Hours are active work, not owner wait time. Ranges include focused tests and one review cycle. They exclude a third release candidate, a larger migration, a new service, global installation change, or added UI scope. P1 must refine the range after it traces the actual access path.

| Phase | Active-hour estimate | Main source of uncertainty |
| --- | ---: | --- |
| W26 R0 P1: trace and design | 3–5 | Three connection paths, caller-proof chain, exact policy and PRD redline. |
| W26 R0 P2: shared core and setup | 6–10 | Approved policy, setup migration, adapters, and shipped contracts. |
| W26 R0 P3: cross-interface proof | 4–6 | Normal and denied grants, sandboxed host Store operation. |
| W25 R0 P9: source and app repair | 5–8 | Real cache integration, changed-source checks, and approved unknown-count UI. |
| W25 R0 P10: candidate and connection | 2–3 | One exact build, review packet, approval, install, and binding. |
| W25 R0 P11: installed acceptance | 4–7 | Store lifecycle, same-chat Work effect, full accessibility and Human Experience checks. |
| W25 R0 P12: recovery cleanup | 2–4 | Exact path list, active dependency and link checks, owner decision. |
| W25 R0 P13: closeout and commit disposition | 2–3 | Authority, summary, remaining obligation, and commit allowlist review. |
| **Combined** | **28–46** | **W26: 13–21; W25: 15–25.** |

The Bear plan's earlier 12-hour W25 implementation ceiling cannot cover the needed W26 foundation and W25 acceptance. Its P7 time windows are history, not renewed authority. The proposed W26 P1 limit and the pending P8 gate above record the 2026-10-09 decision state. They do not describe the current checkout.

### 2026-10-24 P8 gate decision

The owner directed W25 to take the merged W26 foundation and continue the W25 work. W26 R0 merged into `main` at `47e0e9e8`. The W25 branch took that main history in merge commit `93c0ae63`. W26's normal, denied, source-version, rollback, and sandbox Store proof is shared foundation proof. It does not prove W25's visible Refresh, cache use in a complete report, or installed app acceptance. Those claims remain in P9 and P11. The P8 inventory and claim correction are complete. Close P8's sequencing gate and proceed with P9 in this checkout. Preserve the three untracked P7 proof scripts until their exact disposition is reviewed.
