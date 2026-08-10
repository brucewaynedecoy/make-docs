---
title: "W18 R7 P1 Run-State Record and Global-Store Storage"
kind: "history"
status: "completed"
date: "2026-07-03"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R7 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Relocated Playbook run state into the W18 R10 global store through the runner's new storage seam, landed the full R-STATE-1 run-state record bound to the shared status vocabulary, and closed R-019."
---

# W18 R7 P1 Run-State Record and Global-Store Storage

## Changes

Implemented [Phase 1 of the W18 R7 backlog](../../../work/2026-07-01-w18-r7-run-playbook-state-machine/01-run-state-record-and-global-store-storage.md) per [historical closeout](2026-07-03-w18-r7-p5-tests-and-verification.md) (retired action-PRD: `docs/prd/35-revise-run-playbook-state-machine.md`) R-STORE-1 through R-STORE-3 and R-STATE-1 through R-STATE-2. The new module `packages/cli/src/operations/playbook/run-state.ts` is the runner's narrow storage seam over the W18 R10 global store: `createPlaybookRunState`, `readPlaybookRunState`, and `transitionPlaybookRunState` wrap the store's `playbook_runs` record primitives inside `withStoreDatabase`, keyed by the manifest-minted project identifier plus a run identifier. Project identity comes exclusively from `resolveProjectIdentity`, with `unminted`, `no-manifest`, and `unreadable` failing the operation with actionable setup guidance rather than any path-keyed or in-repo fallback, and no store schema, locking, or recovery behavior is defined in runner code. The `PlaybookRunState` record (`schemaVersion` 2) carries the full R-STATE-1 content — run, root-run, and parent-run identifiers, project identifier, playbook ref and path, source digest, document and workflow schema versions, stack, harness, capability snapshot, routing model, per-step statuses, gate decisions, a dependency availability snapshot seeded from the parsed Playbook model, claimed output surfaces, output and evidence references, the step-or-gate cursor, child policy and concurrency policy, child-run references, resume hints, run and terminal status, and timestamps. Per-step, run-level, and terminal status are bound to the shared eight-value `PlaybookStepStatus` vocabulary from `packages/cli/src/playbook/model.ts` with terminal statuses a type-checked subset and a fail-closed runtime guard; the parallel W18 R4 `PlaybookRunStatus` vocabulary (`planned`/`paused`) is deleted, and the invoke flow translates its invocation-plan statuses into shared values (`ready` to `running`, gate pause to `waiting-for-user`). The anti-pattern is removed at the source: `playbookRunStatePath` and every `.make-docs/runs/playbooks/**` write are deleted from `packages/cli/src/operations/playbook/index.ts`, `invokePlaybook`, the `playbook.start`/`status`/`invoke` operations, and the `run playbook` CLI adapters are retargeted to the store with an optional `--store-root`/`storeRoot` override for tests and sandboxes, and `PlaybookInvocationPlan.statePath` is replaced by `projectId`. The concrete serialization is the recorded D9 implementer decision — one JSON document per run in the `playbook_runs` record column, versioned by the record's own `schemaVersion` — documented in the module doc comment and in [the store module README](../../../../packages/cli/src/store/README.md). Scope determination: the `.make-docs/runs/<wave-slug>/state.json` references in `operations/lifecycle/index.ts` and `operations/work/index.ts` are the legacy work-lifecycle checkpoint lineage (W18 R10 P3) consulted read-only and were intentionally left untouched. Verification landed alongside: `scripts/smoke-pack.mjs` moved off the anti-pattern (the run fixture now mints a project identifier and the smoke asserts no `.make-docs/runs/` exists under the fixture after `run playbook start`), the run-state coverage in `packages/cli/tests/playbook-operations.test.ts` proves store keying, repository-untouched writes, the R-STATE-1 key set, the exactly-eight status vocabulary with the retired `planned` rejected, identity refusal, duplicate-create and missing-run transition errors, transition round-trips, parent linking with overlap guards, and the invoke flows, and `packages/cli/tests/operation-domains.test.ts` was retargeted to the store. All six Phase 1 tasks (t1 through t6) are checked off.

Developer-guide coverage was `update-existing` for both owning guides, each of which carried a Future Coverage bullet blocked on exactly this phase: [Run Playbook Runner Architecture](../../library/developer/playbooks-development-runner-architecture.md) rewrote its Run State section around the global store, the storage seam, the R-STATE-1 record, the D9 serialization decision, and the shared status vocabulary, updated the start/status command descriptions and the child-run guard wording, and replaced the resolved relocation bullet with a Phase 2 progression-engine bullet; [Docs Assets and Runtime State Boundaries](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) folded the relocation into the runtime-state story — nothing current writes under `.make-docs/runs/`, with the tool-directory runtime-state classification staying correct only for unmigrated legacy files — and dropped its resolved Future Coverage section. No new guide was warranted because the existing guides own both topics. User-guide coverage was `update-existing` on [Running Make Docs Playbooks](../../library/user/playbooks-running-make-docs-workflows.md): run state now lives in the machine-level store rather than the repository, runs are keyed to the setup-minted project identity, and starting a run in a project without Make Docs set up stops with guidance; the unimplemented Phase 2 progression operations were deliberately not claimed. PRD coverage was `risk-register-update` with no change doc, because the phase implemented existing PRD 35 requirements without changing the requirement surface: [R-019](../../../prd/03-open-questions-and-risk-register.md) moved from Open to Closed — its close bar (store landed, W18 R7 storage built on it, R-TEST-5 assertion passing) is fully met — with a Resolution block recording the seam, the identity refusal, and the two-layer no-repo-run-state proof, and [R-016](../../../prd/03-open-questions-and-risk-register.md) advanced in place recording the single run-state writer and the deleted parallel vocabulary while staying Open on the five pending progression identifiers. `docs/prd/00-index.md` needed no change: PRD 35 remains Current and the index's R-019 sequencing note stays accurate as historical lineage.

Validation: full CLI suite 727/727 across 44 files, `npm run validate:defaults` green, `node scripts/smoke-pack.mjs` exit 0, `python3 .make-docs/scripts/check_path_hygiene.py` errors=0, relative links in the touched docs verified to resolve, and no guide promoted past `draft` or given placeholders. `git diff --check` is clean for every doc this session touched; it reports one blank line at EOF in the implementation's uncommitted `packages/cli/src/operations/playbook/index.ts`, left to the implementation lineage because this documentation session does not edit code files.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r7-run-playbook-state-machine/01-run-state-record-and-global-store-storage.md](../../../work/2026-07-01-w18-r7-run-playbook-state-machine/01-run-state-record-and-global-store-storage.md) | Marked Phase 1 tasks t1 through t6 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Closed R-019 with its Resolution block; advanced R-016 in place with the W18 R7 P1 single run-state writer. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Rewrote the Run State section around global-store storage, the storage seam, the R-STATE-1 record, and the shared status vocabulary; requeued Future Coverage on the Phase 2 progression engine. |
| [../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md](../../library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md) | Folded the Playbook run-state relocation into the runtime-state boundary story; nothing current writes under `.make-docs/runs/`. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Documented that run state lives in the machine-level global store, keyed to the setup-minted project identity, with setup guidance when a project has no minted identity. |
