---
title: "Phase 1: Store State Cutover"
kind: "work"
status: "completed"
coordinate: "W19 R3 P1"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 1: Store State Cutover

## Purpose

Remove the split between the global Store and project-local installation state. This phase delivers the complete boundary, safe legacy transfer, public status and recovery, shipped guidance, and package/dogfood proof.

**Accepted and closed, 2026-09-09:** The user explicitly accepted the W19 R3 closeout and authorized its commit. All tasks t1-t25 are complete. Implementation, package proof, reviewed live transfer, final checks, and installed CLI status are recorded below. W20 and W21 remain paused for the next owner-requested interrupt package.

## Overview

Use five stages inside one phase. Store readiness comes before project writes. All live readers and writers then move to one service. Verified legacy inputs transfer after that service can preserve their meaning. Package proof precedes the real dogfood transfer. Evidence and owner acceptance close the interrupt.

The [plan](../../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) supplies ordering and V1-V8. The [design](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) supplies D1-D9 and HX-1 through HX-4. Current PRDs below constrain implementation. Do not add a generic event engine, new Phase runner, broad cleanup command, or replacement local state directory.

The public commands below trace to PRD 39 R-STATE-1/2 and t8/t9. They passed packaged-command proof and are present in the installed CLI:

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
| PRD 38 R-PS-8, R-TEST-7 | t10, t16-t18 | V2, V7: ordinary work continues when the CLI or optional capture is unavailable; no false capture, direct Store writes, local fallback, or queued writes. Required CLI operation recording still fails safely. |
| PRD 39 R-MIG-4, R-STATE-1..5 | t8-t10, t14, t18 | V5-V6: common CLI/MCP operations, exact modes, read-only status and preview, typed outcomes. |
| PRD 15 R-ROUTER-STATE-1; PRD 17 R-RESOURCE-STATE-1; PRD 21 R-LOCAL-STATE-1; PRDs 02/09/10 | t15-t19, t21-t22 | V1, V7-V8: active guidance, all caller paths, package output, and dogfood agree. |
| PRD 38 R-TEST-1..7 | t5, t10, t15-t19 | V1-V8: full-tree, failure, identity, privacy, supported legacy, preservation, and package checks. |
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

- [x] t1: Record the user's backlog acceptance and the current branch, HEAD, dirty-file allowlist, installed CLI identity, and Store health. Confirm the protected files and intended implementation scope. Preserve current work and the W20 pause.
- [x] t2: Trace live state readers and writers from manifest, migration, setup/reconfigure, update, resource/project-surface ensure, selected Skills, conflicts, backup/restore, removal, registry, and MCP callers. Map every field to project knowledge, permitted content, or one Store owner. Identify obsolete fields to discard without losing useful records.
- [x] t3: Add the smallest typed Store schema and service for installation records, checkout bindings, pending operations, locks, and transfer provenance. Reuse current transactions and schema journal. Keep schema changes distinct from project progress. Preserve general lifecycle receipt meaning, current evidence, opaque `playbook_runs`, and unrelated project rows.
- [x] t4: Validate external Store roots and derived paths through canonical path and symlink checks. Implement Store bootstrap locking before tables or project identity exist. Bind checkout-scoped writer ownership after identity resolution. Handle moved paths, shared project IDs, clones, conflicting bindings, active writers, and unproven stale writers without guessing ownership.
- [x] t5: Add focused tests for Store readiness before any project write, missing/damaged/newer Store refusal, safe fresh initialization versus reviewed adoption, root/override rejection, pre-identity races, same-checkout exclusion, and distinct checkout bindings. Prove repository/resource reads remain available without Store writes.

### Acceptance criteria

- Every retained state field has one external Store owner. No local lock, renamed manifest, progress file, or fallback is required.
- A missing Store plus existing files does not silently become a trusted fresh installation. Corrupt bytes remain intact.
- Schema changes commit atomically within SQLite. No claim treats Store and project files as one atomic transaction.
- Tests prove the safety prerequisite and writer boundaries before later stages use them. A timeout alone never permits stealing a lock.

### Dependencies

- User review and acceptance of the backlog, satisfied on 2026-09-09. The implementation plan was accepted before work began.
- Validated current PRDs and the bounded writer map from t2.

## Stage 2 - Writer and Manifest Cutover

### Tasks

- [x] t6: Route every mapped live caller through the Store service. Move effective installation selections, versions, hashes, ownership, provenance, conflict decisions, and recovery metadata to the Store. Keep declarative project ID and desired settings in local config. Preserve existing fields and comments. Reject unsupported or conflicting config instead of replacing it.
- [x] t7: Implement the pending-operation protocol. Save the reviewed plan and expected prior bytes before writes. Verify required backup copies and record their inventory in the Store. Recheck each file before replacement. Save step outcomes. Commit final installation ownership and receipt only after all outputs validate. A failure leaves truthful pending/failed status and retained evidence.
- [x] t8: Register `project.state.status` with the CLI grammar in PRD 39 R-STATE-1. Report Store availability, project/checkout identity, installation trust, pending work, and the safe next step in plain text and versioned JSON. Status must not create a Store, lock, project file, import, or mutation receipt.
- [x] t9: Register `project.state.recover` with the exclusive resume/rollback modes, target-root option, and dry-run contract in PRD 39 R-STATE-2. Require the operation's checkout binding. Preview exact changes without writes. Apply rechecks scope and locks. Resume only known steps. Roll back only verified affected files and records. Preserve later user edits and every unrelated Store row.
- [x] t10: Test shared CLI/MCP result meaning, read-only status/preview, invalid modes, wrong-checkout operation IDs, normal mutation blocked by pending recovery, partial restoration reporting, and receipt failure after file mutation. Prove failed required state writes never use ancillary lifecycle capture failure to report success.

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

- [x] t11: Extend existing setup preview with an exact import/preserve/remove inventory for supported local manifest and migration records. Verify schemas, content hashes, project scope, snapshot/operation links, config, and scoped evidence of old writers. Treat file contents as data. Invalid, unknown, contradictory, changed, symlinked, or actively written inputs stop transfer/cleanup with a typed reason.
- [x] t12: Import only needed installation, completed-receipt, compatibility, and recovery records. Save source identity/digests in the Store. Do not replay completed operations or reinterpret deleted Phase-runner files or opaque legacy rows. Preserve pending-operation evidence and require recovery before new setup work.
- [x] t13: Commit and read back the imported records before removal. Recheck source hashes and remove only the explicit verified obsolete allowlist. Record cleanup progress in the Store. Remove `.make-docs/state/` only if empty and safe. Resume the same cleanup after an interrupted commit/deletion sequence without duplicate imports or destructive replay.
- [x] t14: Make the corrected CLI the minimum supported writer after transfer. Block known active old writers through scoped evidence. Probe the actual prior package in an isolated fixture and record its guard or limit. Use a declarative format guard only if that parser proves pre-write refusal. State obsolete-writer limits in setup help. Add no local marker, dual write, automatic CLI replacement, broad process scan, or second-version bridge.

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

- [x] t15: Replace tests that require local operational files or omit `.make-docs/state/` from comparisons. Check full fixture trees and Store records. Repair the existing D-031 register test inventory in `consistency.test.ts` without weakening missing/duplicate-ID checks or changing runtime code merely to satisfy an outdated test.
- [x] t16: Execute V1-V5 and applicable core checks from the finite verification set below. Use isolated Stores and projects for fault, rollback, removal, and old-package tests. Prepare the evidence inventory for later package and dogfood results. Keep each result tied to command, package identity, fixture, expected outcome, and limits. Fix relevant failures and rerun only affected checks before the final integration pass.
- [x] t17: Correct active shipped state, manifest, lock, receipt, path-hygiene, router, and recovery instructions upstream in `packages/docs/template/`. Inspect active consumers and test/package expectations for the same assumptions. Link superseded W19 R1 P5/P6 guidance to current authority without rewriting accepted history. Keep ordinary local project history/work tracking explicitly valid.
  Apply PRD 38 R-PS-8: ordinary project work continues when the CLI is unavailable or optional capture fails. Report unavailable capture without claiming success. Prohibit direct Store writes, local fallback state, and queued writes. Keep required Store recording mandatory for CLI-managed changes.
- [x] t18: Build and inspect the actual packaged CLI and generated defaults. Collect V6-V7 package evidence and run package smoke against isolated fixtures. Prove status, recovery, repeat setup, failure, and later update use Store records and create no local operational substitute. Keep source test results distinct from installed-package proof.
- [x] t19: After package proof passes, collect V8 dogfood evidence through the real transfer with the corrected CLI. Preview and disclose the exact manifest/state removal and config changes. Apply only the reviewed scope within accepted implementation authority. Retain preview, applied-file inventory, Store read-back, preserved-content checks, and a repeat/later-update result. Do not hand-delete receipts or hand-edit the installed projection.
- [x] t20: Complete V8 Human Experience Review for HX-1 through HX-4 using the real V1/V5/V6/V8 evidence. Record each promise, actual surface, evidence, observation, `satisfied`/`material gap`/`insufficient evidence` conclusion, reviewer, limit, and follow-up. Offer one optional Guided Progress Review. If a material human uncertainty remains, select the smallest added test under PRD 50. Do not claim agent review proves lived ease or confidence.

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
- Phase/capability status: implemented; owner acceptance remains open. Stage completion alone does not close the interrupt.

## Stage 5 - Acceptance and Closeout

### Tasks

- [x] t21: Complete applicable functional, guide, and system-resource coverage passes against the implemented result. Record separate testing selections and bounded conclusions. Fix active local-state guidance and broken requirement/evidence links. Preserve historical facts and retain explicit supersession where old entry points remain visible.
- [x] t22: Run required PRD authority and documentation checks, affected CLI tests, defaults validation, build/package checks, and the justified final integration pass. Reconcile every new failure. Report the original D-031 defaults baseline separately and prove its correction. Attach the final finite evidence inventory to the phase closeout record.
- [x] t23: Reconcile current PRD status, this backlog, D-031, and any material findings against actual runtime evidence. Keep D-031 open until its exit is met. Do not hide an incomplete Store-only boundary behind a future obligation. Use the existing obligation register only for an owner-accepted separate future outcome.
- [x] t24: Present the complete P1 result for owner acceptance. Show what changed in the project tree, where status/recovery now appears, retained content, verified cases, failed/blocked limits, and HX-1 through HX-4 conclusions. Keep acceptance, staging/commit, publication, and release authority distinct.
- [x] t25: After owner acceptance of interrupt completion, record the W20 R0 return point: accepted P1/P2 remain intact; P3 planning consumes the interrupt handoff; P3 implementation still requires its own authority. Update pause/navigation records to reflect that exact gate. Do not start W20 or W21 work as part of this task.

### Acceptance criteria

- Required runtime, package, dogfood, preservation, and human-result evidence supports the full phase exit. Documentation alone cannot close the defect.
- Every material finding has a clear disposition. There is no concealed incomplete state boundary, unresolved destructive cleanup, or unsupported recovery claim.
- The user accepts P1 completion before the interrupt closes. The record states the actual acceptance and remaining limits.
- W20 resumes only through its existing entry gate and separate implementation authority. Its accepted results and task IDs remain unchanged.

### Dependencies

- V1-V8 and applicable coverage passes.
- Owner acceptance of the implemented interrupt result before closure and the W20 handoff.

### Closeout Notes

- Current status: owner accepted the W19 R3 closeout on 2026-09-09. Implementation, package proof, live transfer, final checks, and acceptance are complete. The implementation commit is authorized. W20 and W21 remain paused for a new interrupt package.
- Required stop: a failed safety or preservation check keeps P1 open. No automatic destructive retry, local-state fallback, extra unreviewed phase, or false success is permitted.


## Implementation Evidence (Running)

This section retains the implementation record and its existing link anchor. W19 R3 P1 is now accepted and closed; all tasks t1-t25 are complete. These project records cannot drive installation or recovery. The Store remains the only tool-state authority. Earlier test and transfer rows remain dated evidence. Final review, install, and acceptance facts follow below. W20 and W21 remain paused.

### Entry Check — 2026-09-09

- Authority: the user's explicit instruction, “Your proposed implementation plan is approved. Please implement W19 R3.” This follows accepted package commits `e954843e` and `9912dd81`.
- Checkout: this Make Docs maintainer repository, branch `make-docs-v2`, HEAD `9912dd81`. No branch or worktree was created or changed.
- Protected input: the coordinator's entry snapshot had only untracked `.make-docs/backup/`. Keep every existing backup byte. The later dirty files are the shared W19 R3 implementation edits; they are not a new clean baseline.
- Runtime: Node `v24.19.0`. `make-docs` resolves through `<user-home>/.nvm/versions/node/v24.19.0/bin/make-docs` to the installed `@brucewaynedecoy/make-docs` package, version `2.0.0-rc`. Package identity was read from its `package.json`; the old CLI was not run to mutate this checkout.
- Disk: the coordinator entry check reported 116 GiB free. The worker recheck reported 115 GiB free. Both checks used the current checkout volume.
- Store health: opened `<user-home>/.make-docs/store.db` with SQLite `mode=ro&immutable=1`. `PRAGMA user_version` was `2`; `PRAGMA quick_check` returned `ok`. The WAL was empty. The database was 106,496 bytes. Counts were `projects=64`, `playbook_runs=0`, `work_evidence=0`, `runs=1`, `run_evidence=0`, and `store_checkpoint_journal=1`. No Store mutation or recovery was attempted.
- Scope: one phase, five stages, t1-t25. Author shipped assets upstream. Run fault and package checks against isolated Stores and fixtures. Perform live transfer only after the accepted package and preview steps. Preserve project knowledge, backup copies, opaque legacy rows, unrelated project rows, and W20's pause.

### Early Guidance Evidence — 2026-09-09

| Check | Observation | Limit |
| --- | --- | --- |
| `python3 packages/docs/template/.make-docs/scripts/check_path_hygiene.py --self-test` | 8 tests passed. Content scanning no longer needs an installation manifest. Tests cover custom scope, symbolic links, traversal, protected directories, and normal findings. | Source helper proof; not packaged CLI proof. |
| No-CLI content fixture | Ran the source Python helper with empty `PATH`, one project document, and an absent Store path. Exit was zero; one file was checked; the complete file hash inventory was unchanged; no Store or local state was created. | Proves ordinary content checking remains available. Does not prove the optional lifecycle capture handler or required CLI mutation path. |
| `npm run validate:defaults` during shared edits | Collection stopped because CLI files imported the then-pending `store/installation-state` module. No tests ran in that attempt. | Rerun after code integration. Installed/template parity still requires the later CLI dogfood step. |
| `git diff --check` after upstream edits | Passed. | Formatting check only. |
| `npm test -w packages/cli -- tests/w19-r3-path-hygiene.test.ts` | 6 tests passed. Store inventory takes precedence; absent/unavailable Store uses content-only checking; explicit legacy input stays read-only; protected payloads and unsafe paths are excluded. | Focused caller tests mock the Store read seam; integration must still prove the real service. |
| `npm test -w packages/cli -- tests/consistency.test.ts -t 'Store-owned installation guidance'` | 3 tests passed; 34 unrelated tests were skipped. | Shipped-source guidance contract only. Full defaults and installed parity remain pending. |
| Registry, MCP, and path-hygiene regression group | 41 tests passed across `mcp-derivation`, `mcp`, `operation-domains`, `p3-operation-surfaces`, `p8-runtime-retirement`, `registry-contract`, and `w19-r3-path-hygiene`. The exact current registry contains 27 operation IDs, including both project state operations. | Source test run with two workers. Package and live CLI proof remain pending. |
| `npm test -w packages/cli -- tests/project-identity.test.ts --maxWorkers=2` | 16 tests passed. Current identity uses config; Store records control ownership; legacy import is explicit; moves and clones preserve project identity without copying checkout ownership. | Isolated fixture proof. Does not authorize or prove the live repository transfer. |
| Project-state, registry-work, Store-verification, and run-CLI regression group | 29 tests passed with two workers. Fixtures use declarative config and Store records. A corrupt Store keeps its bytes; content status remains available; required checkpoint capture fails without changing the work file. | Source and isolated fixture proof. Full package checks remain pending. |
| Tool uninstall authority check | `update-existing`: [PRD 39 R-SELF-1](../../prd/39-cli-command-model-and-operation-registry.md#tool-self-management-r-self) now matches PRD 38's separate cleanup scope. Store data is preserved by default; `--remove-store` is explicit; `--yes` alone does not select deletion. Prior behavior is retained in requirement history and D-031 records the correction. | Same accepted phase and owner; no new capability or PRD. Source/package tests must prove this behavior. No live uninstall or Store deletion was performed. |


### Implemented Result and Writer Coverage — 2026-09-09

The Store schema is version 3. Installation ledgers, checkout bindings, pending operations, step records, locks, migration records, transfer provenance, and tool operations now have one Store owner. File bodies stay in ordinary backup copies. A project keeps only its declarative ID/settings and project content.

| Caller | Authority and result |
| --- | --- |
| Setup, reconfigure, update-shaped sync, Skills, conflict choices | The shared installation operation reserves Store intent and checkout ownership before project writes. File steps retain hashes and backup references. Final ownership commits after output checks. |
| Resource ensure and project-surface ensure | The same operation service controls writes and final ledger updates. CLI and MCP share the registered core. |
| Backup, restore, and project removal | Store records describe the operation and backup inventory. Ordinary backup copies stay local. Removal preserves other Store data. |
| Status, identity, registry, resource resolution, and audits | Current ownership comes from config identity plus the Store ledger. Local legacy records are read only for an explicit transfer preview/import or a read-only legacy audit. |
| Tool update and uninstall | Required machine operation intent precedes package manager work. Uninstall preserves the Store by default. `--remove-store` is a separate explicit choice and refuses ambiguous ownership or active operations. |
| Ordinary work and optional capture | Missing CLI or failed optional capture does not stop ordinary project work. Capture is reported unavailable. There is no direct Store-writing agent fallback, local queue, or false success. Required CLI operation capture still stops safely on failure. |

Store preparation, checkout locks, and global asset locks use separate scopes. Global home Skills share one machine Store lease even when callers select different Store overrides. Recovery checks process death on the same host; time alone never permits lock removal. Status and dry-run do not reclaim locks. An existing unverified recovery guard still requires manual owner review.

### Finite Verification Results — 2026-09-09

| Group | Evidence and result | Limit |
| --- | --- | --- |
| V1/V4 caller behavior | Installation, projection, resource/surface, backup, removal, conflict, and migration suites use real Store transitions and whole fixture trees. Caller safety checks include changed reviewed authority, required Store failure, and no symlink-copy fallback after a Store error. | Native macOS fixtures; no native Windows or Linux run is claimed. |
| V2/V3/V4 Store service | `vitest run tests/installation-state.test.ts`: 22 passed. Includes missing/read-only/corrupt/unknown/newer Store, local/symlink roots, foreign drive syntax, stable config, clone/move bindings, live writers, actual exited-writer recovery, later edits, and step/final-receipt faults. | Drive/UNC checks are lexical on this host. Ambiguous ownership remains a refusal. |
| V3 lease recovery | Nine focused subprocess tests passed, including process exit/SIGKILL, live/foreign/malformed owners, file identity changes, symbolic links, and preserved SQL state. | A crashed recovery guard is not automatically stolen. |
| V4/V5 migration | 66 migration/Store-lifecycle/reorganization checks, 33 projection/import checks, and 20 global-lock/tool checks passed in scoped runs. Completed legacy receipts import without replay; incomplete/ambiguous legacy recovery stays blocked with evidence retained. | Legacy records without a complete desired change plan cannot support automatic resume. |
| V6/V7 package | `node scripts/smoke-pack.mjs` passed with network access for package dependencies. npx, pnpm, and bun fixtures installed Store-owned state. Direct packaged setup/repeat, Skills, status, backup, removal, update-route, and uninstall cases passed. Backup payload SHA-256 values and Store reference sets matched exactly. | Ambiguous package-runner ownership must refuse explicit Store removal. Package-runner tests use temporary projects and Stores. |
| V7 defaults | After CLI dogfood, `npm run validate:defaults`: 49 passed. The D-031 register inventory and installed/template parity checks pass. | Defaults proof is separate from runtime and human acceptance. |
| V7 optional capture | Source helper with empty PATH continued normal content work without a CLI or Store. Shipped guidance tests passed. P6 optional-capture failure returned `run-capture-unavailable`, with no repository state or receipt. | Agent evidence proves the stated branches; it does not measure a user's confidence. |
| V8 actual prior CLI | The previously installed `2.0.0-rc` binary was run against an isolated config-ID fixture. Setup exited 1 on the unknown `projectId` key before any file change. | This proves that binary's setup guard only. It does not claim control over all obsolete binaries or commands. |

The first full integration run found old local-file expectations, durable-write timeouts, and real ownership faults. Relevant faults were corrected and scoped checks rerun. The final integration result is recorded separately below. Tests use two workers and a 20-second ceiling for durable filesystem integration cases; this is not a performance target or performance pass.

### V8 Reviewed Live Transfer — 2026-09-09

- Package: `@brucewaynedecoy/make-docs@2.0.0-rc`; tarball SHA-256 `d1a9ebf65e615b6b8648edbceeb4f9205a3452bd4e30eb3ff3db23efda23d242`. Built from the tested W19 R3 working tree. No publication or global executable replacement occurred.
- Reviewed command: packaged `setup --yes --dry-run --target <this checkout>`. It showed 14 verified legacy record files, 10 shipped instruction updates, and one preserved user playbook skip. No safety stop remained.
- Exact transfer: local manifest, 11 completed migration receipts, legacy quiescence, and `.make-docs/backup/2026-09-09T01-50-09.069Z/backup-manifest.json`. Import committed and was read back before those source files were removed. The owner separately allowed removal of the Finder `.DS_Store` file. No receipt was hand-deleted.
- Apply: packaged `setup --yes --target <this checkout>` passed. `.make-docs/state/` and `.make-docs/manifest.json` are absent. Config now carries the preserved project ID `831ddb50-b97a-47e2-9f2c-f491b27b8759`.
- Store read-back: schema 3, `quick_check=ok`, status `ready`, no pending operation. The ledger and checkout ID are held in the Store. Legacy identity and setup migration both completed. The original six Store tables retain identical row hashes: 64 project rows, one current run, one prior checkpoint journal row, and the empty legacy/evidence tables.
- Preservation: checked 1,087 existing document and backup files. Only the two previewed `docs/assets/` instruction files changed and the transferred backup inventory was removed. All other checked files and all backup payloads retained their bytes.
- Repeat: packaged `setup --yes --target <this checkout>` passed again. All 1,215 files under `docs/` and `.make-docs/` were unchanged. No local state returned. Store read-back retained one legacy import and recorded the user-invoked repeat as another completed setup operation: three completed operations, 33 receipts, and zero pending operations. The repeat did not import the old inputs again.
- Environment limit: the workspace sandbox could not open SQLite shared-memory files for the live Store. The same read-only status and preservation queries passed with access to the Store directory. No Store repair was required.

At the transfer checkpoint, the corrected built CLI (`node packages/cli/dist/index.js`) was used because the global executable had not yet been replaced. The owner later installed the corrected CLI through `just install-cli`; see the final closeout evidence below. Obsolete writers remain unsupported after transfer.

### Human Experience Review — 2026-09-09

Reviewer: Codex, using actual package, file inventory, Store read-back, and fault evidence. These conclusions do not stand in for the owner's lived experience or acceptance. An optional guided review of status and recovery is available at handoff.

| Promise | Surface and observed evidence | Conclusion and limit |
| --- | --- | --- |
| HX-1: local state stays absent | The live state directory and local manifest disappeared after verified transfer. Repeat setup changed no files and recreated neither path. | Satisfied in the observed transfer/repeat. Future changes remain covered by regression checks. |
| HX-2: one status/recovery path | Packaged `project state status --json` shows `ready` and no pending operation. Fault fixtures name pending work; preview is read-only; exact resume/rollback modes share one CLI/MCP core. | Satisfied for the tested states. Old global CLI replacement is a separate install/release step. |
| HX-3: failures keep user files and evidence | Required Store failure stops writes. Step/receipt failure retains pending work. Actual exited-writer recovery works. Later edits and incomplete plans block unsafe recovery. | Satisfied for tested faults. Dynamic skill changes, removal, and multi-checkpoint migration remain rollback-only until their full plan is saved; incomplete legacy records may require manual review. |
| HX-4: knowledge and backup copies remain | The protected-file and original Store-row hash comparisons pass. Desired settings and config comments have focused coverage. The live user playbook was skipped. | Satisfied for the measured files and rows. Only disclosed instruction updates and transferred metadata changed. |

### Acceptance Handoff

The owner explicitly accepted W19 R3 and authorized its commit on 2026-09-09. D-031 is closed. The corrected CLI has been installed through `just install-cli`. The implementation commit is the next authorized action; no push, publication, or release is authorized. W20 P1/P2 remain accepted and closed. W20 P3 has not started. W20 and W21 remain paused for the next owner-requested interrupt package. That package will be drafted only after this commit; its implementation awaits backlog review and acceptance.


### Final Integration Reconciliation — 2026-09-09

The final whole-suite run contained 983 tests: 979 passed and four needed a scoped rerun. Three installed-file parity checks ran before the reviewed dogfood transfer. The fourth test exercised every retired command spelling through subprocesses and exceeded its 20-second ceiling under concurrent load (20.8 seconds). After transfer, defaults passed 49/49 and the P7/P8 rerun passed 25/25; the command test completed in 15.8 seconds. No assertion or runtime defect remains unexplained. The 22-test Store service set also passed, including actual process-exit recovery and step/final-receipt faults.

The final help-only change adds status/recovery to root help and explains Store ownership and exact recovery modes. It changes no operation logic. The final build and TypeScript check pass. Package smoke and live transfer used the same operation code; the live package hash above remains its exact evidence identity.

Final document checks passed: 39 PRDs, 848 links, no diagnostics. `git diff --check` passed. This was the pre-acceptance handoff: tasks t1-t23 were complete and t24-t25 awaited the owner. The owner has since accepted the result; all tasks are now complete.

### Final Review, Installed CLI, and Owner Acceptance — 2026-09-09

- Final review found a race between reserving an installation lock and taking the full Store lease. The fix checks pending installation operations and installation locks inside `BEGIN IMMEDIATE` before it records a machine operation. The existing reverse check blocks installation while a tool operation is pending.
- The focused regression set passed 23 tool/global-asset tests. It covers the SQL-lock/full-lease gap, two paths to the same physical Store, interrupted setup after lock release, and tool-first blocking of installation. TypeScript and diff checks passed. This was a bounded review and focused rerun, not a second whole-suite run.
- `just install-cli` rebuilt, packed, and installed the corrected CLI without publishing it. Final tarball SHA-256: `2836f23b43307c8dca12853c73e2f8a9758b0bd47a92a9379f169ba29406be09`. The installed `make-docs project state status --target-root <this checkout> --json` reported `ready`, `storeAvailable: true`, and no pending operation. The known sandbox shared-memory access limit required filesystem access; it did not indicate a Store fault. Final defaults passed 49/49.
- The installed CLI created the archive surface through `make-docs project surface ensure archive`. It preserved all existing configured routers and added only `.make-docs/archive/AGENTS.md` and `.make-docs/archive/CLAUDE.md`. The Store recorded receipt `sha256:741f154973478af791dde70d5fa9bc28ab7b21c123d777a8750694fdc2f84778`. No local operation state was written.
- The owner explicitly accepted the closeout and authorized its commit. t24 and t25 are complete. D-031 is closed. The [history record](../../../.make-docs/archive/history/2026-09-09-w19-r3-p1-store-state-closeout.md) records this accepted result. No new `O-###`, `NUAT-###`, or `PERF-###` was created; the recorded `not-needed-now` testing disposition remains in force.
- W20 P1/P2 remain closed; P3 has not started. W20 and W21 remain paused. After the R3 commit, draft the next interrupt package with one phase where scope permits. No next package or W20/W21 implementation is authorized by this closeout.
