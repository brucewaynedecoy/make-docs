---
title: "W22 R0 P1 Architecture Inventory and Decision Gates"
kind: "plan"
status: "draft"
coordinate: "W22 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P1 Architecture Inventory and Decision Gates

## Purpose

Create a complete and reviewable account of the current Store, checkout, harness, setup, projection, recovery, and platform mechanisms. Stop additive growth while this account is open.

## Outcome

The owner receives one decision package. It shows what exists, why it exists, who uses it, what state it owns, what failure it prevents, and whether the recommendation is `keep`, `rework`, or `remove`.

## Scope

Inventory public commands, MCP routes, setup flows, Store tables, migrations, operation journals, installation ledgers, checkout identity, path claims, locks, receipts, executable proof, access policy, resource projection, native file mutation, recovery, release checks, and their tests and docs.

Record every known symptom. Map each symptom to a mechanism, an authority owner, a human promise, and an evidence gap. Mark unconfirmed reports as unconfirmed.

## Decision Rules

- Keep a mechanism only with a current accepted need and direct proof.
- Rework a mechanism when the need is valid but the authority, coupling, platform model, or human path is wrong.
- Remove a mechanism when it duplicates authority, stores only rebuildable data, has no accepted consumer, or supports only another removable mechanism.
- Do not infer value from code size, age, or dependency count.
- Do not infer removal safety from a lack of current tests.
- Do not add a new mechanism while P1 is open unless a release-blocking defect needs bounded containment.

## Required Decision Packet

The packet must settle these questions one at a time:

1. Which repository facts are canonical?
2. Which Store facts are non-rebuildable and canonical?
3. What identifies a project, a checkout, a managed native entry, and the current executable?
4. Which facts can be rebuilt from the repository, Store, or live machine?
5. Which safety checks are durable and which are valid only during one mutation window?
6. Which setup steps are product flow and which are internal composition?
7. Which resource projection facts need durable state?
8. What must behave the same on Windows, macOS, and Linux?
9. What old state must the compatibility bridge understand?
10. Which public capabilities would disappear if a proposed removal proceeds?

## Verification

Trace current source, current PRDs, public help, JSON and MCP routes, installed evidence, tests, and commit history. Use counts only as orientation. Use call paths and accepted requirements as proof.

P1 closes only when every in-scope mechanism and known symptom has one disposition, owner, evidence statement, and unresolved question. The owner must accept the target decisions before P2 changes current product authority.
