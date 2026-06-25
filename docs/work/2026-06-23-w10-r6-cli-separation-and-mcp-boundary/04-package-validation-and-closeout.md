# Package Validation and Closeout

## Objective

Close implementation with package, docs, and conformance evidence that respects the CLI/MCP boundary.

## Tasks

- [x] t1: Add package validation when shipped command routers, MCP setup files, or bootstrap instructions are introduced.
- [x] t2: Keep template-owned changes source-first under `packages/docs/template/`.
- [x] t3: Run package copy/prepack validation for affected template-owned files.
- [x] t4: Add conformance-lab scenarios before claiming public model/harness support for CLI/MCP behavior.
- [x] t5: Update public command docs and package README/tarball guidance only after implementation behavior exists.

## Acceptance Criteria

- Package validation covers affected CLI/MCP assets.
- Public docs do not claim unsupported Rust or MCP behavior.
- Conformance evidence exists before support claims.
- Closeout records remaining open questions for remote skills, alternate manifests, and shared plugin install.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | Ran the package validation chain because Phase 2 changed current CLI behavior and package/public CLI docs. No MCP setup files or shipped command routers were introduced in W10 R6. |
| t2 | Confirmed W10 R6 did not require template-owned source changes under `packages/docs/template/`; Phase 2 package docs and Phase 3 maintainer guide changes stayed outside the template source tree. |
| t3 | Ran `npm run smoke:pack`, which copied `packages/docs/template/` into `packages/cli/template/`, rebuilt the package, packed it, installed it into a temp project, and exercised install/sync/skills/backup/uninstall behavior. |
| t4 | Added no conformance-lab scenarios because W10 R6 did not claim shipped Rust, MCP, public model, or harness support. [CLI/MCP Operation Parity and Permissions](../../assets/library/developer/cli-mcp-operation-parity-and-permissions.md) records conformance proof as a future support gate. |
| t5 | Updated public docs only for implemented behavior: TypeScript npm CLI ownership, future Rust/MCP boundaries, selected-skill flag naming, and lifecycle `--dry-run` rejection. Public docs do not claim shipped Rust or MCP behavior. |

## Validation Evidence

- `npm test -w packages/cli -- --reporter=dot`: passed, 17 test files and 282 tests.
- `npm run validate:defaults -w packages/cli`: passed, 1 test file and 24 tests.
- `npm run build -w packages/cli`: passed.
- `npm run smoke:pack`: passed.
- Built-CLI UAT scenario: passed. `make-docs --dry-run --yes` completed, while `make-docs backup --dry-run` and `make-docs uninstall --dry-run` exited non-zero with the expected boundary error.
- Removed-command public-doc scan: passed; no `--optional-skills`, `backup --dry-run`, or `uninstall --dry-run` examples remain in README, package README, or library guides.
- Rust/MCP public-doc scan: passed; current mentions describe future/deferred surfaces or maintainer planning gates, not shipped support claims.
- `git diff --check`: passed.
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`: passed.
- Changed-file Markdown link resolver: passed for this Phase 4 work file and its history record.
- `bash scripts/check-wave-numbering.sh`: passed.
- `bash scripts/check-instruction-routers.sh`: known repo-root baseline remains (`AGENTS.md` differs from `CLAUDE.md`; `CLAUDE.md` exceeds the 12-line budget). No W10 R6 touched router files regressed.

## Closeout Decisions

- Package validation: complete for current TypeScript CLI and package docs.
- Template source-first requirement: no template-owned edits were needed for this wave.
- Conformance claims: deferred until Rust, MCP, model, or harness behavior exists and has matching parity fixtures.
- Open questions remain deferred for future waves: remote skill installation, alternate manifest support, and shared plugin installation behavior.
