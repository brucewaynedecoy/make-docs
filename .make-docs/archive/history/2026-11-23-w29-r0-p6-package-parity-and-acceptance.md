---
title: "W29 R0 P6 Package Parity and Acceptance"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P6"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W29 R0 P6 Package Parity and Acceptance

## Changes

Proves the work store on an installed package candidate. The packed branch-build candidate (it reports version `2.0.9`; tarball SHA-256 `66eaca5f8e5cad123385bb1d7387a9caf259149bed897c4594da1cbec55bbb94`) was installed in a clean fixture project and in a temporary clone of this repository, each with a temporary Store; the first import of 463 work files changed no file. Two worktrees of the clone that share one Store proved import, write, same work on both sides, the `both-changed`, `file-deleted`, and `claimed` conflicts with their settle choices and refusals, accept-deletion with copy removal in the other checkout, a held path, and an unreadable file. Without a Store, and with a Store the checkout is not bound to, `backlog snapshot` gives the same bytes as the build from before W29 R0 P2, and the other existing commands match it. In a folder without git, next, claim, report, close, and sync work. An MCP client over stdio got the same `work_next` answer as the CLI JSON.

`PERF-004` is written in the phase file and ran three times on fresh clones of this repository: first import 1,380 ms, a sync with no change 386 ms, `work next` 330 ms, `work status` 351 ms, and `backlog snapshot --work-store` 3,245 ms (medians; CLI floor 84 ms). Result `pass`, informational. The digest-only fast path is not needed now.

The installed runs found five wording defects, all fixed with tests: a doubled period after a blocker, a close listed as a store-only edit although the next sync writes it, "released its claim" with no claim and the task sentence on a phase close, a held file counted as a file to write, and an unreadable file that sync would "apply". An independent review found that, with no Store, the work write commands returned `work-store-refused` instead of the `store-*` code that PRD 52 R-WORK-STORE-2 requires, said "nothing changed", and created a Store (register D-069). A clone with a saved project ID on a new Store needs four setup commands before `setup --adopt --yes` is named; register D-070 routes that to the setup and adoption area. The Human Experience Review finds all five index promises met with named limits. An independent review accepted the code fixes and asked for documentation fixes, all done: D-069 restated, D-070 added, the `PERF-004` Workload, Finding Links, digest, and ledger corrected (version `1`, no rerun, reasons recorded), more harness stop checks, the proof script kept with a redacted rerun on the review candidate, no period after a blocker that ends in `?` or `!`, candidates named by full tarball SHA-256, and a moved code comment. The owner then passed the Guided Progress Review (option A) and chose option B twice. For D-069, every registry write command now checks for the Store database before its write admission and, with no Store, refuses with `store-unavailable` and creates nothing; setup alone creates a Store. This also stops `work evidence record` and `lifecycle start` from creating a Store, which no PRD requires. For FOLLOW-UP-P6-CLOSED-PARENT, the index status still does not close its phases; a done phase under a closed index is told to set its status line to `completed`, and `project doctor` gains `phase-open-under-completed-index` (PRD 39 R-DOCTOR-9), which on a temporary clone finds the 17 finished phase files of W19 R2, W20 R0, W31, W32, and W33. The fix was not run on this repository. Every W29 owner gate is closed, and the W29 index is `completed`.

```text
packages/cli/
├── src/operations/work/work-queue/readiness.ts     (blocker period)
├── src/operations/work/work-queue/queue.ts         (store-only edits, close wording)
├── src/operations/work/work-store/sync.ts          (store-only edits, held and unreadable check lines)
├── src/operations/work/work-store/catalog.ts       (ancestor-closed done branch)
├── src/operations/context.ts                       (no Store is created by a write command)
├── src/operations/project/doctor/                  (phase-open-under-completed-index)
├── src/run/root-operations.ts                      (doctor text output)
└── tests/w29-r0-p6-package-parity.test.ts          (new)
packages/docs/template/.make-docs/system/references/
├── work-store.md                                   (ancestor-closed next action)
└── project-doctor.md                               (new check)
docs/work/2026-11-21-w29-r0-work-store/
├── 06-package-parity-and-acceptance.md             (PERF-004 profile and result, closeout)
├── evidence.md                                     (P6 section)
├── 00-index.md                                     (completed, change history)
├── evidence/p6/performance/                        (PERF-004 harness and results)
└── evidence/p6/proofs/                             (installed proof script, helpers, redacted run log)
docs/prd/03-open-questions-and-risk-register.md     (D-069 closed, D-070)
docs/prd/39-cli-command-model-and-operation-registry.md (R-DOCTOR-2, R-DOCTOR-9)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P6 work](../../../docs/work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md) | The `PERF-004` profile and result, T1 to T9, and the closeout. |
| [Evidence report](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md#p6-package-parity-and-acceptance) | Candidate, defects, installed proofs, `PERF-004`, Human Experience Review, plan validation map, owner samples, and limits. |
| [PERF-004 results](../../../docs/work/2026-11-21-w29-r0-work-store/evidence/p6/performance/perf-004-results.json) | Redacted per-run timings and checks. |
| [Register D-069 and D-070](../../../docs/prd/03-open-questions-and-risk-register.md) | D-069 closed with option B; the setup and adoption finding, routed to its owner. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | R-DOCTOR-2 and new R-DOCTOR-9, with history. |
| [Installed proof script](../../../docs/work/2026-11-21-w29-r0-work-store/evidence/p6/proofs/installed-proofs.sh) | T2 to T5, the MCP check, and the owner samples, with a redacted run log. |

### Maintainer

None this session.

### User

| Path | Description |
| --- | --- |
| `make-docs://system/reference/work-store.md` | The `ancestor-closed` next action for a done phase. |
| `make-docs://system/reference/project-doctor.md` | The `phase-open-under-completed-index` check. |
