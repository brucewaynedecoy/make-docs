# Phase 1 - Authority and Skill Contract

## Objective

Realign the human-facing `decompose-codebase` contract surfaces to the repository's current v2 lifecycle model while preserving the installed skill as a self-contained directory with local references, templates, and scripts.

## Depends On

- [2026-04-23-decompose-codebase-skill-contract-dedrift.md](../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md)
- Current repo lifecycle contract under `docs/assets/references/` and `docs/assets/templates/`
- The shipped Wave 5 skill-delivery model captured in [2026-04-16-cli-skill-installation-r2.md](../../designs/2026-04-16-cli-skill-installation-r2.md)

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/skills/decompose-codebase/SKILL.md` | Rewrite the skill overview, planning/execution instructions, output contract, and template references to the v2 archive and directory-based plan/work model. |
| `packages/skills/decompose-codebase/assets/README.md` | Update the user-facing skill guide to the current archive namespace, v2 plan/work directory structure, and explicit skill-local script semantics. |
| `packages/skills/decompose-codebase/references/planning-workflow.md` | Replace the legacy one-file decomposition plan contract with the v2 plan-directory model. |
| `packages/skills/decompose-codebase/references/execution-workflow.md` | Replace the legacy archive and one-file backlog instructions with the v2 archive/work model. |
| `packages/skills/decompose-codebase/references/output-contract.md` | Rewrite the skill-local output contract to match `docs/assets/archive/prds/` and directory-based work outputs. |
| `packages/skills/decompose-codebase/references/mcp-playbook.md` and `references/harness-capability-matrix.md` | Update only if they contain stale path or script-resolution guidance discovered during implementation. |

## Detailed Changes

### 1. Rewrite the active path contract

Update all active skill instructions to use the current repo lifecycle semantics:

- archived PRD sets live under `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/`
- decomposition plans are plan directories with `00-overview.md` and phase files
- rebuild work is a work directory with `00-index.md` and phase files
- the active PRD set still lives under `docs/prd/`

Do not preserve dual-path wording that treats the legacy and current path models as equally valid.

### 2. Clarify authority vs runtime dependence

Make the distinction explicit in the skill docs:

- repo-authoritative lifecycle rules live in `docs/assets/...` during source authoring in this repo
- installed skills still operate from bundled local copies under their own directory
- `scripts/probe_environment.py` and `scripts/validate_output.py` are skill-local assets, not repo-root utilities

The skill should read as "contract aligned to the repo" rather than "runtime dependent on the repo."

### 3. Preserve stable local filenames where they still add value

Keep the skill-local projection filenames that remain useful for discoverability and install stability:

- `assets/templates/decomposition-plan.md`
- `assets/templates/rebuild-backlog-index.md`
- `assets/templates/rebuild-backlog-phase.md`

Do not rename those local files solely to mirror the repo template filenames. The contract change is semantic. The one exception is the obsolete single-file backlog template, which Phase 2 removes.

### 4. Normalize the skill's planning/execution story

After the rewrite, the active instruction set should consistently say:

- planning-first by default
- plan approval is separate from execution approval
- full-set decomposition writes a plan directory and a work directory
- archive approval is required only when an active PRD set already exists
- local helper scripts are bundled with the installed skill

### 5. Leave unrelated skill guidance alone

Do not churn `mcp-playbook.md` or `harness-capability-matrix.md` unless implementation finds stale path or runtime-assumption text inside them. Keep the phase scoped to actual contract drift.

## Acceptance Criteria

- [ ] No active skill-local contract file routes future work to `docs/prd/archive/...`.
- [ ] No active skill-local contract file still treats `docs/plans/YYYY-MM-DD-decomposition-plan.md` as the current plan output.
- [ ] No active skill-local contract file still treats `docs/work/YYYY-MM-DD-rebuild-backlog.md` as the current backlog output.
- [ ] `SKILL.md` and `assets/README.md` explicitly describe helper scripts as bundled skill-local assets.
- [ ] Contract wording remains self-contained and does not imply installed skills require this repo's root `docs/assets/` tree at runtime.
