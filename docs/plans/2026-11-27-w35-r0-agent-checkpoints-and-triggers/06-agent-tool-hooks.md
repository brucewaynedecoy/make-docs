---
title: "W35 R0 P6 Agent Tool Hooks"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P6"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P6 Agent Tool Hooks

## Purpose

Reach an agent that never commits, where its agent tool can run a hook. This is the third part of the design's Phase 2, under OD-10 option B. The phase gathers proof first and builds only for a tool with proof.

## Outcome

One evidence record for each agent tool that setup supports today. One hook method for each tool whose evidence shows support. No hook method, and a recorded reason, for each other tool. The phase can end after its first stage with no harm.

## Scope

- Stage 1, capability evidence. Setup has three first-party adapters in `packages/cli/src/harness-access/registry.ts` and one generic MCP client profile. For each of the three adapters, a task gathers real capability evidence, as PRD 28 and PRD 30 R-ADMIT-1 require: whether the tool can run a command when a session starts and when a turn ends, where its configuration lives, whether Make Docs can own one entry there and leave the rest, what the tool passes to the command, and whether a checkpoint that the hook starts passes that tool's Store access rules. Evidence is a real run in the tool with a temporary Store. A page of documentation alone is not proof. Standing rule 11 says who starts each session: the orchestrator for each tool that its environment can start, and the owner for the others. A tool with no run gets no hook method, with the recorded reason "no proof gathered".
- The generic MCP client profile gets no hook method.
- Owner gate OG-7. The owner sees the evidence table and confirms it, or names a row that is not proved. The gate does not open design OD-10 again. It blocks Stage 2, not Stage 1.
- Stage 2, one hook method for each tool whose confirmed row shows proof. Each method fires `session-start`, `turn-end`, or both, and runs the checkpoint with that event, so the run is a trigger run. Each method follows the adapter contract: one owned native entry, planning, apply, verification, repair, and removal (PRD 28 R-HARNESS-1), and a receipt that records its history (R-HARNESS-17). The person selects the method explicitly in setup. It is off by default. A hook method is an extra choice beside the one connection method of an agent tool (PRD 07 R-SETUP-CLI-10, PRD 28 R-HARNESS-2). It does not replace that method. A non-interactive run with no hook input adds no hook method.
- A hook method writes host configuration, so it uses the separate system approval and the adapter-owned planner of PRD 25 R-ACCESS-5, and keeps unknown and user-owned entries.
- A tool with no proof gets no hook method. The register records the tool, what was tried, and the reason. The git hooks, the router rule, the MCP instructions, and the reminder still cover it.
- When no tool has proof, the build tasks of Stage 2 do not run. They close as `superseded`, not as `cancelled`, because readiness counts only `done` and `superseded` as met, and a cancelled unit keeps each unit that depends on it waiting. The phase closes as done with the evidence and the recorded reasons, so P7 is not blocked. PRD 28 then says that no adapter has a hook method today.
- PRD changes: PRD 28 (new R-HARNESS-23, and the adapter method list), and PRD 07 if the method screen needs a new line, each with a Requirement History entry.
- Agent form: none beyond P3. The hook runs the same command that the router names.

## Exclusions

- No claim of hook support without a real run.
- No simulated hook for a tool that has none (PRD 30 R-ADMIT-4).
- No general hook registry or API.

## Acceptance

- Each of the three adapters has an evidence record with a real run and the name of who started the session, or the recorded reason "no proof gathered".
- Each built hook method passes the adapter tests for plan, apply, verify, repair, and removal, and keeps every entry that Make Docs does not own.
- A session in each tool with a hook method reaches the checkpoint at the event with no prompt from the person.
- Each tool with no hook method has its reason in the register.

## Testing Decisions

- Automated Implementation Testing: required for each built method.
- Performance Testing: `not-needed-now`. A hook method runs the checkpoint that `PERF-007` measured. A `turn-end` hook that adds a wait a person notices is recorded as a finding.
- Guided Progress Review: selected. The owner sees the evidence table at OG-7.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1 for the command. P5 for the PRD 28 sentence. Stage 1 can start beside P4.
- Owner gate OG-7, before Stage 2.
