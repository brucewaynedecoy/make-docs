---
title: "W22 R0 P2 Product Authority and Minimal State Model"
kind: "plan"
status: "draft"
coordinate: "W22 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P2 Product Authority and Minimal State Model

## Purpose

Turn the accepted P1 decisions into one current product contract before implementation begins.

## Outcome

The active PRDs state one repository and Store boundary, one identity model, one operation and recovery model, one harness ownership model, one setup composition model, one resource projection model, and one platform support rule.

## Authority Work

Update existing owner PRDs only. Create no editorial or cross-cutting recovery PRD. Add current normative text inline. Preserve material former contracts in requirement history. Add numbered drift, question, and rebuild-risk items to PRD 03 without renumbering old items.

The accepted state classification must use these classes:

- repository-canonical and portable;
- Store-canonical and non-rebuildable;
- Store-cached and rebuildable;
- live-machine fact verified at use time;
- short-lived mutation guard;
- historical evidence; or
- obsolete and removable after migration.

Every durable field must name one class, one owner, one writer, one reader set, one retention rule, one privacy rule, and one recovery use.

## Minimal Model Gate

The model must not use device, inode, volume identity, or an exact package hash as a permanent project, checkout, or caller identity. It may use such facts as short-lived file safety evidence when the platform supports them.

The model must keep stable project identity, explicit schema migration, in-flight operation journals, locks, content ownership proof, and the minimum last-applied facts needed for safe change.

The model must define how Store-free reads and independent work proceed. It must also define the exact error and next action for each Store-backed operation when access is absent, denied, unsafe, or unavailable.

## Verification

Run PRD authority validation, link checks, path hygiene, and a cross-owner consistency review. Compare every accepted P1 decision with the final PRD text. P2 closes only when the owner accepts the current authority and no durable fact has two canonical homes.
