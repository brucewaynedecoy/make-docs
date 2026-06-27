# P1 Requirements and Register Reconciliation

## Tasks

- [x] Confirm PRD 28 is linked from the PRD index and affected baseline docs.
- [x] Confirm Q-012 records generated stubs as the cross-platform direction without closing shared install until implementation evidence lands.
- [x] Confirm Q-013 remains open for plugin flow and public exposure.
- [x] Confirm Q-001 and D-005 remain open for delivery model decisions.
- [x] Confirm R-001, R-002, R-006, R-008, and R-014 mention shared payload and stub implications where relevant.

## Acceptance Criteria

- PRD 28 owns shared payload plus generated-stub installation.
- No affected PRD requires symlinks.
- No affected PRD allows default skill or plugin installation.

## Validation Notes

Run touched Markdown link checks and unfinished-token scans after reconciliation.

## Implementation Notes

- Confirmed PRD 28 is present in `docs/prd/00-index.md` and linked from the affected baseline/change docs for manifest lifecycle, CLI lifecycle, skills catalog, packaging validation, selected-skill simplification, package boundaries, compatibility migration, tool-directory tiers, configuration overlay, CLI/MCP boundaries, no-scripts refactor, purpose manifests, and plugin substrate planning.
- Confirmed Q-012 names generated text stubs over symlinks as the W17 R2 cross-platform selected-agentics direction while remaining open until implementation evidence lands.
- Confirmed Q-013 remains open for plugin flow and public exposure boundaries.
- Confirmed Q-001 and D-005 remain open because W17 R2 chooses shared placement and generated exposure but does not choose remote-fetch, bundled-local, or dual-mode skills delivery.
- Confirmed R-001, R-002, R-006, R-008, and R-014 already mention shared payload, generated stub, home-scope, audit/removal, operation-boundary, or transition-window implications where relevant.

## Coverage Decisions

- PRD coverage outcome: `none`; the active PRD namespace already had the required W17 R2 references and open risk/register states, so no requirement edits were needed in Phase 1.
- Developer-guide outcome: `none`; this phase confirmed existing requirements and did not create new maintainer-facing behavior beyond the W17 R2 backlog itself.
- User-guide outcome: `none`; this phase did not change user-facing CLI behavior.
- UAT: deferred until the full W17 R2 wave is complete, per the wave instruction.

## Validation Evidence

- Touched-file Markdown link check for the Phase 1 work file and history record.
- Unfinished-token scan for the Phase 1 work file and history record.
- `git diff --check`
