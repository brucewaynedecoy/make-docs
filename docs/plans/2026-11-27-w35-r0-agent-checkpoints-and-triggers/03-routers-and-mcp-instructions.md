---
title: "W35 R0 P3 Routers and MCP Instructions"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P3 Routers and MCP Instructions

## Purpose

Put the same rule in front of an agent at three more points: the root router, the `docs/work/` router, and the MCP connection. This is the third part of the design's Phase 1.

## Outcome

The managed block of the root router has one work store line. The `docs/work/` router has the owner's conditional note. The MCP server sends short instructions. Each text names the current checkpoint command and holds without a Store.

## Scope

- Template first: write each text in `packages/docs/template/`, then make this repository's copy byte-identical.
- Root router, in `packages/docs/template/AGENTS.md` and `CLAUDE.md`. Proposed text from the design: "When the work store is in charge (`make-docs work status` says so), read work with `make-docs work next` and `make-docs resource read`, not with file searches, and run `make-docs project checkpoint` after you change files under `docs/work/` and after you close a phase. Without the CLI or a usable Store, the `docs/work/` files are the authority."
- `docs/work/` router, in `packages/docs/template/docs/work/AGENTS.md` and `CLAUDE.md`, in place of today's work store line (OD-3 option A). Proposed text from the design: "When the work store is present, it is the authority (`make-docs work status` says which). Read it with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, read `.make-docs/system/references/work-store.md` or `make-docs://system/reference/work-store.md`." The owner replaced the word "present" on 2026-11-28, after the review finding of the phase: the shipped note says "When the work store is in charge", and "Otherwise, or without the CLI, these files are the authority". The [evidence](../../work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/evidence.md#the-lines-for-the-owner-a38) holds its exact text.
- The exact wording is new in the design. The owner sees the final lines in the Guided Progress Review before the phase closes.
- The work store reference gains the trigger text: when an agent runs the checkpoint (after an edit under `docs/work/`, after a phase closes, at the start of a session), and that each of these is a direct run.
- MCP server instructions: `createMakeDocsMcpServer` sends short instructions with the same rule in the same conditional words. The design's event table makes these instructions the adapter of `session-start`, so they also tell the agent to run the checkpoint at the start of a session, as a direct run. A profile with no work tool sends no work rule.
- A test checks that each router line, the reference, and the MCP instructions name the current checkpoint command from the name catalog (PRD 39 R-NAME-6).
- A managed router block changes in every installed project on the next update. The phase proves the normal conflict review of PRD 15 for a project whose block a person changed.
- PRD changes: PRD 15 (new R-WORK-ROUTER), PRD 25 (new R-MCP-INSTR), and PRD 39 R-NAME-6 if the shipped-text set gains the MCP instructions, each with a Requirement History entry.

## Exclusions

- No note in any work file (OD-3 option B was not chosen).
- No Skill text change.
- No hook.

## Acceptance

- Each template file and its installed copy are byte-identical.
- The name test passes, and fails on a fixture that names a former or unknown command.
- The MCP instructions appear for a profile with a work tool, tell the agent to run the checkpoint at the start of a session, and do not name work for a profile with none.
- An update of a project with an unchanged block applies the new line, and an update of a project with a changed block goes to conflict review.
- Each line is true with a Store and without one.
- The work store reference names the three moments when an agent runs the checkpoint, says that each is a direct run, and says that only a hook starts a trigger run.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed-now`. Text only.
- Guided Progress Review: selected. The owner reads the two router lines and the MCP instructions.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1 for the router lines and the reference. The MCP server instructions also depend on P2 Stage 2, for the result text of the read commands.
- Merge risk with W22 in the root router block. See the overview.
