# Delta Backlog and Closeout

## Work Backlog Shape

Generate the paired work backlog under:

`docs/work/2026-06-23-w16-r2-configuration-convention-overlay/`

The backlog should split implementation into:

1. Requirements and register reconciliation.
2. Config schema, defaults, loader, and diagnostics.
3. Rendering, persona, and generated-doc validation.
4. Package parity, dogfood preservation, and closeout.

## Acceptance Criteria

- PRD 24 exists and is linked from the active PRD index.
- Affected PRDs record the presentation-only configuration boundary.
- Risk register entries capture the partially closed Q-011 decision and remaining implementation risks.
- The work backlog references PRD 24 and the affected baseline PRDs.
- Validation commands pass before local commit.

## Commit Plan

Use the repository commit convention for a plan commit:

```text
plan: [W16 R2] Configuration Convention Overlay

Define the v2 configuration overlay boundary for make-docs. The configuration file gives a project room to adapt user-visible vocabulary, persona labels, and generated text conventions without turning the canonical information architecture into a project-specific schema.
```
