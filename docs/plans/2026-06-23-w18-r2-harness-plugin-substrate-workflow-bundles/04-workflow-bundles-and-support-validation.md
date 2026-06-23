# Workflow Bundles and Support Validation

## Objective

Define workflow bundle metadata, playbook invocation boundaries, package validation, and support-claim evidence gates.

## Scope

- Treat Idea/Brainstorm, Scaffold, Change Request/Iterate, and Use/Run as productized workflow bundles on top of the plugin substrate.
- Require each bundle to declare audience and exposure boundary: maintainer-only, non-maintainer request-capture, non-maintainer guided-change, or end-user run-stack usage.
- Require bundle metadata to distinguish "file a request" from "make the change" where applicable.
- Allow plugins to wrap built-in workflows, generic Run Playbook, one or more playbooks, or CLI/MCP operations while preserving the underlying contracts.
- Keep playbooks valid without plugin packaging.
- Gate public support claims by implementation or conformance-lab evidence per plugin, bundle, playbook, harness, model/provider, and runtime tuple as applicable.
- Decide package inclusion or exclusion for first-party plugin payloads and manifests before shipping them.

## Dependencies

- PRD 10 for package and smoke validation.
- PRD 19 for template/package/dogfood source-of-truth order.
- PRD 20 for conformance evidence.
- PRD 29 for Run Playbook behavior.

## Acceptance Criteria

- Product bundles share substrate behavior without redefining storage, manifest, audit, backup, uninstall, config, or support-claim rules.
- Non-maintainer plugin entrypoints have explicit gates and cannot silently mutate lifecycle artifacts.
- Support wording remains provisional until evidence exists for the exact tuple claimed.
- Package validation proves whether plugin assets are included, excluded, or deliberately deferred.

## Validation Notes

Implementation should add bundle metadata fixtures and conformance scenario candidates before public language says a plugin or bundle is supported in Codex, Claude Code, CLI, MCP, unattended, or model-specific contexts.
