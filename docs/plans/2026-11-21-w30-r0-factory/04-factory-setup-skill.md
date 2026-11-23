---
title: "W30 R0 P4 Factory Setup Skill"
kind: "plan"
status: "draft"
coordinate: "W30 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
---

# W30 R0 P4 Factory Setup Skill

## Purpose

Teach any agent to set up the factory with whatever tools the person has.

## Outcome

A new first-party Skill, `factory-setup`, in `packages/skills/factory-setup/`. It is explicit-invocation-only and off by default, like the other first-party Skills.

## Scope

- Step 1, find: look for agent tools on the machine and in the project, including harnesses, providers, multiplexers, MCP servers, schedulers, and messaging tools. Reuse the machine's saved tool list when it is current.
- Step 2, read: read each tool's help, docs, MCP tool list, and Skills. Record what each tool says it can do.
- Step 3, interview: ask only for preferences and permissions. Workflow type, human channel, wake method, limits, grants, and optional steps such as preflight. One decision at a time, with a recommendation.
- Step 4, wire: give each role a tool by capability. Mark each capability as proved or unproved.
- Step 5, prove: run one small test task from intake to return through the real workflow. List each one-time manual step with what the person must do and what it unblocks.
- Step 6, save: save through the P3 operations, then show the closing summary from the design.
- Stop when the CLI or a usable Store is missing, and say which one and how to fix it.
- Rerun: update the same workflow, show what changed, and prove again any boundary that changed.
- Smallest setup: one tool with its own subagents and "wait in session".
- New on 2026-11-23: record tool versions and proof results, ask the person to accept each known loss, ask for each grant's scope, set each role's context kinds, and save and test one plan revision.

## Exclusions

- No tool-specific default, example, or required tool.
- No install, sign-in, billing, or authentication change on the person's behalf.

## Acceptance

- Fixture runs of the Skill instructions reach a saved, `ready` workflow for the smallest setup and for a multi-tool setup.
- Guided Progress Review of the interview and the closing summary.

## Dependencies

- P1 and P3.
