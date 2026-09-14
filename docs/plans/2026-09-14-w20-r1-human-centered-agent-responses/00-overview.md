---
title: "W20 R1 Human-Centered Agent Responses"
kind: "plan"
status: "draft"
coordinate: "W20 R1"
source:
  type: "design"
  path: "docs/designs/2026-09-14-human-centered-agent-responses.md"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "The revision must update current Human Experience and managed-router authority before implementation."
  coordinate_handoff: "Carry W20 R1 into PRD history and one W20 R1 P1 work phase."
---

# W20 R1 Human-Centered Agent Responses

## Purpose

Apply the Human Experience Standard to material agent replies. Make the user-facing result clear before internal proof. Preserve exact technical detail when it helps the user verify or continue the work.

This plan is a small revision to W20 R0. It does not add a new product area.

## Plan Classification

- **Coordinate:** W20 R1
- **Change type:** Revision
- **Prior coordinate:** W20 R0
- **Reason:** The work extends the existing Human Experience Standard and agent-router route. It does not create a separate capability.
- **Lifecycle departure:** The owner asked for a new related design before this change plan. The package therefore revisits design and then continues through plan, PRD reconciliation, and work decomposition.

## Inputs

| Input | Use |
| --- | --- |
| [Human-Centered Agent Responses design](../../designs/2026-09-14-human-centered-agent-responses.md) | Source intent, decision, limits, and evidence needs |
| [Human Experience Standard and Intent design](../../designs/2026-08-28-human-experience-standard-and-intent.md) | W20 R0 source and product boundary |
| [W20 R0 plan](../2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md) | Existing delivery and validation model |
| [PRD 49](../../prd/49-human-experience-standard-and-intent.md) | Human Experience authority |
| [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | Managed agent-router authority |
| [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) | Canonical short standard |
| [Human Experience Reference](../../../.make-docs/system/references/human-experience.md) | Explanatory guidance and examples |
| Owner direction from 2026-09-14 | Small W20 R1 delta, North Star, and thin future commit boundary |

## Scope

### In scope

- Treat material agent replies as human-facing results.
- Add the owner-provided expectation and action North Star to the Human Experience Reference.
- Explain adaptive response behavior in the reference.
- Expand the short managed-router discovery rule.
- Update upstream template sources first.
- Dogfood the new resources and routers into this maintainer repo.
- Remove the now-redundant unmanaged `Agent Responses` section from the maintainer repo.
- Preserve unrelated content outside managed blocks.
- Add focused resource, propagation, parity, and response-scenario evidence.

### Out of scope

- A new Human Experience Contract.
- A new Skill, lifecycle stage, schema, or runtime service.
- One fixed response format.
- A general writing style guide.
- A rule that always hides technical detail.
- Changes to W20 R0 P5 status or evidence.
- Implementation, staging, or commit as part of this planning package.

## Human Experience Propagation

| Promise | PRD owner | Work owner | Surface | Evidence |
| --- | --- | --- | --- | --- |
| Adapt the reply to what the user needs next | PRD 49 | W20 R1 P1 | Human Experience Reference and representative replies | Scenario review and Human Experience Review |
| Lead with result, meaning, or current state | PRD 49 | W20 R1 P1 | Material agent replies | Scenario review |
| Restore context and show exact work state | PRD 49 | W20 R1 P1 | Long-run and interrupted-task replies | Scenario review |
| Give a recommendation or next useful action | PRD 49 | W20 R1 P1 | Decision, error, and completion replies | Scenario review |
| Keep technical proof available after human meaning | PRD 49 | W20 R1 P1 | Replies with evidence, paths, logs, or identifiers | Scenario review and exact-detail check |
| Avoid claimed feelings and tacked-on experience text | PRD 49 | W20 R1 P1 | All representative replies | Human Experience Review |
| Make expectation clear without hiding uncertainty | PRD 49 | W20 R1 P1 | Partial, blocked, failed, and unverified replies | Scenario review |
| Keep data in a supporting role and require direct review | PRD 49 | W20 R1 P1 | Actual resource text and representative replies | First-hand review with observations and limits |
| Route agents to one authority without copied policy | PRD 15 | W20 R1 P1 | Managed `AGENTS.md` and `CLAUDE.md` blocks | Router, preservation, and parity tests |

## PRD Change Matrix

| Candidate change | Owner | Classification | Reason |
| --- | --- | --- | --- |
| Material agent-response behavior | [PRD 49](../../prd/49-human-experience-standard-and-intent.md) | `update-existing` | PRD 49 owns human-facing meaning, state, action, progressive disclosure, and evidence. |
| Managed root-router activation | [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | `update-existing` | PRD 15 owns managed agent instructions and safe router discovery. |
| Upstream, package, and dogfood delivery | PRD 06 | `none` | PRD 06 already owns the template source and projection route. This revision does not change that contract. |
| Cross-cutting lifecycle placement | PRD 14 | `none` | The existing Human Experience lens already crosses lifecycle stages. No new stage is needed. |
| Testing selection | PRD 50 | `none` | The current rule already selects the smallest test that can change the current decision. |
| PRD index | PRD index | `none` | No PRD is added, removed, renamed, or reclassified. |
| Risk register | Risk register | `none` | The design resolves the product choice. Remaining delivery risks have direct work and acceptance checks. |
| New product capability | New PRD | `none` | This is a revision to two existing owners. |

## Existing PRDs To Update

### PRD 49: Human Experience Standard and Intent

- Expand scope to material agent communication.
- State that the Human Experience Reference explains adaptive agent-response guidance.
- Add expectation and action to the universal principles.
- Apply human and machine surface ordering to material agent replies.
- Require data and automated checks to support, not replace, direct Human Experience judgment.
- Expand router activation to task state, decisions, recommendations, errors, limits, and completion.
- Extend agent-behavior conformance to representative replies.
- Add a response-focused acceptance scenario.
- Add a W20 R1 requirement history entry.

### PRD 15: Agent Instruction Ownership and Managed Blocks

- Expand Human Experience router discovery to material agent replies.
- Keep the router short and subordinate to PRD 49.
- Add a W20 R1 requirement history entry.

## Genuinely New Product PRD

No new PRD is required.

The response behavior is part of the existing Human Experience capability. The route to that behavior is part of existing managed agent-instruction ownership.

## Requirement History Entries

Add dated W20 R1 entries to PRD 49 and PRD 15.

Each entry must name the old behavior, replacement behavior, reason, and this plan as the source. The entries remain history. They do not replace the normative requirements.

## Affected Links, Risks, Plans, And Work

### PRD index

No change is required.

### Risk register

No change is required.

### Downstream work

Create one bounded W20 R1 phase. It will update authority, router discovery, package and dogfood copies, focused checks, and representative response evidence.

## Repo Summary And Execution Mode

This is the Make Docs maintainer repo and a dogfood project. Upstream shipped resources and agent-router defaults live under `packages/docs/template/`. The maintainer repo then receives those changes through the existing dogfood route.

The worktree already has unrelated W19 R6 changes. W20 R1 implementation must use an exact file allowlist and inspect every target hunk before any later stage or commit.

Use the highest safe execution tier available at implementation time. Keep authority and linked resource edits under one owner because those files form one coupled change. A separate review worker can inspect behavior and evidence if the session permits it.

## Output Contract

### This planning package

- `docs/designs/2026-09-14-human-centered-agent-responses.md`
- `docs/plans/2026-09-14-w20-r1-human-centered-agent-responses/00-overview.md`
- `docs/plans/2026-09-14-w20-r1-human-centered-agent-responses/01-agent-response-guidance-and-routing.md`
- `docs/prd/15-agent-instruction-ownership-and-managed-blocks.md`
- `docs/prd/49-human-experience-standard-and-intent.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/00-index.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/01-agent-response-guidance-and-routing.md`

### Later implementation targets

- `packages/docs/template/.make-docs/system/references/human-experience.md`
- `packages/docs/template/AGENTS.md`
- `packages/docs/template/CLAUDE.md`
- `.make-docs/system/references/human-experience.md`
- `AGENTS.md`
- `CLAUDE.md`
- `packages/cli/tests/human-experience-resources.test.ts`
- `packages/cli/tests/human-experience-propagation.test.ts`

The implementation can add a focused fixture only if an existing test cannot express a required response scenario.

## Phase Map

| Phase | File | Outcome | Gate |
| --- | --- | --- | --- |
| W20 R1 P1 | [Agent Response Guidance and Routing](01-agent-response-guidance-and-routing.md) | One authority route guides adaptive, human-centered agent replies and preserves technical proof. | Explicit implementation authority |

P1 has three internal stages:

1. Update the reference and router sources upstream.
2. Dogfood the change and prove preservation and parity.
3. Review representative replies and record a bounded conclusion.

## Worker Ownership

### Authority and implementation

One implementation owner controls the Human Experience Reference, root router templates, dogfood copies, and linked focused tests. This avoids policy drift between coupled files.

### Validation and review

A separate reviewer can inspect the exact target diff, resource parity, router preservation, and representative replies. That reviewer must not change product meaning without returning the finding to the implementation owner.

### Assembly

The coordinating agent keeps the worktree allowlist, records validation, and prepares a thin commit proposal. Staging and commit need separate owner authority.

## MCP Strategy

- Use jdocmunch for project and Make Docs authority.
- Refresh the document index if a required file is absent or stale.
- Use jcodemunch for implementation symbols, tests, and call sites.
- Refresh the code index if a required symbol is absent or stale.
- Use the Make Docs CLI for resource and project validation when the local command is valid.
- Use direct file reads only if index refresh does not work.

## Dependencies

- The W20 R1 design and PRD reconciliation must stay accepted.
- Implementation authority must be explicit.
- The upstream-first and dogfood contract remains in force.
- Existing W19 R6 worktree changes must remain untouched.
- W20 R0 P5 can continue separately. W20 R1 does not depend on closing it.

## Validation

### Planning and PRD validation

- Check required plan, PRD, and work sections.
- Run PRD authority validation.
- Check repository-relative paths and Markdown links.
- Run `git diff --check` against only the W20 R1 planning files.
- Inspect the exact PRD hunks for unrelated change.

### Later implementation validation

- Run focused Human Experience resource and propagation tests.
- Prove upstream and dogfood resource parity.
- Prove `AGENTS.md` and `CLAUDE.md` router parity.
- Prove that content outside managed blocks stays unchanged.
- Confirm that the redundant local `Agent Responses` section is gone only after the managed route replaces it.
- Review representative replies for long completion, partial completion, blocked or failed work, a proposal, an expert explanation, and a no-action status.
- Require an accountable reviewer to inspect or use the actual result, keep the core idea in view, and record direct observations and limits.
- Record what each test proves and what it does not prove.
- Inspect the final allowlisted diff before any staging request.

## Unresolved Questions

None.

The reference is the right home for the North Star and adaptive guidance. The contract remains the stable short standard.

## Approval State

- Design drafting: complete in this package.
- Plan drafting: complete in this package.
- PRD reconciliation: complete in this package.
- Work backlog drafting: complete in this package.
- Implementation authority: not granted.
- Implementation started: no.
- Staging authority: not granted.
- Commit authority: not granted.

## Intended Follow-On

- **Route:** `prd-generation`
- **Next Prompt:** `.make-docs/system/prompts/plan-to-prd-change.prompt.md`
- **Why:** The plan changes two existing PRD owners. This package performs that reconciliation now and then prepares the implementation backlog.
- **Coordinate Handoff:** Keep W20 R1 for PRD reconciliation and P1 implementation.
