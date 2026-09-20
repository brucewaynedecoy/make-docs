---
title: "Store Architecture Recovery and Platform-Neutral Foundation"
kind: "design"
status: "draft"
coordinate: "W22 R0"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "Reconcile the current Store, harness, setup, migration, runtime, and package authorities before implementation."
  coordinate_handoff: "Carry W22 R0 as the owner-directed new recovery wave."
---

# Store Architecture Recovery and Platform-Neutral Foundation

## Purpose

Define a controlled recovery for the Make Docs Store, setup, and harness architecture. The recovery must keep the useful safety foundation. It must remove or replace complexity that does not earn its cost. It must also make Windows, macOS, and Linux equal product targets.

This design starts a new initiative at `W22 R0`. It is not another W19 defect revision. It does not accept the proposed target as current product authority. It also does not authorize implementation.

## Context

The Store began with a sound product need. Make Docs needs a safe home for non-rebuildable operation state, migration journals, locks, ownership evidence, and machine settings. Project repositories must remain portable. Ordinary project work must remain possible without Store access.

Later work added a large installation and harness shell around that foundation. The current system joins checkout identity, installation ledgers, operation journals, resource projection, harness receipts, executable identity, Store access, setup, recovery, and native harness files. These parts now affect each other in ways that are hard to explain and hard to prove.

The change history shows strong reactive growth. Commit `7ca65f40` added 8,341 lines and removed 120 lines for the W19 R6 setup foundation. Commit `afbeaab2` then changed 7,798 lines. Commit `56800c35` removed 12,939 lines and added 2,604 lines one day later. Commit `0e5e90be` then added 3,143 lines for Store access repair. Line counts do not prove bad design. This amount of rapid addition, removal, and repair is a strong reason to stop and review the model before extending it.

Current code uses file-system device and inode values for several purposes. Examples include durable checkout records in `packages/cli/src/store/database.ts`, native file guards in `packages/cli/src/harness-access/native.ts`, and resource fingerprints in `packages/cli/src/operations/resource/resolver.ts`. Device and inode checks can be useful as short-lived file safety guards. They are not a universal long-lived product identity. APFS exposed a symptom, but the problem is wider than APFS.

The current harness path also has an explicit Windows gap. `packages/cli/src/harness-access/native.ts` rejects native rule launch identity on Windows. A universal product cannot treat one supported operating system as a later adapter detail.

The active product authority is spread across [PRD 10](../prd/10-packaging-validation-and-release-reference.md), [PRD 16](../prd/16-package-runtime-and-deployment-boundaries.md), [PRD 18](../prd/18-compatibility-classification-and-migration-safety.md), [PRD 24](../prd/24-project-configuration-and-convention-overlay.md), [PRD 25](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 28](../prd/28-shared-agentics-installation-and-harness-exposure.md), [PRD 38](../prd/38-global-store-and-project-state.md), and [PRD 39](../prd/39-cli-command-model-and-operation-registry.md). Some current documents also disagree about whether project installation data is canonical in the repository or in the Store. The recovery must settle that conflict before code changes begin.

The exact reported symptom list is not complete yet. New symptoms that belong to this architecture can enter the W22 R0 inventory without a new coordinate. A symptom that adds a new product capability needs a separate product decision.

## Human Experience Intent

Impact: `direct`

Affected humans: People and agents that set up, use, maintain, repair, move, or upgrade a Make Docs project on Windows, macOS, or Linux.

Human goal or effect: Use and recover Make Docs without learning internal Store tables, file identities, receipt chains, or harness trust details.

Experience promises:

- The same supported action has the same meaning, safety result, and recovery path on Windows, macOS, and Linux.
- A person can identify the project, current state, blocked action, and next safe action before internal identifiers.
- Store loss or Store denial stops only the operation that needs the Store. It does not stop independent project reading or documentation work.
- Moving a checkout or updating the Make Docs package does not break a valid installation only because a device number, inode, or package byte hash changed.
- Setup and repair do not form a closed loop in which each command requires the other command to have already succeeded.
- A maintainer can explain why each retained state field and safety mechanism exists, what failure it prevents, and whether it is authoritative, rebuildable, or temporary.

Complexity kept out of the human path:

- Store schema details, receipt history, file descriptors, device and inode values, package hashes, and adapter internals are not needed for normal setup or recovery choices.
- Platform-specific file rules stay behind one small platform boundary.
- A person does not select among several internal recovery engines.

Evidence required:

- Exercise the same installed-package cases on real Windows, macOS, and Linux runners.
- Inspect complete, partial, blocked, failed, moved-checkout, upgraded-package, Store-unavailable, and recovery output.
- Prove that project files remain readable and independent work continues when Store access is absent or denied.
- Prove safe interruption and restart with one operation journal and no project-local fallback state.
- Record a keep, rework, or remove decision for every Store, checkout, harness, setup, and projection mechanism in scope.
- Complete an agent Human Experience Review of the installed results. Invite optional owner feedback after the package is usable.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| None. Code size and mechanism count are architecture review signals, not product performance targets. | `none` | `not-needed` | None | No speed, latency, load, or resource target is open in this design. | None |

## Decision

### Start a new recovery wave

Use `W22 R0`. The owner selected a new wave because this work changes the architecture goal and the product guardrails. It does more than correct W19 behavior.

### Freeze additive growth in the affected shell

Do not add a new Store table, durable identity, receipt layer, setup branch, or harness trust path unless it is needed to contain a release-blocking defect. Record any exception in the W22 R0 decision ledger.

### Keep the safety kernel

Keep these principles unless evidence proves a better replacement:

- A stable project ID is separate from a checkout path.
- SQLite stores non-rebuildable operational state.
- Schema migration is explicit and tested.
- An operation journal supports interruption and recovery.
- Locks prevent concurrent unsafe writers.
- Content hashes support ownership and change review.
- Project content stays portable and versioned in the repository.
- Store-free reads and independent documentation work remain available.
- Machine approval and project approval are separate decisions.

### Use a proof-based reduction rule

Classify every mechanism as `keep`, `rework`, or `remove`.

- Keep it when it protects non-rebuildable state, prevents a proved safety failure, or supports an accepted public capability.
- Rework it when the need is valid but the current authority, coupling, or platform model is wrong.
- Remove it when the data is rebuildable, duplicates another authority, has no public consumer, or exists only to support another removable mechanism.

Line count alone cannot decide removal. Existing complexity also cannot justify itself only because other current code depends on it.

### Use a smaller target model

The proposed target has these boundaries:

- The repository owns project identity, desired selections, project content, and versioned product authority.
- The Store owns non-rebuildable run and migration evidence, machine preferences, in-flight journals, and the minimum last-applied state needed for safe change.
- Rebuildable indexes can live in the Store, but they cannot become product authority.
- A checkout record uses Store identity, project identity, current normalized path, and last verified content facts. It does not treat a file-system object number as permanent identity.
- Device and inode checks can guard an open file or one reviewed mutation window. They do not survive as cross-run identity.
- A harness receipt proves the managed native entry and its last reviewed value. It does not make one exact package hash a permanent caller identity.
- The running executable is verified at call time. Current execution proof is separate from historical ownership proof.
- One small platform layer owns user data paths, path comparison, atomic replacement, locking, process liveness, and short-lived file guards.
- Setup is a thin coordinator over bounded plan, review, apply, verify, and recover services. It is not a second state machine.

This target is a recommendation. W22 R0 P1 and P2 must test and accept it before it becomes current PRD authority.

### Migrate through a compatibility bridge

Do not delete old state first. Read and classify existing Store rows and receipts. Convert proved state into the accepted target. Preserve user files and useful audit evidence. Quarantine ambiguous records. Keep rollback until the new model passes installed cross-platform proof.

### Require real platform proof

Mocks and path fixtures remain useful. They do not prove operating-system parity. Release claims for this architecture require installed-package checks on real Windows, macOS, and Linux environments.

## Alternatives Considered

### Keep extending the current architecture

Rejected. The current coupling makes each symptom likely to create another special case. It also leaves the Windows gap and durable file identity problem in place.

### Remove the Store and return all state to the project

Rejected. This would lose useful separation for machine settings, non-rebuildable operation state, locks, migration evidence, and private operational data. It would also recreate project-local state that Make Docs has already decided to remove.

### Rewrite the Store in one replacement

Rejected. A full replacement would put existing installations and recovery evidence at risk. The system needs an inventory, accepted target, and compatibility bridge first.

### Treat the issue as an APFS defect

Rejected. APFS is one place where the current assumptions became visible. The product issue is durable reliance on operating-system file identity and incomplete platform equivalence.

### Continue as W19 R9

Rejected by owner direction. The work has a new end-to-end goal. It establishes a simpler platform-neutral foundation rather than another local repair in the W19 line.

## Consequences

The recovery will take longer than a symptom patch. It will reduce the chance that a patch creates another authority or recovery path.

Some current mechanisms will remain after review. Their reason and boundary will become explicit. Other mechanisms can disappear only after migration and installed proof.

The work can change current PRDs, Store schemas, setup flow, harness rules, release gates, and test infrastructure. It must preserve public project content and safe recovery evidence.

Windows, macOS, and Linux become equal acceptance environments. A platform-specific implementation is allowed only behind the platform boundary and only when it keeps the same public result.

The current exact symptom list can grow during P1. The scope does not grow when a new symptom maps to an already listed mechanism and promise. New capabilities or unrelated products need separate authority.

No part of this design permits direct Store edits, real-project repair, branch creation, staging, commit, push, publication, or release.

## Design Lineage

- Update Mode: `new-doc-related`.
- Prior Design Docs: [Global Store and Project State](2026-07-01-global-store-and-project-state.md), [Unified Setup and Harness Access](2026-09-12-unified-setup-and-harness-access.md), [Static Harness Adapters and Conformance Retirement](2026-09-14-static-harness-adapters-and-conformance-retirement.md), and [Setup Interview and Recovery Correction](2026-09-15-setup-interview-and-recovery-correction.md).
- Reason: The earlier designs established or repaired parts of the current system. This design reviews the combined foundation and introduces a new platform-neutral recovery goal.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read` when needed.
- Why: Reconcile the current Store, harness, setup, migration, runtime, and package authorities before implementation.
- Coordinate Handoff: Carry W22 R0 as the owner-directed new recovery wave.
