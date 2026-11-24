---
title: "W30 R0 Store Lifecycle Fixes"
kind: "history"
status: "draft"
date: "2026-11-24"
client: "T3 Code"
model: "Claude Fable 5.2"
coordinate: "W30 R0 P6"
repo: "make-docs"
branch: "t3/factory-store-lifecycle-fixes"
---

# W30 R0 Store Lifecycle Fixes

## Changes

Fixes the gaps that the owner's audit of the factory tables found on 2026-11-24, before W30 R0 acceptance. The owner chose option A for each finding. Each finding was first confirmed against the code. All of it is new behavior. The tasks are P6 T15 and T20 to T24.

`make-docs factory workflow clean` (MCP `factory_workflow_clean`) is the reviewed removal of one saved workflow. Without `--review` it changes nothing and gives a review digest. With the digest it deletes, in order, the backup files and their records, the final assignments, the grant uses, the grants, the test task results, the plan revisions, and the binding, and then writes the copies again. It refuses with no project, an open assignment, a digest that no longer matches, or a backup file that it cannot reach. A pruned project's factory rows go through the scoped cleanup of the work store.

A backup record now goes only together with its file. Cleanup keeps and reports a due record whose file is in another checkout or in a folder that moved or is gone, and the report holds the path inside the project only.

The latest test result for a plan decides. A failed test task of the `ready` plan makes the workflow `wired` with the readiness code `test-failed`. It takes no new work until a test task passes again.

Spent and expired grants stay until the workflow is removed, with indexed and bounded reads. A plan revision that any retained assignment names, open or final, is never removed by the keep rule.

`make-docs factory status` shows each bound tool with the age of each proof, and calls a proof older than 30 days old. The `factory` run Skill checks its bound tools again before it takes new work.

The Store README names the command that writes each factory table. Schema v9 did not change.

An independent review on 2026-11-24 then found three defects and four smaller points, and all are fixed (P6 T25). No delete goes through a symbolic link: each path part is read without following a link before every delete, in the removal and in cleanup. The removal checks every backup file before its first delete. A delete that still fails gives a typed `stopped` result, with a Store that matches the disk. The review digest now binds record identities and versions, not only counts. The prune result reports the factory rows that went and the workflows that stay. `make-docs factory workflow show --uses-before <use-id>` reads older grant uses. The `not-ready` refusal of `factory assignment start` names `test-failed`. `make-docs setup store check` shows a backup record whose checkout folder is missing as the decision item `STORE-DECISION-005`.

On 2026-11-24 the owner decided the two open register questions, and a re-check found five more points (P6 T26). By D-078, option B, the reviewed removal drops a backup record whose files are not found on this computer now, and the review lists each one by name as "record dropped, files not reachable". This is new behavior. Routine cleanup still keeps such a record and reports it. By D-079, option A, the removal reaches the project's other bound checkouts, as it already did, and the review now names each checkout. The review digest binds the bytes of each backup file, so a changed file gives `review-mismatch`. A refusal's text now matches its code, a delete that fails after the checks uses general words, `STORE-DECISION-005` splits a path at the last backup folder marker, and the not-ready refusal says once that the test task failed. Both register entries are closed.

A round 4 check then found five points, and all are fixed (P6 T27). The words no longer say "gone for good": the files are not found on this computer now (removed, renamed, or on a drive that is not connected), a file that still exists stays, and no later cleanup finds it. After a folder move, each matching copy goes and is listed, counted, and bound in the digest. A moved file with other bytes stops the removal with `backup-file-changed`. Two dropped records with one name both go. One shared function, in `packages/cli/src/store/factory-backup-path.ts`, splits a backup path at the last marker that the assignment ID follows. The owner then answered the last two points on 2026-11-24. No new refusal rule is added for a dropped record whose file still exists: the owner accepted it, and the output says so. A checkout folder can be a symbolic link, and a link below it stays refused (register D-080, option A, closed); the build already worked this way. No question stays open.

A round 5 check found one data point and four small points, and all are fixed (P6 T28). A file that is the recorded backup of another record is that record's own file: cleanup no longer deletes the file of a live record for an older record with the same path, and the removal counts each file once. The path split uses the record's original path. A fixed Store rule may have no derive step. One contract row and one PRD sentence are corrected.

| Area | Summary |
| --- | --- |
| Store service | Removal rows, record identities for the review digest, keep rule, paged grant reads, and the failed-test rule in `packages/cli/src/store/factory-store.ts`; the pruned-project cleanup in `packages/cli/src/store/work-store.ts` and its report in `packages/cli/src/store/lifecycle.ts`; the decision item in `packages/cli/src/store/table-catalog.ts`. |
| Operations | `factory.workflow.clean`, proof ages in `factory.status`, bounded `factory.workflow.show`, and the backup rule in `packages/cli/src/operations/factory/`. |
| Names | The registry, the name catalog, the leaf help table, and the CLI adapter name the new command. |
| Tests | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts` (41 cases), one new Store maintenance fixture row pair, and changed cases and counts in 11 other test files. |
| Contract and Skill | The factory contract (template, then the identical dogfood copy) and the `factory` run Skill (package, then the identical installed copy). |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-11-21-w30-r0-factory/evidence.md](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | New section "Store Lifecycle Fixes": one row for each finding, the removal command, the choices, and the checks. |
| [docs/work/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md](../../../docs/work/2026-11-21-w30-r0-factory/06-proofs-and-acceptance.md) | T15 done, new Stage 5 with T20 to T28 and A89 to A101, and five Change History entries. |
| [docs/prd/53-factory-setup-and-orchestration.md](../../../docs/prd/53-factory-setup-and-orchestration.md) | R-FACTORY-12, -24, -45, -57, new R-FACTORY-73 to -75, both tables, and Requirement History. |
| [docs/prd/38-global-store-and-project-state.md](../../../docs/prd/38-global-store-and-project-state.md) | Six factory R-MIN rows, R-MAINT-4, and Requirement History. |
| [docs/prd/52-work-store-and-work-queue.md](../../../docs/prd/52-work-store-and-work-queue.md) | R-WORK-STORE-13 and Requirement History. |
| [docs/prd/39-cli-command-model-and-operation-registry.md](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | R-RUN-1 and Requirement History. |
| [docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md](../../../docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | R-MCP-PROFILE-2 and Requirement History. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../docs/prd/03-open-questions-and-risk-register.md) | Decisions D-078 (option B), D-079 (option A), and D-080 (option A), all closed. |
| [packages/docs/template/.make-docs/system/contracts/factory-contract.md](../../../packages/docs/template/.make-docs/system/contracts/factory-contract.md) | Readiness after a failed test, tool fact freshness, the workflow removal, the backup rule, the readiness code, and five rule rows. The dogfood copy is identical. |
| [packages/skills/factory/SKILL.md](../../../packages/skills/factory/SKILL.md) | The bound tool check and the `test-failed` state. The installed copy is identical. |

### Maintainer

| Path | Description |
| --- | --- |
| [packages/cli/src/store/README.md](../../../packages/cli/src/store/README.md) | The command that writes each factory table, and the new retention and backup rules. |

### User

None this session.
