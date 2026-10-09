---
title: "W26 R0 P3 Cross-Interface Proof"
kind: "plan"
status: "draft"
coordinate: "W26 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-10-09-shared-access-and-data-foundation.md"
---

# W26 R0 P3 Cross-Interface Proof

## Purpose

Prove the approved shared path that W25 needs before its installed acceptance.

## Outcome

Allowed and denied CLI/MCP calls agree on facts, identity, source versions, and typed errors. Normal setup works without a private caller-proof patch. A sandboxed client reaches an allowed host-owned Store operation through MCP.

## Scope

Test read-only and write-intent access with missing, read-only, revoked, and out-of-scope grants. Test Store not configured, unavailable, unsafe, and denied. Test grant changes, migration and rollback, current and moved checkout selection, dirty-source versions, and optional-cache refusal. Use the same approved P2 policy and exact source/configuration for all compared calls.

## Verification

Retain small CLI/MCP result receipts and one sandbox proof with exact package/configuration identity. Confirm that Store-free source facts survive optional cache refusal and that a refused write changes nothing. Record each failed or unproved case. W25 may consume only the passed cases.

## Dependencies

P2 source and setup checks pass. Any connection replacement remains under W25 R0 P10 approval.
