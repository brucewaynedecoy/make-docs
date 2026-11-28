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

Reach an agent that never commits, where its agent tool can run a hook. This is the third part of the design's Phase 2, under OD-10 option B and OD-13. The owner decided on 2026-11-27 that each of the three agent tools that setup supports gets a hook method. The phase records the real hook contract of each tool first, and then builds.

## Outcome

One hook contract record for each agent tool that setup supports today: Codex, Claude Code, and GitHub Copilot CLI. One hook method for each of the three, with its honest support status. If no real, usable hook contract is found for a tool, the work stops and asks the owner.

## Scope

- Stage 1, capability evidence. Setup has three first-party adapters in `packages/cli/src/harness-access/registry.ts` and one generic MCP client profile. The owner states, from the owner's own check, that each of the three agent tools supports hooks, and that for GitHub Copilot CLI the hook support is the vendor's hook support for that harness, in preview (owner gate OG-7, answered early). So the evidence no longer decides whether a tool gets a hook method. For each of the three adapters, a task records the real hook contract that the builder needs, as PRD 28 and PRD 30 R-ADMIT-1 require: the events (a session start, a turn end, or both), the configuration file and its place, whether Make Docs can own one entry there and leave the rest, the input that the hook receives, how the hook result is used, the install and removal steps, and whether a checkpoint that the hook starts passes that tool's Store access rules. The record has one real run in the tool with a temporary Store, and the honest support status, for example "preview". A page of documentation alone is not a contract record. Standing rule 11 says who starts each session: the orchestrator for each tool that its environment can start, and the owner for the others. If the builder cannot find a real, usable hook contract for a tool, the task stops and asks the owner. It does not drop the tool silently.
- The generic MCP client profile gets no hook method.
- Owner gate OG-7 is answered and blocks nothing. The owner sees the hook contract table in the phase report.
- Stage 2, one hook method for each of the three tools. Each method fires `session-start`, `turn-end`, or both, and runs the checkpoint with that event, so the run is a trigger run. Each method follows the adapter contract: one owned native entry, planning, apply, verification, repair, and removal (PRD 28 R-HARNESS-1), and a receipt that records its history (R-HARNESS-17). The person selects the method by an explicit input in setup, in every mode. It is off by default. The machine preference for git hooks never installs it (design OD-11). A hook method is an extra choice beside the one connection method of an agent tool (PRD 07 R-SETUP-CLI-10, PRD 28 R-HARNESS-2). It does not replace that method. A non-interactive run with no hook input adds no hook method.
- A hook method writes host configuration, so it uses the separate system approval and the adapter-owned planner of PRD 25 R-ACCESS-5, and keeps unknown and user-owned entries.
- The register records the support status and the limits of each hook method, for example a hook contract in preview that can change.
- The "not needed" closing rule. No build task of Stage 2 closes as not needed by the builder's own choice. Only the owner's answer to a stop can take a tool out. A task that the owner's answer makes not needed closes as `superseded`, not as `cancelled`, because readiness counts only `done` and `superseded` as met, and a cancelled unit keeps each unit that depends on it waiting. PRD 28 then names the tools that have a hook method and the tool that has none, with the owner's answer.
- PRD changes: PRD 28 (new R-HARNESS-23, and the adapter method list), and PRD 07 if the method screen needs a new line, each with a Requirement History entry.
- Agent form: none beyond P3. The hook runs the same command that the router names.

## Exclusions

- No claim of this plan about hook support without a real run. The owner's statement of 2026-11-27 is recorded as the owner's statement.
- No further agent tool. The roadmap holds it (design OD-14).
- No simulated hook for a tool that has none (PRD 30 R-ADMIT-4).
- No general hook registry or API.

## Acceptance

- Each of the three adapters has a hook contract record with one real run, its support status, and the name of who started the session, or the owner's answer to the stop for that tool.
- Each built hook method passes the adapter tests for plan, apply, verify, repair, and removal, and keeps every entry that Make Docs does not own.
- A session in each tool with a hook method reaches the checkpoint at the event with no prompt from the person.
- A hook method is installed only by an explicit input, and never by the machine preference for git hooks.
- The register holds the support status and the limits of each hook method.

## Testing Decisions

- Automated Implementation Testing: required for each built method.
- Performance Testing: `not-needed-now`. A hook method runs the checkpoint that `PERF-007` measured. A `turn-end` hook that adds a wait a person notices is recorded as a finding.
- Guided Progress Review: selected. The owner sees the hook contract table in the phase report.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1 for the command. P5 for the PRD 28 sentence. Stage 1 can start beside P4.
- Owner gate OG-7 is answered and blocks nothing. A stop for one tool is a new owner question.
