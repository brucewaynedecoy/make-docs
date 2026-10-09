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

- [ ] t1: List every candidate recovery path, size, purpose, owner, active reference, proposed keep/remove result, and prerequisite. Separate installs, `node_modules`, qualification projects, caches, reports, snapshots, backups, current connection, and other workers' files. (Step 8; evidence: file-level list.)
- [ ] t2: Move only needed small receipts into W25 evidence, repair links, and show the exact deletion list for owner approval. Keep the rollback candidate until safe to remove. (Step 8; gate: exact cleanup approval.)
- [ ] t3: Delete only approved paths after their dependencies are gone. Verify active connection, package behavior, links, and Git diff. Exclude installs and scratch data from any commit. (Step 8; evidence: post-cleanup checks.)

### Acceptance criteria

- Every removed path appeared in the approved list and was no longer used by the active connection.
- No unrelated file or setting changed. No `.codex/` pattern deletion or ignore-rule substitute was used.
- Retained evidence explains the exact tested result without a private runtime dependency.

### Dependencies

- P11 disposition and owner approval of the exact file list.

## Closeout Notes

Keep P12 open if active references or unreviewed file ownership remain.
