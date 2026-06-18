---
date: "2026-06-17"
repo: "make-docs"
coordinate: "W16 R0 P3"
status: "closed"
summary: "Added the agent-maintainer lifecycle playbook and discovery links."
---

# W16 R0 P3 Lifecycle Playbook

## Changes

Phase 03 adds the first persona-scoped lifecycle playbook under
`docs/library/playbooks/agent-maintainer/`, resolving Q-014 by creating only the
playbook subtree in W16 R0 while deferring any guide relocation to the broader
restructure.
The playbook cites the lifecycle anchor, uses neutral lifecycle vocabulary, and
frames itself as a map rather than automation.

The README and `docs/` routers now make the playbook discoverable.
The Phase 03 work checklist was marked complete after the playbook, router
updates, and Q-014 resolution satisfied the acceptance criteria.

## Documentation

### Project

- Added [make-docs-lifecycle.md](../../library/playbooks/agent/make-docs-lifecycle.md)
  with `persona: "agent-maintainer"` frontmatter and uniform per-stage
  playbook sections.
- Updated [README.md](../../../README.md) and docs routers
  [AGENTS.md](../../AGENTS.md) and [CLAUDE.md](../../CLAUDE.md) so the
  playbook is discoverable.
- Closed [Q-014](../../prd/03-open-questions-and-risk-register.md) with the
  W16 R0 decision to create only the playbook subtree now.
- Marked [Phase 03](../../work/2026-06-17-w16-r0-lifecycle-workflow-foundation/03-lifecycle-playbook.md)
  tasks complete.

### Developer

Created a developer/agent-maintainer playbook rather than a guide.
The coverage verdict is `create` for persona target `agent-maintainer` because
the phase explicitly introduces the first persona-scoped playbook output type.

### User

No user guide change was needed.
This phase targets agent and maintainer workflow execution, not end-user
product behavior.
