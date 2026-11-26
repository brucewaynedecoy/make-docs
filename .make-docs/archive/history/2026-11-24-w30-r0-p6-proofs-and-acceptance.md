---
title: "W30 R0 P6 Proofs and Acceptance"
kind: "history"
status: "draft"
date: "2026-11-24"
client: "T3 Code"
model: "Claude Fable 5.2"
coordinate: "W30 R0 P6"
repo: "make-docs"
branch: "t3/w30-factory-proofs-acceptance"
---

# W30 R0 P6 Proofs and Acceptance

## Changes

Does the P6 work that an agent can do without the owner's real tools, and leaves each owner gate open. The drift test, the version drift test, and the backup test in a folder without git ran through the installed package candidate with a temporary Store and generic tool names (T4, T5, T12). Package parity is proved for the resources, both factory Skills as the installed tarball installs them, and the operations (T7). A search of the shipped factory Skills, resources, source, and test files found no tool named as required or default (T8). A Human Experience Review is recorded for each of the seven promises in the backlog index: four are `satisfied` within their limits, and three have `insufficient evidence` until the two capability proofs run (T9). The phase stays `active`. Proof A, Proof B, the real tool names, the capability tags, and the never-log scan of the real proof records (T1, T2, T3, T11, T13) wait for the owner, who picks the real tools. The owner decided on 2026-11-24 to keep Unassisted Goal Testing at `not-needed-now` (T10).

The factory contract's Rule Catalog now marks a built check with "Built in" and its phase and task (T14). 57 rows changed from "Planned in". Three rows that said "Contract-only" for a check that the CLI makes now say "Built in": `only-ready-takes-work`, `no-silent-replace`, and `one-human-channel`. So 60 of the 90 rows are built, 30 are contract-only, and none is planned. The opening paragraph explains the three row forms, and the interim note is removed. The `claim-held` row names `factory.assignment.save`. The word "Built in" is new wording that the builder chose, and the owner kept it. No rule changed.

For a lost tool, `make-docs factory status`, `make-docs factory workflow list`, and the `not-ready` refusal of `make-docs factory assignment start` now give one fix step, the smallest one: bring the tool back and report it. Before, one line gave two steps joined by "or". Only `make-docs factory workflow show` adds the second way, to bind another tool. This is a change of output, by owner decision of 2026-11-24. The contract, PRD 53 R-FACTORY-33, and the `factory` run Skill say the same.

Two small text defects are fixed. Step 2 of the `staged-backlog` workflow type no longer calls `make-docs work next` planned. This changes the digest of the type file, so a `staged-backlog` workflow saved under the old file would show `type-changed`; no release holds the factory yet. The generated copy `workflow-<name>.md` no longer prints two full stops after an accepted known loss, and it keeps an ellipsis.

`packages/cli/tests/w30-r0-p6-proofs-and-acceptance.test.ts` is new, with 4 tests. One test drives the built CLI through the record path of both proofs: two units with one correction in a folder without git, the backup and its cleanup, both drift tests with the refused start, a two-tool `lead-and-specialists` unit with one grant, and a never-log scan of the 9 factory tables, the lifecycle tables, the Store file bytes, and the copies. These runs record what a foreman records. They start no agent and send no message, so they are not Proof A or Proof B. That test also proves the one fix step and the three newly named checks. The other three tests hold the Rule Catalog words and counts, the known-loss line, and the tool name search of the factory source.

```text
packages/docs/template/.make-docs/system/
├── contracts/factory-contract.md                         (Rule Catalog: "Built in"; one fix step)
└── references/factory/workflows/staged-backlog.md        (one stale word)
.make-docs/system/                                        (identical dogfood copies)
packages/cli/
├── src/operations/factory/copies.ts                      (one full stop after a known loss)
├── src/operations/factory/live-plan.ts                   (one smallest fix, and a second step)
├── src/operations/factory/service.ts                     (only workflow show gives the second step)
├── tests/w30-r0-p1-factory-resources.test.ts             (accepts "Built in")
└── tests/w30-r0-p6-proofs-and-acceptance.test.ts         (new)
packages/skills/factory/SKILL.md                          (one fix step; identical installed copy)
docs/prd/53-factory-setup-and-orchestration.md            (R-FACTORY-33)
docs/work/2026-11-21-w30-r0-factory/                      (P6 tasks, P1 history, evidence)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-11-21-w30-r0-factory/evidence.md](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | New section "P6 Proofs and Acceptance": the state of each task, the record path runs, the three tests, the never-log scan, package parity, the tool name search, the Rule Catalog change, the Human Experience Review, the checks, the owner decisions of 2026-11-24, and the open owner items. One stale sentence in "Store Lifecycle Fixes" now names commit `383319ac`. |
| [docs/work/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md](../../../docs/work/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md) | T4 to T10, T12, and T14 done. One Change History entry for the one fix step. Closeout notes say what is recorded and what waits for the owner. |
| [docs/work/2026-11-21-w30-r0-factory/01-factory-contract-and-workflow-types.md](../../../docs/work/2026-11-21-w30-r0-factory/01-factory-contract-and-workflow-types.md) | One Change History entry for the Rule Catalog Check column. |
| [packages/docs/template/.make-docs/system/contracts/factory-contract.md](../../../packages/docs/template/.make-docs/system/contracts/factory-contract.md) | The Rule Catalog Check column and its opening paragraph, and the one fix step in the Readiness section. The dogfood copy is identical. |
| [docs/prd/53-factory-setup-and-orchestration.md](../../../docs/prd/53-factory-setup-and-orchestration.md) | R-FACTORY-33 and one Requirement History entry. |
| [packages/skills/factory/SKILL.md](../../../packages/skills/factory/SKILL.md) | The `drifted` step gives the one smallest fix. The installed copy is identical. |
| [packages/docs/template/.make-docs/system/references/factory/workflows/staged-backlog.md](../../../packages/docs/template/.make-docs/system/references/factory/workflows/staged-backlog.md) | One stale word removed from step 2. The dogfood copy is identical. |

### Maintainer

None this session.

### User

None this session.
