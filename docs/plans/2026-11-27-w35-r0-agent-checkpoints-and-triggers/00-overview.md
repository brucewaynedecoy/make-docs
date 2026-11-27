---
title: "W35 R0 Agent Checkpoints and Triggers Plan"
kind: "plan"
status: "draft"
coordinate: "W35 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The work backlog exists beside this plan. Each PRD change lands in the phase that builds its behavior, because the name catalog test fails a PRD line that names a command before the catalog holds it."
  coordinate_handoff: "Carry W35 R0 into the requirement-history entries, the phase history records, and docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/."
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 Agent Checkpoints and Triggers Plan

## Purpose

Plan the [agent checkpoints and triggers design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md). Agents must keep the work store current, and read work from it, with no person who reminds them. The Wave adds one command, `make-docs project checkpoint`, that does all that is due. It then adds triggers that lead to that one command: a reminder line on Make Docs commands, lines in the read commands, router rules, MCP server instructions, git hooks, and a hook for each of the three agent tools that setup supports today.

This plan and its work backlog are review material. They do not authorize CLI, MCP, template, Skill, registry, installation, commit, push, or release changes. Implementation needs separate owner authority. The Wave must not touch the W22 R2 plan, backlog, design, branches, or worktrees, and it must not read or write the real Store.

## Objective

Completion requires:

- one registry operation, `project.checkpoint.run`, with CLI and MCP parity: `make-docs project checkpoint` and `project_checkpoint`;
- a direct run and a trigger run (`--event <name>`) with the rules of the design, and a useful result for a caller with read access only;
- the agent form of the checkpoint in `make-docs://system/reference/work-store.md`, with shared rule IDs, and a test that fails on a one-sided ID;
- one reminder line on each command with Store read access, from the exact check, with its cost measured;
- `work next` and `work status` that name the checkpoint first, mark each out-of-date unit, and say when the list is not complete;
- one fixed sentence in each project URI read;
- one rule in the root routers, one conditional note in the `docs/work/` routers, and MCP server instructions, written in `packages/docs/template/` first and then copied byte for byte;
- four git hooks for each project, which setup installs by an explicit hook input, by an explicit answer in interactive setup, or by the machine preference that the person set, with a marked block, a refusal when another tool owns the hooks, a Store record of the exact block, drift reports, and exact removal;
- a machine preference with the default "No", which the person sets at the machine step of setup (`make-docs setup system`, or the same flow inline in project setup);
- a hook method for each of the three agent tools that setup supports (Codex, Claude Code, and GitHub Copilot CLI), with the real hook contract of each one recorded from a real run, and its honest support status;
- PRDs 03, 04, 06, 07, 15, 25, 28, 30, 38, 39, and 52 describing the result;
- package version 2.1.1, which the owner chose on 2026-11-27, with the digest file `.github/release-candidates/v2.1.1.sha256` that each phase commit keeps current;
- package parity, a user guide update, a Human Experience Review, and the owner acceptance gate.

## Standing Rules

These rules hold in every phase. The backlog repeats them.

1. NEVER read or write the real Store at `~/.make-docs`. Each test and proof uses a temporary `MAKE_DOCS_HOME` at a fixed path that the run checks before use. An empty `MAKE_DOCS_HOME` means the real Store, so a run stops when the value is empty.
2. No new Python. Logic lives in the TypeScript CLI, with a written agent twin under the [twins guide](../../assets/project/developing-deterministic-agentic-twins.md).
3. Template first. Write each shipped text in `packages/docs/template/`, then make this repository's copy in `.make-docs/` or `docs/` byte-identical. `.agents/skills/<name>/` matches `packages/skills/<name>/`.
4. Tool-agnostic text. Skills, resources, tests, and guides name no vendor, tool, or product. The one exception is a place where existing setup code and docs already name an agent tool, and then in the same way.
5. A git hook never fails or blocks a git action. It always exits 0. It does nothing with no Store, no Make Docs project, or no `make-docs` command.
6. Every behavior works, or does nothing, without a Store.
7. Say when a behavior is new. Record no owner decision that the owner did not make. An item that needs an owner choice is an owner gate in the backlog.
8. Each phase ends with an independent review before its commit. The commit form is `feat: [W35 R0 P<n>] Agent Checkpoints and Triggers - <Phase name>`.
9. Do not touch `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/**`, `docs/plans/2026-11-13-w22-r2-portable-checkout-adoption/`, or `docs/designs/2026-11-13-portable-checkout-adoption.md`.
10. Record the package digest again in every phase commit that changes package bytes. The pull request check "Match the reviewed candidate digest" compares the packed tarball with `.github/release-candidates/v<version>.sha256` on each pull request. The owner chose version 2.1.1 on 2026-11-27, so the digest file of this Wave is `.github/release-candidates/v2.1.1.sha256`. The steps: `npm run prepack -w packages/cli`, then `npm pack --json --ignore-scripts` in `packages/cli`, then the SHA-256 of the tarball as one lowercase hex line in that digest file, in the same commit. Never change the digest file of a released version.
11. A proof that must run inside an agent tool has one rule for who runs it. The orchestrator starts a session in each first-party agent tool that its environment can start, and records which tool ran which proof. For a tool that the environment cannot start, the owner runs the listed steps. The owner decided on 2026-11-27 that each of the three agent tools gets a hook method. So a missing run never drops a tool. When no run exists for the hook contract of a tool in P6, the task stops and asks the owner. For the access runs of P4 and the sessions of P7, a tool with no run is a recorded limit with the words "no proof gathered".
12. A three-platform result comes only from `.github/workflows/platform-safety.yml`, for the test files in its fixed list, in a pull request run or a manual run. The orchestrator starts the run through the pull request after the reviewed phase commit is pushed. The order is: the phase commit, the push, the pull request run, then one evidence commit of the form `docs: [W35 R0 P<n>] Agent Checkpoints and Triggers - <Phase name> Evidence`. A case that needs the three-platform result passes with that evidence commit, and the task that adds the test files closes before the phase commit.

Rules 10, 11, and 12 are new in this plan. The backlog gives each one in full. The owner decisions of 2026-11-27 changed rules 10 and 11. See Change History.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| A person does not need to tell an agent to sync. After a commit or a merge in a project with hooks on, the work store has the file changes, or the person sees one line that says what waits and which command settles it. | [PRD 52](../../prd/52-work-store-and-work-queue.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) | The git hooks and the line that a hook prints | [P4](04-git-hook-proofs.md), [P5](05-git-hooks-in-setup.md) | Two-checkout test, two-worktree test, `git pull --rebase` test, hook runs with read-only and no Store access | None |
| One command, the checkpoint, tells the person or agent all that is due: what it synced, each conflict with its settle command, each claim that ended, and the next ready work. | PRD 52, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | `make-docs project checkpoint`, its help, its plain and `--json` output, `project_checkpoint` | [P1](01-checkpoint-command.md) | Installed runs for six cases, CLI and MCP parity tests, Guided Progress Review of the plain output | None |
| When work files changed and the store does not have them yet, the next Make Docs command says so in one line with the exact command. | PRD 52, PRD 39 | The reminder line, and the first lines of `work next` and `work status` | [P2](02-reminder-and-read-commands.md) | Reminder tests, `PERF-006`, Guided Progress Review of the line | None |
| A git action never fails because of Make Docs. The hooks print nothing when no sync change and no conflict waits. | PRD 07, [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | The four hook blocks | P4, P5 | Exit code and silence tests on each platform, `PERF-007` | None |
| Setup shows each hook that it would install, where it goes, and what it runs, before it writes. `setup remove` takes out only what Make Docs put in. | PRD 07, [PRD 38](../../prd/38-global-store-and-project-state.md) | The setup hook review, the machine preference question, and the `setup remove` plan | P5 | Setup and removal tests with a hook of another tool, the machine preference tests, Guided Progress Review of the hook review | None |
| Without a Store, nothing new happens and nothing fails. The routers still say the true thing: the files are the authority. | PRD 52, [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | The checkpoint result, the routers, and the hooks with no Store | P1, [P3](03-routers-and-mcp-instructions.md), P5 | No-Store tests for each surface, Human Experience Review of the router lines | None |

The person does not need to know the event list, the adapters, the ledger, or the digests. No promise needs an accepted obligation.

## Performance Evidence Plan

Authority: [Performance Evidence Governance Contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). Both candidates come from the design. Each one is a characterization with no speed promise. Each one reuses the method of `PERF-004` in [W29 R0 P6](../../work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs). `PERF-005` is the highest profile ID in use, so the next two IDs are `PERF-006` and `PERF-007`.

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| The change check that a Make Docs command runs before it prints the reminder line. | `create` | `characterize-now` | `characterization-baseline` | `PERF-006`, owned by [P2](02-reminder-and-read-commands.md) | The P2 work phase owns the budget and the stop rule. | P2, after the reminder check exists. |
| The checkpoint that a git hook runs after a commit, a merge, a rewrite, and a branch change. | `create` | `characterize-now` | `characterization-baseline` | `PERF-007`, owned by [P4](04-git-hook-proofs.md) | The P4 work phase owns the budget and the stop rule. | P4, after the P1 checkpoint exists and before P5 builds the hooks. |

`PERF-006` informs whether the exact check of design OD-6 option A stays acceptable on each command. `PERF-007` informs owner gate OG-4: a foreground run or a run that starts and returns. P4 measures it and brings the gate, and the gate blocks P5. Neither result becomes a product target.

## Coordinate Decision

- Coordinate: `W35 R0`
- Classification: `new-wave`
- Evidence: Step 1 of the wave-model decision procedure decides. The owner said "the next Wave" on 2026-11-27, and the design handoff recommends W35 R0. A scan of `docs/plans/`, `docs/work/`, `.make-docs/archive/plans/`, and `.make-docs/archive/work/` on 2026-11-27 found W34 as the highest Wave, so the next Wave is W35. The outcome test agrees. The related completed coordinate is W29 R0. Its plan promised sync at the start of each work command, and release 2.1.0 delivered that. No Wave promised that agents reach those commands with no person, and no Wave promised any hook. The checkpoint operation, the reminder, and the hooks are new capabilities, so this is new work and not a revision of W29 R0.
- Could an unfinished Wave absorb the outcome? Three backlogs are not complete: W22 R1 (checkout move), W22 R2 (portable checkout adoption), and W34 R0 (one task that waits for a release). None of them promised work store sync or hooks, so none can absorb this outcome, and no owner question is needed under the procedure.
- Significant deviation test and owner gates: at its first commit this plan amended no committed plan or backlog, so the test did not apply. The edit of 2026-11-27 records owner answers to the plan's own gates. It stays inside the stated scope, so it is not a significant deviation. It has a Change History entry at the end of this file.

## Lifecycle Departure

The default arc is design, plan, PRD, then work backlog. This plan departs from it in one way, and says so here as the lifecycle reference requires. No separate PRD pass runs before the backlog. Each PRD change lands inside the phase that builds its behavior, with its Requirement History entry.

Reason: the name catalog test and the shipped-text test fail a current PRD line that names a `make-docs` command or an MCP tool before the catalog holds it. W34 R0 met the same rule and moved its name-bearing PRD lines into P1 T1. In this Wave almost every PRD change names `make-docs project checkpoint`, so a PRD pass before P1 would hold little. The orchestrator asked for this form on 2026-11-27. The backlog phases cite the PRD requirements that exist today and name each requirement that the phase adds.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Agent checkpoints and triggers design | Markdown | [2026-11-27-agent-checkpoints-and-triggers.md](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) | High. Every owner decision is settled: OD-1, OD-2, OD-3, OD-5, OD-6, OD-7, and OD-9 option A, OD-10 option B, the PRD 28 sentence change, and OD-11 to OD-15 of the third round on 2026-11-27. |
| Roadmap | Markdown | [2026-11-27-checkpoint-events-and-store-first-roadmap.md](../../assets/project/2026-11-27-checkpoint-events-and-store-first-roadmap.md) | Context only. This plan takes no scope from it. It holds the further agent tool that the owner placed there on 2026-11-27 (design OD-14). |
| Work queue code | TypeScript | `packages/cli/src/operations/work/work-queue/`, `packages/cli/src/operations/work/work-store/sync.ts` | High. Read at `86dc7dba`. |
| Operation registry and access | TypeScript | `packages/cli/src/operations/registry.ts`, `packages/cli/src/operations/access.ts` | High. |
| Name catalog | TypeScript | `packages/cli/src/operations/name-catalog.ts` | High. |
| MCP server | TypeScript | `packages/cli/src/mcp/server.ts`, `packages/cli/src/mcp/tools.ts` | High. |
| Agent tool adapters | TypeScript | `packages/cli/src/harness-access/registry.ts` | High. Three first-party adapters and one generic MCP client profile. |
| Machine setup step | TypeScript | `packages/cli/src/setup-system.ts`, `packages/cli/src/store/global-config.ts`, and the help of `make-docs setup system` in `packages/cli/src/cli.ts` | High. Read at `365b240b`. |
| Routers and work store reference | Markdown | `packages/docs/template/AGENTS.md`, `packages/docs/template/docs/work/AGENTS.md`, `packages/docs/template/.make-docs/system/references/work-store.md` | High. |
| Performance baseline | Markdown | [`PERF-004-R1`](../../work/2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record) | High for one machine and this repository. |
| Platform workflow | YAML | `.github/workflows/platform-safety.yml` | High. Its three-platform jobs run a fixed list of 14 test files on Linux, macOS, and Windows. The full CLI test suite runs on Linux only. The workflow starts only on a pull request or a manual start, and it also compares the package digest with the recorded one. |
| Release steps | Markdown | `RELEASING.md` | High. A version that exists on npm cannot be used again. |
| Twins guide | Markdown | [developing-deterministic-agentic-twins.md](../../assets/project/developing-deterministic-agentic-twins.md) | High. |

## Facts Found While Planning

These facts are not in the design. The plan uses them.

- The registry holds 75 operations at `86dc7dba`. 54 of them declare a Store read or a Store write. Four of those 54 declare no project access (`setup.store.check`, `setup.store.clean`, `factory.tools.save`, and `factory.tools.list`), so they name no Make Docs project. Three more are excluded by the design (`work.queue.status`, `work.queue.next`, and `work.queue.sync`). That leaves 47 operations that run the reminder check, and [P2](02-reminder-and-read-commands.md) lists them.
- Six of those 47 sync first: `work.queue.claim`, `work.queue.release`, `work.queue.report`, `work.queue.close`, `work.queue.add`, and `work.queue.export` each call `syncFirst` in `packages/cli/src/operations/work/work-queue/queue.ts` before they write. Such a command imports the waiting files itself, so nothing waits when it ends. The reminder check runs after the operation, so these six show no line after a good sync. The other 41 do not sync.
- Four operations use a Store admission that is not the default: `work.queue.status`, `work.queue.next`, `work.backlog.snapshot`, and `backlog.review.refresh` declare `storeAdmission: "optional"`. The registry also has a third admission kind, `handler`, which the machine-scope factory operations use. `work.queue.status` already checks the caller's Store access inside its handler and still returns a result when the caller is denied. These are the starting point for the P1 question about one operation with two access levels.
- `storeAdmission: "optional"` is allowed only for a read-only operation with Store read access (`assertOperationStoreAdmission`). The checkpoint writes, so `optional` does not fit it as the rule stands. [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-ACCESS-17 names only `required` and `optional`.
- `backlog.review.refresh` is the only operation in the reminder set with an `mcpResultSchema`. Under the design it shows no reminder in its MCP result.
- PRD 39 R-RUN-1 lists the commands of the `work`, `backlog`, `lifecycle`, `factory`, and `check` groups. It lists no `project` command. So `project checkpoint` needs a PRD 39 command section with a registry table, as the R-SKILL-CHECK and R-DOCTOR commands have, and R-RUN-1 changes only if the name catalog test asks for it.
- The name catalog type `NameCatalogPlanner` lists the Waves that may hold a planned entry. It needs `W35 R0`.
- [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) also has lines about hooks. The owner approved only the change to the PRD 28 sentence. So the plan read each PRD 30 line to find which one must change:
  - R-ADMIT-1 must change. It asks for "a real harness capability contract". Git is not an agent tool, so a git hook cannot meet those words. The exact new words were owner gate OG-10. The owner approved them on 2026-11-27.
  - R-BOUND-1 forbids a "hook registry". This Wave builds none, so it needs no change.
  - R-BOUND-2 forbids a hook "unless that exact integration has passed R-ADMIT". With R-ADMIT-1 changed, both kinds of hook can pass, so it needs no change.
  - R-ADMIT-4 says that Make Docs does not "simulate hooks" for an unsupported harness API. A git hook is real, and P6 builds a hook method only on the real hook contract of a tool, so it needs no change.
  - R-ADMIT-5 says that each addition to the adapter list "must pass R-ADMIT before setup can show it". It names no owner review. P6 meets it with the capability evidence.
  - R-SELECT-1 says that bare setup installs no hook. The owner's answer to OG-5 on 2026-11-27 lets the machine preference install the git hooks, so R-SELECT-1 gains one sentence.
  - The Acceptance Criteria line "Default setup, sync, and Skills selection create no plugin, hook, extension, workflow-bundle, or generated package output" says the same. It changes for the same reason. The section Owner Decisions gives the exact words under OG-10.
- The workflow `.github/workflows/platform-safety.yml` runs the full CLI test suite on Linux only. A new test runs on macOS and Windows only when its file is in the fixed list of the jobs `platform-contract` and `installed-package`. P4 and P5 each add their hook test files to both lists.
- The same workflow compares the package digest with `.github/release-candidates/v<version>.sha256` on each pull request. Package bytes change from P1 on, and version 2.1.0 is released. So the version must be chosen before the first P1 commit, and each phase commit must record the digest again. See standing rule 10. The owner chose version 2.1.1 on 2026-11-27 (owner gate OG-8).
- The machine preference of OD-1 left one case open. The design said that the preference makes "yes" the default answer for each new project. It did not say what a non-interactive `setup --yes` does. PRD 30 R-SELECT-1 and its Acceptance Criteria line say that bare or default setup installs no hook. [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) R-SETUP-CLI-10 says "`--yes` is approval only", but it speaks of the connection methods of agent tools and names no git hook. Owner gate OG-5 asked, and the owner answered on 2026-11-27 (design OD-11).
- The machine step of setup exists today. PRD 07 R-SETUP-CLI-4 says: "`setup system` opens the machine portion directly. Project setup may open the same flow inline." The code is `runSystemSetupCommand` and `promptForSystemSetupMethods` in `packages/cli/src/setup-system.ts`, and interactive project setup calls the second one after the person selects the agent tools. So the first setup on a computer and each later change of the machine setup pass through this one flow. Installing the npm package asks no question, and no other step sets up the machine.
- That step can ask a question today, but only one kind: it asks one connection method for each selected agent tool (`selectMethods`). It asks no machine preference. Its non-interactive form takes only method inputs and the inputs that skip an agent tool, as the help of `make-docs setup system` lists them. Global config (`config.json` in the Store, `packages/cli/src/store/global-config.ts`, PRD 38 R-STORE-2) holds `selfUpdate`, `marketplaceAutoRegistration`, and the agent tool intent. No setup step asks for either of the first two today. So the preference question and its non-interactive input are new work, and P5 T6 and T7 hold it. No new command is needed.
- Git does not copy hooks on clone, so a committed project setting cannot say that a clone has hooks. The plan puts no hook setting in project config. The Store record is the state for a clone, and the machine preference lives in global config. So [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) does not change.
- `syncWorkFiles` and `previewWorkSync` already take the options `projection` and `holdWrites`, and the first sync of a checkout already only imports. P1 checks whether the import-only trigger run can reuse one of these paths.
- The work rule catalog `make-docs.work-store-rules.v1` ends at `WORK-RULE-054`. The checkpoint rules start at `WORK-RULE-055`.
- The glossary has no entry for "checkpoint". `make-docs lifecycle checkpoint` has another meaning, so P1 adds entries that keep the two apart.
- The register's next free numbers are D-082, Q-027, and R-039.
- No backlog has an `evidence.md` at the time of drafting unless it already retains evidence. The coverage-pass contract says not to create an empty report. So this backlog has no `evidence.md` yet, and P1 creates it with the first retained evidence. The model Wave had one at its first commit only because its PRD pass had already produced evidence.

## New In This Plan

These parts are not in the design or in current docs. The owner should know they are new:

- The split of the design's Phase 1 into three build phases and of its Phase 2 into three build phases. See the Phase Map.
- MCP profile membership of `project_checkpoint`: `backlog`, `workflow`, and `all`, the same as the work queue tools.
- New requirement IDs: PRD 52 R-WORK-CHECKPOINT and R-WORK-REMIND, PRD 39 R-CHECKPOINT-CMD and R-RENDER-4, PRD 25 R-MCP-PROFILE-12 and R-MCP-INSTR, PRD 15 R-WORK-ROUTER, PRD 07 R-SETUP-CLI-15 and later, PRD 38 R-HOOK-STATE, and PRD 28 R-HARNESS-23. Each phase may adjust the count of IDs in a family.
- The profile IDs `PERF-006` and `PERF-007`, and their budgets in the backlog.
- The rule that the four operations with no project access show no reminder.
- No hook setting in project config.
- The owner gates OG-1 to OG-10 below. The owner answered OG-5, OG-7, OG-8, and OG-10 on 2026-11-27.
- Standing rules 10, 11, and 12, with the evidence commit that follows the pull request run.
- The rule that a gate bullet stands in the stage that the gate blocks, and never in the stage whose tasks find or bring the gate. The work store reads a gate bullet as open, and an open gate blocks every task of its stage.
- The rule that a task that is not needed closes as `superseded` and never as `cancelled`, because a cancelled unit keeps each unit that depends on it waiting.
- The builder proposes the name of the hook input flag and of the machine preference key in P5, and the owner sees both in the phase report.
- The rule that the reminder check runs after the operation, so the six commands that sync first show no line after a good sync.
- The default answer "no" of the hook offer when the machine preference is off. The plan first read it from the design's words "the person opts in". The owner decided it on 2026-11-27, so it is no longer only new.
- The recommendations R1 to R7 under OG-5 below, for details of the machine preference that the owner's words do not cover.
- A proof phase (P4) that ends before the git hook build (P5) starts.

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| The checkpoint operation, its two kinds of run, its steps, "nothing is due", the read-only caller result, and the no-Store result | `update-existing` | [PRD 52](../../prd/52-work-store-and-work-queue.md) | PRD 52 owns sync, the work queue rules, and the work operations. |
| An import-only kind of sync for a trigger run | `update-existing` | PRD 52 | R-WORK-SYNC-9 says today that each sync after the first writes and removes files. |
| The reminder: what it counts and which check it runs | `update-existing` | PRD 52 | PRD 52 owns the sync check of R-WORK-SYNC-8. |
| `work next` marks, the "list is not complete" line, and the checkpoint named first | `update-existing` | PRD 52 | R-WORK-SYNC-8 and R-WORK-QUEUE-5 own the read commands. |
| The fixed sentence of a project URI read | `update-existing` | PRD 52 | R-WORK-URI-3 owns the text of a project URI read. |
| The command name, group, inputs, and registry table; `project` group contents | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns R-TOP-1, the command sections, and the name catalog. |
| The reminder output rule: standard error, one line, at most one for each run | `update-existing` | PRD 39 | PRD 39 owns the render rules (R-RENDER). |
| MCP profile membership of the new tool; MCP server instructions; the reminder as a result field | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns R-MCP-PROFILE and the MCP surface. |
| One operation whose sync step needs more access than its read steps | `update-existing` or `none` | PRD 25 | R-ACCESS-17 owns Store admission. `none` when an existing admission kind fits. Owner gate OG-1 when none fits. |
| The root router line and the `docs/work/` router note | `update-existing` | [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | PRD 15 owns the managed router blocks. |
| The Checkpoint section of the work store reference | `update-existing` | [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) | R-WORK-RESOURCE-1 owns the content of the agent twin. |
| The sentence about hooks, and the hook method of an adapter | `update-existing` | [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | The owner approved the sentence change on 2026-11-27. PRD 28 owns the adapter contract. |
| The admission rule for a hook that no agent tool runs | `update-existing` | [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) | R-ADMIT-1 changes, because a git hook cannot meet "a real harness capability contract". R-SELECT-1 and the Acceptance Criteria line about default setup change, because the machine preference can install the git hooks. The owner approved the words on 2026-11-27 (OG-5 and OG-10). |
| The git hook offer in setup, its review, and its removal | `update-existing` | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) | PRD 07 owns the setup flow and `setup remove`. |
| The machine preference as the explicit selection for the git hooks in `setup --yes` | `update-existing` | PRD 07 | R-SETUP-CLI-10 owns what `--yes` approves. It gains one sentence, with the owner's answer to OG-5. |
| The hook ownership record and the machine preference | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md) | PRD 38 owns Store records, the field register, and global config. |
| A hook setting in project config | `none` | [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) | Git does not copy hooks on clone, so the plan adds no project config key. |
| Glossary terms: checkpoint, direct run, trigger run, event | `update-existing` | [PRD 04](../../prd/04-glossary.md) | "Checkpoint" has a second meaning in `lifecycle checkpoint`. |
| Risks: one store and many branches; `git pull --rebase`; the reminder cost and the fast path; a trigger run as a first sync; the support status of each agent tool hook, such as "preview" | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) | The design asks the plan to record them. |
| A new product PRD | `none` | None | PRDs 07, 15, 25, 28, 38, 39, and 52 own every part. The design adds no new PRD subject. |

## Existing PRDs To Update

| Existing PRD | Owning sections | Current normative update | Phase | Preserved surrounding authority |
| --- | --- | --- | --- | --- |
| [PRD 52](../../prd/52-work-store-and-work-queue.md) | New `### Checkpoint` with R-WORK-CHECKPOINT; the Operations table; R-WORK-SYNC-9; R-WORK-STORE-6; R-WORK-QUEUE-11 | The checkpoint steps and order, the direct run and the trigger run, "nothing is due", the read-only caller result, the no-Store and not-a-project results, the named checkout, the first-sync note, and no new Store table. R-WORK-SYNC-9 gains the import-only sync of a trigger run. The agent form covers the checkpoint. | [P1](01-checkpoint-command.md) | The sync table, conflict rules, claim rules, and every other operation. |
| PRD 52 | New R-WORK-REMIND; R-WORK-SYNC-8; R-WORK-QUEUE-5; R-WORK-URI-3 | The reminder counts only files that the next checkpoint run would import, from the exact check. The read commands name the checkpoint first, mark out-of-date units, and say when the list is not complete. They still change nothing. A project URI read gains its fixed sentence. | [P2](02-reminder-and-read-commands.md) | "Changes nothing" for the read commands, and `WORK-RULE-052`. |
| [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | R-TOP-1; new command section R-CHECKPOINT-CMD with a registry table; the help text of `lifecycle checkpoint` | `project` also owns the checkpoint. The section defines `make-docs project checkpoint`, `--event`, its inputs, and its access. The help of both checkpoint commands says how they differ. | P1 | The naming rules, the alias window, and every other command section. |
| PRD 39 | New R-RENDER-4; R-NAME-6 | The reminder goes to standard error, is one line, and appears at most one time for each run. The commands that show it come from the registry. R-NAME-6 covers the MCP server instructions and the hook block as shipped text. | P2, [P3](03-routers-and-mcp-instructions.md), [P5](05-git-hooks-in-setup.md) | R-RENDER-1 to R-RENDER-3. |
| [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | New R-MCP-PROFILE-12; R-ACCESS-17 only under OG-1 | `project_checkpoint` belongs to `backlog`, `workflow`, and `all`, with its access. | P1 | The other profiles and access rules. |
| PRD 25 | New R-MCP-INSTR; `Current MCP Surface` | The server sends short instructions when an agent connects. A profile with no work tool sends no work rule. A result with `mcpResultSchema` carries no reminder field. | P2, P3 | R-RENDER-3 parity of MCP output and the operation result. |
| [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | New `### Work Store Router Discovery` with R-WORK-ROUTER | The root router rule and the `docs/work/` conditional note, with the meaning that the design fixes. Both hold without a Store. | P3 | Managed block ownership and conflict review. |
| [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) | R-WORK-RESOURCE-1 | The work store reference has a Checkpoint section with shared rule IDs. | P1 | The other work resources. |
| [PRD 04](../../prd/04-glossary.md) | `## Terms` | Checkpoint (project), checkpoint (lifecycle), direct run, trigger run, and event. | P1 | Other terms. |
| [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | `### Optional Agentics Boundary` (the sentence about hooks); `## Non-Requirements` | Make Docs has no general hook product. It has two bounded kinds of hook: the git hooks that setup offers for each project, and a hook method of a first-party adapter with real capability evidence. | P5 | The adapter list and the admission rule for anything further. |
| PRD 28 | New R-HARNESS-23 | The hook method of an adapter: its events, its owned native entry, explicit selection in every mode, off by default, and the adapter contract of R-HARNESS-1 and R-HARNESS-17. Each of the three first-party adapters has one, with its support status. The machine preference for git hooks never installs it. | [P6](06-agent-tool-hooks.md) | R-HARNESS-1 to R-HARNESS-22. |
| [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) | R-ADMIT-1, R-SELECT-1, and the Acceptance Criteria line about default setup. | R-ADMIT-1 keeps "a real harness capability contract" and admits, for the git hooks that PRD 07 owns, the git hook behavior that tests prove on each supported platform. R-SELECT-1 and the Acceptance Criteria line admit the git hooks that the machine preference installs. The section Owner Decisions gives the exact words under OG-10. The owner approved them on 2026-11-27. | P5 | R-BOUND-1, R-BOUND-2, R-ADMIT-4, R-ADMIT-5, and the admission boundary for anything further. |
| [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) | New R-SETUP-CLI-15 and later; `setup remove` | Setup handles the four git hooks for each project, shows each hook path and the exact block, and needs an explicit selection: a hook input, an answer in interactive setup, or the machine preference that the person set. The machine step asks the preference question, with the default "No". `setup remove` removes only a block that still matches. R-SETUP-CLI-10 gains the sentence that the section Owner Decisions gives under OG-10. | P5 | The other setup steps and review rules. |
| [PRD 38](../../prd/38-global-store-and-project-state.md) | New R-HOOK-STATE; the R-MIN field register; the global config row | The clone owns the hook block. The Store records the exact block for the clone's shared git folder. Global config holds the machine preference. A schema change needs the owner's answer at gate OG-3 first. | P5 | Schema authority and every other record. |
| [Risk register](../../prd/03-open-questions-and-risk-register.md) | New R-039 and later; one new Q item | See the next section. | P1, P2, P4, P6, [P7](07-acceptance.md) | Other entries. |

## Genuinely New Product PRDs

None. The checkpoint, the reminder, the router lines, and the hooks are capabilities under existing owners.

## Requirement History Entries

Each entry lands in the phase that builds the behavior. Each one uses the `2026-11-27 — W35 R0 P<n>` form with the date of the change.

| Owning PRD | Coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 52 | W35 R0 P1 | New R-WORK-CHECKPOINT; Operations table; R-WORK-SYNC-9; R-WORK-STORE-6; R-WORK-QUEUE-11 | No command did all that is due. Each sync after the first wrote and removed files. | One checkpoint operation. A trigger run only imports. | Agents need one command, and a git action must not change the work tree. | [Design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) OD-5, OD-7 |
| PRD 52 | W35 R0 P2 | New R-WORK-REMIND; R-WORK-SYNC-8; R-WORK-QUEUE-5; R-WORK-URI-3 | Only `work status` and `work next` said that files wait, and they did not mark units. | A reminder on each command with Store read access, marks, the "list is not complete" line, and the URI sentence. | An agent that runs any Make Docs command learns that the store is out of date. | Design OD-2, OD-6 |
| PRD 39 | W35 R0 P1 | R-TOP-1; new R-CHECKPOINT-CMD | `project` had no checkpoint command. | `make-docs project checkpoint` and `project_checkpoint`. | Design OD-7 option A. | Design |
| PRD 39 | W35 R0 P2 | New R-RENDER-4 | No command printed a line about another capability's state. | The reminder output rule. | The reminder must not change JSON on standard output. | Design |
| PRD 25 | W35 R0 P1 | New R-MCP-PROFILE-12; R-ACCESS-17 only under OG-1 | The tool did not exist. | Profile membership and access of `project_checkpoint`. | Each ready tool needs an explicit profile. | Design |
| PRD 25 | W35 R0 P3 | New R-MCP-INSTR | The server sent only a name and a version. | The server sends short work rules when a work tool is in the profile. | Text that reaches an agent with no router read. | Design |
| PRD 15 | W35 R0 P3 | New R-WORK-ROUTER | The root router said nothing about the work store. The `docs/work/` router did not say when to prefer the CLI or when to sync. | The router rule and the conditional note. | Owner decision 2 and OD-3 option A. | Design |
| PRD 06 | W35 R0 P1 | R-WORK-RESOURCE-1 | The agent twin had no checkpoint rules. | The twin has a Checkpoint section with shared rule IDs. | Twins guide. | Design |
| PRD 28 | W35 R0 P5 | `### Optional Agentics Boundary`; `## Non-Requirements` | "Make Docs has no general plugin, hook, extension, workflow-bundle, or Playbook-generated Skill product." | The same sentence, with the two bounded kinds of hook admitted. | Owner approval of 2026-11-27 and OD-10 option B. | Design |
| PRD 28 | W35 R0 P6 | New R-HARNESS-23 | No adapter had a hook method. | A hook method for each of the three first-party adapters, with its recorded hook contract and support status. | OD-10 option B and OD-13. | Design |
| PRD 30 | W35 R0 P5 | R-ADMIT-1; R-SELECT-1; the Acceptance Criteria line about default setup | An optional integration needed "a real harness capability contract". Bare and default setup installed no hook. | The words that the owner approved on 2026-11-27. See OG-10 in Owner Decisions. | Git is not an agent tool, so a git hook could not pass the rule as written. The machine preference is an explicit selection that the person made. | Design OD-11 and OD-12 |
| PRD 07 | W35 R0 P5 | New R-SETUP-CLI-15 and later; R-SETUP-CLI-10; `setup remove` | Setup installed no git hook. `--yes` was approval only. | The git hook offer, the machine preference question, review, and exact removal. R-SETUP-CLI-10 gains: "For the git hooks, the machine preference is the explicit selection when it is on." | Owner decision 4, OD-1 option A, and OD-11. | Design |
| PRD 38 | W35 R0 P5 | New R-HOOK-STATE; R-MIN; global config | The Store had no record of a hook block, and global config had no hook preference. | The clone-owned hook record and the machine preference. | The design's rule "Who owns a shared hook block". | Design |

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Links and index | [PRD index](../../prd/00-index.md) | None. No new PRD. | Navigation only |
| Risks and decisions | `docs/prd/03-open-questions-and-risk-register.md` | P1 adds a risk for one project store with many branches and worktrees, and for a trigger run as the first sync of a checkout. P2 adds a question for the reminder cost and the "Fast path: not now" decision of 2026-11-23, which OD-6 opens again. P4 adds a risk for `git pull --rebase` and for each platform gap. P6 records the support status and the limits of each agent tool hook, and each owner answer to a stop. P7 closes what the Wave settled. | Living register |
| Plans | This plan | None in other plans. | Sequencing |
| Work | `docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/` | New backlog with `00-index.md` and seven phase files. `evidence.md` starts in P1 with the first retained evidence. | Implementation queue |
| Guides | `docs/assets/user/workflows-trying-the-work-store-and-factory.md`, `docs/assets/user/cli-setting-up-projects-and-harness-access.md`, `docs/assets/maintainer/cli-maintaining-setup-and-harness-access.md`, `docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md` | P7 updates them after the behavior exists. | Reader guidance |
| History | `.make-docs/archive/history/` | One record for each phase at closeout. | Provenance |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-checkpoint-command.md](01-checkpoint-command.md) | Add `make-docs project checkpoint` with CLI and MCP parity, its two kinds of run, its agent form, and its tests. Set the version that carries the Wave. |
| [02-reminder-and-read-commands.md](02-reminder-and-read-commands.md) | Add the reminder line, the `work next` and `work status` lines and marks, the project URI sentence, and `PERF-006`. |
| [03-routers-and-mcp-instructions.md](03-routers-and-mcp-instructions.md) | Add the router rule, the `docs/work/` note, the rest of the work store reference, and the MCP server instructions, template first. |
| [04-git-hook-proofs.md](04-git-hook-proofs.md) | Prove the git hook facts on each platform, find how a hook reaches `make-docs`, check the clone-owned record, and run `PERF-007`. |
| [05-git-hooks-in-setup.md](05-git-hooks-in-setup.md) | Build the git hook offer, the machine preference and its question at the machine step, the marked block, the refusals, the Store record, drift, and exact removal. |
| [06-agent-tool-hooks.md](06-agent-tool-hooks.md) | Record the real hook contract of each of the three agent tools, then build a hook method for each one. |
| [07-acceptance.md](07-acceptance.md) | Prove the package, check the final digest, update the guides, review the human experience, and pass the owner acceptance gate. |

The owner set two phases at design level. This plan splits them into seven build phases, and the reasons are these:

- Design Phase 1 becomes P1, P2, and P3. Each one is a change set that one reviewer can check: one operation, one output change that touches 47 commands and needs a measurement, and one set of shipped text that changes every installed project on its next update. P2 and P3 both need the command name from P1 in the name catalog first.
- Design Phase 2 becomes P4, P5, and P6. P4 holds every item that the design marks "the plan proves", "the plan finds out", or "the plan measures" for git hooks. Its results can change the build: a Store schema change stops for the owner (OG-3), the run mode needs the owner (OG-4), and a platform gap changes the hook review. So P4 ends and is reviewed before P5 builds. P6 is its own phase after the git hooks, as the owner's choice of OD-10 option B allows. It records the hook contract of each tool before it builds, so that a stop for one tool does not hold the git hooks.
- P7 is the acceptance phase, as in the model Wave.

## Dependencies

- P1 depends on nothing outside W29 R0, which is released in 2.1.0. Owner gate OG-8 is answered: the version is 2.1.1. So no gate holds the first commit of the Wave.
- P2 depends on P1, because the reminder names the checkpoint command. Its last stage waits for owner gate OG-2 (only if it opens).
- P3 Stage 1 depends on P1 and can run beside P2. P3 Stage 2 also depends on P2 Stage 2, because the MCP instructions use the result text of the read commands.
- P4 depends on P1. It can run beside P2 and P3. No owner gate blocks P4. P4 finds whether OG-3 opens and brings OG-4 to the owner, and both gates block P5.
- P5 depends on P4, on the P4 three-platform result, and on owner gates OG-3 (only if it opens), OG-4, and OG-6 (only if it opens). OG-5 and OG-10 are answered.
- P6 depends on P1 for the command and on P5 for the PRD 28 sentence. Its Stage 1 evidence can start beside P4. Owner gate OG-7 is answered, so its Stage 2 waits only for Stage 1 and for P5.
- P7 depends on P1 to P6. If P6 stops to ask the owner about one tool, P7 runs after the owner answers and P6 closes. Owner gate OG-9 blocks no stage of P7. The last P7 task brings it, and it blocks the Wave closeout.

## Wave Order

W35 R0 depends on W29 R0, which is complete and released. No other Wave depends on W35 R0. W22 R1 and W22 R2 are not complete. They own checkout move and portable checkout adoption, and this Wave must not touch the W22 R2 files. Files that this Wave and W22 can both touch are merge risks:

| File or surface | W22 change | W35 R0 change | Risk and handling |
| --- | --- | --- | --- |
| `packages/docs/template/AGENTS.md`, `packages/docs/template/CLAUDE.md`, and the installed copies | W22 R1 and R2 own managed block ownership rules. | P3 adds one line to the managed block. | A text conflict in the block. The second branch rebases and reruns the router and byte-match tests. |
| Setup flow code and PRD 07 | W22 R2 adds the adoption path to setup. | P5 adds the git hook offer. | Both change the setup flow and its review. Merge by hand and rerun the setup tests. |
| PRD 38 Requirement History and the R-MIN register | W22 R2 adds checkout records. | P5 adds R-HOOK-STATE. | History entries append at the same place. Merge by hand. |
| `packages/cli/src/operations/name-catalog.ts` | None known. | P1 adds one entry and `W35 R0` to the planner list. | Low. |
| `packages/cli/package.json`, `package-lock.json`, and `.github/release-candidates/` | A W22 phase that changes package bytes also needs a new version or a new digest. | P1 sets the version, and each phase commit records the digest. | After each merge, record the digest again under standing rule 10. |
| `.github/workflows/platform-safety.yml` | None known. | P4 and P5 add test files to the two fixed lists. | Low. Keep both lists the same. |

W22 R2 is active and changes setup. The backlog repeats the merge risk in P3 Stage 1 and in P5 Stage 2, as one plain paragraph under the stage heading. The work store reads each bullet under `### Dependencies` that names no unit as a gate that a person must mark as met (`packages/cli/src/operations/work/work-store/dependency-bullets.ts`). A merge risk is not such a gate, so it does not stand in that list. The model Wave put its merge risks there, and this plan departs from it for that reason.

Recommended order: P1, then P2, P3 Stage 1, and P4 side by side, then P3 Stage 2 after P2 Stage 2, then P5, then P6, then P7.

## Output Contract

- Design: `docs/designs/2026-11-27-agent-checkpoints-and-triggers.md`. This plan changes nothing in it. The design contract asks the planner for no edit of the design.
- Plan: this directory with `00-overview.md` and seven phase files.
- New product authority: none.
- Updated owners: PRDs 03, 04, 06, 07, 15, 25, 28, 30, 38, 39, and 52, each in the phase that the tables above name.
- Work backlog: `docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/` with `00-index.md` and seven phase files.
- No implementation source, template, Skill, PRD, registry, installation, staging, commit, push, or release change is part of this plan-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Operation owner | The checkpoint operation, catalog entry, parity, rule IDs, tests, the Checkpoint section of the reference, and the package version | New module under `packages/cli/src/operations/project/` or `packages/cli/src/operations/work/`, `registry.ts`, `name-catalog.ts`, `work-store/catalog.ts`, their tests, the work store reference in the template, `packages/cli/package.json`, `package-lock.json`, PRDs 04, 06, 25, 39, and 52 | None | P1 |
| Reminder owner | The reminder check, the read command lines and marks, the URI sentence, and `PERF-006` | The operation runner and render layer, `packages/cli/src/operations/work/work-queue/`, `packages/cli/src/mcp/tools.ts`, their tests, PRDs 25, 39, and 52 | P1 | P2 |
| Shipped text owner | Router lines, the `docs/work/` note, the reference, MCP server instructions, and the dogfood copies | `packages/docs/template/`, this repository's `AGENTS.md`, `CLAUDE.md`, `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, `.make-docs/system/references/work-store.md`, `packages/cli/src/mcp/server.ts`, PRDs 15 and 25 | P1 | P3 |
| Hook proof owner | Git fact tests on each platform, the command lookup, the access runs, the record check, and `PERF-007` | New tests under `packages/cli/tests/`, the two test lists in `.github/workflows/platform-safety.yml`, the evidence report, the register | P1 | P4 |
| Hook build owner | The setup offer, preference, block, refusals, record, drift, and removal | Setup code under `packages/cli/src/`, the Store code for the record, their tests, the two test lists in `.github/workflows/platform-safety.yml`, PRDs 07, 28, 30, 38, and 39 | P4, OG-3, OG-4, and OG-6 | P5 |
| Adapter owner | The hook contract record and the hook method of each of the three agent tools | `packages/cli/src/harness-access/`, its tests, PRD 28 | P1, P5 | P6 |
| Validation owner | Package parity, guides, Human Experience Review, register, and the acceptance evidence | The evidence report, `docs/assets/user/`, `docs/assets/maintainer/`, PRD 03, bounded fixes returned to owners | P1 to P6 | P7 |

Each phase has an independent reviewer who did not write it. The reviewer checks the phase before its commit. Each owner whose phase changes package bytes also writes the digest file under standing rule 10. The orchestrator starts the agent tool sessions and the workflow runs under standing rules 11 and 12.

## MCP Strategy

Use a document index tool for project documents and a code index tool for code during implementation. Reindex before a fall back to direct reads. The registry stays the single source: the CLI path and the MCP name come from it and from the name catalog. No worker calls the Make Docs MCP server of the installed release to prove new behavior, because that server is the released CLI and not the candidate.

## Validation

- Validate plan, PRD, work, path, link, and metadata contracts, and run `make-docs check prd` after each phase that changes a PRD.
- Prove that the name passes PRD 39 R-NAME-1 to R-NAME-4: `project_checkpoint` has 18 characters.
- Prove CLI and MCP parity for the checkpoint, in plain and JSON output, for a direct run and each trigger run.
- Prove the six installed cases of the design: nothing due, files imported, a conflict, a claim that ended, no Store, and a folder that is not a Make Docs project.
- Prove that a second run right after the first changes nothing and says that nothing is due.
- Prove that a trigger run writes and removes no project file, and that `--event branch-change` imports nothing.
- Prove that a caller with read access only gets the read steps, the line that the sync waits, and exit 0.
- Prove the twin rule ID test passes and fails on a one-sided fixture.
- Prove the reminder on each of the 41 commands of the set that do not sync first, and its absence on each excluded command. Prove that each of the six commands that sync first shows no line after a good sync, with a test that fails for a check that runs before the operation. Prove that an error in the check never fails a command.
- Run `PERF-006` and `PERF-007` within their budgets.
- Prove each template file and its dogfood copy are byte-identical, and that each router line and the MCP instructions name the current checkpoint command from the name catalog.
- Prove each git hook fact on Linux, macOS, and Windows, or name the gap. The hook test files must be in the fixed list of the platform workflow, and the result comes from a pull request run or a manual run.
- Prove how a git hook script runs on Windows, and that the hook finds the `make-docs` command there.
- Prove the two-checkout test, the two-worktree test, and the `git pull --rebase` test of the design.
- Prove that a hook exits 0 and prints nothing with no CLI, no Store, and no Make Docs install.
- Prove setup and `setup remove` beside a hook of another tool: the other tool's bytes stay the same.
- Prove the machine preference: the question at the machine step with the default "No", `setup --yes` with the preference on and off, the first choice of the interactive offer, an explicit hook input, and that neither the preference nor an update of Make Docs installs a hook by itself in a project that has none.
- Record the hook contract of each of the three agent tools with a real run and its support status, and prove each hook method through the adapter contract.
- Prove `npm run smoke:pack` passes. Prove that the digest file of version 2.1.1 equals the digest of the tarball at each phase commit and at the end.
- Run the full test suite on the maintainer machine. Record the workflow run for the full suite on Linux and for the fixed test list on the three platforms. The full suite does not run on macOS or Windows in the workflow. Record known failures.
- Complete a Human Experience Review for each promise above.

Testing decisions for each phase:

| Phase | Automated Implementation Testing | Performance Testing | Guided Progress Review | Unassisted Goal Testing |
| --- | --- | --- | --- | --- |
| P1 | Required | `not-needed-now` | Selected: the plain output of the checkpoint for the six cases | `not-needed-now` |
| P2 | Required | Selected: `PERF-006` | Selected: the reminder line and the first lines of `work next` | `not-needed-now` |
| P3 | Required | `not-needed-now` | Selected: the router lines and the MCP instructions | `not-needed-now` |
| P4 | Required | Selected: `PERF-007` | `not-needed-now` | `not-needed-now` |
| P5 | Required | `not-needed-now` | Selected: the setup hook review and the removal report | `not-needed-now` |
| P6 | Required | `not-needed-now` | Selected: the hook contract table | `not-needed-now` |
| P7 | Required | `not-needed-now` | Selected: the Human Experience Review result | `not-needed-now` |

Unassisted Goal Testing is `not-needed-now`. The triggers reach agents, not a person who must find a path unaided. The recorded agent sessions of P7 show whether an agent reaches the checkpoint with no prompt. Human Experience Review covers each surface that a person reads.

## Owner Decisions

Every design decision is settled. The gates below are new in this plan. Each one is an owner gate in the backlog. Each open gate has at most two options, the facts that the owner needs, and one recommendation. A recommendation is not a decision. A gate that says "only if" does not open when its condition does not happen. Each heading names the phase that finds or brings the gate, and the text names the stage that the gate blocks. A gate never blocks the stage whose tasks find or bring it. The gate IDs keep their first numbers.

The owner answered four gates on 2026-11-27, in the third round of decisions of that day. An answered gate blocks nothing, and it has no gate bullet in any stage of the backlog.

| Gate | State | Date | The owner's answer | Blocks |
| --- | --- | --- | --- | --- |
| OG-1 | Open, only if | None | None yet | P1 Stage 2, only if no existing Store admission kind fits. |
| OG-2 | Open, only if | None | None yet | P2 Stage 4, only if `PERF-006` shows more than 1 second. |
| OG-3 | Open, only if | None | None yet | P5 Stage 1, only if no existing Store record fits the hook block. |
| OG-4 | Open, always | None | None yet | P5 Stage 1. |
| OG-5 | Answered | 2026-11-27 | A machine preference with the default "No" says whether Make Docs installs the git hooks automatically for each project. With it on, project setup installs them with no hook input, also in `setup --yes`. With it off, `setup --yes` installs none, interactive setup offers them with "no" first, and an explicit hook input installs them. A hook of one agent tool always needs an explicit input. Design OD-11. | Nothing. |
| OG-6 | Open, only if | None | None yet | P5 Stage 2, only if P4 found a platform gap. |
| OG-7 | Answered early | 2026-11-27 | Each of the three agent tools that setup supports gets a hook method: Codex, Claude Code, and GitHub Copilot CLI. Design OD-13. | Nothing. |
| OG-8 | Answered | 2026-11-27 | Version 2.1.1, a patch release. Design OD-15. | Nothing. |
| OG-9 | Open, always | None | None yet | The Wave closeout and any release. |
| OG-10 | Answered | 2026-11-27 | The owner approved the proposed sentence of PRD 30 R-ADMIT-1, and the PRD 30 changes that OG-5 needs. Design OD-12. | Nothing. |

**OG-1 (P1, only if): What happens if no existing Store admission kind lets one operation hold two access levels?**

This gate opens only if P1 finds that neither the default admission nor the `handler` admission lets one operation sync with write access and still give a caller with read access the read steps.

- A (recommended): add the rule to PRD 25 R-ACCESS-17 that a write operation may check its access inside its handler, as `work status` does for its read. The design's "one registry operation with one MCP tool" holds.
- B: split the checkpoint into two operations, one that writes and one that reads. The design's "one operation" does not hold, and an agent must know two names.

Why A: an agent must remember one command. P1 T4 in Stage 1 finds whether the gate opens. The gate blocks P1 Stage 2, and so T6 and later.

**OG-2 (P2, only if): Does the exact check stay on each command after `PERF-006`?**

This gate opens only if `PERF-006` shows that the reminder check adds more than 1 second over the same command with no check, on this repository. The record of 2026-11-23 used the line "more than 1 second over the CLI floor" for a sync with no change. This gate uses the same 1 second for the time that the check adds.

- A (recommended): keep the exact check and limit the reminder to fewer commands.
- B: take design OD-6 option B, a stored "last check" record. It is a Store schema change, and Phase 2 then waits for it.

Why A: it needs no Store schema change. The design expects about 330 ms, so this gate is not expected to open. P2 T11 in Stage 3 finds whether it opens. The gate blocks P2 Stage 4, and so the P2 closeout.

**OG-3 (found in P4, blocks P5, only if): May the Store schema change for the clone-owned hook record?**

This gate opens only if P4 finds that no existing Store record can hold a hook block for the clone's shared git folder. The design says that the plan stops then and asks the owner.

- A (recommended): approve a schema change under PRD 38 schema authority (schema version 10), with a migration and a field register row.
- B: do not change the schema. Each checkout records the block, and `setup remove` in one worktree can then stop the hooks of the others with no report there. The design refused this form in "Who owns a shared hook block".

Why A: B is the form that the design refused, and it breaks the promise that `setup remove` takes out only what is safe to take out. P4 T11 finds whether the gate opens. The gate blocks P5 Stage 1, and so P5. It does not block P4.

**OG-4 (brought in P4, blocks P5, always): Does a git hook run the checkpoint in the foreground, or start it and return?**

- A (recommended): foreground. The hook waits for the checkpoint and prints its line right after the git action. Each commit takes longer by the measured time. `PERF-004-R1` measured about 300 ms for a sync with no change.
- B: start and return. Git returns at once. The line about what waits cannot print at the commit, so the person sees it at the next Make Docs command.

Why A: the design promises that the person sees one line after the commit when something waits, and only A keeps that promise. This recommendation stands before the measurement. P4 T15 gives the owner the `PERF-007` times and confirms the recommendation or changes it, and says which. The gate blocks P5 Stage 1, and so P5. It does not block P4.

**OG-5 (P5): With the machine preference on, does a non-interactive `setup --yes` install the git hooks?** Answered on 2026-11-27.

The plan gave two options. The owner chose a form that is neither of the two exactly. The orchestrator proposed it, and the owner chose it. The design records it as OD-11. It supersedes the text of design OD-1 option A where they differ.

The owner's answer:

- A machine preference says whether Make Docs installs the git hooks automatically for each project. The person sets it when Make Docs is first installed on the computer, or when the machine installation itself is changed. Its default is "No".
- With the preference on, project setup installs the git hooks with no hook input, also in `make-docs setup --yes`. Turning the preference on is the person's explicit choice.
- With the preference off, `make-docs setup --yes` installs no hook. An interactive project setup still offers the git hooks, with "no" selected first. An explicit hook input still installs them.
- Hooks that belong to one agent tool always need an explicit input, in every mode. The preference never installs them.

The owner's reason: git hooks are part of a different lifecycle than agent tool hooks. Agent tools are a lifecycle on top of the normal development and documentation lifecycle, so their hooks get an extra measure of caution.

Where the person sets the preference: the machine step of setup. `make-docs setup system` opens it directly, and project setup opens the same flow inline (PRD 07 R-SETUP-CLI-4). Facts Found While Planning gives the code. That step asks only connection methods today, so P5 T6 and T7 add the question and its non-interactive input. This plan adds no new command.

The two options that the plan gave, kept as history:

- A (was recommended): the preference changes only the first choice of the interactive question, and `setup --yes` installs hooks only with an explicit hook input.
- B: the preference also answers for a non-interactive run, and three PRD lines change.

The owner's answer is close to option B, with the default "No", the question at the machine step, and the rule for agent tool hooks added. So the PRD changes of option B apply. OG-10 below gives the words.

The owner's words do not cover the details below. Each one is a recommendation of this plan and not an owner decision. P5 builds each one as written, the phase report shows them to the owner, and the owner can change any of them.

- R1: an update of Make Docs never turns the preference on, and never installs a hook by itself. This follows from the owner's words that the default is "No" and that turning the preference on is the person's explicit choice.
- R2: turning the preference on writes one value of global config. It installs no hook in any project by itself. A project gets its hooks at its next project setup run. Turning the preference off removes no hook that a project already has.
- R3: with the preference on, a project setup run installs the git hooks also in a project that was set up before and has none. The owner said "for each project". The earlier design text said "for each new project".
- R4: with the preference on, an interactive project setup still shows the hook review, with "yes" selected first, and the person confirms. `setup --yes` shows the hooks in its plan output and installs them.
- R5: an explicit "no hooks" input for one run holds over the preference, so one project can stay without hooks on a computer where the preference is on.
- R6: the machine step asks the question when global config holds no answer yet, and `make-docs setup system` shows it again with the current value selected first. A non-interactive machine setup changes the preference only by an explicit input. `--yes` alone never changes it. An absent value means "No".
- R7: with the preference on, when setup must refuse the git hooks (a hook file that is not a shell script, hooks that another tool owns, or a `core.hooksPath` that points to another folder), it installs no hook, says why in one line, and the rest of the setup run goes on.

One rule stays from the first form of this gate: a bare non-interactive setup, with no `--yes`, installs no hook.

This gate blocks nothing. P5 T6, T7, and T8 build the answer.

**OG-6 (P5, only if): Does setup offer the git hooks on a platform where P4 found a gap?**

This gate opens only if P4 finds a platform where a hook cannot reach `make-docs`, or where a hook fact fails in a way that the hook review cannot cover.

- A (recommended): setup does not offer the hooks on that platform and says why in one line.
- B: setup offers them with the gap named in the hook review.

Why A: a hook that does not work as the review says breaks the promise of the review. The P4 evidence shows whether the gate opens. The gate blocks P5 Stage 2, where T10 applies the answer for that platform only.

**OG-7 (P6): Is the capability evidence table right?** Answered early on 2026-11-27.

The gate asked the owner to confirm, after P6 Stage 1, which agent tools have proof of hook support. The owner answered before the evidence, and the design records it as OD-13:

- The three agent tools that setup supports today get a hook method: Codex, Claude Code, and GitHub Copilot CLI, as the setup code and docs name them.
- The owner states that each of them supports hooks, from the owner's own check. For GitHub Copilot CLI, the owner states that the hook support is the vendor's hook support for that harness, in preview. This is the owner's statement, and this plan records no result of its own.

So the capability evidence task of P6 stays, with a changed purpose. It no longer decides whether a tool gets a hook method. It records, for each of the three tools, the real hook contract that the builder needs: the events, the configuration file and its place, the input that the hook receives, how the hook result is used, and the install and removal steps. It has one real run for each tool, and it states the honest support status, for example "preview", as PRD 28 and PRD 30 R-ADMIT-1 require. If the builder cannot find a real, usable hook contract for a tool, the task stops and asks the owner. It does not drop the tool silently.

This gate blocks nothing. The owner sees the hook contract table in the P6 phase report.

**OG-8 (P1): Which version carries this Wave?** Answered on 2026-11-27: 2.1.1, a patch release.

Version 2.1.0 is released, and `RELEASING.md` says that a version on npm cannot be used again. The pull request check compares the package digest with `.github/release-candidates/v<version>.sha256`, and package bytes change from P1 on. So the version had to be chosen before the first P1 commit.

- A (was recommended): 2.2.0, a minor release.
- B (chosen): 2.1.1, a patch release.

The owner's reason: this Wave is a patch for something that was deferred in order to ship 2.1.0 quickly. The design records it as OD-15. The digest file of this Wave is `.github/release-candidates/v2.1.1.sha256` (standing rule 10). This gate blocks nothing. P1 Stage 4 sets the version.

**OG-9 (P7, always): Does the owner accept the Wave?**

The owner reads the Human Experience Review and the evidence report, and tries the short handoff steps if the owner wishes.

- A: accept the Wave.
- B: name what must change. The work returns to the phase that owns it.

Recommendation: A when each acceptance case from A1 to A79, with the cases A53a to A53f, has recorded evidence or a named limit, and no finding is open. If not, B. The validating agent says which of the two holds when it brings the gate. P7 T13 brings the gate, so no P7 stage waits for it, and case A79 holds the stop. The gate blocks the Wave closeout and any release.

**OG-10 (P5): What are the exact new words of PRD 30 R-ADMIT-1?** Answered on 2026-11-27.

The owner approved the change to the PRD 28 sentence about hooks, with OD-1 and OD-10. R-ADMIT-1 reads today: "a future optional integration requires a traced current non-Playbook consumer and purpose, a coherent owning PRD, explicit selection, a real harness capability contract, install and uninstall behavior, ownership and provenance records, safe audit/backup/migration handling, and honest support status." Git is not an agent tool, so a git hook cannot meet "a real harness capability contract". PRD 30 R-BOUND-2 forbids a hook that did not pass R-ADMIT. So the approved git hooks could not pass PRD 30 until these words changed.

The owner approved the PRD 30 changes that are needed, and chose the answer to OG-5. The design records this as OD-12. P5 lands these exact words:

- PRD 30 R-ADMIT-1 becomes: "R-ADMIT-1 (MUST): a future optional integration requires a traced current non-Playbook consumer and purpose, a coherent owning PRD, explicit selection, a real harness capability contract or, for the git hooks that PRD 07 owns, the git hook behavior that tests prove on each supported platform, install and uninstall behavior, ownership and provenance records, safe audit/backup/migration handling, and honest support status." The owner approved this sentence.
- PRD 07 R-SETUP-CLI-10 gains: "For the git hooks, the machine preference is the explicit selection when it is on." Follows from D1; shown to the owner on 2026-11-27.
- PRD 30 R-SELECT-1 gains: "The git hooks are installed only by an explicit hook input, by an explicit answer in interactive setup, or by the machine preference that the person set." Follows from D1; shown to the owner on 2026-11-27.
- The PRD 30 Acceptance Criteria line becomes: "Default setup, sync, and Skills selection create no plugin, extension, workflow-bundle, or generated package output, and no hook other than the git hooks that R-SELECT-1 admits." Follows from D1; shown to the owner on 2026-11-27.

D1 is the owner's answer to OG-5, which the design records as OD-11. No other PRD 30 requirement changes. See Facts Found While Planning. This gate blocks nothing. P5 T16 writes the PRD 30 words, and P5 T17 writes the PRD 07 sentence.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, start P1 in the work backlog. The version is 2.1.1 (OG-8, answered). Each phase changes its PRDs as it builds, then passes an independent review before its commit.
- Why: The work backlog exists beside this plan, and each PRD change lands in the phase that builds its behavior. See Lifecycle Departure.
- Coordinate Handoff: Carry W35 R0 into the requirement-history entries, the phase history records, and docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/.

## Change History

### 2026-11-27 — W35 R0

- Kind: `edit`
- Affected scope: owner gates OG-5, OG-7, OG-8, and OG-10; standing rules 10 and 11; P1 Stage 4; P5 Stage 2 and Stage 4; P6; P7.
- Previous scope: OG-5, OG-7, OG-8, and OG-10 were open. The machine preference changed only the default answer of the offer. PRD 30 changed in R-ADMIT-1 only, with words that waited for the owner. P6 built a hook method only for an agent tool with proof, and could end after its first stage. The version was not chosen.
- Replacement scope: the four gates are answered. A machine preference with the default "No" is the explicit selection for the git hooks when it is on, also in `setup --yes`, and the machine step of setup asks for it. PRD 30 R-ADMIT-1, R-SELECT-1, and its Acceptance Criteria line, and PRD 07 R-SETUP-CLI-10, change with fixed words. P6 records the hook contract of each of the three agent tools and builds a hook method for each one. The version is 2.1.1.
- Rationale: the owner decided these points on 2026-11-27, after the first commit of this plan.
- PRD decision: `update-existing` — PRD 07 R-SETUP-CLI-10, PRD 28 R-HARNESS-23, and PRD 30 R-ADMIT-1, R-SELECT-1, and its Acceptance Criteria line, each in its phase.
- Owner approval: the owner's decisions of 2026-11-27, third round, which the design records as OD-11 to OD-15.
- Source: [Agent Checkpoints and Triggers](../../designs/2026-11-27-agent-checkpoints-and-triggers.md)
