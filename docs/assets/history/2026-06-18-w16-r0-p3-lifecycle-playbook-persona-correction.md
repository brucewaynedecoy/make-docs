---
date: "2026-06-18"
coordinate: "W16 R0 P3"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Corrected the lifecycle playbook persona from the invalid hybrid agent-maintainer to the agent primitive."
---

# Lifecycle Playbook Persona Correction

## Changes

The W16 R0 lifecycle playbook was created under a hybrid `agent-maintainer`
persona — both the directory `docs/library/playbooks/agent-maintainer/` and the
`persona:` frontmatter. Personas always map to exactly one primitive (agent,
maintainer, or user), and persona-scoped docs and directories are never shared
across personas, so the hybrid was invalid.

The authoritative persona model did not cause this: the coverage-pass contract
and the evolution-direction notes both map each persona to one primitive. The
hybrid came from the W16 phase-03 plan and work docs, which described the
playbook as written "for the agent/maintainer persona." This session corrected
the playbook to the `agent` primitive — the lifecycle playbook is a procedural
execution map, which is the agent primitive's domain — and removed the hybrid
phrasing from the steering docs.

Changes:

- Renamed `docs/library/playbooks/agent-maintainer/` to
  `docs/library/playbooks/agent/` and set the playbook `persona:` to `agent`.
- Removed the "agent/maintainer persona" phrasing from the W16 plan and work
  phase-03 docs.
- Fixed the stale playbook links in the README and the Phase 03 history record.

Prior history records keep their original `agent-maintainer` wording as
point-in-time breadcrumbs; only their links were repaired.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/library/playbooks/agent/make-docs-lifecycle.md](../../library/playbooks/agent/make-docs-lifecycle.md) | Renamed to the `agent` persona; `persona:` frontmatter and prose corrected. |
| [docs/assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/03-lifecycle-playbook.md](../archive/plans/2026-05-28-w16-r0-coverage-pass-contract/03-lifecycle-playbook.md) | Removed the hybrid "agent/maintainer persona" phrasing. |
| [docs/assets/archive/work/2026-06-17-w16-r0-lifecycle-workflow-foundation/03-lifecycle-playbook.md](../archive/work/2026-06-17-w16-r0-lifecycle-workflow-foundation/03-lifecycle-playbook.md) | Removed the hybrid "agent/maintainer persona" phrasing. |
| [README.md](../../../README.md) | Updated the lifecycle-playbook link and persona reference. |

### Developer

None this session.

### User

None this session.
