---
title: "Phase 11: Installed Acceptance"
kind: "work"
status: "draft"
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

- [ ] t1: Test allowed and missing/read-only/revoked/out-of-scope Store access, all four Store failure states, first cache miss/write/hit, wrong checkout/source/rule/schema rejection, dirty-source invalidation, and sandboxed MCP use. (Step 7; A55; evidence: result matrix.)
- [ ] t2: Prove the complete current report visibly renders, native open/refresh package parity, unchanged/changed refresh and stale judgment, no duplicate action, local-control isolation, chat fallback, and explicit-static meaning parity. (Step 7; A51–A54, A57; evidence: real-host and package receipts.)

### Acceptance criteria

- Normal supported access works under approved grants; denial returns the actual reason.
- The visible report is complete and current; optional Store failure keeps source facts usable.
- Changed facts mark old judgment stale. Local controls send no agent request.

### Dependencies

- Approved P10 connection and required W26 R0 P3 results.

## Stage 2 - Connected chat and human checks

### Tasks

- [ ] t3: Test Explain and Work against selected captured wave facts in the original connected chat. Check independent open context, fresh source, authorized Work effect, stale/duplicate refusal, and exact result. A receipt alone does not pass. (Step 7; A51–A55, A60; evidence: chat outcomes.)
- [ ] t4: Check wide/narrow, light/dark, print, keyboard, focus, reduced motion, and safe recovery on the final installed build. Complete the required Human Experience Review. Keep A59 advisory and A56 waived only for W25 R0. (Step 7; A56, A58–A60; evidence: observed review.)
- [ ] t5: Update P7 A51–A60 with linked pass, fail, waiver, or unproved scope. Name any needed correction candidate and retest only affected outcomes. (Step 7; gate: one correction candidate within approved limit.)

### Acceptance criteria

- Explain gives the intended background in the same chat. Work begins the agreed bounded target there.
- A58 and A60 claims match observed installed behavior and the reviewed human surface.
- A56 is a waiver, not a measured pass. A57 carries no unsupported speed or scale claim.
- Each required result has evidence, a failure, or an approved narrower disposition.

### Dependencies

- Stage 1 real report and current action context. Stop at any unapproved effect or exhausted limit.

## Closeout Notes

Keep W25 and P7 open while a required installed or human check lacks proof or an approved partial disposition.
