# Preflight Item Tally

Use the phase item register as a stable inventory. Use a separate gate tally for chat progress.

## What counts

Admit an item when it needs a decision, control, proof, or document change before the active phase can start, continue, or close.

An item can be a question, gap, risk, contradiction, dependency, or required proof.

Do not admit an informational note. Do not admit a later-phase item unless the active phase must settle or control it. If two source records describe the same required outcome, keep one item and list both source references.

The source documents and their IDs remain authoritative. The tally does not rename or replace a PRD item ID.

## Initial order

During the first complete preflight for a phase:

1. Find all known items that affect the phase.
2. Remove duplicates by required outcome, not only by title or source ID.
3. Put the items in the planned work order. Put blocking dependencies before the work they block.
4. Assign permanent numbers from `1` through the current total.
5. Write the complete register before presenting any item label.

The inventory number is a stable phase item number. It is not a chat progress number or a live priority rank.

## New items

When new phase items are found:

1. Check the register for the same required outcome.
2. Add new source references to an existing item when the outcome is the same.
3. Add each distinct new item at the end of the register.
4. Increase `phase_items.total` by the number of added items.
5. Increase the state revision once for the complete accepted write.
6. Read the state back before presenting another item label.

If one evidence pass finds several new items, keep their evidence order. If the evidence has no order, use the order in which the primary task confirms them.

Never renumber an existing item. Never reuse a number. The total never decreases during the phase. Keep resolved, deferred, superseded, duplicate, or excluded entries in the register with their final status so earlier labels remain understandable.

These rules apply to the full inventory. A gate tally has its own presentation order and total.

## State shape

Store the register under `phase_items` in `.make-docs/state/phase-state.yaml`:

```yaml
phase_items:
  total: 2
  items:
    - item_key: W1-R0-P2-I001
      ordinal: 1
      display_id: Q-012A
      kind: question
      title: Universal node ID format
      status: accepted
      affects_gate: owner_decision_review
      source_refs:
        - docs/prd/03-open-questions-and-risk-register.md#q-012
      introduced_at_revision: 1
      aliases: []
    - item_key: W1-R0-P2-I002
      ordinal: 2
      display_id: Q-012B
      kind: question
      title: Type catalog and extension rule
      status: accepted
      affects_gate: owner_decision_review
      source_refs:
        - docs/prd/03-open-questions-and-risk-register.md#q-012
      introduced_at_revision: 1
      aliases: []
```

Apply these rules:

- `item_key` is a stable phase-local key. Do not change it.
- `ordinal` is the permanent item number. It must be unique.
- `display_id` is the most useful current source or phase-local ID.
- `title` is a short task title for chat. It can become clearer without changing the item number.
- `kind` describes the item. Use `question`, `gap`, `risk`, `contradiction`, `dependency`, `proof`, or `other`.
- `status` describes the current item state. Use a precise state such as `open`, `active`, `answered`, `accepted`, `controlled`, `resolved`, `deferred`, `superseded`, `duplicate`, or `excluded`.
- `source_refs` points to all authority or evidence records for the item.
- `introduced_at_revision` records the state revision that first admitted the item.
- `aliases` keeps earlier display IDs when the useful ID changes.

The number of entries must equal `phase_items.total`. The ordinals must be continuous from `1` through the total.

If a new item has no source ID, give it a stable phase-local display ID such as `P2-I011`. If it later gets a formal ID, keep the item key and number, move the old display ID to `aliases`, and update `display_id`. Do not change the formal source record only to support the tally.

## Existing state

An active `phase-state/v1` file can gain `phase_items` without changing the schema name. If the section is absent, complete the phase scan before creating it. Do not build the first total only from the existing `decisions` list.

When a completed phase gives way to a new phase, start the new phase register with `total: 0` and `items: []`. The new phase preflight then builds its own order.

## Gate tallies

Store gate-specific chat progress under `phase_tallies`:

```yaml
phase_tallies:
  owner_decision_review:
    presented_item_keys:
      - W1-R0-P2-I001
      - W1-R0-P2-I002
    current_item_key: W1-R0-P2-I003
    eligible_total: 12
    presented_count: 3
    remaining_count: 10
    register_fingerprint: sha256:...
    recovery_status: exact
    reconciled_at: "2026-08-27T18:00:00Z"
    source_revision: 8
```

Apply these rules:

- A gate tally includes items whose `affects_gate` matches that gate.
- An item already saved in `presented_item_keys` stays in that tally even if later state repair changes its gate. This preserves a label that the user already saw.
- A resolved dependency for `preflight` does not count in `owner_decision_review` unless it was actually presented there.
- `presented_item_keys` records first-presentation order. It is not inventory order or acceptance order.
- Add an item key immediately before its first chat label. Never add all pending items in advance.
- Reprinting an item uses its existing position.
- A newly found item increases the eligible total after admission. It receives the next presentation position when first presented.
- `eligible_total`, `presented_count`, `remaining_count`, and `register_fingerprint` are calculated fields. Reconcile them before use.
- `recovery_status` is `exact` when first-presentation order was recorded as it happened. Use `inferred` when an older state lacks that order and it must be rebuilt from decisions and active status.

The full inventory can contain more items than a gate tally. Report both totals when that distinction matters.

## Self-healing reconciliation

At every phase-task start, after every phase-item admission, after every accepted decision, and before every label:

1. Read and validate the current state revision.
2. Confirm unique item keys, continuous inventory ordinals, and `phase_items.total` equal to the number of entries.
3. Rebuild the current gate's eligible set from `affects_gate` plus its saved presentation history.
4. Remove missing and duplicate presentation keys.
5. Preserve valid saved first-presentation order.
6. If an older state has no presentation order, infer settled items from the durable `decisions` order and then add the one active item. Mark the result `inferred`.
7. Recalculate the gate total and counts.
8. Write one corrected state revision when any saved tally field changes.
9. Read the state back before rendering a label.

Use the helper:

```text
uv run .agents/skills/phase/scripts/phase_tally.py reconcile \
  --state .make-docs/state/phase-state.yaml \
  --gate owner_decision_review \
  --expected-revision <revision>

uv run .agents/skills/phase/scripts/phase_tally.py activate \
  --state .make-docs/state/phase-state.yaml \
  --gate owner_decision_review \
  --item-key <item-key> \
  --expected-revision <revision>

uv run .agents/skills/phase/scripts/phase_tally.py label \
  --state .make-docs/state/phase-state.yaml \
  --gate owner_decision_review \
  --item-key <item-key>
```

Use `python3` instead of `uv run` when that Python environment already provides PyYAML. If the helper cannot run, apply the same invariants manually. Do not fall back to inventory numbers for chat labels.

## Chat labels

Build the label at response time:

```text
<presentation-position>/<current-gate-total> - <title> [<display-id>]
```

Example:

```text
2/12 - Type catalog and extension rule [Q-012B]
```

Always read the presentation position and current gate total from the reconciled state. Do not store the complete label. Do not use `phase_items.ordinal` or `phase_items.total` in the label.

If the total grows, the next mention of an older item uses the new total while its saved presentation position stays the same. An item discovered during another package receives the next unused presentation position. The interrupted package keeps its earlier position when it resumes.

Complete the discovery pass for the current response before rendering its item labels. If a new item becomes clear while preparing the response, update and verify the state first. Sent messages remain historical and do not need an edit.

After an item is recorded, follow `run_mode` in [run-modes.md](run-modes.md). A continuous segment presents the next in-scope item without a restart prompt. A single-item segment reports the next pointer and stops.

An optional summary can show the full inventory, gate total, presented count, remaining count, and status counts. Those values do not replace the gate label.

## Worker results

A worker can return a candidate with a proposed title, kind, required outcome, and source references. It must not assign an item key, ordinal, or total. The primary task checks for duplicates, admits the item, writes the state, and renders the label.
