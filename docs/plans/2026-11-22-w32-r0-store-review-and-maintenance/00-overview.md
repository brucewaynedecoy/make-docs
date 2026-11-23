---
title: "W32 R0 Store Review and Maintenance Plan"
kind: "plan"
status: "draft"
coordinate: "W32 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The plan should become the product contract before the work backlog is written."
  coordinate_handoff: "Carry W32 R0 into the requirement-history entries and docs/work/2026-11-22-w32-r0-store-review-and-maintenance/."
source:
  type: "design"
  path: "docs/designs/2026-11-22-store-review-and-maintenance.md"
---

# W32 R0 Store Review and Maintenance Plan

## Purpose

Plan the [Store review and maintenance design](../../designs/2026-11-22-store-review-and-maintenance.md). Every Store table gets one purpose, known writers and readers, a record class, and a retention rule. One project register lists every project. Only Make Docs can write the Store: a write guard makes other programs' writes fail. `make-docs setup store check` and `make-docs setup store clean` find and remove rows that a fixed rule proves safe to remove, after a backup. Only Make Docs code paths can write the Store: the CLI and the MCP server today, and a Make Docs server API later. The Wave closes register D-062 and must close before W29 R0 P2.

This plan, its PRD changes, and its work backlog are review material. They do not authorize CLI, MCP, Store, template, installation, commit, push, or release changes. Implementation needs separate owner authority. The Wave must not touch W22 R2 files, branches, or worktrees.

## Objective

Completion requires:

- one table and record-kind catalog in code that names each table's purpose, writers, readers, record class, maintenance class (keep, bounded, or disposable), and retention, with a test that fails when the catalog, the schema, and the PRD 38 R-MIN rows drift;
- one append-only migration to schema v7 that adds `project_register`, adds a `failed` status and the R-LIFE-6 failure fields to `installation_operations`, and widens the `store_migration_receipts` CHECK;
- a Store write guard: triggers on every table that call `make_docs_write_guard()`, a function that only Make Docs connections register, an open-time trigger check that marks a changed Store `store-unsafe`, and file mode `0600` for the Store and its backups;
- fixes for the checkpoint-9 receipt insert, the `root_path` rewrite on every commit, the unbounded `work_evidence` payload, and `pruneProjectFromStore`;
- a test for each row event that names the rows it creates, updates, or removes;
- `make-docs project list` with CLI and MCP parity;
- `make-docs setup store check` and `make-docs setup store clean` with CLI and MCP parity, a Store backup with three kept copies, one transaction, a vacuum, and a report with the restore path;
- a fixed rule, with a test, for each disposable row class, including dead locks, abandoned tool operations, and saved bytes and snapshots of terminal operations;
- write-guard triggers on every table that only Make Docs connections can pass, a check on open that reports a removed or changed guard, and file mode `0600` for the Store and its backups;
- a Store README and code comments that describe only what exists;
- a check and clean run on a copy of the maintainer machine's Store, with the space before and after.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| `make-docs project list` shows every project that the Store knows, with its name, ID, checkouts, and any missing checkout folder. | [PRD 38](../../prd/38-global-store-and-project-state.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | `project list` CLI and `project_register_list` MCP output | [P3](03-project-register-and-row-events.md) | Fixture Stores, CLI and MCP parity, Guided Progress Review | None |
| `make-docs setup store check` explains what is safe to remove, what needs a decision, and how much space a clean frees, and changes nothing. | PRD 38, PRD 39 | `setup store check` CLI and `setup_store_check` MCP output | [P4](04-maintenance-commands.md) | No-write test, parity, Guided Progress Review | None |
| `make-docs setup store clean` removes only rows that a fixed rule proves safe, after a backup, and reports what it removed and how to restore. | PRD 38, PRD 39 | `setup store clean` output, the backup file | [P4](04-maintenance-commands.md), [P5](05-real-store-proof-and-acceptance.md) | Rule tests, backup and restore test, a run on a copy of a real Store | None |
| A program that is not Make Docs cannot change the Store by accident, and Make Docs reports a removed guard. | PRD 38 | Direct `sqlite3` or other program writes; Store open | [P2](02-schema-v7-and-defect-fixes.md) | Direct-write refusal test, removed-trigger detection test, a test that every table has its triggers | None |
| A program that is not Make Docs cannot change the Store by accident. Its write fails with a clear error, and its reads still work. If someone removes the guard, Make Docs says so and names the next step. | PRD 38 | Direct `sqlite3` or other program writes; Store open status | [P2](02-schema-v7-and-defect-fixes.md), [P5](05-real-store-proof-and-acceptance.md) | Guard tests on every Store open path, a direct-write refusal test, a removed-trigger detection test | None |
| A crash never leaves a lock or a pending row that blocks the machine forever. | PRD 38 | Tool update, uninstall, and Store removal | [P2](02-schema-v7-and-defect-fixes.md), [P4](04-maintenance-commands.md) | Crash-leftover fixtures for each blocking row | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| `setup store clean` with a vacuum on a Store with large saved bytes | `create` | `characterize-now` | `characterization-baseline` | `PERF-005`, owned by [P5](05-real-store-proof-and-acceptance.md) | P5 work phase owns the budget and stop rule. | P5, on a copy of a real Store. |

The characterization is informational. It decides whether the vacuum stays inside `clean` or becomes a separate step. It creates no product speed promise.

## Coordinate Decision

- Coordinate: `W32 R0`
- Classification: `new-wave`
- Evidence: Explicit owner guidance on 2026-11-22: the whole Store review is its own Wave and closes before W29 R0 P2. The outcome test agrees: no earlier Wave promised a project register, Store maintenance commands, or retention rules for these tables. The highest Wave in `docs/plans/`, `docs/work/`, and their archives is W31.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Store review and maintenance design | Markdown | [2026-11-22-store-review-and-maintenance.md](../../designs/2026-11-22-store-review-and-maintenance.md) | High. Owner-confirmed scope. |
| Register entry | Markdown | [D-062](../../prd/03-open-questions-and-risk-register.md) | High. |
| Store code inventory | Agent report, 2026-11-22 | `packages/cli/src/store/`, read at `9a8a4d46` | High. Spot-checked: the receipt CHECK and the dead prune caller. |
| Maintainer machine Store | Read-only query, 2026-11-22 | `~/.make-docs/store.db`, schema v6 | High. Row counts and sizes. |
| Twins guide | Markdown | [developing-deterministic-agentic-twins.md](../../assets/project/developing-deterministic-agentic-twins.md) | High. No agent twin applies: a project without the CLI has no Store, and agents never write the Store directly. |

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Table and record-kind catalog, maintenance classes, retention rules, fixed removal rules, and R-MIN rows that match code | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md) | PRD 38 owns every Store field, class, and retention rule. |
| `project_register`, schema v7, failure fields, receipt CHECK, path-update rule, `work_evidence` size limit, and the prune rules | `update-existing` | PRD 38 | Same owner. |
| Store write guard: triggers on every table, the guard function on Make Docs connections only, the open-time trigger check, `store-unsafe` with reason, and file mode `0600` | `update-existing` | PRD 38 | PRD 38 owns Store access and safety. Every later migration, including W29 and W30, must install the triggers. |
| Only Make Docs code paths write the Store: write-guard triggers, guard check on open, file mode `0600`, and the stated limit | `update-existing` | PRD 38 | PRD 38 owns Store access and safety. Today the rule exists only in shipped instructions. |
| R-MIN-3 ledger form, R-MIN-4 reviewed scope for fixed rules, R-LIFE-6 failure fields, and the R-DB-7 version for work tables (v8) | `update-existing` | PRD 38 | Same owner. These rules change meaning. |
| `project list`, `setup store check`, and `setup store clean` command paths and behavior | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns admitted CLI paths. |
| MCP tools and profiles: `project_register_list` in `core` and `all`; `setup_store_check` and `setup_store_clean` in `setup` and `all` | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns MCP profiles. |
| W29 work tables at schema v8, and project URI resolution through `project_register` | `update-existing` | [PRD 52](../../prd/52-work-store-and-work-queue.md) | PRD 52 names the work store tables and URI resolution. |
| Glossary terms: project register, Store maintenance | `update-existing` | [PRD 04](../../prd/04-glossary.md) | Shared terms. |
| D-062 status and plan | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) | The register holds the gap and its close condition. |
| Automatic cleanup after update | `none` | None | Not chosen in the design. A later design can add it. |
| A new product PRD | `none` | None | The Store owner is PRD 38. |

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 38 | 2026-11-22 / W32 R0 | R-MIN rows, R-MIN-3, R-MIN-4, R-LIFE-6, R-DB-7, and new maintenance rules | Rows without retention; no project register; a separate target ledger that was never built; work tables at v7. | Every table has a class and retention; `project_register`; fixed removal rules reviewed in the PRD; the ledger is the current ownership record; failure fields; write-guard triggers so only Make Docs writes; work tables at v8. | The Store must be easy to trust before W29 and W30 add tables. | [Design](../../designs/2026-11-22-store-review-and-maintenance.md) |
| PRD 38 | 2026-11-22 / W32 R0 | Store write access | Only shipped instructions forbade direct Store writes. | A trigger guard makes writes from other programs fail, and Make Docs detects a removed guard at open. | Make Docs must be the only writer of the Store. | Same |
| PRD 39 | 2026-11-22 / W32 R0 | Project and setup commands | No project list or Store maintenance command. | `project list`, `setup store check`, and `setup store clean`. | A person can see and maintain the Store. | Same |
| PRD 25 | 2026-11-22 / W32 R0 | MCP profiles | No tools for these operations. | Three tools in `core`, `setup`, and `all`. | Agents need the same commands. | Same |
| PRD 52 | 2026-11-22 / W32 R0 | Work store schema version and URI resolution | Work tables at v7; project names resolved from an unnamed register. | Work tables at v8; names resolve through `project_register`. | W32 takes v7. | Same |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-table-catalog-and-fixed-rules.md](01-table-catalog-and-fixed-rules.md) | Settle the table and record-kind catalog, the maintenance classes, the fixed rules, and the fixtures. |
| [02-schema-v7-and-defect-fixes.md](02-schema-v7-and-defect-fixes.md) | Add schema v7 with the Store write guard, and fix the known Store defects. |
| [03-project-register-and-row-events.md](03-project-register-and-row-events.md) | Fill the project register from every row event, prove each event, and add `project list`. |
| [04-maintenance-commands.md](04-maintenance-commands.md) | Build `setup store check` and `setup store clean`. |
| [05-real-store-proof-and-acceptance.md](05-real-store-proof-and-acceptance.md) | Fix documentation drift, run on a copy of a real Store, and prove the Wave. |

## Dependencies

- W22 R2 files, branches, and worktrees stay untouched.
- P1 is the contract gate. No code starts before P1 is accepted.
- P2 depends on P1.
- P3 depends on P2.
- P4 depends on P1 and P2. It can run beside P3.
- P5 depends on P3 and P4.
- W29 R0 P2 depends on P5.
- W31 R0 runs beside this Wave. The two Waves share no files.

## Output Contract

- Design: `docs/designs/2026-11-22-store-review-and-maintenance.md`.
- Plan: this directory with `00-overview.md` and five phase files.
- New product authority: none.
- Updated owners: PRDs 03, 04, 25, 38, 39, and 52.
- Work backlog: `docs/work/2026-11-22-w32-r0-store-review-and-maintenance/` with `00-index.md` and five phase files.
- W29 R0 plan and backlog: change the work table migration from v7 to v8, and point P2 and P4 at `project_register`, with Change History entries.
- No implementation source, Store, installation, staging, commit, push, or release change is part of this plan-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Contract owner | Table and record-kind catalog, maintenance classes, fixed rules, fixtures | New Store catalog module and fixture paths | Accepted PRD changes | P1 contract |
| Schema owner | v7 migration, write guard, and defect fixes | `packages/cli/src/store/database.ts`, `installation-state.ts`, the shared connection code, related tests | P1 | P2 schema |
| Register owner | Project register writes, row-event tests, prune rewrite, `project list` | `packages/cli/src/store/` register and lifecycle paths, project operations, tests | P2 | P3 register |
| Maintenance owner | `setup store check` and `clean`, backup, vacuum, fixed rules | New maintenance module, setup operations, tests | P1, P2 | P4 commands |
| Validation owner | Drift fixes, real-Store copy run, `PERF-005`, Human Experience Review | Store README, comments, evidence file, bounded fixes returned to owners | P3, P4 | P5 evidence |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code during implementation. Reindex before falling back to direct reads. The new commands use the existing operation registry, so CLI and MCP are projections of one core. No agent twin applies: a project without the CLI has no Store, and agents never write the Store directly.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove the catalog, the schema, and the PRD 38 R-MIN rows match, and that the test fails when one side drifts.
- Prove the v6 to v7 migration, a failed migration that rolls back, and a newer-schema refusal.
- Prove that a write from a connection without the guard function fails and changes nothing, that reads still work, that every Store open path in Make Docs can write, that every table has its triggers, and that a removed or changed trigger makes the Store `store-unsafe` with its reason.
- Prove each row event touches only its named rows.
- Prove `project list`, `setup store check`, and `setup store clean` CLI and MCP parity.
- Prove `check` writes nothing.
- Prove each fixed rule removes only its rows, skips a row whose condition it cannot prove, and never removes a keep-class row or a decision item.
- Prove the backup, the three-copy rotation, and a restore.
- Prove each crash leftover that blocks the machine today is cleared when its owner is proven dead.
- Prove a write from a connection that Make Docs did not open fails and changes nothing, a read still works, every table has its guard triggers, and a removed trigger makes the Store `store-unsafe` with a next action.
- Run check and clean on a copy of the maintainer machine's Store and record the space before and after.
- Run the finite `PERF-005` characterization.
- Complete a Human Experience Review for each promise above.

Automated Implementation Testing is required for every implementation phase. Guided Progress Review is selected for `project list`, `setup store check`, and `setup store clean`, because owner feedback can change their wording before P5 closes. Unassisted Goal Testing is `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `prd-generation`
- Next step: Update PRDs 03, 04, 25, 38, 39, and 52 from this plan, then amend the W29 R0 plan and backlog for schema v8.
- Why: The plan should become the product contract before the work backlog is written.
- Coordinate Handoff: Carry W32 R0 into the requirement-history entries and docs/work/2026-11-22-w32-r0-store-review-and-maintenance/.

## Change History

### 2026-11-22 — W32 R0

- Kind: `edit`
- Affected scope: Objective, Human Experience Propagation, Product Authority Decision, Requirement History Entries, P2 scope and acceptance, P5 scope, Worker Ownership, and Validation.
- Previous scope: Store maintenance and the project register, with direct Store writes forbidden only by shipped instructions.
- Replacement scope: adds a Store write guard. Triggers on every table call `make_docs_write_guard()`, which only Make Docs connections register. Make Docs checks the triggers at open and marks a changed Store `store-unsafe`. The Store and its backups use file mode `0600`.
- Rationale: the owner asked for the guard in the design, so that only Make Docs can write the Store.
- PRD decision: `update-existing` — PRD 38 gains the write guard rules.
- Owner approval: the owner kept the design change on 2026-11-22.
- Source: [Store review and maintenance design](../../designs/2026-11-22-store-review-and-maintenance.md)

