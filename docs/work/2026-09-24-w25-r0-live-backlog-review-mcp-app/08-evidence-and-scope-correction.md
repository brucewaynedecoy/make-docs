---
title: "Phase 8: Evidence and Scope Correction"
kind: "work"
status: "draft"
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

- [ ] t1: Record branch, HEAD, staged and dirty allowlist, active connection, installed package, candidate paths, and ownership of each change. Mark exact dependencies on temporary recovery files. (Step 1; evidence: dated inventory.)
- [ ] t2: Classify every W25 claim as source test, mock/synthetic, private candidate, supported installed path, or observed host action. Link the exact package/configuration/source where known. Reopen only claims without required proof. (Step 1; A51–A60; evidence: claim ledger.)
- [ ] t3: Correct the W25 index, P7 progress, risk entries, and single summary to show the owner's release rejection, normal Store-access gap, false unknown-count display, and remaining accessibility checks. Preserve earlier failures and useful proof. (Step 1; evidence: authority diff.)
- [ ] t4: Record earlier P7 time windows as historical. Cost W26 R0 P1–P3 and W25 P9–P13 together before seeking a new work limit. (Step 15; gate: finite scope review.)

### Acceptance criteria

- The current status does not claim release readiness or normal Store access.
- Each A51–A60 claim names its exact proof scope or open gap.
- P1–P6 and P7 history remain readable without retroactive renumbering.

### Dependencies

- Read-only checkout and connection access. W26 R0 P1 consumes this inventory; P9 uses its dirty-file ownership list.

## Closeout Notes

Keep P8 open until the claim ledger and cross-package work estimate are reviewable.
