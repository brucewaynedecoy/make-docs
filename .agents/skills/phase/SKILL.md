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
3. Identify the phase, work file, process authority, current gate, and requested work segment.
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
- An explicit later user instruction can change `run_mode` for the remaining work. Increase the state revision and read the state back before using the new mode.
- Keep `run_mode.status` as `awaiting_owner` when a continuous interview yields for an answer. A yield does not complete the work segment.
- Store the stable phase item register under `phase_items`. Use it for questions, gaps, risks, contradictions, dependencies, and proofs that affect the active phase. Do not change the source IDs.
- Build or reconcile the phase item register before a preflight or owner decision response presents an item. Follow the admission, numbering, update, and label rules in `references/preflight-item-tally.md`.
- Store each gate's presentation order and calculated counts under `phase_tallies`. The permanent inventory number under `phase_items` is not a chat progress number.
- Before the first label for an item, activate it in the current gate tally. Before every label, reconcile the tally and render the label from its saved presentation position and the current gate total.
- Write a changed gate total or repaired presentation order to the state before a later response uses it. Do not revise older chat messages.
- If the existing state belongs to the same phase, preserve valid state and update only fields proved by current evidence.
- If the existing state belongs to another incomplete phase, do not overwrite it. Record no transition and stop with one bounded conflict report.
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

Perform only the action that the current user request authorizes.

- Do not infer implementation authority from planning or decision approval.
- Do not infer commit authority from review or acceptance.
- Do not create or switch a branch or worktree without explicit user permission.
- Do not push, publish, deploy, activate, or start the next phase without separate authority.
- Leave edits unstaged and uncommitted unless the user explicitly authorizes the exact commit boundary.
- Progress mode does not grant authority. It controls continuation only inside the authorized segment.
- A new product choice, public contract change, dependency approval, authority conflict, or scope increase pauses affected downstream work. Present one decision package. In an authorized continuous decision interview, yield for the answer and then continue with the next in-scope item after the choice is settled.
- Distinguish a yield for required input from the end of a work segment. Use the stop rules in `references/run-modes.md`.

Use a fresh primary Codex task for each major authority or responsibility boundary:

1. preflight and owner decisions;
2. decision-document reconciliation;
3. implementation coordination;
4. independent review and owner acceptance;
5. post-implementation coverage and final document reconciliation.

For a large phase, use one extra read-only preflight task and one or more owner-decision tasks grouped by a shared authority and read set. Do not create a new task for every small question.

Do not fork the implementation task to perform independent review. Open a fresh task. A commit authorization can remain in the task that prepared and reviewed that exact commit boundary.

## Communication

Treat gates as internal controls, not as a required chat format.

- At task start, use at most one short, natural acknowledgment and then begin. Do not preview the `Start` checklist or narrate repository checks, state binding, run mode, work method, authority checks, gate mechanics, or worker plans. A suitable acknowledgment is: `Got it. I’ll use the phase skill and start Phase 2 implementation now.`
- Apply the same restraint to every progress update. Do not narrate baseline hashes, branch or HEAD binding, state creation or revision, run-mode or work-method selection, authority checks, document-index freshness or refresh work, tool choice, or worker setup. If an update is required, describe only the user-facing outcome, such as `I’m preparing the Phase 2 implementation scope.` Surface control details only for a blocker, conflict, decision, audit request, or direct question.
- Do not explain the gate sequence, approval model, or state machinery unless the user asks or a mismatch blocks safe work.
- Keep state revisions, baseline bindings, authorization capsule IDs, stop conditions, and routine negative assurances in project state. Surface them only when they affect the user's decision, resolve a conflict, support an audit, or answer a request.
- Give a short outcome and only the evidence material to the user's next choice. Include a commit SHA after a commit, but do not recite every routine check or unchanged boundary by default.
- Before asking for the next permission, complete all safe transition preparation that does not cross the boundary. This can include required state updates, resolving the committed baseline, deriving the next bounded scope from accepted authority, and drafting or updating the authorization capsule.
- When the recommended next action needs permission, ask one direct plain-language question. Do not merely report that another authorization is required.
- Ordinary language is valid authorization when it clearly answers the bounded action the agent presented. Do not require the user to repeat a revision, SHA, capsule ID, gate name, or formal approval sentence.
- Do not mention, promise, or plan worker or subagent use in the opening acknowledgment or an implementation request unless the user already selected `orchestrated` work or separately requested delegation.

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

Finish all routine work allowed inside the current boundary. Apply the communication rules above. If more authority is needed, stop before that action after asking the shortest clear question for the recommended next step.
