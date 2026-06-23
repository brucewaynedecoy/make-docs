# Tool Directory and Resource Tiers

## Purpose

Implement the `.make-docs/` logical directory model and ownership tiers.

## Source PRD Docs

- `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`

## Stage 1 - Directory Model

### Tasks

- [ ] t1: Define `.make-docs/` runtime state surfaces and tool resource families.
- [ ] t2: Define `system/` and `custom/` ownership semantics for each resource family.
- [ ] t3: Protect custom resources from install, reconfigure, provider refresh, or cache rehydration overwrites.
- [ ] t4: Reserve `agentics/skills` and `agentics/plugins` without deciding shared delivery.

### Acceptance Criteria

- Runtime state and tool resources are distinct.
- System resources are conflict-managed or provider-proven.
- Custom resources are project-owned by default.

### Dependencies

- Phase 1 trace and scope.
