# W20 R1 P1 Agent Response Guidance and Routing

## Purpose

Deliver one clear authority route for material agent replies. Make the reply useful to the person before it exposes internal proof.

## Outcome

An agent that follows Make Docs can tell what the user needs next, state the result and work state clearly, give a recommendation or next action when one exists, and keep technical proof available without making the user decode it first.

The router stays short. The Human Experience Reference owns the explanation and examples.

Data and automated checks support the final Human Experience judgment. An accountable reviewer must also inspect or use the actual result and keep the product's core idea in view.

## Scope

### Included

- Human Experience Reference guidance for material agent replies.
- The owner-provided expectation and action North Star.
- Short managed-router discovery in upstream `AGENTS.md` and `CLAUDE.md` templates.
- Dogfood projection into the maintainer repo.
- Removal of the redundant local `Agent Responses` section after replacement.
- Focused resource, router, preservation, and parity checks.
- Representative agent-response evidence and Human Experience Review.

### Excluded

- Changes to the Human Experience Contract.
- One required reply layout.
- A ban on technical language.
- A new Skill or lifecycle stage.
- Changes to W20 R0 P5.
- A commit without a separate owner request.

## Stage 1: Authority And Upstream Source

Update the upstream Human Experience Reference. Add the North Star and explain how it guides action.

Define adaptive response behavior. The guidance must cover result-first order, context recovery, honest state, recommendations, progressive detail, and visible uncertainty.

Update upstream root agent-router templates with one short discovery rule. The router must point to lifecycle and Human Experience authority. It must not copy the full response guidance.

## Stage 2: Dogfood And Preservation

Use the existing dogfood route to update the installed Human Experience Reference and root agent routers.

Remove the local unmanaged `Agent Responses` section only after the managed block provides the replacement route.

Prove that unrelated user-owned content outside the managed block did not change.

## Stage 3: Evidence And Review

Run focused static, resource, router, preservation, and parity tests.

Prepare representative agent replies for these cases:

1. A long task completes after the user's attention has moved elsewhere.
2. A task completes only in part.
3. Work is blocked, failed, or not verified.
4. The user needs a recommendation or product decision.
5. An expert needs technical detail.
6. No action is needed.

Review the replies against the accepted Human Experience promises. Do not accept a passing text or parity check as proof of human quality.

Record who performed the first-hand review, what that person observed, and what the review cannot prove.

## PRD Trace

| Requirement owner | Planned effect |
| --- | --- |
| PRD 49 `R-HX-04` | Adds expectation and action to the human principles. |
| PRD 49 `R-HX-05` | Makes result-first, progressive detail apply to material agent replies. |
| PRD 49 `R-HX-10` | Activates Human Experience authority from managed routers for material replies. |
| PRD 49 `R-HX-11` | Requires representative agent-response scenarios. |
| PRD 15 Human Experience Router Discovery | Keeps the managed route short, safe, and subordinate to PRD 49. |

## Files

Primary implementation files:

- `packages/docs/template/.make-docs/system/references/human-experience.md`
- `packages/docs/template/AGENTS.md`
- `packages/docs/template/CLAUDE.md`
- `.make-docs/system/references/human-experience.md`
- `AGENTS.md`
- `CLAUDE.md`
- `packages/cli/tests/human-experience-resources.test.ts`
- `packages/cli/tests/human-experience-propagation.test.ts`

An implementation agent must recheck the live file set before edits. It must stop if W19 R6 or other user work overlaps any target hunk.

## Validation

- PRD 49 and PRD 15 remain the only normative owners changed by W20 R1.
- The contract stays byte-for-byte unchanged.
- The reference contains one North Star and one adaptive guidance section.
- Each root router contains one short Human Experience route.
- Router files do not copy the full standard.
- Upstream and dogfood copies match.
- Content outside managed blocks stays unchanged.
- Focused tests pass.
- Representative reply review records observations, limits, and conclusions.
- Human Experience Review includes first-hand use or inspection. Data and automated results remain supporting evidence.
- The final diff contains only authorized W20 R1 files and hunks.

## Exit Gate

P1 can close only when:

- the upstream and dogfood resources agree;
- the managed route replaces the local reply rule without harming unrelated instructions;
- focused automated checks pass;
- representative replies support each accepted promise;
- Human Experience Review records a bounded conclusion; and
- the owner has received the exact thin-commit allowlist.

Passing P1 does not authorize staging or commit.

## Intended Follow-On

- **Route:** `work-decomposition`
- **Next Prompt:** [PRD Change to Work](../../../.make-docs/system/prompts/prd-change-to-work.prompt.md)
- **Why:** The accepted phase needs task-level execution steps, stable acceptance criteria, and explicit testing choices.
- **Coordinate Handoff:** Create the W20 R1 P1 work backlog.
