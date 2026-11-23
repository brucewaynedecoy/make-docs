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
