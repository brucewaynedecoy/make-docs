# Documentation Coverage Audit and Guide Orchestration

> Filename: `2026-04-23-documentation-coverage-and-guide-orchestration.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Define how `make-docs` should audit its implemented capability surface and turn that audit into a disciplined, navigable set of current-state developer and user guides.

This design does not perform the audit itself. It defines the strategy, intermediate artifacts, decision rules, and delegated execution model that a follow-on plan will use to inventory the completed waves, decide which guides should exist, and coordinate parallel guide drafting without losing traceability or creating overlap.

## Context

The repository now has a substantial implementation trail across completed waves, revisions, and phase history under:

- `docs/designs/`
- `docs/plans/`
- `docs/work/`
- `docs/assets/history/`

It also now has an active PRD set in `docs/prd/` and an initial guide library under `docs/guides/`, including onboarding, workflow, concept, and maintainer-oriented material. That is enough documentation structure to support guided expansion, but not enough coverage discipline to ensure that the implemented product surface is documented coherently for both audiences.

The documentation problem is now different from the earlier guide-structure work captured in [2026-04-16-guide-structure-contract.md](2026-04-16-guide-structure-contract.md). The guide contract already settled where guides live, how they are named, and how frontmatter works. The remaining gap is coverage and orchestration:

- which implemented capabilities deserve a guide at all
- whether each capability needs a developer guide, a user guide, both, or only a link from a broader guide
- how to treat waves and commits as evidence without turning guides into historical logs
- how to keep guides linked to each other and to the source artifacts they summarize
- how to split the drafting work across parallel agents without overlapping write scopes or losing review control

This repo's current shape also creates a specific truth hierarchy. History files and earlier design or work artifacts explain how capabilities were introduced, but the live product surface is now best described by the active PRD set and the current code under `packages/cli/`, `packages/docs/template/`, `packages/skills/`, and selected repo-level scripts. Any documentation initiative that treats historical artifacts as the output truth would drift as soon as later revisions simplify, rename, or supersede earlier work.

The design therefore needs to codify a method that starts from historical discovery but converges on current-state guide decisions.

## Decision

### 1. The documentation initiative is a current-state coverage audit

The follow-on work should be framed as a repo-wide documentation coverage audit, not as a wave-by-wave retrospective.

Historical artifacts are inputs for discovering implemented capabilities and understanding intent, but the goal is a set of guides that describe the current product and current maintainer surface. A capability delivered in multiple waves or revisions should collapse into one current-state guide decision rather than producing one guide per wave.

### 2. Evidence order is fixed

The audit must evaluate evidence in this order:

1. existing guides under `docs/guides/`
2. wave artifacts under `docs/designs/`, `docs/plans/`, `docs/work/`, and `docs/assets/history/`
3. current-truth validation against the active PRD set in `docs/prd/`
4. targeted code inspection for unresolved or ambiguous capability boundaries
5. git commits as fallback or tie-breaker only

This order intentionally starts with the current guide inventory so the audit can identify overlap, reuse, and expansion opportunities before proposing new guide files. It then uses wave artifacts to discover capabilities that may have shipped without guide coverage. The PRD set and code exist to validate what is actually current. Commit history is kept last because it is useful for chronology and tie-breaking, but too noisy and implementation-centric to be a primary guide-planning source.

### 3. Guide drafting must be preceded by a capability coverage ledger

No guide drafting should begin until the audit has produced one intermediate artifact: a capability coverage ledger.

The ledger is the normalization layer between discovery and writing. Each row represents one current-state capability or documentation-worthy surface and must include:

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

The ledger is where the team records capability consolidation across waves, mismatches between historical descriptions and current truth, and whether an area is already covered by an existing guide. It should be treated as the authoritative planning input for guide creation, expansion, consolidation, and link-only coverage decisions.

### 4. Guide decisions use a five-outcome rubric

Every ledger row must resolve to one of five documentation outcomes:

- `developer`
- `user`
- `both`
- `link-only`
- `none`

Use the rubric as follows:

- `developer` for maintainer, extensibility, architecture, template-contract, packaging, validation, release, and internal operational surfaces
- `user` for installation, CLI usage, workflows, and concepts primarily consumed by adopters or operators
- `both` when a single capability has distinct operator and maintainer needs that should not be collapsed into one audience
- `link-only` when the capability belongs inside an existing broader guide or can be covered through cross-links rather than a standalone file
- `none` when the capability is obsolete, too internal, too narrow, or no longer meaningful as a guide target

This rubric is a coverage decision, not a publication status. If a guide is created, it still follows the existing guide contract and begins as `draft`.

### 5. Guide taxonomy is seeded from the current repo shape

The audit should group capabilities into a canonical guide taxonomy derived from the current repo and doc surface. The initial families are:

- onboarding
- concepts and workflows
- CLI lifecycle
- template and contracts
- skills
- maintainer and release operations

These families are intentionally broad. The taxonomy is a coordination aid for bundling work and avoiding duplicate guides, not a new contract that reopens guide naming or frontmatter rules. The follow-on plan may refine titles and per-guide `path` values within the existing guide contract, but it should stay within these families unless the audit finds a strong current-state reason to split further.

### 6. Linking is part of the deliverable, not cleanup

Every guide created or updated by this initiative must use `related` frontmatter to connect:

- companion guides for the other audience when applicable
- source designs, PRD docs, or reference docs that provide deeper context
- other guides in the same workflow chain

The implementation must also refresh at least one navigation surface outside the guides themselves so guide discovery does not depend on already knowing filenames. The exact navigation file can be chosen in follow-on planning, but it must be owned explicitly by assembly work rather than treated as optional polish.

### 7. Parallel execution is coordinator-led and write-scope disciplined

The orchestrator's role is limited to inventory merging, task assignment, review, and acceptance. When delegation is available, the orchestrator does not own guide-writing files.

The delegated model is:

- inventory agents are read-only and return normalized ledger entries, not prose guides
- writing agents receive disjoint guide bundles by family and audience
- one assembly agent owns shared navigation and cross-link files
- one validation agent owns contract checks, link verification, duplicate-coverage review, and ledger-to-guide traceability

Default writing bundles should be:

- install and workflows
- CLI and lifecycle
- skills
- maintainer, template, and release operations

Worker handoffs must always include:

- files changed
- evidence used
- unresolved questions
- link updates made or required

This keeps the ledger authoritative, prevents overlapping guide edits, and gives the orchestrator a clear review surface for acceptance.

## Alternatives Considered

### Expand guides opportunistically without a coverage ledger

Rejected because it would optimize for local momentum while making it hard to prove coverage, detect duplicates, or explain why some capabilities received standalone guides and others did not. The repo is now large enough that opportunistic guide writing would create navigation debt quickly.

### Treat wave artifacts as the guide truth

Rejected because wave artifacts describe how the system evolved, not necessarily what the current product surface is. This would over-preserve renamed, consolidated, or superseded features and would bias the guide set toward implementation history instead of current user and maintainer needs.

### Drive the audit primarily from code or commit history

Rejected because code and commit history are strong verification sources but poor first-pass documentation inputs. They reveal implementation detail well, but they do not preserve intent, documentation changes, or audience framing as clearly as the existing wave artifacts and PRD set.

### Let the orchestrator draft shared or high-priority guides directly

Rejected because it blurs coordination and production ownership, increases the chance of overlapping writes, and makes the delegated execution model less predictable. The coordinator should review and merge decisions, not quietly become another writer.

### Create one guide per wave or per feature increment

Rejected because it would reproduce development chronology instead of producing a usable current-state guide library. Guide boundaries should reflect the current product and maintainer mental model, not the order in which the implementation happened.

## Consequences

This design turns the follow-on work into a two-stage documentation effort:

1. audit and normalize the implemented surface into a capability coverage ledger
2. use that ledger to drive guide creation, expansion, consolidation, linking, and navigation updates

That extra inventory step is deliberate. It adds process, but it gives the repo a clear explanation for why each guide exists, which historical work it covers, how it maps to current truth, and which audience it serves.

The design also makes current-state validation mandatory. If a historical wave document and the active PRD or current code disagree, the mismatch belongs in the ledger, and the guide should follow the current PRD or code rather than the older description.

The main implementation cost is coordination overhead:

- inventory must finish before drafting starts
- the assembly role must own shared navigation files
- the validation role must verify contract compliance and evidence traceability

That cost is acceptable because it reduces the larger risk of producing an inconsistent guide library that is hard to navigate, duplicates existing material, or drifts from the live product surface.

### Validation Expectations

The follow-on implementation should prove at least these scenarios:

- a wave with clearly user-facing CLI or onboarding behavior maps to a user guide or paired user and developer guides
- a wave with internal contract, packaging, or maintainer-only behavior maps to a developer guide or `link-only` coverage in a broader maintainer guide
- a capability delivered across multiple waves or revisions collapses into one current-state guide decision
- when historical wave docs and current PRD or code disagree, the ledger records the mismatch and the guide follows current truth
- parallel drafting completes without overlapping write scopes, and only the assembly role edits shared navigation files

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-guide-structure-contract.md](2026-04-16-guide-structure-contract.md), [2026-04-20-docs-assets-state-and-history.md](2026-04-20-docs-assets-state-and-history.md)
- Reason: the earlier guide-structure design established guide contracts and templates, and the docs-assets design standardized the supporting resource tree and history model. This design builds on both by defining how the implemented product surface should be audited, classified, linked, and delegated into a maintainable guide library.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../../prompts/designs-to-plan.prompt.md)
- Why: this is a new documentation initiative that needs a decision-complete execution plan for the audit ledger, guide bundles, navigation updates, and delegated workflow before any drafting starts.
- Coordinate Handoff: start downstream planning at `W13 R0`; treat this as a new documentation initiative rather than a revision because it introduces a new repo-wide coverage-audit and guide-orchestration workflow rather than revising an earlier delivery wave.
