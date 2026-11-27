---
title: "W35 R0 Agent Checkpoints and Triggers"
kind: "work"
status: "draft"
coordinate: "W35 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved design and the plan into implementation work. Each phase changes its PRDs as it builds."
  coordinate_handoff: "Carry W35 R0 into phase history records and commits, adding the active P number."
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 Agent Checkpoints and Triggers

## Purpose

This backlog makes agents keep the work store current, and read work from it, with no person who reminds them. It adds one command, `make-docs project checkpoint`, that does all that is due. It then adds the triggers that lead to that command: a reminder line, lines in the read commands, router rules, MCP server instructions, git hooks, and a hook for each agent tool that has proof of support.

The [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) and the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md) define the scope. The owner settled every design decision on 2026-11-27: option A of OD-1, OD-2, OD-3, OD-5, OD-6, OD-7, and OD-9, option B of OD-10, and the change to the PRD 28 sentence about hooks.

The rules that exist today live in [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-STORE-1 to R-WORK-STORE-3 and R-WORK-SYNC-1 to R-WORK-SYNC-18, [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-NAME-1 to R-NAME-6, [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-ACCESS-1 to R-ACCESS-19, [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) R-HARNESS-1 and R-HARNESS-17, and [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md). No PRD pass ran before this backlog. Each phase lands its own PRD changes with a Requirement History entry, because the name catalog test fails a PRD line that names a command before the catalog holds it. The plan records this departure from the default lifecycle order.

Implementation needs separate owner authority. Status: not started.

Out of scope:

- A person-editable event registry, a file watcher, a gateway, and designs, plans, or archives in the Store. The [roadmap](../../assets/project/2026-11-27-checkpoint-events-and-store-first-roadmap.md) holds them.
- A store that holds work for each branch.
- A machine-wide git hooks path.
- Any release or publish action.

## Standing Rules

These rules hold in every phase.

1. NEVER read or write the real Store at `~/.make-docs`. Each test and proof uses a temporary `MAKE_DOCS_HOME` at a fixed path that the run checks before use. An empty `MAKE_DOCS_HOME` means the real Store, so a run stops when the value is empty.
2. No new Python. Logic lives in the TypeScript CLI, with a written agent twin under the [twins guide](../../assets/project/developing-deterministic-agentic-twins.md). A change to one form needs a review of the other.
3. Template first. Write each shipped text in `packages/docs/template/`, then make this repository's copy in `.make-docs/` or `docs/` byte-identical. `.agents/skills/<name>/` matches `packages/skills/<name>/`.
4. Tool-agnostic text. Skills, resources, tests, and guides name no vendor, tool, or product. The one exception is a place where existing setup code and docs already name an agent tool, and then in the same way.
5. A git hook never fails or blocks a git action. It always exits 0. It does nothing with no Store, no Make Docs project, or no `make-docs` command.
6. Every behavior works, or does nothing, without a Store.
7. Say when a behavior is new. Record no owner decision that the owner did not make. An item that needs an owner choice is an owner gate below.
8. Each phase ends with an independent review, by a reviewer who did not write the phase, before its commit. The commit form is `feat: [W35 R0 P<n>] Agent Checkpoints and Triggers - <Phase name>`.
9. Do not touch `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/**`, `docs/plans/2026-11-13-w22-r2-portable-checkout-adoption/`, or `docs/designs/2026-11-13-portable-checkout-adoption.md`.
10. Record the package digest again in every phase commit that changes package bytes. The pull request check "Match the reviewed candidate digest" in `.github/workflows/platform-safety.yml` compares the packed tarball with `.github/release-candidates/v<version>.sha256` on each pull request, so an old digest fails the check. The steps: run `npm run prepack -w packages/cli`; run `npm pack --json --ignore-scripts` in `packages/cli`; write the SHA-256 of the tarball as one lowercase hex line to the digest file of the current version; delete the tarball; and put the digest file in the same commit. A commit changes package bytes when the new digest differs from the recorded one. Do this after the last change of the phase, and again after a merge that changes package bytes. The phase reviewer checks it. Never change the digest file of a released version.
11. One rule says who runs a proof inside an agent tool. P4 T10, P6 T1, and P7 T5 need such runs. The orchestrator starts a session in each first-party agent tool that its environment can start, gives the session the listed steps, and records which tool ran which proof. For a tool that the environment cannot start, the owner runs the listed steps and gives back the output. If the owner does not, the proof is not gathered: the record says "no proof gathered", and that tool gets no hook method.
12. One rule says where a three-platform result comes from. The job `platform-contract` of `.github/workflows/platform-safety.yml` runs a fixed list of test files on Linux, macOS, and Windows, and the job `installed-package` runs the same list again. The full CLI test suite runs on Linux only, in the job `package-candidate`. The workflow starts only on a pull request or on a manual start. So a test runs on three platforms only when its file is in both lists (P4 T8 and P5 T14 add the hook test files), and the result exists only after the reviewed phase commit is pushed. The orchestrator pushes the commit and starts the run through the pull request, or starts a manual run on the branch. The order is: the phase commit, the push, the pull request run, then one evidence commit of the form `docs: [W35 R0 P<n>] Agent Checkpoints and Triggers - <Phase name> Evidence`. The implementing agent records the link to the run and each platform result in `evidence.md` in that evidence commit. So cases A39, A41, and A60 pass only with the evidence commit. The tasks that add the test files (P4 T8, P4 T9, and P5 T14) close before the phase commit, when their files are in both lists and their tests pass on the maintainer machine. A platform failure returns to the phase as a correction, with its own review.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: a person does not need to tell an agent to sync. After a commit or a merge in a project with hooks on, the work store has the file changes, or the person sees one line that says what waits and which command settles it. | [Design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md), [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md) | PRD 52 R-WORK-SYNC-2 and the new R-WORK-CHECKPOINT; [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) new R-SETUP-CLI-15 and later | [P4](04-git-hook-proofs.md), [P5](05-git-hooks-in-setup.md) | Two-checkout, two-worktree, and `git pull --rebase` tests; hook runs with read-only and no Store access | P5 closeout | None |
| `direct`: one command, the checkpoint, tells the person or agent all that is due. | Same | PRD 52 new R-WORK-CHECKPOINT; PRD 39 new R-CHECKPOINT-CMD | [P1](01-checkpoint-command.md) | Six installed cases, CLI and MCP parity tests, Guided Progress Review of the plain output | P1 closeout | None |
| `direct`: when work files changed and the store does not have them yet, the next Make Docs command says so in one line with the exact command. | Same | PRD 52 R-WORK-SYNC-8 and new R-WORK-REMIND; PRD 39 new R-RENDER-4 | [P2](02-reminder-and-read-commands.md) | Reminder tests, `PERF-006`, Guided Progress Review of the line | P2 closeout | None |
| `direct`: a git action never fails because of Make Docs, and the hooks print nothing when no sync change and no conflict waits. | Same | PRD 07; PRD 28 | P4, P5 | Exit code and silence tests on each platform, `PERF-007` | P5 closeout | None |
| `direct`: setup shows each hook that it would install, where it goes, and what it runs, before it writes. `setup remove` takes out only what Make Docs put in. | Same | PRD 07; [PRD 38](../../prd/38-global-store-and-project-state.md) new R-HOOK-STATE | P5 | Setup and removal tests beside a hook of another tool, Guided Progress Review of the hook review | P5 closeout | None |
| `direct`: without a Store, nothing new happens and nothing fails, and the routers still say that the files are the authority. | Same | PRD 52 R-WORK-STORE-2; PRD 15 new R-WORK-ROUTER | P1, [P3](03-routers-and-mcp-instructions.md), P5 | No-Store tests for each surface, Human Experience Review of the router lines | [P7](07-acceptance.md) closeout | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-checkpoint-command.md](01-checkpoint-command.md) | Add `make-docs project checkpoint` with CLI and MCP parity, its two kinds of run, its agent form, and its tests. Set the version that carries the Wave. |
| [02-reminder-and-read-commands.md](02-reminder-and-read-commands.md) | Add the reminder line, the `work next` and `work status` lines and marks, the project URI sentence, and `PERF-006`. |
| [03-routers-and-mcp-instructions.md](03-routers-and-mcp-instructions.md) | Add the router rule, the `docs/work/` note, the trigger text of the work store reference, and the MCP server instructions, template first. |
| [04-git-hook-proofs.md](04-git-hook-proofs.md) | Prove the git hook facts on each platform, find how a hook reaches `make-docs`, check the clone-owned record, and run `PERF-007`. |
| [05-git-hooks-in-setup.md](05-git-hooks-in-setup.md) | Build the git hook offer, the machine preference, the marked block, the refusals, the Store record, drift, and exact removal. |
| [06-agent-tool-hooks.md](06-agent-tool-hooks.md) | Gather capability evidence for each agent tool, then build a hook method only for a tool with proof. |
| [07-acceptance.md](07-acceptance.md) | Prove the package, check the final digest, update the guides, review the human experience, and pass the owner acceptance gate. |

## Owner Gates

A gate stops only the work that it names. The owner decides each one. Each gate has at most two options and one recommendation, and the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) gives the facts for each. A recommendation is not a decision. No gate is decided yet. The work store reads each gate bullet under `### Dependencies` as an open gate, and an open gate blocks every task of its stage. So a gate bullet stands only in the stage that the gate blocks, and never in the stage whose tasks find or bring the gate. The gate IDs keep their first numbers, so OG-8 sits in P1 now, and OG-10 is new.

| Gate | Found or brought by | Opens | The owner chooses | Recommended | Blocks |
| --- | --- | --- | --- | --- | --- |
| OG-1 | [P1](01-checkpoint-command.md) T4, in Stage 1 | Only if no existing Store admission kind lets one operation hold two access levels. | A: a new access rule in PRD 25. B: two operations in place of one. | A | P1 Stage 2, and so T6 and later. |
| OG-2 | [P2](02-reminder-and-read-commands.md) T11, in Stage 3 | Only if `PERF-006` shows that the reminder check adds more than 1 second over the same command with no check. | A: keep the exact check on fewer commands. B: take a stored signal with a Store schema change. | A | P2 Stage 4, and so the P2 closeout. |
| OG-3 | [P4](04-git-hook-proofs.md) T11, in Stage 2 | Only if no existing Store record can hold the clone-owned hook block. | A: approve a Store schema change. B: record the block for each checkout, a form that the design refused. | A | [P5](05-git-hooks-in-setup.md) Stage 1, and so P5. It does not block P4. |
| OG-4 | P4 T15, in Stage 3 | Always, after `PERF-007`. | A: a hook runs the checkpoint in the foreground. B: a hook starts the checkpoint and returns. | A. P4 T15 confirms or changes this with the measured times. | P5 Stage 1, and so P5. It does not block P4. |
| OG-5 | The orchestrator, before P5 Stage 2 | Always. | A: with the machine preference on, `setup --yes` installs the hooks only with an explicit hook input. B: with the preference on, `setup --yes` installs them with no hook input, and three PRD lines change: PRD 07 R-SETUP-CLI-10, PRD 30 R-SELECT-1, and the PRD 30 Acceptance Criteria line about default setup. Under both options the default answer of the offer is "no" when the machine preference is off. That default is new behavior in this plan. | A | P5 Stage 2, where T8 uses the answer. |
| OG-6 | The P4 evidence, before P5 Stage 2 | Only if P4 found a platform gap that the hook review cannot cover. | A: do not offer the hooks on that platform. B: offer them with the gap named. | A | P5 Stage 2, where T10 applies the answer for that platform. |
| OG-7 | [P6](06-agent-tool-hooks.md) T3, in Stage 1 | Always, after the capability evidence. | A: confirm the evidence table as written. B: name each row that is not proved, and that row goes back to P6 Stage 1. | A | P6 Stage 2. |
| OG-8 | The orchestrator, from the start of P1 | Always. | A: version 2.2.0. B: version 2.1.1. | A | P1 Stage 4, and so the first commit of the Wave. |
| OG-9 | [P7](07-acceptance.md) T13, in Stage 3 | Always. | A: accept the Wave. B: name what must change. | A, when each acceptance case has evidence and no finding is open. If not, B. | The Wave closeout and any release. It blocks no stage. Case A79 holds the stop. |
| OG-10 | The orchestrator, before P5 Stage 4 | Always, before the PRD 30 edit. | A: approve the proposed new sentence of PRD 30 R-ADMIT-1. B: give other words for it. | A | P5 Stage 4, where T16 writes the words. |

## Wave Sequence

- Waits for: nothing. [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) is complete and released in 2.1.0.
- Runs beside: [W22 R1](../2026-10-31-w22-r1-checkout-move-and-block-ownership/00-index.md) and W22 R2, which are not complete. This Wave must not touch the W22 R2 files.
- Next: no Wave waits for this one.
- Recommended order: P1, then P2, P3 Stage 1, and P4 side by side, then P3 Stage 2 after P2 Stage 2, then P5, then P6, then P7.

Files that this Wave and W22 can both touch are merge risks:

| File or surface | W22 change | W35 R0 change | Handling |
| --- | --- | --- | --- |
| `packages/docs/template/AGENTS.md`, `packages/docs/template/CLAUDE.md`, and the installed copies | Managed block ownership rules. | P3 adds one line to the managed block. | The second branch rebases and reruns the router and byte-match tests. |
| Setup flow code and PRD 07 | W22 R2 adds the adoption path to setup. | P5 adds the git hook offer. | Merge by hand and rerun the setup tests. |
| PRD 38 Requirement History and the R-MIN register | W22 R2 adds checkout records. | P5 adds R-HOOK-STATE. | History entries append at the same place. Merge by hand. |
| `packages/cli/package.json`, `package-lock.json`, and `.github/release-candidates/` | A W22 phase that changes package bytes also needs a new version or a new digest. | P1 sets the version, and each phase commit records the digest. | After each merge, record the digest again under standing rule 10. |
| `.github/workflows/platform-safety.yml` | None known. | P4 T8 and P5 T14 add test files to the two fixed lists. | Low. Keep both lists the same. |

The phase files repeat a merge risk as one plain paragraph under the stage heading: [P3 Stage 1](03-routers-and-mcp-instructions.md#stage-1---router-lines-and-the-reference) and [P5 Stage 2](05-git-hooks-in-setup.md#stage-2---the-setup-offer-and-removal). The work store reads each bullet under `### Dependencies` that names no unit as a gate that a person must mark as met. A merge risk is not such a gate, so it does not stand there. The model Wave put its merge risks in that list, and this backlog departs from it for that reason.

## Usage Notes

- Read phases in order. P2 and P4 each depend only on P1. P3 Stage 1 depends only on P1, and P3 Stage 2 also needs P2 Stage 2, because the MCP instructions use the result text of the read commands. So P2, P3 Stage 1, and P4 can run side by side. P5 waits for P4, for the P4 platform result, and for its gates. P6 Stage 1 can start beside P4.
- P1 T1 to T3 are the name gate. The catalog entry lands in T1, the PRD lines that name the command and the tool land in T2, and the test check lands in T3. No later phase names `make-docs project checkpoint` in shipped text before P1 turns the entry `current`.
- Every phase file includes `## Source PRD Docs`. It lists the requirements that exist today. Each phase names the requirements that it adds in its tasks.
- Acceptance case IDs run from A1 to A79 across this backlog. The backlog has 100 tasks.
- Each item that the design marks "the plan proves", "the plan finds out", or "the plan measures" has its own named task, or three tasks for the git facts. P1 T4 and T5, P2 T2 and T9 to T11, and P4 T1 to T7 and T9 to T15 hold them.
- Performance: `PERF-006` is owned by [P2](02-reminder-and-read-commands.md) and `PERF-007` by [P4](04-git-hook-proofs.md). Each phase writes its profile before any measurement and reuses the method of [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs).
- Evidence: this backlog has no `evidence.md` yet, because the coverage-pass contract says not to create an empty report. P1 creates `evidence.md` in this folder with its first retained evidence and adds its link here. Each later phase adds its section.
- Source register entries: none exist yet. P1, P2, P4, and P6 add them. No `O-###` obligation or `NUAT-###` scenario is in scope. Unassisted Goal Testing is `not-needed-now`.
- Status: not started on 2026-11-27. The front matter says `draft` until the owner gives phase-start authority. Then the index and the first phase become `active`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, ask owner gate OG-8 first, then start P1 and continue phase by phase. Stop at each owner gate that opens.
- Why: The backlog turns the approved design and the plan into implementation work. Each phase changes its PRDs as it builds.
- Coordinate Handoff: Carry W35 R0 into phase history records and commits, adding the active P number.
