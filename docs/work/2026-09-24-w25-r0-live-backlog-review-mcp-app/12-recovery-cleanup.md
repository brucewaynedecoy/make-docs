---
title: "Phase 12: Recovery Cleanup"
kind: "work"
status: "draft"
coordinate: "W25 R0 P12"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 12: Recovery Cleanup

## Purpose

Remove only approved recovery residue after the retained connection no longer depends on it.

## Overview

This phase owns Bear proposal step 8. A cleanup approval is separate from implementation, connection replacement, and commit approval.

## Human Experience Outcome

- Promise: The active app keeps working while the user can review each proposed deletion.
- Surface and evidence: File-level inventory, live connection references, repaired links, and post-cleanup checks.
- Limit: A smaller directory alone does not prove the app is independent of recovery files.

## Current Testing Decisions

Use exact path and reference checks. Retain minimal receipts needed to explain the accepted result. Check the active connection after any approved deletion.

## Source PRD Docs

- [PRD 51 Backlog Review](../../prd/51-backlog-review-and-reporting.md)
- [PRD 38 Store and project state](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

Bear steps 8 and 15; P8 ownership inventory; P10 old and replacement candidates; P11 acceptance disposition.

## Stage 1 - Exact cleanup decision and verification

### Tasks

- [x] t1: List every candidate recovery path, size, purpose, owner, active reference, proposed keep/remove result, and prerequisite. Separate installs, `node_modules`, qualification projects, caches, reports, snapshots, backups, current connection, and other workers' files. The [P12 inventory](evidence/p12/recovery-inventory.md) covers 67 roots and a private file-level list. It marks inferred ownership and paths that must stay in place. (Step 8; evidence: file-level list.)
- [x] t2: Move only needed small receipts into W25 evidence, repair links, and show the exact deletion list for owner approval. No old P7 receipt remains to move. The P10 and P11 records already retain the needed hashes and results, so no temp file was copied. The [old file-status record](evidence/p12/recovery-link-disposition.md) replaces 23 broken links. The [exact proposal](evidence/p12/cleanup-proposal.md) lists 52 removal paths and 15 kept paths. No deletion is approved. (Step 8; gate: exact cleanup approval.)
- [x] t3: Delete only approved paths after their dependencies are gone. Verify active connection, package behavior, links, and Git diff. The owner approved 52 exact roots. The [applied result](evidence/p12/cleanup-results.md) records their removal, 15 kept roots, the live package and Store checks, and the link and Git checks. No install or scratch data entered Git. (Step 8; evidence: post-cleanup checks.)

### Acceptance criteria

- Every removed path appeared in the approved list and was no longer used by the active connection.
- No unrelated file or setting changed. No `.codex/` pattern deletion or ignore-rule substitute was used.
- Retained evidence explains the exact tested result without a private runtime dependency.

### Dependencies

- P11 disposition and owner approval of the exact file list.

## Closeout Notes

Keep P12 open if active references or unreviewed file ownership remain.

The owner approved inventory, receipt and link review, and then the exact 52-path removal list. All 52 paths were removed after a file-level rescan matched the approved SHA-256. The saved `make_docs` entry and two running MCP processes still use the kept browser-hash test package. P12 t1–t3 are complete within the approved removal set. Keep P12 open for a separate decision on that active temporary dependency and the private backups. Do not treat task checks as approval to change the saved entry or remove any kept path.

The [final 2.0.5 package and connection plan](evidence/p12/final-205-package-and-connection-plan.md) records the fresh archive hash, isolated CLI and MCP checks, Store and action results, and the exact saved-entry blocker. Three processes used the old temporary package at the new check. The Store receipt still names the P10 command and an older key. The current managed block also contains three tool approval tables. A separate test home proved a full-block Make Docs setup recovery that keeps those approvals outside the managed block. The lasting install and saved-entry change await separate owner approval. Keep P12 open and retain all still-needed package and private backup paths until the new Codex live checks pass.

The owner approved the exact plan. The lasting package install passed and has the expected archive, executable, and app asset hashes. Before the saved-entry step, the full Codex config hash changed. The script stopped before backup or mutation. The managed `make_docs` block and its three approvals did not change. The [plan](evidence/p12/final-205-package-and-connection-plan.md) now proposes a guard on that exact block while it preserves the current outside config bytes. This revised guard needs owner review. P12 remains open.

The owner approved the revised guard. Make Docs setup replaced the saved block with the lasting 2.0.5 command and a new Store key. The three tool approvals remain in the config. The normal setup preview is `unchanged`. The project Store is `ready`. A direct client used the saved identity to list 45 tools and read 76 records. The [package and connection record](evidence/p12/final-205-package-and-connection-plan.md) holds the hashes and results. Keep the old package and private backup until Codex restarts and the live checks pass. Then decide those retained paths before P13 closeout.

The restarted Codex app loaded the lasting package. It showed the 76-record report, refreshed to `Status: Ready`, and sent clear Explain and Work messages to this chat. The [final retention decision](evidence/p12/final-retention-decision.md) keeps the old candidate, private backups, and temporary qualification folder as local recovery data. Two MCP processes used the lasting install; none used the old candidate. The approved 52-path deletion is complete, and no further deletion is part of P12. P12 is complete in this kept-path scope. P13 owns the remaining release and commit decisions.
