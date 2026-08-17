---
title: "Phase 5: Compatibility, Quiescence, Backup, and Migration"
kind: "work"
status: "active"
coordinate: "W19 R1 P5"
source:
  type: "prd"
  path: "docs/prd/18-compatibility-classification-and-migration-safety.md"
---

# Phase 5: Compatibility, Quiescence, Backup, and Migration

## Purpose

Implement fail-closed compatibility classification, project locking, Playbook/Protocol quiescence, a frozen reviewed snapshot, backup/rollback, explicit file dispositions, and the immutable thirteen-step migration coordinator.

## Overview

This phase builds the safety envelope and implements migration steps 1 through 8. Steps 9 through 13 remain locked checkpoints owned by P6 through P10. Migration never guesses ownership, silently reorders the accepted sequence, follows symlink targets, rewrites opaque legacy Store rows, or removes user-owned or ambiguous content.

## Source PRD Docs

- [PRD 05 — Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 22 — Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 34 — Playbook Authoring Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [PRD 35 — Run Playbook State Machine and Portability](../../prd/35-run-playbook-state-machine-and-portability.md)
- [PRD 36 — Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work and O-002 remains superseded.
- No `NUAT-###` identity is invented; migration preserves existing scenario IDs and Persona association without relabeling historical walkthroughs as qualified naive UAT.
- The live production-importer/consumer trace is execution evidence, not a new product authority record.
- Findings and capability status remain owned by canonical records and cannot be closed by migration completion.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P2–P4 closeouts, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-017, Q-018, R-006, R-014, and R-017 plus the live production-importer removal question; preserve Q-017's current per-project model unless separately redesigned and add newly relevant items.
- [ ] t4: Record each relevant item's ID or bounded new-gap label, authority digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: Record an explicit no-blocker determination and finite fixture/platform/correction/review budget before unlocking t8 when no blocker or gap remains.
- [ ] t6: Stop before implementation for any blocker, unknown production consumer, or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [ ] t7: Require canonical authority changes, focused validation, a separate decision commit, and its recorded SHA before unlock; no task or trace result closes governance implicitly.
- [ ] t8: Record the Stage 1 result, authority digests, dependency evidence, current production-consumer question disposition, and implementation unlock or stop result.

### Acceptance criteria

- Every live safety, migration, no-scripts, and production-consumer issue has an explicit current disposition.
- The fixture/platform budget is finite and proportional to data-loss, security, and cross-platform risk.
- Implementation remains locked until all blockers and unknown consumers are canonically resolved.

### Dependencies

- Accepted P2–P4 interfaces and validation evidence.
- Current PRD authority and separate P5 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): migration fixtures and rollback proof only; preserved artifacts are not relabeled as UAT evidence.
- Phase / capability status: gate result pending.

## Stage 2 - Classify, Lock, And Establish Quiescence

### Tasks

- [ ] t9: Implement the PRD-defined top-level compatibility states and resource, filesystem, manifest-provenance, Store, legacy-asset, path-safety, and optional-agentics facets with fail-closed typed outcomes.
- [ ] t10: Acquire a project-scoped migration lock, record the exact repository/manifest identity, inventory affected paths and Store facets, and freeze one reviewed classification snapshot for plan, backup, apply, and rollback.
- [ ] t11: Bind the P3 frozen Playbook/Protocol baseline and every known writer or discovery path to the reviewed P5 migration snapshot. Complete all P5 snapshot and backup duties for the P5 migration. Leave only the fresh trace and backup for removal of the frozen public surfaces to P8.
- [ ] t12: Establish the public Playbook/Protocol quiescence stop barrier so legacy writers cannot start or resume. Stop if any writer or unknown consumer can bypass the barrier. Do not remove a frozen legacy registry, implementation, CLI, or MCP surface in P5.

### Acceptance criteria

- One locked reviewed snapshot governs the complete migration attempt.
- Classification uncertainty stops rather than choosing a destructive disposition.
- The P3 frozen legacy baseline and all known writer/discovery paths are bound to the P5 migration snapshot.
- P5 completes its own migration snapshot and backup duties.
- No public legacy writer can start, resume, or bypass the P5 stop barrier.
- The frozen legacy public surfaces remain present and unchanged. P8 owns only their fresh removal trace, removal backup, and removal.

### Dependencies

- Stage 1 unlock.
- P4 project/manifest identity and lifecycle planning.

### Closeout Notes

- Testing-mode decision(s): facet classification, lock contention, stale snapshot, active writer, and unknown consumer fixtures.
- Phase / capability status: safety snapshot and quiescence established; backup remains open.

## Stage 3 - Back Up And Plan Explicit Dispositions

### Tasks

- [ ] t13: Back up every file, directory entry, manifest/config state, router block, selected resource, and Store facet that may be transformed or removed, including metadata required to restore permissions, links, and ownership safely.
- [ ] t14: Verify the backup inventory and restore plan before apply, record exported or preserved user content explicitly, and reject incomplete, unreadable, ambiguous, or root-escaping backup targets.
- [ ] t15: Produce a dry-run plan giving every affected file one disposition: preserve as project-owned, export then replace, overwrite only when clean managed ownership is proven, skip, or stop.
- [ ] t16: Enforce symlink unlink-without-following, unmanaged-descendant preservation, POSIX logical identity, Windows path/permission variance, sanitized external references, and secret/privacy exclusion in the plan.

### Acceptance criteria

- Every potentially changed path has verified backup or an explicit nonmutation stop.
- Every affected file has one reviewed disposition; append-merge and name matching are never ownership proof.
- Restore metadata is sufficient for a bounded rollback attempt.
- Paths, links, secrets, and external references satisfy cross-platform and privacy constraints.

### Dependencies

- Stage 2 frozen snapshot and quiescence.
- P4 dry-run/conflict interfaces.

### Closeout Notes

- Testing-mode decision(s): backup completeness, restore rehearsal, per-file disposition, symlink, permissions, and secret-exclusion fixtures.
- Phase / capability status: backup and reviewed plan complete; apply remains open.

## Stage 4 - Implement The Immutable Migration Coordinator

### Tasks

- [ ] t17: Encode the normative thirteen-step order as explicit monotonic checkpoints; reject skips, backward transitions, silent reorder, changed snapshot fingerprints, or apply without the active lock and quiescence barrier.
- [ ] t18: Implement checkpoint 1 to classify once and freeze the reviewed evidence snapshot, and checkpoint 2 to verify backup plus preserved/exported user content before any transformation.
- [ ] t19: Implement checkpoint 3 to mint or upgrade manifest identity/provenance without claiming ambiguous ownership and checkpoint 4 to install only the minimal manifest and configured routers.
- [ ] t20: Implement checkpoint 5 to establish top-level prompt identity plus machine resource list/read operations before router fallback changes and checkpoint 6 to move or install only selected clean resources under `.make-docs/system/**`.
- [ ] t21: Implement checkpoint 7 to establish on-demand archive, artifact, and Persona-testing routing before transforming only clean managed legacy paths.
- [ ] t22: Implement checkpoint 8 to install TypeScript path-hygiene operations, update references, and remove a Python helper only when trusted hashes prove managed ownership and replacement parity.
- [ ] t23: Represent checkpoints 9 through 13 as locked downstream prerequisites: P6 general Store tables, P7 Naive-UAT/Persona/Skill/evidence, P8 traced retirement, P9 explicitly selected agentics, and P10 fresh/package/dogfood/legacy validation.
- [ ] t24: Persist typed paused, blocked, failed, rollback-required, and completed checkpoint receipts without treating a receipt as validation or permission to enter a downstream phase.

### Acceptance criteria

- The accepted thirteen-step sequence cannot be silently reordered or bypassed.
- P5 implements steps 1 through 8 without prematurely executing P6–P10 responsibilities.
- Later checkpoints remain locked until their owning phase closes and supplies evidence.
- Every mutation is tied to the frozen snapshot, reviewed plan, active lock, backup, and typed receipt.

### Dependencies

- Stages 2 and 3.
- P2/P3 resource operations and P4 lifecycle interfaces.

### Closeout Notes

- Testing-mode decision(s): transition table, checkpoint replay, snapshot drift, forced skip, downstream lock, and typed receipt fixtures.
- Phase / capability status: checkpoints 1–8 implemented; 9–13 remain P6–P10 gates.

## Stage 5 - Prove Rollback And Safety

### Tasks

- [ ] t25: Inject failures at every implemented checkpoint and prove rollback restores the pre-apply manifest, routers, managed bytes, preserved user content, links, and Store facet without following symlink targets.
- [ ] t26: Prove lock loss, active-writer detection, snapshot drift, incomplete backup, ambiguous ownership, path escape, permission failure, and cross-platform mismatch stop safely with actionable typed outcomes.
- [ ] t27: Run focused compatibility, migration, rollback, no-scripts/path-hygiene, PRD-authority regression, link, scope, and whitespace checks within the finite budget.
- [ ] t28: Obtain independent review of classification, quiescence, backup, ordering, checkpoint boundaries, rollback, and preservation; correct only actionable defects within budget.
- [ ] t29: Record exact migration interfaces, validation evidence, remaining nonblocking items, active quiescence requirements, and the locked checkpoint-9 handoff to P6.

### Acceptance criteria

- Failure injection proves bounded restoration or an explicit blocked state without silent data loss.
- User-owned, modified, ambiguous, historical, and opaque legacy data remain preserved.
- Independent review finds no unresolved material safety or ordering defect.
- The quiescence barrier remains active for P6–P10 and checkpoint 9 remains separately gated.
- P5 does not remove any P3-frozen Playbook or Protocol registry, implementation, CLI, or MCP surface.

### Dependencies

- Stages 2 through 4 complete.
- Finite fixture/platform/correction/review budget.

### Closeout Notes

- Testing-mode decision(s): failure injection, restore, cross-platform safety, and independent migration review.
- Phase / capability status: P5 may close with evidence; checkpoint 9/P6 remains separately gated.
