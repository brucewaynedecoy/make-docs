# Phase 5 — Tests and Validation

## Objective

Add focused unit, integration, smoke-pack, and manual validation coverage for the new help surfaces, shared audit ownership rules, backup naming behavior, uninstall preservation logic, and the combined `uninstall --backup` flow.

## Depends On

- [2026-04-18-cli-help-backup-and-uninstall.md](../../designs/2026-04-18-cli-help-backup-and-uninstall.md)
- Phases 1--4 of this plan must be complete before validation targets the final help, backup, and uninstall behavior.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/cli.test.ts` | Add top-level and command-specific help assertions for `backup` and `uninstall`, plus permission-mode coverage. |
| `packages/cli/tests/helpers.ts` | Add reusable temp-dir, fake-home, output-capture, and fixture helpers needed for backup/uninstall scenarios. |
| `packages/cli/tests/renderers.test.ts` | Add focused coverage for any new formatted warning/audit/help rendering helpers if they live outside `cli.test.ts`. |
| `packages/cli/tests/lifecycle.test.ts` | Create a dedicated lifecycle test file covering audit ownership, backup naming, uninstall preserve/remove rules, `uninstall --backup`, manifest-missing fallback, and `.backup/` exclusion. |
| `scripts/smoke-pack.mjs` | Extend the packed-install smoke test to exercise backup and uninstall behavior against a real installed target. |

## Detailed Changes

### 1. Expand CLI help coverage

Add tests that assert the improved help output is readable and command-scoped instead of only checking for isolated flag strings.

Required coverage:

- `starter-docs --help` lists `init`, `update`, `backup`, and `uninstall`
- top-level help includes short command descriptions and an examples section
- `starter-docs backup --help` documents `--target`, `--permissions`, and non-destructive behavior
- `starter-docs uninstall --help` documents `--target`, `--backup`, `--permissions`, and destructive behavior
- permission values `confirm|allow-all` appear in the command help where applicable

### 2. Add lifecycle tests for audit ownership and safety rules

Create `packages/cli/tests/lifecycle.test.ts` as the main safety-net for the new lifecycle engine.

Audit-rule scenarios to cover:

- manifest-backed audit includes managed files and candidate prune directories
- unmanaged files inside managed-looking directories force preservation of those directories
- exact generated-content `AGENTS.md` / `CLAUDE.md` are removable
- modified `AGENTS.md` / `CLAUDE.md` are preserved
- manifest-missing fallback only audits known starter-docs locations
- `.backup/` contents are never returned as removal candidates

These tests should validate both the ownership classification and the final execution results where practical.

### 3. Add backup naming and backup-content coverage

Cover the deterministic backup-directory rules with direct tests:

- first backup on a date uses `.backup/YYYY-MM-DD/`
- second backup on the same date renames the original to `YYYY-MM-DD-01` and creates `YYYY-MM-DD-02`
- later same-day backups continue ordinal numbering with zero-padding through `09`
- project-local files keep their relative paths under the backup root
- global/home-directory files land under the dedicated home subtree (for example `_home/...`)

Also assert that backup is non-destructive: source files remain in place after a successful backup run.

### 4. Add uninstall execution and combined-flow coverage

Add integration-style tests that install a real temp target, then exercise uninstall behavior end to end.

Required scenarios:

- plain uninstall removes audited files and prunes only now-empty directories
- uninstall preserves directories that still contain unmanaged files
- uninstall preserves modified root instruction files
- uninstall removes unmodified generated root instruction files
- `starter-docs uninstall --permissions allow-all` runs without prompts but still produces summary output
- `starter-docs uninstall --backup` creates the backup, then removes the same audited files without re-running the audit
- backup failure during `uninstall --backup` aborts uninstall

If the implementation exposes audit-call counts or a test seam, assert the single-audit contract explicitly.

### 5. Extend smoke-pack and manual verification

Update `scripts/smoke-pack.mjs` so the packed tarball validation covers the new lifecycle path instead of install alone.

Smoke-pack expectations:

1. pack and install the CLI into a temp workspace
2. run `init --yes` to create a real managed target
3. run `backup --permissions allow-all`
4. verify `.backup/<date-or-sequence>/` exists and contains starter-docs-managed files
5. run `uninstall --permissions allow-all`
6. verify managed files are removed, preserved custom files remain, and `.backup/` still exists untouched

Manual validation sequence:

1. `npm test -w starter-docs`
2. `bash scripts/check-instruction-routers.sh`
3. `bash scripts/check-wave-numbering.sh`
4. `node scripts/smoke-pack.mjs`
5. Dogfood in a temp target:
   - `npm run dev -w starter-docs -- init --yes --target /tmp/starter-docs-lifecycle`
   - create one unmanaged file inside a managed-looking directory and optionally modify `AGENTS.md` or `CLAUDE.md`
   - `npm run dev -w starter-docs -- backup --permissions allow-all --target /tmp/starter-docs-lifecycle`
   - `npm run dev -w starter-docs -- uninstall --backup --permissions allow-all --target /tmp/starter-docs-lifecycle`
   - verify preserved custom files still exist, managed files are gone, and the backup tree remains available for inspection
6. Clean up the temp target after verification

## Parallelism

- Help-output assertions in `cli.test.ts` can be implemented independently from lifecycle execution tests.
- `lifecycle.test.ts` can be developed in parallel with `smoke-pack.mjs` once the audit, backup, and uninstall interfaces are stable.
- `helpers.ts` and any renderer-specific assertions can be added in parallel as shared test infrastructure.

The final validation run should happen last, after all new automated coverage is in place.

## Acceptance Criteria

- [ ] Top-level help tests cover `init`, `update`, `backup`, and `uninstall`
- [ ] `backup --help` and `uninstall --help` assertions cover `--target`, `--permissions`, and `--backup` where applicable
- [ ] Lifecycle tests cover manifest-backed audit ownership rules
- [ ] Lifecycle tests cover manifest-missing fallback behavior conservatively
- [ ] Lifecycle tests verify `.backup/` is excluded from removal candidates
- [ ] Lifecycle tests verify exact-match generated `AGENTS.md` / `CLAUDE.md` are removable and modified versions are preserved
- [ ] Backup naming tests cover first, second, and repeated same-day backups
- [ ] Backup tests confirm backup copies files without deleting the originals
- [ ] Uninstall tests confirm leaf removal plus prune-empty-directory behavior
- [ ] Uninstall tests confirm directories containing unmanaged files are preserved
- [ ] `uninstall --backup` tests confirm one audit is reused for backup and removal
- [ ] Backup-failure handling during `uninstall --backup` is covered and aborts deletion
- [ ] `node scripts/smoke-pack.mjs` validates backup and uninstall against a packed CLI install
- [ ] `npm test -w starter-docs` passes
- [ ] `bash scripts/check-instruction-routers.sh` passes
- [ ] `bash scripts/check-wave-numbering.sh` passes
- [ ] Manual dogfood verification confirms managed files are removed, preserved files remain, and `.backup/` survives uninstall
