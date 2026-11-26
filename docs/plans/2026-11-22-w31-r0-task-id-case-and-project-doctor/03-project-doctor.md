---
title: "W31 R0 P3 Project Doctor"
kind: "plan"
status: "draft"
coordinate: "W31 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-11-22-task-id-case-and-project-doctor.md"
---

# W31 R0 P3 Project Doctor

## Purpose

Give every Make Docs project one reviewed way to find and fix project problems, starting with lower-case task IDs.

## Outcome

`make-docs project doctor check` and `make-docs project doctor fix --review <digest>` exist with CLI and MCP parity. The `task-id-case` check finds and fixes lower-case task IDs. An agent without the CLI can follow the same check from a shipped reference.

## Scope

- Admit `project.doctor.check` and `project.doctor.fix` in the operation registry, with CLI paths under `make-docs project doctor` and MCP tools `project_doctor_check` and `project_doctor_fix` in the `quality`, `setup`, and `all` profiles.
- `check` reads only. It returns the totals first in plain words, then each finding: file, line, current text, and replacement. It returns a review digest that binds the findings and the bytes of each file it read.
- `fix` needs the existing project write permission. It applies only the changes that the digest names. It refuses and names any file that changed after the check. It uses the existing reviewed project write path, with its backup and conflict rules. It reports each changed file and the undo path: git, or the backup when the folder has no git.
- Both commands accept a repeatable `--exclude <path>` option. The digest binds the exclusions.
- Hold the checks in one list. Each check has a stable ID, a scope, plain finding text, and an optional fix.
- Build the `task-id-case` check. It scans Markdown files under `docs/work/`. It skips `.make-docs/archive/`, history records, fenced code blocks, inline code, and link targets. It finds task checkbox lines and whole-word task references in prose, such as `t3`, `P2 t11`, and `t1–t10`.
- Author `make-docs://system/reference/project-doctor.md` upstream in `packages/docs/template/`, add it to the system resource catalog, and reseed it. It explains each check for an agent without the CLI. It states that it is the agent twin of the doctor operations, and that a change to either form needs a review of the other.
- Add shared fixtures that the CLI and the agent twin must answer the same way.

## Exclusions

- No Store data checks. Register D-062 owns the Store review.
- No other doctor checks in this Wave.

## Acceptance

- `check` writes nothing, and its CLI and MCP results match.
- `fix` writes only the reviewed changes, refuses a stale file, and honors `--exclude`.
- The check skips archives, history records, code, and link targets on fixtures.
- A clean project returns no findings and says so in plain words.
- The resource catalog, the template, and the dogfood copy agree.

## Dependencies

- P1. It can run beside P2.
