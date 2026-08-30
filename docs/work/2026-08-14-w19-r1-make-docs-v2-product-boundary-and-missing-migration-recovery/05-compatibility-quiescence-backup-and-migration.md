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

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P2–P4 closeouts, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-017, Q-018, R-006, R-014, and R-017 plus the live production-importer removal question; preserve Q-017's current per-project model unless separately redesigned and add newly relevant items.
- [x] t4: Record each relevant item's ID or bounded new-gap label, authority digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: Record an explicit no-blocker determination and finite fixture/platform/correction/review budget before unlocking t8 when no blocker or gap remains.
- [x] t6: Stop before implementation for any blocker, unknown production consumer, or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [x] t7: Require canonical authority changes, focused validation, a separate decision commit, and its recorded SHA before unlock; no task or trace result closes governance implicitly.
- [x] t8: Record the Stage 1 result, authority digests, dependency evidence, current production-consumer question disposition, and implementation unlock or stop result.

### Acceptance criteria

- Every live safety, migration, no-scripts, and production-consumer issue has an explicit current disposition.
- The fixture/platform budget is finite and proportional to data-loss, security, and cross-platform risk.
- Implementation remains locked until all blockers and unknown consumers are canonically resolved.

### Dependencies

- Accepted P2–P4 interfaces and validation evidence.
- Current PRD authority and separate P5 implementation authorization.

### Closeout Notes

#### 2026-08-29 read-only baseline

- Worktree: the repository root (`.`).
- Branch: `make-docs-v2`.
- HEAD: `2d8c322c550f6443b1897a05ffb5ed567d386d03`.
- Disk: 86 GB was free at the gate check.
- Dirty-state result: Only the untracked phase state directory was present before this approved document pass. No unexpected user work was found.
- Dependency evidence: P2 is owner-accepted and present on `origin/make-docs-v2` at `6bf85e59`. P3 is owner-accepted and pushed through `f2ed36c6`. P4 is owner-accepted and pushed through `efebfa29`.
- Authorization result: The owner authorized this document reconciliation. The owner did not authorize P5 implementation.

#### Source authority digests

| Authority | Git blob digest |
| --- | --- |
| [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md) | `9cf32d380b06cbe59c919e84a7c6e89d80dabd04` |
| [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | `c09afd8e739b5896d5afe23bf92cd94492a1815f` |
| [PRD 17](../../prd/17-system-asset-materialization-and-local-bootstrap.md) | `961bcf73fe40648111efba9f19b291762c7638b6` |
| [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md) | `ae2e61f2ab53026b2e843796bc4b8dc32d637d48` |
| [PRD 21](../../prd/21-project-tool-directory-and-resource-tiers.md) | `59faa61c7aa2dc8588883fc422e76b1fa134da9e` |
| [PRD 22](../../prd/22-project-documentation-asset-model.md) | `95be2fb4d8bfcb3188099bd9f6af3957cbd5c60e` |
| [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | `4072acfab262cb0091fd55aa1d14b7f9f0092c00` |
| [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md) | `80cdb3ae2225f60ea39d23f250720fc620bca887` |
| [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md) | `f0a6cc9ee02b9a34a1eda71ce2ea949ed075bbe3` |
| [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | `d48d9bc3e30ea59d7652ec2ee9a5bf23ce94b44d` |
| [PRD 38](../../prd/38-global-store-and-project-state.md) | `b2991de7498005fd7efb382f9338b372b0c8d0e2` |
| [PRD 03](../../prd/03-open-questions-and-risk-register.md) | `9904e0d72acbb07af490aabee974a9e3a08e6085` |

#### Preflight item reconciliation

| Item | Authority digest | Impact classification | Disposition and rationale |
| --- | --- | --- | --- |
| Baseline proof | `2d8c322c550f6443b1897a05ffb5ed567d386d03` | `closed-regression-check` | The worktree, branch, HEAD, disk, dirty state, and authorization were safe for a read-only gate. |
| Source authority set | Digests in the table above | `closed-regression-check` | The live Source PRDs and PRD 03 were read and fixed to exact blob digests. No authority conflict was found. |
| P2 closeout record | `6bf85e59d0da488a053c242cca9509849e0ae8cd` | `blocking` | P5-D001 closed the stale record gap. P2 is accepted and complete. This pass corrects the work record and adds the missing history record. P2 reopens only if new defect evidence appears. |
| P3 and P4 dependencies | `f2ed36c6`; `efebfa29` | `closed-regression-check` | Both phases are accepted and pushed. Their current interfaces satisfy the P5 phase-entry dependency. |
| Q-017 | `9904e0d72acbb07af490aabee974a9e3a08e6085` | `impacted-nonblocking` | Keep the current per-project model. The broader machine-level layout question stays open outside P5. |
| Q-018 | `9904e0d72acbb07af490aabee974a9e3a08e6085` | `impacted-nonblocking` | P5 adds no public configuration key, format, or discovery surface. Q-018 stays open outside P5. |
| R-006 | `9904e0d72acbb07af490aabee974a9e3a08e6085` | `impacted-nonblocking` | One frozen, reviewed snapshot must control plan, backup, apply, rollback, update, and uninstall. No new audit can occur between approval and a write. |
| R-014 | `9904e0d72acbb07af490aabee974a9e3a08e6085` | `impacted-nonblocking` | P5 must land the TypeScript path-check operation and update all live consumers before hash-proven removal of the Python helper. |
| R-017 | `9904e0d72acbb07af490aabee974a9e3a08e6085` | `impacted-nonblocking` | The system workflow stays the one policy authority. Optional agent files cannot copy that policy. |
| Live legacy surface trace | `518772331b3628cb61d94aa24ff3e7971711b31b` | `impacted-nonblocking` | The 18 frozen Playbook and packaging operations are still in the registry, CLI, and MCP surfaces. P5 must preserve, freeze, and quiesce them. P8 owns a new removal trace, removal backup, and removal. |
| Path helper consumer trace | `18912ff0755e561d12646ba51e81a7f0930132b4`; `8c922c2a72aa2ea198409ec5142ef4cfc48f09e7`; `b5ecfd6df8ff485a7deffc3ba62ef475719c4708` | `impacted-nonblocking` | The Python path helper still has live manifest, rule, consistency-test, and install-test consumers. P5 must update these consumers before removal. |
| Finite evidence budget | `3037e481fbc358c73bf56cda3770f0c15f54c5e3` | `blocking` | P5-D002 closed the budget gap. The accepted budget is recorded below. |

No item is `unrelated`. No `new-authority-gap` remains.

#### Accepted owner decisions

- P5-D001: Treat P2 as owner-accepted and complete at `6bf85e59`. Correct the stale P2 work record, the W19 index, and history. Reopen P2 only for new defect evidence.
- P5-D002: Use at most 14 migration and safety fixtures. Run macOS checks directly. Use fixed behavior fixtures for Linux and Windows. Use one implementation pass. Allow at most two corrections that address different defects. Use one independent review and one confirmation review. Reuse evidence that did not change. Stop for an owner decision if the budget ends. P10 keeps native package and installed-project checks for all supported platforms.

#### Stage 1 result and implementation gate

- Testing-mode decision: Use migration fixtures and rollback proof only. Do not relabel preserved artifacts as UAT evidence.
- No-blocker result: All P5 phase-entry questions now have an accepted decision or a controlled, nonblocking disposition. The current PRDs already own the required behavior. No PRD or risk-register edit is needed.
- Production-consumer result: The frozen legacy operations and Python path helper still have live consumers. P5 must preserve or replace them in the order above. It must not remove them by assumption.
- Decision boundary: This document-only preflight commit must exist and its SHA must be recorded before implementation can start.
- Phase / capability status: The P5 phase-entry gate is complete. P5 implementation remains locked until the owner gives separate, explicit authorization after the document-only commit.

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
