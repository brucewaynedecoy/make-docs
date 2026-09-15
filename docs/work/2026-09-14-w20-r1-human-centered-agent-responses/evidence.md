---
title: "W20 R1 Human-Centered Agent Responses Evidence"
kind: "evidence"
status: "active"
coordinate: "W20 R1 P1"
---

# W20 R1 Human-Centered Agent Responses Evidence

## Current State

The W20 R1 implementation and owner Human Experience Review are complete. Focused automated checks pass. The owner approved all nine prepared `satisfied` conclusions on 2026-09-15 and requested no correction.

No W20 R1 file is staged or committed. Commit authority remains separate.

## Implemented Result

- The upstream Human Experience Reference contains the expectation and action North Star.
- The reference treats material replies as human-facing results and keeps routine acknowledgements light.
- The reference leads with human meaning and keeps useful technical proof available.
- The reference records the direct-review principle. Data and automated checks support the conclusion but do not replace first-hand review.
- The upstream `AGENTS.md` and `CLAUDE.md` routers contain one short route to lifecycle and Human Experience authority.
- The dogfood reference and managed root-router blocks match the upstream source.
- The Human Experience Contract, lifecycle stages, schemas, and Skill requirements are unchanged.
- The former unmanaged root `Agent Responses` section was already absent. No unmanaged response rule was removed.

## Automated Evidence

| Check | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `npm test -w packages/cli -- tests/human-experience-resources.test.ts tests/human-experience-propagation.test.ts` | Passed: 2 files and 56 tests | Required reference text exists. The new policy stays out of the Contract. Upstream and dogfood resource bytes match. Root managed blocks match. Router preservation logic remains valid. | It does not prove that every agent model will interpret the guidance well. It does not approve the human quality of the example replies. |
| `git diff --check -- <tracked W20 R1 allowlist>` and `git diff --no-index --check /dev/null docs/work/2026-09-14-w20-r1-human-centered-agent-responses/evidence.md` | Passed: the tracked check exited 0. The new-file check produced no whitespace warnings; its exit 1 is the expected no-index difference result. | The W20 R1 files have no reported whitespace errors. | It does not prove product meaning or usefulness. |
| Allowlisted diff inspection | Passed | The reference changes are upstream first. Dogfood copies match. Each root router adds one line inside the managed block. Work and evidence updates stay in the W20 R1 package. | It does not prove owner acceptance. |
| Human Experience Contract diff check | Passed with no diff | W20 R1 did not change the canonical Contract. | It does not prove that the Reference guidance is sufficient. |

## Representative Replies

These examples were the owner's review inputs. They are retained unchanged as the reviewed evidence. They are not a fixed reply template.

### Long Completion After Attention Has Moved

> W20 R1 is now implemented as a reviewed candidate. This is the response-guidance change that we planned before the other agent work began.
>
> Material replies now lead with the result and work state. They restore needed context, name the next useful action, and keep technical proof available after the human account. The upstream source and this repository's dogfood copies agree.
>
> State: implementation and focused checks are complete. Owner Human Experience Review is still pending. No commit has been made.
>
> Recommended next action: review the six reply examples and either accept the prepared Human Experience conclusion or name a correction.
>
> Proof: the two focused test files passed all 56 tests. The exact proposed commit contains only the W20 R1 allowlist.

### Partial Completion

> The reference and router changes are complete. The dogfood update is also complete. The work is not accepted yet because the owner review has not happened.
>
> Completed: upstream guidance, managed router route, dogfood parity, and focused tests.
>
> Remaining: owner inspection of the example replies, any accepted correction, and the final Human Experience conclusion.
>
> Recommendation: review the examples before authorizing a commit. No recovery action is needed because no file is staged.

### Blocked Or Failed Work

> The dogfood update did not run. The setup check stopped before it changed project files because the Store could not verify the current provider record.
>
> Your existing project files remain unchanged. The upstream candidate is still available for review.
>
> Recommendation: refresh the provider record through the supported setup flow, then rerun the dry run. Do not copy the file by hand because that would bypass the managed ownership record.
>
> Limit: I cannot claim dogfood parity until that supported update completes.

### Proposal Or Product Decision

> I recommend one short router route with the full response guidance kept in the Human Experience Reference.
>
> This keeps discovery reliable without making every short acknowledgement heavy. It also prevents two copies of the policy from drifting.
>
> The tradeoff is one extra reference read when a reply is material. The alternative puts more text in every root router and makes later updates harder to keep consistent.
>
> Decision needed: approve the short route, or ask for a different discovery boundary before implementation continues.

### Expert Technical Detail

> The router and resource parity checks pass. The managed block parser sees one valid block in each upstream and dogfood root router, and the parsed bodies are byte-equal.
>
> The propagation test also asserts one occurrence of the material-reply route. It rejects copied policy by checking that the router does not contain the detailed result-first or routine-acknowledgement wording.
>
> Exact command: `npm test -w packages/cli -- tests/human-experience-resources.test.ts tests/human-experience-propagation.test.ts`.
>
> Result: 2 test files passed. All 56 tests passed.

### No-Action Status

> The focused checks pass, and the W20 R1 files have no new defect that needs action.
>
> No action is needed now. The next gate is owner review, not another automated run.
>
> This is a point-in-time result for the current candidate. A later edit requires the affected checks to run again.

## Approved Human Experience Review

The implementation agent prepared this review. On 2026-09-15, the owner said the reply examples and conclusions match the intended result and that nothing needs to change. This response approves each prepared conclusion below.

| Accepted promise | Evidence | Direct observation | Approved conclusion | Reviewer and limit | Disposition |
| --- | --- | --- | --- | --- | --- |
| Adapt to what the user needs next | Six representative replies | Each reply serves a different need: orientation, recovery, a decision, technical proof, or no action. | `satisfied` | The owner approved the prepared examples and conclusion. The review is limited to these examples. | Approved |
| Lead with result, meaning, or current state | All six replies | Each reply starts with the outcome or exact state before detailed proof. | `satisfied` | The owner approved the prepared conclusion. This does not prove every future model response. | Approved |
| Restore context and distinguish work states | Long, partial, and blocked replies | The long reply restores the subject. The other replies separate implemented, pending, blocked, and unchanged states. | `satisfied` | The owner approved the prepared conclusion. The examples are prepared cases, not a live multi-model run. | Approved |
| Give a recommendation or next action | Long, partial, blocked, and proposal replies | Each case names the useful next action. The no-action case states that no action is needed. | `satisfied` | The owner approved the prepared conclusion. Later agent recommendations can still vary. | Approved |
| Keep technical proof available after human meaning | Long and expert replies | Test counts, parser behavior, and the exact command follow the human result. | `satisfied` | The owner approved the prepared conclusion. The evidence does not test every expert context. | Approved |
| Avoid claimed feelings and tacked-on experience text | All six replies | No reply claims how the user feels. No reply adds a separate experience paragraph. | `satisfied` | The owner approved the prepared conclusion. Later agent behavior can still vary. | Approved |
| Make expectation clear without hiding uncertainty | Partial, blocked, and no-action replies | Remaining work, unchanged state, limits, and rerun conditions stay visible. | `satisfied` | The owner approved the clarity of the prepared examples. The review is limited to these examples. | Approved |
| Keep data in a supporting role | Reference text and this evidence | Automated proof supports the candidate. This record does not use test success as owner approval. | `satisfied` | The owner supplied the required approval after direct review. | Approved |
| Route agents to one authority | Router diff and focused tests | Each router has one short route. Detailed guidance remains in the Reference. | `satisfied` | The owner approved the prepared conclusion. Static routing does not prove reliable use by every agent. | Approved |

## Claim Limits

- The focused tests prove required text, parity, and managed-block structure.
- The examples show how the accepted guidance can work across six reply types.
- The examples do not prove consistent behavior across all agents, models, tasks, or users.
- The implementation agent cannot approve lived human experience.
- The owner approved the prepared review on 2026-09-15. P1 is complete. The recorded limits still bound all completion claims.

## Thin Commit Allowlist

Only these W20 R1 files and hunks belong in the proposed commit:

- `packages/docs/template/.make-docs/system/references/human-experience.md`
- `packages/docs/template/AGENTS.md`
- `packages/docs/template/CLAUDE.md`
- `.make-docs/system/references/human-experience.md`
- `AGENTS.md`
- `CLAUDE.md`
- `packages/cli/tests/human-experience-resources.test.ts`
- `packages/cli/tests/human-experience-propagation.test.ts`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/00-index.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/01-agent-response-guidance-and-routing.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/evidence.md`
