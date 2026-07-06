---
title: "36 Revise Playbook Packaging Compiler and Harness Adapters"
kind: "prd"
status: "active"
coordinate: "W18 R8"
source:
  type: "design"
  path: "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md"
---

# 36 Revise Playbook Packaging Compiler and Harness Adapters

## Purpose

Make Playbook packaging a real compiler: the output writer produces harness-native, multi-file distributables instead of a Make Docs descriptor, a formal harness capability and distributable model lets one distributable map onto many harness containers, and every adapter's paths, manifest shapes, and registration steps are verified against the actual harness. This change belongs in the active PRD namespace because it revises the W18 R5 packaging requirements PRD 33 carries — the current writer emits a descriptor whose kind is a Make Docs type rather than a harness-native manifest, and the Codex adapter declares an assumed `.agents/plugins/{packageId}` path that does not match the real Codex plugin shape, which together are why a generated Codex package was not recognized by Codex. It corrects both failures while preserving, without reopening, the reviewed packaging pipeline, deterministic rails, target model, adapter-registry model, provenance, and tuple-bound support claims PRD 33 established, and it consumes the W18 R6 Playbook model from [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md) unchanged.

## Change Type

Revision. This PRD supersedes PRD 33's descriptor-as-payload output and its assumed adapter path templates — specifically the Codex plugin path — with the harness-native multi-file distributable inventory, the capability descriptor and two-granularities distributable model, and verified Codex, Claude Code, and Pi adapter contracts. It does not revise the reviewed packaging pipeline, the deterministic rails, the plan-drafting-only agent-assistance limit, the harness/surface target model, the adapter-registry model, generated-output provenance, lifecycle safety, the Playbook model, the run-state machine, conformance and the tuple registry, the operation registry and CLI tree, or the global store; those remain governed by their owning docs and designs.

Route: `change-plan`

Coordinate: `W18 R8`

## Baseline Being Revised or Removed

- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): under Capability Addition or Enhancement, the reading of `plugin` as a harness-visible plugin package or plugin payload and of accepted outputs as single writable payloads is superseded — `outputKind` is now interpreted through the two-granularities model, `plugin` meaning the harness's richest native container and `skills-bundle` meaning the portable agents-standard form, and the accepted output is a real multi-file harness-native distributable, never a Make Docs descriptor. Under Contracts and Data, the adapter-declaration `path templates` item is superseded by verified adapter contracts carried in harness capability descriptors — an adapter's paths, manifest shapes, and registration steps must be verified against the real harness, not assumed from a template. The reviewed pipeline, deterministic rails, agent-assistance limits, `native`/`agents-standard`/`auto` surfaces, scope model, adapter registry, provenance, lifecycle behavior, and evidence-bound support claims in PRD 33 remain active and are preserved unchanged.
- Superseded current implementation behavior anchored by PRD 33: the plugin output writer that emits a descriptor whose kind is a Make Docs type, and the Codex adapter that declares a plugin path of `.agents/plugins/{packageId}` and writes a descriptor payload; both the path and the payload must be corrected.

## Rationale

A generated Codex package was not recognized by Codex, for two verified reasons: the writer produces a descriptor that no harness treats as an installable artifact, and the Codex adapter's declared path was assumed from a skills-style template while the real Codex plugin shape is a folder containing a plugin manifest plus a marketplace registration. The architecture also adds structure the W18 R5 design did not fully specify — a multi-file distributable inventory, a formal harness capability and distributable model, dependency materialization rules per dependency kind, and a marketplace registration seam — and the W18 R6 Playbook model now provides the rich step, dependency, and activation content a real compiler needs, so the correction and the missing structure land together as one corrective revision.

Code anchors:

- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/operations/playbook.ts`
- `packages/cli/src/manifest.ts`

## Effective Requirement

The effective requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md) is the normative statement of each.

### Scope, Boundaries, and Preserved Decisions (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this change owns exactly the packaging compiler and its multi-file distributable inventory, the deterministic/agent-assisted generation split, dependency materialization, the harness capability and distributable model, the verified adapter contracts, the marketplace and registration seam, and provenance, lifecycle, and support binding. The Playbook document schema, workflow contract, step model, dependency registry, Playbook model, parser, and validator (owned by the W18 R6 lineage in [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md)); the run-state machine and run-time execution (owned by the W18 R7 lineage in [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md)); conformance and the tuple registry (owned by the conformance design; see [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md) Section 9); and the operation registry's materialization, the CLI command tree, and the global store (owned by the [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md) and [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md) lineages) must not be redefined or reinvented here.
- R-KEEP-1 (MUST): the W18 R5 decisions are preserved unchanged — the reviewed packaging pipeline from source validation through package intent, reviewed package plan, harness adapter resolution, output writer, manifest and provenance records, and package/lifecycle/conformance validation; the deterministic rails including parse and validate, resolve assets and links, compute digests, classify ownership, evaluate output kinds, select surfaces, write accepted outputs, record manifest ownership, audit, back up before destructive changes, uninstall only Make Docs-owned outputs, and validate; agent assistance limited to package-plan drafting with proposals gaining authority only on plan acceptance and non-interactive runs failing before writes on unresolved judgment; the target model separating the real harness from the surface profile with `generic` not a harness, `outputKind` of `plugin` or `skills-bundle`, `surface` of `native`, `agents-standard`, or `auto`, and `scope` of `project`, `global`, or `export-only`; the harness adapter registry as the owner of harness-specific behavior so adding a harness adds an adapter module, fixtures, and conformance scenarios rather than planner conditionals; the harness-neutral core planner and surface resolver; generated outputs carrying provenance to source Playbook refs, digests, package profile, adapter id, output kind, generated files, ownership status, and support status; workflow bundles not mapping one-to-one to plugins; and support claims bound to the exact tuple with packaging logic in modular operation domains.

### Packaging Is a Compiler (R-COMP)

- R-COMP-1 (MUST): the output writer produces a real, harness-native, multi-file distributable and MUST NOT emit a Make Docs descriptor as the installable artifact; this supersedes the current implementation, whose plugin output is a descriptor whose kind is a Make Docs type rather than a harness-native manifest.
- R-COMP-2 (MUST): the compiler reuses the existing exposure plumbing unchanged — a canonical payload under the staging area, an exposure mirror placed at the harness path by symlink or copy-mirror, and manifest ownership records tracking both, per [28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md); only the payload content changes, from a descriptor to a faithful harness-native artifact tree.
- R-COMP-3 (MUST): the distributable is a multi-file tree whose contents are a function of the Playbook model and the target, and the compiler can emit, as applicable: a `SKILL.md` per source Playbook preserving workflow intent, trigger description, step instructions, references, and safety boundaries; references extracted or copied from authority sources where redistribution is allowed and linked otherwise; deterministic helper scripts and dependency-check scripts with provenance; tool and dependency declarations per R-DEPMAT-1; hooks generated from event-bound steps per R-CAP-5; the harness-native manifest the target requires; marketplace or registration files per R-MKT-1; lifecycle records; and conformance records.

### Deterministic and Agent-Assisted Generation (R-GEN)

- R-GEN-1 (MUST): generation is two-tier with the boundary recorded in field provenance — schema-owned fields (file paths, manifest structure, dependency checks, provenance, digests) are generated deterministically, and semantic fields (skill descriptions and triggers, the grouping of Playbooks into a bundle, harness-facing prose) are review-gated agent-assisted proposals.
- R-GEN-2 (MUST): the compiler fails closed before any write when unresolved semantic decisions, ownership conflicts, missing dependencies, unsupported surfaces, or missing conformance evidence require review, preserving the fail-before-write behavior of the W18 R5 planner.

### Dependency Materialization (R-DEPMAT)

- R-DEPMAT-1 (MUST): the dependency kind declared in the Playbook dependency registry determines materialization — `cli` and `package-manager` emit as deterministic check scripts plus human instructions, with a `cli` dependency on Make Docs itself referencing operation identifiers from the registry rather than CLI command strings so generated outputs survive CLI reorganization; `skill` and `plugin` emit as harness-native manifest references where the target supports them and degrade explicitly where it does not; `mcp` and `external-service` emit as Make Docs metadata plus a runtime availability check; `reference` is copied or extracted where redistribution is allowed and linked otherwise; and `playbook` is included as an additional skill when bundled or referenced when not.

#### Change Notes

- Superseded by [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md). The probe target for generated `cli` and `package-manager` checks is the dependency's declared `probe` field from the v2 dependencies block, defaulting to the dependency `id`; deriving it from `Source` prose (`executableToken`) is removed, and nothing parses `source` for machine meaning. For `skill` and `plugin` kinds, `probe` carries the manifest reference identifier. Every other R-DEPMAT-1 rule — per-kind emission, operation identifiers over CLI strings, explicit degradation — is unchanged.

### Harness Capability and Distributable Model (R-CAP)

- R-CAP-1 (MUST): the packaging-time question (can this harness host a given agentic primitive such as a plugin, hook, extension, skill, or MCP server) and the run-time question (can this harness execute a given step's required surface, owned by the W18 R7 runner) share one harness registry that answers both.
- R-CAP-2 (MUST): each harness has a capability descriptor declaring its identifier, the agentic primitives it supports, its native distributable container and the container's file layout including paths and manifest filenames, a lifecycle event map from logical events to harness hook points, the exposure modes it supports, its registration model, and its preconditions; the descriptor is the single place harness-specific packaging knowledge lives.
- R-CAP-3 (MUST): authoring granularity and distribution granularity are separate — one Playbook projects to one skill as the authoring unit, a distributable is the distribution unit containing one or more skills plus the agentics the Playbook's steps imply, and a bundle is multiple Playbooks compiled into one distributable with multiple skills; `outputKind` `plugin` is interpreted as the harness's richest native container, which the adapter realizes as a plugin, an extension, or another native container per the descriptor, and `skills-bundle` is interpreted as the portable agents-standard skills form — the native and portable distributable profiles.
- R-CAP-4 (MUST): the adapter selects the richest container the harness supports for the chosen profile, maps the Playbook's implied agentics onto the harness's supported primitives, and handles the unsupported case explicitly — degrading to a documented manual step or skill instruction, or failing closed with an unsupported-surface stop — with the choice always declared, never silent.
- R-CAP-5 (MUST): event-bound steps compile to the harness's hook points where the descriptor declares hook support, and degrade or fail closed per R-CAP-4 where it does not.

#### Change Notes

- Enhanced by [43-revise-conformance-scenario-model-and-execution-kit.md](./43-revise-conformance-scenario-model-and-execution-kit.md) (W18 R13, register item R-028). The capability descriptor gains a lab-facing interrogation block — how to list a harness's installed plugins and skills, where it logs invocation, and similar interrogation knowledge the conformance kit needs — verification-marked like every other descriptor claim, so R-CAP-2's single-home rule extends to lab knowledge: the kit generator consumes the descriptors and a kit-local table of harness facts is prohibited as the R-021 regression vector. The conformance kit generator also becomes the packaging pipeline's first end-to-end internal consumer; the compiler, adapters, and distributable model remain owned here unchanged.

- R-ADAPT-1 (MUST): every adapter's paths, manifest shapes, and registration steps are verified against the real harness, not assumed from a path template; each adapter declaration carries a verification reference naming where the contract was confirmed and a verification status, and an adapter whose contract is unverified may produce only export-only or provisional output and MUST NOT carry a support claim.
- R-ADAPT-2 (MUST): the Codex adapter follows the verified Codex contract — a plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry such as `.agents/plugins/marketplace.json` or a configured marketplace source, and a skills bundle uses direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure; this supersedes the current Codex adapter, which declares a plugin path of `.agents/plugins/{packageId}` and writes a descriptor payload, and both the path and the payload must be corrected.
- R-ADAPT-3 (MUST): the Claude Code adapter lowers a plugin to `.claude/plugins/{id}/plugin.json` and a skill to `.claude/skills/{id}/SKILL.md`, or to agents-standard `.agents/skills` for the portable profile; Claude Code supports hooks, so event-bound steps lower to its hook points, and the adapter must be reviewed against the actual Claude Code plugin and skill contract before its support status moves beyond provisional.
- R-ADAPT-4 (MUST): the Pi adapter supports skills, MCP, and extensions but not hooks; its richest native container is an extension bundled with one or more skills, and event-bound steps degrade to a documented manual step or skill instruction, or fail closed, per R-CAP-4.
- R-ADAPT-5 (MUST): an unknown harness identifier, an unsupported output kind, an unsupported surface, or a scope the adapter cannot honor fails closed before any write, consistent with the existing stop reasons, and a fixture adapter exercises the unsupported path so the fail-closed behavior is itself tested.

### Marketplace and Registration Seam (R-MKT)

- R-MKT-1 (MUST): registration and marketplace files are generated into the distributable, but a user's global marketplace MUST NOT be auto-mutated without an explicit global scope and approval; the default is to generate but not install.
- R-MKT-2 (MAY): a config-gated policy seam in the global store may later opt into auto-registration where a stop-and-approve step would disrupt a deliberate workflow cadence; the opt-in is additive and off by default, and the store itself is owned by the Runtime and Global Store lineage.

### Provenance, Lifecycle, and Support (R-PROV)

- R-PROV-1 (MUST): every generated artifact carries Playbook provenance — source ref and digest, package profile, adapter id, output kind, generated files, ownership status, and support status.
- R-PROV-2 (MUST): backup and uninstall remove only Make Docs-owned generated outputs, without orphaning empty managed directories or deleting user-authored files; this is proven by a conformance scenario in the conformance design.
- R-PROV-3 (MUST): support claims remain provisional until conformance evidence exists and are bound to the exact tuple of scenario, harness, surface, scope, output kind, model or provider, and runtime.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that a generated distributable is a multi-file, harness-native tree and not a Make Docs descriptor.
- R-TEST-2 (MUST): a test asserts that generated Codex plugin output contains `.codex-plugin/plugin.json` and a marketplace registration entry, and that the Codex skills-bundle output uses `.agents/skills/{id}/SKILL.md`.
- R-TEST-3 (MUST): tests cover adapter fail-closed behavior for an unknown harness, an unsupported output kind, and an unsupported surface, using the fixture adapter.
- R-TEST-4 (MUST): tests cover dependency materialization per kind, the deterministic-versus-agent-assisted generation gate, provenance and ownership records, and backup and uninstall cleanliness.
- R-TEST-5 (MUST): real-harness recognition, installation, and invocation are proven by the conformance design, not by unit tests; unit and integration tests here MUST NOT be read as evidence that a harness recognizes the output.

The design's D9 section fixes the harness-native multi-file distributable, the verified adapter contracts and the verified Codex, Claude Code, and Pi shapes, the capability descriptor as the single home of harness-specific packaging knowledge, the two-granularities model and native-versus-portable profile interpretation of `outputKind`, fail-before-write on unresolved review, and generate-but-do-not-auto-register as the default as non-substitutable, while leaving the internal compiler structure, the exact organization of generated files within the harness's layout constraints, the prompt wording for agent-assisted proposals, and the internal structure of each adapter module to the implementer.

Code anchors:

- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/operations/playbook.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`

## Impacted Docs and Dependencies

### Change Notes

- Enhanced by [37-enhance-playbook-and-package-conformance.md](./37-enhance-playbook-and-package-conformance.md). The downstream conformance dependency recorded below as planned W18 R9 has landed: real-harness recognition, installation, invocation, and uninstall evidence — including the R-PROV-2 backup/uninstall cleanliness scenario — is owned by the W18 R9 tuple registry and evidence bar, and the R-TEST-5 boundary that unit and integration tests are not harness-recognition evidence is carried there as the test-layer separation rule.

- Enhanced by [39-revise-cli-command-reorganization-and-operation-registry.md](./39-revise-cli-command-reorganization-and-operation-registry.md). The operation-registry external contract recorded below against the CLI reorganization artifact is now active as W18 R11: PRD 39 owns the append-only registry and stable identifiers the generated `cli` dependency checks reference per R-DEPMAT-1, keeps the compiler and adapters in modular operation domains through the shared operation core, and fixes `run package` — plan, surface-resolve, and write — as the packaging operations' CLI surface; the compiler, adapters, and distributable model remain owned here.

- Enhanced by [41-revise-cli-human-experience-and-package-grammar.md](./41-revise-cli-human-experience-and-package-grammar.md). The packaging operations' CLI surface becomes the intent-named `plan`/`preview`/`write` grammar with the `--write` flag retired, and gains the registered `package.ship` composite that executes plan → preview → write through the operation core, aborting at the first stop, unresolved proposal, or warning; this PRD's pipeline, review rails, and every fail-before-write stop are composed unchanged — the enhancement changes how intent is spelled and adds a single-entry path, not what is allowed.

- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): the `plugin` output-kind reading and the descriptor-era accepted output under Capability Addition or Enhancement, and the adapter `path templates` declaration under Contracts and Data, are superseded; the reviewed pipeline, rails, agent-assistance limits, surfaces, scopes, adapter registry, provenance, lifecycle, and support gating remain active there.
- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md): consumed unchanged — the compiler consumes the single parsed Playbook model with its rich steps, typed dependency registry, and activation content, and PRD 34's R-DEP-5 already routes dependency materialization ownership to the packaging lineage this PRD now carries; no annotation is required there.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): consumed unchanged — the run-time capability question stays with the runner while the shared harness registry answers both questions; no annotation is required there.
- [28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md): consumed unchanged — the canonical payload, symlink-preferred exposure with copy-mirror fallback, and manifest ownership records are reused as-is per R-COMP-2; no annotation is required there.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): consumed unchanged — the plugin substrate and workflow bundles continue to consume the packaging contract through PRD 33's change-note chain, and its generated-from metadata fields (source refs, digests, package plan id, harness, output kind, surface, adapter id, review status, support status) remain accurate for the corrected outputs; no annotation is required there.
- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): consumed unchanged — tuple-bound support-claim gating is preserved per R-KEEP-1 and R-PROV-3; no annotation is required there.
- Downstream dependency: real-harness recognition, installation, and invocation evidence — including the R-PROV-2 backup/uninstall cleanliness scenario — is owned by the conformance design and its tuple registry ([../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md) Section 9, planned next as W18 R9); this PRD references that evidence bar and keeps support claims provisional until it exists.
- External contracts consumed: the operation registry and stable operation identifiers ([../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)) referenced by generated `cli` dependency checks per R-DEPMAT-1, the global store hosting the R-MKT-2 opt-in seam ([../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)), and the CLI/MCP operation-boundary rules in [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) that keep the compiler and adapters in modular operation domains.

Code anchors:

- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/operations/playbook.ts`
- `scripts/smoke-pack.mjs`

## Required Baseline Annotations

- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): `Superseded by` under Capability Addition or Enhancement for the `plugin` output-kind reading and the descriptor-era accepted output, and `Superseded by` appended newest-last to the existing Contracts and Data Change Notes for the adapter `path templates` declaration and the descriptor-era output writer.
- [00-index.md](00-index.md): add PRD 36 to the reading order, document map, source anchors, audience paths, and intended follow-on.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): extend the existing R-017 decision with the W18 R8 compiler correction, capability descriptor, and verified adapter contracts, and add a new rebuild risk for adapter contracts regressing to assumed paths and support claims outrunning conformance evidence.

## Source Anchors

- [../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md](../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md)
- [../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md](../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](34-revise-playbook-contract-and-model.md)
- [35 Revise Run Playbook State Machine](35-revise-run-playbook-state-machine.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/operations/playbook.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `scripts/smoke-pack.mjs`
