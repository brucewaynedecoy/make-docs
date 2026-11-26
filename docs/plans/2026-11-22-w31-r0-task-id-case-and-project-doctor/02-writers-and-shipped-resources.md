---
title: "W31 R0 P2 Writers and Shipped Resources"
kind: "plan"
status: "draft"
coordinate: "W31 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-22-task-id-case-and-project-doctor.md"
---

# W31 R0 P2 Writers and Shipped Resources

## Purpose

Make every shipped file and every CLI text write `T`.

## Outcome

A new backlog that an agent writes from the shipped guidance uses `T1`, `T2`, and so on. No shipped template, contract, reference, or router shows a lower-case task ID.

## Scope

- Change upstream in `packages/docs/template/` first:
  - `.make-docs/system/templates/work-phase.md`;
  - `.make-docs/system/contracts/output-contract.md`;
  - `.make-docs/system/references/execution-workflow.md` and `wave-model.md`;
  - `docs/AGENTS.md`, `docs/CLAUDE.md`, `docs/AGENTS.codex-only.md`, `docs/CLAUDE.claude-only.md`, `docs/work/AGENTS.md`, and `docs/work/CLAUDE.md`.
- Change CLI text that names task IDs, such as the phase check warning in `packages/cli/src/operations/work/index.ts`.
- Search the shipped Skills and generated bundles for lower-case task IDs, and update any hit.
- Reseed each changed template-owned file into this repository's `.make-docs/` and `docs/` copy, and refresh the bundled template.
- Update `docs/assets/project/migrated-operations-inventory.md` if it names the task form.

## Exclusions

- No change to project-owned backlogs. P4 rewrites them with the doctor.
- No change to archives or history records.

## Acceptance

- A search of `packages/docs/template/` finds no lower-case task ID.
- Each changed template-owned file matches its dogfood copy byte for byte.
- The template validation suite passes.

## Dependencies

- P1.
