# Tests, Packaging, and Validation

## Purpose

Update tests and validation scripts for the new package/bin identity, then prove the migration is complete with build, test, smoke, pack, router, and stale-reference checks.

## Scope

- CLI tests under `packages/cli/tests/`.
- `scripts/smoke-pack.mjs`.
- Any test helpers, temp-directory prefixes, mocked URLs, package names, or output assertions that contain the old product name.
- Final stale-reference and tracked-path checks.
- Final package/bin verification.

## Implementation Steps

1. Update test helpers and assertions to expect `make-docs` package names, commands, output text, temp prefixes, package metadata, and registry URLs.
2. Update smoke-pack to invoke `make-docs`, inspect the packed package for only the `make-docs` bin, and assert fresh manifests record `packageName: "make-docs"`.
3. Run targeted suites for CLI routing/help, install, renderers, audit, backup, uninstall, lifecycle, wizard, and skill registry behavior.
4. Run full package validation:

   ```text
   npm run build -w make-docs
   npm test -w make-docs
   npm run validate:defaults -w make-docs
   node scripts/smoke-pack.mjs
   bash scripts/check-instruction-routers.sh
   git diff --check
   ```

5. Run exact-match stale-reference checks over tracked files:

   ```text
   git grep -n "make-docs"
   git grep -n "Make-Docs"
   git grep -n "Make Docs"
   git grep -n "make docs"
   git grep -n "MAKE_DOCS"
   git grep -n "@make-docs"
   ```

6. Run tracked-path stale-reference checks:

   ```text
   git ls-files | rg "make-docs|Make-Docs|Make Docs|make docs|MAKE_DOCS|@make-docs"
   ```

## Parallelization

Test expectation updates can begin after Phase 1 changes package/bin names. Final validation cannot begin until Phases 1, 2, and 3 are merged. The validation worker may make narrow fixes in any scope only after confirming they are stale-name or test-expectation cleanup, not new feature work.

## Dependencies and Blockers

- Blocks on package identity and lockfile regeneration.
- Blocks on template sync and docs pathname rewrites.
- Any old-name match in a tracked file or tracked pathname blocks completion.
- Generated/cache directories may be ignored only when they are not tracked.

## Acceptance Criteria

- Targeted and full validation commands pass.
- Packed package exposes only `make-docs`.
- Smoke install creates `docs/.assets/config/manifest.json` with `packageName: "make-docs"`.
- `git grep` and `git ls-files` stale-reference checks return no old-name matches.
- `git diff --check` passes.
