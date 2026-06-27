# Shared Agentics Installation and Harness Redirection

## W17 R3 Supersession

[Shared Agentics Native Harness Exposure Correction](2026-06-27-shared-agentics-native-harness-exposure-correction.md) supersedes this design's generated-stub default. This design remains historical authority for the W17 R2 shared canonical payload store and lifecycle-classification concerns, but future selected-skill exposure should use native harness directories with symlink preferred and managed copy-mirror fallback.

## Purpose

Decide how make-docs v2 installs selected agentic artifacts once while exposing them to each supported harness without duplicating authoritative payloads.

This design covers the shared installed-state model for skills first, with enough plugin shape to unblock later Batch 4 plugin and playbook decisions. It chooses the cross-platform redirection mechanism, the relationship between shared payloads and harness-specific entrypoints, the manifest and audit boundary, and the way installed agentic artifacts consume configuration overlays.

## Context

This design is part of [Batch 3 - CLI, MCP, and Deterministic Automation](../assets/artifacts/v2-proposed-design-and-roadmap.md). The roadmap requires this design to decide whether shared skills and plugins are exposed by symlink, copy, generated harness stubs, CLI routing, or a platform-specific mix. It also requires explicit Windows, macOS, and Linux behavior and a config-overlay reading model for installed skills and plugins.

The lifecycle departure is intentional. The default lifecycle runs design to plan to PRD to work to implementation, but this v2 planning wave is using artifact roadmap inputs as a source-to-design straddle before returning to that default chain. This design records the departure explicitly and does not mutate PRDs, risk registers, plans, work backlogs, guides, history records, package templates, or source code.

The accepted Batch 3 designs are stronger authority than the proposal artifact where they overlap. [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md) says skills, plugins, CLI commands, and MCP tools route through canonical paths, ids, skill names, harness names, manifest keys, and operation contracts. [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md) says first-party skills may keep guidance and metadata, but deterministic make-docs-owned behavior must move behind CLI/shared-core operations. [Skill Purpose Registry and Alternate Skills Manifest](2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md) preserves the no-default-skills contract and keeps installed behavior anchored on resolved selected skill names.

Batch 1 and Batch 2 also constrain the install shape. [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md) reserves `.make-docs/agentics/` as the future shared install surface for selected skills and plugins. [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md) says skills and plugins are selected agentic assets, not immutable system assets. [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md) requires every install, reconfigure, migration, backup, and uninstall path to classify source state before writing and to preserve the single reviewed audit snapshot safety model. [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md) says config overlays are presentation inputs, not routing authority.

Current implementation installs full skill payloads per harness. `packages/cli/src/skill-catalog.ts` maps Claude Code to `.claude/skills` and Codex to `.agents/skills`, resolves selected skill assets separately for each selected harness, and uses `skillScope` to choose project root or home directory. `packages/cli/src/audit.ts` duplicates those harness roots for fallback recognition. `packages/cli/src/manifest.ts` persists `skillFiles` as the managed-output ownership list. That current model is safe enough to audit, but it duplicates selected skill content and does not answer the plugin side of [Q-012](../prd/03-open-questions-and-risk-register.md).

## Decision

Use generated harness stubs as the default cross-platform redirection mechanism. Do not rely on symlinks for v2 shared agentics.

Selected agentic payloads are installed once into a shared make-docs-owned agentics store:

- project scope: `.make-docs/agentics/`
- global scope: the user's home-scoped `.make-docs/agentics/`

Within that store, reserve separate canonical families:

- `skills/<skill-name>/` for selected skill payloads
- `plugins/<plugin-id>/` for future selected plugin payloads
- `manifests/` or equivalent metadata records for resolved purpose, source, trust, integrity, and provenance data when the manifest schema is updated

Harness directories receive generated entrypoint stubs, not duplicated authoritative payloads. For the currently supported harnesses, that means project-scoped selected skills expose harness entrypoints under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`; global selected skills expose equivalent entrypoints under the home-scoped harness roots. The stub is the harness-native discovery file and may include minimal metadata, a short purpose summary, and the exact canonical shared-payload path. The full make-docs-owned skill or plugin content lives in the shared store.

The generated stub must be useful without filesystem tricks. It must be a normal text file on Windows, macOS, and Linux. The implementation may later offer symlink mode as an explicit optimization only if the manifest records the link type, target, fallback behavior, and audit classification, but symlinks are not the v2 default and are not required for correctness. Windows behavior must not depend on developer mode, elevated privileges, junction behavior, or shell-specific link semantics.

The stub is also the harness boundary. Harness-specific names, metadata wrappers, and entrypoint filenames live in the stub layer. Shared payloads use make-docs canonical names and metadata. If a future harness requires a different discovery layout, the implementation adds a new harness adapter that generates a stub for that harness while reusing the same canonical shared payload.

CLI routing is the behavior boundary, not the file redirection mechanism. Stubs and shared payloads may instruct agents to call make-docs CLI or MCP operations for deterministic behavior, but the existence of a selected skill or plugin must not require a live CLI process just to discover the artifact. This preserves local bootstrap readability and keeps selected agentics inspectable in an installed repository.

The manifest must distinguish canonical shared payloads from harness exposure files. `selectedSkills` remains the behavior-level selected-skill list. `skillFiles` remains a managed-output ownership list for skill-related files, but the v2 schema should grow structured agentic ownership records that can identify:

- selected artifact kind, name, source manifest, version or immutable ref, digest, trust/provenance, and scope;
- canonical shared payload paths;
- generated harness stub paths;
- exposure mode, with `generated-stub` as the default;
- harness name and path scope;
- previous per-harness duplicated payloads that were migrated, preserved, or skipped.

Until that schema exists, implementation planning may represent shared payload files and harness stubs through `skillFiles`, but it must not lose the distinction in audit, backup, uninstall, migration diagnostics, or user-visible dry-run output.

Migration from the current duplicated install shape is state-classification first. A clean manifest-owned per-harness skill install may migrate to shared payload plus stubs. A modified skill file, custom user skill, malformed manifest, or missing-manifest ambiguous state must flow through the existing review, backup-and-reinstall, or manual-review disposition rules. Migration must never infer ownership over a user-authored harness skill just because its path matches a make-docs skill name.

Config overlays are read through a make-docs config resolver contract, not through plugin-specific or skill-specific routing maps. Installed skills and plugins may render configured labels in user-facing prose only after resolving canonical ids, paths, kinds, purpose ids, skill names, plugin ids, and harness names. If the config resolver is not yet implemented, generated stubs and shared payloads must preserve canonical wording rather than inventing local config parsing. Once implemented, the resolver may be exposed through CLI/shared-core and MCP, and stubs may reference it as the approved way to obtain display labels.

Plugin installation inherits the same storage and exposure primitive but not a full plugin runtime contract. Future plugin designs may define plugin bundle metadata, Run Playbook behavior, MCP tool exposure, or harness-native plugin packaging. They must still use the shared agentics store for canonical payloads and generated harness exposure files for harness discovery unless a later accepted design explicitly supersedes this decision.

No-default-skills still holds. A bare install or default sync writes no selected skill payloads and no skill stubs. Shared agentics are written only when the user explicitly selects skills or, later, explicitly selects plugins through an accepted manifest and selection flow.

## Alternatives Considered

### Symlink Shared Payloads Into Harness Roots

Rejected as the default. Symlinks match the original artifact direction, but they make Windows behavior depend on environment details and make audit, backup, uninstall, and package support harder to explain. They may be a future explicit optimization, but v2 correctness must use ordinary files and directories.

### Copy Full Payloads Per Harness

Rejected. This is close to the current behavior and keeps harness discovery simple, but it duplicates authoritative content across `.claude/skills` and `.agents/skills`, repeats the Q-012 problem for plugins, and increases drift between harness views of the same selected artifact.

### Make The CLI The Only Runtime Router

Rejected. CLI operations should own deterministic behavior, but selected skills and plugins must remain inspectable from local installed files. A CLI-only runtime router would make basic discovery depend on executable availability and would weaken the local bootstrap requirement.

### Use A Platform-Specific Mix As The Main Model

Rejected for v2. A matrix where macOS and Linux use symlinks while Windows uses copies or junctions would make support, audit, and migration behavior harder to reason about. A generated-stub model gives one portable default and leaves platform-specific optimization for later.

### Let Each Plugin Or Skill Read Config Its Own Way

Rejected. That would fork configuration semantics across agentic surfaces and risk turning display labels into structural routing. Config-overlay behavior must be resolved through the same canonical make-docs contract used by CLI and MCP.

## Consequences

The implementation change plan must update skill catalog resolution, manifest persistence, planner output, install behavior, audit recognition, backup, uninstall, migration diagnostics, interactive and noninteractive skill flows, package validation, and tests. It must also leave the current package/source-of-truth boundary intact: shipped template-owned files start in `packages/docs/template/`, `packages/cli/template/` remains generated package copy, and root dogfood is validation rather than product source of truth.

The manifest schema needs a revision before shared agentics can be treated as clean v2 state. Current schema version 1 records `selectedSkills` and `skillFiles`, but it does not encode canonical payload versus harness exposure, exposure mode, artifact kind, purpose provenance, source manifest, immutable source ref, or link/stub metadata.

Audit, backup, and uninstall become more precise but also more complex. They must classify shared payloads, generated stubs, old duplicated per-harness payloads, modified local skill files, home-scoped skill files, and custom user skills separately. The single reviewed audit snapshot rule remains mandatory before any destructive migration or uninstall.

The design references but does not mutate [Q-001, Q-007, Q-012, Q-013, D-005, R-001, R-002, R-006, and R-014](../prd/03-open-questions-and-risk-register.md). It gives Q-012 the cross-platform direction needed for planning, but PRD and risk-register status changes belong to downstream reconciliation after implementation evidence exists.

Validation for implementation should prove default installs write no selected agentic artifacts, explicit project-scope skills install one shared payload plus harness stubs, explicit global-scope skills install one home-scoped shared payload plus home-scoped harness stubs, modified or custom harness skills are preserved or reviewed, old duplicated skill installs migrate only when ownership is clear, backup and uninstall consume one reviewed audit snapshot, and Windows/macOS/Linux all work without symlink assumptions. Package validation should continue to include `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, and `npm run smoke:pack`, with targeted tests for skill catalog, install, audit, backup, uninstall, CLI, wizard, and skills UI behavior.

Batch 4 can now split plugin substrate, Run Playbook, and team-specific bundles without reopening the basic installed-state question. Those designs still need to define plugin runtime metadata and exposure boundaries, but they inherit a shared payload plus generated-stub model rather than duplicating plugin content per harness.

## Design Lineage

Update Mode: new-doc-related

Prior Design Docs:

- [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md)
- [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [Skill Purpose Registry and Alternate Skills Manifest](2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md)
- [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md)
- [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
- [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [CLI Skill Installation R2](../assets/archive/designs/2026-04-16-cli-skill-installation-r2.md)

Reason: this design extends the accepted Batch 3 CLI, no-scripts, and purpose-led skill decisions into the concrete shared installed-state model. It also uses the Batch 1 and Batch 2 tool-directory, materialization, audit, configuration, and source-of-truth contracts to replace older per-harness duplicated skill installation intent with a v2 shared-payload and generated-stub boundary.

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: this revises existing CLI skill installation, manifest, audit, backup, uninstall, package validation, and dogfood behavior while preparing for future plugin installation. It is additive change planning against the active make-docs PRD/risk namespace, not a fresh baseline.

Coordinate Handoff: unresolved; planner must resolve before writing. Prior related work includes W5 R2 CLI skill installation, W14 R1 CLI skill-selection simplification, the W17 R0 no-default-skills correction, and the Batch 3 v2 design sequence, but the downstream W/R coordinate for shared agentics installation must be assigned by the planner.
