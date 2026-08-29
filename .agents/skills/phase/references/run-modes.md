# Run Modes

Run mode controls how the primary task continues through an authorized phase segment. A segment can stay inside one gate or span several gates when the user's request clearly authorizes the full span.

## Two controls

Select two separate controls before material work starts.

Progress control:

- `single_item`: process one authorized item, record the result, report the next pointer, and end the segment.
- `continuous_segment`: process all authorized work through the recorded stop boundary. Continue across internal gates without a restart prompt when the user's request authorizes those actions. Present owner decisions one at a time.

Work method:

- `direct`: the primary task performs the work.
- `orchestrated`: the primary task coordinates workers and keeps gate, integration, review, and state control.

Continuous progress does not imply worker use. Orchestrated work does not imply continuous progress. Use `orchestrated` only when the user explicitly requests delegation or coordination through workers.

## Select the mode

Use the user's words as the authority for progress mode.

Select `single_item` when the user asks for one named item, the next item only, one finding, or one bounded task.

Select `continuous_segment` when the user asks to run the full process, handle all in-scope items, interview them through each item, continue until a named boundary, finish or close out a phase, orchestrate a segment, or avoid restart prompts.

If the request is unclear and the difference matters, ask one short question before material work. Do not silently add implementation, commit, push, publication, deployment, or next-phase authority that the user did not provide.

An explicit later instruction can change the mode for the remaining work. Record the new mode and stop boundary in phase state before continuing.

## State shape

Store the current control under `run_mode`:

```yaml
run_mode:
  progression: continuous_segment
  execution: direct
  segment:
    start_gate: preflight
    stop_before_gate: decision_document_reconciliation
    item_scope:
      mode: all
      ids: []
  status: awaiting_owner
  set_at_revision: 4
```

Apply these rules:

- `progression` is `single_item` or `continuous_segment`.
- `execution` is `direct` or `orchestrated`.
- `start_gate` is the first gate in the authorized segment.
- `stop_before_gate` is the first gate that the segment must not enter. It can be several gates after `start_gate` when one request authorizes a wider outcome.
- `item_scope.mode` is `all` or `listed`.
- `item_scope.ids` is empty for `all` and contains the exact authorized item IDs for `listed`.
- `status` is `inactive`, `active`, `awaiting_owner`, `complete`, or `blocked`.
- `set_at_revision` is the state revision that accepted the current mode.

The state records control data, not the full user prompt. The gate span records how far the task should continue. It does not replace the user's authority for protected actions. `active_runs` can still record stable harness or task identifiers when they are available.

For a full closeout that must stop before the next phase, record a span such as:

```yaml
run_mode:
  progression: continuous_segment
  execution: direct
  segment:
    start_gate: independent_review
    stop_before_gate: next_phase_preflight
    item_scope:
      mode: all
      ids: []
  status: active
  set_at_revision: 22
```

When another task resumes this span, use the state to recover progress and the requested end state. Reconfirm protected-action authority from the new user request. The stored span is not permission by itself.

An active `phase-state/v1` file can gain `run_mode` without changing the schema name. If the section is absent, select the mode from the current user request and add it during the next guarded state write. Do not infer continuous progress only from earlier agent behavior.

## Yield and stop

A yield ends the current assistant turn because the agent needs an owner answer. It does not end the work segment.

When yielding in a continuous interview:

1. Set `run_mode.status` to `awaiting_owner`.
2. Present one complete decision package.
3. End with the exact question or confirmation request.
4. Treat the owner's next answer as continuation of the active segment unless the owner replaces or stops the request.

After the owner settles the item:

1. Record the accepted result and update the phase item tally.
2. Read the state back.
3. If another in-scope item remains, set the run status to `awaiting_owner` and present that item in the same response after the status update.
4. If no item remains and more authorized gates remain in the segment, keep the run active and continue. Set the run status to `complete` only when the recorded stop boundary or requested end state is reached.

Do not return only a status and next-item pointer during a continuous interview when another in-scope item is ready. That response shape belongs to `single_item` mode.

Stop the segment when:

- the full authorized work scope is complete;
- the recorded stop boundary is reached;
- the user stops or replaces the request;
- required authority is absent;
- an authority conflict or scope increase cannot be settled inside the segment;
- a material blocker prevents safe progress.

## Authority boundaries

Run mode never grants permission to edit files, implement, stage, commit, push, publish, deploy, or start another phase. The user's current request can grant one or more of those actions for a segment that spans several gates.

Implementation, commit, push, publication, deployment, and next-phase work still need explicit authority. That authority can appear once in a request that clearly names the full outcome. Do not require a new user message at each gate when the current request already grants the next action.

At each gate transition, compare the next action with the current request and recorded segment. Continue when it is authorized. Apply the boundary handoff only when the next action falls outside that span.

Independent review must remain independent from implementation. It can use a fresh task or an independent reviewer when available and allowed. Other gate transitions do not require a fresh task.

A new product choice pauses affected downstream execution. If the current authorized segment is an owner decision interview, present the choice, yield for the answer, record it, and continue with the next in-scope item when safe.

At an unauthorized gate boundary, use the boundary handoff in `phase-protocol.md`. The stop applies to the first unauthorized action. It does not prevent routine state updates, safe next-step preparation, or one concise combined approval question.

## Routine and worker continuation

In `continuous_segment` mode, complete all routine in-scope checks, updates, validation, and authorized gate transitions without asking the user to say `continue`.

In `orchestrated` work, workers return bounded results to the primary task. Worker completion does not end the segment. The primary task verifies the result, updates state, and continues according to progress mode.

Wait for worker completion or questions through the available event or task-wait mechanism. Do not use repeated status polling.
