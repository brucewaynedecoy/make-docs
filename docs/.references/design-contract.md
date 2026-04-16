# Design Contract

## Purpose

Use this contract for agent-generated design docs under `docs/designs/`.

User-authored design docs may not fully conform. Apply this contract to newly generated design docs and to substantial agent-authored updates.

## Required Path

- `docs/designs/YYYY-MM-DD-<slug>.md`

`YYYY-MM-DD` is today's date (never backdated). `<slug>` is lowercase, hyphens only.

## Archiving

Archive designs only when the user explicitly asks. Never archive proactively.

Defer to `docs/.archive/AGENTS.md` for archive structure and procedure.

## Required Headings

Generated design docs must include:

- `## Purpose`
- `## Context`
- `## Decision`
- `## Alternatives Considered`
- `## Consequences`
- `## Intended Follow-On`

## Intended Follow-On Contract

The `## Intended Follow-On` section must include:

- `Route:` `baseline-plan` or `change-plan`
- `Next Prompt:` a relative Markdown link to the matching prompt template
- `Why:` a short explanation of why that route is the correct downstream workflow

Required prompt targets:

- `baseline-plan` → `[designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)`
- `change-plan` → `[designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)`

## Optional Design Lineage

Add `## Design Lineage` when a generated design materially updates prior design intent or when a new design doc is closely related to an earlier design.

When present, include:

- `Update Mode:` `updated-existing` or `new-doc-related`
- `Prior Design Docs:` relative Markdown links
- `Reason:` a short explanation of the lineage relationship

## Link Rules

- Use relative Markdown links between design docs and related plans, PRD docs, or work items.
- If a design is intended to feed planning, the `Next Prompt` link in `## Intended Follow-On` must resolve.
