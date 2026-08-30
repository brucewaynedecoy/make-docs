# Phase Protocol

This protocol controls one project phase. The live project authority can add stricter gates. It cannot silently remove required user permissions. One user request can provide permission for several gates when it clearly names the full outcome.

## Gate sequence

Use this order:

1. Preflight.
2. Owner decision review.
3. Decision-document reconciliation.
4. Documentation-only commit.
5. Implementation authorization and execution.
6. Independent review and correction.
7. Owner acceptance and implementation commit.
8. Post-implementation coverage and document reconciliation.
9. Final documentation-only commit.
10. Next-phase preflight.

Run mode applies across the recorded segment. In `single_item` mode, process one authorized item and end the segment. In `continuous_segment` mode, continue through all authorized work until the recorded stop boundary.

Do not infer a protected action that the user did not authorize. One request can authorize many items and several gate transitions. Implementation, commit, push, publication, deployment, and next-phase work still need explicit authority, but that authority can be given once for a clearly bounded multi-gate outcome.

At each gate boundary, continue when the next action is inside the authorized segment. Use the boundary handoff when an unauthorized action is still needed to complete the user's requested outcome. When the requested outcome is complete, report it and stop without offering later lifecycle work. Do not stop after every item or internal gate in `continuous_segment` mode. The transition from the documentation-only preflight commit into implementation always follows the recorded preimplementation transition below.

### Boundary handoff

Keep each authority boundary intact. Present the transition as a concrete next-step choice, not as a lock or blocker.

1. Finish all routine validation and required state updates allowed by the current authority.
2. Complete safe preparation for the normal next action. Safe preparation can resolve the committed baseline, derive the bounded scope from accepted authority, and draft or update the authorization capsule. It cannot implement, stage, commit, push, publish, deploy, make a product choice, create a task, or perform the next gated action.
3. Give a short outcome in plain language. Include only evidence that matters to the next choice.
4. If completing the requested outcome needs an action outside the current authority, name all known required work and ask one combined question for the exact actions that need permission. Do not ask only because a later lifecycle action exists. Do not describe the required work as locked, blocked, gated, unable to proceed, or waiting for approval.
5. End the turn after that question. If the current request already authorizes the next action, continue without a boundary message or restart prompt. The transition into implementation is the exception and always stops for the recorded preimplementation outcome.

Do not require the user to quote a gate name, revision, SHA, capsule ID, or formal authorization sentence. A plain answer is sufficient when it clearly approves the bounded action just presented. Surface technical bindings only for ambiguity, conflict, stale state, audit, or a user request.

If the user asks what the choice permits, describe the planned changes, stages, or effects. Do not restate the gate or answer only that approval is needed to start.

## 1. Preflight

Preflight is read-only for repository files except for the required `.make-docs/state/phase-state.yaml` control update.

Before broad preflight research, follow the state initialization and update rules in `SKILL.md`. Create the fixed state path when it is absent. Update the record for this task start. Do not use another location.

Read `preflight-item-tally.md`. Build or reconcile the active phase item register before presenting phase items. Keep existing inventory numbers. Add new items at the end. Reconcile the current gate tally before using a label.

Establish:

- repository path, branch, full HEAD, and working-tree state;
- dirty-file allowlist;
- active phase and exact next coordinate;
- governing design, PRD, plan, work, history, and process files;
- completed and open phase tasks;
- dependencies, contradictions, scope pressure, and material risks;
- ordered owner decisions that block the phase;
- one stable register of all admitted questions, gaps, risks, contradictions, dependencies, and proofs that affect the phase.

The task can write only the fixed phase state record. It cannot settle decisions, edit authority documents, implement, stage, or commit.

Record the full baseline, next coordinate, blocking IDs, risks, inventory total, and gate tally in phase state. In chat, summarize readiness and only the facts material to the user's next choice. When an item has its own label, use `2/12 - Type catalog and extension rule [Q-012B]`.

Then follow `run_mode`. Stop if the segment ends at preflight or uses `single_item`. If an explicit `continuous_segment` includes owner decision review, present the first decision package without asking the user to prompt again.

## 2. Owner decision review

Present one coherent decision package at a time.

Start the package with the current tally label from `preflight-item-tally.md`, such as `2/12 - Type catalog and extension rule [Q-012B]`.

Before that label, activate the item in the `owner_decision_review` tally, reconcile the tally, and render the label with `scripts/phase_tally.py`. Do not use `phase_items.ordinal` or `phase_items.total` as chat progress values.

Each package must state:

1. the bounded question;
2. why the phase needs the answer now;
3. the recommendation;
4. viable alternatives and tradeoffs;
5. scope and downstream effects;
6. what remains undecided;
7. exact proposed decision language.

Discuss only that package until the answer is clear. Restate the exact resolution. Obtain explicit user confirmation before recording it.

Record only the accepted resolution and control status. Do not reconcile project documents, implement, stage, or commit.

Then follow `run_mode`:

- In `single_item` mode, report the next item pointer and stop.
- In `continuous_segment` mode, keep the segment active. If another in-scope item remains, present it in the same response after the status update. If no item remains, mark the segment complete and stop before decision-document reconciliation.

## 3. Decision-document reconciliation

This gate needs explicit user authority to edit documents. It does not include product implementation or commit authority.

Propagate only accepted decisions through every affected authority document. Keep broader questions open when approval was phase-bound. Record complete deferral data.

Inspect the full documentation diff. Run the relevant document checks. Leave all changes unstaged and uncommitted.

If the current request authorizes the documentation-only commit, continue to Gate 4. Otherwise apply the boundary handoff and ask whether to create that commit from the reviewed file set.

## 4. Documentation-only commit

This gate needs explicit user authority for the reviewed file set, accepted decision IDs, and baseline. That authority can be part of the current multi-gate request.

Before the commit:

- read the repository commit convention;
- confirm the baseline and working-tree scope;
- stage only the approved documents;
- inspect the staged diff.

After the commit, verify the subject, body, contents, commit SHA, and working-tree state. Record the SHA in phase state. Prepare the bounded implementation authorization capsule only when implementation is already in the user's stated task scope.

Then follow `run_mode.segment.preimplementation_transition`:

- For `confirm_start`, set the run status to `awaiting_owner` and ask: `The [phase] preflight and documentation are complete. Would you like me to start [phase] implementation?` Ask this even when the earlier request already authorized implementation. Start Gate 5 only after the user confirms that implementation should start now. If the user declines or defers, mark this segment complete and leave the phase ready for implementation.
- For `report_ready`, set the segment status to `complete` and report: `The [phase] preflight and documentation are complete. [Phase] is now ready for implementation.` Stop without offering to start implementation.

Do not describe implementation as locked, blocked, gated, unable to proceed, or waiting for approval unless a real blocker exists. Do not infer `confirm_start` only because implementation is the next lifecycle gate.

## 5. Implementation

Require explicit user authorization. Bind that authorization internally to the authorization capsule, state revision, committed authority revision, and baseline. The user's request does not need to cite those values when it clearly approves the presented implementation scope. A fresh task is optional unless the repository or harness requires it.

Reconfirm scope, exclusions, stages, checks, stop conditions, branch, HEAD, and working-tree state before edits begin.

Implementation workers are optional. The primary task owns scope, authority, integration, and validation.

Stop affected work for any new product choice, public contract change, dependency approval, authority conflict, or scope increase. Present one bounded decision package.

When implementation is complete:

- inspect the actual code and full diff;
- run the authorized automated and knowledgeable manual checks;
- offer the owner an optional simple user experience check when the feature supports one;
- record a declined owner check without treating it as a failure;
- record files, task and stage completion, checks, dependencies, artifact growth, exclusions, user testing status, and residual risk in the implementation result;
- in chat, summarize the outcome, material failed or incomplete checks, and risks that affect the review decision. Provide the full result when the user asks.

Leave all changes unstaged and uncommitted. Independent review must use a reviewer that did not implement the candidate. If the authorized work method can provide that reviewer, continue to Gate 6. Otherwise apply the boundary handoff and ask once for the independent review arrangement. Do not require the user to create another task when an allowed independent reviewer is already available.

For long work, a Codex goal can be used only inside this authorized implementation gate. Its end state must be the uncommitted implementation candidate. A goal cannot cross an owner gate.

## 6. Independent review

Use a reviewer that is independent from implementation. A fresh task is one valid method. An allowed independent worker is another. Do not treat an implementation-task fork that inherits its conclusions as independent.

Treat the actual working tree and diff as the main evidence. Read the process, state, authorization capsule, governing documents, and implementation report only as supporting context.

Inspect scope, security, authorization, persistence, restart behavior, task traceability, tests, dependencies, artifact growth, exclusions, and every required check. Rerun applicable checks independently.

If the review finds defects, assign bounded corrections when useful. Inspect every correction and rerun affected checks. Do not make new product choices or increase scope.

Leave everything unstaged and uncommitted. Summarize findings that affect acceptance. If the current request already gives conditional acceptance and exact commit authority for a passing review, continue to Gate 7. Otherwise apply the boundary handoff and ask whether the owner accepts the reviewed candidate and wants the exact reviewed local commit created.

## 7. Owner acceptance and implementation commit

This gate needs explicit user acceptance of the reviewed candidate and authority for the exact local phase commit. The current request can provide both, including conditional authority that applies only when independent review passes without a material gap. A request to commit the exact independently reviewed candidate counts as acceptance and commit authority unless the user says otherwise.

Add required closeout evidence and history. Read the repository commit convention. Stage only the independently reviewed phase scope. Inspect the staged diff.

After the commit, verify the subject, body, contents, commit SHA, and working-tree state. Record the implementation SHA. Perform an authorized push and verify the remote result when the current request includes that action.

An implementation commit or push does not complete the phase while coverage reconciliation or the final documentation commit remains. If the current request authorizes phase closeout, continue to Gate 8 in the current task. Otherwise state that the implementation is committed or pushed but the phase is not complete. Apply the boundary handoff and ask one combined question to finish coverage reconciliation and the final documentation commit in the current task.

## 8. Post-implementation coverage and document reconciliation

Start after the implementation commit. Continue in the current task or resume in a later task. A fresh task is optional.

Compare the committed result with the design, PRDs, plan, work backlog, tests, user evidence, and required history. Mark only work proved by the committed result. Record gaps and deferred work without hiding them.

Edit only authorized documentation. Inspect the full diff and run document checks. Leave changes unstaged and uncommitted.

Summarize the coverage result and remaining material gaps. If the current request authorizes the final documentation-only commit, continue to Gate 9. Otherwise apply the boundary handoff and ask whether to create that commit from the reviewed file set.

## 9. Final documentation-only commit

This gate needs explicit user authority for the reviewed final document scope. That authority can be part of the current closeout request.

Read the repository commit convention. Stage only the approved documentation. Inspect the staged diff.

After the commit, verify the subject, body, contents, commit SHA, final phase state, and working-tree state. Mark the phase complete only when all gates pass.

If the current request also authorizes the next-phase preflight, continue to Gate 10. Otherwise report that the phase is complete and stop. Do not ask for another action unless the user requested continued work.

## 10. Next phase

Start the next phase only after the prior phase is complete. Run a new preflight from the current committed baseline. The current task can continue when the user's request includes the next phase. A fresh task is optional unless a real independence or context need requires it.
