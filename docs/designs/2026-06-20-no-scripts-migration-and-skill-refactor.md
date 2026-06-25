# No-Scripts Migration and Skill Refactor

## Purpose

Decide how make-docs v2 removes standalone deterministic script dependencies from shipped system resources and first-party skills without breaking installed workflows. The migration target is a CLI/shared-core operation boundary that ordinary CLI commands and future MCP tools can expose consistently, while skills become guidance and routing layers instead of carrying make-docs-owned deterministic logic.

## Context

This design is part of [Batch 3 - CLI, MCP, and Deterministic Automation](../assets/artifacts/v2-proposed-design-and-roadmap.md). The roadmap places it immediately after [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md), which is stronger authority than the proposal artifact for this batch. That prior design keeps `npx @brucewaynedecoy/make-docs` installer-first, treats TypeScript as the current source of truth until a validated Rust parity plan exists, assigns the long-term agent automation and MCP runtime to Rust, and requires MCP tools to delegate to the same deterministic operation contracts as ordinary CLI commands.

The lifecycle departure is intentional. The default lifecycle runs design to plan to PRD to work to implementation, but this v2 planning wave is using artifact roadmap inputs as a source-to-design straddle before returning to that default chain. This design records the departure explicitly and does not mutate PRDs, risk registers, plans, work backlogs, guides, history records, package templates, or source code.

The current repository still has deterministic behavior in script-shaped surfaces. The system asset surface includes `.make-docs/scripts/check_path_hygiene.py`, its package template copy, and CLI rules that always preserve that path. The first-party skill surface includes script assets in `packages/cli/skill-registry.json` and `packages/skills/*`, notably closeout, work-on-wave, work-on-phase, archive, cleanup, and decompose-codebase helper scripts. The high-risk gap is tracked by [R-014](../prd/03-open-questions-and-risk-register.md): replacing or removing scripts without rewriting the dependent skills in the same window would create a known break path.

This design also depends on the source-of-truth and compatibility decisions from [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md), [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md), [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md), and [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md). Existing archived skill-local helper designs are historical evidence for why the scripts exist, not v2 authority for keeping deterministic make-docs logic inside skills.

## Decision

Deterministic make-docs-owned behavior must move behind CLI/shared-core operations before first-party scripts are removed or downgraded. The current TypeScript CLI is the first implementation target for these operations because it owns today's installer, template, manifest, audit, backup, uninstall, skill selection, and package validation behavior. Rust and MCP remain the long-term agent automation destination, but they inherit these operation contracts rather than redefining behavior.

Classify script-shaped behavior into three categories:

- Core deterministic operations: path hygiene checks; closeout probing, validation, and history coordination; work-on-wave and work-on-phase resolution, status, checkpoint, and phase-gate checks; markdown cleanup and style checks; archive relationship tracing; decompose-codebase environment probing and output validation. These belong in CLI/shared-core operations with focused tests.
- Skill guidance and reference content: `SKILL.md`, agent metadata, prompt routing, references, and examples may remain installed skill assets when selected. They may cite contracts and call CLI or MCP operations, but they do not own deterministic make-docs behavior.
- Thin compatibility wrappers: system wrapper scripts may remain only after an equivalent CLI/shared-core operation exists. A wrapper must delegate to the CLI operation, preserve exit-code and message compatibility where needed, and contain no authoritative workflow logic. Custom user scripts remain custom and are outside this migration unless a later design explicitly opts them in.

The migration sequence is part of the decision:

1. Add the CLI/shared-core operation and its focused tests.
2. Add or update manifest, planner, audit, backup, uninstall, and installer handling for the old and new asset shape.
3. Rewrite affected first-party skills in the same implementation window so they call the CLI/MCP boundary instead of skill-local helper scripts.
4. Remove a first-party helper script from the skill registry, package template, dogfood tree, or mirrored harness only after the corresponding CLI operation and skill rewrite are both present.
5. Validate install, selected-skills, audit, package, and template synchronization before accepting the migration.

The first migration wave should cover the scripts that can break the project lifecycle if they drift from the CLI: `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase`. The same change plan may include secondary no-scripts conversions for archive tracing, markdown cleanup/style checking, decompose-codebase probing/validation, and path hygiene, but no acceptance checkpoint may leave a selected first-party skill requiring a missing script or a missing CLI replacement.

The no-default-skills contract still holds. Default installs must not install skills or skill scripts. Explicit selected-skill installs may still install first-party skill prose, references, and metadata, but make-docs deterministic logic must be available from the CLI package rather than depending on remote or skill-local script payloads as the only executable source.

Installed-project safety is mandatory. Removed first-party helper scripts must be classified through existing managed-asset ownership and compatibility rules, not deleted as anonymous files. Audit, backup, uninstall, and migration flows must distinguish managed old skill scripts, managed wrapper scripts, modified local files, and custom user scripts. Any removal plan must be reviewable before mutation.

The MCP implication is contract shape, not immediate MCP implementation. Each migrated operation should produce deterministic inputs, outputs, dry-run behavior, provenance, and error semantics that a future MCP tool can expose without a second behavior model. MCP write behavior and Rust parity remain downstream implementation concerns governed by the prior CLI/MCP boundary design.

## Alternatives Considered

### Keep Skill-Local Helper Scripts Authoritative

Rejected. This preserves today's drift risk and leaves `R-014` unresolved. Skills can remain the agent-facing instructions, but deterministic make-docs workflow behavior must not be reimplemented independently inside each skill.

### Remove Scripts First, Rewrite Skills Later

Rejected. The roadmap explicitly requires skill rewrites in the same wave so `R-014` has no transitional break window. Removal-first sequencing would create a known failure mode for selected first-party skills.

### Move Only System Scripts and Leave Skill Scripts Alone

Rejected. The system script surface is smaller, but the skill script surface is where closeout and work execution rely on helper behavior. A partial migration would make the CLI cleaner while leaving the highest-risk drift path intact.

### Wait for Rust and MCP Before Migrating Scripts

Rejected. TypeScript owns the current installer, manifest, audit, backup, package, and skill registry behavior. Waiting for Rust would delay the risk reduction and make the later Rust work inherit undocumented script behavior instead of a tested operation contract.

### Use Remote Skill Assets as the Logic Distribution Channel

Rejected for deterministic make-docs-owned behavior. Remote or alternate skill delivery remains a later Batch 3 topic, but this design cannot depend on unresolved remote trust, provenance, or availability decisions to provide core workflow logic.

## Consequences

This design creates a larger implementation wave than simply deleting scripts. The change plan must touch CLI command or shared-core surfaces, focused tests, skill registry data, first-party skills, managed-asset classification, audit and backup behavior, template/package synchronization, and dogfood mirrors together where the affected asset is shipped.

The migration can reduce `R-014` and related script drift risks only if the implementation proves parity at each boundary. Validation should include focused tests for the migrated operations, CLI behavior, install and selected-skill behavior, package/template consistency, audit/backup/uninstall handling of removed managed scripts, and package contents when shipped files change. Future MCP parity tests should assert that MCP tools call the same operation contracts rather than duplicating behavior.

The design does not close [Q-001, Q-007, or Q-012](../prd/03-open-questions-and-risk-register.md). Skill source trust, remote or alternate skill manifests, and purpose-led skill selection remain open for the next Batch 3 designs. This design references those questions only to avoid taking a hidden dependency on them.

Documentation and public guidance may need follow-up once implementation exists. For now, the design should not update PRDs, risk-register entries, guides, or history records. Those lifecycle artifacts belong to the downstream change plan and implementation closeout.

## Design Lineage

Update Mode: new-doc-related

Prior Design Docs:

- [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md)
- [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md)
- [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
- [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md)

Reason: this design extends the accepted CLI/MCP boundary into the concrete script and skill migration rule. It also constrains prior tool-directory, materialization, audit, template, and configuration decisions so deterministic behavior moves into the CLI/shared-core boundary without changing source-of-truth, manifest, or canonical-routing contracts. Archived skill designs that kept helper scripts inside skills are superseded for future v2 first-party make-docs behavior, but they remain useful history for understanding why the helper scripts exist.

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: this is a refactor and migration against existing CLI, skill, template, manifest, audit, backup, package, and dogfood behavior, not a greenfield baseline.

Coordinate Handoff: unresolved; planner must resolve before writing. Prior planning evidence includes [W16 R0 coverage-pass contract work](../assets/archive/plans/2026-05-28-w16-r0-coverage-pass-contract/00-overview.md) and the `R-014` risk register entry, but the downstream W/R coordinate for the v2 no-scripts migration must be assigned by the planner.
