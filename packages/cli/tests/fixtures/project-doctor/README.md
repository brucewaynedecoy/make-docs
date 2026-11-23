# Project Doctor Fixtures

Shared fixtures for `project.doctor.check` and `project.doctor.fix` (PRD 39 R-DOCTOR-7).

- `project/` is the input project. `expected/` holds each file as the fix must leave it. Files that are not in `expected/` must not change.
- The single-line pairs in `make-docs://system/reference/project-doctor.md` under `## Shared Examples` are the agent twin's copy of the same cases. `tests/w31-r0-p3-project-doctor.test.ts` checks both.
- A change to these fixtures, the check code, or the reference needs a review of the other two.
