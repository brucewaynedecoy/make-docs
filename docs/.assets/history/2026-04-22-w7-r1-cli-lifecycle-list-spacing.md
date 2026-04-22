---
date: "2026-04-22"
coordinate: "W7 R1"
---

# CLI Lifecycle Clack Standardization - Lifecycle List Spacing Fix

## Changes

Fixed a Wave 7 Revision 1 CLI lifecycle Clack standardization UI issue, framed by [the lifecycle Clack standardization design](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md) and the completed [Phase 4 validation history](2026-04-22-w7-r1-p4-cli-lifecycle-clack-standardization.md). This fix adds blank-line separation between grouped audit review lists in the shared lifecycle renderer so backup and uninstall review screens are easier to scan without changing labels, counts, ordering, confirmation behavior, warnings, completion summaries, or failure summaries.

| Area | Summary |
| --- | --- |
| Lifecycle renderer | [`packages/cli/src/lifecycle-ui.ts`](../../../packages/cli/src/lifecycle-ui.ts) now formats grouped audit review sections with a blank line between each list group while preserving the existing blank line between summary counts and the first detailed list. |
| Renderer tests | [`packages/cli/tests/lifecycle.test.ts`](../../../packages/cli/tests/lifecycle.test.ts) now asserts semantic Clack note-body spacing for backup and uninstall audit groups without snapshotting decorative terminal output. |
| Verification | `npm test -w make-docs -- tests/lifecycle.test.ts`, `npm test -w make-docs`, `npm run build -w make-docs`, and `git diff --check` passed after the lifecycle list spacing fix. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-22-w7-r1-cli-lifecycle-list-spacing.md](2026-04-22-w7-r1-cli-lifecycle-list-spacing.md) | Session breadcrumb for the W7 R1 lifecycle list spacing fix. |

### Developer

None this session.

### User

None this session.
