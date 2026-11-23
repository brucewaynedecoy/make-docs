---
title: "W31 R0 P3 Project Doctor Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W31 R0 P3"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W31 R0 P3 Project Doctor Closeout

## Changes

Adds the project doctor. `make-docs project doctor check` (MCP `project_doctor_check`) reads Markdown under `docs/work/` and reports lower-case task IDs: totals first, then each line with its current and fixed text, then skipped files and text, then a review digest that binds the findings, the exclusions, the skips, and the bytes of each file read. It writes nothing. `make-docs project doctor fix --review <digest>` (MCP `project_doctor_fix`) recomputes the check, refuses if the digest no longer matches, and writes only the reviewed `t` to `T` changes through the reviewed installation write path, with a backup of each file. Its undo path is a `git -C '<project folder>' restore` command for the files git tracks, with single-quoted words so it works from any folder, and names the backup for the rest. Both accept repeated `--exclude <path>`; unsafe or wrong-case paths fail closed. The optional `--check-json` (MCP `reviewedFiles`) lets a stale-review refusal name each changed file. The check skips archives, history records, managed router files, hard-linked files, fenced code, inline code, link targets, URLs, and HTML tags, and it stops at a linked `docs`, `docs/work`, or folder under `docs/work/`. Router names match in any letter case, HTML tags may span lines, and exclude names compare in Unicode NFC form. The new reference `make-docs://system/reference/project-doctor.md` is the agent twin, with shared examples that the tests check.

An independent review found eight problems, including a wrong-case exclusion that excluded nothing, a linked `docs` folder that let the check read outside the project, and a hard link that let the fix write outside it. All eight are fixed with regression tests. A re-check confirmed them and found two medium items (an undo command tied to the current folder, and a nested linked folder skipped without a word) and five low items; all are fixed or named as known risks, with tests. The owner kept `--check-json` and Store write access for the fix, chose to skip managed routers, and chose to keep the link guards in the doctor only for now.

Validation passed: 46 doctor tests, 53 default validation tests, and the type check. The full suite, with P2 and P3 together, has only the 3 known failures. A read-only check of this repository found 3,288 lower-case task IDs in 268 files and skipped the 2 managed routers, with no false hit found in review. Performance Testing and Unassisted Goal Testing are `not-needed-now`. The Guided Progress Review of the check and fix wording happens with the owner in P4. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/03-project-doctor.md) | Closes t1–t8 and A7–A12, with the review fixes and owner decisions. |
| [Evidence report](../../../docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/evidence.md) | Records the P3 checks, results, and limits. |

### Maintainer

| Path | Description |
| --- | --- |
| [Project doctor reference](../../../packages/docs/template/.make-docs/system/references/project-doctor.md) | Agent twin of the doctor operations, reseeded to `.make-docs/system/references/`. |

### User

None this session.
