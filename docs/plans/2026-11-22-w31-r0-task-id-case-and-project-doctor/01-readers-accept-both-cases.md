---
title: "W31 R0 P1 Readers Accept Both Cases"
kind: "plan"
status: "draft"
coordinate: "W31 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-22-task-id-case-and-project-doctor.md"
---

# W31 R0 P1 Readers Accept Both Cases

## Purpose

Make every reader accept `t` and `T` as the same task ID before any writer changes.

## Outcome

Old files, new files, and mixed files give the same facts. Coordinate input in commands and project URIs accepts both cases and returns the canonical `T` form.

## Scope

- Make the task line pattern in `packages/cli/src/operations/work/index.ts` accept `t` and `T`.
- Make the phase task check compare IDs without regard to case. A lower-case ID is not a warning there. It is a doctor finding in P3.
- Make the task pattern in `packages/cli/src/operations/work/backlog/snapshot.ts` accept `T`, so `- [ ] T1: ...` is a task with ID `T1`, not a task with no ID. Keep the upper-case snapshot output.
- Accept both cases in task coordinate input, such as `run work` unit arguments and `make-docs://project/<project>/backlog/.../T3`. The W29 R0 P1 URI grammar already does this. Keep it aligned.
- Add fixtures with lower-case, upper-case, and mixed task IDs, and prove the same facts for each.

## Exclusions

- No change to what any template or CLI text writes. P2 owns that.
- No file rewrite. P4 owns that.

## Acceptance

- Both parsers report the same tasks and IDs for the three fixture kinds.
- A file that uses only `T` passes the phase task check.
- Existing tests pass without change to their lower-case inputs.

## Dependencies

- Accepted PRD 14 and PRD 51 changes.
