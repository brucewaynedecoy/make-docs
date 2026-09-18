---
title: "W22 R0 P3 Platform-Neutral Filesystem and Checkout Safety"
kind: "plan"
status: "draft"
coordinate: "W22 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P3 Platform-Neutral Filesystem and Checkout Safety

## Purpose

Create one small platform boundary and replace durable low-level file identity with the accepted checkout model.

## Outcome

Windows, macOS, and Linux use the same public safety contract. Platform-specific code handles only user data roots, path comparison, atomic replacement, locks, process liveness, executable rules, and short-lived file guards.

## Implementation Shape

Define a source-owned platform interface. Keep operating-system branches out of Store, harness, setup, and resource business rules. Normalize public paths without erasing the platform facts needed for safe comparison.

Move device and inode checks into short-lived mutation guards where they add safety. Remove them from durable project and checkout identity. Use project ID, Store checkout ID, current normalized path, and last verified content facts for cross-run association.

Define behavior for case sensitivity, case preservation, Windows drive paths, UNC paths, separators, symbolic links or reparse points, atomic replacement limits, lock ownership, process liveness, and executable discovery.

## Safety Rules

- A path move can update checkout location after project identity and content proof pass.
- A path collision, ambiguous project identity, unsafe link, or changed content blocks mutation and preserves data.
- A short-lived guard cannot become a recovery fact after its mutation window ends.
- Platform-specific limits must produce the same public state and safe next action.

## Verification

Use focused platform contract tests and real operating-system runners. Include moved checkout, renamed parent, case-only path change where supported, network or UNC path policy, symlink or reparse-point attack, atomic replace interruption, stale lock, dead process, and concurrent writer cases.

P3 closes only when the durable schema no longer depends on low-level file identity and the real-platform contract cases agree on public meaning.
