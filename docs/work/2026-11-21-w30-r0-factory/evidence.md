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
