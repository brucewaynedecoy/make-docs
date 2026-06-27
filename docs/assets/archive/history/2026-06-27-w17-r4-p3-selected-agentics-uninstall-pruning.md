---
client: "Codex Desktop"
date: "2026-06-27"
coordinate: "W17 R4 P3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Hardened selected-agentics pruning for project and home-scoped skill removal."
---

# W17 R4 P3 Selected-Agentics Uninstall Pruning

## Changes

Phase 3 hardened selected-agentics cleanup so package lifecycle behavior prunes empty managed `.make-docs/agentics/**` parents without deleting user or ambiguous content: skills-only removal now prunes absolute home-scoped canonical payload parents, manifest-owned exposure symlinks are removed by symlink target metadata instead of descendant traversal, copy-mirror checks normalize absolute home paths, and audit/uninstall tests prove project/global selected-skill cleanup preserves sibling payloads and unmanaged descendants.

- Updated skills-only removal pruning so absolute home-scoped `.make-docs/agentics/**` paths prune up to their owning `.make-docs` directory.
- Updated stale native exposure planning so manifest-owned symlinks are removed when they point at the recorded canonical payload.
- Normalized absolute selected-agentics descendant checks for home-scope copy mirrors and legacy clean-exposure detection.
- Added regression tests for project sibling preservation, global selected-agentics parent pruning, audit prunable parent reporting, unmanaged descendant preservation, and uninstall pruning.
- Confirmed no user-facing output changes were required for Phase 3.

Validation run:

- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/uninstall.test.ts --reporter=dot --silent`
- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/uninstall.test.ts tests/lifecycle.test.ts --reporter=dot --silent`
- `git diff --check`
- Focused Markdown link check for the Phase 3 work file and this history record.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/03-selected-agentics-uninstall-pruning.md](../../../work/2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning/03-selected-agentics-uninstall-pruning.md) | Marked Phase 3 complete and recorded selected-agentics pruning validation evidence. |
| [docs/assets/archive/history/2026-06-27-w17-r4-p3-selected-agentics-uninstall-pruning.md](2026-06-27-w17-r4-p3-selected-agentics-uninstall-pruning.md) | Added this phase closeout breadcrumb. |

### Developer

None this session.

### User

None this session.
