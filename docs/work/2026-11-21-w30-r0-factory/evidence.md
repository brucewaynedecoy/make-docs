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

### Sample Closing Summary (for Owner Review)

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

The interview questions for the same review are in `references/interview.md`, The Questions, with one example question.

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

- Guided Progress Review of the interview questions and the closing summary (P4 testing decision). Feedback can change both before closeout.
