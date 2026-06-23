# Tool Directory and Resource Tiers

## Purpose

Define the logical `.make-docs/` layout and resource ownership tiers.

## Requirements

- `.make-docs/` is the in-project tool directory for make-docs-owned tool resources and runtime state.
- `docs/` remains the project documentation tree.
- Runtime state includes `manifest.json`, `conflicts/`, provider/cache metadata, audit state, and temporary run state.
- Tool resource families are `contracts/`, `references/`, `templates/`, `prompts/`, and `scripts/`.
- Each family has `system/` and `custom/` tiers.
- `system/` resources are make-docs-owned and immutable from the project perspective.
- `custom/` resources are project-owned and must not be overwritten by install, reconfigure, provider refresh, or cache rehydration without explicit user-approved replacement.
- `agentics/skills` and `agentics/plugins` are reserved for future shared skill/plugin installation decisions.

## Acceptance Criteria

- The plan separates runtime state from readable documentation assets.
- Custom resources are protected from silent upstream replacement.
- Skills and plugins remain deferred to later shared-agentics decisions.
