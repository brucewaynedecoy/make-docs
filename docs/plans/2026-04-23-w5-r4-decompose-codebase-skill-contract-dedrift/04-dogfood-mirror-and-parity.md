# Phase 4 - Dogfood Mirror and Parity

## Objective

Refresh `.agents/skills/decompose-codebase/` from the packaged `decompose-codebase` source and add an automated mapped-file parity guardrail so future drift between the shipped skill and the dogfood mirror fails fast.

## Depends On

- Phase 1 contract updates
- Phase 2 template retention/removal decisions
- Phase 3 validator and shipped-asset surface updates
- Existing repo consistency-test pattern in `packages/cli/tests/consistency.test.ts`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `.agents/skills/decompose-codebase/SKILL.md` | Refresh from the packaged skill source. |
| `.agents/skills/decompose-codebase/agents/openai.yaml` | Refresh from the packaged skill source if the packaged copy changed. |
| `.agents/skills/decompose-codebase/references/*.md` | Refresh the mirrored contract/reference files from the packaged source. |
| `.agents/skills/decompose-codebase/assets/templates/*` | Refresh the mirrored template files and remove any template retired from the packaged source. |
| `.agents/skills/decompose-codebase/scripts/*.py` | Refresh the mirrored runtime scripts from the packaged source. |
| `packages/cli/tests/consistency.test.ts` or a new consistency test file | Add a mapped-file parity assertion for `packages/skills/decompose-codebase/` vs `.agents/skills/decompose-codebase/`. |

## Detailed Changes

### 1. Define the mirrored file set explicitly

Parity should be enforced over a mapped file set, not via a naive full-tree compare. The mirrored set should include the files the dogfood copy is expected to carry:

- `SKILL.md`
- `agents/openai.yaml`
- `references/*.md`
- retained `assets/templates/*.md`
- `scripts/probe_environment.py`
- `scripts/validate_output.py`

The parity mechanism should intentionally exclude package-only files that the mirror does not need:

- `assets/README.md`
- `scripts/test_validate_output.py`
- `scripts/__pycache__/`

### 2. Refresh the mirror from the packaged source

After the packaged files settle in Phases 1 through 3:

- copy or reseed the mapped files into `.agents/skills/decompose-codebase/`
- remove mirror-only stale files when the packaged source retires them
- keep the mirrored file list exact to the declared mapped set

### 3. Add an automated parity check

Add a consistency test that:

- enumerates the mapped file set in `packages/skills/decompose-codebase/`
- asserts the same files exist in `.agents/skills/decompose-codebase/`
- asserts byte equality for each mapped file
- fails if a retired file still exists only in the mirror

Prefer adding this to the existing `packages/cli/tests/consistency.test.ts` surface unless a new dedicated consistency test file is materially clearer.

### 4. Keep parity enforcement package-driven

The parity check should treat `packages/skills/decompose-codebase/` as the source and `.agents/skills/decompose-codebase/` as the mirror. Do not allow independent edits to the mirror to become the accepted state.

## Acceptance Criteria

- [ ] The mirrored file set is explicitly defined and excludes only intentional package-only files.
- [ ] `.agents/skills/decompose-codebase/` contains the refreshed mapped files and no stale retired mirror-only files.
- [ ] The parity test fails on missing, extra, or content-divergent mapped files.
- [ ] The parity test treats `packages/skills/decompose-codebase/` as authoritative and `.agents/skills/decompose-codebase/` as the mirror.
