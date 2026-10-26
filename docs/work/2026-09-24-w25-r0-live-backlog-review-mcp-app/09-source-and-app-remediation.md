---
title: "Phase 9: Source and App Remediation"
kind: "work"
status: "complete"
coordinate: "W25 R0 P9"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 9: Source and App Remediation

## Purpose

Repair W25's real report, cache path, and connected-chat actions under the shared access policy.

## Overview

This phase owns Bear proposal step 4 and the W25 integration part of step 5. It keeps the original removal scope. It does not replace the W26 R0 shared-policy owner.

## Human Experience Outcome

- Promise: A person sees a complete truthful report and can use Explain and Work in the connected chat.
- Surface and evidence: Source/widget behavior, shipped Skill and resource text, approved unknown-count display, and later P11 host proof.
- Limit: Source and package checks alone do not pass actual host delivery or action outcomes.

## Current Testing Decisions

Run focused cache, transport, widget, action, source-version, Skill, and package checks. Test malformed payload rejection and bounded decoding if encoding remains. Use a real report model. P11 owns final installed-host acceptance.

## Source PRD Docs

- [PRD 51 Backlog Review](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25 access boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 Store boundary](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

Bear steps 4–5 and 15; R-BACKLOG-APP-1–16; R-BACKLOG-CACHE-1–8; P7 A51–A55, A57–A60; exact P8 inventory.

## Stage 1 - Approved repair and focused checks

### Tasks

- [x] t1: Remove the uncommitted request-resolve tool, wave-task prompt, `prompts/get` override, resolver-only storage, and task-creation behavior. Keep strict action identity, stale-source, and duplicate guards. (Step 4; evidence: registry and action tests.)
- [x] t2: Read current facts, use only valid hits returned by the Store cache, judge misses freshly, validate the whole report, write eligible fresh fragments through the existing operation, and recompute portfolio conclusions. Reject wrong checkout/source/rule/schema fragments and private-report reuse. (Step 5; evidence: cache lifecycle tests.)
- [x] t3: Trace and repair real report delivery with only necessary bounded transport handling. Prove malformed or oversized payload rejection and complete model parity. (Steps 4–5; evidence: source and package checks.)
- [x] t4: Preserve approved Explain/Work names, icons, and layout. Correct shipped Skill/process/resource text; keep needed P7 scripts under evidence and out of shipped assets; retain removal of the `git show HEAD:` comparison test. (Step 4; evidence: package and instruction checks.)
- [x] t5: Show the exact replacement text and display behavior for unknown task counts, then apply only the owner-approved UI change. Distinguish known zero, unknown, unsupported, and unavailable. (Step 4; gate: separate UI review; evidence: source and visual checks.)

### Acceptance criteria

- The app has no separate-task substitute for Explain or Work.
- Optional cache refusal preserves a complete fresh review and names the limit.
- Current facts and source versions reflect relevant uncommitted changes.
- No unknown count appears as a factual `0 of 0`.
- The source, generated widget, shipped Skill, and package reflect the same approved behavior.

### Dependencies

- P8 inventory, W26 R0 P1 approved design, and separate source/UI authority. W25-only source work may run beside W26 R0 P2–P3 with clear file ownership. Shared-path integration consumes passed P3 checks. Preserve other dirty work.

## Closeout Notes

On 2026-10-24, source and package checks passed after the generated widget was rebuilt. The first full run passed 1,956 tests and failed one generated-byte check. The corrected generated-byte check and 128 affected tests then passed. Type check and build passed. The isolated 2.0.5 tarball started an MCP server with the four needed Backlog Review tools. Its widget resource bytes matched the generated source asset. [The task count browser review](evidence/p9/unknown-task-count-review.md) records the owner-approved text and its synthetic visual proof.

The cache helper now checks lookup digests and versions against the current snapshot. It sends only fresh `miss` or `rejected` fragments to the existing write operation. Exact hits cause no write. Failed lookup or write does not discard the full report. The shared Store gates still control real reads and writes.

The three untracked P7 proof scripts remain under `evidence/p7/tools/`. They did not enter the package. P13 must decide their final source-control state. P9 does not claim installed delivery, normal cache use, or connected-chat success. P11 owns those checks.
