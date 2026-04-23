# Phase 1 - Inventory and Ledger

## Objective

Create the canonical capability coverage ledger that all later guide work depends on. This phase inventories the existing guide surface first, discovers additional capabilities from wave artifacts second, validates current truth against the active PRD set and targeted code inspection third, and records any historical-vs-current mismatches before any guide files are drafted.

## Depends On

- [2026-04-23-documentation-coverage-and-guide-orchestration.md](../../designs/2026-04-23-documentation-coverage-and-guide-orchestration.md)
- The active guide contract in `docs/assets/references/guide-contract.md`
- The active PRD set under `docs/prd/`

## Files to Create or Modify

| File | Change Summary |
| ---- | -------------- |
| `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md` | Create the canonical ledger with one normalized row per current-state capability or documentation-worthy surface. |

## Detailed Changes

### 1. Inventory the current guide surface first

Before scanning historical artifacts, catalog every existing guide under `docs/guides/user/` and `docs/guides/developer/`.

For each guide, record:

- title
- `path`
- audience
- status
- current topical coverage
- obvious overlap or drift risk relative to the current PRD set

The goal is to prevent the later wave scan from proposing redundant standalone guides where the repo already has an adequate starting point.

### 2. Split historical discovery across fixed inventory ranges

Run the inventory pass through the three read-only ranges already defined in the plan overview:

- Inventory worker A: waves `W1-W4`
- Inventory worker B: waves `W5-W8`
- Inventory worker C: waves `W9-W12`

Each inventory worker must inspect the same source classes in the same order within its range:

1. related design docs
2. related plan docs
3. related work backlogs
4. related history records

Inventory workers return normalized candidate rows and evidence links only. They must not draft guides, propose frontmatter, or assign final guide bundles.

### 3. Validate current truth before ledger synthesis

The ledger synthesis worker must validate every candidate capability against current truth in this order:

1. active PRD set
2. targeted code inspection in current implementation
3. git history only if chronology or lineage remains unresolved

If a historical artifact describes behavior that no longer matches the current PRD or code, keep the historical link in the ledger but mark the row as a mismatch and base the later guide decision on the current PRD or code.

### 4. Use one fixed ledger schema

Every ledger row must include these fields:

- `capability`
- `source waves/revisions/phases`
- `current status`
- `evidence links`
- `existing guide overlap`
- `developer guide action`
- `user guide action`
- `suggested guide path/title`
- `priority`
- `related docs`

At the end of Phase 1, `developer guide action`, `user guide action`, `suggested guide path/title`, and `priority` may still be provisional, but the schema itself must already exist so Phase 2 can resolve those fields in place.

### 5. Merge duplicates before moving on

The synthesis step must collapse multiple historical rows that describe the same current-state capability into one ledger row.

Use one row when:

- the capability was delivered across multiple waves or revisions,
- a rename preserved the same product surface,
- a wave added incremental behavior to an already-existing capability,
- separate history records describe different phases of the same user or maintainer surface

Do not create one ledger row per phase just because the implementation happened in phases.

### 6. Capture unresolved questions explicitly

If the synthesis worker cannot determine whether a capability is still current or whether it is already covered by an existing guide, record that uncertainty explicitly in the ledger instead of guessing.

Any unresolved row that blocks later guide drafting should be marked for Phase 2 review before bundle work starts.

## Acceptance Criteria

- [ ] Existing guide coverage is cataloged before historical discovery begins.
- [ ] Inventory workers return normalized candidate rows only and do not draft guide prose.
- [ ] The canonical ledger exists at the planned support path.
- [ ] Every ledger row includes the required schema fields.
- [ ] Multi-wave duplicates are collapsed into current-state capability rows.
- [ ] Historical-vs-current mismatches are recorded explicitly in the ledger.
- [ ] Git history is used only when higher-confidence sources are insufficient.
- [ ] No guide files under `docs/guides/` are modified in this phase.
