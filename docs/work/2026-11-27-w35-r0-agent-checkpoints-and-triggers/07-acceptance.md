---
title: "Phase 7: Acceptance"
kind: "work"
status: "draft"
coordinate: "W35 R0 P7"
source:
  type: "prd"
  path: "docs/prd/03-open-questions-and-risk-register.md"
---

# Phase 7: Acceptance

## Purpose

Prove the Wave on the installed package, update the guides, and bring the result to the owner. It depends on P1 to P6. P6 may have ended after its first stage. It also fixes the fault of [register entry R-042](../../prd/03-open-questions-and-risk-register.md), before the package proof.

## Overview

This phase runs every Wave test on the packed package, records the agent sessions that the [design](../../designs/2026-11-27-agent-checkpoints-and-triggers.md) asks for, updates the user and maintainer guides, and completes a Human Experience Review of each promise in the [index](00-index.md#human-experience-trace). Then it checks the final package digest and brings the acceptance gate to the owner. The owner chose version 2.1.1 on 2026-11-27 (owner gate OG-8, answered), and [P1](01-checkpoint-command.md) set it. It adds no behavior, with one exception: [Stage 4](#stage-4---the-fix-for-an-unknown-option-on-a-write-command) makes a write command refuse an option that it does not know (register entry R-042). The owner decided on 2026-11-27 to fix R-042 in this Wave. The owner did not choose the phase. The orchestrator placed it in P7. So this phase builds product code, and it needs its own independent review and a digest record under standing rule 10. Any other finding returns to the phase that owns the code.

The [standing rules](00-index.md#standing-rules) of the index hold in this phase.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Every promise in the index trace, reviewed on the real output, the real router text, and the real setup review.
- Intended human outcome: the owner reads one review that says, for each promise, what was seen, what it shows, and its limits, and can try the result in three short steps.
- Human-facing surface or indirect effect: the checkpoint output, the reminder line, the router lines, the setup hook review, and the guides.
- Implementation work: test runs, recorded sessions, guide updates, the Human Experience Review, the register update, and the evidence report. Stage 4 adds one change to how a write command treats an option that it does not know, with its tests.
- Evidence source or testing type selected under current authority: the full test suite on the maintainer machine and on Linux, the fixed test list on Linux, macOS, and Windows under [standing rule 12](00-index.md#standing-rules), `npm run smoke:pack`, the installed runs, and the Human Experience Review result as a Guided Progress Review.
- Executor: the validating agent prepares it. The orchestrator starts the workflow run and the agent tool sessions under standing rules 11 and 12. The owner reviews the result and answers the gate.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | The full suite on the maintainer machine and on Linux, the fixed test list with this Wave's hook tests on Linux, macOS, and Windows, `npm run smoke:pack`, and the installed package runs. Stage 4 adds the tests for an option that a write command does not know. |
| Performance Testing | not-needed-now | [P2](02-reminder-and-read-commands.md) and [P4](04-git-hook-proofs.md) own `PERF-006` and `PERF-007`. This phase reuses their results unless the evidence fingerprint changed. |
| Guided Progress Review | selected | The owner sees the Human Experience Review result. |
| Unassisted Goal Testing | not-needed-now | The recorded agent sessions show whether an agent reaches the checkpoint with no prompt. No current decision needs an unassisted human run. |

## Source PRD Docs

- [52 Work Store and Work Queue](../../prd/52-work-store-and-work-queue.md): the requirements that P1 and P2 add and change
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-NAME-6 and the requirements that P1 and P2 add. Stage 4 T18 adds the rule for an option that a command does not know, here or in PRD 07.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): the requirements that P1 and P3 add
- [15 Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md): the requirements that P3 adds
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md), [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [30 Plugin Substrate and Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md), and [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): the requirements that P5 and P6 add and change
- [16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- `O-###`: none
- `NUAT-###`: none
- Findings: the register entries that P1, P2, P4, and P6 added. [Register entry R-042](../../prd/03-open-questions-and-risk-register.md), which Stage 4 fixes and T19 closes.

## Stage 1 - Package proof

### Tasks

- [ ] T1: Pack the CLI and install the package in a temporary folder. With a temporary `MAKE_DOCS_HOME` at a fixed, checked path, run the six checkpoint cases and compare each result with the source tests. Check that the tarball holds no Python file. Compute the SHA-256 digest of the tarball and compare it with `.github/release-candidates/v2.1.1.sha256`.
- [ ] T2: With the installed package of T1 and the same temporary Store, run the Phase 1 triggers: one command with the reminder, `work next` with a marked unit, a fresh setup that writes the router lines, and the MCP instructions for the `all` profile.
- [ ] T3: With the installed package of T1 and the same temporary Store, run the Phase 2 triggers: the git hook setup with the machine preference off and on, a commit that the hook imports, the removal, and each built hook method.
- [ ] T4: Run `npm run smoke:pack` and the full test suite on the maintainer machine. Then record the last workflow run of the pull request under [standing rule 12](00-index.md#standing-rules). That run gives the full suite on Linux only, and the fixed test list, with the hook tests that P4 T8 and P5 T14 added, on Linux, macOS, and Windows. The full suite does not run on macOS or Windows in the workflow, and the record says so. Record known failures.
- [ ] T5: Record the agent sessions that the design asks for. [Standing rule 11](00-index.md#standing-rules) says who starts each session. For each first-party agent tool, a session starts cold in a practice project, changes a work file, and reaches the checkpoint with no prompt from the person. The record names who started the session and which trigger did it: the router rule, the MCP instructions, the reminder, a git hook, or an agent tool hook. A tool with no session is a recorded limit with the reason "no proof gathered", not a pass.
- [ ] T6: Check each PRD that the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#existing-prds-to-update) names against the code, and run `make-docs check prd` and `make-docs check performance-evidence`. Record the state of `PERF-006` and `PERF-007`.

### Acceptance criteria

- A70: Every validation item in the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#validation) has recorded evidence or a named limit.
- A71: Each recorded agent session names its trigger, and each tool that was not run is named as a limit.
- A72: The installed package gives the same results as the source tests for the six checkpoint cases, with no Python file in the tarball and no read or write of the real Store. The installed runs of T2 and T3 each have a recorded result.

### Dependencies

- P1 to P6.
- Stage 4.

## Stage 2 - Guides and review

### Tasks

- [ ] T7: Update the guides under the guide contract and the coverage-pass contract. `docs/assets/user/workflows-trying-the-work-store-and-factory.md` gains the checkpoint, the reminder line, and the git hooks. `docs/assets/user/cli-setting-up-projects-and-harness-access.md` gains the git hook offer, the machine preference, and removal. `docs/assets/maintainer/cli-maintaining-setup-and-harness-access.md` and `docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md` gain the hook record, the reminder set, and the MCP server instructions. Each guide names only current commands and no vendor beyond what the guide already names in the same way.
- [ ] T8: Complete a Human Experience Review for each of the six promises in the index trace. Review the real checkpoint output, the real reminder line, the real setup hook review, and the real router lines, as a person who has not read the design. Record observations, a conclusion, and limits for each promise.
- [ ] T9: Give the owner a short optional experience handoff: in a practice project with a temporary Store, edit a work file and run any Make Docs command; run `make-docs project checkpoint`; then turn the hooks on and make a commit. Say what to notice at each step. Run each step as written before the owner gets it.

### Acceptance criteria

- A73: The four guides describe the result, the shipped-text test passes, and no guide names a command that the name catalog does not hold.
- A74: The Human Experience Review records a conclusion and its limits for each of the six promises.
- A75: The handoff has three steps, each with its exact command and what to notice. The evidence shows that each step ran as written in a practice project with a temporary Store. A missing owner response does not block the phase.

### Dependencies

- Stage 1.

## Stage 3 - Register, final digest check, and acceptance

### Tasks

- [ ] T10: Update the [risk register](../../prd/03-open-questions-and-risk-register.md). Close what the Wave settled, with the evidence. Keep the risk of one project store with many branches open, because the Wave does not remove it.
- [ ] T11: Make the final digest check. The owner chose version 2.1.1 on 2026-11-27 (OG-8, answered), and each phase commit recorded the digest under standing rule 10. Pack the final tarball from the last commit of the Wave, and check that its SHA-256 digest equals the one line in `.github/release-candidates/v2.1.1.sha256`. Check that the step "Match the reviewed candidate digest" passes in the last workflow run of the pull request. Change no digest file of a released version.
- [ ] T12: Add the P7 section to `evidence.md`, write the history record for this phase, and check that each earlier phase has one.
- [ ] T13: Bring owner gate OG-9 to the owner with one recommendation. The gate blocks the Wave closeout and any release, and case A79 holds that stop, so no gate bullet stands under this stage. The choice: the owner reads the Human Experience Review and the evidence report and accepts the Wave, or names what must change. After acceptance, set the index status to complete. The release steps of `RELEASING.md` belong to the owner: the draft GitHub Release, its publication, and the npm stage approval. Run no release or publish action without separate owner authority.

### Acceptance criteria

- A76: The register shows each closed and each open item of the Wave, with its evidence.
- A77: The digest file `.github/release-candidates/v2.1.1.sha256` holds the digest of the final tarball, the package candidate check passes in the pull request run, and no digest file of a released version changed.
- A78: `evidence.md` has a P7 section, and each of the seven phases has a history record under `.make-docs/archive/history/`.
- A79: The owner answered OG-9, and the evidence records the answer and its date.

### Dependencies

- Stage 2.

## Stage 4 - The fix for an unknown option on a write command

This stage was added on 2026-11-27, after the owner decided to fix [register entry R-042](../../prd/03-open-questions-and-risk-register.md) in this Wave. The owner did not choose the phase. The orchestrator placed it in P7. The stage has the next free numbers, so no earlier task or case number changed, and its number says nothing about its place in the order: Stage 1 waits for it, so that the package proof runs on the fixed code. This stage is the one part of this phase that builds product code. So this phase needs its own independent review before its commit under [standing rule 8](00-index.md#standing-rules), and a new digest record under [standing rule 10](00-index.md#standing-rules), before T1 compares the digest. The standing rules hold: each test uses a temporary Store at a fixed, checked path.

The fault: `make-docs work add "x" --dry-run` adds the quick item to the work store and ends with exit code 0. The help of the command does not list `--dry-run`. The [P2 evidence](evidence.md#p2-known-limits) holds the proof. Only `work add` was checked.

### Tasks

- [ ] T14: Find why the CLI accepts an option that a work write command does not know. Name the code that takes the option and the code that drops it, and record the cause in the P7 section of `evidence.md`.
- [ ] T15: Check every other write command of the operation registry for the same fault: run each one with an option that its help does not list, with a temporary Store, and record for each command whether it refused the option or ran. List the result for each command in the evidence report. A command that ran is a finding of this stage.
- [ ] T16: Make each write command refuse an option that it does not know. The refusal names the option and the command, gives one useful next step, ends with an error exit code, and writes nothing to the Store or to the project. Change no option that a command's help lists. Review the agent form of each changed command under the [twins guide](../../assets/project/developing-deterministic-agentic-twins.md), and record whether it needs a change.
- [ ] T17: Add tests. One test fails on the code before T16 for `make-docs work add "x" --dry-run`: after T16 the command ends with an error and the work store holds no new item. One test covers every write command of the registry with an option that it does not know, and proves that no Store record and no project file changed. One test proves that each option that a help text lists still works.
- [ ] T18: Find the PRD that owns the rule. A search on 2026-11-27 found no requirement that says what a command does with an option that it does not know. [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns the command model and the operation registry, and [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) owns the setup commands. Add the rule and a `W35 R0 P7` Requirement History entry to the PRD that owns it.
- [ ] T19: Close [register entry R-042](../../prd/03-open-questions-and-risk-register.md) when the fix has landed and the tests of T17 pass. Record the result in the P7 section of `evidence.md`, and update the R-042 lines in the P2 section of the evidence report.

### Acceptance criteria

- A79a: The evidence report names the cause: which code takes an option that a work write command does not know, and why no error follows.
- A79b: The evidence report lists every write command of the registry with its result before the fix. No write command is left out.
- A79c: `make-docs work add "x" --dry-run` ends with an error that names the option, and the work store holds no new item. The test fails on the code before T16.
- A79d: Each write command of the registry refuses an option that it does not know, with a clear message and with no write to the Store or the project. Each option that a help text lists still works.
- A79e: The PRD that owns the rule holds it, with a `W35 R0 P7` Requirement History entry, and `make-docs check prd` passes. The evidence records the twin review of T16.
- A79f: The risk register shows R-042 as closed, with a link to the evidence. This phase has an independent review of the product code, and the digest file holds the digest of the package with the fix.

### Dependencies

- P1 to P6.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
