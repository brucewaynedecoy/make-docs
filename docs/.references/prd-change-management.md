# PRD Change Management

## Purpose

Use this reference when `docs/prd/` already contains an active PRD namespace and the user wants to evolve it without replacing the whole set.

This workflow covers:

- net-new capability additions
- enhancements to existing capabilities
- revisions to established requirements
- deprecations or removals of established requirements

## Change Taxonomy

| Change type | Meaning | Template | Typical annotation |
| --- | --- | --- | --- |
| `addition` | Introduces a net-new capability that was not previously required | `docs/.templates/prd-change-addition.md` | None required unless baseline docs need cross-links |
| `enhancement` | Extends an existing capability with new behavior or scope | `docs/.templates/prd-change-addition.md` | `Enhanced by` |
| `revision` | Changes an established requirement, contract, or constraint | `docs/.templates/prd-change-revision.md` | `Superseded by` |
| `removal` | Deprecates or removes an established requirement or capability | `docs/.templates/prd-change-revision.md` | `Deprecated by` or `Removed by` |

## Active-Set Evolution Rules

- Treat `docs/prd/` as one active PRD namespace.
- Do not archive the active namespace when performing an additive change, enhancement, revision, or removal.
- Append each new change doc using the next available `NN-` number in the active namespace.
- Never renumber or reorder existing active PRD docs just because a change was introduced.
- Recommended slug prefixes:
  - `add-`
  - `enhance-`
  - `revise-`
  - `remove-`
- The newest linked change doc defines the effective requirement for the scope it changes.
- Earlier baseline text remains visible unless the user explicitly asks for a cleanup rewrite.

## Change Doc Selection Rules

- Use one change doc per coherent change scope whenever possible.
- Split change docs when different requirement areas have materially different rationale, impacted docs, or delivery sequencing.
- Use an addition/enhancement doc even when the new capability is large enough to resemble a subsystem. Under this model, net-new active-set changes are still recorded as change docs.
- Use a revision/removal doc whenever the change alters or retires an already-established requirement, even if new implementation work will also be needed.

## Baseline Annotation Rules

- Add `### Change Notes` only in the existing PRD docs and sections that are actually affected.
- Place the block directly under the impacted heading or immediately after the impacted requirement text.
- Use only these note verbs:
  - `Enhanced by`
  - `Superseded by`
  - `Deprecated by`
  - `Removed by`
- Each note must link to the numbered change doc that carries the effective change.
- When multiple change notes apply, list them in chronological order with the newest note last.
- Do not delete or silently rewrite the baseline requirement merely because a change note exists.

Example:

```md
### Change Notes

- Enhanced by [07-enhance-notifications.md](./07-enhance-notifications.md).
- Superseded by [09-revise-notification-routing.md](./09-revise-notification-routing.md).
```

## Index And Status Rules

- Update `docs/prd/00-index.md` whenever a change doc is added.
- The document map should show at least:
  - document path
  - kind
  - status
  - related docs
  - focus
- Recommended `Kind` values:
  - `core`
  - `baseline`
  - `reference`
  - `addition`
  - `enhancement`
  - `revision`
  - `removal`
- Recommended `Status` values:
  - `active`
  - `superseded`
  - `deprecated`
  - `removed`
- Use `Related Docs` to connect a change doc to the baseline docs it affects and to connect affected baseline docs back to the change doc.

## Work Backlog Coupling

- Full-set generation still writes a backlog for the whole active PRD set.
- Active-set evolution writes a new dated delta backlog by default instead of rewriting a prior backlog.
- Every delta backlog phase should cite:
  - the new change doc or docs
  - the impacted baseline docs that still matter to implementation
- Regenerate the full implementation backlog only when the user explicitly asks for it.

## Validation Checklist

Before closing an active-set evolution task, confirm:

1. Every new change doc uses the next available number and no existing PRD docs were renumbered.
2. Every impacted baseline doc contains the required `### Change Notes` backlinks when applicable.
3. `docs/prd/00-index.md` includes the new change docs and updated status or lineage metadata.
4. The effective requirement can be resolved by following links from the impacted baseline doc to the newest change doc.
5. Baseline text remains visible unless the user explicitly approved a cleanup rewrite.
