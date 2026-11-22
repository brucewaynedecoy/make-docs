---
title: "W31 R0 Task ID Case and Project Doctor Plan"
kind: "plan"
status: "draft"
coordinate: "W31 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The plan should become the product contract before the work backlog is written."
  coordinate_handoff: "Carry W31 R0 into the requirement-history entries and docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/."
source:
  type: "design"
  path: "docs/designs/2026-11-22-task-id-case-and-project-doctor.md"
---

# W31 R0 Task ID Case and Project Doctor Plan

## Purpose

Plan the [task ID case and project doctor design](../../designs/2026-11-22-task-id-case-and-project-doctor.md). Task IDs become `T3` in everything that Make Docs writes. Every reader still accepts `t3`. A new project doctor finds lower-case task IDs in any Make Docs project and fixes them after a review. W29 R0 P3 depends on this Wave.

This plan, its PRD changes, and its work backlog are review material. They do not authorize CLI, MCP, template, Store, installation, commit, push, or release changes. Implementation needs separate owner authority. The Wave must not touch W22 R2 files, branches, or worktrees.

## Objective

Completion requires:

- both backlog parsers and the phase task check accept `t` and `T` as the same task ID, with tests on lower-case, upper-case, and mixed files;
- coordinate input in commands and project URIs accepts both cases and returns the canonical `T` form;
- the shipped work phase template, output contract, execution workflow, wave model, docs and work routers, and CLI text write `T`, changed upstream in `packages/docs/template/` and then reseeded into this repository;
- `make-docs project doctor check` and `make-docs project doctor fix --review <digest>` as registry operations with CLI and MCP parity, a path exclusion option, and the `task-id-case` check;
- one upstream system resource, `make-docs://system/reference/project-doctor.md`, that gives agents the same check without the CLI;
- a one-time doctor rewrite of this repository's active backlogs under `docs/work/`, with the W22 R2 backlog excluded, and archives and history records unchanged;
- a Human Experience Review of the doctor's check and fix wording.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Every coordinate that Make Docs writes uses upper-case letters, so `W29 R0 P1 T3` looks the same in files, results, URIs, and commits. | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md), [PRD 06](../../prd/06-template-contracts-and-generated-assets.md), [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Work templates, routers, CLI text, snapshot results | [P2](02-writers-and-shipped-resources.md), [P4](04-one-time-rewrite-and-acceptance.md) | Template and dogfood parity, a search for lower-case task IDs in shipped files, snapshot tests | None |
| A person can still type `t3`, and an old file with `t3` still works. | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md), [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Backlog files, command and URI input | [P1](01-readers-accept-both-cases.md) | Parser tests on lower-case, upper-case, and mixed files with the same facts | None |
| `make-docs project doctor check` names each problem in plain words, shows the exact change, and changes nothing. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | `project doctor check` CLI and `project_doctor_check` MCP output | [P3](03-project-doctor.md) | No-write test, CLI and MCP parity, Guided Progress Review | None |
| `make-docs project doctor fix` changes only what the person reviewed, and says what it changed and how to undo it. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | `project doctor fix` CLI and `project_doctor_fix` MCP output, changed files | [P3](03-project-doctor.md), [P4](04-one-time-rewrite-and-acceptance.md) | Digest-bound fix tests, a stale-file refusal test, the recorded one-time rewrite, Guided Progress Review | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| None | `none` | `not-needed` | None | None | None | None |

The doctor reads a few hundred small Markdown files once per run. No speed decision depends on it.

## Coordinate Decision

- Coordinate: `W31 R0`
- Classification: `new-wave`
- Evidence: Explicit owner guidance on 2026-11-22: the task ID case change is its own Wave and lands before W29 R0 P3. The outcome test agrees: no earlier Wave promised a project doctor or upper-case task IDs. The lower-case form came from early work templates, not from a promised outcome of a current lineage Wave. The highest Wave in `docs/plans/`, `docs/work/`, and their archives is W30.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Task ID case and project doctor design | Markdown | [2026-11-22-task-id-case-and-project-doctor.md](../../designs/2026-11-22-task-id-case-and-project-doctor.md) | High. Owner-confirmed decisions. |
| Register entry | Markdown | [D-063](../../prd/03-open-questions-and-risk-register.md) | High. |
| Backlog parsers | TypeScript | `packages/cli/src/operations/work/index.ts`, `packages/cli/src/operations/work/backlog/snapshot.ts` | High. Read at `ed4343a2`. |
| Shipped work template, contracts, references, and routers | Markdown | `packages/docs/template/` | High. Ten files name `t1`. |
| Work store contract | TypeScript | `packages/cli/src/operations/work/work-store/` | High. Already stores `T` at `1ac8f62d`. |
| Twins guide | Markdown | [developing-deterministic-agentic-twins.md](../../assets/project/developing-deterministic-agentic-twins.md) | High. |

Owner decision on 2026-11-22: the doctor has a path exclusion option. This repository's one-time rewrite excludes `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`. A second run fixes that backlog after W22 R2 closes.

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Canonical task ID form, case-insensitive reading, and the case-only exception to R-COORD-20 | `update-existing` | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | PRD 14 owns coordinates and the rule that existing records are not rewritten to conform. |
| `project.doctor.check` and `project.doctor.fix` command paths, the check list, the path exclusion, and the reviewed fix | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns admitted CLI paths and project command behavior. |
| Doctor operation boundaries and MCP profile membership (`quality`, `setup`, `all`) | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns operation boundaries and MCP profiles. |
| Snapshot task IDs use `T`, and the snapshot reader accepts both cases | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 owns the snapshot contract. |
| Work phase template task form and the new `project-doctor` reference resource | `update-existing` | [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) | PRD 06 owns templates and stable resource identity. |
| Glossary term: project doctor | `update-existing` | [PRD 04](../../prd/04-glossary.md) | Shared term. |
| Task ID case decision and the later W22 R2 run | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) D-063 | The register holds the decision and its open follow-up. |
| W29 R0 P3 dependency | `link-only` | [PRD 52](../../prd/52-work-store-and-work-queue.md) | PRD 52 already names upper-case task coordinates. The W29 backlog holds the dependency. |
| Store data checks and maintenance | `none` | None | Register D-062 owns the Store review. This Wave checks project files only. |
| New product PRD | `none` | None | The doctor is a project command that fits PRD 39 and PRD 25. |

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 14 | 2026-11-22 / W31 R0 | R-COORD-20 and the task ID form | Existing records were never rewritten to conform. Task IDs used `t`. | Task IDs use `T`, and readers accept both cases. A reviewed doctor fix may change only the task ID letter case in active records. | The owner wants one coordinate form. | [Design](../../designs/2026-11-22-task-id-case-and-project-doctor.md) |
| PRD 39 | 2026-11-22 / W31 R0 | Project commands | No doctor command. | `project doctor check` and `project doctor fix`. | One reviewed way to find and fix project problems. | [Design](../../designs/2026-11-22-task-id-case-and-project-doctor.md) |
| PRD 25 | 2026-11-22 / W31 R0 | MCP profiles | No doctor tools. | `project_doctor_check` and `project_doctor_fix` in `quality`, `setup`, and `all`. | Agents need the same doctor. | [Design](../../designs/2026-11-22-task-id-case-and-project-doctor.md) |
| PRD 51 | 2026-11-22 / W31 R0 | Snapshot task facts | The reader matched only `t`. | The reader matches `t` and `T`. Task IDs use `T`. | Old and new files give the same facts. | [Design](../../designs/2026-11-22-task-id-case-and-project-doctor.md) |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-readers-accept-both-cases.md](01-readers-accept-both-cases.md) | Make every reader accept `t` and `T` as the same task ID. |
| [02-writers-and-shipped-resources.md](02-writers-and-shipped-resources.md) | Make every shipped file and CLI text write `T`, upstream first, then reseed. |
| [03-project-doctor.md](03-project-doctor.md) | Build the doctor commands, the `task-id-case` check, and its agent twin. |
| [04-one-time-rewrite-and-acceptance.md](04-one-time-rewrite-and-acceptance.md) | Rewrite this repository's active backlogs with the doctor and prove the Wave. |

## Dependencies

- W22 R2 files, branches, and worktrees stay untouched.
- P1 comes first. Writers change only after every reader accepts both cases.
- P2 depends on P1.
- P3 depends on P1. It can run beside P2.
- P4 depends on P2 and P3.
- W29 R0 P3 depends on P4.

## Output Contract

- Design: `docs/designs/2026-11-22-task-id-case-and-project-doctor.md`.
- Plan: this directory with `00-overview.md` and four phase files.
- New product authority: none.
- Updated owners: PRDs 03, 04, 06, 14, 25, 39, and 51.
- Work backlog: `docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/` with `00-index.md` and four phase files.
- W29 R0 backlog: its P3 dependency already names this Wave through D-063. Update the link when the W31 backlog exists.
- No implementation source, shipped asset, Store, installation, staging, commit, push, or release change is part of this plan-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Reader owner | Case-insensitive parsers, phase check, coordinate input | `packages/cli/src/operations/work/` readers and focused tests | Accepted PRD changes | P1 readers |
| Resource owner | Template, contract, reference, router, and CLI text changes; reseed | `packages/docs/template/`, then `.make-docs/` and `docs/` routers; CLI text | P1 | P2 shipped files |
| Doctor owner | Registry admission, check list, `task-id-case`, reviewed fix, MCP tools, agent twin reference | `packages/cli/src/operations/project/` doctor paths, registry, `packages/docs/template/` reference, tests | P1 | P3 doctor |
| Validation owner | One-time rewrite, parity, Human Experience Review, evidence | Doctor fix output under `docs/work/`, evidence file, bounded fixes returned to owners | P2, P3 | P4 evidence |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code during implementation. Reindex before falling back to direct reads. The doctor uses the existing operation registry, so CLI and MCP are projections of one core. Agents prefer the MCP tool, then the CLI, then the `project-doctor` reference when neither is present.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove both parsers give the same facts for lower-case, upper-case, and mixed task IDs.
- Prove that no shipped template, contract, reference, or router writes a lower-case task ID, and that template and dogfood bytes match.
- Prove `project doctor check` writes nothing, and its CLI and MCP results match.
- Prove `project doctor fix` writes only the reviewed changes, refuses a file that changed after the check, honors the path exclusion, and skips archives, history records, code, and link targets.
- Prove the agent twin and the CLI find the same lines on shared fixtures.
- Record the one-time rewrite: the digest, the excluded path, and the before and after counts.
- Run the full test suite and record known failures.
- Complete a Human Experience Review for each promise above.

Automated Implementation Testing is required for every implementation phase. Guided Progress Review is selected for the doctor's check and fix wording, because owner feedback can change it before P4 closes. Performance Testing and Unassisted Goal Testing are `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `prd-generation`
- Next step: Update PRDs 03, 04, 06, 14, 25, 39, and 51 from this plan.
- Why: The plan should become the product contract before the work backlog is written.
- Coordinate Handoff: Carry W31 R0 into the requirement-history entries and docs/work/2026-11-22-w31-r0-task-id-case-and-project-doctor/.
