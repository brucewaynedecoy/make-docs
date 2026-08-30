---
name: phase
description: Coordinate a defined repository work phase through literal preparation, decision, documentation, implementation, review, acceptance, and closeout gates. Use when the user explicitly invokes $phase for phase work.
---

# Phase

Coordinate one defined project phase. Preserve each user approval boundary. Do not use this skill for an open backlog or unrelated work.

## Required guidance

Read [references/phase-protocol.md](references/phase-protocol.md) before phase work. Apply only the section for the current gate, but keep the full gate order and stop rules in force.

Read [references/run-modes.md](references/run-modes.md) before phase work. Select and record both the progress mode and work method before material work starts.

Read [references/preflight-item-tally.md](references/preflight-item-tally.md) before work at any gate that finds, counts, updates, or presents phase items.

Use [scripts/phase_tally.py](scripts/phase_tally.py) to reconcile gate tallies, activate an item before its first label, and render labels. Run it with `uv run` when available, or with a Python environment that provides PyYAML.

Read [references/prompt-examples.md](references/prompt-examples.md) when the user asks how to start or continue a phase task.

Use [assets/phase-state.yaml](assets/phase-state.yaml) as the schema and creation source for `.make-docs/state/phase-state.yaml`. Use [assets/authorization-capsule.yaml](assets/authorization-capsule.yaml) when implementation needs an exact scope and authority record.

## Start

1. Read all applicable repository instructions.
2. Locate the repository root and set the state path to `.make-docs/state/phase-state.yaml` under that root.
3. Identify the phase, work file, process authority, current gate, requested end state, and full authorized work segment.
4. Select the progress mode and work method from the user request. Use `references/run-modes.md`. If the intended progress mode cannot be proved and the difference matters, prepare one bounded question and mark the unresolved mode as blocked.
5. Verify the repository path, branch, full HEAD, and working-tree state. Preserve all unrelated or earlier user changes.
6. Before broad preflight research or owner decision discussion, create or update the state record and its `run_mode` section as described below.
7. Reconcile the current gate tally before any item label. Use `scripts/phase_tally.py` and read the state back after a repair.
8. Ask the prepared mode question after the required state update. Otherwise continue with only the authorized segment.
9. Separate established facts, recommendations, and open questions.
10. If the current gate or authority cannot be proved, record the blocked state and stop with one bounded question or decision package.

## State

Treat canonical project documents and Git commits as product truth. Treat the phase state record as a small pointer and status index.

- The state path is always `<repo-root>/.make-docs/state/phase-state.yaml`. Do not ask the user to choose another path.
- At the start of every phase task, including preflight and owner decision work, ensure that `.make-docs/` and `.make-docs/state/` exist and that the state file exists.
- Create missing directories and the state file when the active global, project, harness, sandbox, and approval rules permit it.
- If creation or update needs approval, request that approval. If approval is denied or unavailable, stop and report the fixed-path state blocker. Do not use a fallback path.
- Create a missing file from the bundled state template. Replace template nulls with facts that are known. Keep unknown values null and mark the gate as initializing or blocked instead of inventing values.
- At each task start, update `updated_at`, the proved baseline and coordinate fields, and an active-run entry when a stable run identifier is available.
- Store progress and work-method control under `run_mode`. Record the authorized segment and its stop boundary. Follow `references/run-modes.md`.
- Store `run_mode.segment.preimplementation_transition` as `confirm_start` only when the user said that this task should handle implementation after preflight. Store `report_ready` when the user requested only preflight or did not state that implementation should follow. Do not infer implementation intent from the phase lifecycle.
- An explicit later user instruction can change `run_mode` for the remaining work. Increase the state revision and read the state back before using the new mode.
- Keep `run_mode.status` as `awaiting_owner` when a continuous interview yields for an answer. A yield does not complete the work segment.
- Store the stable phase item register under `phase_items`. Use it for questions, gaps, risks, contradictions, dependencies, and proofs that affect the active phase. Do not change the source IDs.
- Build or reconcile the phase item register before a preflight or owner decision response presents an item. Follow the admission, numbering, update, and label rules in `references/preflight-item-tally.md`.
- Store each gate's presentation order and calculated counts under `phase_tallies`. The permanent inventory number under `phase_items` is not a chat progress number.
- Before the first label for an item, activate it in the current gate tally. Before every label, reconcile the tally and render the label from its saved presentation position and the current gate total.
- Write a changed gate total or repaired presentation order to the state before a later response uses it. Do not revise older chat messages.
- If the existing state belongs to the same phase, preserve valid state and update only fields proved by current evidence.
- If the existing state belongs to another incomplete phase, do not overwrite it. Reconcile it against current repository and commit evidence before treating it as a blocker.
- If current evidence proves that the earlier phase work is complete and only the state is stale, repair the state and continue.
- If real earlier-phase work remains, keep that phase active. Complete the remaining work in the current task when the current request authorizes it. If added authority is needed, ask one combined question for the exact remaining actions. Do not require another task only because the state names an earlier phase.
- If the existing state belongs to a completed phase, initialize the new phase from the template and set its revision to the prior revision plus one.
- Increase `revision` exactly once for each successful write. Reject a write if the on-disk revision changed after it was read.
- Validate the YAML and required fields before replacement. Use a temporary file beside the state file. Replace the state file in one complete file operation when the environment supports it. Read the final file back after every write.
- Do not change ignore rules, stage the file, or commit it unless the user separately authorizes that exact repository action.
- Record the revision read by each worker or result.
- Reject stale, duplicate, or out-of-order changes.
- Treat `answered`, `accepted`, `reconciled`, and `committed` as different states.
- Record every deferral with an owner, destination phase, activation trigger, and fail-closed gate.
- Update the state after every accepted decision, reconciliation result, authorization, implementation result, review result, deferral, commit, and final closeout transition.

## Gate control

Perform every action needed to reach the end state authorized by the current user request. Treat gate order as a validation sequence, not as a required series of chats or tasks.

- Do not infer implementation authority from planning or decision approval.
- Do not infer commit authority from review or acceptance.
- Do not create or switch a branch or worktree without explicit user permission.
- Do not push, publish, deploy, activate, or start the next phase without explicit authority.
- Leave edits unstaged and uncommitted unless the user explicitly authorizes the exact commit boundary.
- One request can explicitly authorize multiple gates and protected actions. Do not ask for another approval at an internal gate when the current request already clearly authorizes the next action. The preimplementation transition after the documentation-only preflight commit is the exception below.
- After the documentation-only preflight commit, do not start implementation in the same turn. If `preimplementation_transition` is `confirm_start`, ask whether the user wants implementation started now, even when the earlier request already authorized it. Treat this as a start-now confirmation, not as a request to repeat the scope or authority. If it is `report_ready`, report that the phase is ready for implementation and stop without offering to start it.
- Progress mode does not grant authority. It controls continuation through the full segment that the user authorized.
- Treat `finish the phase` or `close out the phase` as authority for routine remaining closeout checks, state updates, coverage work, and document reconciliation through a reviewed final-document candidate. Those phrases alone do not authorize a commit, push, publication, deployment, or the next phase.
- Treat a request to close out and commit or push the phase as authority for the exact reviewed closeout commits or pushes named by the user. Recheck the exact file and remote scope before each protected action.
- Treat a request to commit the exact independently reviewed implementation candidate as owner acceptance and commit authority for that boundary unless the user says otherwise. A request to push it also authorizes that exact push. Do not ask for a separate acceptance statement.
- That implementation commit or push authority applies to the implementation boundary only. If coverage reconciliation or a final documentation commit remains, do not call the phase complete. Name the remaining closeout work and ask one combined question to finish it in the current task.
- A request to start the next phase authorizes inspection of the prior phase and repair of stale phase state. It does not silently authorize unrequested prior-phase edits, commits, or pushes. If those actions remain, ask one combined question to finish them in the current task and then continue into the requested phase.
- A new product choice, public contract change, dependency approval, authority conflict, or scope increase pauses affected downstream work. Present one decision package. In an authorized continuous decision interview, yield for the answer and then continue with the next in-scope item after the choice is settled.
- Distinguish a yield for required input from the end of a work segment. Use the stop rules in `references/run-modes.md`.

Use task boundaries to preserve independence or reduce context. Do not use them as approval gates.

- Keep implementation and its independent review separate. Use a fresh task or an independent reviewer when the harness and current permissions support it.
- After independent review, the same review task can continue through any owner-accepted commit and closeout work that the user authorizes.
- Preflight, decisions, documentation, implementation, and closeout can use separate tasks when that is useful. They do not require separate tasks merely because the gate changes.
- Never ask the user to create a fresh task only to resume an incomplete phase or advance phase state.

For a large phase, use one extra read-only preflight task and one or more owner-decision tasks grouped by a shared authority and read set. Do not create a new task for every small question.

Do not treat a fork that inherits the implementation task's conclusions as independent review. A commit authorization can remain in the task that prepared and independently reviewed that exact commit boundary.

## Communication

Treat gates as internal controls, not as a required chat format.

- At task start, use at most one short, natural acknowledgment and then begin. Do not preview the `Start` checklist or narrate repository checks, state binding, run mode, work method, authority checks, gate mechanics, or worker plans. A suitable acknowledgment is: `Got it. I’ll use the phase skill and start Phase 2 implementation now.`
- Apply the same restraint to every progress update. Do not narrate baseline hashes, branch or HEAD binding, state creation or revision, run-mode or work-method selection, authority checks, document-index freshness or refresh work, tool choice, or worker setup. If an update is required, describe only the user-facing outcome, such as `I’m preparing the Phase 2 implementation scope.` Surface control details only for a blocker, conflict, decision, audit request, or direct question.
- Do not explain the gate sequence, approval model, or state machinery unless the user asks or a mismatch blocks safe work.
- Keep state revisions, baseline bindings, authorization capsule IDs, stop conditions, and routine negative assurances in project state. Surface them only when they affect the user's decision, resolve a conflict, support an audit, or answer a request.
- Give a short outcome and only the evidence material to the user's next choice. Include a commit SHA after a commit, but do not recite every routine check or unchanged boundary by default.
- Before asking for the next permission, complete all safe transition preparation that does not cross the boundary. This can include required state updates, resolving the committed baseline, deriving the next bounded scope from accepted authority, and drafting or updating the authorization capsule.
- When completing the user's requested outcome needs more permission, ask one direct plain-language question. Do not ask about later lifecycle work that is outside the requested outcome. Do not merely report that another authorization is required.
- Treat a needed authorization boundary as a user choice, not a blocker. Do not describe the next work as locked, blocked, gated, unable to proceed, or waiting for permission. State the concrete work needed to complete the request and ask whether the user wants it done. Use blocker language only when an actual blocker exists.
- If the user asks what the choice permits, describe the planned changes, stages, or effects. Do not answer by restating the gate or by saying only that approval is needed to start.
- Ordinary language is valid authorization when it clearly answers the bounded action the agent presented. Do not require the user to repeat a revision, SHA, capsule ID, gate name, or formal approval sentence.
- At an ordinary segment end, report the completed segment. Do not add a negative status for later lifecycle work. Report whole-phase completion when the phase is complete. Describe remaining closeout work only when the user asked to finish the phase, requested closeout status, or must resolve a real blocker or decision.
- Do not mention, promise, or plan worker or subagent use in the opening acknowledgment or an implementation request unless the user already selected `orchestrated` work or separately requested delegation.

## User choices

When the user must choose among valid, bounded options, use a native structured choice control if the current harness and mode provide one.

- Ask one decision at a time.
- Present two or three mutually exclusive choices.
- Put the recommended choice first and mark it `(Recommended)`.
- Give one short effect or tradeoff for each choice.
- Keep the phase item label and source ID visible with the question.
- Do not invent extra choices to satisfy this format.
- Do not use a choice control for an open-ended question, a routine yes-or-no permission, or a case with only one safe option.
- If no native choice control is available, use a numbered Markdown list.
- Allow a free-form answer when the harness supports one.
- A native selection counts as explicit confirmation when the option states the full bounded outcome. If the option is shorthand, restate the exact resolution and confirm it before recording the decision.

## Workers

Workers are optional. Use them only when the work divides into clear, bounded parts.

- Give each worker exact authority, file ownership, scope, exclusions, checks, and a small result shape.
- Permit one writer for a file or worktree at a time.
- Require file paths and direct evidence instead of long transcript copies.
- Workers can report phase item candidates, but they cannot assign item numbers or change `phase_items`. The primary task removes duplicates and updates the register.
- Work method and progress mode are separate. Worker completion returns control to the primary task. In `continuous_segment` mode, the primary task continues the authorized segment without asking the user to restart it.
- Verify all material findings and edits in the primary task.
- Use completion and blocker events. Do not spend model turns on routine polling.

## Finish

Continue through every gate inside the authorized segment until the requested end state is reached. Apply the communication rules above. If more authority is needed, stop before the first unauthorized action and ask one combined question that covers the remaining known closeout actions. Do not hand the user to another task unless independent review is still required and no independent reviewer is available in the current work method.
