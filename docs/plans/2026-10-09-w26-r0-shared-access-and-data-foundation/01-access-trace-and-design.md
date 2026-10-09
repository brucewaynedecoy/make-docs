---
title: "W26 R0 P1 Access Trace and Design"
kind: "plan"
status: "draft"
coordinate: "W26 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-10-09-shared-access-and-data-foundation.md"
---

# W26 R0 P1 Access Trace and Design

## Purpose

Make the current refusal and proposed smaller policy reviewable before access changes.

## Outcome

One current/proposed call-path map, a keep/move/remove matrix for each caller, receipt, package, native-entry, grant, and Store check, and an exact PRD/config/schema/migration/rollback packet. The owner accepts or rejects that packet before P2.

## Scope

Trace `work.backlog.snapshot`, `work.backlog-cache.lookup`, `work.backlog-cache.write`, and live refresh through setup, adapter context, registry, policy, Store session, and serialization. Record project selection, Store location, granted scope, write intent, and refusal at each boundary. Define stable project/checkout/item/source-version rules, including dirty content and unavailable states. List changed source files, tests, work limit, and grant revocation behavior. Preserve current authority until approval.

## Verification

Reproduce normal setup and the observed `store-denied` path without changing production grants. Compare current PRDs 25, 38, and 39 with the proposed redline. Review denial and Store-free cases. P1 passes when the packet names every changed check and affected interface; it does not pass because a private identity value makes one candidate work.

## Dependencies

Read-only source and configuration access. No connection, policy, installation, or cleanup mutation is included. Owner access-design approval gates P2.
