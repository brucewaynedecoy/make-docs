---
title: "W22 R0 P6 Real Platform Package Proof and Closeout"
kind: "plan"
status: "draft"
coordinate: "W22 R0 P6"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P6 Real Platform Package Proof and Closeout

## Purpose

Prove one release candidate on real Windows, macOS, and Linux environments. Close the architecture recovery only from installed results.

## Outcome

One identified package passes the same required cases on all three platform families. The evidence shows common public meaning and any justified platform-specific limit. Current PRDs, risk items, guides, and dogfood state match the result.

## Candidate Matrix

Run at least these cases from the same source revision and package identity:

- fresh project and Store;
- existing current installation;
- supported old installation through the compatibility bridge;
- moved checkout;
- package update with unchanged managed native entry;
- changed native entry;
- Store absent, denied, unsafe, and unavailable;
- interrupted apply and process restart;
- stale lock and concurrent writer;
- selected resource projection, repeat setup, repair, and removal; and
- every symptom case from the P5 table.

Use real local file systems. Add a network or UNC case when current accepted support includes it. Do not replace a missing platform result with a mock.

## Closeout Review

Run focused tests, full CLI tests, default validation, package smoke proof, PRD authority validation, links, path hygiene, and `git diff --check`. Reconcile current guides and release claims. Dogfood only through the normal installed path after the candidate matrix passes.

Complete the Human Experience Review for HX-1 through HX-6. Record the evidence, direct observations, conclusion, reviewer, limits, and next action for each promise. Offer a short optional owner try-it path. Do not claim the owner's lived experience without their feedback.

## Exit Criteria

- The same package identity and source revision are proved on Windows, macOS, and Linux.
- Each platform returns the same public state, safety result, and next action for equivalent cases.
- Every accepted P1 mechanism decision is implemented or has an accepted later obligation.
- Every supported old state has a bridge result.
- Every known symptom is closed or has an explicit owner-approved blocker.
- Current PRDs and risk items match the shipped result.
- No temporary migration authority remains active.
- The final report states what the proof does not cover.

P6 completion does not itself authorize publication or release. Those actions need their normal separate authority.
