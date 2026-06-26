# Phase 03: Rendering and Validation

## Objective

Apply configuration only at user-visible rendering points and validate generated docs against canonical metadata contracts.

## Inputs

- [Rendering and Validation Surfaces plan](../../plans/2026-06-23-w16-r2-configuration-convention-overlay/03-rendering-and-validation-surfaces.md)
- [PRD 24](../../prd/24-revise-configuration-convention-overlay.md)
- [Configuration and Convention Overlay design](../../designs/2026-06-20-configuration-and-convention-overlay.md)

## Tasks

- [x] t1: Thread config into CLI summary rendering without altering action planning.
- [x] t2: Thread config into wizard and skills UI labels after canonical selections resolve.
- [x] t3: Add generator fixtures proving configured labels appear in prose while frontmatter fields remain canonical.
- [x] t4: Add validator coverage for YAML/body drift caused by configured labels.
- [x] t5: Add persona validation for default personas, custom personas, unknown frontmatter slugs, duplicate slugs, invalid primitives, and path/frontmatter drift.
- [x] t6: Add tests proving route identifiers, prompt paths, skill names, contract names, and harness names stay canonical.

## Acceptance Criteria

- Rendering changes are visible in prose and CLI output only.
- Generated docs keep canonical YAML metadata.
- Validators catch config-driven conflicts without treating configured labels as schema names.
- Persona frontmatter uses slugs, not display labels.

## Implementation Notes

- Added config rendering helpers in [the config loader](../../../packages/cli/src/config.ts) for lifecycle, document-kind, coordinate, and persona display labels.
- Threaded presentation-only config through [CLI plan rendering](../../../packages/cli/src/cli.ts), [wizard review/checklist rendering](../../../packages/cli/src/wizard.ts), and [skills UI plan summaries](../../../packages/cli/src/skills-ui.ts) after canonical selections resolve.
- Loaded project config in [the skills command](../../../packages/cli/src/skills-command.ts) before interactive and non-interactive summaries render.
- Extended [generated document metadata validation](../../../packages/cli/src/document-metadata.ts) so body `Document kind`, `Kind`, and `Persona` labels are checked against canonical YAML frontmatter and configured labels without accepting display labels as identifiers.
- Extended [persona validation support](../../../packages/skills/closeout-phase/scripts/guide_coverage_probe.py) to accept custom persona entries and validate unknown slugs, invalid primitives, duplicate slugs, and path/frontmatter drift.
- Kept route identifiers, prompt paths, skill names, contract names, harness names, canonical YAML values, and install planning inputs independent from configured display labels.

## Coverage Decisions

- PRD coverage: no PRD or risk-register change was needed. This phase implements PRD 24 rendering and validation requirements without changing the accepted requirement surface.
- Developer-guide coverage: no guide change was needed. Configuration usage guidance should wait until package parity and closeout decide the shipped config template and preservation behavior.
- User-guide coverage: no user guide was needed. The phase exposes labels through CLI/UI summaries but does not introduce a complete user-facing configuration editing workflow.
- UAT: deferred until the full W16 R2 wave is complete, per the active wave instruction.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay/03-rendering-and-validation.md --json`
- `npm test -w packages/cli -- --run tests/config.test.ts tests/document-metadata.test.ts tests/wizard.test.ts tests/skills-ui.test.ts tests/cli.test.ts --reporter=dot`
- `python3 -B packages/skills/closeout-phase/scripts/test_closeout_helpers.py`
- `npm run build -w packages/cli`
- `npm test -w packages/cli -- --reporter=dot`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for this phase work item and history entry.
