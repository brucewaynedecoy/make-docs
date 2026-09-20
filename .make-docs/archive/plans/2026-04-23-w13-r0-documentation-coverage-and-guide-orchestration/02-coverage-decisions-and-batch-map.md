# Phase 2 - Coverage Decisions and Batch Map

## Objective

Convert the raw ledger into a decision-complete guide delivery map. This phase resolves the five-outcome rubric for every ledger row, assigns guide families and priorities, chooses create-vs-update targets, and locks the disjoint write scopes that later bundle workers will use.

## Depends On

- Phase 1 ledger completion
- [2026-04-23-documentation-coverage-and-guide-orchestration.md](../../designs/2026-04-23-documentation-coverage-and-guide-orchestration.md)

## Files to Create or Modify

| File | Change Summary |
| ---- | -------------- |
| `docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md` | Resolve provisional coverage fields into final documentation actions. |
| `docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md` | Create the execution-facing map of guide families, target files, priorities, and worker assignments. |

## Detailed Changes

### 1. Apply the five-outcome rubric to every row

Each ledger row must end Phase 2 with one of these final outcomes:

- `developer`
- `user`
- `both`
- `link-only`
- `none`

Apply the design's audience rules exactly:

- maintainer, extensibility, architecture, template-contract, packaging, validation, release, and internal operational surfaces default to `developer`
- installation, CLI usage, workflows, and concepts default to `user`
- split to `both` only when one capability genuinely needs distinct user and developer treatments
- choose `link-only` when a broader guide is the right home
- choose `none` only when the capability is obsolete, too internal, or no longer meaningful as guide content

### 2. Assign guide families from the canonical taxonomy

Every non-`none` row must map into one of the six families established by the design:

- onboarding
- concepts and workflows
- CLI lifecycle
- template and contracts
- skills
- maintainer and release operations

If a row seems to fit multiple families, prefer the family that matches the reader's first question. Cross-family relationships should be handled through `related` links rather than by duplicating guide ownership.

### 3. Lock create-vs-update targets

For every row whose outcome is not `none`, decide whether execution will:

- update an existing guide,
- create a new guide, or
- use `link-only` coverage in an existing guide

The guide delivery map must record:

- target audience
- guide family
- final action
- guide `path`
- final filename slug
- target worker bundle

No later bundle worker should be deciding filenames or whether to create a new guide. Those decisions belong here.

### 4. Use one shared priority scale

Assign one of three priorities to every non-`none` row:

- `P1` - current user or maintainer entry-point coverage that is missing, stale, or materially incomplete
- `P2` - important supporting coverage that is not the first-stop entry path
- `P3` - cleanup, consolidation, or link-only coverage that can land after the higher-value work

Bundle workers should complete all `P1` items in their scope before moving to `P2` or `P3`.

### 5. Lock bundle write scopes before drafting

The guide delivery map must assign each planned guide change to exactly one bundle:

- Bundle A: onboarding, concepts, and workflows
- Bundle B: CLI lifecycle
- Bundle C: skills
- Bundle D: template/contracts and maintainer/release operations

Assembly and validation are separate roles and do not own bundle content creation.

### 6. Reserve navigation and cross-bundle work for Phase 6

Phase 2 must identify, but not yet execute:

- the `README.md` guide discovery update
- any cross-bundle `related` links that require coordination between bundles
- any `link-only` coverage rows that depend on other bundles finishing first

These items should be listed in the guide delivery map as assembly dependencies so bundle workers do not compete for shared files.

## Acceptance Criteria

- [ ] Every ledger row has a final coverage outcome.
- [ ] Every non-`none` row is assigned to exactly one guide family.
- [ ] Every non-`none` row has a final create/update/link-only target.
- [ ] Every non-`none` row has a priority of `P1`, `P2`, or `P3`.
- [ ] The guide delivery map exists and assigns each guide change to one bundle only.
- [ ] `README.md` and other shared assembly dependencies are reserved for Phase 6.
- [ ] No bundle worker is left to decide filenames, path values, or create-vs-update policy during drafting.
