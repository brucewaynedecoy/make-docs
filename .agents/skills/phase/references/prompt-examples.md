# Prompt Examples

Use these examples to start the main phase tasks. Replace the phase number and file placeholders with real values.

The skill creates or updates `.make-docs/state/phase-state.yaml` at the start of each example. The user does not need to supply a state path.

Each major step starts in a fresh Codex task. A commit approval can remain in the task that prepared and reviewed that exact commit boundary.

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

Open a new task for this step. Do not fork the implementation task.

## Final document task

```text
$phase Run the post-implementation coverage and document reconciliation
for Phase 2 at implementation commit SHA.
Stop before the final documentation-only commit.
```

## Boundary handoffs and authorization replies

Codex should keep the technical gate bindings in phase state and ask for the next action in plain language. Present more detail only when the scope changed, the state conflicts, the user asks, or the next choice needs it.

After decision-document reconciliation:

```text
The Phase 2 documents are reconciled and the checks pass. Shall I create the documentation-only commit from the reviewed file set?
```

After the documentation-only commit:

```text
The Phase 2 documentation commit is complete. The implementation scope is ready. Shall I start Phase 2 implementation in a fresh task?
```

If the user asks what that work includes:

```text
It includes the planned Phase 2 code, template, test, and documentation changes for Stages 2 through 5.
```

After implementation:

```text
Phase 2 implementation is complete and the checks pass. Shall I start the independent review in a fresh task?
```

After independent review:

```text
The independent review passed. Do you accept the Phase 2 implementation and want me to create the reviewed local commit?
```

After final documentation:

```text
Phase 2 is complete. Shall I start Phase 3 preflight in a fresh task?
```

The user can answer with ordinary language such as `Yes`, `Go ahead`, or `Start Phase 2 implementation`. When the preceding question states one clear bounded action, do not require the user to repeat the capsule ID, state revision, baseline, commit SHA, gate name, or a formal authorization sentence.
