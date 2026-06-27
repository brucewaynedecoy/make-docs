---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R3 P3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Hardened migration and lifecycle safety coverage for native skill exposure."
---

# W17 R3 P3 Migration and Lifecycle Safety

## Changes

Phase 3 hardened the W17 R3 native skill exposure migration and lifecycle safety coverage. The package now has explicit test evidence that clean manifest-owned W17 R2 generated stubs can migrate into native harness exposure, modified generated stubs remain review-only, clean legacy duplicated per-harness payloads migrate only with ownership and content evidence, wrong-target symlinks and modified copy mirrors are preserved by audit, and fallback-mode tests do not leak environment state into later symlink validation.

Coverage decisions:

- Developer guide: no guide update warranted for this phase because the changed behavior is already captured in executable package tests and active W17 R3 work docs; no new maintainer workflow or extension point was introduced beyond the W17 R3 implementation.
- User guide: no guide update warranted during Phase 3 because selected-skill native exposure remains unfinished until final package validation and UAT complete.
- PRD reconciliation: no PRD update warranted because Phase 3 implemented PRD 28 and supporting lifecycle/audit requirements without changing the accepted requirement surface.

Validation run:

- `npm test -w packages/cli -- --run tests/audit.test.ts tests/install.test.ts`
- `npm test -w packages/cli -- --reporter=dot`

Validation result:

- CLI test suite passed with 22 files and 344 tests.

Manual UAT remains deferred until the full W17 R3 wave is complete.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/03-migration-and-lifecycle-safety.md](../../../work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/03-migration-and-lifecycle-safety.md) | Marked Phase 3 complete and recorded migration/lifecycle validation evidence. |
| [docs/assets/archive/history/2026-06-27-w17-r3-p3-migration-and-lifecycle-safety.md](2026-06-27-w17-r3-p3-migration-and-lifecycle-safety.md) | Added this phase closeout breadcrumb. |

### Developer

None this session.

### User

None this session.
