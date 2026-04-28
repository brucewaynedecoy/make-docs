---
date: "2026-04-28"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W14 R0 P3"
summary: "Removed asset-selection fields from installer state and added stale-manifest recovery guidance."
---

# CLI Asset Selection Simplification - Phase 3 Model and Manifest

## Changes

Implemented W14 R0 Phase 3 from [the asset normalization and compatibility backlog](../archive/work/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md). The shared install-selection contract no longer carries prompt, template, or reference asset-mode fields. Asset planning now includes the prompt, template, and reference files required by the effective capability surface, and manifest loading rejects stale or malformed selection state with guidance to fix or remove the manifest and rerun bare `make-docs`.

| Area | Summary |
| --- | --- |
| Selection model | Removed `prompts`, `templatesMode`, and `referencesMode` from install selections, profile identity inputs, and wizard option state. |
| Asset planning | Kept capability, harness, skills, skill scope, and optional skill behavior intact while making prompt/template/reference assets managed by capability rules. |
| Manifest validation | Added explicit validation for removed asset-selection fields and malformed current selections, with recovery guidance that does not introduce a new update command. |
| Focused tests | Updated profile, install, consistency, and renderer expectations for the reduced selection contract and managed asset behavior. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/cli/src/types.ts](../../../packages/cli/src/types.ts) | Install selection types no longer include prompt, template, or reference mode fields. |
| [packages/cli/src/profile.ts](../../../packages/cli/src/profile.ts) | Profile defaults and profile identity no longer depend on removed asset-selection fields. |
| [packages/cli/src/manifest.ts](../../../packages/cli/src/manifest.ts) | Manifest validation rejects removed asset-selection fields and malformed current selection state with rebuild guidance. |
| [packages/cli/src/rules.ts](../../../packages/cli/src/rules.ts) | Asset rules include managed prompt/template/reference assets for effective capabilities. |
| [packages/cli/src/renderers.ts](../../../packages/cli/src/renderers.ts) | Renderer wording now refers to required planning prompts rather than optional prompt starters. |
| [packages/cli/tests/profile.test.ts](../../../packages/cli/tests/profile.test.ts) | Profile tests updated for reduced identity inputs and stale selection recovery. |
| [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Install tests updated for managed prompt/template/reference assets and stale manifest validation. |
| [packages/cli/tests/renderers.test.ts](../../../packages/cli/tests/renderers.test.ts) | Renderer tests updated for current prompt guidance. |
| [docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md](../archive/work/2026-04-28-w14-r0-cli-asset-selection-simplification/03-asset-normalization-and-compatibility.md) | Phase 3 backlog item implemented by selection-model, manifest, rules, and test updates. |
| [docs/assets/history/2026-04-28-w14-r0-p3-cli-asset-selection-model-and-manifest.md](2026-04-28-w14-r0-p3-cli-asset-selection-model-and-manifest.md) | History record for the completed W14 R0 Phase 3 checkpoint. |

### Developer

None this session.

### User

None this session.
