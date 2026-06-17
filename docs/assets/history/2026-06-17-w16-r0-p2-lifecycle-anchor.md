---
date: "2026-06-17"
repo: "make-docs"
coordinate: "W16 R0 P2"
status: "closed"
summary: "Added the lifecycle anchor and router pointers for default workflow orientation."
---

# W16 R0 P2 Lifecycle Anchor

## Changes

Phase 02 adds the lifecycle anchor that describes the documentation workflow arc
as optional inputs, planning, build, and release-and-beyond bands.
The anchor states the default derive-from-backlog ordering, defines
release / publish in domain-neutral terms, and records the straddle rule for
explicit skip, reorder, or revisit decisions.

The root, `docs/`, and references routers now point to
`docs/assets/references/lifecycle.md` without duplicating the policy text.
The Phase 02 work checklist was marked complete after the anchor and router
links satisfied the acceptance criteria.

## Documentation

### Project

- Updated [lifecycle.md](../references/lifecycle.md) with the lifecycle arc,
  default ordering, derive-from-backlog principle, straddle behavior, neutral
  release / publish vocabulary, and router-use guidance.
- Updated root routers
  [AGENTS.md](../../../AGENTS.md) and [CLAUDE.md](../../../CLAUDE.md) with the
  always-read lifecycle pointer.
- Updated docs routers [AGENTS.md](../../AGENTS.md) and
  [CLAUDE.md](../../CLAUDE.md) with the lifecycle pointer.
- Updated references routers [AGENTS.md](../references/AGENTS.md) and
  [CLAUDE.md](../references/CLAUDE.md) with the reference-specific lifecycle
  pointer.
- Marked [Phase 02](../../work/2026-06-17-w16-r0-lifecycle-workflow-foundation/02-lifecycle-anchor.md)
  tasks complete.

### Developer

No developer guide change was needed.
This phase adds a shared workflow anchor and router pointers rather than
developer-facing command or API usage.

### User

No user guide change was needed.
This phase affects contributor workflow orientation and does not add a
user-facing product behavior.
