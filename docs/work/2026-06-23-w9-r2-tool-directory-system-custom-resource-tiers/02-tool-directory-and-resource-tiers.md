# Tool Directory and Resource Tiers

## Purpose

Implement the `.make-docs/` logical directory model and ownership tiers.

## Source PRD Docs

- `docs/prd/21-project-tool-directory-and-resource-tiers.md`

## Stage 1 - Directory Model

### Tasks

- [x] t1: Define `.make-docs/` runtime state surfaces and tool resource families.
- [x] t2: Define `system/` and `custom/` ownership semantics for each resource family.
- [x] t3: Protect custom resources from install, reconfigure, provider refresh, or cache rehydration overwrites.
- [x] t4: Reserve `agentics/skills` and `agentics/plugins` without deciding shared delivery.

### Acceptance Criteria

- Runtime state and tool resources are distinct.
- System resources are conflict-managed or provider-proven.
- Custom resources are project-owned by default.

### Dependencies

- Phase 1 trace and scope.

### Implementation Notes

Phase 2 adds `packages/cli/src/tool-directory.ts` as the code-level logical directory model. Existing manifest exports in `packages/cli/src/manifest.ts` still expose `MAKE_DOCS_STATE_RELATIVE_DIR`, `MANIFEST_RELATIVE_PATH`, and `CONFLICTS_RELATIVE_DIR`, but those values now derive from the shared tool-directory contract so later phases can extend the model without duplicating path strings. `packages/cli/tests/tool-directory.test.ts` locks the model before migration work starts.

| Model surface | Implementation |
| --- | --- |
| Runtime state | `TOOL_DIRECTORY_RUNTIME_STATE_PATHS` identifies `.make-docs/manifest.json`, `.make-docs/conflicts`, and `.make-docs/runs` as runtime state. `.make-docs/config.yaml` is exposed separately as project-owned configuration, not runtime state. |
| Tool resource families | `contracts`, `references`, `templates`, `prompts`, and `scripts` are enumerated as `TOOL_RESOURCE_FAMILIES`. |
| Ownership tiers | Each tool resource family has `system` and `custom` tier helpers. `isToolDirectorySystemResourcePath` and `isToolDirectoryCustomResourcePath` distinguish make-docs-owned resources from project-owned overlays. |
| Custom overwrite protection | Custom resources are detectable as project-owned paths under `.make-docs/<family>/custom/**`; migration and provider-refresh phases must treat those paths as non-overwrite surfaces unless a later user-approved replacement flow exists. |
| Agentics reservation | `.make-docs/agentics/skills` and `.make-docs/agentics/plugins` are reserved by helper functions but intentionally do not classify as system or custom tier resources. |

This phase does not move existing `docs/assets/{prompts,references,templates}/` resources. That migration remains scoped to Phase 3.
