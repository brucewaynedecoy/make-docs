# Playbook Packaging Compiler and Harness Adapters

## Purpose

This design defines how Make Docs compiles Playbooks into real, harness-native distributables. It covers three things: the packaging compiler that lowers Playbook models plus a reviewed package plan into a multi-file distributable inventory; the harness capability and distributable model that lets one distributable map onto many harness containers; and the verified per-harness adapter contracts.

It exists to correct two verified implementation failures while preserving the reviewed packaging architecture already accepted. The current writer emits a Make Docs descriptor instead of harness-native content, and the Codex adapter declares an assumed path that does not match the real Codex plugin shape. Together these are why a generated Codex package was not recognized by Codex. This design makes the compiler produce real harness-native artifacts and requires adapter contracts to be verified against the actual harness.

The full architecture this design draws from is recorded in [Playbook Architecture and Design](../assets/artifacts/playbook-architecture.md), Sections 6 through 8. It consumes the Playbook model from [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md) and the run-time behavior from [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md), and it preserves, without reopening, the packaging pipeline and adapter-registry model established by [Playbook Packaging and Harness Adapter Registry](2026-06-29-playbook-packaging-and-harness-adapter-registry.md).

## Context

A Playbook is the primitive; a distributable is a projection of it. Packaging must be able to turn one or more Playbooks into shippable, shareable agentic outputs that a target harness recognizes and can use, while keeping the Playbook itself portable and operational without any packaging.

The W18 R5 packaging design established the reviewed pipeline, the deterministic rails, agent assistance limited to package-plan drafting, the target model that separates the real harness from the surface profile, the harness adapter registry as the owner of harness-specific behavior, the harness-neutral planner and surface resolver, generated-output provenance, the rule that workflow bundles do not map one-to-one to plugins, and tuple-bound support claims. Those decisions are inherited here and are not reopened.

Two failures in the current implementation motivate this design. The writer produces a descriptor whose kind is a Make Docs type rather than a harness-native manifest, so no harness treats it as an installable artifact. The Codex adapter declares a plugin path under a standard skills-style location, while the real Codex plugin shape is a folder containing a plugin manifest plus a marketplace registration. The architecture also adds structure the W18 R5 design did not fully specify: a multi-file distributable inventory, a formal harness capability and distributable model, dependency materialization rules per dependency kind, and a marketplace registration seam.

Dependencies owned elsewhere are referenced, not redefined. The compiler consumes the Playbook model and its rich step, dependency, and activation content from the contract-and-model design. It reuses the existing exposure plumbing, meaning the canonical payload under the staging area, the exposure mirror placed by symlink or copy-mirror, and manifest ownership records. Generated outputs that drive Make Docs reference operation identifiers from the registry owned by [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md).

This repository is the Make Docs maintainer repo and a dogfood instance. The compiler and adapters are Make Docs operation-core code under the CLI package and are ordinary source code, not dogfooded template assets. Any Make Docs-owned documentation, contract, or config-schema resource this design implies is authored upstream in `packages/docs/template/` and dogfooded downstream, per the maintainer dogfooding rule.

## Decision

### D0. Scope and Boundaries

This design owns exactly: the packaging compiler and its multi-file distributable inventory (D2), the split between deterministic and agent-assisted generation (D3), dependency materialization (D4), the harness capability and distributable model (D5), the verified adapter contracts (D6), the marketplace and registration seam (D7), and provenance, lifecycle, and support binding (D8).

R-SCOPE-1 (MUST NOT). The following are owned elsewhere and MUST NOT be redefined or reinvented in this design's implementation:

- The Playbook document schema, workflow contract, step model, dependency registry, Playbook model, parser, and validator. Owned by [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md).
- The run-state machine and run-time execution. Owned by [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md).
- Conformance and the tuple registry. Owned by the conformance design; see architecture artifact Section 9.
- The operation registry's materialization, the CLI command tree, and the global store. Owned by [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md) and [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md).

### D1. Preserved Prior Decisions

R-KEEP-1 (MUST). The following decisions from the W18 R5 packaging design MUST be preserved unchanged:

- The reviewed packaging pipeline: source validation, package intent, reviewed package plan, harness adapter resolution, output writer, manifest and provenance records, and package, lifecycle, and conformance validation.
- The deterministic rails: parse and validate metadata, resolve assets and links, compute source digests, classify owned versus user-authored files, evaluate allowed output kinds, select adapter surfaces, write accepted outputs, record manifest ownership, audit generated artifacts, back up before destructive changes, uninstall only Make Docs-owned outputs, and run validation.
- Agent assistance limited to package-plan drafting; a proposal is not authority until the plan is accepted; non-interactive runs fail before writing when a plan requires unresolved semantic judgment, unsafe rewrites, ambiguous ownership, unsupported surfaces, or missing review.
- The target model separating the real harness from the surface profile, with `generic` not a harness and standard locations being surfaces. The target model is `harness`, `outputKind` of `plugin` or `skills-bundle`, `surface` of `native`, `agents-standard`, or `auto`, and `scope` of `project`, `global`, or `export-only`.
- The harness adapter registry as the owner of harness-specific behavior, so adding a harness adds an adapter module, fixtures, and conformance scenarios rather than planner conditionals.
- The harness-neutral core planner and the surface resolver.
- Generated outputs as distribution artifacts carrying provenance back to source Playbook refs, digests, package profile, adapter id, output kind, generated files, ownership status, and support status.
- Workflow bundles do not map one-to-one to plugins.
- Support claims are bound to the exact tuple, and packaging logic lives in modular operation domains.

### D2. Packaging Is a Compiler

R-COMP-1 (MUST). The output writer MUST produce a real, harness-native, multi-file distributable. It MUST NOT emit a Make Docs descriptor as the installable artifact. This SUPERSEDES the current implementation, whose plugin output is a descriptor whose kind is a Make Docs type rather than a harness-native manifest.

R-COMP-2 (MUST). The compiler MUST reuse the existing exposure plumbing unchanged: a canonical payload under the staging area, an exposure mirror placed at the harness path by symlink or copy-mirror, and manifest ownership records tracking both. Only the payload content changes, from a descriptor to a faithful harness-native artifact tree.

R-COMP-3 (MUST). The distributable is a multi-file tree whose contents are a function of the Playbook model and the target. The compiler MUST be able to emit, as applicable: a `SKILL.md` per source Playbook preserving workflow intent, trigger description, step instructions, references, and safety boundaries; references extracted or copied from authority sources where redistribution is allowed and linked otherwise; deterministic helper scripts and dependency-check scripts with provenance; tool and dependency declarations per D4; hooks generated from event-bound steps per D5; the harness-native manifest the target requires; marketplace or registration files per D7; lifecycle records; and conformance records.

### D3. Deterministic and Agent-Assisted Generation

R-GEN-1 (MUST). Generation is two-tier and the boundary MUST be recorded in field provenance. Schema-owned fields are generated deterministically: file paths, manifest structure, dependency checks, provenance, and digests. Semantic fields are agent-assisted proposals that are review-gated: skill descriptions and triggers, the grouping of Playbooks into a bundle, and harness-facing prose.

R-GEN-2 (MUST). The compiler MUST fail closed before any write when unresolved semantic decisions, ownership conflicts, missing dependencies, unsupported surfaces, or missing conformance evidence require review, preserving the fail-before-write behavior of the W18 R5 planner.

### D4. Dependency Materialization

R-DEPMAT-1 (MUST). The dependency kind declared in the Playbook dependency registry determines how the compiler materializes it:

- `cli` and `package-manager`: emitted as deterministic check scripts plus human instructions. A `cli` dependency on Make Docs itself MUST reference operation identifiers from the registry, not CLI command strings, so generated outputs survive CLI reorganization.
- `skill` and `plugin`: emitted as harness-native manifest references where the target supports them, and degraded explicitly where it does not.
- `mcp` and `external-service`: emitted as Make Docs metadata plus a runtime availability check.
- `reference`: copied or extracted where redistribution is allowed, and linked otherwise.
- `playbook`: included as an additional skill when bundled, or referenced when not.

### D5. Harness Capability and Distributable Model

R-CAP-1 (MUST). There are two capability questions that share one harness registry. The packaging-time question is whether a harness can host a given agentic primitive, such as a plugin, a hook, an extension, a skill, or an MCP server. The run-time question is whether a harness can execute a given step's required surface, which is the concern of the Run Playbook design. The registry answers both.

R-CAP-2 (MUST). Each harness MUST have a capability descriptor declaring its identifier, the agentic primitives it supports, its native distributable container and the container's file layout including paths and manifest filenames, a lifecycle event map from logical events to harness hook points, the exposure modes it supports, its registration model, and its preconditions. The descriptor is the single place harness-specific packaging knowledge lives.

R-CAP-3 (MUST). Authoring granularity and distribution granularity are separate. One Playbook projects to one skill; that is the authoring unit. A distributable is the distribution unit and contains one or more skills plus the agentics the Playbook's steps imply. A bundle is multiple Playbooks compiled into one distributable with multiple skills. The `outputKind` value `plugin` MUST be interpreted as the harness's richest native container, which the adapter realizes as a plugin, an extension, or another native container per the descriptor; `skills-bundle` MUST be interpreted as the portable agents-standard skills form. In the architecture's terms, these are the native and portable distributable profiles.

R-CAP-4 (MUST). The adapter MUST select the richest container the harness supports for the chosen profile, map the Playbook's implied agentics onto the harness's supported primitives, and handle the unsupported case explicitly. When a Playbook needs a primitive the harness lacks, the adapter MUST either degrade by emitting the behavior as a documented manual step or skill instruction, or fail closed with an unsupported-surface stop. The choice MUST be declared, never silent.

R-CAP-5 (MUST). Event-bound steps MUST compile to the harness's hook points where the descriptor declares hook support, and MUST degrade or fail closed per R-CAP-4 where it does not.

### D6. Verified Adapter Contracts

R-ADAPT-1 (MUST). Every adapter's paths, manifest shapes, and registration steps MUST be verified against the real harness, not assumed from a path template. Each adapter declaration MUST carry a verification reference naming where the contract was confirmed and a verification status. An adapter whose contract is unverified MAY produce only export-only or provisional output and MUST NOT carry a support claim.

R-ADAPT-2 (MUST). The Codex adapter MUST follow the verified Codex contract. A plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry such as `.agents/plugins/marketplace.json` or a configured marketplace source. A skills bundle uses direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure. This SUPERSEDES the current Codex adapter, which declares a plugin path of `.agents/plugins/{packageId}` and writes a descriptor payload; both the path and the payload MUST be corrected.

R-ADAPT-3 (MUST). The Claude Code adapter lowers a plugin to `.claude/plugins/{id}/plugin.json` and a skill to `.claude/skills/{id}/SKILL.md`, or to agents-standard `.agents/skills` for the portable profile. Claude Code supports hooks, so event-bound steps lower to its hook points. The adapter MUST be reviewed against the actual Claude Code plugin and skill contract before its support status moves beyond provisional.

R-ADAPT-4 (MUST). The Pi adapter supports skills, MCP, and extensions but not hooks. Its richest native container is an extension bundled with one or more skills. Event-bound steps MUST degrade to a documented manual step or skill instruction, or fail closed, per R-CAP-4.

R-ADAPT-5 (MUST). An unknown harness identifier, an unsupported output kind, an unsupported surface, or a scope the adapter cannot honor MUST fail closed before any write, consistent with the existing stop reasons. A fixture adapter MUST exercise the unsupported path so the fail-closed behavior is itself tested.

### D7. Marketplace and Registration Seam

R-MKT-1 (MUST). Registration and marketplace files MUST be generated into the distributable, but a user's global marketplace MUST NOT be auto-mutated without an explicit global scope and approval. The default is to generate but not install.

R-MKT-2 (MAY). A config-gated policy seam in the global store MAY later opt into auto-registration where a stop-and-approve step would disrupt a deliberate workflow cadence. The opt-in MUST be additive and off by default.

### D8. Provenance, Lifecycle, and Support

R-PROV-1 (MUST). Every generated artifact MUST carry Playbook provenance: source ref and digest, package profile, adapter id, output kind, generated files, ownership status, and support status.

R-PROV-2 (MUST). Backup and uninstall MUST remove only Make Docs-owned generated outputs, and MUST do so without orphaning empty managed directories or deleting user-authored files. This is proven by a conformance scenario in the conformance design.

R-PROV-3 (MUST). Support claims MUST remain provisional until conformance evidence exists and MUST be bound to the exact tuple of scenario, harness, surface, scope, output kind, model or provider, and runtime.

### D9. Non-Negotiable Decisions and Deliberately Open Choices

Fixed by this design and MUST NOT be substituted, relaxed, or reinvented:

- The output writer produces a real harness-native multi-file distributable, not a descriptor (R-COMP-1).
- Adapter contracts are verified against the real harness, and the verified Codex, Claude Code, and Pi shapes in D6 (R-ADAPT-1 through R-ADAPT-4).
- The capability descriptor as the single home for harness-specific packaging knowledge (R-CAP-2).
- The two-granularities model and the native-versus-portable profile interpretation of `outputKind` (R-CAP-3).
- Fail-before-write on unresolved review, and generate-but-do-not-auto-register as the default (R-GEN-2, R-MKT-1).

Deliberately left to the implementer and MUST NOT be treated as under-specified gaps:

- The internal structure of the compiler, provided it produces the required inventory and honors the deterministic-versus-agent-assisted split.
- The exact organization of generated files within the harness's own layout constraints.
- The prompt wording used to elicit agent-assisted proposals.
- The internal structure of each adapter module, provided its declared contract is verified.

### D10. Verification and Testability

R-TEST-1 (MUST). A test MUST assert that a generated distributable is a multi-file, harness-native tree and not a Make Docs descriptor.

R-TEST-2 (MUST). A test MUST assert that generated Codex plugin output contains `.codex-plugin/plugin.json` and a marketplace registration entry, and that the Codex skills-bundle output uses `.agents/skills/{id}/SKILL.md`.

R-TEST-3 (MUST). Tests MUST cover adapter fail-closed behavior for an unknown harness, an unsupported output kind, and an unsupported surface, using the fixture adapter.

R-TEST-4 (MUST). Tests MUST cover dependency materialization per kind, the deterministic-versus-agent-assisted generation gate, provenance and ownership records, and backup and uninstall cleanliness.

R-TEST-5 (MUST). Real-harness recognition, installation, and invocation are proven by the conformance design, not by unit tests. Unit and integration tests here MUST NOT be read as evidence that a harness recognizes the output.

## Alternatives Considered

Keep the descriptor output. Rejected. A Make Docs descriptor is not an installable artifact in any harness, which is the direct cause of the generated Codex package not being recognized.

Keep assumed per-adapter path templates. Rejected. Unverified templates are what produced the wrong Codex path; adapter contracts must be verified against the real harness.

Hardcode `plugin` as the only native container. Rejected. It cannot express harnesses like Pi whose native container is an extension. The capability descriptor generalizes the container type instead.

Answer skill density by fanning one Playbook into several skills, or by capping skill complexity. Rejected. Authoring granularity is fixed at one Playbook per skill, and distribution granularity is a separate adapter-driven choice, so the density question never arises.

Auto-register a generated plugin into the user's global marketplace. Rejected for safety. The default is generate but do not install, with an explicit approval or a config opt-in required for global registration.

Branch on harness inside the shared planner. Rejected, preserving the W18 R5 decision. Harness-specific behavior stays in adapter declarations, fixtures, and conformance records.

Force a fully deterministic pipeline. Rejected, preserving the W18 R5 decision. Semantic content can require review-gated agent assistance; the stable requirement is deterministic state, validation, writes, provenance, audit, lifecycle, and review gates.

## Consequences

The triggering failure is fixed: generated Codex output becomes a real `.codex-plugin/plugin.json` plugin with marketplace registration, or a real skills bundle, so Codex can discover and use it. The compiler can now emit multi-skill bundles, hooks from event-bound steps, references, and dependency checks, which the descriptor writer could not.

Because harness-specific knowledge lives in the capability descriptor and the adapter, adding a harness such as Pi is additive: a new adapter module, a descriptor, fixtures, and conformance scenarios, without planner changes. This design depends on the rich Playbook model, including step activation and typed dependencies, so it is sequenced after the contract-and-model design, and it reuses the existing exposure plumbing rather than introducing new storage.

Support claims remain provisional until the conformance design provides real-harness evidence, so this design does not by itself authorize public support wording. It preserves the W18 R5 pipeline and adapter-registry model, so the plugin substrate and workflow-bundle work continue to consume this packaging contract rather than inventing their own.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Playbook Packaging and Harness Adapter Registry](2026-06-29-playbook-packaging-and-harness-adapter-registry.md), [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md), [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md), [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md), [Shared Agentics Native Harness Exposure Correction](2026-06-27-shared-agentics-native-harness-exposure-correction.md).

Reason: This design turns the packaging output writer into a real multi-file, harness-native compiler, adds the harness capability and distributable model, and replaces assumed adapter paths with verified harness contracts. It corrects the descriptor-only output and the wrong Codex paths while preserving the W18 R5 pipeline, deterministic rails, adapter-registry model, provenance, and tuple-bound support.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution of active W18 packaging and adapter requirements. It fixes the generated-output and adapter-contract failures against the active PRD namespace rather than starting a fresh baseline.

Coordinate Handoff: Revises W18 R5 (Playbook packaging and harness adapter registry) by correcting the output writer to produce harness-native distributables and requiring verified adapter contracts. Recommended downstream coordinate unresolved; planner must resolve against the active W18 namespace before writing.
