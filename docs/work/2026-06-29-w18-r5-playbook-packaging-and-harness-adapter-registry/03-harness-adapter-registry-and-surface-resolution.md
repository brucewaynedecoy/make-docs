# Phase 3: Harness Adapter Registry and Surface Resolution

## Purpose

Implement modular harness adapters and surface resolution so future harness support can be added without changing the package planner.

## Overview

This phase establishes adapter-owned harness behavior. It should include current supported harness fixtures and at least one future-harness-style fixture to prove the registry is extensible.

## Source PRD Docs

- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [28 Revise Shared Agentics Installation Harness Redirection](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)

## Stage 1 - Adapter Registry

### Tasks

- [ ] t1: Implement a harness adapter registry that loads adapter declarations by stable harness id.
- [ ] t2: Define adapter interfaces for supported output kinds, surfaces, path templates, project/global/export scope, preconditions, exposure modes, lifecycle rules, and conformance requirements.
- [ ] t3: Add current harness adapter declarations for the supported Make Docs harness set without broadening public support claims beyond available evidence.
- [ ] t4: Add a fixture-only future-harness adapter that proves new harness support can model native and agents-standard surfaces without changing package-planner code.

### Acceptance criteria

- Adapter declarations are testable without invoking CLI parsing or MCP transport.
- Adding the fixture future harness does not require package planner changes.
- Public support wording remains provisional unless evidence exists.

### Dependencies

- Phase 1 schema foundation.

## Stage 2 - Surface Resolution

### Tasks

- [ ] t5: Implement surface resolution for `native`, `agents-standard`, and `auto`.
- [ ] t6: Model project, global, and export-only scopes.
- [ ] t7: Enforce adapter preconditions such as harness support, project trust, plugin support, skill support, selected scope, symlink availability, or copy-mirror fallback.
- [ ] t8: Make unsupported or unknown preconditions route to review or manual stop before writes.

### Acceptance criteria

- `agents-standard` is treated as a surface profile, not as a harness.
- `auto` produces a ranked accepted-plan surface or a review/manual stop.
- Surface resolution is deterministic for identical inputs and reviewed configuration.
- Errors identify missing preconditions clearly enough for a user or agent to resolve them.

### Dependencies

- Stage 1 adapter registry.

## Stage 3 - Cross-Platform Exposure Rules

### Tasks

- [ ] t9: Reuse W17 R3 symlink-preferred and copy-mirror fallback behavior for package-generated harness exposures.
- [ ] t10: Ensure Windows symlink unavailability, disabled symlinks, or permission failures use managed copy mirrors rather than generic stubs.
- [ ] t11: Ensure lifecycle operations unlink symlink exposures without following targets and remove only reviewed Make Docs-owned copy mirrors.

### Acceptance criteria

- Symlink and copy-mirror decisions are visible in plan, manifest, audit, backup, uninstall, and diagnostics.
- Platform fallback never silently creates generic stubs.
- User-authored harness files are preserved or routed to review.

### Dependencies

- Stage 2 surface resolution.
