# Phase 5 — Tests and Validation

## Objective

Update the test suite and validation scripts to cover every file and renderer introduced in Phases 1–4, then run the full validation sequence to confirm the implementation is complete and correct.

## Depends On

Phase 4 (all implementation, migration, and re-seed work must be complete before tests can run against the final state).

## Test Updates

### 1. `packages/cli/tests/consistency.test.ts`

Add the two new buildable guide router paths to the `BUILDABLE_PATHS` constant:

```ts
"docs/guides/AGENTS.md",
"docs/guides/CLAUDE.md",
```

These paths have dynamic renderers (`renderGuidesRouter`) added in Phase 3. The consistency test will verify that (a) every entry in `BUILDABLE_PATHS` is recognized by `isBuildablePath()`, and (b) the default profile renders all buildable assets without error.

No other changes are needed in this file.

### 2. `packages/cli/tests/install.test.ts`

#### Full-default install test

Add assertions to the existing full-default install test verifying the presence and content of guide-related files:

1. **Always-installed reference**: `docs/.references/guide-contract.md` exists.
2. **Always-installed templates**: `docs/.templates/guide-developer.md` and `docs/.templates/guide-user.md` exist.
3. **Buildable guide routers**: `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` exist, and each file's rendered content references `guide-contract.md`.
4. **Updated docs router**: `docs/AGENTS.md` (or `docs/CLAUDE.md`) rendered content contains the updated guides routing line referencing `guide-contract.md` and the guide templates.
5. **Updated templates router**: `docs/.templates/AGENTS.md` (or `docs/.templates/CLAUDE.md`) rendered content mentions `guide-developer.md` and `guide-user.md`.

#### Reduced-profile test

Add a test case (or extend an existing reduced-profile test) that verifies guide-related files are installed even when capabilities are reduced (e.g., `--no-work --no-prd`). Guide files are not capability-gated, so they must be present in every profile:

- `docs/.references/guide-contract.md` exists.
- `docs/.templates/guide-developer.md` exists.
- `docs/.templates/guide-user.md` exists.
- `docs/guides/AGENTS.md` exists.
- `docs/guides/CLAUDE.md` exists.

### 3. No changes to `packages/cli/tests/cli.test.ts` or `packages/cli/tests/profile.test.ts`

These tests cover argument parsing and profile resolution respectively. Neither is affected by the guide structure contract additions.

## Validation Script Updates

### `scripts/check-instruction-routers.sh`

Add `docs/guides/` and `docs/guides/agent/` to the list of directories checked for `AGENTS.md` and `CLAUDE.md` presence. The script currently validates routers in directories like `docs/`, `docs/designs/`, `docs/plans/`, etc. The two new entries ensure that the guide-level and agent-guide-level instruction routers are validated on every run.

Specifically, append to the directory list:

```
docs/guides/
docs/guides/agent/
```

Both directories must contain an `AGENTS.md` and a `CLAUDE.md`. The script should verify these files exist in the template package (`packages/docs/template/`) and, if applicable, in the dogfood docs (`docs/`).

## Final Validation Run

Execute the following commands in order. Each must pass before proceeding to the next.

1. **Unit and integration tests**
   ```bash
   npm test -w starter-docs
   ```
   Expected: all tests pass, including the new/updated assertions in `consistency.test.ts` and `install.test.ts`.

2. **Instruction router check**
   ```bash
   bash scripts/check-instruction-routers.sh
   ```
   Expected: validates successfully, including the newly added `docs/guides/` and `docs/guides/agent/` directories.

3. **Smoke pack**
   ```bash
   node scripts/smoke-pack.mjs
   ```
   Expected: the full pack/install/verify cycle succeeds. The packed template includes `guide-contract.md`, both guide templates, and the updated router files. The installed output matches expectations.

4. **Manual spot-checks** (not automated, but required before marking the plan complete)
   - A fresh `npx starter-docs init --yes` into a temp directory includes `docs/.references/guide-contract.md`, `docs/.templates/guide-developer.md`, `docs/.templates/guide-user.md`, and the updated guide routers.
   - The two migrated dogfood guides have correct YAML frontmatter and slug-mirrors-path filenames.

## Acceptance Criteria

1. `BUILDABLE_PATHS` in `consistency.test.ts` includes `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md`, and the consistency test passes.
2. The full-default install test in `install.test.ts` asserts presence and content of guide-contract, guide templates, and guide routers.
3. A reduced-profile install test confirms guide files are present regardless of capability flags.
4. `scripts/check-instruction-routers.sh` validates `docs/guides/` and `docs/guides/agent/` router files.
5. `npm test -w starter-docs` passes with zero failures.
6. `bash scripts/check-instruction-routers.sh` exits 0.
7. `node scripts/smoke-pack.mjs` exits 0.
8. No unrelated test files are modified by this phase.
