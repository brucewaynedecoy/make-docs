---
date: "2026-06-17"
repo: "make-docs"
coordinate: "W16 R0 P5"
status: "closed"
summary: "Sanctioned docs/artifacts as the optional zero-contract input surface."
---

# W16 R0 P5 Artifacts Seed Directory

## Changes

Phase 05 sanctions `docs/artifacts/` as the optional zero-contract input surface
for source material that can hydrate design and planning.
The lifecycle anchor and planning workflow now tell agents to read artifacts
when present without treating the directory as a required stage, and the
artifacts router now states its managed/template asset purpose explicitly.

The Phase 05 work checklist was marked complete after the lifecycle,
planning-workflow, and artifacts-router surfaces all described the optional
input behavior.

## Documentation

### Project

- Updated [lifecycle.md](../../../../.make-docs/references/system/lifecycle.md) and
  [planning-workflow.md](../../../../.make-docs/references/system/planning-workflow.md) to cite
  `docs/artifacts/` as optional input context.
- Updated artifacts routers [AGENTS.md](../../artifacts/AGENTS.md) and
  [CLAUDE.md](../../artifacts/CLAUDE.md) to state the managed/template asset and
  zero-contract purpose.
- Marked [Phase 05](../work/2026-06-17-w16-r0-lifecycle-workflow-foundation/05-artifacts-seed.md)
  tasks complete.

### Developer

No developer guide or playbook change was needed.
The existing lifecycle playbook already treats artifacts as optional inputs, and
this phase only tightens the router and planning contract language.

### User

No user guide change was needed.
This phase changes internal documentation workflow inputs, not product behavior.
