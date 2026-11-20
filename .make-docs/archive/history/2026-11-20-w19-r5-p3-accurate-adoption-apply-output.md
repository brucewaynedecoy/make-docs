---
title: "W19 R5 P3 Accurate Adoption Apply Output"
kind: "history"
status: "completed"
date: "2026-11-20"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W19 R5 P3"
repo: "make-docs"
branch: "fix/2-0-9-adoption-output-and-windows-eperm"
---

# W19 R5 P3 Accurate Adoption Apply Output

## Changes

The `setup skills` adoption output now matches what the command does. A dry run keeps its summary and its `--review <digest>` next action. An apply with the matching digest says that it is applying the reviewed adoption, then prints a result line after the apply. A different digest, `--yes` without a digest, and an interactive confirmation say that nothing was applied and name the step that applies the review. The apply JSON has a top-level `nextAction` for the result, and its nested `review` no longer carries the review's own next action. This closes D-058.

Validation: the new output assertions fail without the change and pass with it. `npm test` passed apart from the 2 known Node 26 stdio failures. `validate:defaults`, the build, `smoke:pack:local`, and a built-CLI adoption in a throwaway project passed. This Mac's Store was not changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/03-accurate-adoption-apply-output.md) | Adds and closes the revision Phase of P1. |
| [W19 R5 index](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-index.md) | Records the revision Phase in Change History. |
| [Evidence report](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/evidence.md) | Records the regression proof, the real adoption, and the checks. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Records and closes D-058. |

### Maintainer

None this session.

### User

| Path | Description |
| --- | --- |
| [Installing and managing Skills](../../../docs/assets/user/skills-installing-and-managing-skills.md) | Describes the adoption apply output. |
