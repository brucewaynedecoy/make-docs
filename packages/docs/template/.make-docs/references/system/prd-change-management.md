# PRD Authority Maintenance

Archive layout is authoritative in `docs/assets/archive/AGENTS.md`.

## Purpose

Use this reference when `docs/prd/` already contains the active product authority and a decision, design, implementation, or finding may affect that authority.

The governing invariant is:

> `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.

Implementation sequencing, migration actions, reconciliation work, and editorial language such as “revise X” belong in plans, work backlogs, and history records. They do not become standalone PRDs.

## Maintenance Decisions

Assign one decision to every candidate requirement change:

| Decision | Use when |
| --- | --- |
| `update-existing` | An existing PRD subject owns the changed requirement. Update its current normative text surgically and non-destructively. |
| `create` | No existing PRD owns a coherent, wholesale new capability, subsystem, or product boundary. Create a product-authority PRD named for that subject. |
| `link-only` | Current authority is correct, but the index, related links, or another navigation surface needs a pointer. |
| `none` | Current authority already covers the decision and no PRD or link change is warranted. Record the rationale in the governing plan, coverage pass, or history record. |

Do not create PRDs whose subject is an editorial action. Active filenames, H1 titles, index kinds, and downstream authority links must describe product capabilities or boundaries, never additions, enhancements, revisions, removals, migrations, or reconciliation operations.

## Ownership And Surgical Update Rules

- Read the active PRD index and candidate owner documents before writing.
- Update the existing PRD when its subject already owns the affected behavior, contract, scope, limitation, non-goal, or product boundary.
- Put the current normative requirement inline in the owning section. A reader must not need to follow a history link to discover what the product currently requires.
- Preserve unaffected text, anchors, links, terminology, and document identity.
- Do not renumber existing PRDs merely because authority changed.
- Create a new numbered PRD only when the product gains a coherent capability, subsystem, or boundary that has no suitable existing owner.
- If a candidate cuts across several owners, update each owning PRD rather than creating a cross-cutting editorial record.
- If the current PRDs already cover the decision, create no PRD and record `none` with its rationale outside the active PRD tree.

## Requirement History Contract

`## Requirement History` is an optional, non-normative section in a product-authority PRD. It preserves material prior iterations after the current requirement has been updated inline.

- Current normative requirements in the main body always win over requirement-history entries.
- Add history only for a material replacement, removal, or deprecation that future readers may need to understand.
- Do not duplicate an entire prior PRD or retain obsolete normative prose in the current requirement section.
- Place `## Requirement History` after the current normative sections and before `## Source Anchors` when the template uses source anchors.
- Use one dated `###` entry per coherent requirement change, newest last.
- Every entry records:
  - `Date`
  - `Coordinate` when one is known; otherwise state `Not assigned`
  - `Affected requirement or section`
  - `Previous contract`
  - `Replacement contract`
  - `Rationale`
  - `Source`, using a resolving link to the governing design, plan, work, history, owner decision, or implementation evidence when available

Use this shape:

```md
## Requirement History

### {{DATE}} — {{COORDINATE_OR_NOT_ASSIGNED}}

- Affected requirement or section: `{{SECTION_OR_REQUIREMENT}}`
- Previous contract: {{PREVIOUS_CONTRACT}}
- Replacement contract: {{REPLACEMENT_CONTRACT}}
- Rationale: {{RATIONALE}}
- Source: [{{SOURCE_LABEL}}]({{RELATIVE_SOURCE_PATH}})
```

The source coordinate identifies the maintenance event; it is not the PRD document's identity. Product PRDs do not use W/R/P coordinates in filenames, titles, or document-level frontmatter.

## Removals And Deprecations

- Express a removal or deprecation as the current scope, non-goal, limitation, status, or boundary in the owning PRD.
- Update current normative text first.
- Preserve the prior state in `## Requirement History` when it is materially useful.
- Update product-oriented index status or focus text only when it helps readers understand the current product shape.
- Do not leave a removed requirement active in the body and rely on a history entry, backlink, or separate removal document to override it.

## Risk Register Update Rules

- Keep `docs/prd/03-open-questions-and-risk-register.md` as the canonical living register for gap state, open questions, resolved decisions, confirmed drift, and rebuild risks.
- Preserve the fixed sections `## Confirmed Drift`, `## Open Questions`, `## Rebuild Risks`, and `## Source Anchors`.
- Add or update one numbered `###` item per gap, question, drift, or risk.
- Use `D-001`, `D-002`, etc. under `## Confirmed Drift`; `Q-001`, `Q-002`, etc. under `## Open Questions`; and `R-001`, `R-002`, etc. under `## Rebuild Risks`.
- Assign the next available number within the section and never renumber existing items, even when they move to `Closed`.
- Each item starts with a table containing `Status`, `Decision`, and `Follow-Up`.
- Use only `Open`, `Confirming`, `Deferred`, or `Closed` for item status.
- Include `Question` or `Issue`, `Why it matters`, `Recommendation`, and `To close` for every item.
- Add `Resolution` only when the item is closed.
- If the item is already documented, update that existing item instead of duplicating it.
- Do not use `## Requirement History` as a substitute for unresolved risk or decision tracking.

## Index And Status Rules

- Update `docs/prd/00-index.md` whenever an authoritative PRD is created, renamed, retired from the active set, or changes navigation relationships.
- The document map should show at least:
  - document path
  - product-oriented kind
  - current status
  - related authoritative docs
  - current focus
- Use product-oriented kinds such as `core`, `capability`, `subsystem`, and `reference`. Never use editorial kinds such as `addition`, `enhancement`, `revision`, or `removal`.
- Status describes the current product authority, not the operation that changed it.
- Related links connect current authorities to one another. Do not link retired editorial change records as product authority.

## Plans, Work, And History

- Plans may describe the editorial maintenance operation, including which PRDs to update, which new product authorities to create, and which history entries to add.
- Work backlogs may use change, revision, migration, reconciliation, or removal language when that language describes implementation work.
- History records preserve execution provenance and completed maintenance activity.
- Downstream work reads the updated authoritative PRDs for product requirements. It may read the governing plan for sequencing and the history record for provenance, but neither overrides the current PRD body.
- Plans and backlogs are always directories: `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` and `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`.
- A scoped maintenance effort normally produces a dated delta backlog rather than rewriting an earlier backlog.
- Every delta backlog phase cites the updated or genuinely new authoritative PRDs that constrain implementation.

## Validation Checklist

Before closing PRD authority maintenance, confirm:

1. Every candidate has a `create`, `update-existing`, `link-only`, or `none` decision and a reason.
2. Current normative requirements are inline in their owning PRDs.
3. Every new PRD represents a coherent capability, subsystem, or product boundary rather than an editorial operation.
4. Material prior contracts are preserved only in non-normative `## Requirement History` entries with the required fields.
5. Removals and deprecations are expressed in current scope, non-goal, limitation, status, or boundary text before history is recorded.
6. `docs/prd/00-index.md` uses product-oriented kinds and links only to current product authorities.
7. Downstream work cites updated authoritative PRDs rather than retired change records.
8. Newly discovered or resolved gaps, drift, questions, decisions, and risks are reflected in `docs/prd/03-open-questions-and-risk-register.md`.
9. No existing PRD was renumbered or broadly rewritten without an ownership-based reason.

## Deterministic Authority Validation

Run `make-docs run prd authority validate --target-root <project>` against the project root after PRD maintenance and before downstream work treats the set as authority. The read-only operation scans active `docs/prd/**/*.md` files plus live documentation links and source fields.

The validator uses two finite, case-insensitive sets. Filenames and H1 subjects prohibit only `revise`, `revision`, `add`, `addition`, `enhance`, `enhancement`, `remove`, `removal`, `deprecate`, `deprecation`, `reconcile`, and `reconciliation`. Product subjects such as Update Delivery, Replacement Policy, and Migration Safety therefore remain valid. Frontmatter and PRD-index editorial kinds prohibit those twelve terms plus `update`, `replace`, `replacement`, `migrate`, and `migration`.

| Code | Meaning |
| --- | --- |
| `PRD-AUTH-001` | An active filename begins with a number and prohibited editorial stem. |
| `PRD-AUTH-002` | The first H1 subject begins with a prohibited editorial stem after an optional PRD number is removed. |
| `PRD-AUTH-003` | Active frontmatter or an index `Kind`, `Document Kind`, or `Type` cell declares a prohibited editorial kind. |
| `PRD-AUTH-004` | An active PRD uses `Change Type`, `Capability Addition or Enhancement`, `Affected Baseline Docs`, `Baseline Being Revised or Removed`, or `Required Baseline Annotations`. |
| `PRD-AUTH-005` | A live Markdown link or authority-like frontmatter source field treats an action-prefixed PRD as current authority. |
| `PRD-AUTH-006` | An active product PRD declares top-level `coordinate` frontmatter as document identity. |
| `PRD-AUTH-007` | The requested target root is missing, unreadable, or not a directory. |
| `PRD-AUTH-008` | `docs/` or `docs/prd/` is unsafe, including a symlink or resolved path that escapes the target project. |

Markdown links are authority-bearing only within `Source PRD Docs`, `Source PRDs`, `Source PRD Documents`, `PRD Authority`, `Product Authority`, `Current PRD Authority`, `Authoritative PRDs`, `Authoritative PRD Docs`, `Source Authority`, `Authority Sources`, or `Active Authority Baseline`, plus the PRD index's `Document Map`. The provenance sections `Requirement History`, `Provenance`, `Lineage`, `Source Anchors`, `Design Provenance`, `Migration Provenance`, `Migration History`, `Historical Provenance`, and `Archive Provenance` are exempt from authority-link enforcement.

Outside the only canonical path exemption, `docs/assets/archive/**`, the validator also reads JSON, JSONL, YAML, and YML. After punctuation removal and lowercasing, authority fields are `source(s)`, `sourcePath(s)`, `sourcePrd(s)`, `sourcePrdPath(s)`, `sourcePrdDoc(s)`, `authority/authorities`, `authorityPath(s)`, `authorityPrd(s)`, `prd(s)`, `prdPath(s)`, and `prdDoc(s)`, including nested `path(s)` under source, authority, or PRD containers. Standardized provenance containers matching the provenance section vocabulary are exempt.

These provenance exemptions do not permit an active PRD filename, H1, kind, retired heading, or document-level coordinate to violate current-authority rules. The validator resolves the target root and documentation scan roots before reading; an absent or invalid root fails with `PRD-AUTH-007`, while an escaping or otherwise unsafe `docs/` or `docs/prd/` root fails closed with `PRD-AUTH-008`.

Interactive TTY output is a human summary followed by every diagnostic and remediation. `--json` output, and non-TTY output, emit the complete structured report. A report with `status: failed` exits nonzero after printing the full result; `status: passed` exits zero.
