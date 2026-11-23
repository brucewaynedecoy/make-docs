---
title: "W30 R0 P5 Factory Run Skill and Handoffs"
kind: "plan"
status: "draft"
coordinate: "W30 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
---

# W30 R0 P5 Factory Run Skill and Handoffs

## Purpose

Rewrite the `factory` Skill so that it runs a saved workflow, and connect backlog review to it.

## Outcome

The `factory` Skill loads one `ready` workflow and its type and runs the loop from the design. Its old profiles and Store references are replaced. Backlog review hands a wave to the foreman when a workflow is ready.

## Scope

- Load the workflow, its type, and the factory contract. Refuse a workflow that is not `ready`, and name the fix.
- Run the loop: sync, check assignments through their handles, renew claims, judge returned work, review with a separate reviewer, correct within the limit, accept units inside the given scope, close them, take the next ready unit, and escalate.
- Claims at any level (wave, phase, stage, task), with phase as the default. Open one lifecycle run at stage `implementation` per claim. Record evidence through `evidence_record` and `lifecycle_attach_evidence`.
- Quick items from the front desk, routed by capability like any other unit.
- Run preflight before a claim only when the workflow turns that step on.
- Apply the working rules from the design, including one writer per file in each working copy, an integration owner for parallel work, and the harness's worktree policy.
- Back up files before a change in a folder without git, through the P2 records.
- Write escalation and acceptance messages that say what happened, what is needed, and what happens next.
- Update the backlog review "Work on this wave" button so that it sends the wave to the foreman through the front desk when a workflow is `ready`. Keep today's behavior otherwise.
- Remove the profiles reference. Keep the Skill explicit-invocation-only.
- New on 2026-11-23: follow the status move table, escalate at the round limit, run each assignment under its own plan revision, record grant use and ask again on refusal, hand each role only its context kinds, and keep never-log items out of factory records.

## Exclusions

- No workflow engine, scheduler, or message relay in Make Docs.

## Acceptance

- Fixture runs cover each workflow type, a correction loop that hits its limit, an `unknown` assignment, an expired claim, and a scope-end acceptance request.
- The backlog review button behaves as before when no workflow is ready.

## Dependencies

- P1 and P3. Can run in parallel with P4.
