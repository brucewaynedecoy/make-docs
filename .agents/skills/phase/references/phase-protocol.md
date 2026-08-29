# Phase Protocol

This protocol controls one project phase. The live project authority can add stricter gates. It cannot silently remove the user approval boundaries in this file.

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
10. Next-phase preflight in a fresh task.

Run mode applies inside every gate. In `single_item` mode, process one authorized item and end the segment. In `continuous_segment` mode, continue through all authorized items until the recorded stop boundary.

Do not infer a gate transition. One request can authorize many items inside one gate. It can also pair preflight with owner decision review when the user explicitly requests both. Every other gate transition keeps the separate authority rule stated in its section.

At each gate boundary, use the boundary handoff below. Do not stop after every item in `continuous_segment` mode.

### Boundary handoff

Do not cross a gate without the required authority. Keep that control internal and make the transition easy for the user.

1. Finish all routine validation and required state updates allowed by the current authority.
2. Complete safe preparation for the normal next action. Safe preparation can resolve the committed baseline, derive the bounded scope from accepted authority, and draft or update the authorization capsule. It cannot implement, stage, commit, push, publish, deploy, make a product choice, create a task, or perform the next gated action.
3. Give a short outcome in plain language. Include only evidence that matters to the next choice.
4. If the normal next action needs permission, ask one direct question for that action. Do not give only a gate status or next-action pointer.
5. End the turn after the question. Start the gated action only after the user approves it.

Do not require the user to quote a gate name, revision, SHA, capsule ID, or formal authorization sentence. A plain answer is sufficient when it clearly approves the bounded action just presented. Surface technical bindings only for ambiguity, conflict, stale state, audit, or a user request.

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

Apply the boundary handoff. Summarize the reconciliation and ask whether to create the documentation-only commit from the reviewed file set.

## 4. Documentation-only commit

This gate needs a separate user message that approves the reviewed file set, accepted decision IDs, and baseline.

Before the commit:

- read the repository commit convention;
- confirm the baseline and working-tree scope;
- stage only the approved documents;
- inspect the staged diff.

After the commit, verify the subject, body, contents, commit SHA, and working-tree state. Record the SHA in phase state. Do not start implementation without approval. Prepare the bounded implementation authorization capsule, apply the boundary handoff, and ask whether to start implementation in a fresh task.

## 5. Implementation

Start this gate in a fresh task. Require explicit user authorization. Bind that authorization internally to the authorization capsule, state revision, committed authority revision, and baseline. The user's reply does not need to cite those values when it clearly approves the presented implementation scope.

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

Leave all changes unstaged and uncommitted. Do not perform the final independent review without approval. Apply the boundary handoff and ask whether to start independent review in a fresh task.

For long work, a Codex goal can be used only inside this authorized implementation gate. Its end state must be the uncommitted implementation candidate. A goal cannot cross an owner gate.

## 6. Independent review

Start this gate in a fresh task. Do not fork the implementation task.

Treat the actual working tree and diff as the main evidence. Read the process, state, authorization capsule, governing documents, and implementation report only as supporting context.

Inspect scope, security, authorization, persistence, restart behavior, task traceability, tests, dependencies, artifact growth, exclusions, and every required check. Rerun applicable checks independently.

If the review finds defects, assign bounded corrections when useful. Inspect every correction and rerun affected checks. Do not make new product choices or increase scope.

Leave everything unstaged and uncommitted. Apply the boundary handoff. Summarize findings material to acceptance, then ask whether the owner accepts the reviewed candidate and authorizes its exact local commit.

## 7. Owner acceptance and implementation commit

This gate needs a separate user message that accepts the reviewed candidate and authorizes the exact local phase commit.

Add required closeout evidence and history. Read the repository commit convention. Stage only the independently reviewed phase scope. Inspect the staged diff.

After the commit, verify the subject, body, contents, commit SHA, and working-tree state. Record the implementation SHA.

Do not push, publish, deploy, clean artifacts, or start post-implementation documentation work without approval. Apply the boundary handoff and ask whether to start post-implementation coverage and document reconciliation in a fresh task.

## 8. Post-implementation coverage and document reconciliation

Start this gate in a fresh task after the implementation commit.

Compare the committed result with the design, PRDs, plan, work backlog, tests, user evidence, and required history. Mark only work proved by the committed result. Record gaps and deferred work without hiding them.

Edit only authorized documentation. Inspect the full diff and run document checks. Leave changes unstaged and uncommitted.

Apply the boundary handoff. Summarize the coverage result and remaining material gaps, then ask whether to create the final documentation-only commit from the reviewed file set.

## 9. Final documentation-only commit

This gate needs a separate user message that authorizes the reviewed final document scope.

Read the repository commit convention. Stage only the approved documentation. Inspect the staged diff.

After the commit, verify the subject, body, contents, commit SHA, final phase state, and working-tree state. Mark the phase complete only when all gates pass.

Do not begin the next phase without approval. Apply the boundary handoff and ask whether to start the next-phase preflight in a fresh task.

## 10. Next phase

Start the next phase only in a fresh task and only after the prior phase is complete. Run a new preflight from the current committed baseline.
