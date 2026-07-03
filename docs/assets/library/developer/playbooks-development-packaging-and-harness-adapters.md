---
title: "Playbook Packaging and Harness Adapters"
kind: "guide"
status: "draft"
path: "playbooks/development"
persona: "developer"
order: 110
tags:
  - playbooks
  - packaging
  - harness-adapters
  - plugins
  - skills
applies-to:
  - playbooks
  - plugins
  - skills
  - cli
  - mcp
related:
  - ./playbooks-development-runner-architecture.md
  - ../user/playbooks-packaging-shareable-agent-workflows.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
  - ../../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md
  - ../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md
  - ../../../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md
---

# Playbook Packaging and Harness Adapters

This guide explains the v2 architecture Make Docs uses for packaging Playbooks into harness-specific plugins or skills bundles. It is written for maintainers and contributors who will implement or extend the package planner, harness capability descriptors, harness adapters, output writers, lifecycle behavior, and validation.

The W18 R8 lineage ([PRD 36](../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)) revises this surface into a real compiler: harness-specific packaging knowledge moves into capability descriptors, one shared harness registry answers both the packaging-time and run-time capability questions, and one abstract distributable maps onto many concrete harness containers through the two-granularities model. Since W18 R8 Phase 2 that compiler is implemented: the output writer emits a multi-file, harness-native distributable inventory, and the defective code path that emitted a Make Docs descriptor as the installable artifact is deleted. The W18 R5 pipeline, deterministic rails, target model, and adapter registry described below are preserved unchanged around that revision.

## Architectural Boundary

Playbooks are source. Generated plugins and skills bundles are distribution artifacts. A Playbook remains valid when it is never packaged, and a generated package must carry provenance back to the Playbook refs and source digests that produced it.

The packaging system should be built as modular TypeScript operation domains:

- package planner: validates Playbook sources and creates reviewable package plans;
- harness adapter registry: declares harness-specific output kinds, surfaces, paths, preconditions, and lifecycle rules;
- surface resolver: chooses native, agents-standard, or export-only surfaces from adapter rules and user intent;
- output writers: write accepted plugin or skills-bundle outputs;
- lifecycle integration: records manifest ownership, audit classification, backup, uninstall, stale-output cleanup, and safe pruning;
- conformance hooks: prove support claims for exact generated-output tuples.

CLI commands, MCP tools, plugins, skills, and agent-facing surfaces should delegate to these domains. They should not implement independent packaging or lifecycle behavior.

## Current Operation Domain

The current implementation lives under `packages/cli/src/operations/playbook-packaging/` and exports:

- `types.ts` for package-plan, generated-output, and harness-adapter declaration contracts;
- `validation.ts` for fail-closed validation helpers;
- `capability-descriptor.ts` for the harness capability descriptor shape, its invariant validation, and the adapter-derivation helpers;
- `descriptors.ts` for the first-party and fixture capability descriptor data;
- `distributable.ts` for the two-granularities distributable model, implied-agentics derivation, and container selection;
- `planner.ts` for deterministic package-plan generation and dry-run rendering;
- `compiler.ts` for the packaging compiler: inventory compilation, shared source loading, and digest-verified write-time source loading;
- `materialization.ts` for per-kind dependency materialization;
- `adapters.ts` for first-party and fixture harness adapter declarations, derived from the capability descriptors;
- `surface-resolution.ts` for adapter-owned surface, path, precondition, and exposure-mode resolution;
- `writers.ts` for staging the compiled distributable tree, generated-output records, manifest ownership, and lifecycle stops;
- `index.ts` for the public operation-domain export and helper exports.

The shared harness registry lives one level up at `packages/cli/src/operations/harness-registry.ts` because it serves both the packaging domain and the Run Playbook runner; see Shared Harness Registry below.

`playbookPackagingDomain` is registered in the shared operations registry with read-only plan and surface-resolve operations plus the mutating write operation, exposed on the CLI as `make-docs run package plan|surface-resolve|write`. The write operation dry-runs by default and only mutates when `--write` is passed.

Maintainers should import schema helpers from `packages/cli/src/operations/playbook-packaging/` or the operations facade, not duplicate literals in planner, writer, adapter, CLI, or MCP code. When adding fields, update the TypeScript contract, fail-closed validator, and focused schema tests together.

## Harness Capability Descriptors

Since W18 R8 Phase 1, the harness capability descriptor is the single home of harness-specific packaging knowledge (R-CAP-2). No harness paths, manifest filenames, hook mappings, exposure modes, or registration steps should be declared anywhere except a descriptor in `descriptors.ts` and the adapter that derives from it. If a change needs a new harness path or manifest shape, it belongs in the descriptor, not in planner, resolver, writer, CLI, or MCP code.

Each `HarnessCapabilityDescriptor` declares:

- the canonical `harnessId`;
- `supportedPrimitives`: the agentic primitives the harness can host (`skill`, `plugin`, `extension`, `hook`, `mcp-server`);
- `containers[]`: each with a container kind (`plugin`, `extension`, or `skills-directory`), a `native` or `portable` distributable profile, a richness rank used for container selection, the primitives the container can host, a layout of per-surface and per-scope path placements using sanitized placeholders, a manifest filename, a skill file template, and registration files;
- `lifecycleEventMap`: logical Playbook events mapped to the harness's hook points;
- supported exposure modes;
- the registration model, whose `autoRegister` field is typed as `false` so a user's marketplace or global registration surface can never be auto-mutated (R-MKT-1) — registration files are generated into the distributable instead;
- preconditions;
- `verification`: a status (`provisional` or `verified`), a reference naming where the contract was confirmed, and provisional notes (R-ADAPT-1).

`validateHarnessCapabilityDescriptor` enforces the shape invariants at construction, so malformed descriptor data fails at module load rather than at packaging time. `deriveAdapterDeclarationCore` and `deriveAdapterPathTemplates` derive an adapter's path templates, preconditions, and exposure modes from the descriptor; the W18 R5 adapter declarations in `adapters.ts` now read that derived data instead of restating paths, and the derived output is byte-identical to the previous inline declarations, so resolver and writer behavior did not change.

First-party descriptors currently exist for:

- `codex`: the verified Codex plugin shape from the design is declared on the container — a `.codex-plugin/plugin.json` manifest plus an `.agents/plugins/marketplace.json` registration file (R-ADAPT-2) — while the placement roots deliberately keep the W18 R5 shapes so the Phase 2 writer rebuild lands against a stable resolver; Phase 3 owns moving the roots to the verified locations.
- `claude-code`: five session-lifecycle events map to `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, and `PostToolUse`; the git events (`on-pre-commit`, `on-post-commit`, `on-pre-push`) have no Claude Code hook points and are deliberately unmapped so event-bound steps on them degrade or fail closed per R-CAP-4/R-CAP-5.
- `pi`: supports skills, extensions, and MCP servers but not hooks, and its richest native container is an extension (R-ADAPT-4); all of its paths are inferred and flagged in `verification.provisionalNotes`. Pi has a descriptor but deliberately no adapter module yet — the registry can answer both capability questions for Pi while the Pi adapter contract itself lands in Phase 3.
- the fixture `future-harness` descriptor, which exercises additive registration and the fail-closed paths.

Every first-party descriptor's verification status is `provisional` pending the W18 R8 Phase 3 real-harness verification pass. Until a descriptor is `verified`, its content is never harness-recognition evidence, and unit or integration tests over descriptor data must not be read as proof that a harness recognizes generated output (R-TEST-5).

## Shared Harness Registry

One harness registry answers both capability questions (R-CAP-1). `packages/cli/src/operations/harness-registry.ts` keys entries by canonical harness id; each `HarnessRegistryEntry` carries the packaging capability descriptor plus an identity-only `runtimeCapability.recordKey` link to the runner's reviewed-capability config records.

- The packaging-time question — can this harness host a given agentic primitive — is answered here by `canHarnessHostPrimitive`.
- The run-time question — can this harness execute a step's required surface — stays entirely owned by the W18 R7 `evaluateHarnessCapabilities` evaluator described in [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md). The runner now resolves its config-record key through `resolveRuntimeCapabilityRecordKey`, and unregistered harness ids pass through unchanged, so run-time semantics are untouched: the registry shares harness identity, not behavior.

Extenders must keep that split. Do not move run-time evaluation, reviewed capability records, or serial-fallback policy into the registry, and do not let packaging code consult the runner's capability records to make hosting decisions.

## Two-Granularities Distributable Model

Authoring granularity and distribution granularity are separate (R-CAP-3), and `distributable.ts` models both:

- One Playbook projects to exactly one skill: `projectPlaybookToSkill` is the authoring unit, and skill ids are persona-qualified only when two sources' slugs collide, so the skill-density question never arises.
- The distributable is the distribution unit: a `PackageDistributable` carries the skill projections, the implied agentics, and the container selection. A bundle is multiple Playbooks compiled into one distributable with multiple skills; bundles still do not map one-to-one to plugins.

`deriveImpliedAgentics` reads the parsed W18 R6 Playbook model rather than re-parsing Markdown: event-bound steps imply a `hook`, an `mcp` executor or dependency implies an `mcp-server`, and `plugin`, `skill`, and `playbook` dependencies imply their corresponding primitives.

`outputKind` selects the distributable profile: `plugin` resolves to the harness's richest profile-matching native container per descriptor — a plugin for Codex and Claude Code, an extension for Pi — and `skills-bundle` resolves to the portable agents-standard skills form. No code should hardcode `plugin` as the only native container.

`selectPackageContainer` picks the richest container the harness supports for the chosen profile and lowers each implied agentic explicitly (R-CAP-4/R-CAP-5): `native` (with the mapped hook point for event-bound steps), `degraded-skill-instruction` or `degraded-manual-step` under the `degrade` policy, or a fail-closed unsupported-surface stop under the default `fail-closed` policy. The choice is always declared, never silent: the plan records the policy and every lowering in `fieldProvenance` and `deterministicDerivations`, and the dry-run rendering includes distributable, skills, and degradation lines. The plan input accepts `unsupportedPrimitivePolicy` (`degrade` or `fail-closed`, defaulting to `fail-closed`) on the `package.plan` operation's registry input schema, so the registry-derived MCP tool exposes it; the CLI argument builder in `packages/cli/src/run/cli.ts` does not map a flag for it yet.

Adding a harness stays additive: add a capability descriptor to `descriptors.ts`, an adapter module that derives from it, a registry entry, fixtures, and conformance scenarios. `planner.ts` remains harness-neutral — it delegates to the registry and adapters and contains no per-harness conditionals — and a change that would add one is a design smell to reject in review.

## Package Plans

A package plan is the reviewable bridge between source and output. It should be produced before writes and should record:

- source Playbook refs and source digests;
- output kind, target harness, surface, scope, and package id;
- generated files and ownership classes;
- deterministic fields, user-supplied fields, agent-proposed fields, and unresolved fields;
- review status and reviewer decision;
- support status and conformance requirements;
- lifecycle behavior for install, update, audit, backup, uninstall, and export-only outputs.

Agents may help draft semantic fields such as descriptions, command names, skill grouping, or adapter prose. Those fields are proposals until reviewed. Non-interactive runs must fail before writing when a plan still needs semantic review, ownership review, unsupported-surface resolution, or support-claim evidence.

The current `PlaybookPackagePlan` schema requires a `schemaVersion: 1`, at least one source Playbook, a target, generated artifact inventory, deterministic derivations, agent-assisted proposals, unresolved decisions, field provenance, review state, support state, lifecycle behavior, and validation requirements. Since W18 R8 Phase 1 the plan also carries the deterministic `distributable` — skill projections, implied agentics, and the container selection with its declared degradations — and any unsupported-surface stops from container selection surface as plan stops. Since W18 R8 Phase 2 the planner also compiles the full distributable inventory at plan time through the same `compilePackageInventory` the writer uses, so the reviewed plan carries the deterministic file list in `deterministicDerivations.inventory`, the dry-run rendering includes `Planned payload files:` lines, and every container, materialization, or semantic-resolution stop fails the plan closed before any write. When a source Playbook has no authored summary, the planner drafts a review-gated agent-assisted skill-description proposal instead of silently inventing prose; the proposal gains authority only on plan acceptance. Validation rejects unknown output kinds, unknown surfaces, invalid harness ids, empty source lists, invalid field-provenance values, and plans that contain semantic proposals or unresolved decisions without required review state.

The package planner currently supports a dry-run plan flow through `make-docs run package plan`. It reuses the Run Playbook resolver for explicit paths, `persona/slug` refs, and unique bare slug/title refs; computes stable source digests; validates relative Markdown links and assets outside code spans/fences; marks deterministic, user-supplied, agent-proposed, and unresolved fields; and returns review stops before any writes can occur.

Use the operation like this during development:

```sh
make-docs run package plan \
  --source user/run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --support-evidence-ref docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
```

Non-interactive callers should pass `--non-interactive` when they need fail-before-write behavior. The planner throws before returning a writable result when semantic review, ownership review, unsafe rewrite review, unresolved adapter decisions, unsupported targets, broken source links/assets, ambiguous refs, or missing support evidence would require human review.

## Harness Adapters

Adapters own harness-specific behavior. The core package planner should ask an adapter which outputs and surfaces are valid instead of hard-coding harness rules.

Since W18 R8 Phase 1, adapters no longer restate harness paths, preconditions, or exposure modes inline: those fields are derived from the harness capability descriptor through `deriveAdapterDeclarationCore`, so the descriptor stays the single source and the adapter declaration stays the resolver-facing shape. The derived declarations are byte-identical to the previous W18 R5 inline ones, and the surface resolver and writer consume them unchanged.

Each adapter should declare:

- stable harness id and display metadata;
- supported output kinds such as `plugin` and `skills-bundle`;
- supported surfaces such as native project, native global, agents-standard project, agents-standard global, and export-only;
- path templates with sanitized placeholders such as `<repo-root>` and `<user-home>`;
- preconditions such as project trust, harness installation, plugin support, skill support, config state, or user selection;
- preferred exposure mode and fallback mode;
- ownership classes and lifecycle handling;
- conformance scenarios required before public support claims.

`generic` should not be a harness id. Standard locations are surfaces that real harness adapters may support. The schema currently accepts `plugin` and `skills-bundle` as output kinds and `native`, `agents-standard`, and `auto` as surfaces or surface-selection modes.

Adapter declaration validation requires at least one supported output kind and at least one supported surface. Path templates must only reference output kinds, surfaces, and scopes declared by that adapter so future harness support stays additive instead of requiring planner-specific branching.

Current first-party adapter declarations live in `adapters.ts` for `codex` and `claude-code`. They intentionally model support as internal capability declarations and conformance requirements; public support wording remains provisional unless an exact tuple has evidence. The fixture-only `future-harness` adapter proves new harnesses can add native and agents-standard surfaces without modifying planner code. Pi deliberately has a capability descriptor but no adapter declaration until W18 R8 Phase 3 lands its verified contract: the shared registry can already answer both capability questions for Pi and container selection can already pick its extension container, but surface resolution and writes, which require an adapter declaration, fail closed for `pi` today.

Use surface resolution like this during development:

```sh
make-docs run package surface-resolve \
  --package-id run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

The resolver returns the selected concrete surface, package path, precondition states, lifecycle rules, conformance requirements, preferred exposure mode, fallback mode, and stops. Unknown or unsupported required preconditions route to manual review before writes. `auto` is resolved deterministically by adapter ranking to a concrete surface, preferring native when available and then agents-standard.

Cross-platform exposure follows the W17 R3 native-exposure rule: prefer symlink exposures, use managed copy mirrors when symlinks are unavailable, and never silently generate generic stubs as a fallback. Lifecycle rules returned by the adapter must preserve user-authored files, unlink symlink exposures without following targets, and remove copy mirrors only when reviewed Make Docs ownership and backup evidence exist.

## Packaging Compiler

Since W18 R8 Phase 2, `compiler.ts` is the seam that turns models into files. `compilePackageInventory` produces the distributable inventory as a pure function of the parsed W18 R6 Playbook models plus the target's capability descriptor (R-COMP-3): no filesystem writes, no harness conditionals, no re-parsing. The descriptor supplies the container layout — paths, manifest filename, skill file template, registration files, and the lifecycle event map — and the model supplies the rich step, dependency, and narrative content. Given the same models, plan, and descriptor, the inventory is the same files.

The inventory emits, as applicable per target and model:

- a `SKILL.md` per source Playbook that preserves the workflow intent, trigger description, step instructions, references, and safety boundaries from the model rather than summarizing them away;
- references copied from Playbook authority sources where redistribution is allowed and linked otherwise;
- deterministic dependency-check and helper scripts;
- the harness-native manifest named by the descriptor's `manifestFilename` and `skillFileTemplate`;
- `hooks/hooks.json` from the `native` lifecycle-event lowerings of event-bound steps;
- `registration/*` files from the descriptor's `registrationFiles` — generated into the distributable, never registered anywhere (R-MKT-1); the opt-in install seam is W18 R8 Phase 4;
- Make Docs metadata records under `.make-docs/` inside the container: `dependencies.json`, `registration.json`, `provenance.json`, `lifecycle.json`, and `conformance.json`. None of these is the installable artifact, and no emitted file carries a Make Docs `kind` as its manifest type (R-COMP-1).

Source loading is shared: `loadCompiledSource` reads and parses one plan source through the single Playbook parser, and the planner and compiler consume the same parsed models so the source is parsed once and never re-parsed downstream (R-SCOPE-1). At write time, `loadPackageSourcesForWrite` re-reads each plan source and fails closed before any write when a source is missing or its digest no longer matches the reviewed plan (R-GEN-2) — a reviewed plan must describe the sources actually compiled.

### File Organization

The exact organization of generated files within the harness's layout constraints is an implementer decision (D9), recorded in the `compiler.ts` doc comment:

- Containers with a harness manifest place skills at the descriptor's `skillFileTemplate` (`skills/{skillId}/SKILL.md` for the first-party descriptors).
- A `skills-directory` container is itself the skill directory: a single-skill distributable puts `SKILL.md` at the container root so direct `.agents/skills/{id}/SKILL.md` discovery holds, and a multi-skill portable bundle emits a root index `SKILL.md` plus one `{skillId}/SKILL.md` per member skill.
- Shared supporting files live at the container root: `references/`, `checks/`, `scripts/`, `hooks/`, and `registration/`.
- The harness manifest's `version` is a constant `0.1.0` until a versioning policy lands with the lifecycle lineage; every other manifest field derives deterministically from the plan and descriptor.

### Dependency Materialization

`materialization.ts` implements R-DEPMAT-1: the dependency kind declared in the Playbook dependency registry determines exactly how the compiler materializes it.

| Dependency kind | Materialization |
| --- | --- |
| `cli`, `package-manager` | Executable `checks/{id}.sh` script plus human instructions in the skill text. |
| `skill`, `plugin` | Harness-native manifest reference where the selected container carries a manifest that can host the primitive; explicit declared degradation in the skill text where it cannot (R-CAP-4). |
| `mcp`, `external-service` | `runtimeCheck` metadata in the distributable's dependency declarations plus a runtime availability check script. |
| `reference` | Copied into `references/{id}/` where redistribution is allowed; linked otherwise. |
| `playbook` | An additional bundled-skill pointer when the referenced Playbook is in the bundle; a referenced-playbook entry when not. |
| `script`, `asset` | Documented-only: human instructions plus a dependency-declaration record. R-DEPMAT-1 assigns these W18 R6 kinds no artifact, so the compiler deliberately invents none (D9). |

A `cli` dependency on Make Docs itself references the stable operation identifier, never a CLI command string, so generated outputs survive CLI reorganization: the check script carries `# stable-reference: operation:{id}` as the durable reference, and the human command form shown alongside it is derived from the registry's `operationCliPath` at compile time. The registry is consulted at compile time only, which keeps the registry-to-compiler import safe inside the module cycle.

Two more recorded implementer decisions (D9): the redistribution heuristic treats a reference whose source resolves to a repository-local file as first-party copyable content, while URLs and non-path sources are linked — and a required reference that looks like a repository path but does not resolve is a missing dependency that fails closed before writes. Runtime availability checks for `mcp`/`external-service` cannot probe a harness configuration portably, so the generated script honors an explicit `MAKE_DOCS_DEP_<ID>_AVAILABLE=1` override and otherwise exits `3` (verification required); the authoritative runtime evaluation belongs to the W18 R7 runner, which consumes the metadata record.

### Two-Tier Generation and Provenance

Generation is two-tier with the boundary recorded in field provenance (R-GEN-1). Schema-owned fields — file paths, manifest structure, dependency checks, digests — are always deterministic. Semantic fields — skill descriptions and triggers, bundle grouping, harness-facing prose — are deterministic when they come straight from the source (an authored Playbook summary) and review-gated agent-assisted proposals otherwise, gaining authority only when the package plan is accepted.

The compiled `.make-docs/provenance.json` record carries the boundary explicitly: `generationTiers` groups every field by tier, alongside source refs and digests, the distributable profile, the adapter id, the generated file list, ownership status, and support status. Every `PackageInventoryFile` also carries its own `tier` (`deterministic` or `agent-proposed`) and `sourceRefs`.

### Fail Before Write

The fail-before-write rule (R-GEN-2) is enforced in both the planner and the writer, so a stale or unreviewed plan cannot slip through either surface. Before any write, these conditions stop the operation: unresolved semantic proposals or required review, ownership conflicts, missing dependencies (including unresolvable required references), unsupported surfaces or containers, missing or stale sources (digest mismatch against the reviewed plan), a missing Make Docs manifest for installed outputs, modified existing generated output without reviewed overwrite, and stale-output removal without a reviewed backup snapshot. Non-interactive runs stop before writing.

Unit tests over the compiled inventory assert shape only; real-harness recognition evidence is owned by the W18 R9 conformance lineage (R-TEST-5).

## Output Writers

Output writers write only after an accepted package plan exists or after the planner proves the output is fully deterministic and safe. Since W18 R8 Phase 2, `writers.ts` stages the compiled distributable tree from `compilePackageInventory` — it compiles the harness-native inventory before any write decision so source staleness, container support, dependency materialization, and semantic resolution all fail closed first, and its result reports the container-relative `payloadFiles` it staged. The W18 R5-era `renderPackageContent` path, which emitted a descriptor with `kind: make-docs.playbook-package.plugin` as the installable artifact, is deleted: no packaging path emits a Make Docs descriptor as an installable artifact (R-COMP-1).

Writers distinguish:

- source Playbooks;
- generated plugin payloads;
- generated skills-bundle payloads;
- generated adapters;
- symlink exposures;
- managed copy mirrors;
- export-only files;
- user-authored files;
- legacy generated outputs.

Installed generated outputs should reuse the selected-agentics storage and native exposure contracts. Plugin payloads use `.make-docs/agentics/plugins/**`; skill payloads use `.make-docs/agentics/skills/**`. Harness exposures prefer symlinks and use managed copy mirrors as the compatibility fallback.

The Phase 2 rebuild changed only the payload, not the plumbing (R-COMP-2): the canonical payload under `.make-docs/agentics/{plugins|skills}/{id}`, the symlink or copy-mirror exposure at the harness path, per-file manifest ownership records for both the canonical tree and the mirror, backup-reviewed stale-output removal, and owned-output-only cleanup are all preserved byte-for-byte from the PRD 28 contract. Extenders changing the compiler must not touch the exposure plumbing, and changes to the exposure plumbing belong to the shared-agentics lineage, not here.

Use the writer operation like this during development:

```sh
make-docs run package write \
  --plan-json /path/to/package-plan.json \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

Without `--write`, the command returns write diagnostics and generated-output records but does not touch files. With `--write`, installed outputs require an existing Make Docs manifest so audit, backup, uninstall, and migration can see the generated files. Export-only output writes under `.make-docs/exports/playbook-packages/**` and does not add installed harness exposure ownership to the manifest.

The writer records source refs, source digests, target harness, output kind, surface, scope, support status, review status, canonical payload path, exposure path, and exposure mode. It stops before writing when required review is incomplete, an `auto` surface has not been resolved, required adapter preconditions are unknown or unsupported, an existing generated output differs, a plan source is missing or fails its digest check, the compiled inventory raises a container or materialization stop, or stale generated output removal lacks a reviewed backup snapshot — see Fail Before Write above for the full condition set.

When symlinks are available, installed plugin and skills-bundle outputs expose the shared payload directory through a harness-native or standard location. When symlinks are unavailable, the writer creates managed copy mirrors and records `copy-mirror` ownership instead of generating generic stubs.

## Validation

Implementation should include focused tests for:

- deterministic package plans;
- plans requiring semantic review;
- schema serialization for package plans, generated-output records, and adapter declarations;
- invalid Playbook sources;
- broken links and assets;
- unsupported output kinds and surfaces;
- invalid harness ids, including `generic`;
- future-harness adapter fixtures;
- adapter path templates that reference unsupported surfaces or scopes;
- symlink and copy-mirror fallback;
- modified generated-output preservation;
- stale generated-output cleanup;
- manifest/audit/backup/uninstall behavior;
- package smoke and conformance support claims.

Public support wording should cite evidence for the exact Playbook, package plan, output kind, harness, surface, scope, model/provider, and runtime tuple.

Current focused schema coverage lives in `packages/cli/tests/playbook-packaging.test.ts`. Keep those tests fail-closed: new enum values, ownership classes, support states, surfaces, or lifecycle dispositions should require deliberate test updates rather than passing through as arbitrary strings.

Current package-planner coverage also lives in `packages/cli/tests/playbook-packaging.test.ts`. It covers deterministic single-Playbook plans, multi-Playbook skills-bundle plans that require semantic review, broken relative links and assets, ambiguous source refs, modified generated-output review stops, non-interactive review stops, and CLI dry-run JSON output.

Current adapter and surface-resolution coverage lives in the same test file. It covers first-party adapter lookup, `generic` rejection, native and agents-standard surface resolution, `auto` surface selection, required-precondition review stops, Windows copy-mirror fallback when symlinks are unavailable, future-harness fixture additivity, and CLI surface-resolution JSON output.

Current writer and lifecycle coverage lives in the same test file. It covers plugin payload writes, skills-bundle writes, symlink exposure, copy-mirror fallback, manifest ownership, export-only separation, modified generated-output review stops, reviewed stale-output cleanup, and CLI dry-run/write JSON output.

Current compiler and materialization coverage lives in `packages/cli/tests/playbook-packaging-compiler.test.ts`. It covers the multi-file harness-native tree with no Make Docs descriptor payload (R-TEST-1), the Codex `.codex-plugin/plugin.json` and `.agents/skills/{id}/SKILL.md` shape assertions (R-TEST-2), skill-content preservation of intent, triggers, steps, references, and safety boundaries, every dependency kind's R-DEPMAT-1 materialization including bundled-playbook skills and explicit degradation without a hosting manifest, event-bound hook compilation, the two-tier provenance boundary, review-gated skill-description proposals, fail-closed behavior on missing required references and stale sources, per-file PRD 28 ownership records for both exposure modes (R-COMP-2), and generate-but-do-not-register registration files (R-MKT-1). These are shape assertions only, not harness-recognition evidence (R-TEST-5).

Current capability-descriptor, shared-registry, and distributable coverage lives in `packages/cli/tests/playbook-packaging-capability.test.ts`. It covers descriptor invariant validation, the byte-parity of derived adapter declarations with the previous W18 R5 inline shapes, both registry capability questions including unregistered-id passthrough for the runtime record key, one-Playbook-one-skill projection with collision-only persona qualification, implied-agentics derivation from the parsed model, richest-container selection per profile (including Pi's extension), declared degradation versus fail-closed stops under both policies, event-bound hook lowering on harnesses with and without hook support, and the distributable and degradation lines in plan provenance and dry-run output.

## Future Coverage

- Blocked by: W18 R8 Phase 3 (real-harness verification and verified adapter contracts). Update when: first-party descriptors gain `verified` status, the Pi adapter lands, and the Codex placement roots move from the W18 R5 shapes to the verified locations. Guide change: replace the provisional-verification caveats with the verified contracts and document the Pi adapter alongside `codex` and `claude-code`.
- Blocked by: W18 R8 Phase 4 (marketplace, registration, provenance, and lifecycle). Update when: the config-gated opt-in registration seam lands against the generated `registration/*` files and `.make-docs/registration.json` seam record. Guide change: document the opt-in install path, its global-store configuration home, and how it consumes the Phase 2 generate-but-do-not-register outputs.

## Related Resources

- [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md)
- [Packaging Shareable Playbook Workflows](../user/playbooks-packaging-shareable-agent-workflows.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [Playbook Packaging Compiler and Harness Adapters](../../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [W18 R5 Work Backlog](../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md)
- [W18 R8 Work Backlog](../../../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md)
