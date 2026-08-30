# Prompt Examples

Use these examples to start the main phase tasks. Replace the phase number and file placeholders with real values.

The skill creates or updates `.make-docs/state/phase-state.yaml` at the start of each example. The user does not need to supply a state path.

Use separate Codex tasks when they improve independence or context size. Gate changes alone do not require a new task. Independent review needs a reviewer that did not implement the candidate; a fresh task is one way to provide that reviewer.

## Decision task

### Single item

```text
$phase Start Phase 2 from docs/work/.../02-....md.
Run the preflight and present the next blocking decision only.
```

This selects `single_item` progress. After the item is recorded, report the next pointer and stop.

### Continuous preflight and interview

```text
$phase Start Phase 2 from docs/work/.../02-....md.
Run the full preflight and interview me through every phase item.
After I settle an item, record it and immediately present the next item.
Stop before decision-document reconciliation.
```

This selects `continuous_segment` progress with direct execution. It can pair preflight and owner decision review because the request names both. It still presents one owner decision at a time.

### Continuous current-gate segment

```text
$phase Continue the current authorized gate.
Process all in-scope items in `continuous_segment` mode.
Pause only when you need my answer or reach the next authority boundary.
```

Use this form for an authorized documentation, implementation, review, or closeout segment. It does not add authority beyond the current gate.

For a large phase, a separate read-only preflight remains useful. Group later decision work by a shared authority and read set.

Preflight and decision responses use the current phase item tally in each item label:

```text
2/12 - Type catalog and extension rule [Q-012B]
```

The first number is the item's saved presentation position in the current gate. It stays with the item after its first presentation. The total changes when the gate gains another item. The full phase inventory can have a different total.

When a new item interrupts an active item, the active item keeps its earlier position. The new item receives the next presentation position. Later unpresented items receive positions only when they are first presented.

### Structured user choice

When the current harness and mode provide a native structured choice control, use it for the bounded question and choices below. Do not name or require a harness-specific tool in the phase prompt.

```text
2/12 - Type catalog and extension rule [Q-012B]

Which extension rule should Phase 2 use?

1. Exact catalog only (Recommended) — Keeps validation simple and predictable.
2. Registered extensions — Adds flexibility but requires extension ownership rules.
```

If no native choice control is available, present the same choices as the numbered Markdown list shown above. A native selection counts as explicit confirmation when its option states the full bounded outcome. Otherwise restate the exact resolution and confirm it before recording the decision.

### Resume an interview in a new task

```text
$phase Resume the current Phase 2 owner decision review from phase state.
Reconcile the saved gate tally before presenting the next package.
Continue until the recorded stop boundary.
```

The resumed task must use `.make-docs/state/phase-state.yaml`. It must not rebuild progress from chat memory.

## Decision-document reconciliation task

```text
$phase Reconcile the accepted Phase 2 decisions.
Stop before the documentation-only commit.
```

## Implementation task

```text
$phase Implement Phase 2 from the approved authorization capsule.
Stop with an unstaged and uncommitted implementation candidate.
```

## Independent review task

```text
$phase Independently review the Phase 2 implementation candidate.
Correct only confirmed phase defects.
Stop before owner acceptance and commit.
```

Use a reviewer that did not implement the candidate. A fresh task is one valid method. Do not use an implementation-task fork that inherits its conclusions as the independent reviewer.

## Final document task

```text
$phase Run the post-implementation coverage and document reconciliation
for Phase 2 at implementation commit SHA.
Stop before the final documentation-only commit.
```

## Full phase closeout task

```text
$phase Finish Phase 4 closeout.
Complete any remaining independent review, owner-accepted corrections, implementation commit, coverage reconciliation, and final documentation work.
Create and push the exact reviewed implementation and documentation commits.
Continue until Phase 4 is complete or you need a real product decision or blocker resolved.
```

This request authorizes one continuous closeout span. The agent still validates each gate. It does not ask for another approval when the request already authorizes the next action.

If independent review is already complete:

```text
$phase Finish Phase 4 closeout from the completed independent review.
Commit and push the reviewed implementation, complete coverage reconciliation, then commit and push the reviewed final documentation.
Continue until Phase 4 is complete.
```

If a next-phase request finds an incomplete prior closeout, keep the earlier phase state and finish its remaining work in the current task. Ask one combined question only for protected actions that the user did not already authorize.

## Boundary handoffs and authorization replies

Codex should keep the technical gate bindings in phase state. Present more detail only when the scope changed, the state conflicts, the user asks, or the next choice needs it. After preflight, ask about implementation only when the user previously said that this task should handle it.

After decision-document reconciliation:

```text
The Phase 2 documents are reconciled and the checks pass. Shall I create the documentation-only commit from the reviewed file set?
```

After the documentation-only commit when the user previously said that this task should handle implementation:

```text
The Phase 2 preflight and documentation are complete. Would you like me to start Phase 2 implementation?
```

Ask this even when the earlier request already authorized implementation. It confirms that implementation should start now.

After the documentation-only commit for a preflight-only request:

```text
The Phase 2 preflight and documentation are complete. Phase 2 is now ready for implementation.
```

Stop there. Do not offer to start implementation.

If the user asks what that work includes:

```text
It includes the planned Phase 2 code, template, test, and documentation changes for Stages 2 through 5.
```

After implementation:

```text
Phase 2 implementation is complete and the checks pass. Shall I arrange the independent review?
```

After independent review:

```text
The independent review passed. Do you accept the Phase 2 implementation and want me to create the reviewed local commit?
```

After the implementation commit or push when final closeout was not authorized:

```text
The Phase 2 implementation commit is pushed. Phase 2 still needs coverage reconciliation and its final documentation commit. Would you like me to finish both here and push the final documentation commit?
```

When a Phase 3 preflight request finds that Phase 2 still needs those actions:

```text
Phase 2 still needs coverage reconciliation and its final documentation commit. I can finish both here and then continue into Phase 3 preflight. Shall I do that and push the final documentation commit?
```

After final documentation:

```text
Phase 2 is complete.
```

The user can answer with ordinary language such as `Yes`, `Go ahead`, or `Start Phase 2 implementation`. When the preceding question states one clear bounded action, do not require the user to repeat the capsule ID, state revision, baseline, commit SHA, gate name, or a formal authorization sentence.
