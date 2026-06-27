# P4 Package Validation and Closeout

## Tasks

- [x] Add package and smoke-pack validation for shared payloads and generated stubs.
- [x] Prove bare default install writes no selected agentic artifacts.
- [x] Prove selected project-scope and global-scope skills install correctly.
- [x] Prove modified or custom harness skills are preserved or reviewed.
- [x] Update closeout records, PRDs, and risk entries only with implementation evidence.

## Acceptance Criteria

- `npm run smoke:pack` or equivalent package validation exercises shared agentics when shipped behavior changes.
- Cross-platform assumptions are documented and do not require symlink privileges.
- R-001, R-002, R-006, and Q-012 have implementation evidence before closure.

## Validation Notes

Completed validation:

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- changed-file Markdown link check
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`

Closeout evidence:

- Default install validation remains covered by `validate:defaults`, proving the default managed tree does not create selected-agentic payloads or generated harness stubs until a selection exists.
- Full CLI tests cover project-scope and global-scope selected skills, generated harness stubs, clean duplicated-payload migration, modified/custom preservation, audit metadata, backup, uninstall, lifecycle, and skills UI behavior.
- `smoke:pack` exercises the packed CLI path and validates the shared selected-agentics model without symlinks or per-harness duplicated authoritative payloads.
- R-001, R-002, R-006, and Q-012 were updated with implementation evidence, but they remain open where they still cover broader plugin, config, MCP, richer manifest-schema, or full lifecycle-rebuild concerns.
- `bash scripts/check-instruction-routers.sh` still reports the pre-existing root-router baseline: `./AGENTS.md` and `./CLAUDE.md` differ, and `./CLAUDE.md` exceeds the 12-line budget. The root router files were not changed in W17 R2 P4.
