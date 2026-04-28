# Decompose Codebase Skill — Contract De-Drift

> Filename: `2026-04-23-decompose-codebase-skill-contract-dedrift.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Define how the shipped `decompose-codebase` skill should be brought back into alignment with the repository's current documentation lifecycle contracts.

This design is a systemic de-drift fix, not a narrow path correction. It establishes which artifacts are authoritative, which output model the skill must follow, how the packaged skill and dogfood mirror relate to each other, and how future contract changes should be kept from silently diverging again.

## Context

The repository's active documentation lifecycle contract now lives in `docs/assets/references/` and `docs/assets/templates/`. Those references and templates define the current planning, PRD, archive, and work-backlog model used by the project itself.

The packaged `decompose-codebase` skill under `packages/skills/decompose-codebase/` and the dogfood mirror under `.agents/skills/decompose-codebase/` still carry an older contract. The drift is concrete and spread across the skill surface:

- `SKILL.md`, `references/output-contract.md`, `references/planning-workflow.md`, `references/execution-workflow.md`, and `assets/README.md` still route archived PRD sets to `docs/prd/archive/...`, while the active repo contract routes them to `docs/assets/archive/prds/...`.
- `assets/templates/decomposition-plan.md` and the related skill references still assume one-file decomposition plans and one-file rebuild backlogs such as `docs/plans/YYYY-MM-DD-decomposition-plan.md` and `docs/work/YYYY-MM-DD-rebuild-backlog.md`.
- The current repo contract has moved to the v2 directory model:
  - plan directories in `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/`
  - work directories in `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`
  - archived PRD sets in `docs/assets/archive/prds/`
- `scripts/validate_output.py` and its tests still enforce legacy backlog and archive expectations, so the validator currently codifies the stale contract instead of catching it.

Not every reported issue is the same class of problem. The script-path confusion around `scripts/probe_environment.py` and `scripts/validate_output.py` is primarily a packaging-clarity problem, not evidence that the installed skill should depend on repo-root scripts. Earlier skill-installation designs established that distributed skills are self-contained directory units with local references and support files, so the correct fix is to clarify those semantics rather than move the runtime dependency boundary.

Because the skill is distributed and installed outside this repository, it cannot rely on consumer repositories having this repo's `docs/assets/` tree present at runtime. The skill therefore still needs packaged local copies of the materials it depends on. The bug is that those local copies have not stayed aligned with the repo's active contract.

## Decision

### 1. The repo docs contract is authoritative

For documentation lifecycle semantics, the source of truth is the repo's active contract under:

- `docs/assets/references/`
- `docs/assets/templates/`

The `decompose-codebase` skill may keep local copies needed for distribution, but those copies are a packaged projection of the repo contract, not an independent authority.

Authority should be treated as a three-layer model:

1. `docs/assets/...` defines the active lifecycle contract for this repository.
2. `packages/skills/decompose-codebase/...` is the shipped skill projection of that contract plus skill-specific instructions.
3. `.agents/skills/decompose-codebase/...` is a dogfood mirror of the packaged skill, not a separately evolving source.

### 2. The skill adopts the current v2 output model

`decompose-codebase` remains decomposition-specific, but it should no longer preserve any legacy exception that keeps the old one-file plan and backlog model alive.

The skill's planning and execution contract should align to the current repo model:

- decomposition plans write to `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/00-overview.md` plus phase files
- rebuild backlogs write to `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/00-index.md` plus phase files
- the active PRD set remains under `docs/prd/`
- archived PRD sets move to `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/`

This means the skill's decomposition-specific assets should be re-based on the current shared template model instead of preserving the older one-file contract:

- decomposition planning should align with `docs/assets/templates/plan-prd-decompose.md`
- rebuild backlog structure should align with `docs/assets/templates/work-index.md` and `docs/assets/templates/work-phase.md`
- shared PRD templates in the skill should continue to match the current repo PRD templates

### 3. Bundled helper scripts stay skill-local

Paths such as `scripts/probe_environment.py` and `scripts/validate_output.py` should continue to mean "files bundled inside the installed skill directory."

The design does not move those scripts to repo-root `scripts/`, and it does not make installed skills depend at runtime on repo-root docs or scripts. Instead, the skill's instructions, examples, and support docs must make the local-resolution rule explicit so agents do not misread those paths as repository-root utilities.

### 4. Drift prevention is part of the contract

The follow-on implementation should add an explicit parity model instead of relying on manual copy discipline.

That parity model should distinguish two classes of files:

- verbatim sync targets: skill-local docs or templates that should be exact copies of repo-authoritative assets
- projected targets: skill-local instructions that remain skill-specific in framing but must stay semantically aligned with the active contract

The contract should require all of the following:

- when a repo-authoritative lifecycle doc or template changes, the corresponding packaged skill files must be updated in the same change
- `.agents/skills/decompose-codebase/` must be refreshed from `packages/skills/decompose-codebase/`, not edited as an independent branch of the contract
- validator coverage must assert the v2 plan/work directory model and the `docs/assets/archive/prds/` archive namespace
- tests must fail when mapped skill assets or the dogfood mirror drift from the packaged source

## Alternatives Considered

### Narrow patch only for the archive path

Rejected because the archive-path mismatch is only one visible symptom. The skill also carries a stale plan model, stale backlog model, stale validator behavior, and a package-vs-mirror drift problem. Fixing only `docs/prd/archive/...` would leave the larger contract split in place.

### Preserve a decompose-only legacy one-file exception

Rejected because it would keep decomposition on an outdated lifecycle branch while the rest of the repo has already standardized on v2 plan and work directories. That exception would continue to leak stale examples, templates, and validator logic into the shipped skill.

### Make the installed skill read repo-root docs and scripts at runtime

Rejected because the distributed skill must remain self-contained after installation. Consumer repositories cannot be expected to contain this repository's `docs/assets/` tree or share its local repo layout. Runtime dependence on repo-root materials would make installation fragile and break the harness-local packaging model established by earlier skill designs.

## Consequences

This change should be implemented as one coordinated revision across the package skill, the dogfood mirror, the skill validator, and the validator tests. Updating only one of those surfaces would reintroduce the same drift in a different form.

The follow-on change will therefore need to touch:

- shipped skill instructions and local references
- decomposition-specific skill templates
- user-facing skill guidance such as `assets/README.md`
- validator expectations and tests
- the `.agents` dogfood mirror

Active lifecycle instructions should stop routing future work to the legacy one-file plan/backlog model and the `docs/prd/archive/...` namespace. Historical design, plan, and work artifacts may continue to mention older paths when they are describing past execution, but active skill assets and validators should not treat those paths as current behavior.

The main cost is additional sync and validation machinery. That extra discipline is acceptable because the alternative is a distributed skill whose shipped contract quietly diverges from the repo that defines its lifecycle model.

### Validation Expectations

The follow-on implementation should prove at least these scenarios:

- a freshly installed `decompose-codebase` skill produces decomposition outputs that match the v2 plan and work directory structure
- a decomposition run archives prior PRD sets under `docs/assets/archive/prds/...`, and no active skill asset still documents `docs/prd/archive/...` as the current path
- the validator accepts current v2 outputs and rejects legacy single-file backlog and archive expectations
- skill docs make it clear that helper scripts are bundled skill-local assets rather than repo-root utilities
- `packages/skills/decompose-codebase/` and `.agents/skills/decompose-codebase/` stay in sync under the chosen parity mechanism

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation.md](2026-04-16-cli-skill-installation.md), [2026-04-16-cli-skill-installation-r2.md](2026-04-16-cli-skill-installation-r2.md), [2026-04-21-cli-skills-command.md](2026-04-21-cli-skills-command.md)
- Reason: those designs established the harness-local, self-contained skill packaging model and the dedicated lifecycle surface for managing skills. This design extends that line of work by defining how the `decompose-codebase` skill stays aligned with the repo's active lifecycle contract over time.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../prompts/designs-to-plan-change.prompt.md)
- Why: this is a corrective revision to the shipped `decompose-codebase` skill contract, not a new baseline capability. The next step should plan one coordinated change that realigns the packaged skill, dogfood mirror, templates, and validator behavior.
- Coordinate Handoff: unresolved; planner must resolve before writing.
