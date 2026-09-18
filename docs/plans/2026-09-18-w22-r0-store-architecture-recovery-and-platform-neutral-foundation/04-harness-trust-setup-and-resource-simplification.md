---
title: "W22 R0 P4 Harness Trust, Setup, and Resource Simplification"
kind: "plan"
status: "draft"
coordinate: "W22 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P4 Harness Trust, Setup, and Resource Simplification

## Purpose

Separate managed-entry ownership, current execution proof, operation access, setup composition, and resource projection state.

## Outcome

A harness receipt proves what Make Docs managed and last verified. Current executable proof shows what is running now. Operation policy decides what that caller may do. Setup coordinates bounded services and uses one recovery path. Resource projection has one source of desired state and only the minimum applied proof.

## Harness Trust Boundary

Keep machine approval separate from project approval. Verify the running Make Docs executable and package relationship at call time. Do not require a historical receipt to contain the same exact executable hash after a valid package update. Preserve managed native entry identity, before and after value evidence, ownership, and verification result.

Define an equal Windows method or narrow the supported public method with an explicit product decision. Do not claim universal native rule support while Windows rejects the launch identity.

## Setup Boundary

Make setup a thin coordinator over read current state, build plan, review, apply, verify, and recover. Use the same services for interactive, non-interactive, JSON, and MCP surfaces. Do not create a separate setup state engine.

Read pending operation state before editable questions. Keep Store-free discovery and resource reads available. Stop only the Store-backed action when Store access fails. Give one valid next action.

## Resource Projection Boundary

Keep desired selections in project configuration. Keep source resource identity in the provider. Keep live bytes in the project when projection is selected. Store only applied ownership and last-applied facts that safe update or removal cannot rebuild.

## Verification

Test new install, valid package update, changed native entry, moved executable, missing Store, denied Store, unsafe Store, pending operation, setup restart, selected and unselected projection, repeat setup, repair, and removal. Compare CLI, JSON, and MCP meaning.

P4 closes only when each trust fact has one job, setup has one recovery path, and resource projection has no duplicate canonical state.
