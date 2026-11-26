---
title: "Task ID Case and Project Doctor"
kind: "design"
status: "draft"
coordinate: "W31 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The change updates the current output contract, templates, routers, parsers, and coordinate rules, and it adds two operations to the active PRD set."
  coordinate_handoff: "Recommended W31 R0 as its own Wave, by the owner's choice on 2026-11-22. It must close before W29 R0 P3 starts. The planner applies the wave-model decision procedure and asks the owner if it finds that a lineage revision Wave applies."
---

# Task ID Case and Project Doctor

## Purpose

Make task IDs look like every other coordinate part. A task ID becomes `T3`, not `t3`, in every file and every result that Make Docs writes. Make Docs still reads a lower-case `t`, so old files and quick typing keep working.

This design also adds a project doctor: one command that any Make Docs project can run to find this problem and fix it after a review. The task ID case is the doctor's first check. Later Waves can add more checks.

## Context

Waves, revisions, phases, and stages use upper-case letters: `W29 R0 P1 S2`. Tasks use a lower-case `t`: `W29 R0 P1 t3`. The owner never meant this. The lower-case form spread from the first work templates into every backlog.

Facts on 2026-11-22:

- The shipped work phase template, the output contract, the execution workflow, the wave model, and six docs and work routers in `packages/docs/template/` tell agents to write `- [ ] t1: ...`.
- Two parsers read only a lower-case `t`. `packages/cli/src/operations/work/index.ts:108` does not count a line such as `- [ ] T1: ...` as a task at all, and its phase check expects `t1`, `t2`, and so on. `packages/cli/src/operations/work/backlog/snapshot.ts:32` reads `T1: ...` as a task with no ID.
- The backlog snapshot already reports task IDs in upper case (`snapshot.ts:434`), so the snapshot and the files disagree today.
- 233 active backlog files under `docs/work/` and 20 archived files use a lower-case `t`. Closeout notes and Change History entries also name tasks in prose, such as `P2 t11` or `t1–t10`.
- The W29 R0 work store contract now stores task coordinates with `T` (commit `1ac8f62d`). Its parser and writer in W29 R0 P3 must round-trip files byte for byte, so the read and write rules must be settled first.
- No doctor command exists. The CLI has seven top-level commands. Project checks and reviewed project writes live under `make-docs project`, such as `project layout preview` and `project layout apply`.
- [PRD 14](../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-20 says that existing plan and work records keep their coordinates and are not rewritten to conform. The owner chose to rewrite this repository's active backlogs once. That needs a narrow exception for the task ID letter case. Numbers never change.

Owner decisions on 2026-11-22: task IDs use `T`. Make Docs reads `t` and `T` the same and always writes `T`. Active backlogs under `docs/work/` are rewritten once. Archives and history records stay as written. A doctor check can audit and fix this in any Make Docs project. The change is its own Wave and lands before W29 R0 P3. See register [D-063](../prd/03-open-questions-and-risk-register.md).

## Human Experience Intent

Impact: `direct`

Affected humans: the `user` and `maintainer` Personas, human or agent, who read, write, search, or name backlog tasks, and who run the doctor in their own projects.

Human goal or effect: a person sees one consistent coordinate form everywhere and can fix older files with one reviewed command.

Experience promises:

- Every coordinate that Make Docs writes uses upper-case letters, so `W29 R0 P1 T3` looks the same in files, results, URIs, and commits.
- A person can still type `t3`, and an old file with `t3` still works. Nothing breaks on the day of the change.
- `make-docs project doctor check` names each problem in plain words, shows the exact change it would make, and changes nothing.
- `make-docs project doctor fix` changes only what the person reviewed, and it says what it changed and how to undo it.

Complexity kept out of the human path:

- The person does not need to know which files, parsers, or templates hold task IDs.
- The person does not hand-edit hundreds of task lines.
- The person does not need to know which records are frozen history. The doctor skips them on its own.

Evidence required:

- Parser tests with `t`, `T`, and mixed files that give the same facts.
- A doctor check and fix run on fixtures and on this repository, with the review digest and the before and after counts.
- A Human Experience Review of the doctor's check and fix wording.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| None | `none` | `not-needed` | None. The doctor reads a few hundred small Markdown files once per run. | None. | None. |

## Decision

### One task ID form

- The canonical task ID is `T` and a number without a leading zero: `T1`, `T12`. A full task coordinate is `W29 R0 P1 T3`.
- Every file and result that Make Docs writes uses `T`: the work phase template, the output contract, the execution workflow, the wave model, the docs and work routers, generated text, the backlog snapshot, the work store, and project URIs.
- Every reader accepts `t` and `T` as the same ID. That covers both parsers, the phase task check, dependency bullets, and coordinate input in commands and URIs. A file that mixes both cases is valid.
- The phase task check compares IDs without regard to case. A lower-case ID is not an error. It is a doctor finding.

### One-time rewrite, with a narrow exception

- This repository's active backlogs under `docs/work/` are rewritten once, through the doctor fix, not by hand.
- Archives under `.make-docs/archive/` and history records stay as written. They are frozen records, and the readers still accept them.
- [PRD 14](../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-20 gains one exception: the task ID letter case in active records may change through a reviewed doctor fix. Numbers, coordinates, and every other part of a record stay as written.

### Project doctor

- Two new registry operations:
  - `project.doctor.check` → `make-docs project doctor check`, MCP `project_doctor_check`. It reads only. It returns findings and a review digest.
  - `project.doctor.fix` → `make-docs project doctor fix --review <digest>`, MCP `project_doctor_fix`. It writes only the changes that the digest names, and it needs the existing project write permission.
- The doctor holds a list of checks. Each check has a stable ID, a scope, plain finding text, and an optional fix. W31 ships one check: `task-id-case`.
- `task-id-case` scans Markdown files under `docs/work/`. It skips `.make-docs/archive/`, history records, fenced code blocks, inline code, and link targets. It finds:
  - task checkbox lines such as `- [ ] t3: ...`;
  - task references in prose, such as `t3`, `P2 t11`, and `t1–t10`, as whole words.
- Each finding names the file, the line, the current text, and the replacement. The check reports the totals first, in plain words, then the detail.
- The fix binds the file bytes that the check read. A file that changed after the check is refused and named, and the person runs the check again. The fix uses the existing reviewed project write path, with its backup and conflict rules. It reports each changed file and the undo path: git, or the backup when the folder has no git.
- Both commands accept a repeatable `--exclude <path>` option, and the digest binds it. This repository's one-time rewrite excludes the W22 R2 backlog while W22 R2 is open. A second run fixes it after W22 R2 closes.
- Exit codes and results follow the existing operation contract. A clean project returns no findings and says so.
- The doctor has a deterministic form and an agentic twin. A new reference, `make-docs://system/reference/project-doctor.md`, explains each check for an agent that has no CLI, so the agent can find and fix the same lines by hand. A change to either form needs a review of the other.
- Store data checks are not part of the project doctor. Register D-062 owns a separate Store review and its maintenance job. A later design can decide whether that job shares the doctor's check list.

### Order with W29

W31 R0 closes before W29 R0 P3 starts. W29 R0 P3 then reads `t` and `T`, writes `T`, and round-trips the rewritten files byte for byte.

## Alternatives Considered

- **Keep `t`.** Rejected. It keeps the mixed form that the owner never wanted, and it keeps the snapshot and the files in disagreement.
- **Write `T` only in new files and rewrite nothing.** Rejected by the owner. Old and new files would differ for years.
- **Rewrite archives and history too.** Rejected. Those are frozen records, and the readers accept them as they are.
- **Hand-edit the backlogs once, with no doctor.** Rejected. It does not help any other Make Docs project, and it has no review or undo path.
- **Fold the change into W29 R0.** Rejected by the owner. W29 is already large, and this change touches shipped templates, routers, parsers, and every backlog.
- **A top-level `make-docs doctor` command.** Not chosen. The CLI keeps seven top-level commands, and project checks already live under `make-docs project`.

## Consequences

- Every new backlog uses `T`. Older projects keep working until they run the doctor.
- The shipped templates, contracts, references, and routers change. Each changed template-owned file is reseeded into this repository's dogfood copy.
- PRD 14 changes R-COORD-20 and gains the task ID form rule. PRD 39 and PRD 25 gain the two doctor operations and their MCP tools. PRD 51 states that snapshot task IDs use `T` and that the reader accepts both cases. PRD 06 tracks the template change.
- The one-time rewrite touches about 233 files in one commit. Review and history diffs for that commit are large, but the change is mechanical and the doctor's digest records it.
- The doctor sets a pattern for later checks. Each later check needs its own design decision and its own agent twin text.
- Risk: a prose reference such as `t2` can mean something other than a task. The whole-word rule, the code and link skips, and the reviewed digest limit this, and the check names each line before anything changes.
- W29 R0 P3 waits for W31 R0.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Work Store](2026-11-21-work-store.md), [Wave, Revision, and Backlog Amendment Rules](2026-11-18-wave-revision-and-backlog-amendment-rules.md)
- Reason: the work store contract already stores `T`, and its parser depends on this rule. The coordinate rules design owns R-COORD-20, which this design narrows for the task ID letter case.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: The change updates the current output contract, templates, routers, parsers, and coordinate rules, and it adds two operations to the active PRD set.
- Coordinate Handoff: Recommended W31 R0 as its own Wave, by the owner's choice on 2026-11-22. It must close before W29 R0 P3 starts. The planner applies the wave-model decision procedure and asks the owner if it finds that a lineage revision Wave applies.
