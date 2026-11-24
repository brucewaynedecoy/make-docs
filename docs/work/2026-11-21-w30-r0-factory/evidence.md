---
title: "W30 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W30 R0"
---

# W30 R0 Evidence Report

This report explains the acceptance evidence for the [W30 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Factory Contract and Workflow Types

Covers A1 to A8 in [P1](01-factory-contract-and-workflow-types.md). Evidence date: 2026-11-22. Base commit: `4daaf18f` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`. The work is uncommitted in its worktree.

### What Changed

- `packages/docs/template/.make-docs/system/contracts/factory-contract.md`: the factory rules. It holds the boundary, the parts, the smallest setup, the four standard roles and the custom role fields, the capability catalog with a proof method for each capability, setup with its manual steps and summary, the four readiness states and what moves a workflow between them, the saved records, the assignment record and its nine status values, claims and lifecycle runs, the loop, waking, the human channel, the escalation floor and message rules, acceptance, the working rules, the limits, the backup rule outside git, the workflow type fields, the optional preflight step, project-owned types, the planned commands, and the rule catalog.
- `packages/docs/template/.make-docs/system/references/factory/workflows/build-then-review.md`, `lead-and-specialists.md`, and `staged-backlog.md`: the three shipped workflow types. Each one uses the workflow type fields from the contract: purpose, when to use, roles with their capability IDs, steps, optional steps, limits, parallel work with the integration owner rule, returns, added escalation events, and one software, one personal, and one business example.
- `packages/docs/template/.make-docs/system-resources.catalog.json`: four `mcpResources` entries, each in the `workflow` profile. The reference type gains the include pattern `factory/workflows/*.md`. The catalog glob `*.md` matches only files at the top of the type root, so without this pattern the three nested references are not in the inventory.
- The dogfood copies in `.make-docs/` and the bundled CLI copies in `packages/cli/template/` (written by `node scripts/copy-template-to-cli.mjs`, not tracked by git) match the template byte for byte.
- `packages/cli/src/rules.ts`: the four paths join `ALWAYS_REFERENCE_PATHS`, as `project-doctor.md` did in W31 R0 P3. This list names the system assets that Make Docs knows. It does not force a copy into a project. A project gets a local copy only when it selects the `contract` or `reference` resource type. Without the entry, a project that selects those types fails setup with "manifest.resourceProjection.resources contains unselected or unmaterialized resource", and the template completeness test fails. A first full run without the entry had 23 failures from this cause, in 9 files.
- `packages/cli/tests/mcp-resource-profiles.test.ts`: the pinned resource counts change from `workflow: 48, all: 63` to `workflow: 52, all: 67`. This is the only existing test that pins the resource list.
- `packages/cli/tests/w30-r0-p1-factory-resources.test.ts`: 7 new tests. They check byte parity of the template, bundled, and dogfood copies; one catalog entry per URI and no new resource type; list and read of each URI offline, with and without local projection, and a no-op rerun; the roles, the 11 capabilities with a proof each, the four states and their moves, the five floor events, the smallest setup's capabilities, the claim timing and the name clash text, and a check with its phase and task, or a reason, on each rule row; the nine type sections, three examples, and the step order in each workflow type; and no product name and no lower-case task ID. Each guard was tested by breaking it for a moment: a product name, a brand name, and a changed step order each fail a test, and common words such as "screen", "teams", and "email" do not. Each file was then restored and compared byte for byte.
- No CLI operation, Store table, config key, or Skill changed. The factory stays opt-in (R-FACTORY-2), and no projection is mandatory (R-WORK-RESOURCE-3). The installed provider serves the four resources.

### Contract Content (A1, A2, A3, A4)

- A1: the contract has a section for each item: [Roles](../../../.make-docs/system/contracts/factory-contract.md#roles), the capability catalog, the readiness states `draft`, `wired`, `ready`, and `drifted`, the five floor events, acceptance, the working rules, the limits, and the backup rule.
- A2: each of the 11 capabilities in the catalog has a "How setup proves it" cell.
- A3: two searches of the four files found no tool name. The first matches 30 product names that are never ordinary words, in any letter case. The second matches 20 brand names that are also ordinary words, such as "Slack" or "Microsoft Teams", only in their brand form. Common words such as "screen", "teams", and "email" do not count. A wider case-blind search for 29 such words found only task IDs such as `P3 T3`. The only named tool is git, in the backup rule "in a folder without git", which PRD 53 R-FACTORY-4 and R-FACTORY-44 state. Git is not an example, default, or required step there.
- A4: the rule catalog has 53 rows, one per rule. Each row names its contract section. A planned check names the backlog phase and task that builds it, for example "Planned in W30 R0 P3 T3". A contract-only row gives a reason. 24 rows are planned and 29 are contract-only.

### Workflow Types (A5)

Each type has a `## Examples` section with one software, one personal, and one business example. Each example names only capability IDs, roles, and kinds of work.

### Parity (A6)

`cmp` shows the template, the dogfood copy, and the bundled CLI copy are byte-identical for the four resources and the catalog. `make-docs resource read` with the built CLI returns each of the four URIs with exit code 0, and the returned bytes equal the template file. The run used a temporary `MAKE_DOCS_HOME` and `HOME`, so it did not touch the real Store.

### No New Shape (A8)

The four files are a contract and three references under the existing `contracts` and `references` roots. The catalog still has exactly four resource types. No Playbook or Protocol path, field, or shape was added.

### Design Decision Map (A7, T12)

Each decision in the [factory design](../../designs/2026-11-21-factory.md) maps to one section. Sections are in `factory-contract.md` unless a workflow type file is named.

| Design decision | Section |
| --- | --- |
| Context: tool-agnostic | Boundary |
| Context: built inside Make Docs, uses the Store, config, resources, CLI, and MCP | Parts |
| Context: workflow types ship as resources, and projects can add types | Workflow Types |
| Context: Store is the durable record; copies are written from it | Saved Records |
| Context: one human channel per workflow, last resort "wait in session" | Human Channel |
| Context: a test task before `ready` | Readiness |
| Context: opt-in | Boundary |
| Context: software, personal, and business work | Boundary |
| Parts table | Parts |
| The CLI never dispatches, schedules, or messages | Boundary |
| Minimum and growth: smallest setup | Smallest Setup |
| Minimum and growth: needs the CLI and a usable Store, no zero-config mode | Boundary |
| Roles: four standard roles | Roles |
| Roles: custom role fields | Custom Roles |
| Matching tools by capability | Capability Catalog |
| Setup: six steps | Setup |
| Setup: readiness states | Readiness |
| Setup: one-time manual steps | Manual Steps |
| Setup: tool list saved once per machine | Setup |
| Experience promise: setup summary | Setup Summary |
| Saved records table | Saved Records |
| `.make-docs/factory/` copies and `factory restore` | Saved Records |
| No secrets | Saved Records |
| Assignment record and status values | Assignments |
| Claims and lifecycle runs | Claims and Lifecycle Runs |
| Quick items | Claims and Lifecycle Runs |
| The loop | The Loop |
| Waking | Waking |
| Human channel | Human Channel |
| Escalation floor | Escalation Floor |
| Experience promise: each message says what happened, what is needed, and what happens next | Message Rules |
| Acceptance | Acceptance |
| Workflow types: build then review | `build-then-review.md` |
| Workflow types: lead and specialists | `lead-and-specialists.md` |
| Workflow types: staged backlog | `staged-backlog.md` |
| Workflow types: project-owned type that never replaces a shipped type silently | Project-Owned Types |
| Limits | Limits |
| Working rules that stay | Working Rules |
| Working rule: one writer per file and one integration owner | Working Rules, and each type's Parallel Work |
| Working rule: worktrees | Working Rules |
| Working rule: preflight | Optional Steps |
| Working rule: profiles replaced by workflow config | Working Rules |
| Undo outside git | Backups Outside Git |
| Backlog review handoff | Commands |
| Commands and MCP tools | Commands |
| Experience promise: `factory status` in human words first | Commands |
| Experience promise: a drifted workflow names the smallest fix | Readiness |
| Rules in two forms | Purpose, and Rule Catalog |
| Consequence: the factory cannot authorize implementation by itself | Working Rules |
| Consequence: every claim names the tested combination; unproved stays visible | Capability Catalog |
| Consequence: cleanup never touches installation recovery backups | Backups Outside Git |

Design decisions that belong to other phases, and so have no section here: the Store tables and schema version (P2), the `factory:` config keys (P2), the `.gitignore` entry (P2), the `factory` MCP profile (P3), the Skill files (P4, P5), the backlog review button code (P5), and the release proofs (P6). The contract states the rule each one must follow.

### New Choices for Owner Review

These are not fixed by the design, the plan, or PRD 53. P1 had to pick them:

- The capability IDs, such as `read-write-files` and `wake-on-event`, and the proof method for each.
- The rule IDs in the rule catalog.
- The meaning of `draft` and `wired`, and the moves between states. The design names the states but not what moves a workflow from `draft` to `wired`, or back.
- The project-owned type path, `docs/assets/project/factory/workflows/<type-name>.md`. The design says that the plan fixes this path, and the plan does not. The router rule "shared project material belongs in `docs/assets/project/`" led to this choice.
- On a name clash, setup stops, names both files, saves nothing, and asks the person to rename the project type. A run that finds a clash escalates it as floor event 4.
- A lost tool always moves a workflow to `drifted`. Only a deliberate unbind by the person or by setup moves it to `draft`.
- A custom role uses a new name and never replaces a standard role. This rule is new. It is not in PRD 53 or the design.
- A change to a limit moves a `ready` workflow back to `wired`, so the test task must pass again. This rule is new. It is not in PRD 53 or the design. R-FACTORY-16 asks only to prove again each boundary that changed.
- A project that already uses contract or reference projection gets the four new files on its next upgrade, even if it never uses the factory. The cause is the `packages/cli/src/rules.ts` entry. This goes against the plain words of R-FACTORY-2, "a project that does not use the factory sees no change". R-WORK-RESOURCE-3 allows it, because the projection is the project's own optional choice. The owner can accept this, or ask for the files to be left out of type-level projection.
- The foreman's wake interval must be shorter than the claim time limit. This follows from PRD 52 R-WORK-QUEUE-7, but no PRD 53 rule states it.
- "Claim size: a phase" is listed as a limit.
- The `workflow` MCP resource profile for all four resources. P3 adds the `factory` MCP profile for tools. The resource profile list has only five values, so `factory` is not a resource profile today.
- The reference include pattern `factory/workflows/*.md`.

### Independent Review Fixes

An independent review found no tool names and correct W33 command names, but asked for ten changes. Each one is fixed:

| Finding | Fix |
| --- | --- |
| 1. The state moves conflicted: a lost tool could move a workflow to `draft` or `drifted`. | A lost tool always moves the workflow to `drifted`, which escalates. Only a deliberate unbind by the person or by setup moves it to `draft`. New rule row `lost-tool-drifts`. |
| 2. The smallest setup could never reach `wired`. | Its one tool also starts its own subagents. The section names `launch-agent`, `wait-for-agent`, and `read-agent-result`. |
| 3. Some rule rows had the wrong check or no source text. | `escalation-floor` is planned in W30 R0 P5 T11 (P5 A38). `check-handles-before-takeover` is planned in W29 R0 P4 T4 (PRD 52 R-WORK-QUEUE-7). "Claims and Lifecycle Runs" now states the claim-held rule. `limits-saved` maps to W30 R0 P2 T7 only. Every planned check names its phase and task. `no-silent-replace`, `type-fields`, `one-human-channel`, and `claim-opens-run` stay contract-only, each with a reason, because no W30 task builds those checks. |
| 4. Some rules had no row. | New rows: `grant-for-merge-deploy`, `smallest-setup`, `custom-role-new-name`, `setup-summary`, `rerun-same-workflow`, `machine-records-shared`, `no-self-authority`, `completion-returns-control`, `no-wake-said`, `backlog-review-handoff`, and `status-human-first`. |
| 5. Claim timing was missing. | The wake interval must be shorter than the claim time limit (check at least every 10 minutes, 30-minute default). Takeover follows the work queue rules: it is refused while a handle shows work running, and a person releases a claim with no handle. The Parts row adds `work release`. New rule row `wake-before-expiry`. |
| 6. The name clash rule was contradictory. | Setup saves nothing until the clash is fixed. A run that finds a clash escalates it as floor event 4. "Until then, setup uses the shipped type" is gone. |
| 7. Two new rules were not listed as owner choices. | Both are listed under New Choices for Owner Review. |
| 8. The upgrade effect of projection was not named. | It is listed under New Choices for Owner Review. |
| 9. Two workflow types sent defects back before they checked the limit. | In `build-then-review.md` and `lead-and-specialists.md`, the foreman checks the limit first, then sends defects back. |
| 10. One rule row said "need". The tool-name test blocked common words. | The row says "whether it is required or optional". The test now matches product names only, as described under A3. |

### Commands and Results

| Command | Result |
| --- | --- |
| `node packages/cli/dist/index.js resource read make-docs://system/<uri>` for each of the four URIs | Exit 0. The bytes equal the template. |
| `cmp` of template, dogfood, and bundled CLI copies | Equal for the four resources and the catalog. |
| `cd packages/cli && npx vitest run tests/w30-r0-p1-factory-resources.test.ts` | 7 passed. |
| `npm run validate:defaults -w packages/cli` | 53 passed, in 3 files. |
| `scripts/check-instruction-routers.sh` | "Instruction router check passed." Exit 0. It ran outside the sandbox, because the sandbox blocks its `mktemp -d`. |
| `make-docs project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`, with the built CLI and a temporary `MAKE_DOCS_HOME` | "No problems found in 379 files. Nothing changed." Exit 0. It read this backlog's new and changed files. The four resources are under `.make-docs/system/`, outside the doctor's scope, so the new test checks them for lower-case task IDs. |
| `make-docs run prd authority validate --target-root .` | Status `passed`. Exit 0. |
| `make-docs project path-hygiene validate --target-root .` | 1,104 files checked, no findings. Exit 0. |
| `cd packages/cli && npx vitest run` | 3 failed, 2264 passed, 6 skipped, of 2273. Files: 2 failed, 125 passed, 1 skipped. |

All checks above ran again after the independent review fixes, after `node scripts/copy-template-to-cli.mjs` and `npm run build`. The three failures are the known ones: `tests/mcp-app-contract.test.ts` (2 tests) and `tests/p5-migration-safety.test.ts` fixture 11 (sandbox only).

The first full run, before the review, also had a 15-second timeout in `tests/cli.test.ts`, "routes reconfigure skill scope and selected-name changes without changing Skills". That test then ran three times with this change (10.1 s, 8.4 s, 7.7 s) and three times with the four `rules.ts` lines taken out (7.5 s, 7.3 s, 8.0 s). All six passed. It passed in the run after the review. The test is close to its time limit when the machine is busy. This change does not make it fail on its own.

### Limits

- The planned commands do not exist yet. The contract says so where a reader might try them.
- The checks in the rule catalog are planned. Until W29 R0 P4 and W30 R0 P2, P3, and P5 ship them, the contract is the only form of each rule.
- `make-docs://system/reference/work-store.md`, which the contract names for the takeover rules, is planned in W29 R0. It does not exist yet.
- Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. P5 reviews the real escalation messages.

## P2 Store Records, Config, and Copies

Covers A9 to A18 and A51 to A55 in [P2](02-store-records-config-and-copies.md). Evidence date: 2026-11-23. Base commit: `d218a0e1` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. The work is uncommitted in its worktree. Every CLI and test run used a temporary `MAKE_DOCS_HOME`; nothing read or wrote the real Store.

### Schema v9 and Its Tables

One append-only migration moves the Store from v8 to v9 (`STORE_MIGRATIONS` in `packages/cli/src/store/database.ts`). Its SQL is in `packages/cli/src/store/factory-store-schema.ts`. Like v8, it runs after one verified backup (`store.db.bridge-v8-to-v9-<uuid>.backup`), in one transaction with its `user_version` bump and its schema journal row, and rolls back on any failure. Each table has its three write guard triggers and a Store table catalog entry.

| Table | Catalog class | Why |
| --- | --- | --- |
| `factory_machine_tools` | `bounded` | Store-cached and rebuildable. One row for each tool on the machine (primary key); a tools save replaces it, and a gone tool stays as `missing`. No fixed rule removes a row, because a lost row makes the workflow drift. |
| `factory_capability_proofs` | `bounded` | One row for each capability of each tool (primary key); replaced with the tool, removed with it. Shares the "Factory machine tools" R-MIN row with the tool table. |
| `factory_workflow_plans` | `bounded` | The keep rule: the `ready` revision, each revision an open assignment names, and the 10 newest others. Each save trims in the same write. A trigger refuses any change to a saved row, and a unique key allows one revision per digest. |
| `factory_workflow_bindings` | `keep` | The saved choices of a workflow. Kept until the person changes or removes the workflow. |
| `factory_grants` | `keep` | Kept until revoked or the workflow is removed; spent, ended, and expired grants stay as history. |
| `factory_assignments` | `keep` | Open assignments until final, then the final summary until an explicit scoped cleanup. A partial unique index allows one open assignment per job, and a trigger refuses a change to a final row. No foreign key to `work_units`, and none removes it by cascade (see Independent Review Fixes). |
| `factory_proof_results` | `bounded` | At most one passed and one failed row per workflow (primary key). |
| `factory_backups` | `bounded` | Factory cleanup, not a Store maintenance rule, removes a row and its file on accept or close, or after 30 days. |

Machine tools and capability proofs carry no project ID. The other six tables carry the project ID from `project_register`.

### Every v8 to v9 Touch Point

- `database.ts`: `CURRENT_STORE_SCHEMA_VERSION = 9`; the v9 migration; the classifier types (current 9, legacy 1 to 8); `VERSION_NINE_TABLES` in the expected table lists; the rollback markers, so a v9 Store set back to 8 is `changed-outside`.
- `compatibility-bridge.ts`: setup preview record `w30-r0-p2-store-schema-v9`, so one reviewed setup converts v6, v7, or v8 to v9.
- `installation-state.ts`: checkout move review, checkout move, and separate checkout registration still use a schema 6, 7, or 8 Store as it is. The code already accepted schema 6 and newer; only its note changed. A test reads a v8 Store this way.
- `table-catalog.ts`: eight entries, physical schema version 9, the shared R-MIN row for tools and proofs, and the six factory rows moved out of the "planned" list.
- `state-rows.ts`: a project prune keeps the factory rows (note only).
- `path-hygiene.ts`: `.make-docs/factory/` joins the protected folders that no content scan reads.
- `scripts/w22-r1-package-proof.mjs`: released 2.0.5 must refuse with "schema version 9 is newer than supported version 6".
- Tests that pinned schema 8: `w29-r0-p2-store-schema-and-records`, `w32-r0-p2-schema-v7`, `store-table-catalog`, `p6-global-store-lifecycle`, `backlog-cache`, `w29-r0-p3-parser-import-and-sync`, `w32-r0-p2-old-store-checkout-move`, `w32-r0-p3-project-register`, `w32-r0-p4-store-maintenance`, and `w32-r0-p5-store-wording`. Each now expects v9. The v7 test counts guard triggers by name, because v9 adds two triggers that are not guard triggers.
- `packages/cli/src/store/README.md`: schema 9, 33 tables, the factory section, and the backup name.
- The store-table-catalog drift test failed at the base commit, because the P1 plan added the "Factory workflow plans" R-MIN row before its table. It passes now.

### PRD 38 (T1)

T1 found an R-MIN row for each factory record, but no field for the keys and versions that the tables need. Before the migration, the rows gained a record version (tools, bindings, grants, assignments, proof results), a project ID and workflow name (bindings, grants, assignments, proof results), a project ID (backup records), a grant ID, and an assignment ID. R-DB-7 names the v9 tables. The Requirement History entry "2026-11-23 — W30 R0 P2" records both. The parity test (`factoryStoreSchemaDrift`) reads the rows with a parser that splits only at commas outside parentheses and code spans.

### Store Service Rules

`packages/cli/src/store/factory-store.ts` is the only code that reads and writes the factory tables. It takes an open Store connection, as the work store service does. The pure rules are in `packages/cli/src/operations/factory/records.ts`.

- Expected version: every write that changes a saved record gives the record version it read. A plan revision, a grant, and a backup record are only added or removed.
- One open assignment per job (unit, role, part label): `assignment-open`, and a partial unique index in the schema.
- Status moves: move table version 1 from the contract. `illegal-move`, `final-status`, and a schema trigger for final rows. The same status only records a check, with no history entry.
- Round count: up by one on each move from `returned`, `in-review`, or `unknown` to `needs-correction`, except a move from `unknown` whose status before was `needs-correction` (owner decisions 2026-11-23). A move past the plan revision's round limit is `round-limit-reached`. A new assignment for the job starts at the last count. Only a `once` `reset-correction-rounds` grant resets it, and the start spends it.
- Status history: the 20 newest entries, each status, time, and a reason code from the contract list.
- Never-log: free text is one line of at most 120 characters, and a value that looks like a credential or an environment setting is `never-log-field`. A refusal names the field, never the value. A task handle may be a long ID, so the long-run credential pattern does not apply to it.
- Claim ID: `startFactoryAssignment` and `updateFactoryAssignment` check the caller's claim ID against `work_claims` and save nothing of it. No factory table has a claim column, and a test checks every table and copy.
- Readiness: `saveFactoryWorkflowBinding` never makes a workflow `ready` (`proof-missing`). `markFactoryReadyRevision` needs a kept revision (`plan-digest-mismatch`) and a passed test task under it (`proof-missing`). `startFactoryAssignment` takes the current plan digest that P3 computes, and refuses `not-ready` unless it is the `ready` revision's digest.
- Grants: `once`, `run`, and `standing`, an optional expiry, and a spent time. A use is refused with `grant-missing`, `grant-out-of-scope` (another run, or a run that ended), `grant-spent`, or `grant-expired`. A grant-only save resolves no plan and changes no readiness.
- Machine tools: one list per machine. An unknown capability ID is `unknown-capability`.

### Owner Decision: Project Scoping (2026-11-23)

The owner decided on 2026-11-23 that every project-scoped factory table carries the project ID from `project_register`, never a path or a name, and that every Store service function for those tables takes an explicit project ID and never derives it from the current folder. Machine tools and capability proofs carry no project ID. Another agent updates the design, PRD 53, and the contract for this decision. This phase changed only PRD 38, its own phase file, and this report.

- `factory_backups` gained a `project_id` column, and its R-MIN row gained "project ID".
- Each project-scoped function takes the project ID as an argument: reads, writes, `revokeFactoryGrant`, `updateFactoryAssignment`, `readFactoryAssignment`, the backup functions, the cleanup, and the copy writer. The folder in a backup or copy call says only where files go.
- A missing project ID is refused with `project-not-identified`, and one that `project_register` does not hold with `project-not-registered`. Nothing changes. A record of another project is not found.
- Tests: a table check that the six project-scoped tables have `project_id` and the two machine tables do not; 18 functions each refused with both codes, with a dump of every factory table before and after; and a second registered project that cannot read, update, revoke, or clean the first project's records from the same folder.

### Resolved Plan Functions

`packages/cli/src/operations/factory/plan.ts` holds pure functions:

- `factoryCanonicalJson`: sorted keys, no extra spaces, arrays in order. It refuses `undefined`, non-finite numbers, and objects that are not plain.
- `factoryDigest`: the SHA-256 of the UTF-8 bytes.
- `resolveFactoryPlan`: joins the portable definition (with contract defaults filled in), the saved binding, and the live tool facts into one plan with the type name, version, and file digest and the move table version. It returns the plan digest, the config digest, and the binding digest. A grant is never an input.
- `factoryPlanRevisionsToKeep`: the keep rule.

`saveFactoryPlanRevision` writes canonical JSON, computes the plan digest, the config digest (from `plan.definition`), and the binding digest (from `plan.binding`) itself, runs the never-log check on every text value in the plan, adds a revision only when no kept revision has that digest, and trims older revisions in the same write.

### Config Block

`packages/cli/src/operations/factory/config-block.ts` and `packages/cli/src/config.ts` accept a `factory:` block. Its shape is new in this phase: `factory.workflows.<name>` with `type`, `typeVersion` (a plain number), `roles.<role>` (`job`, `capabilities`, `returns`, `context`), `roundLimit` (default 3), `limits` (`parallelWorkers`, `claimSize`), `gates`, `escalations`, `steps.preflight`, `integrationOwner` (one of the roles), and `humanChannel`. A custom role, one that the project adds, must list its context kinds; the four standard roles need none (owner decisions 2026-11-23). Validation names each key that holds a grant, an ID, a path, a digest, a receipt, a proof, a binding, saved state, or a secret, and refuses free text that looks like a machine path, a digest, a Store ID, a credential, or an environment setting, without echoing the value. An unknown context kind is refused by name. An unknown capability ID is left to `factory workflow save` in P3, so an older CLI does not reject config that a newer catalog allows.

### Local Copies

`packages/cli/src/operations/factory/copies.ts` writes `tools.md` and one `workflow-<name>.md` per workflow to `.make-docs/factory/`, read-only, each starting with the generated note. The workflow copy prints the latest revision and says whether it is the `ready` revision. The writer never reads the grants table. It removes a copy that the Store no longer backs. No code reads the folder, and `isProtectedContentPath` keeps it out of every content scan.

T11 (owner-approved 2026-11-23): setup writes no standard `.gitignore`, so the copy writer writes a `.gitignore` with `*` inside the folder, and the backup folder gets the same. Make Docs never edits the project root `.gitignore`. A test makes a git repository, writes the copies, and shows that `git status` lists nothing from the folder.

### Backups Outside Git

`packages/cli/src/operations/factory/backups.ts` copies a file to `.make-docs/backup/factory/<assignment>/<path>` before a worker changes it, only in a folder with no `.git` in it or above it. It checks the copy's digest against the original, then records it; a failed record removes the copy. Cleanup removes an assignment's backups when the assignment is `accepted` or its unit is closed, and any backup older than 30 days, including a file that was never recorded. It removes files only inside `.make-docs/backup/factory/`. A test puts old files in `.make-docs/backup/<date>/` and `.make-docs/backup/operations/`, and cleanup leaves them. The folder's `README.md` states the cleanup rule and the recovery steps.

### Independent Review Fixes

An independent review of P2 found one HIGH finding and six smaller ones. Each fix has a test in `packages/cli/tests/w30-r0-p2-store-records-config-and-copies.test.ts`.

| Finding | Fix |
| --- | --- |
| 1 (HIGH). `factory_assignments` used `ON DELETE CASCADE` from `work_units`, and backup records from assignments, so a W29 sync that deletes a unit silently deleted its open assignments and their backup records (PRD 38 keep-until-final, R-MIN-4). | No foreign key removes a factory record by cascade. Backup records point at assignments with no cascade, so an assignment cannot go while a record names it. Assignments have no foreign key to `work_units` at all, because PRD 38 keeps a final assignment's summary until an explicit scoped cleanup, so a final row must outlive its unit; a foreign key without cascade would instead make every unit with a final assignment impossible to remove. W29 sync stops a file whose removed unit has an open factory assignment, as a conflict that says so, and deletes nothing (WORK-RULE-043; PRD 52 R-WORK-SYNC-16 says "such as", so its text did not change). The re-check below gave this conflict its own message. The twin reference `work-store.md` names the new case, upstream first, then the dogfood and bundled copies. `deleteWorkUnit` refuses a unit with an open assignment with the new work store refusal `factory-assignment-open`. The scoped project cleanup (`deletePrunedProjectWorkRows`, W29 R0 P4 T12) refuses while the project has an open assignment, and otherwise removes the project's backup records and then its final assignments itself, and reports them in `factoryRemoved`. It keeps the workflow's rows (bindings, plan revisions, grants, test task results), which go only when the workflow is removed. Assignments also no longer cascade from a removed workflow binding. |
| 2 (MEDIUM). `saveFactoryPlanRevision` trusted the caller's config and binding digests and did not check the plan's text. | It computes both digests from `plan.definition` and `plan.binding`, refuses a plan without them, and runs the never-log check on every text value, naming the plan field and never the value. A value at a key that ends in `Digest` may be a 64-character hex digest. |
| 3 (LOW-MEDIUM). A binding save that changed nothing dropped `ready`, and assignment start also needed the saved readiness. | A binding save takes the digest of the plan that the caller resolved. When it equals the `ready` revision's digest, the workflow stays `ready`. Assignment start is gated only on that digest match (R-FACTORY-12 live readiness); the saved readiness is a note. |
| 5 (LOW). The 30-day rule applied only to records inside the current folder. | It applies to every backup record of the project. A file is deleted only inside the current checkout's folder; a record whose file is elsewhere, such as in a checkout that moved, is removed alone and reported in `recordsOnly`. Its old file in the moved folder goes as an unrecorded file older than 30 days. |
| 6 (LOW). `listFactoryAssignments` sorted by the first history entry, which the 20-entry trim drops. | It sorts by insert order (`rowid`). Assignment start also finds the job's last assignment by insert order. |
| 7 (LOW). A reset grant was spent even when the round count was 0. | It is spent only when the count is above 0. |
| 8 (LOW). A config error could repeat a workflow or role name that looks like a token. | Such a name shows as `<name hidden>` in the key path and the message, in the schema errors and in the state-key check. |

### Re-check Fixes

A re-check confirmed the fixes above and found two more problems. Each fix has a test in `packages/cli/tests/w30-r0-p2-store-records-config-and-copies.test.ts`.

| Finding | Fix |
| --- | --- |
| 1 (MEDIUM). Closing a unit while its factory assignment was open stranded the assignment: a close ends the claim, a closed unit cannot be claimed again, and every assignment update needs the claim. Backup cleanup then removed the open assignment's backups, the scoped project cleanup refused forever, and the unit could never leave its file. This happened through `work close`, `--accept-deletion`, and a sync that closes the unit from its file. | Every close refuses while the unit has an open factory assignment. `putWorkUnit`, the one write that closes a unit, refuses with the work store refusal `factory-assignment-open`. `work close` refuses with the new work update refusal `factory-assignment-open` ("A factory assignment is still open for this unit. Finish or cancel it first, then close the unit."), before any write, and the claim and the assignment stay. A sync whose file closes such a unit stops that file as a conflict, as for a removed unit. `--accept-deletion` refuses with the new settle refusal `factory-assignment-open`. The backup test that closed a unit with an open assignment now expects the refusal, cancels the assignment, and then closes the unit. |
| 4 (LOW). The open-assignment conflict had no clear message, and its settle choices were not checked. | The conflict says "A factory assignment is still open for <unit>. Finish or cancel it first, then sync again." for a unit that leaves the file or that the file closes. `--keep-store` writes the file from the store and clears the conflict; the next sync finds none. `--keep-file` (and `--reimport`) refuse with `factory-assignment-open` when the file's version would close or remove a unit with an open assignment, so a settle never says "Settled" and then stops again. The twin reference `work-store.md` states the rule, upstream first, then the dogfood and bundled copies. |

### Owner Decisions of 2026-11-23

The owner approved these on 2026-11-23. Each is applied in P2 code and tested in `packages/cli/tests/w30-r0-p2-store-records-config-and-copies.test.ts` (describe "W30 R0 P2 owner decisions of 2026-11-23"). A docs agent updates PRD 53, the factory contract, and the design in another worktree; this phase changed PRD 38, the P2 phase file, the backlog index, and this report.

1. Each factory assignment records the checkout that `assignment start` named, not a worker's working copy. `factory_assignments` gained `checkout_id` in the unreleased v9 migration, with the R-MIN field "checkout ID", the catalog column, and the parity register. `startFactoryAssignment` requires it: a missing one is `invalid-record`, and a checkout that `installation_checkouts` does not hold for this project is the new service refusal `checkout-not-bound`. The column has no foreign key, so removing a checkout never removes an assignment by cascade. Reason: `factory status` will group running factories by checkout, then by lifecycle run, when one project runs several factories.
2. The integration owner and the human channel kind live in config only. `integration_owner` and `channel_kind` left `factory_workflow_bindings` in the v9 migration; `channel_ref` stays in the Store. The `.make-docs/factory/` printout reads both from the latest resolved plan. PRD 38's bindings row no longer names "integration owner" (Requirement History "2026-11-23 — W30 R0 P2 Owner Decisions"). This settles review finding 4.
3. A move from `unknown` to `needs-correction` adds one correction round, and a move past the limit is `round-limit-reached`, so a loop through `unknown` never skips a round. Refined by decision 6 below.
4. A custom role must list its context kinds (refined by decision 7 below: only a role that the project adds). Config refuses one without a list with "The role "<name>" has no context list. A custom role must list its context kinds, for example [unit-record, requirements]." A name that looks like a token shows as `<name hidden>`; such a name is also refused as a name first. The integration owner message hides such a name too.
5. T11 and A15: the per-folder `.gitignore` is approved. The folder ignores itself, and Make Docs never edits the project root `.gitignore`. T11 is checked, and A15 reads "the folder ignores itself". The entry `.make-docs/factory/` that P2 had added to this repository's root `.gitignore` is removed: it was added only for this, and this repository writes no copies today. When copies are written, the copy writer writes the folder's own `.gitignore` with them, which the git test shows. The backlog index records the T11 and A15 scope edit in its Change History.

Two more owner decisions, approved on 2026-11-23, refine decisions 3 and 4. Both are new behavior. Their tests are in the describe "W30 R0 P2 owner decisions of 2026-11-23, second set".

6. A move from `unknown` to `needs-correction` adds a round, except when the status before `unknown` was already `needs-correction`; then it adds none, because that round was counted when the job first went to `needs-correction`. The service reads the status before `unknown` from the status history: the newest entry is the current status, and the entry before it is the status before (`factoryStatusBeforeLatest`). Tests: `returned` → `unknown` → `needs-correction` and `in-review` → `unknown` → `needs-correction` each add a round; `needs-correction` → `unknown` → `needs-correction` adds none, also at the round limit, so that move is allowed there.
7. Only a custom role, one that the project adds, must list its context kinds. The four standard roles are `front-desk`, `foreman`, `builder`, and `reviewer` (`FACTORY_STANDARD_ROLES`). Builder and reviewer keep their contract defaults, and the foreman and the front desk need no list, because nobody hands them context; with no list they get none in the plan. Test: a workflow that lists a foreman and a front desk without context lists is accepted, and only an added custom role without a list is refused. The refusal message uses the owner's corrected wording of 2026-11-23, which matches the updated contract: "A custom role must list its context kinds", in place of "A role that is not builder or reviewer must list its context kinds".

### Open for the Owner

- Flagged for PRD 52, which this phase did not change (the reviewer updates it at merge): R-WORK-STORE-13 lists the rows that the scoped cleanup removes (units, dependencies, links, and claims); the cleanup now also removes a pruned project's final factory assignments and their backup records, and refuses while one is open. The close rules (R-WORK-QUEUE-9 and R-WORK-SYNC-16) gain the `factory-assignment-open` refusal for a unit with an open assignment.

### Checks

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-p2-store-records-config-and-copies.test.ts`: 59 tests pass after the second set of owner decisions (57 after the first set, 53 after the re-check fixes, 50 after the review fixes, 41 before them).
- After the second set of owner decisions: the same groups as below plus `config` and `backup`: 26 files, 780 tests pass (778 after the first set).
- After the re-check fixes: every W29 test file (including sync and the work queue), the work store contract, the Store, catalog, maintenance, W32, installation state, backlog cache, consistency, name catalog, and W30 tests: 24 files, 748 tests pass. After the review fixes, the same groups with the config and backup tests: 24 files, 714 tests.
- `npm run validate:defaults`: 53 tests pass. `name-catalog` and `consistency`: 84 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed. `project paths validate`: `valid: true`. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files. All ran with the built CLI and a temporary `MAKE_DOCS_HOME`, before and after the review fixes, and again after the re-check fixes and after the owner decisions, with `validate:defaults` (53 tests).
- `npm run smoke:pack:local`: pass, before the review fixes. Released 2.0.5 refuses the upgraded Store with "schema version 9 is newer than supported version 6" and changes nothing. It ran outside the sandbox because it downloads the released 2.0.5 package. It was not run again after the review fixes, which change no schema version.

`npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report, after the second set of owner decisions of 2026-11-23: 151 test files, 149 passed and 2 failed. Of 3,479 tests, 3,470 passed, 3 failed, and 6 were skipped. After the first set it was 3,477 tests with the same three failures. After the re-check fixes it was 3,473 tests with the same three failures. After the review fixes it was 3,470 tests with the same three failures. The run before the review fixes had the same three failures, of 3,461 tests. After that run, two catalog `writers` lines for `factory_assignments` and `factory_backups` gained the scoped cleanup. That text changes the catalog digest only; after a rebuild, the catalog, maintenance, wording, and P2 test files passed again (4 files, 153 tests). All three failures are known and exist without this phase: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only).

### Left for P3

- The `factory` commands and MCP tools: `tools save`, `workflow save` (with grant-only saves), `workflow show`, `proof save`, `assignment start`, `assignment update`, `restore`, and `status`. They open the Store with the existing write permission, call this service, write the copies after each save, and run backup cleanup during normal operations.
- Computing the current plan from the three live sources (reading the config block and the type file), the drift reason codes, `type-version-mismatch`, and `unknown-capability` for config capability IDs.
- Reading the type file's `Type version: N` line and its digest.

### Limits

- No public command or MCP tool reads or writes the factory tables yet, so no person-facing output was reviewed. P3 reviews status output.
- The config block's key names and nesting are this phase's choice. PRD 24 and PRD 53 name the fields, not the keys.
- Implementation choices for owner review: config does not refuse `builder-summary` for a reviewer, because R-FACTORY-60 says "by default"; a `run` grant also stops holding when its lifecycle run is `completed`, `failed`, or `abandoned`; backup cleanup treats a closed work unit as "closed" work; and an unrecorded file in the backup folder older than 30 days is removed.

### P2 Integration

- Merged on top of the W30 R0 scoping docs (`e530aa5c`). The one conflict, in the backlog index Change History, kept all four entries in date order, and the P2 entry's PRD decision now points to PRD 53 R-FACTORY-25 and R-FACTORY-46.
- The final re-check found three small mismatches, fixed at integration: each factory `.gitignore` now holds only the line `*`, as the owner approved (the comment lines are gone, and the copy test expects exactly `*`); PRD 38 and decision 1 above use "the checkout that `assignment start` named, not a worker's working copy"; PRD 53 R-FACTORY-27 and the contract name `checkout-not-bound` and `factory-assignment-open`.
- PRD 52 R-WORK-STORE-13, R-WORK-QUEUE-9, and R-WORK-SYNC-16 now state the factory assignment close and cleanup rules, with a Requirement History entry.
- Full suite after the merge, counted from the JSON reporter: 3479 tests, 3469 passed, 6 skipped, 4 failed: the 3 known failures (`mcp-app-contract` 2, `w19-r5-skills-command` 1) and the copy test that still expected the comment lines, since fixed (59 of 59 in that file pass).

## P3 Factory Operations

Covers A19 to A25, A56 to A63, A73 to A80, and A83 in [P3](03-factory-operations.md). Evidence date: 2026-11-23. Base commit: `deac28e7` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. The work is uncommitted in its worktree. Every CLI and test run used a temporary `MAKE_DOCS_HOME`; nothing read or wrote the real Store.

### What Changed

The ten `factory` operations are admitted in the registry, with leaf help, JSON and text output, and MCP tools in the new `factory` profile and `all`. One function for each command lives in `packages/cli/src/operations/factory/service.ts`; the registry definitions, the CLI adapters, and the MCP tools only parse input, so the CLI JSON and the MCP result are the same value. The current plan comes from three live sources in `live-plan.ts`. Project scope lives in `project-scope.ts`, and the factory URIs in `uri.ts`. No operation launches, schedules, messages, or contacts a tool.

| CLI path | MCP name | Scope | Kind | Access |
| --- | --- | --- | --- | --- |
| `make-docs factory status [--run <run-id>]` | `factory_status` | Project | Read | Store read, project read |
| `make-docs factory tools save --tools-json <file>` | `factory_tools_save` | Machine | Write | Store write |
| `make-docs factory workflow save <workflow>` | `factory_workflow_save` | Project | Write | Store write, project write (copies) |
| `make-docs factory workflow show <workflow> [--revision <n>]` | `factory_workflow_show` | Project | Read | Store read, project read |
| `make-docs factory workflow list` | `factory_workflow_list` | Project | Read | Store read, project read |
| `make-docs factory proof save <workflow>` | `factory_proof_save` | Project | Write | Store write, project write (copies) |
| `make-docs factory assignment start <unit>` | `factory_assignment_start` | Project | Write | Store write, project read |
| `make-docs factory assignment save <assignment>` | `factory_assignment_save` | Project | Write | Store write, project write (backup cleanup) |
| `make-docs factory assignment list` | `factory_assignment_list` | Project | Read | Store read, project read |
| `make-docs factory restore` | `factory_restore` | Project | Write | Store write, project write (copies) |

Every MCP name has at most 26 characters. Every project command takes `--target-root <path>` or `--project <name>` (MCP `targetRoot` or `project`). `factory tools save` takes neither: its input schema refuses both.

### Owner Decisions, as Built

- Project scope (T25 to T29): `FACTORY_OPERATION_SCOPES` holds the contract's project scope table once, and a test compares it with the table. A project write with no project is `project-missing` before any Store admission, also inside a project folder; the message names both ways to name a project. A name resolves only through `project_register`. `project-not-found`, `project-mismatch`, and `project-checkout-unclear` (a write that reads or writes project files, when the name gives no single checkout) change nothing. A harness grant belongs to one checkout (its config file and its Store record), so a `--project` name with no single checkout is `project-checkout-unclear` for every project command, read or write, and the refusal names `--target-root`. A call with `--target-root` still reads or acts on the whole project. A `--target-root` folder with no project ID, or one that is not a bound checkout, keeps the existing typed refusal (`project-not-identified`, `checkout-not-bound`, `project-not-registered`).
- Results name what they acted on (T28): every result has `actedOn`, with the project name and ID or `this machine`, and its first line says the same in words. A refusal says which project it refused, or that no project was named.
- Reads (T29): `workflow show`, `workflow list`, `assignment list`, and `status` use the current folder's project when none is named, and say "taken from the current folder" or "as named". A folder that is not a project gives `project-missing`.
- `factory status` (T8, T33, register D-073): one project; one group for each checkout that has an open assignment, and one for the checkout that the call named or ran in; each group's readiness comes from that checkout's config file and type file; then one group for each lifecycle run. `--run <run-id>` keeps only the groups with that run. A checkout that cannot be read shows "Readiness: unknown." and why. `assignment start` records the checkout ID of the checkout that it named.
- Factory URIs (T30, T32, register D-074): `factory/`, `factory/workflows/<name>`, `.../revisions/`, `.../revisions/<n>`, and `factory/assignments/` (each row with its lifecycle run ID) resolve through the shared project URI parser and `project_register`. Any other path under `factory/` is `resource-not-found`. A read shows saved records only, opens a read-only Store session, ends with the note to run `factory status` in a checkout, and shows no grant, claim ID, task handle, file contents, or prompt. Without a Store, the typed Store outcome names the `.make-docs/factory/` copies and no Store is made.
- Access (T31, register D-075): a factory URI read keeps the W29 rule, the grant of the folder where the agent works. A factory MCP tool that names a project is checked against that project's own checkout: `resolveTarget` finds the project before the access check. Without that project's grant, the call is `store-denied`, names the project, and says to run `make-docs setup --target <checkout>` and grant Store read or Store write. A project with no harness access configuration gives this caller no grant either, so it is also `store-denied` for a factory call. `factory tools save` is admitted by the grant of the folder where it runs.
- Claim IDs (T24): `assignment start` and `assignment save` take the private claim ID, refuse a call without it or with a wrong one as `claim-not-held`, and no result, record, copy, or URI read shows it (A73 test).
- Tool-agnostic: code, tests, fixtures, and help use `tool-a` and `tool-b`.

### Choices Made in This Phase

Each item is new behavior that no authority fixed.

- CLI flags: `--tools-json`, `--binding-json`, and `--grants-json` take a JSON file or inline JSON; `--ready` asks for ready; `--reset-rounds`; `--grant-use <action>`; `--part` and `--tool` on `assignment start`; `--all` on `assignment list`. `factory status --run` takes a value although the shared option list holds `--run` as a flag; a per-command value-flag list in `run/cli.ts` does that.
- A shipped workflow type is read from the installed package, so it is the same file in every checkout on the machine. A project-owned type is read from the checkout.
- A plan is `wired` only when each role has an `available` tool and each needed capability is `proved` for the version that the tool reports. A passed test task for a plan that is not `wired` is refused as `not-ready`. This closes a gap: before the fix, a passed test task made a `draft` plan `ready`.
- Drift codes compare the current plan with the latest saved revision, because drift is a change without a save. Per role, only the tool facts count: the tool, its state and version, and the proofs of capabilities that both plans need. A change to proof facts that no other code names is `binding-changed`, because the binding digest covers the machine binding. One tool that fills several roles gives one entry for each code, naming every role.
- `workflow save` refuses a config entry that lacks a standard role (front desk, foreman, builder, or reviewer) that the type's `## Roles` table names. A row with another name, such as "Specialist" in `lead-and-specialists` or "Unit roles" in `staged-backlog`, names no required role, because the project or the unit's own type chooses those roles.
- `assignment start` takes the role and the tool from the `ready` plan. The contract has no substitute tool: "pick another tool" means binding it through setup, which saves a new plan that needs its own test task. So a tool other than the role's bound tool is refused, also when it is available and proved.
- `assignment start` needs a lifecycle run of the project that has not ended.
- `workflow save --ready` is accepted only when the save gives the `ready` revision's plan, so a save still never makes a new revision `ready`.
- `assignment save` with no status records a check only (reason code `handle-checked`, no history entry). A move needs `--reason`.
- Backup cleanup runs during `factory restore` and `factory assignment save`, in the assignment's checkout when that folder is on this machine.
- `factory tools save` does not write any project's copies; each project's copies update at its next factory save or `factory restore`.
- The factory contract and its three workflow types are also in the `factory` MCP profile, so that profile has the rules with its tools.

### Shared Code Changes

- `registry.ts`: an optional `resolveTarget` hook on an operation finds the folder whose grant and Store admission apply, or returns a typed refusal value with no Store admission. A new `handler` Store admission kind keeps the harness check and lets the handler open its own Store session; `factory tools save` uses it, because a machine call must not be refused when the folder where it runs holds the Store.
- `installation-state.ts`: `withStoreWriteDatabase` writes the Store in one transaction with no project folder. It never creates, prepares, or migrates a Store.
- Native command rules: every factory command is a native command rule candidate, and setup admits each rule. See Rename (Register D-076).
- `project-uri.ts`: the `factory` family is current (PRD 52 R-WORK-URI-1).
- `mcp-metadata.ts`, the `make-docs mcp` help, and `system-resources.schema.json` (upstream first, then dogfood): the `factory` profile.
- The factory contract (upstream first, then dogfood and bundled): the shipped work queue and factory commands, and the factory URIs, are no longer called planned.

### Guided Progress Review Samples (T11, Passed)

These samples are from the built CLI in a temporary project, with `tool-a` and `tool-b`, after the review fixes. `tool-a` fills the foreman and builder roles. The checkout path is shortened to `<aurora checkout>`. On 2026-11-23 the owner reviewed these samples and found the output clear (option A), so T11 passed with no change to the output.

Ready workflow, `make-docs factory status` in the checkout:

```text
Factory status for project aurora (smoke-project), taken from the current folder.
Checkout <aurora checkout> (the checkout of this call):
  Workflow ship: ready: it takes new work. Plan revision 1.
  Open manual steps:
    - ship: Approve the app permission.
  No open assignment.
Changes nothing.
```

Busy workflow, after `lifecycle start`, a claim, `assignment start`, and a move to `running`:

```text
Factory status for project aurora (smoke-project), taken from the current folder.
Checkout <aurora checkout> (the checkout of this call):
  Workflow ship: ready: it takes new work. Plan revision 1.
  Open manual steps:
    - ship: Approve the app permission.
  Lifecycle run run-1:
    - task 1 (builder, part main): tool tool-a (Tool A), running, last check 2026-11-24T02:04:20.751Z; round 0 of 3; claimed by foreman until 2026-11-24T03:04:20.376Z.
Changes nothing.
```

Drifted workflow, after `tools save` reported version 1.1 for `tool-a`:

```text
Factory status for project aurora (smoke-project), taken from the current folder.
Checkout <aurora checkout> (the checkout of this call):
  Workflow ship: drifted: something changed without a save, so it takes no new work. Ready revision 1.
    - tool-version-changed: Tool tool-a for the builder and foreman roles reports version 1.1, but its proof is for version 1.0. Next: Prove tool-a again and save it with make-docs factory tools save, save the workflow, and pass a new test task. If version 1.0 comes back, the workflow is ready again with no new step.
  Open manual steps:
    - ship: Approve the app permission.
  Lifecycle run run-1:
    - task 1 (builder, part main): tool tool-a (Tool A), running, last check 2026-11-24T02:04:20.751Z; round 0 of 3; claimed by foreman until 2026-11-24T03:04:20.376Z.
Changes nothing.
```

A new `assignment start` while the workflow is drifted:

```text
Refused for project aurora (smoke-project). Workflow ship is not ready, so it takes no new work.
- tool-version-changed: Tool tool-a for the builder and foreman roles reports version 1.1, but its proof is for version 1.0. Next: Prove tool-a again and save it with make-docs factory tools save, save the workflow, and pass a new test task. If version 1.0 comes back, the workflow is ready again with no new step.
Next: Check the workflow with factory workflow show and fix what it names.
Reason code: not-ready. Nothing changed.
```

### Review Fixes

An independent review of P3 on 2026-11-23 found seven items. Each fix has a test in `packages/cli/tests/w30-r0-p3-factory-operations.test.ts` (describe "W30 R0 P3 review fixes"). The owner then closed register D-076; see Rename (Register D-076).

| Item | Fix |
| --- | --- |
| 1 (MEDIUM-HIGH). `assignment start` did not check the role and tool against the ready plan. | It refuses a role that the `ready` plan does not have and a tool that is not the role's bound tool, as `invalid-record` with the field named. The contract and PRD 53 allow no substitute tool, so an available and proved tool that is bound to another role is refused too. The default tool is the bound tool. The old hint "Name the tool with --tool" is gone. |
| 2 (MEDIUM). `workflow save` did not check the config roles against the type. | It refuses a config entry that lacks a standard role named in the type's `## Roles` table, and names the missing roles. `build-then-review` with only a builder is refused. The contract row `custom-role-fields` now says what the check does (template first, then the dogfood and bundled copies). The test fixtures now have a foreman role. |
| 3 (LOW-MEDIUM). A config-only change also gave a false `binding-changed`. | Per role, only the tool facts are compared, and drift is measured against the latest saved revision. A change to a role's capabilities in the config gives only `config-changed`. |
| 4 (LOW). `assignment start` took any run ID. | It refuses a run ID that is not a lifecycle run of the project (`record-not-found`), and a run that is completed, failed, or abandoned (`invalid-record`), so a `run` grant can never outlive a mistyped run. |
| 5 (LOW). 34 Rule Catalog rows still say "Planned in W30 R0 P3" for built checks. | A sentence after the catalog's first paragraph says that those rows are built as of P3 and that P6 updates the column. P6 T14 records that update. The P1 test vocabulary is unchanged. |
| 6 (LOW). A workflow removed from the config told the person to run setup again, which cannot remove it. | Its next step says that Make Docs cannot remove a saved workflow yet, how to use it again, and that leaving it changes nothing. P3 T34 records workflow removal as a follow-up. |
| 7 (LOW). A `--project` call on a project with two or more checkouts used the first checkout by path for the grant check. | A grant belongs to one checkout, so such a call is `project-checkout-unclear` and names `--target-root`. A single checkout is used as before. |

### Checks

All runs are after the review fixes and the rename, with the built CLI where a CLI ran, and a temporary `MAKE_DOCS_HOME`.

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-p3-factory-operations.test.ts`: 36 tests pass; 37 after the re-check fixes.
- Re-check fixes (2026-11-23): a merged drift line for a tool that fills several roles now takes its capability and version lists from every merged role and says "roles" in its text and its next step; PRD 38 and the Store table catalog say "assignment start and save"; the `project-checkout-unclear` text says once that a grant belongs to one checkout. After them: tsc and the build pass, the P3 test (37), every W30 test file, consistency, the Store table catalog, and the W32 R0 P4 and P5 Store tests (7 files, 244 tests) pass, and `check prd` passed.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files.
- A CLI run of the whole flow in a temporary project (setup, tools save, workflow save, proof save, lifecycle start, work add, work claim, assignment start, assignment save, tools save with a new version, assignment start while drifted, and a factory URI read) gave the samples above. No output showed the claim ID.
- The related groups, counted from the full JSON report: every W29, W30, W33, and W34 test file, the Store, MCP, resource, and setup tests, the name catalog, consistency, the registry contract, the operation domains, the P3 operation surfaces, the work store contract, `cli.test.ts`, and `run-cli.test.ts`: 43 files, 1,793 tests, all pass except the two known `mcp-app-contract` failures.
- `npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report, after the review fixes and the rename: 152 test files, 150 passed and 2 failed. Of 3,575 tests, 3,566 passed, 3 failed, and 6 were skipped. The three failures are the known ones: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11. Before the rename, after the review fixes, the run had 3,574 tests with the same three failures.
- History of this phase's checks: the first full run had three more failures from this phase (the top-level help text, `factory --help`, and an unknown `factory` path still expected "no commands yet"); those tests now expect the factory commands. During the first build, setup failed for every project with "Command rule make-docs.factory.assignment.update cannot approve update." That led to register D-076, which the owner closed with the rename. After the rename, the name catalog test found that the end word `update` was no longer used, so it left the list of end words.

### Rename (Register D-076)

On 2026-11-23 the owner chose option C for register D-076: the command that moves an assignment, records a check, or records a grant use is `factory assignment save`, with the operation ID `factory.assignment.save` and the MCP tool `factory_assignment_save` (23 characters). Its behavior does not change. The name was never released, so the name catalog has no former name and no migration alias for it.

- Why: the harness access contract refuses the word `update` anywhere in a native command rule, so that no rule can approve `make-docs update`. While the command ended with that word, setup refused every project. A first workaround kept the command out of the native command rule candidates. With `save`, an approved end word, the workaround is gone: every factory command is a native command rule candidate again, and the harness access contract did not change.
- Code: the registry, the name catalog, the leaf help, the CLI adapter, the MCP tool and its `factory` profile, the service function (`factoryAssignmentSave`), and the tests use the new name. The Store service function `updateFactoryAssignment` keeps its internal name; it is no command.
- Test: "admits factory assignment save as a native command rule, and every rule passes the setup check (register D-076)" checks the rule `make-docs.factory.assignment.save` with the prefix `factory assignment save`, runs the setup check of the harness access contract on every rule, checks that no rule holds `update`, and checks that every factory operation has a rule. The MCP tests also run real setup with a generic MCP client grant, which builds and checks every rule.
- Docs: PRD 53, PRD 39 R-RUN-1, and PRD 38 have Requirement History entries "2026-11-23 — W30 R0 P3 Assignment Save". The factory design, the factory contract (template first, then the dogfood and bundled copies), the W30 R0 plan, and the P3 and P5 phase files use the new name, and the backlog index and both phase files record the rename in their Change History. PRD 52 names the command only in a Requirement History rationale, and `work-store.md` does not name it, so neither changed.
- Kept: the old name stays only in history: Requirement History and Change History lines, the W33 R0 evidence table of planned names, the W30 R0 P2 evidence and history record, and the account of the setup failure in the checks below.

### Left for a Follow-Up

- P3 T34: a command that removes a workflow, and a reviewed removal of a pruned project's workflow rows (P2 notes 1 and 2). P3 adds no removal command. Such a command must delete the workflow's backup records first, then its final assignments, refuse while an assignment is open, and run before `project_register` drops the project.
- P6 T14: the factory contract's Rule Catalog still says "Planned in W30 R0 P3" for the checks that P3 built, with a note that they are built. The W30 R0 P1 test allows only "Planned in" or "Contract-only", so the column needs a word for a built check first.
- `workflow save` checks the standard roles of the type, not the capabilities that the type's `## Roles` table lists for each role, and not the "Specialist" row of `lead-and-specialists`.
- `assignment start` checks that its lifecycle run exists and has not ended, not that it is at stage `implementation` (rule `claim-opens-run` is contract-only).
- A name that resolves to a project is read from the Store before the access check, so a caller without a grant can learn whether a project name exists.
- CLI and MCP parity is tested on every read and on a refusal of each save operation; a successful save is tested once on each surface, not compared byte for byte.

### Open for the Owner

- None. T11 passed on 2026-11-23, and register D-076 is closed.

## P4 Factory Setup Skill

Covers A26 to A32 and A64 to A66 in [P4](04-factory-setup-skill.md). Evidence date: 2026-11-23. Base commit: `2b03cb46` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. The work is uncommitted in its worktree. Every CLI and test run used a temporary `MAKE_DOCS_HOME`; nothing read or wrote the real Store.

### What Changed

The new first-party Skill `factory-setup` lives in `packages/skills/factory-setup/`. It is explicit-invocation-only (`allow_implicit_invocation: false`), and a fresh setup installs no Skill, so it is off by default. It ships Markdown and metadata only: no script and no Python.

| File | What it holds |
| --- | --- |
| `SKILL.md` | The rules that always hold, the MCP-then-CLI command table with the labeled manual path, Step 0 (CLI, Store, and project checks with each fix), the six steps, the rerun, and the finish. |
| `references/find-and-read.md` | Reuse of the machine's saved tool list and when it is current, where to look by capability, how to read each tool, tool IDs, and what not to ask. |
| `references/interview.md` | How to ask, what never to ask, the ten questions in order with their recommendations, grants and their scopes, working copies, known losses, and context kinds. |
| `references/wire-and-prove.md` | The capabilities of each role, the smallest setup and its binding, a multi-tool setup, the proof method for each catalog capability, the proof record, `factory tools save`, and a new tool version. |
| `references/save-and-test.md` | The config entry, `factory workflow save` and its refusals, the plan revision and digest in plain words, the test task, `factory proof save` and its refusals, and the rerun with each drift code in plain words. |
| `references/summary.md` | What the closing summary holds and where each fact comes from, the manual step form, and two sample summaries. |
| `agents/openai.yaml` | Display metadata and the explicit-use policy. |

Shared edits, all additive: one new entry at the end of `packages/cli/skill-registry.json`; the Skill lists in six tests and two scripts; the Skill counts and tables in `README.md`, `packages/cli/README.md`, `packages/skills/README.md`, the user guide on Skills, and the maintainer catalog page (which also gained its missing `backlog-review` row).

### How Each Task Is Met

| Task | Where |
| --- | --- |
| T1 | The Skill folder, its registry entry (purpose `workflow-execution`), and the explicit-use policy. |
| T2, A26 | `SKILL.md` Step 0: a table of each Store outcome and project refusal, what is missing, and the fix. Setup stops and saves nothing. A fixture run with no Store gets `store-unavailable` and creates no Store. |
| T3 | `find-and-read.md`: the bound tools from `factory workflow show` first, and the restored tools copy as a hint only, then the session's own tools, its MCP servers and Skills, and the instructions that name commands, by capability and by tool kind. No disk scan, no credential files, no outside service. |
| T4 | `find-and-read.md`, Read Each Tool: help, docs, MCP tool list, and Skills, recorded as catalog capability IDs. A claim is `unproved` until proved. |
| T5, A27 | `interview.md`: one decision at a time, recommendation first, at most two options, and a Never Ask list of facts setup finds itself. |
| T6 | `interview.md`, Working Copies: a repository or user rule that forbids worktrees decides `none` with no question. |
| T7 | `wire-and-prove.md`: roles get tools by proved capabilities, and each proof is `proved`, `unproved`, or `contradicted`. |
| T8, A29 | `wire-and-prove.md`, The Smallest Setup, with its binding. A fixture run uses that binding and the Skill's own config example and reaches `ready`. |
| T9 | `save-and-test.md`, Run the Test Task: intake through the front desk, a fresh builder, a fresh reviewer, the foreman's judgment, and the return through the human channel. |
| T10 | `summary.md`, Manual Steps: Do, Why, Required or Optional, Unblocks, saved with `--manual-step`. |
| T11, A31 | `save-and-test.md` and `summary.md`. The fixture runs read every summary fact from `factory workflow show`. |
| T12, A32 | `save-and-test.md`, Rerun. A fixture run changes the reviewer's tool, shows the change, gets `draft` before the new tool is proved, proves it, and reaches `ready` under a new revision. The old digest is refused with `plan-digest-mismatch`. |
| T13 | `SKILL.md`, `wire-and-prove.md`, and `summary.md`: never install, sign in, pay, or change authentication; list it as a manual step. |
| T14 | `wire-and-prove.md`, A New Tool Version. A fixture run reports version 1.1, gets `tool-version-changed`, proves again, saves, and reaches `ready`. |
| T15, A64 | `interview.md`, Known Losses, and the summary. |
| T16, A65 | `interview.md`, Grants: no grant (recommended) and `once` as the two options, with `standing` named; a `run` grant is asked for during a run. `save-and-test.md` shows the grants file and how a rerun revokes a grant. A fixture run refuses a grant without a scope, and a saved grant shows beside the plan, not in it or in the config. |
| T17, A66 | `interview.md`, Context Kinds, and `save-and-test.md` steps 2 to 5. The fixture runs save a revision, run the test task under it, and save the proof with the same digest. |
| A28, A30 | The twin test refuses product names in every Skill file. A multi-tool fixture run fills the same four roles with `tool-c` to `tool-f`, and wakes with `tool-g`. |

### Twin Test

`packages/cli/tests/w30-r0-p4-factory-setup-skill.test.ts` (24 tests after the review fixes) checks that the Skill text and the code agree:

- Bundle: the folder holds exactly the files that the registry declares; explicit use only; no script and no Python; the never-log list is named; no install, sign-in, payment, or authentication change.
- Tool-agnostic: no Skill file and no registry text names a product, a harness, a provider, a terminal or a multiplexer, a scheduler, a messaging or notification tool, or an agent delegation tool. The list of names can never be complete, and the test says so. P6 T8 still searches the shipped files.
- Interview: at most two options in one question, and the places that list the other choices.
- Commands: each of the seven setup operations has its MCP tool before its CLI command in one table row, with the right scope, and the manual path follows. Every `make-docs factory` command and `factory_*` tool that the Skill names exists, and the Skill names no assignment command. Every flag in a command example is in that command's leaf help. Every project write example names `--target-root` or `--project`, and `factory tools save` names neither.
- Codes and values: every drift code, every refusal and Store outcome that a setup step can meet, every capability ID, context kind, tool kind, tool state, proof result, grant scope, wake method, and shipped type. The proof table rows equal the capability catalog in order. The default context lists equal `FACTORY_DEFAULT_CONTEXT`.
- Rule IDs: the Skill names each contract rule whose check names W30 R0 P4, and 22 other setup rules. Every kebab-case name in the Skill's inline code is a contract rule ID, a code or value from the code, or one of five listed other names, so a code or rule ID on the Skill side only fails the test. Every one-word value and every field path in inline code must be a string value of the factory record lists, a key of a setup operation's input schema or of the config entry schema, or a key or path of a real result from the fixture runs, or one of nine listed other words. Planted `halted`, `webhook`, and `binding.revisionVersion` fail.
- The Skill's example config entry passes the config check, has the four standard roles, and holds no grant, tool ID, or path.
- Fixture runs: A26, a write with no project (`project-missing`, nothing saved), A29 with A66, A30 with A65, A32, T14, a grant-only save that adds and revokes grants with the Skill's own grants file, a grant with no scope, and the two sample summaries (A31, A64).

A planted typo (`tool-mising`), planted product names, and the three planted names above each made the test fail, and each was removed.

### Choices Made in This Phase

Each item is new behavior that no authority fixed.

- The test task adds no work unit and no assignment record, because `factory assignment start` needs a `ready` workflow. It runs through the bound tools with a scratch file that it removes.
- The smallest setup and the examples bind a `front-desk` role in the config, so the summary names a tool for it. With "wait in session", it needs only `read-write-files`; with a messaging channel, `message-person` and `receive-answer`.
- A tool that reports no version is a known loss, because the factory cannot see when it changes.
- Setup recommends no grant first, then `once`, then `standing`, and asks for a `run` grant only during a run, because a run does not exist at setup.
- A scheduled wake is recommended every 10 minutes, under the 30-minute claim limit.
- Setup does not run the test task until each known loss is accepted or fixed.
- The default workflow name is `main`.

### Sample Closing Summary (Guided Progress Review, Passed)

On 2026-11-24 the owner reviewed the setup interview and this closing summary, and found both clear (option A). The Guided Progress Review of P4 passed with no change.

This is the smallest-setup sample from `references/summary.md`, with neutral placeholders. The multi-tool sample is in the same file.

```text
Factory setup for project <project> is done. Workflow main is ready: it can take new work.

Roles. Tool A (version 1.0) fills every role: it is the front desk and the foreman, and it starts a fresh helper agent for each builder and each reviewer. A reviewer is never the agent that built the work. All five capabilities that these roles need are proved.

Wake. No tool can wake on its own. The factory runs only while you keep a session open. To run it, ask for the factory in a session.

Human channel. Wait in session: when the factory needs a decision, it asks you in the chat and waits for you.

Test task. Tool A took a small request, a fresh builder wrote one line, a separate fresh reviewer checked it, and the result came back to you. It passed under plan revision 1 (digest starting aed0828d14c8, a short fingerprint of the exact saved plan). No capability stays unproved.

Known losses you accepted.
- No tool can wake on its own, so the factory runs only while a session is open.
- The file proof did not test files outside the project.

Grants. None. The factory asks you before each merge, deploy, publish, or payment.

Open manual steps. None.

Next. Ask for the factory skill to run work. Check the factory at any time with make-docs factory status --target-root <checkout>.
```

The interview questions of the same review are in `references/interview.md`, The Questions, with one example question.

### Checks

All runs used the built CLI where a CLI ran, and a temporary `MAKE_DOCS_HOME`.

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-p4-factory-setup-skill.test.ts`: 20 tests pass; 24 after the review fixes.
- Skill tests (`embedded-skills`, `skill-catalog`, `skill-registry`, `w34-r0-p4-skill-scripts-guard`, `skills-ui`, `wizard`, `w34-r0-p2-skill-check-twins`): 105 tests pass. After the review fixes, these with the P4 test and `consistency`: 9 files, 167 tests pass. tsc, the build, `validate:defaults` (53 tests), and `project markdown validate` on the Skill and the W30 backlog (14 files, no findings) pass again.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project markdown validate --path packages/skills/factory-setup`: 6 files, no findings.
- A CLI run of the smallest setup in a temporary project (setup, tools save, workflow save, proof save, a grant save, and workflow show) gave the outputs that the Skill describes. It found that a later `proof save` needs `--expected-version`, so the Skill now names `proofs.passed.version` from `workflow show`.
- Full suite: `npx vitest run --reporter=json` in `packages/cli`, counted from the JSON report: 153 test files; of 3,597 tests, 3,587 passed, 4 failed, and 6 were skipped. Three failures are the known ones: `mcp-app-contract` (two tests, a Node v26 deprecation warning on stderr) and `p5-migration-safety` fixture 11. The fourth was this phase's: a `cli.test.ts` test that lists the valid Skill names in its refusal message. It now lists `factory-setup` and passes. After that fix, the test "routes reconfigure skill scope and selected-name changes without changing Skills" passed in the full run (9.8 s) but hit its own 15 s limit in three runs alone (16 to 23 s). It also hit the limit with this phase's registry entry removed, so it is the known timeout and not caused by this phase.

### Review Fixes

An independent review of P4 on 2026-11-23 found no broken code and eight items in the text and the test. Each is fixed, except item 8, which is a P3 follow-up.

| Item | Fix |
| --- | --- |
| 1 (MEDIUM). Setup decided from the `.make-docs/factory/tools.md` copy, which can be out of date and has no record version. | `find-and-read.md`: decide from `factory workflow show` for bound tools. For the other tools, run `factory restore --target-root <checkout>` first and use the copy as a hint only: never decide from it, never copy a proof from it, and never take an `expectedVersion` from it. Prove every tool that no workflow binds before you save it. The owner is deciding on a `factory tools list` read; it is not built. |
| 2 (MEDIUM). The grants file had no shape. | `save-and-test.md` shows the `add` and `revoke` lists in one JSON example, says where `grantId` and `expectedVersion` come from, how a rerun revokes and adds grants, and that a grant-only save needs no new test task. A CLI run and a fixture run use that shape. |
| 3 (MEDIUM). Some questions showed three or more options. | `SKILL.md` and `interview.md` show at most two options: the recommendation and the one best other choice, then say that more exist and where to see them. The workflow type, the human channel, the wake method, a role's tool, the grant scope, and the fix for a loss that is not accepted follow it. |
| 4 (LOW). The twin test checked only hyphenated names. | It also checks one-word values and field paths against the code and real results. |
| 5 (LOW). The product name list missed some messaging and terminal names. | The list is wider, and a comment says that it can never be complete. |
| 6 (LOW). "Read the saved record again" had no command. | `wire-and-prove.md`: use the version that the refusal names (`details.currentVersion`), and never the copy. |
| 7 (LOW). A `store-not-configured` row cannot occur for a factory call. | It is merged into the `store-denied` row in `SKILL.md` Step 0. |
| 8 (LOW). The CLI accepts an email address in `grantedBy`. | Not fixed here: a P3 follow-up below. |

### Left for a Follow-Up

- No command reads the machine's tool list with its record versions. Setup uses the `.make-docs/factory/tools.md` copy as a hint only, after a restore, and a `version-conflict` refusal names the current version. The owner is deciding whether to add a `factory tools list` read.
- P3 follow-up: `factory workflow save` accepts an email address in a grant's `grantedBy` (a CLI run saved `someone@example.com`). The Skill asks for a short label and never an account or an email address, but the CLI does not check it.
- This repository's installed dogfood Skill copies under `.agents/skills/` do not include `factory-setup` yet. Installing it needs `make-docs setup skills`, which writes the real Store, so this phase did not do it.

### Open for the Owner

- None for the Guided Progress Review. It passed on 2026-11-24: the owner found the setup interview and the closing summary clear (option A), with no change.

## P5 Factory Run Skill and Handoffs

Covers A33 to A42, A67 to A69, A81, and A82 in [P5](05-factory-run-skill-and-handoffs.md). Evidence date: 2026-11-23. Base commit: `2b03cb46` on `docs/w29-w30-work-store-and-factory`. The work is uncommitted in its worktree. Every CLI and test run used a temporary `MAKE_DOCS_HOME`; nothing read or wrote the real Store. P4 ran in parallel in another worktree, so this phase did not touch `packages/skills/factory-setup/`.

### What Changed

- The `factory` Skill (`packages/skills/factory/`, and its installed copy `.agents/skills/factory/`) is new text. `SKILL.md` names the project, loads the workflow, its type, and the factory contract, refuses a workflow that is not `ready` with the fix for each state, and lists the six loop steps. Three references replace the profiles, the old Store reference, and the old work methods: `references/run-loop.md` (each loop step with its CLI command and MCP tool, `unknown` assignments, the claim time, takeover, the move table, the status history codes, more rounds after the limit, the accept and close order, actions outside the default authority, claim sizes, parts, quick items, preflight, and a wave from backlog review), `references/working-rules.md` (judging, separate review, context kinds, the never-log list, claim IDs, plan revisions and drift codes, grant scopes and grant uses, refusal codes, capability IDs, files and working copies, and backups outside git), and `references/messages.md` (the floor, the message rules, the escalation form with two examples, project refusals, the acceptance request, and the status report). The Skill names no tool, vendor, or product. `agents/openai.yaml` keeps `allow_implicit_invocation: false`.
- The registry entry of `factory` lists the three new references. Its description did not change. No other Skill entry changed.
- The escalation floor in config (T11, A38): an `escalations` entry can only add an event, and nothing in the config can remove a floor event. The schema already refuses every unknown workflow key. A workflow key about the floor or escalations, such as `skipEscalations`, `escalationFloor`, or `disabledEvents`, now gets a plain message: the five floor events always reach the person, and a workflow can only add events. `workflow save` then refuses, because the config is not valid. The first build also refused an `escalations` entry by its first word, such as "Skip". The review found that this refused valid added events and missed real tries, so that check is gone.
- The backlog review handoff (T13 to T15): `backlog snapshot --factory` (MCP `factory: true`) adds a `factory` key with the ready workflows and the project, only when a workflow of the project is `ready` in a bound checkout with a usable Store. The readiness comes from the same live plan as `factory status`. In every other case the snapshot is the same as without the option. The key is a routing fact, so it changes no snapshot or model identity, and a refresh keeps working. With the key, "Work on this wave" in the live app and the copied Work prompt of the static report name the project ("in project aurora", or the project ID when the project has no name) and ask the agent to use the `factory` Skill and to hand the wave to the front desk of the ready workflow. Without it, both are byte for byte as before. The key's project and workflow names have a fixed form, so no project prose enters the message. The backlog review Skill asks for the key, runs the snapshot again without the option when an older CLI refuses it, and takes the project from the key.
- PRD 51: R-BACKLOG-SNAPSHOT-1, -13, and -24 name the option, and new R-BACKLOG-SNAPSHOT-34 states the `factory` key. A Requirement History entry marks it new behavior, which the owner approved on 2026-11-23 (option A).
- `README.md` and `packages/cli/README.md` no longer say that `factory` has no commands, and the root README's Skill row describes the run Skill.
- Regenerated: `packages/cli/src/mcp/widget/static-renderer.js`, `packages/cli/src/mcp/assets/backlog-review-v1.html` and `.ts` (`node packages/cli/scripts/build-mcp-app-assets.mjs`), and `packages/skills/backlog-review/scripts/agent-contract.mjs` and `report-contract.mjs` (`node packages/cli/scripts/build-backlog-presentation.mjs --all`). The byte-match tests pass.

### How Each Task Is Met

| Task | How |
| --- | --- |
| T1 | `SKILL.md` "Load the workflow": read the workflow with `factory workflow show`, its type, and the contract; refuse any state but `ready`, with the fix for `draft`, `wired`, `drifted`, and no workflow. |
| T2 | `profiles.md`, `store.md`, and `work-methods.md` are gone. The Skill runs only when it is named. |
| T3 | `SKILL.md` "Run the loop" and `run-loop.md` steps 1 to 6, in the contract's order. |
| T4 | `run-loop.md` step 5: claim at the plan's claim size, the default `phase`; one `lifecycle start --stage implementation` for each claim; evidence through `work evidence record` and `lifecycle attach-evidence`. |
| T5 | `run-loop.md` step 2: settle `unknown` first through the handle; send again only when the job never started, after the move to `offered`; a takeover, also of your own expired claim, names the old claim's handle check and a new task handle. |
| T6 | `run-loop.md` "Quick Items": `work add`, then route by capability. |
| T7 | `run-loop.md` step 5: run `preflight` only when the plan turns the step on. |
| T8 | `working-rules.md` "Judge and Review", and `run-loop.md` "Correct" (a repeated failure stops before the limit). |
| T9 | `working-rules.md` "Files and Working Copies"; `run-loop.md` step 4 closes the unit, then integrates it. |
| T10 | Met since the follow-up of 2026-11-23. Before a worker changes a file in a folder without git, the Skill saves a backup with `make-docs factory file-backup save`. The interim rule to stop and ask is removed. See [Follow-Up Commands](#follow-up-commands). At the P5 merge it was not met, because no command recorded a backup. |
| T11 | `messages.md`: the five floor events, added events, the message parts, and the form; nothing in config can remove a floor event (A38). |
| T12 | `run-loop.md` step 4 and `messages.md` "Acceptance Request": accept each unit on the reviewer's evidence, and send one request at the end of the scope. A merge or deploy of a unit records its grant use in the same save that accepts the builder's assignment. |
| T13 to T15 | The snapshot option, the two message routes with the project named, the Skill text, PRD 51, and the regenerated assets above. |
| T16 | `run-loop.md` "Status Moves" (the table is the code's table), "Correct" (`round-limit-reached` escalates floor event 3), and "More Rounds After the Limit" (a `once` grant, the old assignment `cancelled`, a new start with `--reset-rounds`). |
| T17 | `run-loop.md` "Start a Job" (part labels), "An Expired Claim" (load the named revision, the same round count), and `working-rules.md` "Plan Revisions" (a drift code table). |
| T18 | `run-loop.md` "An Action Outside the Default Authority" and `working-rules.md` "Grants": record the use on an open assignment, ask again on a refusal, record the answer with a grant-only `workflow save`, then save again with the use. |
| T19 | `working-rules.md` "Context for Each Role", "Never Log", and "Claim IDs"; a reason code on each move. |
| T20 | `SKILL.md` "Name the project": `--project` or `--target-root` on every factory call, the checkout path on every work and lifecycle call, and the project refusals stop the call. |
| T21 | `SKILL.md` and `messages.md`: every message form starts with the project name, and a project refusal names the project of the run. |

### Twin Test

`packages/cli/tests/w30-r0-p5-factory-run-skill-and-handoffs.test.ts` has one checker, `twinProblems`, that compares each list and table of the Skill with the code both ways: the found values must equal the code's values, in order, so a missing value and an extra value both fail.

| Skill list or table | Code |
| --- | --- |
| Status history codes (`run-loop.md`) | `FACTORY_STATUS_HISTORY_CODES` |
| Drift codes (`working-rules.md`) | `FACTORY_DRIFT_CODES` |
| Refusal codes (`working-rules.md`) | `FACTORY_REFUSAL_CODES` |
| Project refusal codes (`messages.md`) | the `project-` codes of `FACTORY_REFUSAL_CODES` |
| Grant scopes (`working-rules.md`) | `FACTORY_GRANT_SCOPES` |
| The reset action | `FACTORY_RESET_ROUNDS_ACTION` |
| Claim sizes and the default (`run-loop.md`) | `FACTORY_CLAIM_SIZES` and the config default |
| `--handle` values (`run-loop.md`) | `WORK_HANDLE_OBSERVATIONS` |
| Capability IDs (`working-rules.md`) | `FACTORY_CAPABILITY_IDS` |
| Claim time (`run-loop.md`) | `WORK_CLAIM_POLICY` |
| The move table (`run-loop.md`) | `FACTORY_STATUS_MOVES` |
| Builder and reviewer context, and the context kinds | `FACTORY_DEFAULT_CONTEXT` and `FACTORY_CONTEXT_KINDS` |
| Each `--reason` and "reason" code | `FACTORY_STATUS_HISTORY_CODES` |
| Each `make-docs` command with placeholders | a current admitted command; each flag is in its leaf help, and each required flag of its leaf usage is given |
| Each MCP tool name | a current MCP name |

A second test plants 19 misses in a copy of the Skill text, one for each kind above and more: a missing or extra history code, a renamed drift code, a missing or extra refusal code, a renamed project refusal, a missing grant scope, a renamed reset action, a missing claim size, a changed default claim size, a missing handle value, a missing capability, a changed claim time, a changed move, an extra context kind, a missing required flag, an unknown flag, an unknown reason, and an unknown command. The checker finds each one. Other tests check that every Rule Catalog row whose check names W30 R0 P5 is named in the run Skill or the backlog review Skill, that every rule ID they name is in the catalog, and that every factory, work, and lifecycle command names the project or the checkout.

The first build checked only that the Skill named each code that the code has, and that the codes it named exist. It did not compare each list both ways, did not check grant scopes, claim sizes, handle values, capability IDs, the claim time, or required flags, and did not test planted misses. The review found that; this section replaces that claim.

### Fixture Runs

The same test file drives the real operations as the run Skill says, from a folder that is not the project, with `tool-a` and `tool-b`:

| Case | Shows |
| --- | --- |
| A33 | A `wired` workflow names the test task step, and `assignment start` refuses with `not-ready`. |
| A34, A81 | One unit completes with each of the three types: builder, separate reviewer on `tool-b`, accept, and close. `lead-and-specialists` runs the parts `research` and `draft` as separate jobs. Every factory call names the project, every work call names the checkout, and no factory or lifecycle record holds the claim ID. |
| `factory-assignment-open` | `work close` refuses while an assignment is open. |
| A35 | After a lost reply, the assignment is `unknown`, a second start is refused with `assignment-open`, and the handle check moves it to `running`. One builder job exists. |
| A36, A67 | After the claim time, a takeover with the old handle seen as `running` is refused, and one with `stopped` works. The new foreman loads revision 1 and goes on at round 1. The old claim ID is refused. The new foreman then takes over its own expired claim from itself, with a new task handle. |
| Task handle at takeover | A takeover without `--task-handle` works, but the next takeover is refused because no handle is left to check. |
| A37, A67, T16 | With a round limit of 1, the second correction is refused with `round-limit-reached`, and the escalation has all six parts. After the person allows more rounds: a `once` grant for `reset-correction-rounds`, the old assignment `cancelled` with `round-limit-reached`, and a new start with `--reset-rounds` at round 0. The grant is spent, so a second reset is refused. |
| A68, T18 | Unit 1 is accepted and merged in one save with a `once` merge grant, which is spent. A grant use after the accept is refused with `final-status`, and after the close with `claim-not-held`. For unit 2, the accept with the grant use is refused with `grant-spent`, the assignment stays `in-review`, and the person is asked again. After a grant-only save, the same accept works. Two merges happen, each with a recorded use. |
| A69 | The plan lists the reviewer's context kinds, without `builder-summary`. A task handle that holds a key is refused with `never-log-field`, and the value is in no result and no record. |
| A82 | `assignment start` with no project is refused with `project-missing`, names both ways to name a project, and changes nothing. |
| A38 | Three workflow keys that try to change the floor are refused with the floor message, and `workflow save` refuses. Another unknown key is refused too. `escalations` entries, whatever their words, are accepted as added events. |
| A41, A42 | The snapshot has the `factory` key only with a ready workflow; the identities do not change; the live message and the static prompt name the project, the `factory` Skill, and the workflow with the key, and are unchanged without it; a message for one route does not resolve against an open of the other. |

### Guided Progress Review Samples (Passed)

On 2026-11-24 the owner reviewed the escalation message and the acceptance request below, and found both clear (option A). The Guided Progress Review of P5 passed with no change.

These are the forms from `references/messages.md`, filled for a fixture project. Project `aurora`, workflow `ship`, and the units are placeholders.

A correction loop at its limit (floor event 3):

```text
Project aurora: the fix for phase 3 stopped after 3 correction rounds.

What happened: The reviewer found the same defect three times. The export still drops the last row of the data file. The CLI refused a fourth round (code round-limit-reached: the job used its limit of correction rounds).
What I need: Choose one: allow 3 more rounds, or change the requirement for the last row.
Required or optional: Required. The factory cannot accept phase 3 without it.
What it blocks: Phase 3, and phase 4, which needs the export.
After you answer: The factory sends the defect back with your choice, or records the new requirement. Then it reviews the fix again.
```

The acceptance request at the end of a wave (floor event 5):

```text
Project aurora: wave W7 R0 is ready for you to accept.

What happened: The factory finished wave W7 R0. A separate reviewer checked each unit against its requirements.
- Phase 1: the export writes every row of the data file. Correction rounds: 1. Evidence: docs/work/2042-06-01-w7-r0-export/evidence.md#p1.
- Phase 2: the summary matches each number in the data file. Correction rounds: 0. Evidence: docs/work/2042-06-01-w7-r0-export/evidence.md#p2.
Open limits: none.
What I need: Accept the result, or name what to change.
Required or optional: Required. The work is reviewed, but it is not accepted until you accept it.
What it blocks: Wave W8 R0, which waits for this wave.
After you answer: On accept, the factory records your answer and ends the run. On a change, it opens the change as new work and tells you the plan.
```

### Choices Made in This Phase

Each item is new behavior that no authority fixed.

- A reviewer job is its own assignment for the same unit and part. Its review moves `returned`, then `in-review` while the foreman checks that the review covers the actual result, then `accepted` with `review-passed` or `defects-found`.
- The foreman records an assignment before it starts the job, so a lost reply leaves an `unknown` record to check, never a job with no record.
- The merge or deploy of one unit records its grant use in the same save that accepts the builder's assignment. The CLI makes the move and the use one write, so a refused grant leaves the assignment `in-review`.
- The snapshot option is `--factory` (MCP `factory: true`), and the key is `factory`, with `readyWorkflows` and `project`. The key is left out of the snapshot and model identity.
- With two or more ready workflows, the Work message names them all and asks the person to choose.
- The Work message names the project by its name, or by its ID when it has no name. Both have a fixed form.
- A workflow key about the floor or escalations gets the floor message in place of the plain unknown-key refusal.

### P5 Review Fixes

An independent review of P5 on 2026-11-23 found ten items. Each fix has a test in the P5 test file.

| Item | Fix |
| --- | --- |
| 1 (HIGH). A grant use after the accept is refused with `final-status`, and after the close with `claim-not-held`. | The merge or deploy of a unit records its grant use in the same save that accepts the builder's assignment. A refused grant leaves it `in-review`. The end-of-scope case is a follow-up: grant use on the claim (owner-approved 2026-11-23). Until it lands, the Skill asks the person and does not act there. |
| 2 (MEDIUM). The handoff message said "in this project". | The live message and the static prompt name the project from the key. The backlog review Skill takes the project from the key. |
| 3 (MEDIUM). The twin test did not compare each list both ways. | One checker compares 15 kinds of lists and tables both ways, and a test plants 19 misses. |
| 4 (MEDIUM). The Skill did not say how to go on after the person allows more rounds. | A `once` grant, the old assignment `cancelled` with `round-limit-reached`, and a new start with `--reset-rounds`, tested against the operations. |
| 5 (MEDIUM). PRD 51 did not name the option. | R-BACKLOG-SNAPSHOT-1, -13, -24, and new -34, with Requirement History. The owner approved them on 2026-11-23. |
| 6 (LOW-MEDIUM). An older CLI refuses `--factory`. | The backlog review Skill runs the snapshot again without the option. |
| 7 (LOW). Takeover and order details. | A takeover gives a new `--task-handle` and names the old claim's handle check; your own expired claim is taken over from yourself; an `unknown` job that never started moves to `offered`, not a new start; the unit closes, then integrates; a project refusal message names the project. |
| 8. The entry-word check refused valid added events. | Removed. An `escalations` entry only adds an event; only keys get the floor message. |
| 9. The READMEs said `factory` has no commands. | Fixed in `README.md` and `packages/cli/README.md`. |
| 10. T10. | The Skill stops before any builder job in a folder without git, asks, and records the answer in a `work report --note`. T10 stays open. |

### Checks

All runs used the built CLI where a CLI ran, and a temporary `MAKE_DOCS_HOME`.

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass, with the app asset check.
- `npx vitest run tests/w30-r0-p5-factory-run-skill-and-handoffs.test.ts`: 29 tests pass, with the 19 planted misses found.
- The backlog review, bundle byte-match, app, snapshot, Skill registry, embedded Skill, Skill catalog, wizard, consistency, leaf help, name catalog, work store, CLI, and every W29 and W30 test file (37 files, 1,266 tests): all pass except the two known `mcp-app-contract` tests.
- `npm run validate:defaults`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project markdown validate` on the changed Skill files, the installed copy, the backlog review Skill, the W30 work folder, PRD 51, and both READMEs: one finding, at PRD 51 line 228, which was there at the base commit.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 153 test files and 3,605 tests; 3,594 passed, 5 failed, 6 skipped. Three are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11. `w19-r5-skills-command` is the known flaky test. `embedded-skills` failed once because the Skill text was edited while the run went on, after the last build. After a new build, those two files and the P5, Skill registry, Skill catalog, and backlog app files pass (7 files, 195 tests).

### Owner Decisions (2026-11-23)

- `backlog snapshot --factory` and the `factory` key: approved (option A). PRD 51 R-BACKLOG-SNAPSHOT-1, -13, -24, and -34 are owner-approved new behavior.
- Follow-up: grant use on the claim (owner-approved 2026-11-23, option A). The CLI will let a grant use be recorded on the live claim with no open assignment, for an action after the person accepts the whole scope. This phase does not build it. A follow-up builder adds it after the merge, together with `factory tools list` and `factory backup save`, and then updates the Skill text. Until then, the Skill asks the person and takes no action outside the default authority without a recorded grant use.
- T10: `factory backup save` comes in that same follow-up. T10 stays open until then.
- Vendor names: the owner accepted one exception to the no-vendor-names rule. The packaging file `agents/openai.yaml` keeps the name that the packaging requires. Its contents stay product-neutral, and the tool-agnostic test reads them.

### Open for the Owner

- None for the Guided Progress Review. It passed on 2026-11-24: the owner found the escalation message and the acceptance request clear (option A), with no change.

### P4 and P5 Integration

- P4 merged first, then P5. Conflicts in the root README and this report were settled by hand: the README keeps the P5 `factory` row and the P4 `factory-setup` row, and this report keeps both sections, P4 then P5.
- One P4 sentence in `packages/skills/factory-setup/references/interview.md` said that Make Docs backs up a file before a worker changes it outside git. No command does that yet, so it now says that the run Skill stops and asks first.
- Full suite after the merge, counted from the JSON reporter: 3630 tests, 3615 passed, 6 skipped, 9 failed: the 3 known failures (`mcp-app-contract` 2, `w19-r5-skills-command` 1) and 6 P5 tests that read a hidden local harness folder inside the Skill `references/` folder of this checkout. The P5 test now skips hidden entries, and the P4, P5, and embedded Skill tests pass (85 of 85).
- Owner-approved follow-ups (2026-11-23), built after this merge: `factory tools list`, `factory backup save` (P5 T10), and a grant use on the live claim with no open assignment. The owner's Guided Progress Reviews for P4 and P5 were open then. Both passed on 2026-11-24.

## Follow-Up Commands

Built on 2026-11-23 after the P4 and P5 merge, at the owner's three decisions of that day. All of it is new behavior. The backlog tasks are [P6](06-proofs-and-acceptance.md) T16 to T18, because P3 is completed and stays closed. This section also closes [P5](05-factory-run-skill-and-handoffs.md) T10.

### The Three Commands

| Command | MCP tool | Scope | Kind | Access |
| --- | --- | --- | --- | --- |
| `make-docs factory tools list` | `factory_tools_list` (18 characters) | This machine. It takes no project. | Read | Store read. No project access. |
| `make-docs factory file-backup save` | `factory_file_backup_save` (24 characters) | One project, named with `--target-root` or `--project`. It needs one checkout. | Write | Store write and project write. |
| `make-docs factory grant-use record` | `factory_grant_use_record` (24 characters) | One project, named with `--target-root` or `--project`. | Write | Store write and project read. |

All three are in the `factory` MCP profile and in `all`. Setup admits each one as a native command rule.

### Names (Register D-077, Closed)

The owner named the backup command `factory backup save` (MCP `factory_backup_save`) and gave `factory grant use` as an example. Neither name passes the existing rules:

- The harness access contract refuses the word `backup` anywhere in a native command rule, as it refuses `update` (register D-076). With `factory backup save` as a command rule candidate, the setup check failed: "Command rule make-docs.factory.backup.save cannot approve backup."
- PRD 39 R-NAME-2 needs an approved end word, and `use` is not one.

The build follows the D-076 precedent, option C: it picks names that the rules admit, and it changes neither the harness access contract nor the approved end words. The names are `factory file-backup save` and `factory grant-use record`. They are not released, so a later rename needs no former-name alias. Register D-077 holds the question and the options. On 2026-11-24 the owner chose option A and kept both names, and D-077 is closed.

### What Each Command Does

- `factory tools list` (R-FACTORY-69) reads the saved tools of this machine in a read-only Store session. It shows each tool with its kind, label, state, reported version, and record version, and each capability proof with its tool version, time, result, and "does not cover" list. The record version is the `expectedVersion` of the next `factory tools save`. Its output ends with "Changes nothing." With no Store, it returns `store-unavailable` and creates no Store. It shows only saved record fields, and each of them passed the never-log check at the save.
- `factory file-backup save` (R-FACTORY-70) takes an open assignment, one or more `--file` paths, and the private claim ID. Outside git, it copies each file to `.make-docs/backup/factory/<assignment>/` through the P2 function `backupFactoryFileBeforeChange`, and records the file, its hash, and its assignment. The first backup of a file for an assignment stays. A file that does not exist yet needs no backup. Every file of one call is backed up, or none is: a refused call rolls the records back and removes the copies that it made.
- In a folder with git, `factory file-backup save` returns the result `not-needed` with exit code 0, and changes nothing. It is not a refusal. The reasons: PRD 53 R-FACTORY-44 gives the backup rule only for a folder without git; the P2 function already treats git as an outcome and not as an error; a new refusal would need a new reason code, and the foreman did nothing wrong; and one call tells the foreman whether the folder uses git.
- `factory grant-use record` (R-FACTORY-71) records a grant use on the live claim of a unit that has no open assignment.

### The Design of the Grant Use on the Claim

The owner asked for the smallest safe form. The choices:

- A separate command, not an option on `factory assignment save`. That command needs an assignment ID and an assignment version, and a final assignment never changes. An option there would need a second input shape with no assignment.
- The call names the unit, the workflow, the action, and the lifecycle run, and gives the private claim ID. The Store service checks, in one transaction: the unit is in the project; the caller holds the unit's live claim (`claim-not-held`); no assignment of the unit is open (`assignment-open`, with the next step to use `factory assignment save --grant-use`); and one assignment of the unit ran under the named workflow and lifecycle run (`record-not-found`). The last check means that a run grant can never be used through a mistyped run or a unit that never ran a job.
- The grant checks are the same function, `useFactoryGrant`, that `factory assignment save` calls. So the scope, the expiry, the spend of a `once` grant, the order of grants, and the refusal codes `grant-missing`, `grant-out-of-scope`, `grant-spent`, and `grant-expired` are the same on both paths.
- The record of a use: the owner asked for the action, the grant, the lifecycle run, and the time, with no content. The grant row already holds the action and the grant ID. The first build kept only the last use, in two columns of `factory_grants`. On 2026-11-24 the owner chose a full history instead, so each use now adds one row to `factory_grant_uses`, and the two columns are removed. See [Grant-Use History](#grant-use-history).
- A use changes the grant itself only when it spends a `once` grant. A use of a `standing` or a `run` grant no longer changes the grant, so it does not raise its record version. This replaces review fix 7 below.
- Schema v9 is not released. Its `factory_grants` statement changed in place, with no new schema version. The lead decided on 2026-11-24 to keep this in-place change. The reason: schema versions 7 to 9 exist only on this unreleased branch, and the owner's real Store is at schema 6 from the released 2.0.9. A temporary Store that an older commit of this branch built is not a supported state. PRD 38, the column register, and the table catalog state the tables and columns, and the R-MIN parity test passes.
- The end of a scope: after a unit closes, its claim is gone. So the run Skill keeps the claim of the unit that the action belongs to, and for an action on the whole scope that is the last unit of the scope. It accepts the unit's assignments, does not close the unit, sends the acceptance request, records the grant use after the person accepts, does the action, and then closes the unit and completes its lifecycle run.

### Skill Changes

- `factory-setup` (`SKILL.md`, `references/find-and-read.md`, `references/wire-and-prove.md`, `references/interview.md`): the Skill reads the saved tools with `factory tools list`, decides from that read, and takes each `expectedVersion` from it. The `tools.md` copy is no longer a hint: the Skill never uses it as a source. The command table has the new machine read. The working-copy text says that the run Skill saves a backup before a worker changes a file outside git.
- `factory` (`SKILL.md`, `references/run-loop.md`, `references/working-rules.md`), with the installed copy in `.agents/skills/factory/` identical: a new step in "Start a Job" saves the backups before a builder job outside git. "Backups Outside Git" gives the steps and the result words, and the interim rule to stop and ask the person is gone, with the sentence that no command saves a backup. The foreman lists the files from the unit record, the requirements, and the defect list, and the brief tells the builder to name any other file before it changes that file. The builder never gets the claim ID. A new section, "An Action at the End of the Scope", gives the end-of-scope steps, and the blocked follow-up text is gone from all three files.

### Tests

`packages/cli/tests/w30-r0-follow-up-commands.test.ts` has 25 tests, with the four tests of the review fixes and the tests of the grant-use history:

- Registry and names: the three IDs, CLI paths, MCP names of at most 26 characters, the `factory` profile, leaf help, scope, and access. Each command is a native command rule, the setup check passes for every rule, no rule holds a refused word, and a rule named `factory backup save` fails the setup check.
- `factory tools list`: the tools, proofs, and record versions; the same answer from any folder; no project input; "Changes nothing."; no change to the Store; the record version works as `expectedVersion`; with no Store, `store-unavailable` and no Store folder; no never-log content.
- `factory file-backup save`: the copy, the record, the folder note and its `.gitignore`; the first backup stays; cleanup on accept; `not-needed` with git; nine refusals that change nothing and leave no copy; a final assignment; another checkout; no file contents and no claim ID in a result or a record.
- `factory grant-use record`: each grant refusal code; a `once` grant spent once; a `run` grant kept to its own run; an expired grant; the use rows; the first use row; `assignment-open`; nine other refusals that change nothing; a claim that ran out; no claim ID in any output or record; and the same use row through `factory assignment save`.
- The Skills: the run Skill names both commands and holds no interim text, the installed copy is identical, and a run of the end-of-scope steps works: accept, keep the claim, record the use, close, and then `claim-not-held`.
- CLI and MCP parity through the built CLI and a granted MCP connection: the read is equal, each refusal is equal, a refusal exits 1, and no output holds a claim ID.

Changed tests: the P4 Skill twin test (the setup commands now include `factory.tools.list`, and the hint test checks the new read), the P2 R-MIN parity list, and the lists and counts of operations and MCP tools in `name-catalog`, `mcp`, `mcp-profiles`, `mcp-derivation`, `operation-domains`, `registry-contract`, and `p3-operation-surfaces`.

### Checks

All runs used the built CLI where a CLI ran, and a temporary `MAKE_DOCS_HOME`. No run read or wrote the real Store.

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-follow-up-commands.test.ts`: 25 tests pass.
- The P2, P3, P4, and P5 factory tests, the name catalog, the W33 tests, the leaf help, the MCP tests, the registry tests, the Skill registry and embedded Skill tests, and the consistency tests: all pass in the full run below, except the two known `mcp-app-contract` tests.
- `npm run validate:defaults`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files.
- `project markdown validate` on both Skills, the installed copy of the run Skill, the W30 work folder, the contract template, the factory design, the register, and PRD 25, 38, 39, and 53: no finding in the Skills, the work folder, the contract, the design, or PRD 53. It gives 34 findings in the register and PRD 25, 38, and 39. None of them is in a line that this work changed.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 155 test files and 3,670 tests; 3,661 passed, 3 failed, 6 skipped. This is the run after the review fixes and the grant-use history of 2026-11-24. The three are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11. `w19-r5-skills-command` passed in this run.

### Guided Progress Reviews (2026-11-24)

The owner's Guided Progress Reviews of P4 and P5 passed on 2026-11-24 (option A), with no change. The P4 and P5 sections above record it, and both phase files are `completed`. P5 has no open task: T10 is done through `factory file-backup save`.

### Follow-Up Review Fixes (2026-11-24)

An independent review found the commands good overall, with seven fixes. All are done.

| Finding | Fix |
| --- | --- |
| 2 (MEDIUM). A refused file backup left the backup folder behind when the call created the folder and made no copy. A refusal could show a raw system error or an absolute path. | A refused call removes what it created, also with no copy. The backup function gives its own plain message for each file that it cannot back up, with the path inside the checkout. Any other error gets one plain line. A test uses an unreadable file. |
| 3 (MEDIUM). The rollback removed the whole folder. | A refused call removes only its own copies. It removes the folder only when it created the folder and the folder holds just `README.md` and `.gitignore`. A test runs two calls and a second job, and the first backup stays. |
| 4 (LOW). A broken symbolic link was read as "no file". | The backup function looks at the path itself first and refuses a symbolic link, also a broken one, and a path through a linked folder. A test covers the three cases. |
| 5 (LOW). The Skill assumed that a tool can pause a worker. | The builder stops and returns the names of the files that it still must change. The foreman saves the backups and runs the job again, and the assignment stays `running`. A file that a command changes, such as a formatter, counts too. The source and the installed copy are identical. |
| 6 (LOW). A CLI call with no `--file` gave a schema error. | The CLI says: "`factory file-backup save` names no file. Give --file <path>." |
| 7 (LOW). No text said that each grant use raises the record version. | PRD 53 R-FACTORY-71, the contract, and the run Skill said so at first. The grant-use history of 2026-11-24 then removed the cause: a use of a `standing` or a `run` grant no longer changes the grant, so its version does not rise. The texts now say that. |
| 8 (COSMETIC). `factory tools list` printed two periods after a proof method. | The line drops the period at the end of the method. |

### Owner Decisions (2026-11-24)

- Register D-077: option A. The names `factory file-backup save` and `factory grant-use record` stay, and D-077 is closed.
- The Guided Progress Reviews of P4 and P5 passed (option A), with no change.

- The record of a grant use: option B, a full history of uses. See [Grant-Use History](#grant-use-history).

### Grant-Use History

The owner first chose to keep the last use only. The reviewer then found an audit gap: a second use of a `standing` or a `run` grant replaced the record of the first use. On 2026-11-24 the owner chose option B, one row for each use. This is new behavior, and it is [P6](06-proofs-and-acceptance.md) T19 and PRD 53 R-FACTORY-72.

- The table: `factory_grant_uses`, in the unreleased schema v9, changed in place. A row holds a use ID, the project ID, the workflow name, the grant ID, the action, the scope, the work unit, the lifecycle run ID, and the use time. It holds no content and no claim ID. Schema v9 now adds nine factory tables.
- The write: `useFactoryGrant` inserts the row in the same transaction as the grant check. `factory assignment save --grant-use`, `factory grant-use record`, and the `reset-correction-rounds` grant of `factory assignment start` all go through it. A refused use writes no row. Callers that race for one `once` grant leave one row, because only one of them spends the grant.
- A revoke keeps the rows. The table has no foreign key to `factory_grants`, and each row holds the grant ID, the action, and the scope, so it can be read after the grant row is gone. Its foreign key to the workflow binding has no cascade. P6 T15, the workflow removal, deletes the use rows with the workflow, and T15 now says so.
- The class: Store-canonical and non-rebuildable, in the `keep` maintenance class. The reason: a use row is the only record that an action outside the default authority was done under a grant. Maintenance never removes it.
- The guard: the table is in the v9 table list, so it gets the three Store write guard triggers, the v9 expected-table check, and the migration rollback list. A Store without the table is refused as missing a required schema object.
- The last-use columns: removed. `last_used_at` and `last_used_run_id` held the same facts as the newest use row, for one use only. With them gone, a use of a `standing` or a `run` grant does not change the grant row, and so does not raise its record version.
- The read: `factory workflow show` lists the use rows beside the grants, as `grantUses` in the machine output and one line for each use in the human output. No `.make-docs/factory/` copy holds a use row. No factory URI read shows one, as for grants.
- The contract has the new rule row `grant-use-recorded`, in the template and the identical dogfood copy.
- Tests, in `packages/cli/tests/w30-r0-follow-up-commands.test.ts`: two uses of a `standing` grant, one on each path, keep two rows; a revoke with the version that the person read works and keeps both rows; three callers that use one `once` grant at the same time give one `used` and two `grant-spent`, with one row; a refused use writes no row; the three guard triggers exist and refuse a direct insert and a direct delete; no copy and no URI read holds a use ID or a grant ID. The P2 parity test, the table catalog test, the v9 table lists, and the rollback list name the new table.

### Open for the Owner

- None.

### Follow-Up Integration

- An independent re-check on 2026-11-24 passed the follow-up commands with the built CLI: the refused backup cases, the links, six races of three real CLI processes on one `once` grant (one `used`, two `grant-spent`, one row each time), three uses of a `standing` grant (three rows, grant version unchanged), and a revoke that keeps the rows.
- Fixed at integration: one stale code comment and two stale phrases in this report.
- Follow-up for P6: add one test assertion for the use row on the `--reset-rounds` path of `factory assignment start` (the CLI writes it; the re-check saw it).

## Store Lifecycle Fixes

Date: 2026-11-24. The owner audited the factory tables and decided each finding (option A for each). An implementation agent first checked each finding against the code at commit `bb9cf4f1`, then fixed it. All of it is new behavior. It is [P6](06-proofs-and-acceptance.md) T15 and T20 to T24. The work is committed as `383319ac`. Every test uses a temporary `MAKE_DOCS_HOME`; nothing read or wrote the real Store.

### Findings

| Finding | Confirmed | Fix | Test |
| --- | --- | --- | --- |
| 1. A saved workflow has no removal path. Its binding, plan revisions, grants, grant uses, and test task results stay, also after project work cleanup and after a prune. | Yes. No function deleted a binding, a plan revision of a live workflow, or a use row. `deletePrunedProjectWorkRows` kept the workflow rows, and each factory function refuses a pruned project with `project-not-registered`. | `make-docs factory workflow clean` (MCP `factory_workflow_clean`, PRD 53 R-FACTORY-73) for a registered project. The scoped cleanup of PRD 52 R-WORK-STORE-13 for a pruned project. See [The Removal Command](#the-removal-command). | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "factory workflow clean (finding 1)": 6 cases. The changed P2 case "makes the scoped project cleanup refuse an open assignment, and keep a workflow whole while a backup record of it stays". |
| 2. A backup record can go without its file. | Yes, in two places. `cleanupFactoryBackups` deleted an old record whose file was outside the checkout and left the file (`recordsOnly`). `deletePrunedProjectWorkRows` deleted every backup record of the project and left every file. | A record goes only together with its file, the file first (R-FACTORY-74). Cleanup reaches the checkout that the call acts on. A due record for another checkout, or for a folder that moved or is gone, stays, and the result reports it as `kept`, with the path inside the project. A checkout folder that moved with its files is handled: the file at the same project path with the recorded digest is the record's file. The scoped cleanup removes no backup record and keeps that workflow whole. | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "backup records and files stay together (finding 2)": same checkout, other checkout, missing checkout, and accepted work. The changed P2 case for a moved checkout folder. |
| 3. `factory proof save` records a failure but leaves the `ready` revision `ready`. | Yes. A failed result wrote only the `factory_proof_results` row. The binding kept `ready_revision`, the live state stayed `ready`, and `factory assignment start` still started work. | The latest test result for a plan decides (R-FACTORY-12). A failed result for the plan of the `ready` revision clears the `ready` revision in the same write. The state word is `wired`, and the new readiness code is `test-failed`. | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "readiness after a failed test task (finding 3)": 3 cases. |
| 4a. No rule says how long a spent or expired grant stays, and reads load every grant and every use. | Yes. The rows stayed, with no stated reason. `useFactoryGrant` loaded every grant of the action, and `listFactoryGrantUses` loaded every use row of the workflow. | They stay until the workflow is removed, as their use rows do; the catalog and PRD 38 say so. A grant use reads through the (project, workflow, action) index and loads only grants that can still hold. `factory workflow show` returns the newest 50 use rows, every usable grant, and the 50 newest other grants, with the totals. | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "keeps a spent and an expired grant until the workflow is removed, reads grants through the index, and bounds the use rows that a read returns". |
| 4b. The keep rule can remove the plan revision of a final assignment. | Yes. The rule kept only revisions that an open assignment named, so a final assignment lost its plan and its round limit after 10 newer revisions. | The rule keeps each revision that a retained assignment names, open or final (R-FACTORY-57). | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "keeps the plan revision of a final assignment through more than 10 newer revisions". The P2 keep-rule tests still pass. |
| 5. Tool facts have no age, and the run Skill does not check its tools again. | Yes. `factory status` showed no proof time, and the run Skill read the saved tools only through the plan. | `factory status` lists each bound tool with the age of each proof and calls a proof older than 30 days old (R-FACTORY-75). The threshold is new, and it changes no readiness. The run Skill, its installed copy, and the contract say that the foreman checks each bound tool's version and state before new work and saves a change with `factory tools save`. | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "tool fact freshness (finding 5)": 2 cases. The P5 twin tests pass both ways. |
| 6. The Store README says that no command writes the factory tables. | Yes: "No command writes these tables yet." | A table of each factory command and the tables it writes, for all nine tables, including `factory_grant_uses`. | `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, "the Store README (finding 6)": the rows must equal the catalog's factory write commands, and every table must be named. |
| The use row on the `--reset-rounds` path had no test assertion. | Yes. | One assertion in the P3 case for `factory assignment start` with `resetRounds`. | `packages/cli/tests/w30-r0-p3-factory-operations.test.ts`, the round count case. |

### The Removal Command

- CLI path: `make-docs factory workflow clean <workflow> [--review <digest>]`, with `--target-root <path>` or `--project <name>`. Operation `factory.workflow.clean`. MCP tool `factory_workflow_clean` (22 characters), in the `factory` profile, with the inputs `workflow`, `review`, and `targetRoot` or `project`.
- The name: a native command rule refuses the word `remove`, and `update`, `backup`, `setup`, and `uninstall`. `clean` is an approved end word and already means a reviewed removal in `setup store clean`.
- The review pattern: one command, as `project doctor fix --review`. Without `--review` it is the review. It changes nothing, lists the count of each record, names what stops the removal, and gives a review digest. With the digest it removes. The digest binds the identity and the version of each record that the removal deletes, each plan digest, and each backup record with its file's recorded hash, so a change after the review gives `review-mismatch`, also when every count is the same (see [Review Fixes](#review-fixes-2026-11-24)).
- It is a project write. It names its project also for the review, and it needs one checkout, because it writes the copies again.
- The order: the backup files and their records, the final assignments with their status history, the grant uses, the grants, the test task results, the plan revisions, and the binding. The Store rows go in one transaction. Then it writes the `.make-docs/factory/` copies again.
- The refusals: `project-missing`, `project-not-found`, `project-mismatch`, and `project-checkout-unclear` as for each project write; `record-not-found` for a workflow that is not saved; `review-mismatch`; `assignment-open`; `backup-file-out-of-reach`; `backup-path-unsafe`; and `backup-file-locked`. Each refusal changes nothing. A delete that fails after the checks gives the `stopped` result, which is not a refusal: it removed the files that it names, with their records.
- The result names the project and the count of each removed record. It never edits the config file. While the config still names the workflow, the workflow shows as `draft`.
- Backups: the reviewed removal reaches every bound checkout of the named project whose folder is on this machine, and the review names each one (register D-079, option A, closed). It drops a backup record whose files are not found on this computer now, after the review listed it by name (register D-078, option B, closed). A record whose file is still on the computer in a folder that is not a bound checkout stops the removal. See [Round 3](#round-3-owner-decisions-and-re-check-fixes).
- The pruned-project case goes through the W29 scoped cleanup, not through this command: `project_register` no longer holds the project, so no factory command can name it. The cleanup removes every factory row of each workflow that has no backup record, in the same order, and reports the workflows that it kept.

### Choices That the Implementer Made

The owner gave the rules. These details are the implementer's choices under them, and each one is marked as new in the PRD history.

- The state word after a failed test is `wired`, as the contract defines it: saved and proved, with no passed test task under this plan. The readiness code is `test-failed`, in a new add-only list, "Readiness codes".
- The rule is stored, not computed at each read: the failed result clears the `ready` revision. So `factory assignment start`, `factory workflow save`, the live state, and the copies all follow it with no second rule, and the two kept proof results are all that it needs.
- The proof age threshold is 30 days. An old proof is only shown. It changes no readiness state.
- A read returns at most 50 use rows.
- The Store refusal words `backup-file-out-of-reach` and `review-mismatch` are service codes, like `version-conflict`. They are not in the contract's refusal code list.
- Schema v9 did not change. No table, column, or index was added, so the R-MIN parity, the expected-table check, and the rollback list did not change.

### Checks

Each command ran in this worktree with a temporary `MAKE_DOCS_HOME`.

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-store-lifecycle-fixes.test.ts`: 19 tests pass.
- The W30 and W29 tests, the Store, catalog, and maintenance tests, the name catalog, the W33 tests, the leaf help, the MCP tests, the setup and native-rule tests, the Skill and twin tests, and the consistency tests: all pass in the full run below, except the known tests and one fixed list.
- `npm run validate:defaults`: 53 tests pass.
- `bash scripts/check-instruction-routers.sh`: pass, run outside the sandbox because the sandbox blocks its temporary folder.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files.
- `project markdown validate` on the W30 work folder, both copies of the run Skill, the contract template, PRD 52, PRD 53, and the Store README: no style findings.
- `npm run smoke:pack:local`: pass, run outside the sandbox because it needs the network. It uses its own temporary Store.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 156 test files and 3,694 tests; 3,684 passed, 4 failed, 6 skipped. Three of the four are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11. The fourth was the fixed tool list in `tests/mcp.test.ts`, which did not name `factory_workflow_clean`. It is fixed, and `tests/mcp.test.ts` then passed alone. The full run was not repeated after that one-line test fix. `w19-r5-skills-command` passed in this run.

### Review Fixes (2026-11-24)

An independent reviewer checked the Store lifecycle fixes and found three defects and four smaller points. All are fixed. They are [P6](06-proofs-and-acceptance.md) T25. The behaviors that register D-078 and D-079 cover did not change. The tests are in `packages/cli/tests/w30-r0-store-lifecycle-fixes.test.ts`, which now has 26 cases.

| Review point | Fix | Test |
| --- | --- | --- |
| 1. High. A symbolic link planted inside `.make-docs/backup/factory/` made the removal delete files outside the backup folder, and then fail with a raw `ENOTDIR`. | `factoryBackupPathState` runs before every delete, in the removal, in cleanup, and in the sweep of old unrecorded files. It reads each path part below the checkout folder with `lstat`, refuses a link and a part that is not a folder or a regular file, and compares the real path of the file's folder with the folder that the path names. Nothing is deleted through a link. The removal refuses with `backup-path-unsafe`, and cleanup keeps the record as `unsafe-path`. | "linked assignment folder", "linked file", and "link to another checkout": each leaves the file behind the link, the link, and the record, and holds no raw error and no absolute path. |
| 2. High. A file error mid-removal deleted files in one checkout, rolled the Store back, and printed a raw `EACCES` with an absolute path. | The review and the removal check every backup file before the first delete, and refuse with `backup-file-locked` when this account cannot delete one. When a delete still fails, the removal stops: it deletes the record of each file that went, keeps every other record, commits, and returns the typed `stopped` result. That result names what went and what stayed by paths inside the project, says how to run again, and makes the CLI exit 1. | "locked folder": a folder without write permission is refused before any delete, and nothing changes. "a delete that fails after the checks": the second of three deletes fails; one file and its record are gone, two stay, the old digest no longer matches, and a new review finishes the removal. |
| 3. Medium. The review digest bound counts only. | The digest is made from the identity of every record: the binding and its version, each plan revision and its digest, each grant ID and version, each grant use ID, each assignment ID and version, each test task result with its version, time, and plan digest, and each backup record with its paths, its time, and its file's recorded hash. A test task result has no ID of its own; its key is the workflow and the outcome. | "binds the review digest to record identities": a grant revoked and another added, and a new test task result, each keep every count and give `review-mismatch`. |
| 4. Medium. `pruneProjectFromStore` dropped `factoryKept`. | A removed `workRows` result now holds `factoryRemoved` and `factoryKept`. T15 and A90 say that no command reaches the prune path yet. | "returns factoryRemoved and factoryKept in the prune result". |
| 5. Low. The 50-row cap had no way to read more. | New option `factory workflow show --uses-before <use-id>` (MCP input `usesBefore`): the page of at most 50 use rows just older than that use. The output names the use ID of the next page. | The retention case reads 60 use rows in two pages, with no row on both, and refuses an unknown use ID. |
| 6. Low. After a failed test, the `assignment start` refusal did not name `test-failed`, and the words said that no test task has passed. | The refusal adds one line with the state, the reason, the code, and the next step. With the code `test-failed`, the readiness words are "wired: saved and proved, but the latest test task under this plan failed". | The failed-test case checks the refusal, the status, and the show output. |
| 7. Low. Copies, `setup store check`, the moved-folder rule, and "Until it ships". | The removal result says that only the named checkout's copies were written again, and names `factory restore` for the others. `setup store check` shows a backup record whose checkout folder is missing as the new decision item `STORE-DECISION-005` (PRD 38 R-MAINT-4), with the path inside the project. PRD 53 R-FACTORY-74 states the moved-folder rule as new behavior. T15 no longer says "Until it ships". | The two-checkout removal case, the missing-checkout case, and the Store maintenance fixture SMF-009. |

The name `--uses-before` follows the option style of the other factory commands: lower-case words with hyphens, and the MCP input in camel case.

Checks after the review fixes, each with a temporary `MAKE_DOCS_HOME`:

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-store-lifecycle-fixes.test.ts`: 26 tests pass.
- `npm run validate:defaults`: 53 tests pass.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files.
- `project markdown validate` on the W30 work folder, the run Skill, the contract template, PRD 52, PRD 53, and the Store README: no style findings.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 156 test files and 3,701 tests; 3,692 passed, 3 failed, 6 skipped. The three are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11. This run includes the W30 and W29 tests, the Store, catalog, and maintenance tests, the MCP tests, the setup and native-rule tests, the Skill twin tests, and the consistency tests. `w19-r5-skills-command` passed in this run.
- The router check and `npm run smoke:pack:local` were not run again after the review fixes. The review fixes changed no router and no package file list.

### Round 3: Owner Decisions and Re-Check Fixes

Date: 2026-11-24. The owner answered the two open register questions, and a re-check of the review fixes passed all items except five findings. All of it is built. It is [P6](06-proofs-and-acceptance.md) T26. The lifecycle test file now has 30 cases.

| Item | What changed | Test |
| --- | --- | --- |
| D-078, option B. The reviewed removal may drop a backup record whose files are not found on this computer now. | New behavior. The files are "not found" when no reachable checkout of the project holds the path and nothing is at the path. The software cannot know that they are gone: see [Round 4](#round-4-wording-and-moved-folder-fixes). The review lists each one by name as "record dropped, files not reachable", gives it in `backupsDropped`, and binds it in the digest. The removal drops it after every backup file went. A record whose file is still on the computer, in a folder that is not a bound checkout, still stops the removal. A checkout folder that moved is not "gone": the file at the same project path with the recorded hash, in a reachable checkout, is deleted with its record. Routine cleanup and the scoped cleanup of a pruned project do not change: they keep the record and report it. Register D-078 is closed. | "drops a backup record whose checkout folder is gone for good": cleanup keeps the record, the review lists it, an older digest gives `review-mismatch`, and the removal drops it. |
| D-079, option A. The reviewed removal reaches the project's other bound checkouts. | Confirmed: the code already did this, with the same link check and locked-folder check for each checkout. New: the review and the result name each checkout that holds a backup file, with the count (`backupsByCheckout`). Register D-079 is closed. | "reaches a backup file in another bound checkout, and the review names that checkout". |
| 1. Medium. New bytes in a backup file did not change the review digest. | `planFactoryWorkflowBackupRemoval` hashes each backup file on the disk, and the digest binds that hash with the file's checkout. A changed file gives `review-mismatch`, and the file stays. | "binds the review digest to the bytes of each backup file". |
| 2. Low. The refusal code `backup-file-out-of-reach` came with the text about a link. | Each refusal builds its own line. After D-078, a record whose files are not found does not stop the removal; a link still does. | "does not drop a record while its file is still on this computer": with one record out of reach and one behind a link, the reason names only the first; after the folder is removed, the refusal is `backup-path-unsafe` and names only the link. |
| 3. Low. A delete that failed after the checks always said "cannot delete in that folder". | New reason `delete-failed` with general words: "The delete did not work. The file or its folder can be locked or protected." The refusal code of the `stopped` result stays `backup-file-locked`. | The `stopped` case checks the reason and the next action. |
| 4. Low. `STORE-DECISION-005` split the path at the first `.make-docs`. | The query walks to the last backup folder marker, `/.make-docs/backup/factory/`, for both path separators. | "setup store check splits a backup path at the last backup folder marker": a checkout folder whose own path holds the marker. |
| 5. Cosmetic. The not-ready refusal said two times that the test task failed. | The readiness words say it once. The reason now adds only the time and the code: "It failed at <time>, so the workflow takes no new work. Reason code: test-failed." | The failed-test case counts one occurrence in the refusal, the status, and the show output. |

No Skill text describes the backup record rule or the removal command, so no Skill file changed in this round. The factory contract is the agent's text for both, in the template and the identical dogfood copy.

Checks after round 3, each with a temporary `MAKE_DOCS_HOME`:

- `node scripts/copy-template-to-cli.mjs`: done. `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-store-lifecycle-fixes.test.ts`: 30 tests pass.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files. `project markdown validate` on the W30 work folder, the contract template, PRD 53, and the Store README: no style findings.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 156 test files and 3,705 tests; 3,696 passed, 3 failed, 6 skipped. The three are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11.
- `npm run validate:defaults`, the router check, and `npm run smoke:pack:local` were not run again in round 3.

### Round 4: Wording and Moved-Folder Fixes

Date: 2026-11-24. A check of round 3 passed the main paths and found five points. All are fixed. They are [P6](06-proofs-and-acceptance.md) T27. The lifecycle test file now has 37 cases.

| Point | What changed | Test |
| --- | --- | --- |
| F1. Medium, wording only. A record was called "gone for good" while its files can still be on a disk. | The output, the contract, PRD 53, the register D-078 resolution, and this report now say that the files are not found on this computer now (removed, renamed, or on a drive that is not connected). They say that a file that still exists stays where it is, and that no later cleanup finds it. The contract no longer says that no file is ever left without its record: it names this one case. The review label "record dropped, files not reachable" stays. No refusal rule was added. | "says in the contract, the PRD, and the register that the files are not found now", and the dropped-record case checks both output lines. |
| F2. Low. After a folder move, the first checkout by folder name decided. | Every reachable checkout is looked at. Each file at the record's path inside the project with the recorded hash is the record's file. Each one goes, and the review lists each one, counts it (`backupFiles`, `backupsByCheckout`), and binds it in the digest. The record goes after all of its files went. | "moved folder with a copy in two checkouts". |
| F3. Low. A moved file with other bytes was classed "files not reachable", and its record was dropped. | New class `changed-file`. The removal stops with the new service code `backup-file-changed`, deletes nothing, keeps the record, and names the next step. The same holds when the file at that place cannot be read safely. | "moved file with other bytes". |
| F4. Low. Two dropped records with one assignment and one project path: the review said removable, and the removal refused. | The plan keeps each record's own key as an internal field, and the removal deletes by it. No result shows the key. | "two dropped records with one assignment and one project path". |
| F5. Low. The split at the last marker was wrong when the backed-up file's own path holds the marker. | One shared function, `splitFactoryBackupPath` in `packages/cli/src/store/factory-backup-path.ts`, splits at the last marker that the record's assignment ID follows. Cleanup, the removal, and `STORE-DECISION-005` use it. The decision item reads plain rows and applies the function through a new optional `derive` step of a candidate query. | "splits a backup path at the last marker that the assignment ID follows". |
| A removal test for the plain moved-folder case. | Added. | "moved folder: deletes the record's file at the same project path in a reachable checkout". |

The owner answered the two open points on 2026-11-24:

- F1, option A. Register D-078, option B, stays as it is. No new refusal rule is added. The truthful words are the whole fix. The owner accepted that a record can be dropped while its files stay in a renamed folder or on a drive that is not connected, and the D-078 resolution records this.
- A checkout folder that is a symbolic link, option A: allow. The new closed register entry D-080 records it, and the contract states it. Cleanup and the removal follow a link at the checkout folder, because the person registered that folder. A link below the checkout folder stays refused. The build already worked this way, so no code changed. The test "linked checkout root" proves both parts.

Checks after round 4, each with a temporary `MAKE_DOCS_HOME`:

- `node scripts/copy-template-to-cli.mjs`: done. `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-store-lifecycle-fixes.test.ts`: 37 tests pass.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files. `project markdown validate` on the W30 work folder, the contract template, PRD 53, and the Store README: no style findings.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 156 test files and 3,712 tests; 3,703 passed, 3 failed, 6 skipped. The three are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11.
- The router check and `npm run smoke:pack:local` were not run again in round 4.

### Round 5

Date: 2026-11-24. The round 4 check passed everything else and found these points. All are fixed, with small changes and no refactor. They are [P6](06-proofs-and-acceptance.md) T28. The lifecycle test file now has 41 cases.

| Point | What changed | Test |
| --- | --- | --- |
| 1. Wording. The contract rule row said that the workflow removal never deletes a record without its file. | The row adds: "except a record that the reviewed removal drops because its files are not found on this computer now". Template first, dogfood identical. | None: wording. |
| 2. Data, routine cleanup. An old record of a folder that is not found took the file of a young live record with the same assignment, path, and hash. | The moved-folder search skips a file that is the recorded backup path of another record. The old record stays and is reported. | "routine cleanup: an old record of a folder that is not found never takes the file of a young live record". |
| 3. The same case in the reviewed removal. | The search skips a file that is the recorded path of another record of the workflow. The old record is then dropped as not found, and the review counts one file. With another hash, the removal no longer stops with `backup-file-changed`. | "reviewed removal: the file of a live record is counted once", for the same hash and for another hash. |
| 4. The path split was wrong when the backed-up file's own path holds the marker and the same assignment ID. | `splitFactoryBackupPath` takes the record's original path and splits at the marker where the checkout folder plus the rest is that path. Without it, or when no marker fits, the last marker decides, as before. Each caller passes the original path. | "splits a backup path by the record's original path", with the `STORE-DECISION-005` key for that record. |
| 5. Nits. | PRD 53 R-FACTORY-74 now says "The cleanup of R-FACTORY-45 never drops a record with no file". `storeCatalogDrift` reports a fixed rule that has a derive step, and the rule evaluation throws for one. The existing catalog test checks that the drift list is empty. | "allows a derive step only on a decision item, never on a fixed rule". |

Question from the check: does a checkout move rewrite `backup_path` in the factory backup records? No. `applyInstallationCheckoutMove` changes only the `installation_checkouts` row (`packages/cli/src/store/installation-state.ts`, the `UPDATE installation_checkouts SET root_path` statement), and no code changes `backup_path` or `original_path` of a `factory_backups` row. So after a move, each record still names the old folder, and the moved-folder rule finds its file. This was read only; nothing changed.

Checks after round 5, each with a temporary `MAKE_DOCS_HOME`. Every run finished before this report was written:

- `node scripts/copy-template-to-cli.mjs`: done. `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass.
- `npx vitest run tests/w30-r0-store-lifecycle-fixes.test.ts`: 41 tests pass.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `check prd`: passed. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 156 test files and 3,716 tests; 3,707 passed, 3 failed, 6 skipped. The three are known: `mcp-app-contract` (two tests) and `p5-migration-safety` fixture 11.

### Open for the Owner

- None. Register D-078, D-079, and D-080 are closed.

## P6 Proofs and Acceptance

Covers the tasks of [P6](06-proofs-and-acceptance.md) that an agent can do without the owner's real tools: T4 to T10, T12, T14, and the record path of T1, T2, T11, and T13. Evidence date: 2026-11-24. Base commit: `383319ac`. Node `v26.13.1`. CLI package version `2.0.9`. The work is uncommitted in its worktree. Every run used a temporary `MAKE_DOCS_HOME` and a temporary home folder. Nothing read or wrote the real Store.

### State of Each Task

| Task | State | Proof |
| --- | --- | --- |
| T1 Proof A | Done on 2026-11-24. The owner accepted the result. | [Proof A](#proof-a-t1-a43). |
| T2 Proof B | Open. Owner gate. | The owner picks the real tools, and a person must answer one escalation away from the session. This phase ran only the record path. |
| T3 Real tools named | Done for Proof A. Open for Proof B. | [Proof A](#proof-a-t1-a43) names the one real tool. The support claim is limited to that combination. |
| T4 Drift test | Done. | [Drift Test](#drift-test-t4-a46). |
| T5 Outside-git test | Done. | [Outside-Git Test](#outside-git-test-t5-a47). |
| T6 Evidence report | Done. | This report exists, and the [index](00-index.md) links it in `## Usage Notes`. |
| T7 Package parity | Done. A48 is met for the package candidate. One owner step is open for this repository's own installed copy. | [Package Parity](#package-parity-t7-a48). |
| T8 Tool name search | Done. No hit to fix. | [Tool Name Search](#tool-name-search-t8-a49). |
| T9 Human Experience Review | Done as an agent review. | [Human Experience Review](#human-experience-review-t9-a50). Four promises are `satisfied` within their limits. Three wait for the real proofs. |
| T10 Unassisted Goal Testing | Done. The owner decided on 2026-11-24: keep `not-needed-now`. | [P6 Owner Decisions](#p6-owner-decisions-2026-11-24). |
| T11 Capability tags | Done for Proof A. Open for Proof B. | [Proof A](#proof-a-t1-a43) lists the capability IDs, the tool version, each proof result, each "does not cover" item, and each accepted known loss. |
| T12 Version drift test | Done. | [Version Drift Test](#version-drift-test-t12-a71). |
| T13 Never-log scan | Open. The task says "after both proofs". The scan of the Proof A records ran clean; see [Proof A](#proof-a-t1-a43). | The scan is built as a test and ran clean on the record path run. See [Never-Log Scan](#never-log-scan-t13-a72). It must run again on the records of the real proofs. |
| T14 Rule catalog | Done. | [Rule Catalog](#rule-catalog-t14). |
| T15, T16 to T19, T20 to T28 | Done before this phase work. | Commits `bb9cf4f1` and `383319ac`. See [Follow-Up Commands](#follow-up-commands) and [Store Lifecycle Fixes](#store-lifecycle-fixes). Not done again. T24's `--reset-rounds` assertion is in `packages/cli/tests/w30-r0-p3-factory-operations.test.ts` ("The --reset-rounds path writes one use row for the spent grant"), and it passes. |

### Record Path Runs

These runs are not Proof A and Proof B. A real proof needs a real harness that starts real agents, and a real message that a person answers. No agent was started here, and no message was sent. The implementing agent was told to start no subagent, and the owner picks the real tools.

What ran: the installed package candidate, called as a person's agent calls it, from a folder that is not the project. The package candidate is the tarball of `npm pack` in `packages/cli` on this worktree, installed with `npm install` into a temporary folder: `brucewaynedecoy-make-docs-2.0.9.tgz`, SHA-256 `69902b7581f35b74c068162012357144d93d976f3987003397939f405151734b`. All 118 steps of the run passed on that installed package. This is the round 2 tarball, packed after the round 2 changes. The round 1 run used the tarball with SHA-256 `0777a94b3b75e1b6607104f08f30b3c5f74d1a2d2df5d751cf8b79d6034baeac`, and it also saved one more fixture tool that no role used. That tool is removed, so the installed-package run and the test now make the same steps and the same records. The same steps are the test "runs two units with one correction, the backup outside git, both drift tests, a two-tool unit with one grant, and the never-log scan" in `packages/cli/tests/w30-r0-p6-proofs-and-acceptance.test.ts`, which runs the built CLI. Tool names are generic: `tool-a`, `tool-b`, and `channel-a`. Each project was made with `make-docs setup --yes`, with every harness skipped and no Skills.

| Run | What the CLI recorded | Result |
| --- | --- | --- |
| Smallest setup (the record path of A43) | Project `aurora`, a folder without git. Type `staged-backlog`. One tool, `tool-a`, with the five capabilities of the smallest setup, fills the front desk, foreman, builder, and reviewer roles. Channel kind `wait-in-session`. Two quick items. Unit 1: builder, review, `defects-found`, `needs-correction` at round 1 of 3, `correction-sent`, a second review, `review-passed`, accept, close. Unit 2: builder, review, accept at round 0, close. | 5 assignments, all `accepted`: 2 builder jobs and 3 reviews. Both units closed with `work close`. |
| Two tools (the record path of A44) | Project `cascade`. Type `lead-and-specialists`. `tool-a` fills foreman and builder, and `tool-b` fills researcher and reviewer. Channel kind `messaging-tool`, with the channel account reference `channel-a`. One unit with the parts `research` on `tool-b` and `draft` on `tool-a`, open at the same time, and a review of `draft` on `tool-b`. The accept with `--grant-use merge` is refused with `grant-missing`, and the assignment stays `in-review`. After a grant-only `factory workflow save` with a `once` grant, the same accept works, and `factory workflow show` lists one grant use. | 3 assignments `accepted`, one grant spent, one use row. The unit closed. |

The refusal that the foreman turns into floor event 1, as the CLI printed it:

```text
Refused for project cascade (<project-id>). No grant names the action merge.
Next: Ask the person through the human channel.
Reason code: grant-missing. Nothing changed.
```

Capability IDs that these runs recorded as `proved` under a tool version, as the form for T11: `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, and `read-agent-result` for `tool-a` (version `1.0`, then `1.1`); `read-write-files` for `tool-b` (version `2.0`); `message-person` and `receive-answer` for `channel-a` (version `3.0`). These are fixture records. No capability was proved against a real tool, so A70 is not met.

Limits: the acceptance request at the end of the scope is text that the run Skill writes, and no CLI output holds it. So this run shows no acceptance request. The owner reviewed the form of that request in the P5 Guided Progress Review. A real one comes only from Proof A.

### Drift Test (T4, A46)

Project `borealis`, a folder with git, type `build-then-review`, workflow `ready`, with one open builder assignment. The agent reports the wired tool as `missing` with `factory tools save`. The CLI never contacts a tool, so this report is how a removed tool reaches it.

```text
Factory status for project borealis (<project-id>), as named.
Checkout <borealis> (the checkout of this call):
  Workflow ship: drifted: something changed without a save, so it takes no new work. Ready revision 1.
    - tool-missing: Tool tool-a for the builder, foreman and reviewer roles is missing on this machine. Next: Bring tool-a back and report it with make-docs factory tools save.
  Lifecycle run run-p6-borealis-1:
    - task 1 (builder, part main): tool tool-a (Tool A, missing), offered, last check <time>; round 0 of 3; claimed by foreman-1 until <time>.
```

`factory assignment start` for a new job then exits 1:

```text
Refused for project borealis (<project-id>). Workflow ship is not ready, so it takes no new work.
- tool-missing: Tool tool-a for the builder, foreman and reviewer roles is missing on this machine. Next: Bring tool-a back and report it with make-docs factory tools save.
Next: Check the workflow with factory workflow show and fix what it names.
Reason code: not-ready. Nothing changed.
```

- The project had 1 assignment before the refused start and 1 after it. No new work started.
- When the tool is reported `available` again, the workflow is `ready` again with no new test task, as the contract says for a restored plan.
- One fix step. This is a change of output, by owner decision of 2026-11-24 (see [P6 Owner Decisions](#p6-owner-decisions-2026-11-24)). Before, the line gave two steps joined by "or". Now `factory status`, `factory workflow list`, and the refused start give only the smallest fix: bring the tool back and report it. Only `factory workflow show` adds the second way, after the first: "If that cannot work: Bind another tool to the builder, foreman and reviewer roles with make-docs factory workflow save." The status JSON holds no second step.
- Limit: the tool was a fixture record. No real tool was removed.

### Version Drift Test (T12, A71)

The same project. The agent reports `tool-a` at version `1.1`, while each proof names `1.0`.

```text
  Workflow ship: drifted: something changed without a save, so it takes no new work. Ready revision 1.
    - tool-version-changed: Tool tool-a for the builder, foreman and reviewer roles reports version 1.1, but its proof is for version 1.0. Next: Prove tool-a again and save it with make-docs factory tools save, save the workflow, and pass a new test task. If version 1.0 comes back, the workflow is ready again with no new step.
```

- `factory workflow show` gives `drifted` with the one drift code `tool-version-changed`. `factory assignment start` is refused with `not-ready`.
- Re-proof step 1: each of the five proofs is saved again under version `1.1`. The workflow is still `drifted`.
- Re-proof step 2: `factory workflow save` makes plan revision 2. The workflow is `wired`, and `factory assignment start` is still refused.
- Re-proof step 3: `factory proof save` with a passed test task under revision 2 makes the workflow `ready`.
- The project still had 1 assignment at the end. No new work started until the proof ran again.

### Outside-Git Test (T5, A47)

Project `aurora` has no git folder. Before the builder's file changed, the foreman's call saved the backup:

```text
Saved the backups of 1 file for the assignment of task 1 (builder, part main) in project aurora (<project-id>), checkout <aurora>.
- notes.md: backed up. Backup .make-docs/backup/factory/<assignment-id>/notes.md, digest 158cefa4c1106b0a8504217889833d2ee8f204f2a78168ecceee01e4914ab879.
The backups are in .make-docs/backup/factory/, and its README.md says how to get a file back. Make Docs removes them when the work is accepted or closed, or after 30 days.
```

- After the call, `.make-docs/backup/factory/` held `.gitignore` (one line, `*`), `README.md`, and `<assignment-id>/notes.md`. The result holds no file contents and no claim ID. No root `.gitignore` was written.
- The folder note, `README.md`, has two parts: "How to Get a File Back" (find the folder of the job, the backup has the same path as the original file, copy it back) and "When Backups Are Removed" (on accept or close, after 30 days, during normal factory commands, a backup and its Store record together, and never the installation recovery backups).
- The backup stayed through the correction round. When the builder's assignment moved to `accepted`, the file was gone, and `factory_backups` held 0 rows. Cleanup ran inside that normal factory command.
- In `borealis`, a folder with git, the same call gave `not-needed` and wrote no copy.
- Limit: the 30-day rule was not waited for. The tests of P2 and of the Store lifecycle fixes cover it with a set clock.

### Never-Log Scan (T13, A72)

The scan ran on the records of the record path runs. T13 stays open, because the task asks for the scan after both real proofs.

- Planted first: a file with a known text that was backed up and changed; an environment value in the CLI's environment; and two refused writes, one task handle that holds a credential and one that holds an environment setting. Both were refused with `never-log-field`, and neither refusal showed the value.
- Scanned: all 9 factory tables (10 assignments, 8 capability proofs, 1 grant, 1 grant use, 3 machine tools, 3 test task results, 3 bindings, 4 plan revisions, 0 backups), the lifecycle tables, the bytes of the whole Store file, and the 9 files in `.make-docs/factory/` of the three projects. The test now asserts each of these counts. The round 1 text said 11 capability proofs and 4 machine tools. Those numbers came from the round 1 installed-package run, which saved one more fixture tool with 3 proofs than the test did. The round 2 installed-package run gives the same counts as the test.
- Found: none of the planted texts. No claim ID in a factory table, a lifecycle table, or a copy. No grant in a copy. No factory column for a prompt, a brief, a transcript, a password, a secret, a token, a key, contents, or an environment value; the one `content_digest` column holds a hash. No text value with a line break. All 47 status history entries hold only `at`, `reason`, and `status`.
- Limit: a scan for planted values proves that those values are absent. It cannot prove that no other private text is in a free-text field, such as a tool label that a person typed. The CLI check of each write (one line, at most 120 characters, no credential or environment form) is the control for that.

### Package Parity (T7, A48)

- Resources: the four factory resources and `system-resources.catalog.json` are byte-identical in `packages/docs/template/`, in the dogfood `.make-docs/`, and in the bundled `packages/cli/template/` (`cmp`). `make-docs resource read` with the built CLI returns each of the four URIs with exit 0 and the template bytes, from a folder with no Store, and creates no Store.
- Skills in the repository: `diff -r packages/skills/factory .agents/skills/factory` shows no difference.
- Skills from the installed package (A48): in an empty temporary folder, with a temporary Store and a temporary home folder, the installed tarball ran `make-docs setup --yes` with every harness set to none or skipped, `--skill-scope project`, and `--selected-skills all`. It exited 0 and wrote 9 Skills to `.agents/skills/`. `diff -r`, without dot folders, of `.agents/skills/factory` (5 files) and `.agents/skills/factory-setup` (7 files) against `packages/skills/factory` and `packages/skills/factory-setup` shows no difference. Nothing was written to the temporary home folder.
- Operations: `make-docs factory --help` lists 14 commands, and the contract's `## Commands` table lists the same 14 with their MCP names. The registry, name catalog, leaf help, and MCP profile tests pass in the full run.
- Installed package: in the installed package candidate, the four resources and the catalog are byte-identical to `packages/docs/template/`, `make-docs factory --help` lists the same 14 commands, and the record path run passed. `npm run smoke:pack:local` passed in round 1 and was not run again in round 2.
- Open owner step, outside A48: this repository's installed dogfood copy has no `.agents/skills/factory-setup/`. Installing it needs `make-docs setup skills`, which writes the real Store. P4 recorded the same limit.

### Tool Name Search (T8, A49)

Searched with the two name lists of the P1 resource test (28 product names in any letter case, and 20 brand forms): both shipped factory Skills, the installed `factory` copy, the contract, the three workflow types, the factory source in `packages/cli/src/operations/factory/` and `packages/cli/src/store/factory-*.ts`, and the seven W30 test files. 41 files.

- Shipped Skills, resources, and factory source: no hit.
- Test files: three kinds of hit, and none is a tool named as required or default. The guard lists of the P1, P4, and P5 tests hold the names so that they can refuse them. The packaging file name `agents/openai.yaml` is the recorded exception. Two tests pass harness-skip options of `make-docs setup`, which are existing Make Docs install options and not part of the factory.
- New guard: the test "names no particular tool in the factory source text that a person or an agent reads" keeps the search of the factory source. The P1, P4, and P5 tests already keep the search of the resources and the Skills.

### Rule Catalog (T14)

This is the builder's choice of a word, so it is listed for owner review. It is new wording, not new behavior.

- The word for a built check is "Built in", followed by the phase and task as before, for example "Built in W30 R0 P3 T7". The owner kept this word on 2026-11-24. 57 rows changed from "Planned in" to "Built in". Each of those checks was confirmed built: every task that a row names is done in its phase file, P3 and P5 are completed, and W29 R0 is completed.
- Round 2: three rows said "Contract-only" for a check that the CLI makes. They now say "Built in". `only-ready-takes-work`: `factory.assignment.start` refuses a workflow that is not `ready` with `not-ready` (P3 T21). `no-silent-replace`: `factory.workflow.save` refuses a project type with a shipped name, and status and show give `type-name-clash` (P3 T3 and T21). `one-human-channel`: the config check requires one `humanChannel` kind (P2 T20); the "wait in session" last resort part stays with the setup Skill. The P6 test proves all three with the built CLI.
- Round 2: each of the other 30 "Contract-only" rows was read against the code and the tests. Each one is true as written, with one sentence made exact: `claim-opens-run` now says that `factory.assignment.start` checks that the run is a run of the project that has not ended, and not its stage. The rows that name no check were confirmed: no code checks a custom role name against the standard names, a wake interval, a merge or a deploy, the nine sections of a type file, or the content of a work note beyond its length and line form.
- Final counts: 90 rows. 60 start with "Built in", 30 start with "Contract-only", and none starts with "Planned in".
- The catalog's opening paragraph now explains the three row forms: "Built in", "Contract-only", and "Planned in" for a check that is not built yet. It says that no row is planned now. The note "Every row marked Planned in W30 R0 P3 is built" is removed.
- Four rows said that a later task "builds" a check. They now say "built" or "searched". The `claim-held` row named `.update`, the old end word of `factory.assignment.save` (register D-076). It now names `factory.assignment.save`.
- The P1 test accepts "Built in" and "Planned in" with a phase and task, or "Contract-only" with a reason. The new P6 test requires that no row is planned, that 60 of the 90 rows are built and 30 are contract-only, and that the note is gone.
- Template first, then the dogfood copy and the bundled copy. All three are byte-identical.

### Other Fixes

- `staged-backlog.md` step 2 said "(`make-docs work next`, MCP `work_next`, planned)". The command shipped in W29 R0, so the word "planned" is removed. Template first, dogfood identical. Effect to know: the plan records the digest of the type file, so this text change gives the drift code `type-changed` for a `staged-backlog` workflow that was saved under the old file. No release holds the factory yet, so no saved workflow of a person is affected. The type version stays 1, because no rule changed.
- The generated copy `workflow-<name>.md` printed an accepted known loss that ends with a full stop as "No tool can wake on its own..". `packages/cli/src/operations/factory/copies.ts` now ends the line with one full stop. Round 2: an ellipsis at the end of a known loss stays as it is. The P6 test checks the line and six cases of the function `knownLossesLine`. The Store record and the plan do not change.

### Human Experience Review (T9, A50)

Reviewed on the real plain output of the installed package candidate in the runs above, and on the owner-reviewed samples of P3, P4, and P5. This is an agent review. It does not claim how a person feels about the result. A real setup summary, a real escalation, and a real acceptance request need Proof A and Proof B.

| Promise | Observation | Conclusion | Limit | Next action |
| --- | --- | --- | --- | --- |
| Setup ends with a plain summary of roles, wake method, human channel, test result, accepted known losses, and open manual steps. | The `factory-setup` Skill writes the summary. The owner passed its sample in the P4 Guided Progress Review. In these runs, the copy `workflow-ship.md` listed each role with its tool, the wake method, the channel kind, the integration owner, and the accepted known loss. | `insufficient evidence` for a real setup | No real setup ran in this phase. | Run Proof A and Proof B, then review the real summary (owner gate). |
| The person hears only floor events and added events. Each message says what happened, what is needed, and what happens next. | The run Skill writes each message. The owner passed the escalation sample in P5. The CLI refusal that starts floor event 1 names the project, the cause, the next step, and the reason code. | `insufficient evidence` for a real message | No message was sent. | Proof B: one real escalation, answered away from the session (owner gate). |
| `factory status` shows each claimed unit, its tool, its state, and the last check, in human words first, grouped by checkout and then by lifecycle run. | Status named the project and how it was chosen, then the checkout, the workflow readiness in words, the run, and one line for each open assignment with role, part, tool, status, last check, round, and claim holder. Then the bound tools with proof ages. It ends with "Changes nothing." | `satisfied` | A quick item shows as "task 1". The output was read in its `summary` form, because the CLI prints JSON when its output is not a terminal. Times are UTC time stamps. | None needed. The owner can look at the sample in the Guided Progress Review. |
| At the end of the given scope, the person gets one acceptance request with the reviewed result and evidence. | The run Skill writes the request. The owner passed its sample in P5. No CLI output holds it. | `insufficient evidence` | No real scope ended. | Proof A (owner gate). |
| A drifted workflow says so before it takes new work and names the smallest fix. | See [Drift Test](#drift-test-t4-a46). Status and the refused start both say `drifted`, the cause, and a `Next:` line. No new work started. | `satisfied` | The tool was a fixture record. Since the owner decision of 2026-11-24, the line gives one fix step. | None. |
| When a tool changes version, or the setup changes without a save, the factory says what changed in plain words, with its reason code, before it takes new work. | See [Version Drift Test](#version-drift-test-t12-a71). The line names the role, both versions, the three re-proof steps, and the way back. | `satisfied` | Only `tool-missing` and `tool-version-changed` ran here. The P3 fixtures cover the other drift codes. | None. |
| Every factory result names the project it acted on, or says that it acted on this machine. A write that names no project changes nothing and says how to name one. | Each project result in the runs started with the project name and ID. `factory tools list` said "saved for this machine". With no Store, the machine read gave `store-unavailable` and made no Store. | `satisfied` | The `project-missing` refusal was not run again here. P5 A82 covers it. | None. |

### Checks

These are the round 2 runs, after the last code change. Each command ran in this worktree with a temporary `MAKE_DOCS_HOME`. Every run finished before this report was written.

- `npx tsc --noEmit -p .` in `packages/cli`: pass. `npm run build`: pass. `node scripts/copy-template-to-cli.mjs`: done.
- `npx vitest run tests/w30-r0-p6-proofs-and-acceptance.test.ts tests/w30-r0-p1-factory-resources.test.ts`: 11 tests pass (4 in P6, 7 in P1).
- `npx vitest run tests/w30-r0-*.test.ts`, the 8 factory test files: 226 tests pass.
- `npm run validate:defaults -w packages/cli`: 53 tests pass.
- `check prd`: passed. `project paths validate`: `valid: true`, no failing findings. `project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption`: no problems in 386 files.
- `project markdown validate` on the W30 work folder, PRD 53, the contract template, and the run Skill: 14 files, no style findings.
- `npx vitest run --reporter=json` in `packages/cli`, with a private report file, counted from the JSON report: 157 test files and 3,720 tests; 3,711 passed, 3 failed, 6 skipped. The three are known: `mcp-app-contract` "opens the same factory and resource over real stdio", `mcp-app-contract` "gives a typed chat fallback for an unproved transport", and `p5-migration-safety` "fixture 11: persists every fixed checkpoint failure and all typed receipt shapes". `w19-r5-skills-command` passed in this run, and no test hit a time limit.
- `npm run smoke:pack:local`: passed in round 1, outside the sandbox because it needs the package registry, with its own temporary Store. It was not run again in round 2.

### P6 Owner Decisions (2026-11-24)

The owner answered three choices of round 1 on 2026-11-24.

- Unassisted Goal Testing for first setup (T10): option A. Keep `not-needed-now`. The owner passed the setup interview and the closing summary in the P4 Guided Progress Review, and no question about finding or starting first setup is open that can change a current decision. T10 is closed.
- The fix line of a lost tool: option B. `factory status` gives only the first fix, the smallest one. This is a change of output, and it is built in round 2: `packages/cli/src/operations/factory/live-plan.ts` and `service.ts`, the contract (template first, dogfood identical), PRD 53 R-FACTORY-33 with a Requirement History entry, the run Skill and its installed copy, and the P6 test. A drift entry has a new optional field, `otherStep`, which only `factory workflow show` gives. No readiness rule changed.
- The word "Built in" in the Rule Catalog: option A. Keep it.

### P6 Open for the Owner

Each item is open. Nothing here was decided for the owner.

1. Done on 2026-11-24; see [Proof A](#proof-a-t1-a43). It was: Proof A (T1, A43), and with it T3, T11, and T13. The owner picks one real agent tool that can start its own subagents. A session of that tool runs `factory-setup` and then the `factory` Skill on a staged backlog of at least two units, with one correction, and ends with one acceptance request.
2. Proof B (T2, A44), and with it T3, T11, and T13. The owner picks a real multiplexer and a real human channel that works from a phone. The run needs one `lead-and-specialists` unit and one escalation that the owner answers away from the session.
3. Guided Progress Review of the real setup summary, status output, escalation messages, and acceptance request from the two proofs. The drift and status samples in this report are ready to read now.
4. The dogfood install of `factory-setup` in `.agents/skills/`. It needs `make-docs setup skills` or `make-docs update` on the real Store, so the owner runs it.
5. The explicit human acceptance gate of W30 R0, and the closeout of this phase and of the index. P1 and P2 phase files still say `status: "active"`; their closeout is outside this phase's task list.
6. Found in round 2, not changed: the fix line of the drift code `proof-contradicted` also gives two steps joined by "or" ("Bind a tool ... that has the capability proved, or prove it again ..."). The owner's decision named the lost tool only. Option A (recommended): treat it the same way, with "prove it again" as the one step in status. Option B: leave it as it is. Owner decision 2026-11-24: option B, leave it as it is.

### Could Not Do

- Any run with a real tool, a real subagent, or a real message. See items 1 and 2.
- Any read or write of the real Store.


### Proof A (T1, A43)

Date: 2026-11-24. This is a real run: a real agent tool, real subagents, real work, and the owner as the person. It is not a record path run.

Setup of the proof:

- Real tool (T3): T3 Code, version 0.1.10 (`t3 --version`), tool kind `agent-harness`, tool ID `t3-code`. The owner picked it. It filled each role: front desk, foreman, builder, and reviewer. Each builder and each reviewer was a fresh subagent that the lead session started. No other tool was used. The support claim is this one combination only: one agent harness with its own subagents, human channel "wait in session", wake method `person` (R-FACTORY-1, R-FACTORY-10).
- Store: a separate proof Store in a temporary folder (`MAKE_DOCS_HOME`), at schema 9, by owner decision. The real Store was not read or written.
- Project: a sample project in a temporary folder, with git, by owner decision. Its backlog `W1 R0` had two phases; P2 depended on P1.
- CLI: the build of commit `d4540931`.

What ran:

1. `factory-setup`, steps 0 to 6. The owner answered the interview through a choice control: default limits, preflight off, no added event, no grant for `merge`, `deploy`, `publish`, or `spend`, and all five known losses accepted. The workflow type (`staged-backlog`), the human channel, and the wake method came from the definition of Proof A, so setup did not ask for them. `factory tools save` saved one tool with six proofs. `factory workflow save` made plan revision 1. The test task (a fresh builder, then a fresh reviewer that did not build) passed, and `factory proof save` made the workflow `ready`. Setup ended with the summary and started no run.
2. The `factory` Skill on `W1 R0`, after the owner asked for the run.
   - P1: claim, lifecycle run, builder assignment, review. The first reviewer returned 2 defects with evidence. The builder's assignment moved to `needs-correction` (round 1 of 3), then `running` with `correction-sent`. A second fresh reviewer passed the correction. The foreman accepted the unit on that evidence, recorded and attached the evidence link, closed the unit, and completed the run.
   - P2: claim, lifecycle run, builder assignment, review. The reviewer passed it. Correction rounds: 0. Accepted, closed, run completed.
   - One acceptance request for the whole scope. The owner answered `accept` in the session.
3. Result against A43: two units completed, one correction, one acceptance request. Met.

The correction was planted, by owner decision (option A on 2026-11-24): the first P1 builder was told to leave out one requirement, so that the proof was sure to show a correction. The reviewer was not told. The reviewer found the planted defect and the missing test on its own.

Capability tags (T11), all for tool `t3-code` at version 0.1.10:

| Capability ID | Result | Does not cover | Exercised in the run by |
| --- | --- | --- | --- |
| `read-write-files` | `proved` | Nothing listed | Front desk, foreman |
| `run-commands` | `proved` | Nothing listed | Foreman, builders, reviewers |
| `launch-agent` | `proved` | Two agents at the same time | 4 subagent starts in setup, 5 in the run, and 1 correction sent to a builder |
| `wait-for-agent` | `proved` | A wait longer than one session | Each subagent |
| `read-agent-result` | `proved` | A long result | Each subagent |
| `edit-code` | `proved` | A change to an existing file; checks with at least one test | Builders (the correction changed existing files, with 8 tests) |

Not proved, and not claimed: `wake-on-schedule`, `wake-on-event`, `message-person`, `receive-answer`, `isolate-working-copy`. No role depended on one.

Accepted known losses (5): the factory runs only while a session is open; the start-agent proof did not test two agents at the same time; the wait proof did not test a wait longer than one session; the read-result proof did not test a long result; the edit proof made a new file only, and the project had no test then.

Records in the proof Store after the run: 1 machine tool, 6 capability proofs, 1 workflow binding, 1 plan revision, 1 test task result, 5 assignments (2 builders, 3 reviewers, all `accepted`; one builder with round count 1), 0 grants, 0 grant uses, 0 backups.

Never-log scan of the Proof A records (part of T13): a text search of a full dump of the proof Store and of the `.make-docs/factory/` copies for both code words, the scratch text, source text of the work, brief text, and both claim IDs. No hit. T13 stays open until the same scan runs after Proof B.

Findings from the run:

1. `make-docs lifecycle attach-evidence --digest` needs the form `sha256:<64 hex>`. The run Skill does not say so. The first call was refused; nothing changed.
2. A change to a task checkbox in a phase file changes the unit revision at the next sync. A `work close` with the revision from before is then refused once with a clear message. The run Skill does not tell the foreman to read the revision again after it edits the phase file.
3. A task handle with a space is refused ("The field taskHandle holds a space"). The Skill does not name that rule.
4. Foreman error, not a product defect: on P2 the foreman completed the lifecycle run before the unit closed, because the first close was refused (finding 2). The Skill says to close first. The close then worked, and no record was lost.
5. `work close` writes `status: "complete"` in the phase file. Check this word against the status words that the work store reference lists.
6. The setup interview used four-question choice dialogs. Each question was one decision, but the person saw four at a time. The Skill says "one decision at a time".

Could not prove in Proof A: parallel units, a wake without the person, a message channel, a working copy for each worker, a grant use, a backup outside git, and an escalation. Proof B covers the message channel and one escalation.
