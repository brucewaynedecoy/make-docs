---
title: "W20 R1 Human-Centered Agent Responses Evidence"
kind: "evidence"
status: "complete"
coordinate: "W20 R1 P1"
---

# W20 R1 Human-Centered Agent Responses Evidence

## Current State

P1 and its owner Human Experience Review are complete. Commit `51bd35c` records the accepted P1 implementation and evidence. The quoted P1 examples below remain unchanged as historical review material.

The P2 implementation candidate and agent Human Experience Review are complete. Focused tests, affected default checks, the CLI build, and the full package smoke check pass. The owner granted separate staging and commit authority on 2026-09-17. The exact P2 set was staged and inspected before commit. No publication or push was authorized.

## Implemented Result

- The upstream Human Experience Reference contains the expectation and action North Star.
- The reference treats material replies as human-facing results and keeps routine acknowledgements light.
- The reference leads with human meaning and keeps useful technical proof available.
- The reference records the direct-review principle. Data and automated checks support the conclusion but do not replace first-hand review.
- The upstream `AGENTS.md` and `CLAUDE.md` routers contain one short route to lifecycle and Human Experience authority.
- The dogfood reference and managed root-router blocks match the upstream source.
- The Human Experience Contract, lifecycle stages, schemas, and Skill requirements are unchanged.
- The former unmanaged root `Agent Responses` section was already absent. No unmanaged response rule was removed.

## P2 Implemented Result

- The upstream Human Experience Contract contains the exact self-contained user-action rule.
- The Human Experience Reference contains the five required questions and a weak-versus-useful example.
- The Execution Workflow rejects a requested action that needs another document for meaning.
- The Output Contract states that an internal route, coordinate, workflow term, or task ID does not replace a plain-language next step.
- The four dogfood resources match their upstream source bytes.
- The generated CLI template resources match their upstream source bytes.
- The current upstream and root routers already point material replies to lifecycle and Human Experience authority. No router changed.

## Automated Evidence

| Check | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `npm test -w packages/cli -- tests/human-experience-resources.test.ts tests/human-experience-propagation.test.ts` | Passed: 2 files and 56 tests | Required reference text exists. The new policy stays out of the Contract. Upstream and dogfood resource bytes match. Root managed blocks match. Router preservation logic remains valid. | It does not prove that every agent model will interpret the guidance well. It does not approve the human quality of the example replies. |
| `git diff --check -- <tracked W20 R1 allowlist>` and `git diff --no-index --check /dev/null docs/work/2026-09-14-w20-r1-human-centered-agent-responses/evidence.md` | Passed: the tracked check exited 0. The new-file check produced no whitespace warnings; its exit 1 is the expected no-index difference result. | The W20 R1 files have no reported whitespace errors. | It does not prove product meaning or usefulness. |
| Allowlisted diff inspection | Passed | The reference changes are upstream first. Dogfood copies match. Each root router adds one line inside the managed block. Work and evidence updates stay in the W20 R1 package. | It does not prove owner acceptance. |
| Human Experience Contract diff check | Passed with no diff | W20 R1 did not change the canonical Contract. | It does not prove that the Reference guidance is sufficient. |

## P2 Automated Evidence

| Check | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `npm test -w packages/cli -- tests/human-experience-resources.test.ts tests/human-experience-propagation.test.ts` | Passed: 2 files and 58 tests | The exact Contract rule, five Reference questions, example boundary, workflow check, Output Contract rule, resource parity, and thin-router rules are present. | It does not prove that every future agent reply will follow the rules. |
| `npm run validate:defaults` | Passed: 3 files and 53 tests | Default consistency, template links, and package safety remain valid. | It does not review the human meaning of the new rule. |
| `npm run build -w packages/cli` | Passed | The CLI builds with the updated generated template and tests. | It does not prove package-runner behavior. |
| `npm run smoke:pack` | Passed in full mode after network access was allowed | The packed CLI works through the local, npm, pnpm, and Bun package paths used by the smoke check. | It does not prove use in every host or network condition. |
| Eight raw-byte comparisons | Passed | Each of the four upstream resources matches its dogfood copy and generated CLI copy. | It does not prove that the policy is useful to a person. |
| Router diff and focused negative assertions | Passed with no router change | Detailed P2 text stays in canonical authority and does not move into the thin routers. | It does not prove that every agent will follow the route. |
| Path-limited `git diff --check` and two new-file checks | Passed with no whitespace report | The tracked P2 files and both new P2 files have no reported whitespace errors. The new-file commands return the expected difference exit because each file is new. | It does not prove policy meaning or staging safety. |
| Staged diff inspection | Passed: 16 P2 files, 603 insertions, and 58 deletions before final gate-record updates | The staged Execution Workflow files contain only the P2 final-validation line. The W19 R2 performance hunks remain unstaged. All other staged paths match the P2 allowlist. | It does not authorize publication or push. |

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

## P2 Representative User Action Requests

### Required Authorization

> Please authorize staging for the reviewed P2 changes. Staging means placing only the reviewed changes into the proposed commit set. This separate permission is required before any file is staged, and it blocks only the proposed P2 commit. The P2 allowlist below gives the exact files and hunk limit. After you authorize staging, the agent will stage only that set and return the staged diff for a separate commit decision.

### Optional Feedback

> Optional: review the five P2 examples and tell the agent if one is unclear. This feedback is not required, and P2 closeout does not wait for it. The P2 review table below gives the supporting observations. If you send feedback, the agent will record it and fix any accepted in-scope defect. If you do not send feedback, no work is blocked.

### Named Blocker

> Please restore read access to the release evidence file. The check needs that file to verify the release result, so this action is required and blocks only release validation. The validation log names the denied path and command. After access is restored, the agent will rerun that check and report either a verified result or the next exact blocker.

### Linked Audit Record

> Please choose whether to accept the proposed data-retention limit. This choice is required before the policy can be finalized, and it blocks only that policy decision. The linked audit record lists the source evidence and alternatives. After you choose a limit, the agent will update the policy and return the exact change for review. You do not need to open the record to understand this request.

### Internal Route Or Task Label

> Please authorize implementation for W4 R1 P2. W4 R1 P2 means Wave 4, Revision 1, Phase 2. This permission is separate from staging or commit permission. It is required before code changes start, and it blocks only Phase 2 implementation. The linked work phase lists the tasks and checks. After authorization, the agent will complete the phase and return the result before asking for any staging permission.

## P2 Human Experience Review

The implementation agent reviewed the policy text and the five prepared requests. This is an agent review of the available result. It is not owner approval and does not claim lived human understanding.

| Accepted promise | Human goal and surface | Evidence | Direct observation | Conclusion | Reviewer, limit, and follow-up |
| --- | --- | --- | --- | --- | --- |
| State the action and reason | A user can understand what to do and why from the reply | Contract rule and five prepared requests | Each request opens with a normal-word action and states why it is needed | `satisfied` | Implementation agent; prepared cases only. Fix any accepted in-scope clarity defect. |
| State authority and blocked work | A user can see whether the action is required, optional, or separate permission and what waits | Five prepared requests | Each request names its authority class and the bounded work that waits | `satisfied` | Implementation agent; later agent replies can vary. Keep focused tests as a regression guard. |
| State the detail location and next event | A user can verify or continue without guessing | Five prepared requests | Each request names supporting detail and says what follows the action or no action | `satisfied` | Implementation agent; links were reviewed as example text, not live targets. Validate real links in real replies. |
| Explain internal terms | A user can act without knowing project shorthand | Staging and W4 R1 P2 examples | The examples explain staging and expand the coordinate before using it as support | `satisfied` | Implementation agent; the examples do not cover every internal term. Explain new terms when they affect action. |
| Keep links in a supporting role | A user does not need to open another document to understand the request | Useful Reference example and linked-record example | The reply contains the action, reason, authority, blocked work, and next event before the link supplies audit detail | `satisfied` | Implementation agent; no live user study was run. Optional feedback remains available and non-blocking. |
| Keep routing thin | A user gets one clear authority path without copied policy drift | Router audit, no router diff, and focused negative assertions | Existing routers already point material replies to lifecycle and both Human Experience resources | `satisfied` | Implementation agent; static text cannot prove all agent behavior. No router change is needed. |

## Claim Limits

- The focused tests prove required text, parity, and managed-block structure.
- The examples show how the accepted guidance can work across six reply types.
- The examples do not prove consistent behavior across all agents, models, tasks, or users.
- The implementation agent cannot approve lived human experience.
- The owner approved the prepared review on 2026-09-15. P1 is complete. The recorded limits still bound all completion claims.
- The P2 review is agent-owned and bounded to the policy text and five prepared requests.
- No lived-human-understanding claim or P2 owner approval claim is made.
- The P2 tests prove text, structure, projection, and package behavior. They do not prove consistent future agent behavior.

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

## P2 Thin Commit Allowlist

Only these P2 files and exact P2 hunks belong in the authorized staged and committed set:

- `packages/docs/template/.make-docs/system/contracts/human-experience-contract.md`
- `packages/docs/template/.make-docs/system/references/human-experience.md`
- `packages/docs/template/.make-docs/system/references/execution-workflow.md`
- `packages/docs/template/.make-docs/system/contracts/output-contract.md`
- `.make-docs/system/contracts/human-experience-contract.md`
- `.make-docs/system/references/human-experience.md`
- `.make-docs/system/references/execution-workflow.md`
- `.make-docs/system/contracts/output-contract.md`
- `packages/cli/tests/human-experience-resources.test.ts`
- `packages/cli/tests/human-experience-propagation.test.ts`
- `docs/plans/2026-09-14-w20-r1-human-centered-agent-responses/00-overview.md`
- `docs/plans/2026-09-14-w20-r1-human-centered-agent-responses/02-self-contained-user-action-requests.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/00-index.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/01-agent-response-guidance-and-routing.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/02-self-contained-user-action-requests.md`
- `docs/work/2026-09-14-w20-r1-human-centered-agent-responses/evidence.md`

The two Execution Workflow files also contain preserved W19 R2 performance changes in the worktree. Those W19 additions are not part of P2. The staged P2 set contains only the P2 final-validation line from each overlapping file. The combined worktree view numbers the preserved performance check as item 10. The P2 commit does not include that W19 check.

The generated `packages/cli/template/` copies are verified build output. They are not authored or staged. The root and upstream routers are unchanged and are not in the P2 allowlist.
