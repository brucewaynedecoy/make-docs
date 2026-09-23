---
title: "W22 R0 P8 Router Ownership and Reviewed Reinstall Repair"
kind: "plan"
status: "active"
coordinate: "W22 R0 P8"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
---

# W22 R0 P8 Router Ownership and Reviewed Reinstall Repair

## Purpose

Repair the remaining upgrade failure exposed by the North Atlantic BuildOS test. Make Docs must distinguish its managed router blocks from project-owned router content, ignore router files that the reviewed plan will not change, treat backup copies as inactive evidence, and use a completed reviewed removal as a safe handoff into plain setup.

## Trigger Evidence

The installed `2.0.1` CLI reached the reviewed project apply path in the Make Docs maintainer project. The same CLI then failed the North Atlantic BuildOS upgrade in two accepted states.

First, `make-docs setup` reviewed a `modified-v1` plan with explicit router conflict choices. Apply rejected that approved plan as `ambiguous-ownership`. No project or Store state changed.

Second, `make-docs setup remove --backup` completed a reviewed removal for the same verified checkout. It removed 67 manifest-owned files, preserved 12 project-owned paths, created 67 exact backup copies under `.make-docs/backup/2026-09-23/`, retained the project and checkout identities, left no pending operation or lock, and reported the installation as unregistered. A following plain `make-docs setup` classified the tree as `missing-manifest-recognizable` and demanded an explicit `backup-and-reinstall` flow that the public CLI does not provide.

The fallback scan treated 52 router files inside the Make Docs backup and 36 unrelated BuildOS router files as active ownership collisions. A safe reset would therefore require moving valid project control files. This is not an acceptable recovery path. The completed removal and verified backup already provide stronger evidence than a repository-wide router-name scan.

This evidence extends [D-038](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop). P7 remains open. P8 owns the new bounded repair and the proof needed before P7 can resume its live acceptance path.

## Authority Disposition

| Candidate | Decision | Reason |
| --- | --- | --- |
| Active compatibility discovery and router ownership | `update-existing` | PRD 18 owns classification, file ownership, managed blocks, backup-and-reinstall safety, and fail-closed mutation. |
| Completed removal and backup continuity | `update-existing` | PRD 38 owns the operation, backup index, checkout identity, and recovery evidence. |
| Plain setup after reviewed removal | `update-existing` | PRD 39 owns the public setup path, review, apply, repeat, and next action. |
| Closed recovery-loop finding | `update-existing` | D-038 already owns setup states that leave no public action capable of changing the failed condition. |
| New reset or force command | `none` | The required result fits plain setup after a completed reviewed removal. P8 adds no broad reset, detach, or force capability. |
| New PRD | `none` | Existing product authorities own every changed rule. |

## Outcome

Plain `make-docs setup` recognizes a completed reviewed removal for the same verified checkout. It uses the completed operation and verified backup index as evidence for a new reviewed install plan. It preserves the existing project and checkout identities.

Compatibility discovery excludes `.make-docs/backup/**` and other declared inactive backup or export roots from the active installation surface. Router discovery is limited to paths that the reviewed plan can change. Unrelated router files do not become ownership collisions because they share a filename.

A shared target router remains project-owned. Make Docs can insert, update, or remove only its exact managed block after the plan shows that action. It preserves all other bytes. Missing, malformed, nested, duplicated, or contradictory managed markers on a target path fail before operation creation with the affected path and one safe next action.

The normal result requires no manual Store edit, hidden command, repository-wide router quarantine, or loss of BuildOS project control files.

## Repair Contract

- Exclude `.make-docs/backup/**` and every declared inactive backup, export, or archive root from active compatibility discovery. Backup bytes remain evidence and restoration input. They are not an installed surface.
- Limit router ownership checks to exact router paths that the reviewed plan proposes to create, change, or remove. Preserve every other router path as unrelated project content.
- Treat shared target router files as project-owned containers. Detect and change only the exact Make Docs managed block. Preserve all content outside that block byte for byte.
- Show insertion of a missing managed block as an explicit file action. Do not infer whole-file ownership from the router filename, location, canonical content elsewhere, or the presence of unrelated Make Docs files.
- Fail closed on malformed or contradictory Make Docs markers at a target path before operation creation. Report the path, evidence, preserved state, and one action that can change the condition.
- Treat a completed `setup remove --backup` operation for the same verified checkout as the first completed part of a reviewed reinstall. Use its immutable operation result, removed-path ledger, preserved-path ledger, backup index, digests, and checkout binding as evidence.
- Keep the existing project identifier and checkout identifier. Create a new installation operation only after the new plan passes classification, ownership, path, backup, approval, and stale-state checks.
- Preserve the prior backup until the new installation and its ownership records verify. A successful reinstall does not silently delete recovery evidence.
- Keep plain `make-docs setup` as the public continuation. Do not require a command that the CLI does not expose. Do not require a person to delete Store rows, edit SQLite, move unrelated routers, or understand the internal ownership model.
- Preserve the existing fail-closed rule for unknown non-router files, unsafe paths, symlink escape, changed backup evidence, changed target files, conflicting checkout identity, or active operations.
- Keep deterministic CLI and MCP behavior aligned where the operation registry exposes the same underlying state. Keep agent guidance aligned with the public plain-setup path without asking an agent to edit router files directly.

## Scope Limits

- Do not add a broad force, reset, detach, quarantine, or repository-cleaning command.
- Do not claim ownership of an entire shared router file.
- Do not scan or classify unrelated router files only because their names are `AGENTS.md` or `CLAUDE.md`.
- Do not weaken missing-manifest safety for files that the plan will change and cannot classify.
- Do not remove or rewrite the North Atlantic BuildOS backup during source implementation or isolated tests.
- Do not apply the repaired candidate to the live North Atlantic BuildOS project until source, package, and isolated installed gates pass and the owner authorizes that live action.
- Do not close P7, P8, D-038, or W22 from this authority update.

## Verification And Approval Gate

Automated Implementation Testing is required. The isolated regression must reproduce the exact completed-removal state, verified backup, preserved shared routers, 52 backup router files, and 36 unrelated active BuildOS router files. It must prove that only planned target routers enter ownership review.

The tests must prove managed-block insertion, update, removal, missing block, malformed marker, changed target, changed backup, repeat setup, interruption, rollback, and no-op behavior. They must prove that a blocked plan creates no pending operation and changes no Store, project, backup, router, or native file.

One exact package candidate must pass the installed contract on Windows, macOS, and Linux. The source checkout must be unavailable to product execution. The final comparison must reject a missing host, candidate mismatch, source execution, extract-only proof, different router behavior, or a public path that needs an internal command.

After those gates pass, a separately approved live run must continue from the current North Atlantic BuildOS removed state. It must preserve all BuildOS-owned router content and backup evidence, install the reviewed Make Docs blocks and files, retain the project and checkout identities, finish with no pending operation, and make immediate repeat setup a no-op or a truthful current-state review.

Human Experience Review must inspect the actual preview, approval, success, blocked, and repeat surfaces. The result must make the subject, ownership boundary, preserved content, effect, and next action clear without requiring the person to learn Store internals.

The owner approved Stage 1 implementation on 2026-09-23. Stage 1 source and isolated proof are complete. The owner later approved staging, commit, push, pull-request review, and Stage 2 tasks t8 through t10. Local installation, live North Atlantic BuildOS setup, and closeout retain their separate gates.
