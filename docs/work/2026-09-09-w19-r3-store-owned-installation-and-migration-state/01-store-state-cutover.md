---
title: "Phase 1: Store State Cutover"
kind: "work"
status: "active"
coordinate: "W19 R3 P1"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 1: Store State Cutover

## Purpose

Remove the split between the global Store and project-local installation state. This phase delivers the complete boundary, safe legacy transfer, public status and recovery, shipped guidance, and package/dogfood proof.

**Entry gate satisfied, 2026-09-09:** The user reviewed and accepted the [work backlog](00-index.md). The current request is a package commit followed by an implementation plan. Implementation has not started. All tasks below remain open. This acceptance record does not authorize a live transfer. W20 R0 remains paused.

## Overview

Use five stages inside one phase. Store readiness comes before project writes. All live readers and writers then move to one service. Verified legacy inputs transfer after that service can preserve their meaning. Package proof precedes the real dogfood transfer. Evidence and owner acceptance close the interrupt.

The [plan](../../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) supplies ordering and V1-V8. The [design](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) supplies D1-D9 and HX-1 through HX-4. Current PRDs below constrain implementation. Do not add a generic event engine, new Phase runner, broad cleanup command, or replacement local state directory.

The proposed public commands below trace to PRD 39 R-STATE-1/2 and t8/t9. They are implementation targets, not commands available from this drafting pass:

```text
make-docs project state status [--target-root <path>] [--json]
make-docs project state recover <operation-id> --resume [--target-root <path>] [--dry-run] [--json]
make-docs project state recover <operation-id> --rollback [--target-root <path>] [--dry-run] [--json]
```

## Source PRD Docs

- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): operational ownership, Store safety, identity, transfer, recovery, and preservation.
- [05 Installation, Profile, and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md): every installation writer and reviewed file mutation.
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md): locks, frozen plans, source disposition, snapshots, and scoped rollback.
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): public state commands and shared typed results.
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md): declarative identity/settings and config preservation.
- [02 Architecture Overview](../../prd/02-architecture-overview.md), [15 Agent Instruction Ownership](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), [17 System Asset Materialization](../../prd/17-system-asset-materialization-and-local-bootstrap.md), and [21 Project Tool Directory](../../prd/21-project-tool-directory-and-resource-tiers.md): topology, resource ownership, and agent guidance.
- [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md) and [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md): upstream-first delivery and package proof.
- [14 Lifecycle Workflow](../../prd/14-lifecycle-workflow-and-coverage-passes.md), [49 Human Experience Standard](../../prd/49-human-experience-standard-and-intent.md), and [50 Proportionate Testing](../../prd/50-proportionate-testing-and-human-centered-validation.md): coverage, human promises, evidence reuse, and testing selection.

## Requirement and Human Promise Trace

| Authority | Work | Verification |
| --- | --- | --- |
| PRD 38 R-BND-1/2, R-STORE-1..4, R-DB-1..5, R-ID-1/2 | t2-t5 | V1-V3: one external state owner, safe bootstrap, no false ownership across checkouts. |
| PRD 05 R-INSTALL-STORE-1/2; PRD 38 R-MIR-1, R-LIFE-5; PRD 24 R-CONFIG-STATE-1..3 | t6-t10 | V1, V4, V6: shared writers, final ledger commit, preserved config, truthful status/recovery. |
| PRD 18 R-MIG-STORE-1..3; PRD 38 R-XFER-1..6 | t7, t9, t11-t14 | V3-V6: safe writer controls, transfer, cleanup, supported CLI boundary, and scoped recovery. |
| PRD 38 R-PS-4/5/6, R-MIR-2/3, R-LIFE-1..4, R-PRIV-1/2, R-KEEP-1/2 | t3, t7, t9, t12, t16 | V2-V5: protected lifecycle/legacy evidence, private state, separate cleanup authority, and local knowledge. |
| PRD 39 R-MIG-4, R-STATE-1..5 | t8-t10, t14, t18 | V5-V6: common CLI/MCP operations, exact modes, read-only status and preview, typed outcomes. |
| PRD 15 R-ROUTER-STATE-1; PRD 17 R-RESOURCE-STATE-1; PRD 21 R-LOCAL-STATE-1; PRDs 02/09/10 | t15-t19, t21-t22 | V1, V7-V8: active guidance, all caller paths, package output, and dogfood agree. |
| PRD 38 R-TEST-1..6 | t5, t10, t15-t19 | V1-V8: full-tree, failure, identity, privacy, supported legacy, preservation, and package checks. |
| HX-1: local state stays absent after transfer | t13, t15-t20 | V1, V5, V8: reviewed removal and later repeat/update file inventories. |
| HX-2: one clear status/recovery path | t8-t10, t18, t20 | V6, V8: packaged plain/JSON output shows result, trust, pending work, and safe next step. |
| HX-3: failure keeps user files and recovery evidence | t3-t5, t7, t9, t16, t20 | V2-V4, V6: failure and recovery results preserve content and do not invent ownership. |
| HX-4: knowledge, settings, and backup copies remain available | t6, t11-t13, t19-t20 | V5, V8: exact transfer inventory and before/after content checks. |

## Source Obligations, Scenarios, And Findings

- Finding: [D-031](../../prd/03-open-questions-and-risk-register.md#d-031-migration-state-remains-in-the-project-despite-the-store-boundary), open until accepted runtime proof closes it.
- Existing interrupt-specific obligations: none. Existing O-001/O-002 cover other work and are not changed here.
- Unassisted Goal Testing: `not-needed-now` at drafting. Planned fault tests and public CLI evidence address current uncertainty. Reassess a material discoverability gap at t20 under PRD 50; do not invent a scenario or future obligation now.
- Performance Testing: `not-needed-now`. No current performance target or decision justifies a benchmark. Lock correctness and bounded retries are functional safety checks.

## Stage 1 - Store Foundation

### Tasks

- [ ] t1: Record the user's backlog acceptance and the current branch, HEAD, dirty-file allowlist, installed CLI identity, and Store health. Confirm the protected files and intended implementation scope. Preserve current work and the W20 pause.
- [ ] t2: Trace live state readers and writers from manifest, migration, setup/reconfigure, update, resource/project-surface ensure, selected Skills, conflicts, backup/restore, removal, registry, and MCP callers. Map every field to project knowledge, permitted content, or one Store owner. Identify obsolete fields to discard without losing useful records.
- [ ] t3: Add the smallest typed Store schema and service for installation records, checkout bindings, pending operations, locks, and transfer provenance. Reuse current transactions and schema journal. Keep schema changes distinct from project progress. Preserve general lifecycle receipt meaning, current evidence, opaque `playbook_runs`, and unrelated project rows.
- [ ] t4: Validate external Store roots and derived paths through canonical path and symlink checks. Implement Store bootstrap locking before tables or project identity exist. Bind checkout-scoped writer ownership after identity resolution. Handle moved paths, shared project IDs, clones, conflicting bindings, active writers, and unproven stale writers without guessing ownership.
- [ ] t5: Add focused tests for Store readiness before any project write, missing/damaged/newer Store refusal, safe fresh initialization versus reviewed adoption, root/override rejection, pre-identity races, same-checkout exclusion, and distinct checkout bindings. Prove repository/resource reads remain available without Store writes.

### Acceptance criteria

- Every retained state field has one external Store owner. No local lock, renamed manifest, progress file, or fallback is required.
- A missing Store plus existing files does not silently become a trusted fresh installation. Corrupt bytes remain intact.
- Schema changes commit atomically within SQLite. No claim treats Store and project files as one atomic transaction.
- Tests prove the safety prerequisite and writer boundaries before later stages use them. A timeout alone never permits stealing a lock.

### Dependencies

- User review and acceptance of the backlog, satisfied on 2026-09-09. The requested implementation plan remains the next action after the package commit.
- Validated current PRDs and the bounded writer map from t2.

## Stage 2 - Writer and Manifest Cutover

### Tasks

- [ ] t6: Route every mapped live caller through the Store service. Move effective installation selections, versions, hashes, ownership, provenance, conflict decisions, and recovery metadata to the Store. Keep declarative project ID and desired settings in local config. Preserve existing fields and comments. Reject unsupported or conflicting config instead of replacing it.
- [ ] t7: Implement the pending-operation protocol. Save the reviewed plan and expected prior bytes before writes. Verify required backup copies and record their inventory in the Store. Recheck each file before replacement. Save step outcomes. Commit final installation ownership and receipt only after all outputs validate. A failure leaves truthful pending/failed status and retained evidence.
- [ ] t8: Register `project.state.status` with the CLI grammar in PRD 39 R-STATE-1. Report Store availability, project/checkout identity, installation trust, pending work, and the safe next step in plain text and versioned JSON. Status must not create a Store, lock, project file, import, or mutation receipt.
- [ ] t9: Register `project.state.recover` with the exclusive resume/rollback modes, target-root option, and dry-run contract in PRD 39 R-STATE-2. Require the operation's checkout binding. Preview exact changes without writes. Apply rechecks scope and locks. Resume only known steps. Roll back only verified affected files and records. Preserve later user edits and every unrelated Store row.
- [ ] t10: Test shared CLI/MCP result meaning, read-only status/preview, invalid modes, wrong-checkout operation IDs, normal mutation blocked by pending recovery, partial restoration reporting, and receipt failure after file mutation. Prove failed required state writes never use ancillary lifecycle capture failure to report success.

### Acceptance criteria

- All live installation callers use Store authority. The old local manifest is read only by the bounded legacy importer.
- A failed operation names its state and safe next action. It does not report success, silently retry destructive work, or discard its journal.
- Recovery cannot restore the whole shared Store. Unknown or changed content blocks affected recovery and remains intact.
- Public commands use one registered core and typed input/result schema. Existing lifecycle IDs and receipt meaning remain stable.

### Dependencies

- Stage 1 foundation and safety tests.
- PRD 39 command contract and PRD 18 frozen-plan and backup rules.

## Stage 3 - Legacy Transfer and Compatible Writers

### Tasks

- [ ] t11: Extend existing setup preview with an exact import/preserve/remove inventory for supported local manifest and migration records. Verify schemas, content hashes, project scope, snapshot/operation links, config, and scoped evidence of old writers. Treat file contents as data. Invalid, unknown, contradictory, changed, symlinked, or actively written inputs stop transfer/cleanup with a typed reason.
- [ ] t12: Import only needed installation, completed-receipt, compatibility, and recovery records. Save source identity/digests in the Store. Do not replay completed operations or reinterpret deleted Phase-runner files or opaque legacy rows. Preserve pending-operation evidence and require recovery before new setup work.
- [ ] t13: Commit and read back the imported records before removal. Recheck source hashes and remove only the explicit verified obsolete allowlist. Record cleanup progress in the Store. Remove `.make-docs/state/` only if empty and safe. Resume the same cleanup after an interrupted commit/deletion sequence without duplicate imports or destructive replay.
- [ ] t14: Make the corrected CLI the minimum supported writer after transfer. Block known active old writers through scoped evidence. Probe the actual prior package in an isolated fixture and record its guard or limit. Use a declarative format guard only if that parser proves pre-write refusal. State obsolete-writer limits in setup help. Add no local marker, dual write, automatic CLI replacement, broad process scan, or second-version bridge.

### Acceptance criteria

- Setup explains the local manifest/state removal before apply. The transfer uses verified source data and Store read-back.
- Failed transfer leaves unverified inputs intact. Successful transfer leaves no active local installation record. Permitted project content and backup file copies survive.
- A repeated transfer is idempotent: it does not import duplicate receipts or repeat completed file changes.
- Known active old writers prevent transfer. The supported-version rule and actual prior-package evidence agree. No claim says a new Store row can control an immutable obsolete executable.

### Dependencies

- Stage 2 writers, status, and recovery are ready.
- Read-only legacy inventory and an accepted concrete setup plan precede removal.

## Stage 4 - Verification, Shipped Guidance, and Dogfood

### Tasks

- [ ] t15: Replace tests that require local operational files or omit `.make-docs/state/` from comparisons. Check full fixture trees and Store records. Repair the existing D-031 register test inventory in `consistency.test.ts` without weakening missing/duplicate-ID checks or changing runtime code merely to satisfy an outdated test.
- [ ] t16: Execute V1-V5 and applicable core checks from the finite verification set below. Use isolated Stores and projects for fault, rollback, removal, and old-package tests. Prepare the evidence inventory for later package and dogfood results. Keep each result tied to command, package identity, fixture, expected outcome, and limits. Fix relevant failures and rerun only affected checks before the final integration pass.
- [ ] t17: Correct active shipped state, manifest, lock, receipt, path-hygiene, router, and recovery instructions upstream in `packages/docs/template/`. Inspect active consumers and test/package expectations for the same assumptions. Link superseded W19 R1 P5/P6 guidance to current authority without rewriting accepted history. Keep ordinary local project history/work tracking explicitly valid.
  Apply PRD 38 R-PS-8: ordinary project work continues when the CLI is unavailable or optional capture fails. Report unavailable capture without claiming success. Prohibit direct Store writes, local fallback state, and queued writes. Keep required Store recording mandatory for CLI-managed changes.
- [ ] t18: Build and inspect the actual packaged CLI and generated defaults. Collect V6-V7 package evidence and run package smoke against isolated fixtures. Prove status, recovery, repeat setup, failure, and later update use Store records and create no local operational substitute. Keep source test results distinct from installed-package proof.
- [ ] t19: After package proof passes, collect V8 dogfood evidence through the real transfer with the corrected CLI. Preview and disclose the exact manifest/state removal and config changes. Apply only the reviewed scope within accepted implementation authority. Retain preview, applied-file inventory, Store read-back, preserved-content checks, and a repeat/later-update result. Do not hand-delete receipts or hand-edit the installed projection.
- [ ] t20: Complete V8 Human Experience Review for HX-1 through HX-4 using the real V1/V5/V6/V8 evidence. Record each promise, actual surface, evidence, observation, `satisfied`/`material gap`/`insufficient evidence` conclusion, reviewer, limit, and follow-up. Offer one optional Guided Progress Review. If a material human uncertainty remains, select the smallest added test under PRD 50. Do not claim agent review proves lived ease or confidence.

### Acceptance criteria

- V1-V8 pass for their stated scope. The required case inventory below has no unexplained missing case or ignored local-state path.
- Fresh and transferred projects create no local operational state on success, failure, recovery, or user-invoked repeat. Failed legacy transfer instead preserves its original unverified inputs without adding fallback files.
- Upstream instructions, packaged output, and actual dogfood results agree. The old CLI limit is explicit and evidence-backed.
- Missing CLI and failed optional capture cases allow ordinary work to continue with an accurate notice. No fallback state, direct Store write, queued write, or false success appears. Required Store failure still stops CLI-managed changes safely and preserves recovery evidence.
- Project knowledge, desired settings, selected resources, user modifications, backup file copies, unrelated Store rows, and opaque legacy data remain protected.
- Human review evaluates each promise against real evidence. A material gap or insufficient evidence keeps the affected acceptance claim open.

### Dependencies

- Stages 1-3 and their focused checks.
- The actual built package precedes dogfood transfer. The concrete reviewed transfer precedes deletion.

### Required Case Inventory

Use V1-V8 as the canonical verification grouping. Pair these cases with existing fixtures where possible. This is a finite case set, not a requirement to run every combination:

- V1: fresh setup, legacy transfer, repeat setup, reconfigure, resource ensure, project-surface ensure, selected Skills, conflict resolution, update, backup, remove, and restore. Compare the whole tree and required Store transitions.
- V2: missing, unreadable/read-only, corrupt, unknown, and newer Store; project-contained override; symlink/traversal; case-collision and Windows drive/UNC, macOS, and Linux permission fixtures. Reads stay available where contracted. Required writes stop safely.
- V3: pre-identity setup race, same-checkout writer race, separate checkouts, verified move, clone, linked worktree, conflicting identity, active writer, and stale writer with insufficient liveness proof.
- V4: faults at intent, backup verification, file replacement, step recording, final ledger/receipt commit, transfer commit, and source deletion. Test both a safe resume and a scoped rollback, later user changes, partial restoration, and unrelated concurrent Store records.
- V5: supported completed/incomplete records, malformed/unknown/symlinked/changed inputs, snapshot mismatch, active old writer, repeat import, and prior-package compatibility probe. Reuse PRD 18's clean legacy, modified/mixed, malformed/missing manifest, provider-unavailable, stale-cache, and unknown-project fixtures for the relevant disposition paths.
- V6: packaged plain/JSON status and recovery preview/apply across ready, unregistered, unverified ownership, recovery required, writer active, and Store unavailable states. Verify exact modes, checkout ownership, no implicit repair, and shared CLI/MCP semantics.
- V7: current instruction/reader/writer coverage, defaults checks, affected runtime integration, package contents and smoke. No secrets or document bodies enter Store records. Project removal preserves Store rows unless separately authorized; cleanup preserves other projects and opaque legacy rows.
  Include PRD 38 R-TEST-7: exercise shipped guidance and the optional capture path with no CLI available, then with the CLI present but optional capture failing. Verify work can continue and capture is reported as unavailable. Inspect for direct Store writes, local fallback state, queued writes, and false success claims. Pair these cases with a CLI-managed change whose required Store write fails; it must stop before further project changes and preserve recovery evidence.
- V8: real reviewed dogfood transfer, Store read-back, preserved-content inventory, repeat/later update, and per-promise Human Experience Review.

### Closeout Notes

- Automated Implementation Testing: focused during implementation, then one justified shared integration/package pass. Stop on a safety failure. Rerun after a relevant fix or changed evidence only.
- Performance Testing: `not-needed-now`; reconsider only for a current performance decision under its owning PRD.
- Guided Progress Review: optional and advisory after a meaningful result exists. A decline does not fail the phase.
- Unassisted Goal Testing: `not-needed-now` unless t20 identifies a material uncertainty that existing evidence cannot answer. No scenario ID is assigned in this draft.
- Phase/capability status: not started. Stage completion alone does not satisfy the global-only boundary or owner acceptance.

## Stage 5 - Acceptance and Closeout

### Tasks

- [ ] t21: Complete applicable functional, guide, and system-resource coverage passes against the implemented result. Record separate testing selections and bounded conclusions. Fix active local-state guidance and broken requirement/evidence links. Preserve historical facts and retain explicit supersession where old entry points remain visible.
- [ ] t22: Run required PRD authority and documentation checks, affected CLI tests, defaults validation, build/package checks, and the justified final integration pass. Reconcile every new failure. Report the original D-031 defaults baseline separately and prove its correction. Attach the final finite evidence inventory to the phase closeout record.
- [ ] t23: Reconcile current PRD status, this backlog, D-031, and any material findings against actual runtime evidence. Keep D-031 open until its exit is met. Do not hide an incomplete Store-only boundary behind a future obligation. Use the existing obligation register only for an owner-accepted separate future outcome.
- [ ] t24: Present the complete P1 result for owner acceptance. Show what changed in the project tree, where status/recovery now appears, retained content, verified cases, failed/blocked limits, and HX-1 through HX-4 conclusions. Keep acceptance, staging/commit, publication, and release authority distinct.
- [ ] t25: After owner acceptance of interrupt completion, record the W20 R0 return point: accepted P1/P2 remain intact; P3 planning consumes the interrupt handoff; P3 implementation still requires its own authority. Update pause/navigation records to reflect that exact gate. Do not start W20 or W21 work as part of this task.

### Acceptance criteria

- Required runtime, package, dogfood, preservation, and human-result evidence supports the full phase exit. Documentation alone cannot close the defect.
- Every material finding has a clear disposition. There is no concealed incomplete state boundary, unresolved destructive cleanup, or unsupported recovery claim.
- The user accepts P1 completion before the interrupt closes. The record states the actual acceptance and remaining limits.
- W20 resumes only through its existing entry gate and separate implementation authority. Its accepted results and task IDs remain unchanged.

### Dependencies

- V1-V8 and applicable coverage passes.
- Owner acceptance of the implemented interrupt result before closure and the W20 handoff.

### Closeout Notes

- Current status: backlog accepted on 2026-09-09; implementation is not started. The requested next step after the package commit is an implementation plan. No runtime, installed output, Store row, local receipt, or backup is changed by this acceptance record.
- Required stop: a failed safety or preservation check keeps P1 open. No automatic destructive retry, local-state fallback, extra unreviewed phase, or false success is permitted.
