# Phase 04: Package Parity and Closeout

## Objective

Prove config behavior remains stable through template packaging, dogfood validation, and closeout.

## Inputs

- [Delta Backlog and Closeout plan](../../plans/2026-06-23-w16-r2-configuration-convention-overlay/04-delta-backlog-and-closeout.md)
- [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md)
- [Configuration and Convention Overlay design](../../designs/2026-06-20-configuration-and-convention-overlay.md)

## Tasks

- [x] t1: If a default config template is introduced, author it first under `packages/docs/template/`.
- [x] t2: Copy any template-owned config artifacts through the accepted package preparation path.
- [x] t3: Add smoke-pack or dry-run checks for config template parity.
- [x] t4: Add install/reconfigure tests proving existing project config is preserved.
- [x] t5: Add backup/audit tests classifying local config separately from make-docs-owned manifest, conflicts, provider, and cache state.
- [x] t6: Reindex docs and run touched-file Markdown link checks after docs closeout.
- [x] t7: Record a history breadcrumb only when implementation lands, not during this planning-only round.

## Acceptance Criteria

- Package validation proves default config template parity if a template exists.
- Install, reconfigure, audit, backup, and recovery behavior preserve local config.
- Docs, PRD, and work backlog links validate.
- The final implementation closeout does not claim structural config support beyond PRD 24.

## Implementation Notes

- Did not introduce a default config template. `.make-docs/config.yaml` remains optional project-owned configuration, so fresh installs and skills sync do not materialize it.
- Added audit classification for existing `.make-docs/config.yaml` as `project-config` with the `project-config-preserved` reason, separate from manifest-managed files, conflicts, provider state, and cache state.
- Added install/reconfigure tests proving existing project config is preserved without manifest file ownership or system asset ownership.
- Added audit, backup, and uninstall coverage proving local project config is preserved in place and not copied or removed as managed content.
- Extended [smoke-pack](../../../scripts/smoke-pack.mjs) to assert packed templates do not ship a default config, fresh installs do not materialize one, manifests do not track it, and uninstall preserves a user-created config.
- Updated [the CLI build config](../../../packages/cli/tsup.config.ts) so the `yaml` parser is bundled through its browser-safe ESM entry; smoke-pack caught the missing packed-runtime dependency path.

## Coverage Decisions

- PRD coverage: no PRD or risk-register change was needed. This phase implements PRD 24 package/source-first and local-config preservation requirements without changing the requirement surface.
- Developer-guide coverage: no guide change was needed. The authoritative behavior is captured in PRD 24, the phase work item, tests, and smoke-pack; a user-facing config editing workflow is still out of scope.
- User-guide coverage: no user guide was needed. No new config command or default config template was introduced.
- UAT: deferred to final W16 R2 wave closeout, per the active wave instruction.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay/04-package-parity-and-closeout.md --json`
- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/backup.test.ts tests/uninstall.test.ts --reporter=dot`
- `npm run build -w packages/cli`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for this phase work item and history entry.
