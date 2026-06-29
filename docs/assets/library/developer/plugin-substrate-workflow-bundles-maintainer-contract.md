---
title: "Plugin Substrate Workflow Bundle Maintainer Contract"
kind: "guide"
status: "draft"
path: "plugin-substrate/workflow-bundles"
persona: "developer"
tags:
  - plugin-substrate
  - workflow-bundles
  - conformance
applies-to:
  - cli
related:
  - "../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md"
  - "../../../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/04-workflow-bundles-and-support-validation.md"
  - "conformance-lab-scenario-and-result-contracts.md"
  - "playbooks-development-runner-architecture.md"
---

# Plugin Substrate Workflow Bundle Maintainer Contract

## Overview

Use this guide when adding or changing Make Docs workflow bundle metadata on top of the plugin substrate. Workflow bundles are product capability groupings, not automatic plugin IDs, and they must reuse the plugin substrate for payload storage, manifest ownership, audit, backup, uninstall, package-boundary validation, and support-claim rules.

Phase 4 of W18 R2 adds schema and validation only. It does not expose public plugin installation, make plugins default-installable, or make Playbooks depend on plugin packaging.

## Project Orientation

The current implementation lives in:

- [packages/cli/src/types.ts](../../../../packages/cli/src/types.ts) for shared workflow-bundle, package-boundary, support-claim, and conformance-candidate types.
- [packages/cli/src/plugin-substrate/workflow-bundles.ts](../../../../packages/cli/src/plugin-substrate/workflow-bundles.ts) for the first-party candidate bundle catalog.
- [packages/cli/src/plugin-substrate/validation.ts](../../../../packages/cli/src/plugin-substrate/validation.ts) for fail-closed validation.
- [packages/cli/tests/workflow-bundles.test.ts](../../../../packages/cli/tests/workflow-bundles.test.ts) for focused schema and safety coverage.

The active requirement authority is [PRD 30](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md). The implementation phase is [W18 R2 Phase 4](../../../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/04-workflow-bundles-and-support-validation.md).

## Bundle Metadata Rules

Every productized bundle must declare:

- `bundleId`, `title`, `summary`, and `family`.
- `audiences` and `exposureBoundary`.
- `mutationAuthority`, `requestCapture`, and `authorizedMutation`.
- `packageBoundary`.
- `supportClaims`.
- `conformanceScenarios`.

The first-party families are `idea-brainstorm`, `scaffold`, `change-request-iterate`, and `use-run`. Keep these families stable unless a future PRD change revises the product contract.

Request-capture entrypoints must not authorize mutation. Guided-change entrypoints must capture a request before mutation. Maintainer-only bundles must be scoped to the maintainer audience. End-user run-stack bundles must include the end-user audience.

## Run Playbook Boundary

The `use-run` bundle uses generic Run Playbook. Its metadata must keep:

- `mode: "generic-run-playbook"`
- `orchestrator: "w18-r4-run-playbook"`
- `storageContract: "docs/assets/playbooks"`
- `pluginPackagingRequired: false`

Do not duplicate Run Playbook resolver, run-state, harness-capability, nested-run, or concurrency behavior inside plugin or workflow-bundle code.

## Package Boundary Rules

Package-boundary metadata must state whether plugin payloads, plugin manifests, native exposures, and generated adapters are `included`, `excluded`, or `deferred`.

The following are always excluded from shipped package/template paths by default:

- `conformanceLabRecords`
- `generatedLocalRunArtifacts`
- `unreviewedGeneratedOutputs`

Use `decisionEvidence` to cite the PRD, plan, package plan, or validation record that justifies the boundary. Generated plugin or skills-bundle outputs do not become shipped assets until a reviewed package plan selects them and package validation proves the inclusion rule.

## Support Claims

Support claims are evidence-bound. Public wording must remain `provisional` until implementation or conformance evidence exists for the exact tuple being claimed, such as plugin, bundle, playbook, harness, runtime, model/provider, and surface.

Use `validatePluginSupportClaim` for every claim. Validated wording requires non-empty evidence references. Unsupported claims must use `wording: "unsupported"`.

## Development Workflow

1. Add or update bundle records in [workflow-bundles.ts](../../../../packages/cli/src/plugin-substrate/workflow-bundles.ts).
2. Keep metadata changes in the plugin substrate domain unless a later phase explicitly adds public CLI, MCP, plugin writer, or package writer behavior.
3. Run the validators by adding or updating focused tests in [workflow-bundles.test.ts](../../../../packages/cli/tests/workflow-bundles.test.ts).
4. If a change adds a shipped asset boundary, run the package validation chain and update the evidence references.
5. Keep user-facing wording provisional unless the exact support tuple has evidence.

## Validation

For schema-only bundle metadata changes, run:

```sh
npm test -w packages/cli -- --run tests/workflow-bundles.test.ts tests/plugin-substrate.test.ts tests/plugin-lifecycle.test.ts --reporter=dot
npm run build -w packages/cli
```

When a change affects package inclusion, shipped template behavior, or public support wording, also run:

```sh
npm test -w packages/cli -- --reporter=dot
npm run validate:defaults -w packages/cli
npm run smoke:pack
```

## Troubleshooting

If a request-capture bundle fails validation, check `authorizedMutation` first. Request-capture bundles must collect intent without mutating lifecycle artifacts.

If support wording fails validation, either keep wording provisional or add evidence for the exact supported tuple.

If package-boundary validation fails, remove conformance-lab records, generated local run artifacts, and unreviewed generated outputs from shipped-current package/template paths.

## Future Coverage

- Blocked by: W18 R2 public plugin selection and installation work, or a later W18 R5 package writer phase.
  Update when: Make Docs exposes plugin installation or generated plugin/skills-bundle package writing as user-facing behavior.
  Guide change: Add the user-visible command flow, package-plan evidence requirements, and shipped asset review checklist.
