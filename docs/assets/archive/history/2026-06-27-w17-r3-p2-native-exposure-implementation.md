---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R3 P2"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Implemented native harness exposure for selected Make Docs skills."
---

# W17 R3 P2 Native Exposure Implementation

## Changes

Phase 2 replaced selected-skill generated harness stubs with native harness skill directory exposure. Selected skills still install one canonical Make Docs-managed payload under `.make-docs/agentics/skills/<skill-name>/`, while enabled harness roots now receive `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/` exposure records that prefer symlinks and fall back to managed copy mirrors when symlinks are unavailable or disabled.

- Added exposure metadata for harness, scope, canonical payload path, exposure path, symlink target, copy-mirror source, mode, and fallback reason.
- Updated installer planning and apply behavior to create native skill directory exposures instead of generated forwarding `SKILL.md` stubs.
- Updated audit, backup, uninstall, sync, CLI output, and skills UI classification so shared payloads, native exposures, copy mirrors, legacy duplicated payloads, and generated stubs remain distinct roles.
- Added deterministic migration for clean manifest-owned W17 R2 generated stubs into native exposure.
- Preserved modified generated stubs and ambiguous harness skill directories for review instead of overwriting them.
- Updated package smoke expectations so packed validation no longer treats generic generated stubs as the desired product behavior.

Validation run:

- `npm test -w packages/cli -- --run tests/install.test.ts`
- `npm test -w packages/cli -- --reporter=dot`

Validation result:

- CLI test suite passed with 22 files and 342 tests.

Manual UAT remains deferred until the full W17 R3 wave is complete.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/02-native-exposure-implementation.md](../../../work/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/02-native-exposure-implementation.md) | Marked Phase 2 complete and recorded package validation evidence. |
| [docs/assets/archive/history/2026-06-27-w17-r3-p2-native-exposure-implementation.md](2026-06-27-w17-r3-p2-native-exposure-implementation.md) | Added this phase closeout breadcrumb. |

### Developer

None this session.

### User

None this session.
