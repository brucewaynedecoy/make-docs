# Harness Plugin Substrate and Workflow Bundles

## W17 R3 Supersession

[Shared Agentics Native Harness Exposure Correction](2026-06-27-shared-agentics-native-harness-exposure-correction.md) supersedes this design's generated-stub default for shared-agentics exposure. This design remains authority for the plugin substrate, workflow-bundle separation, selection, manifest, lifecycle, and support-claim boundaries, but future implementation must prefer native harness exposure with symlink support and managed copy-mirror fallback unless a later plugin-specific design supersedes W17 R3.

## Purpose

Define the v2 plugin substrate for supported agent harnesses and separate that substrate from workflow bundles such as Idea/Brainstorm, Scaffold, Change Request/Iterate, and Use/Run.

This design gives downstream planning one contract for plugin storage, harness exposure, manifest ownership, lifecycle behavior, non-maintainer guardrails, and support-claim evidence. It does not turn playbooks into plugins, and it does not make plugin exposure a requirement for a playbook to be valid.

## Context

The [v2 roadmap](../assets/artifacts/v2-proposed-design-and-roadmap.md) places this design second in "Batch 4 - Playbooks and Plugins." It follows the accepted [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md) design and the Batch 3 shared agentics decisions. The roadmap asks this design to define plugin packaging, install, update, and uninstall behavior for supported harnesses; separate substrate from productized bundles; and make non-maintainer guardrails explicit.

This design intentionally starts from artifact roadmap inputs instead of from an already accepted plan or PRD. That is a lifecycle departure under the [documentation lifecycle](../../.make-docs/references/system/lifecycle.md): v2 planning is using artifact proposals as a source-to-design straddle, then returning to the default design -> plan -> PRD -> work -> implementation sequence for downstream work.

No existing design owns this exact decision area. This is a new v2 design, not an update to a prior design. It is tightly related to the shared agentics, playbook, configuration, CLI/MCP, no-scripts, conformance-lab, and template/package source-of-truth designs, so it includes lineage.

The current implementation is still skill-first. `packages/cli/src/types.ts` knows `claude-code` and `codex` harnesses, conflict groups include `skills` but not `plugins`, `packages/cli/src/manifest.ts` records `selectedSkills` and `skillFiles`, and skill install behavior is centered on `packages/cli/src/skill-registry.ts`, `packages/cli/src/skill-resolver.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts`. There is no current plugin registry, plugin command, plugin manifest record, or plugin audit classification.

Risk and open-question context remains in the existing PRD/risk register, especially Q-007, Q-012, Q-013, R-012, R-014, D-005, and Q-001 in [docs/prd/03-open-questions-and-risk-register.md](../prd/03-open-questions-and-risk-register.md). This design references those risks and questions but does not mutate PRD or risk-register state.

## Decision

A v2 plugin is a harness-visible invocation package. It is not a playbook, not a lifecycle artifact, and not a substitute behavior model. A plugin can wrap a built-in workflow, call the generic Run Playbook model, present a guided entrypoint for a product bundle, or delegate deterministic behavior to CLI/MCP/shared-core operations, but the governing contracts remain the accepted docs, lifecycle, manifest, config, audit, and playbook contracts.

Plugin installation inherits the shared agentics model. The canonical selected plugin payload lives once in the make-docs-owned shared agentics store:

- project scope: `.make-docs/agentics/plugins/<plugin-id>/`
- global scope: the user's home-scoped `.make-docs/agentics/plugins/<plugin-id>/`

Supported harnesses receive harness-native exposures or adapters, not duplicated authoritative plugin payloads. For the current harness set, Codex and Claude Code are the initial supported targets because they are the existing make-docs harnesses. A harness exposure may be a symlinked directory, managed copy mirror, command file, skill-like entrypoint, prompt wrapper, manifest shim, or other harness-native discovery file, depending on what that harness supports and on the W17 R3 exposure contract. The exposure file or directory is the harness boundary; the canonical plugin payload remains in the shared agentics store.

The plugin substrate consists of the common machinery needed by every selected plugin:

- canonical plugin id, title, summary, status, source manifest, source ref or version, digest, provenance, trust policy, supported harnesses, and scope;
- canonical payload records that identify all make-docs-owned plugin files under `.make-docs/agentics/plugins/<plugin-id>/`;
- harness exposure records that identify every harness-visible file, directory, link, copy mirror, or adapter and its target canonical payload;
- exposure mode, with `symlink` preferred, `copy-mirror` available as the managed fallback, and generated adapters allowed only when the plugin-specific harness contract requires an adapter;
- invocation metadata describing whether the plugin wraps a built-in workflow, one or more playbooks, a generic Run Playbook entrypoint, or a CLI/MCP operation;
- bundle metadata, when the plugin is part of a productized workflow bundle;
- permission and safety metadata describing whether the plugin is read-only, request-capture only, plan-first, dry-run first, temp-fixture only, or allowed to write after explicit approval;
- support metadata that distinguishes `provisional`, `implementation-validated`, and `conformance-validated` claims per harness and, where applicable, model/provider tuple.

The manifest schema must grow structured agentic ownership records instead of overloading skill-only state indefinitely. A future schema should distinguish selected artifact kind, canonical payload paths, harness exposure paths, symlink/copy-mirror/adapter modes, source/provenance/trust fields, support status, and migration disposition. Until that schema exists, implementation planning may use transitional records, but audit, backup, uninstall, dry-run output, and migration diagnostics must not lose the distinction between canonical plugin payloads and harness exposures.

Plugin selection is explicit. A bare install or default sync installs no plugins. `--selected-skills all` or any existing skill-selection affordance does not imply all plugins. Plugin installation requires a future accepted plugin selection flow, effective plugin manifest, or explicit user instruction. Reconfigure and sync preserve existing selected plugins unless the user changes the selection or an accepted migration plan defines a reviewed transition.

Plugin lifecycle behavior follows the installer-maintainer surface until a later plan proves another runtime has parity. Install, update, sync, reconfigure, backup, audit, uninstall, migration review, package validation, and conflict handling remain TypeScript CLI-owned in the near term. A plugin may call Rust CLI or MCP operations only through accepted operation contracts; it must not carry independent deterministic logic that bypasses the no-scripts migration or creates a second implementation of manifest/config/audit behavior.

Update behavior means reconciling selected plugins against the effective plugin manifest and manifest-owned state. A clean managed plugin payload, symlink exposure, copy mirror, or generated adapter may be updated in place. A modified managed payload, modified copy mirror or adapter, malformed manifest, missing-manifest ambiguous state, or user-authored harness plugin must flow through review, backup, skip, or manual-resolution paths. Plugin update must never infer ownership over a user-authored harness file just because its name matches a make-docs plugin id.

Uninstall behavior removes only reviewed, make-docs-owned plugin payloads, symlink exposures, copy mirrors, and generated adapters. Backup and uninstall must consume one reviewed audit snapshot before destructive removal. Uninstall may prune empty make-docs-owned plugin directories only when audit proves there are no unmanaged descendants.

Configuration overlays are rendering inputs, not routing authority. A project may relabel "designs" as "ideas" or change user-facing persona labels, but plugins still route through canonical paths, kind values, lifecycle route identifiers, prompt paths, plugin ids, playbook ids, skill names, harness names, and manifest keys. A plugin can display configured labels after canonical resolution, but it cannot use config to rename the structure it reads or writes.

Workflow bundles are products on top of the substrate. They share storage, selection, manifest, audit, backup, uninstall, config, and support-claim behavior, but each bundle owns a narrower user-facing workflow. Initial v2 bundle families are:

- Idea/Brainstorm: captures and refines an idea or request into a lifecycle-ready input without requiring the user to understand the docs tree. It is request-capture or plan-first by default and must not silently mutate build-stack artifacts.
- Scaffold: creates or expands a make-docs documentation system from accepted inputs. It is maintainer-facing by default unless a later bundle plan defines a constrained non-maintainer mode with explicit gates.
- Change Request/Iterate: captures a bounded change request and, when authorized, routes it through design, plan, PRD, work, and implementation according to the lifecycle contracts. It must distinguish "file a request" from "make the change" in its metadata and UI.
- Use/Run: exposes run-stack workflows for users operating an installed or already-available system. It may call the generic Run Playbook model, but it cannot redefine playbook storage or make a plugin mandatory for playbook validity.

Every productized bundle must declare its audience and exposure boundary. At minimum, bundle metadata must identify whether the workflow is maintainer-only, non-maintainer request-capture, non-maintainer guided-change, or end-user run-stack usage. Q-013 remains open for exact per-bundle UX, but this design closes the substrate-level rule: non-maintainer plugins are sanctioned entrypoints with explicit gates, not hidden write channels into lifecycle artifacts.

Playbook boundaries remain governed by [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md). A plugin may invoke one playbook, offer a catalog of playbooks, or wrap a built-in workflow that is not authored as a playbook. A playbook remains persona-scoped content under `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md`; it does not become a plugin because a plugin can run it. The content-vs-invocation boundary is the answer to R-012.

Support claims are evidence-bound. Public language about plugin, bundle, playbook, skill, harness, or model support must cite implementation validation or conformance-lab evidence. Until the [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md) has scenario records for a plugin/harness/model tuple, support wording for that tuple must remain provisional.

## Alternatives Considered

Duplicate full plugin payloads into every harness directory as independent authoritative copies. Rejected. The shared agentics design and W17 R3 correction keep one canonical payload plus harness-native exposure to avoid drift and ambiguous ownership.

Use symlinks without fallback as the plugin substrate. Rejected. W17 R3 makes symlink exposure preferred, but v2 correctness must still support managed copy mirrors when platform policy, permissions, or user configuration prevent link creation.

Treat productized workflow bundles as the substrate. Rejected. Bundles are user-facing products on top of shared install, manifest, audit, backup, uninstall, config, and support-claim rules. Letting the first bundle define substrate behavior would make later bundles inconsistent.

Require one plugin per playbook or make Run Playbook a required plugin. Rejected. The accepted playbook design defines Run Playbook as a generic execution model. Plugin exposure is additive, and every valid playbook must remain runnable without requiring plugin packaging.

Let plugins own deterministic lifecycle behavior independently. Rejected. Batch 3 separates installer-maintainer behavior, future agent automation, and MCP parity. Plugins must call accepted CLI/MCP/shared-core operation contracts instead of embedding a second implementation of manifest, config, audit, backup, uninstall, generation, or validation behavior.

Expose broad public support claims before conformance evidence exists. Rejected. The conformance-lab design makes support claims evidence-gated per scenario, harness, and model/provider tuple.

## Consequences

The future change plan must update the CLI type model, manifest schema, planner, install flow, audit engine, backup and uninstall flows, package validation, tests, and user-facing dry-run output to understand plugin payloads, native harness exposures, copy mirrors, symlink records, and generated adapters. The current skill-specific surfaces can be generalized only where the behavior truly applies to both skills and plugins; product-bundle behavior should not be forced into the skill catalog.

The package/template source-of-truth boundary remains intact. If first-party plugin payloads or plugin manifests become shipped assets, the plan must decide their source location and package inclusion rules without placing conformance-lab records or generated local run artifacts into `packages/docs/template/`, `packages/cli/template/`, npm tarballs, or future runtime packages by accident. Root `docs/` remains dogfood validation, not the product source of truth for shipped template-owned assets.

Q-012 gets the substrate-level answer for shared install and config mapping: selected plugins share the `.make-docs/agentics/` storage model, expose harness-native files or directories, and consume config only after canonical routing. Q-013 remains partially open for per-bundle UX: the future plan or bundle-specific PRD work still needs to decide exact request-vs-change behavior, docs visibility, and scaffold exposure. Q-007, Q-001, and D-005 remain relevant to plugin source and delivery policy. R-014 remains relevant because plugins must not depend on removed scripts before CLI/MCP replacements exist.

Validation for implementation should prove no-default plugin behavior, explicit project-scope and global-scope plugin installation, native harness exposure for Codex and Claude Code, symlink-preferred behavior, managed copy-mirror fallback, manifest migration from skill-only schema to agentic ownership records, preservation of modified/custom harness files, review before destructive backup/uninstall, config label rendering without structural renames, package inclusion or exclusion rules, and conformance-lab scenarios before public support claims. Baseline package validation should continue to include `npm run build -w packages/cli`, `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, and `npm run smoke:pack`, plus targeted plugin substrate tests.

This design removes the downstream blocker for the next Batch 4 design. Coverage-pass extensions and adversarial review can now decide whether they are optional workflow bundles, playbook extensions, conformance scenarios, or ordinary validation phases without reopening plugin storage, harness exposure, or playbook validity.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [2026-06-20 Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md); [2026-06-20 Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md); [2026-06-20 Skill Purpose Registry and Alternate Skills Manifest](2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md); [2026-06-20 CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md); [2026-06-20 No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md); [2026-06-20 Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md); [2026-06-19 New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md); [2026-06-19 Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md); [2026-06-19 Template Package and Dogfood Source of Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md); [2026-04-16 CLI Skill Installation R2](../assets/archive/designs/2026-04-16-cli-skill-installation-r2.md).

Reason: This design extends accepted shared-agentics and playbook decisions into the plugin substrate and product-bundle layer. It supersedes only artifact-level assumptions that treated symlink redirection, duplicated harness payloads, or plugin packaging as sufficient. It does not supersede prior accepted v2 designs.

## Intended Follow-On

Route: change-plan.

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md).

Why: Implementation will revise existing installer, manifest, skill registry/catalog, planner, audit, backup, uninstall, package, and validation behavior rather than create a new repository baseline. Planning must preserve the lifecycle departure noted above by returning from this v2 design to the normal design -> plan -> PRD -> work -> implementation sequence.

Coordinate Handoff: prior related coordinates include archived W5 R2 CLI skill installation and W7 R1 lifecycle backup/uninstall standardization; downstream coordinate W18 R2 ([PRD 30](../prd/30-plugin-substrate-and-workflow-bundles.md)), closed.
