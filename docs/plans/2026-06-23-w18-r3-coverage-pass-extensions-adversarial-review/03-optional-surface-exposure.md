# Optional Surface Exposure

## Objective

Define how adversarial review may later be exposed without making any exposure mandatory.

## Scope

- Keep adversarial review out of default lifecycle gates.
- Keep adversarial review out of bare install, default sync, generic Run Playbook, and plugin selection unless explicitly selected later.
- If a starter prompt is selected, place it through the template-first prompt source-of-truth flow and register it in `PROMPT_RULES` only after parity is planned.
- If a playbook is selected, follow the v2 playbook contract from PRD 29.
- If a plugin or workflow bundle is selected, inherit the plugin substrate from PRD 30 and preserve explicit plugin selection.
- If a CLI or MCP surface is selected, delegate deterministic behavior through accepted CLI/shared-core operation contracts and keep MCP writes gated by a later permission plan.
- If a conformance scenario is selected, use PRD 20 records before public support claims.

## Dependencies

- PRD 19 for template/package/dogfood source-of-truth order.
- PRD 20 for conformance evidence.
- PRD 25 for CLI/MCP operation contracts.
- PRD 29 for playbook behavior.
- PRD 30 for plugin substrate.

## Acceptance Criteria

- No implementation surface is implied by PRD 31 alone.
- A future selected surface has a clear owning PRD and package/source-of-truth path.
- Public support wording remains provisional until evidence exists.

## Validation Notes

Implementation should prove prompt registration, playbook metadata, plugin substrate, CLI/MCP parity, and conformance evidence only for surfaces actually selected by the downstream work.
