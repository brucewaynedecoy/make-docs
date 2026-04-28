# Phase 3 - Validator, Registry, and Install Surface

## Objective

Align the `decompose-codebase` validator, shipped asset declarations, and install/test surface to the new v2 contract so the distributed skill enforces the same archive and work model that its documentation now describes.

## Depends On

- Phase 1 contract decisions
- Phase 2 template retention/removal decisions
- Existing validator coverage from Wave 6
- Existing decompose skill install coverage in `packages/cli/tests/skill-catalog.test.ts` and `packages/cli/tests/install.test.ts`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/skills/decompose-codebase/scripts/validate_output.py` | Replace the legacy archive and backlog path rules with v2 archive/work-directory validation rules. |
| `packages/skills/decompose-codebase/scripts/test_validate_output.py` | Add fixtures/assertions for v2 work directories, `docs/assets/archive/prds/...`, and legacy-path rejection. |
| `packages/cli/skill-registry.json` | Remove the obsolete `assets/templates/rebuild-backlog.md` asset declaration and keep the decompose asset list aligned to the retained packaged files. |
| `packages/cli/tests/skill-catalog.test.ts` | Refresh the expected decompose optional-skill asset surface. |
| `packages/cli/tests/skill-registry.test.ts` | Add or update assertions that the declared decompose asset set matches the intended packaged surface. |
| `packages/cli/tests/install.test.ts` | Add or update optional-skill install assertions so installed decompose skill directories contain the current retained assets and omit retired ones. |

## Detailed Changes

### 1. Update validator path rules to the v2 work/archive model

`validate_output.py` should validate the actual decomposition output contract now in force:

- archived PRD sets under `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/`
- work backlog directories named `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`
- backlog entry point `00-index.md` and phase files `0N-<phase>.md`

The validator should stop encoding `docs/prd/archive/...` and `YYYY-MM-DD-rebuild-backlog.md` as current behavior.

### 2. Expand validator tests for v2 acceptance and legacy rejection

Extend `test_validate_output.py` to cover:

- a valid v2 backlog directory fixture with `00-index.md` and at least one phase file
- the new archive namespace under `docs/assets/archive/prds/...`
- rejection or failure on stale legacy single-file backlog/archive assumptions where the new contract should no longer accept them

Keep the Wave 6 false-positive link regression coverage intact.

### 3. Update the shipped asset declarations

After Phase 2 removes `assets/templates/rebuild-backlog.md`, update `packages/cli/skill-registry.json` so the installed optional skill surface matches the retained packaged files exactly.

Do not add `assets/README.md` or `scripts/test_validate_output.py` to the registry unless implementation discovers the installed skill truly needs them at runtime. The current expectation is:

- human-facing runtime assets stay installed only when the skill actually uses them
- source-only README/test files remain package-source-only

### 4. Refresh install-surface tests

Strengthen the decompose optional-skill tests to prove both presence and absence:

- required retained files install under `.claude/skills/decompose-codebase/` and `.agents/skills/decompose-codebase/`
- retired files such as `assets/templates/rebuild-backlog.md` do not install
- existing optional-skill selection behavior stays unchanged

### 5. Keep registry and tests aligned with the package source

This phase owns the rule that the declared install surface should be a projection of `packages/skills/decompose-codebase/`, not an independently evolving list. If implementation changes the retained packaged files, update the registry and install tests in the same change.

## Acceptance Criteria

- [ ] `validate_output.py` validates the v2 archive/work-directory model instead of the legacy one-file backlog contract.
- [ ] `test_validate_output.py` covers both v2 acceptance and legacy rejection without regressing the Wave 6 false-positive link fix.
- [ ] `packages/cli/skill-registry.json` no longer declares `assets/templates/rebuild-backlog.md`.
- [ ] Install/test coverage proves the optional decompose skill installs the retained local files and omits the retired backlog template.
- [ ] Registry, package source, and install tests agree on the intended decompose skill file surface.
