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
  - ./conformance-lab-scenario-and-result-contracts.md
  - ../user/playbooks-packaging-shareable-agent-workflows.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
  - ../../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md
  - ../../../prd/40-revise-playbook-authoring-contract-v2.md
  - ../../../prd/41-revise-cli-human-experience-and-package-grammar.md
  - ../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md
  - ../../../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md
---

# Playbook Packaging and Harness Adapters

This guide explains the v2 architecture Make Docs uses for packaging Playbooks into harness-specific plugins or skills bundles. It is written for maintainers and contributors who will implement or extend the package planner, harness capability descriptors, harness adapters, output writers, lifecycle behavior, and validation.

The W18 R8 lineage ([PRD 36](../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)) revises this surface into a real compiler: harness-specific packaging knowledge moves into capability descriptors, one shared harness registry answers both the packaging-time and run-time capability questions, and one abstract distributable maps onto many concrete harness containers through the two-granularities model. Since W18 R8 Phase 2 that compiler is implemented: the output writer emits a multi-file, harness-native distributable inventory, and the defective code path that emitted a Make Docs descriptor as the installable artifact is deleted. Since W18 R8 Phase 3, verification rides every adapter contract: each adapter declaration carries a verification status, reference, and contract digest, support claims are capped by verification status at two independent enforcement points, the Codex placement roots moved to the verified locations, and the Claude Code and Pi adapters landed against their declared shapes. Since W18 R8 Phase 4, distribution is safe by construction: the marketplace registration seam records the auto-registration opt-in but always refuses to install, a writer guard fails closed on any write that would land on a registration surface, packaging provenance rides the manifest and audit records as well as the in-tree provenance record, backup and uninstall are proven against real written packages, and every support claim is bound to its exact conformance tuple. Since W18 R8 Phase 5, the wave is complete: the D10 verification suite audits the whole packaging test surface against R-TEST-1 through R-TEST-5, fills the coverage gaps the earlier phases left implicit, and enforces the evidence boundary structurally — see D10 Verification Suite under Validation below. The W18 R5 pipeline, deterministic rails, target model, and adapter registry described below are preserved unchanged around that revision.

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
- `registration-seam.ts` for the marketplace registration seam: the R-MKT-2 opt-in read, the per-write seam decision, and the R-MKT-1 global-marketplace protection guard;
- `support-binding.ts` for the R-PROV-3 support-claim tuple and its binding gate;
- `index.ts` for the public operation-domain export and helper exports.

The shared harness registry lives one level up at `packages/cli/src/operations/harness-registry.ts` because it serves both the packaging domain and the Run Playbook runner; see Shared Harness Registry below.

`playbookPackagingDomain` is registered in the shared operations registry with read-only plan and surface-resolve operations plus the mutating write operation and the `package.ship` composite, exposed on the CLI as `make-docs run package plan|surface-resolve|preview|write|ship` (W18 R12). The grammar is intent-named: `preview` is the full write pipeline with no writes (the CLI spelling of `package.write` under the dry-run context), `write` writes, `plan --output <path>` saves the reviewable plan artifact directly, and `ship` runs plan, preview, and write end-to-end, aborting at the first stop, unresolved proposal, or warning. The `--write` flag is retired and fails with guidance naming this grammar; the operations, their dry-run inputs, and the MCP tools are unchanged. The mechanics are documented in CLI Grammar and the Ship Composite below.

Maintainers should import schema helpers from `packages/cli/src/operations/playbook-packaging/` or the operations facade, not duplicate literals in planner, writer, adapter, CLI, or MCP code. When adding fields, update the TypeScript contract, fail-closed validator, and focused schema tests together.

## CLI Grammar and the Ship Composite

Since W18 R12 Phase 3, the packaging CLI grammar is intent-named per [PRD 41](../../../prd/41-revise-cli-human-experience-and-package-grammar.md) R-GRAM-1..3, under the round's governing agent-invariance rule (R-INV-1): operation results, MCP tool output, and the machine-readable CLI output stay byte-identical to the pre-remediation shapes except for additive fields and flags. Two distinct mechanisms realize the grammar, and extenders must keep them distinct.

**CLI spellings.** `run package preview` is a CLI spelling, not an operation: `RUN_CLI_SPELLINGS` in `packages/cli/src/run/cli.ts` maps the spelled path `package.preview` to the unchanged `package.write` registry identifier plus a fixed execution-context overlay (`dryRun: true`). A spelling is presentation-layer routing only — no new registry identifier is minted, the operation's input and dry-run semantics are untouched, and the MCP surface never sees it (R-GRAM-2). This is exactly why preview is a spelling rather than a registered `package.preview` operation: the dry-run-context path through `package.write` already was the full no-writes pipeline, and minting a second identifier for it would change the agent-facing surface the invariance rule freezes. The spelling table participates in path resolution, derived help (rendered inside its domain group), and the unknown-operation listing, and `listRunCliSpellings` is the conformance seam that pins each spelling to its registry identifier. The complement rule is the W18 R11 parity rule restated: composites must be real registered operations — never spellings — and spellings must never compose or alter behavior beyond a declared context overlay.

**The retired `--write` flag.** `run package write` now writes with the default context, with every precondition, digest-mismatch stop, ownership-conflict stop, and fail-before-write rail unchanged (R-GRAM-1); the old `write`-as-dry-run spelling is not aliased, and passing `--write` to `write` or `ship` fails with guidance naming `preview`, `write`, `plan --output`, and `ship` (R-GRAM-2).

**`plan --output <path>`.** The plan artifact handoff (UAT X3) is handled at the CLI surface: after a successful `package.plan` invocation the dispatcher writes the result's `plan` object — exactly what `package.write --plan-json` consumes — to the caller-named path, mirroring `run playbook run export --output`. Stdout is unchanged. This lives at the surface deliberately: `package.plan` stays classified `read` in the registry, because reclassifying it (or adding a write-classified plan variant) would change the agent-facing gating the operation core applies from the mutation classification (R-INV-1).

**`package.ship`.** The composite is a real registered operation in `packages/cli/src/operations/package/ops/ship.ts` — appended to the registry with a zod input contract and `mutates: "write"`, surfaced as `run package ship`, and derived to MCP as `make_docs_package_ship` like every other operation (R-GRAM-3; the registry addition is the only MCP surface diff, with the derivation/consistency pins extended accordingly). It executes plan → preview → write as nested `invokeOperation` calls through the operation core, so validation, write gating, dry-run, and named approvals are enforced uniformly on every leg — ship never widens what `package.write` allows; it only removes ceremony from the zero-unresolved path. The abort contract: any plan stop, agent-assisted proposal, or unresolved decision aborts at the `plan` stage; any preview stop aborts at the `preview` stage before the write leg runs; the result is `{status: "aborted", stage, guidance, stops}` with `guidance` naming the granular command to continue with. A plan with zero unresolved items ships end-to-end with the classification write recorded, and under a dry-run context the composite returns `status: "planned"` without writing. The preview leg is the same `package.write`-under-dry-run the `preview` spelling names, and the write leg recomputes every fail-before-write stop itself, so nothing that changed between preview and write can slip through.

**Precondition config absorption.** The `--precondition k=v` ceremony is absorbable into the project config's `packaging.preconditions` block in `.make-docs/config.yaml` (R-FLAG-2), keyed by adapter precondition id with values from the shared `satisfied`/`unknown`/`unsupported` vocabulary (`PACKAGING_PRECONDITION_STATES` in `packages/cli/src/config.ts`, mirroring `PackageAdapterPreconditionState`). The CLI adapters for `write`, `preview`, and `ship` merge config-supplied defaults under explicit `--precondition` flags, which always win per key; a missing or invalid block contributes nothing and changes no behavior — config stays convenience, never authority, per the `harnessCapabilities` precedent in [PRD 24](../../../prd/24-revise-configuration-convention-overlay.md). The MCP tools are untouched: absorption happens in the CLI argv adapters, and MCP callers pass `preconditions` explicitly as before. The block currently has no shipped template reference documentation — the shipped template documents no config schema at all, a gap tracked as register item [D-017](../../../prd/03-open-questions-and-risk-register.md); the authoritative shape lives on the config loader's doc comments and this section until that documentation is authored upstream.

The Phase 3 grammar, ship, render-invariance, and ergonomics coverage lives in `packages/cli/tests/run-cli-experience.test.ts` (PRD 41 R-TEST-4..6): `plan --output` writes the reviewable plan, `preview` writes nothing under any input (proven with filesystem snapshots), `write` preserves every existing stop, the retired `--write` spelling fails with the grammar guidance, ship completes end-to-end on a zero-unresolved plan and aborts before any disk write at the first stop with granular-command guidance, `package.ship` is present in the registry and derives to MCP, and the `--json`/non-TTY CLI channels stay byte-identical. The TTY render layer over these commands is CLI-only presentation, documented in [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md) under CLI Render Layer and Ergonomics.

## Harness Capability Descriptors

Since W18 R8 Phase 1, the harness capability descriptor is the single home of harness-specific packaging knowledge (R-CAP-2). No harness paths, manifest filenames, hook mappings, exposure modes, or registration steps should be declared anywhere except a descriptor in `descriptors.ts` and the adapter that derives from it. If a change needs a new harness path or manifest shape, it belongs in the descriptor, not in planner, resolver, writer, CLI, or MCP code.

Each `HarnessCapabilityDescriptor` declares:

- the canonical `harnessId`;
- `supportedPrimitives`: the agentic primitives the harness can host (`skill`, `plugin`, `extension`, `hook`, `mcp-server`);
- `containers[]`: each with a container kind (`plugin`, `extension`, or `skills-directory`), a `native` or `portable` distributable profile, a richness rank used for container selection, the primitives the container can host, a layout of per-surface and per-scope path placements using sanitized placeholders, a manifest filename, a skill file template, and registration files;
- `lifecycleEventMap`: logical Playbook events mapped to the harness's hook points;
- supported exposure modes;
- the registration model, whose `autoRegister` field is typed as `false` so a user's marketplace or global registration surface can never be auto-mutated (R-MKT-1) — registration files are generated into the distributable instead; since Phase 4, descriptor validation also enforces the model/file pairing: a `marketplace-entry` registration model must declare `registrationFiles` and a `direct-discovery` model must not, and the `codex`, `claude-code`, and `pi` descriptors all conform;
- preconditions;
- `verification`: a status (`provisional` or `verified`), a reference naming where the contract was confirmed, provisional notes, and — since Phase 3 — a `contractDigest` fingerprint of the declared contract surface (R-ADAPT-1).

`validateHarnessCapabilityDescriptor` enforces the shape invariants at construction, so malformed descriptor data fails at module load rather than at packaging time. `deriveAdapterDeclarationCore` and `deriveAdapterPathTemplates` derive an adapter's path templates, preconditions, exposure modes, and — since Phase 3 — the verification block from the descriptor; the adapter declarations in `adapters.ts` read that derived data instead of restating paths, and `validateHarnessAdapterDeclaration` rejects any adapter declaration that lacks a verification reference and status, so no adapter can ship unverifiable (R-ADAPT-1). The Phase 1 derivation was byte-identical to the W18 R5 inline declarations; Phase 3 then deliberately moved the Codex placement roots to the verified locations described below.

First-party descriptors currently exist for:

- `codex` — **verified** (R-ADAPT-2). A plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry that the generated `.agents/plugins/marketplace.json` file provides. The assumed W18 R5 `.agents/plugins/{packageId}` placement root is gone: `.agents/plugins/` holds only the marketplace file. Plugin folders install at Make Docs-chosen roots that the marketplace entry references (a recorded D9 implementer decision): `.codex/plugins/{packageId}` for project scope, `<user-home>/.codex/plugins/{packageId}` for global scope, and `.make-docs/exports/playbook-packages/{packageId}` for export-only. The plugin payload is the Phase 2 compiled tree (the `.codex-plugin/plugin.json` folder), and the skills bundle is direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure. Since Phase 4 the generated marketplace entry is harness-usable as written: the compiler lowers the sanitized `<user-home>/` placeholder to `~` in the entry's install path and carries the package version on the entry.
- `claude-code` — **provisional** (R-ADAPT-3). The lowering is pinned: plugin to `.claude/plugins/{id}/plugin.json`, skill to `.claude/skills/{id}/SKILL.md`, and the portable profile to agents-standard `.agents/skills/{id}/SKILL.md`. Five session-lifecycle events map to `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, and `PostToolUse`; the git events (`on-pre-commit`, `on-post-commit`, `on-pre-push`) have no Claude Code hook points and are deliberately unmapped so event-bound steps on them degrade or fail closed per R-CAP-4/R-CAP-5. The status stays provisional until the declared shapes are reviewed against the actual Claude Code plugin and skill contract.
- `pi` — **provisional** (R-ADAPT-4). Pi supports skills, extensions, and MCP servers but not hooks. Its native profile lowers to the `pi-extension` container — an `extension.json` manifest at `.pi/extensions/{packageId}` (project) or `<user-home>/.pi/extensions/{packageId}` (global) — and its portable profile lowers to agents-standard skills. All of its paths are fully inferred and flagged in `verification.provisionalNotes`. Since Phase 3, Pi also has a real adapter declaration derived from this descriptor; see Harness Adapters below.
- the fixture `future-harness` descriptor, which exercises additive registration and the fail-closed paths, and the Phase 3 fixture `fixture-limited` descriptor — a deliberately narrow native-plugin-only harness with no hook support — which exercises the unsupported-output-kind, unsupported-surface, and un-honorable-scope stops (R-ADAPT-5). Both fixtures are provisional.

### Verification Status and Support Gating

The current per-harness verification statuses and their citations:

| Harness | Status | Verification reference | Contract digest |
| --- | --- | --- | --- |
| `codex` | `verified` | The design's D6/R-ADAPT-2 verified-contract statement plus Section 8 of [the playbook architecture artifact](../../artifacts/playbook-architecture.md); a residual provisional note flags that MCP-server hosting inside the plugin container remains inferred. | `sha256:2033146ce7fa5b71` |
| `claude-code` | `provisional` | The declared R-ADAPT-3 shapes, awaiting review against the actual Claude Code plugin and skill contract. | none (`null`) |
| `pi` | `provisional` | All paths fully inferred; nothing confirmed against a real Pi installation. | none (`null`) |
| `future-harness`, `fixture-limited` | `provisional` | Test fixtures; never installable contracts. | none (`null`) |

Verification status gates support claims at two independent enforcement points (R-ADAPT-1, R-PROV-3):

- The planner calls `capSupportStatusForVerification`, which caps a `validated` support status to `provisional` unless the harness contract is `verified`, and records the gate input in the plan's `deterministicDerivations.adapterVerification`.
- The compiler independently fails closed before any write — a `missing-support-evidence` stop — when a plan claims `validated` support against an unverified adapter, so a hand-edited or stale plan cannot slip a support claim past the gate.

An unverified adapter therefore produces only provisional or export-only output and never carries a support claim. The compiled `.make-docs/conformance.json` record embeds the applied gate as `adapterVerification` — status, reference, and contract digest when one exists — alongside the tuple and evidence refs.

A `verified` contract status is still not harness-recognition evidence: it confirms the declared paths, manifest shapes, and registration steps against the documented harness contract, while recognition, installation, and invocation evidence stays owned by the W18 R9 conformance lineage, so every support status remains tuple-bound and provisional pending that evidence bar (R-PROV-3, R-TEST-5); since Phase 4 the tuple binding itself is structural — see Support-Tuple Binding below.

### Contract-Digest Re-Verification

Re-verification is structural, not procedural. `computeHarnessContractDigest` fingerprints the declared contract surface — container placements, manifest filenames, skill file templates, registration files and registration model, hosted primitives, lifecycle hook points, and exposure modes. A `verified` descriptor records that digest as a source literal at verification time, and `validateHarnessCapabilityDescriptor` recomputes it on every load: any drift between the declared contract and the recorded digest fails closed at module load with a diagnostic demanding re-verification against the real harness and an updated reference and digest (R-ADAPT-1). A `provisional` contract carries a `null` digest but must state what remains unverified in `provisionalNotes`. This is what prevents the triggering-defect regression — a plausible-looking path edit can no longer ride silently under a stale verification claim.

### Support-Tuple Binding and the W18 R9 Promotion Path

Since Phase 4, verification gating has a second, orthogonal cap: tuple binding (R-PROV-3). `support-binding.ts` defines `PackageSupportClaimTuple` with all seven dimensions a support claim binds to — `scenario`, `harness`, `surface`, `scope`, `outputKind`, `modelOrProvider`, and `runtime`. The target-owned dimensions bind from the package target; the evidence-owned dimensions (`scenario`, `modelOrProvider`, `runtime`) stay `null` until W18 R9 conformance evidence binds them, and a `surface` still at `auto` counts as unbound. The tuple is recorded on `PackagePlanSupport.tuple`, and the compiled `.make-docs/conformance.json` carries it as `tupleBinding` with the explicit `unboundDimensions` list.

Enforcement mirrors the verification gate: the planner applies `capSupportStatusForTupleBinding`, which holds any `validated` claim at `provisional` while a dimension is unbound, and the compiler independently fails closed before any write on the same condition, so evidence refs alone never validate a claim. This deliberately corrects a Phase 3 planner behavior — verified-Codex claims had been raised to `validated` on mere evidence refs; they are now capped to `provisional` per R-PROV-3. The promotion path is W18 R9's: a claim moves past `provisional` only when the tuple registry records evidence that fully binds the tuple.

Since W18 R9 Phase 1, the registry end of that promotion path exists. `packages/cli/src/conformance/tuple.ts` extends the seven-dimension claim tuple into the eight-field conformance tuple (PRD 37 R-TUPLE-1) by binding one added dimension, `generatedOutputKind` — the ownership-record kind of what was actually produced, as distinct from the requested `outputKind`: `bindConformanceSupportTuple` consumes the claim tuple as-is, refuses an unresolved `auto` surface as a claim broader than any evidence, and a parity test pins the dimension relationship so the two lineages cannot drift apart silently. `docs/assets/conformance/tuple-registry.json`, loaded fail-closed by `packages/cli/src/conformance/registry.ts`, is the queryable home of tuple statuses: statuses are derived from recorded evidence and a stored status the evidence does not support fails the load, so a claim structurally cannot outrun its evidence at the registry layer either. The registry is seeded with the twenty first-party descriptor-placement tuples at zero `conformance-validated`, matching the provisional caps above. Since W18 R9 Phase 2 the scenario end of the promotion path also exists: the four Codex-first first-pass scenario specs under `docs/assets/conformance/scenarios/` implement the install-discover-invoke-uninstall evidence bar as the scenario shape, and `recordConformanceRunOnRegistryEntry` is the single seam that binds a recorded run onto a registry tuple — no scenario has run yet, so every status is unchanged. The tuple contracts, registry drift-proofing, derivation rules, seed posture, and scenario contracts are documented in [Conformance Lab Scenario and Result Contracts](./conformance-lab-scenario-and-result-contracts.md).

<!-- support-claim-state: conformance-validated=0/20 -->

Since W18 R9 Phase 4, the promotion is also governed at the wording layer (PRD 37 R-GOV-1..2): a public claim states only what a `conformance-validated` tuple proves, and until then wording distinguishes a Make Docs generated output from a harness-recognized plugin. `packages/cli/src/conformance/governance.ts` adds a third, maintainer-side cap composing with the two above — `capSupportStatusForConformanceRegistry` holds any `validated` claim at `provisional` unless the exact registry tuple is `conformance-validated` — and `listPackagingSupportRegistryAgreementErrors` proves the wiring both ways: every first-party descriptor placement claim (the W18 R5/PRD 33 generated-output claims and this lineage's R-ADAPT-1/R-PROV-3 adapter support statuses) has exactly one registry tuple as its promotion path, and every registry tuple anchors back to a placement, so no parallel or prose-only support surface exists (R-REG-1). Public wording itself is derived, review-gated (one reviewed qualifying run for nominal wording, repeated reviewed runs for stronger wording), and bound to this guide through a machine-checked `support-claim-state` marker: when a tuple advances, the governance suite fails until this guide's support wording is reviewed and re-marked in the same change. See Support-Claim Governance in [Conformance Lab Scenario and Result Contracts](./conformance-lab-scenario-and-result-contracts.md).

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

Adding a harness stays additive: add a capability descriptor to `descriptors.ts`, an adapter module that derives from it, a registry entry, fixtures, and conformance scenarios. `planner.ts` remains harness-neutral — it delegates to the registry and adapters and contains no per-harness conditionals — and a change that would add one is a design smell to reject in review. Phase 3 proved the recipe with a real harness: the Pi adapter landed as a descriptor-derived declaration only, with zero planner or resolver changes (R-KEEP-1).

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

Since W18 R8 Phase 1, adapters no longer restate harness paths, preconditions, or exposure modes inline: those fields are derived from the harness capability descriptor through `deriveAdapterDeclarationCore`, so the descriptor stays the single source and the adapter declaration stays the resolver-facing shape. Since Phase 3 the derivation also copies the descriptor's verification block — status, reference, provisional notes, and contract digest — onto every adapter declaration, and declaration validation rejects an adapter without it (R-ADAPT-1). The surface resolver and writer consume the derived declarations unchanged.

Each adapter should declare:

- stable harness id and display metadata;
- supported output kinds such as `plugin` and `skills-bundle`;
- supported surfaces such as native project, native global, agents-standard project, agents-standard global, and export-only;
- path templates with sanitized placeholders such as `<repo-root>` and `<user-home>`;
- preconditions such as project trust, harness installation, plugin support, skill support, config state, or user selection;
- preferred exposure mode and fallback mode;
- ownership classes and lifecycle handling;
- the verification reference and status carried from the descriptor (see Verification Status and Support Gating above);
- conformance scenarios required before public support claims.

`generic` should not be a harness id. Standard locations are surfaces that real harness adapters may support. The schema currently accepts `plugin` and `skills-bundle` as output kinds and `native`, `agents-standard`, and `auto` as surfaces or surface-selection modes.

Adapter declaration validation requires at least one supported output kind and at least one supported surface. Path templates must only reference output kinds, surfaces, and scopes declared by that adapter so future harness support stays additive instead of requiring planner-specific branching.

Current first-party adapter declarations live in `adapters.ts` for `codex`, `claude-code`, and — since Phase 3 — `pi`. They intentionally model support as internal capability declarations and conformance requirements; public support wording remains provisional unless an exact tuple has evidence, and the verification gate above enforces that structurally. The Pi adapter never emits a hook artifact: its native profile lowers to the extension container, and event-bound steps degrade to documented skill instructions under the `degrade` policy or fail closed under the default `fail-closed` policy (R-ADAPT-4, R-CAP-4). Two fixture adapters prove the additive and fail-closed properties: `future-harness` shows new harnesses can add native and agents-standard surfaces without modifying planner code, and the Phase 3 `fixture-limited` adapter — native plugin output only, no hooks — exercises the unsupported-output-kind, unsupported-surface, and un-honorable-scope stops so the fail-closed behavior is itself tested (R-ADAPT-5).

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
- `registration/*` files from the descriptor's `registrationFiles` — generated into the distributable, never registered anywhere (R-MKT-1); since Phase 4 the opt-in install seam exists but always resolves to generate-only (see Marketplace Registration Seam below);
- Make Docs metadata records under `.make-docs/` inside the container: `dependencies.json`, `registration.json` (which since Phase 4 names the seam's config key and global-store home), `provenance.json`, `lifecycle.json`, and `conformance.json`. None of these is the installable artifact, and no emitted file carries a Make Docs `kind` as its manifest type (R-COMP-1).

Source loading is shared: `loadCompiledSource` reads and parses one plan source through the single Playbook parser, and the planner and compiler consume the same parsed models so the source is parsed once and never re-parsed downstream (R-SCOPE-1). At write time, `loadPackageSourcesForWrite` re-reads each plan source and fails closed before any write when a source is missing or its digest no longer matches the reviewed plan (R-GEN-2) — a reviewed plan must describe the sources actually compiled.

### File Organization

The exact organization of generated files within the harness's layout constraints is an implementer decision (D9), recorded in the `compiler.ts` doc comment:

- Containers with a harness manifest place skills at the descriptor's `skillFileTemplate` (`skills/{skillId}/SKILL.md` for the first-party descriptors).
- A `skills-directory` container is itself the skill directory: a single-skill distributable puts `SKILL.md` at the container root so direct `.agents/skills/{id}/SKILL.md` discovery holds, and a multi-skill portable bundle emits a root index `SKILL.md` plus one `{skillId}/SKILL.md` per member skill.
- Shared supporting files live at the container root: `references/`, `checks/`, `scripts/`, `hooks/`, and `registration/`.
- The harness manifest's `version` is a constant `0.1.0` until a versioning policy lands with the lifecycle lineage; every other manifest field derives deterministically from the plan and descriptor.

### Dependency Materialization

`materialization.ts` implements R-DEPMAT-1: the dependency kind declared in the Playbook dependency registry determines exactly how the compiler materializes it.

Since W18 R12 Phase 2 materialization is probe-only ([PRD 40](../../../prd/40-revise-playbook-authoring-contract-v2.md) R-DEP-3 and R-FIX-1 — the root fix for register item D-015): the model's resolved `probe` field — the declared value or the dependency `id` default, fixed at parse time by the v2 fenced `dependencies` block parser — is the only dependency field that check generation and machine reference derivation may target. `executableToken`, which derived the check target from the first word of the dependency's `source` prose, is deleted, and a search-verified invariant holds across `packages/cli/`: no code path parses dependency `source` for machine meaning — `source` is human provenance that materialization only ever displays verbatim inside human-facing instruction text. The confirmed D-015/F1 false negative is therefore structurally unrepresentable: a `git` dependency whose source reads `system install of git` generates a check probing `git`, and a declared probe (`github-cli` probing `gh`) wins over the `id`. `MaterializedDependency` additively gained the resolved `probe`, which the compiler emits into the distributable's `.make-docs/dependencies.json` record.

| Dependency kind | Materialization |
| --- | --- |
| `cli`, `package-manager` | Executable `checks/{id}.sh` script probing the resolved `probe` via `command -v`, plus human instructions in the skill text; a `package-manager` dependency's `source` prose survives only in the human "install per:" instruction text. |
| `skill`, `plugin` | Harness-native manifest reference — the reference identifier is the resolved `probe` (PRD 40 R-DEP-2) — where the selected container carries a manifest that can host the primitive; explicit declared degradation in the skill text where it cannot (R-CAP-4). |
| `mcp`, `external-service` | `runtimeCheck` metadata targeting the resolved `probe` in the distributable's dependency declarations, plus a runtime availability check script probing the same target; the provenance prose rides the human instructions verbatim. |
| `reference` | Copied into `references/{id}/` where redistribution is allowed; linked otherwise. The locator stays the whole declared `source` value, consumed verbatim — the recorded probe-rule exception described below. |
| `playbook` | An additional bundled-skill pointer when the referenced Playbook is in the bundle; a referenced-playbook entry when not. The referenced-Playbook identifier is the resolved `probe` — a canonical ref such as `persona/slug`, or the `id` default. |
| `script`, `asset` | Documented-only: human instructions plus a dependency-declaration record, with `source` prose quoted for the human reader only. R-DEPMAT-1 assigns these W18 R6 kinds no artifact, so the compiler deliberately invents none (D9). |

A `cli` dependency on Make Docs itself references the stable operation identifier, never a CLI command string, so generated outputs survive CLI reorganization: the check script carries `# stable-reference: operation:{id}` as the durable reference, and the human command form shown alongside it is derived from the registry's `operationCliPath` at compile time. Where the identifier lives after the v2 `source`-prose break is a recorded W18 R12 P2 implementer decision — PRD 40 and the design are silent on it, so per the probe-only rule the operation identifier is declared on `probe` and `hasOperation(probe)` gates the operation path; the contract's worked example supports this shape. The registry is consulted at compile time only, which keeps the registry-to-compiler import safe inside the module cycle.

Three more recorded implementer decisions: the redistribution heuristic treats a reference whose source resolves to a repository-local file as first-party copyable content, while URLs and non-path sources are linked — and a required reference that looks like a repository path but does not resolve is a missing dependency that fails closed before writes (D9). The `reference` locator is the recorded probe-rule exception (W18 R12 P2): a reference generates no dependency check, so R-DEP-3 does not bind it, and the executable-token pattern on `probe` cannot express dot-led repository paths or URLs — so the locator stays the whole declared `source` value, consumed verbatim as a locator with no token ever derived from it. Runtime availability checks for `mcp`/`external-service` cannot probe a harness configuration portably, so the generated script honors an explicit `MAKE_DOCS_DEP_<ID>_AVAILABLE=1` override and otherwise exits `3` (verification required); the authoritative runtime evaluation belongs to the W18 R7 runner, which consumes the metadata record (D9).

### Two-Tier Generation and Provenance

Generation is two-tier with the boundary recorded in field provenance (R-GEN-1). Schema-owned fields — file paths, manifest structure, dependency checks, digests — are always deterministic. Semantic fields — skill descriptions and triggers, bundle grouping, harness-facing prose — are deterministic when they come straight from the source (an authored Playbook summary) and review-gated agent-assisted proposals otherwise, gaining authority only when the package plan is accepted.

The compiled `.make-docs/provenance.json` record carries the boundary explicitly: `generationTiers` groups every field by tier, alongside source refs and digests, the distributable profile, the adapter id, the generated file list, ownership status, and support status. Every `PackageInventoryFile` also carries its own `tier` (`deterministic` or `agent-proposed`) and `sourceRefs`, and since Phase 4 `provenance.json` includes a per-file `files` traceability list.

Since Phase 4, provenance is also queryable outside the container (R-PROV-1). The in-tree `provenance.json` already carried the full field list; the gap was the manifest and audit surfaces. `AgenticPackagingProvenance` in `packages/cli/src/types.ts` now rides every packaging-owned manifest ownership record — package id, distributable profile, adapter id, output kind, per-file source refs and digests, the concrete generated file, its compiler inventory category, and its generation tier — populated by the writer for both the canonical payload and the exposure entries, and embedded in the audit records that report those files. `adapterId` is free-form so provenance survives adapters (like `pi`) that are not first-class `Harness` values.

### Fail Before Write

The fail-before-write rule (R-GEN-2) is enforced in both the planner and the writer, so a stale or unreviewed plan cannot slip through either surface. Before any write, these conditions stop the operation: unresolved semantic proposals or required review, ownership conflicts, missing dependencies (including unresolvable required references), unsupported surfaces or containers, missing or stale sources (digest mismatch against the reviewed plan), a missing Make Docs manifest for installed outputs, a `validated` support claim against an unverified adapter contract (`missing-support-evidence`), a `validated` support claim whose tuple has unbound dimensions (the Phase 4 tuple gate), a planned write that would land on a marketplace registration surface without the required scope and approval (the Phase 4 `globalMarketplaceProtectionStops` guard), modified existing generated output without reviewed overwrite, and stale-output removal without a reviewed backup snapshot. Non-interactive runs stop before writing.

The Phase 3 fail-closed audit confirmed all four R-ADAPT-5 paths — an unknown harness identifier, an unsupported output kind, an unsupported surface, and a scope the adapter cannot honor — stop before any write, and fixed one real writer gap found by the audit: the writer previously crashed while building an exposure record from an unsupported surface resolution whose resolved package path was empty; it now skips that record and fails closed on the stop, with writer tests proving nothing is written on any of the four paths.

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

Audit classification preserves those distinctions on the Phase 2 multi-file trees (R-KEEP-1). Phase 4 fixed a real classification defect: `packages/cli/src/audit.ts` had classified skills-bundle symlink exposures as `managed-file-modified`, which would have orphaned them at uninstall; the new `classifyPackagingSkillExposureRecord` classifies a skill exposure by its recorded symlink target instead. Tests prove all seven W18 R5 classifications stay distinct on the new trees and that generated outputs never masquerade as Playbook source.

Installed generated outputs should reuse the selected-agentics storage and native exposure contracts. Plugin payloads use `.make-docs/agentics/plugins/**`; skill payloads use `.make-docs/agentics/skills/**`. Harness exposures prefer symlinks and use managed copy mirrors as the compatibility fallback.

The Phase 2 rebuild changed only the payload, not the plumbing (R-COMP-2): the canonical payload under `.make-docs/agentics/{plugins|skills}/{id}`, the symlink or copy-mirror exposure at the harness path, per-file manifest ownership records for both the canonical tree and the mirror, backup-reviewed stale-output removal, and owned-output-only cleanup are all preserved byte-for-byte from the PRD 28 contract. Extenders changing the compiler must not touch the exposure plumbing, and changes to the exposure plumbing belong to the shared-agentics lineage, not here.

Use the writer operation like this during development:

```sh
make-docs run package preview \
  --plan-json /path/to/package-plan.json \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

`preview` returns write diagnostics and generated-output records but does not touch files; `make-docs run package write` with the same flags writes. The `--precondition` ceremony can be absorbed into the project config's `packaging.preconditions` block (`.make-docs/config.yaml`), with explicit flags always overriding — config stays convenience, never authority. When writing, installed outputs require an existing Make Docs manifest so audit, backup, uninstall, and migration can see the generated files. Export-only output writes under `.make-docs/exports/playbook-packages/**` and does not add installed harness exposure ownership to the manifest.

The writer records source refs, source digests, target harness, output kind, surface, scope, support status, review status, canonical payload path, exposure path, and exposure mode. It stops before writing when required review is incomplete, an `auto` surface has not been resolved, required adapter preconditions are unknown or unsupported, an existing generated output differs, a plan source is missing or fails its digest check, the compiled inventory raises a container or materialization stop, or stale generated output removal lacks a reviewed backup snapshot — see Fail Before Write above for the full condition set.

When symlinks are available, installed plugin and skills-bundle outputs expose the shared payload directory through a harness-native or standard location. When symlinks are unavailable, the writer creates managed copy mirrors and records `copy-mirror` ownership instead of generating generic stubs.

## Marketplace Registration Seam

Since W18 R8 Phase 4, `registration-seam.ts` is the R-MKT-1/R-MKT-2 seam. Registration and marketplace files are still only ever generated into the distributable (`registration/*` plus the `.make-docs/registration.json` record); the seam adds the documented opt-in read, a per-write decision record, and a fail-closed writer guard.

The opt-in is the pre-existing `settings.marketplaceAutoRegistration` key of the global store's `~/.make-docs/config.json` (a W18 R10 `GlobalConfigSettings` key), exported as `MARKETPLACE_AUTO_REGISTRATION_CONFIG_KEY`. `readMarketplaceAutoRegistrationOptIn` reads it through the store's own loader — the packaging domain defines zero store schema (R-SCOPE-1) — and an absent store, absent key, or unreadable config all mean off, so the seam is additive and off by default (R-MKT-2). The store README records the packaging seam as the key's consumer.

The shipped semantics are recognized-and-honored-by-refusing. Every write result carries a `MarketplaceRegistrationSeamDecision` — config key, config home, the opt-in value, scope, approval state, the registration file plans, and a `disposition` that is always `generate-only` in this wave — with the withhold reasons declared in `withheldBecause`: `auto-registration-opt-in-off`, `scope-not-global`, `global-approval-missing`, and `auto-registration-unshipped-pending-conformance`. Even a granted opt-in with explicit global scope and approval stays `generate-only`, because actually installing a registration file requires the install-discover-invoke-uninstall evidence bar owned by the W18 R9 conformance lineage. No auto-registration behavior ships enabled; the decision record is the seam future work consumes, and nothing here may be widened silently.

The R-MKT-1 protection is a writer guard, not just a policy statement. `globalMarketplaceProtectionStops` audits the writer's planned write set — canonical payload, symlink exposure root, and copy-mirror files — against the descriptor's declared registration install targets and fails closed if any write would land on a registration surface. The `<user-home>/`-rooted form of a target (the user's global marketplace) requires explicit global scope AND the named `global-marketplace-registration` approval; a project-local registration surface still requires the named approval. The Phase 4 audit confirmed no shipped path writes to any marketplace surface — registration files land only under `registration/` inside the distributable — so the guard is a tested invariant, proven with a hostile fixture descriptor that deliberately routes a write onto a registration surface.

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

Current compiler and materialization coverage lives in `packages/cli/tests/playbook-packaging-compiler.test.ts`. It covers the multi-file harness-native tree with no Make Docs descriptor payload (R-TEST-1), the Codex `.codex-plugin/plugin.json` and `.agents/skills/{id}/SKILL.md` shape assertions (R-TEST-2), skill-content preservation of intent, triggers, steps, references, and safety boundaries, every dependency kind's R-DEPMAT-1 materialization including bundled-playbook skills and explicit degradation without a hosting manifest, event-bound hook compilation, the two-tier provenance boundary, review-gated skill-description proposals, fail-closed behavior on missing required references and stale sources, per-file PRD 28 ownership records for both exposure modes (R-COMP-2), and generate-but-do-not-register registration files (R-MKT-1). Since W18 R12 Phase 2 it also pins the probe-only rule (PRD 40 R-TEST-2): the D-015 UAT repro end-to-end (`git` with source `system install of git` generating a check that probes `git` via `command -v`), a declared probe differing from the `id` (`github-cli` probing `gh`), and adversarial provenance prose across the `cli` and `package-manager` kinds, so any future change that re-derives a check target from `source` or the first token of any prose field fails the suite. These are shape assertions only, not harness-recognition evidence (R-TEST-5).

Current adapter-contract verification coverage lives in `packages/cli/tests/playbook-packaging-adapters.test.ts`. It covers the verification reference and status riding every adapter declaration with declaration validation rejecting their absence (R-ADAPT-1), the `capSupportStatusForVerification` cap and the compiler's independent `missing-support-evidence` stop, the contract-digest re-verification failure on declaration drift, the corrected Codex placement roots and shapes (R-ADAPT-2, R-TEST-2), the Claude Code plugin/skill/portable/hook lowering matrix (R-ADAPT-3), the Pi extension lowering with no hook artifacts and declared degradation (R-ADAPT-4), and the four fail-closed paths through the `fixture-limited` adapter with writer assertions that nothing is written (R-ADAPT-5, R-TEST-3). These are shape and gating assertions only, never harness-recognition evidence (R-TEST-5).

Current registration-seam coverage lives in `packages/cli/tests/playbook-packaging-registration-seam.test.ts`. It covers the opt-in read defaulting to off, the seam decision riding every write result with the correct `withheldBecause` reasons in every opt-in/scope/approval combination (always `generate-only`), the registration-model/file pairing validation on descriptors, the harness-usable Codex marketplace entry (the `~` lowering and version), the `registration.json` seam record, and the `globalMarketplaceProtectionStops` guard failing closed on a hostile fixture descriptor that routes a write onto a registration surface.

Current lifecycle coverage lives in `packages/cli/tests/playbook-packaging-lifecycle.test.ts` (R-PROV-2). It runs the real `runUninstallCommand` against actually written Codex plugin and Claude Code skills-bundle packages: backup copies exactly the audited owned outputs; uninstall removes the canonical payload and the exposure, prunes emptied `.codex`/`.agents` directories without orphaning managed directories, and preserves user-authored files and locally modified generated files. The compiled `conformance.json` carries a `cleanlinessScenario` reference to the PRD 37-owned backup/uninstall cleanliness scenario — referenced, not implemented here. Since W18 R9 Phase 2 that referenced scenario exists as a committed spec: `docs/assets/conformance/scenarios/codex-uninstall-backup-cleanliness.json` owns the real-harness half of R-PROV-2, asserting backup and removal against a real Codex install with orphan-directory and user-authored-sentinel assertions; the lifecycle tests here remain the internal file-and-structure layer, never harness-recognition evidence (R-TEST-5), and the scenario has not run yet — see [Conformance Lab Scenario and Result Contracts](./conformance-lab-scenario-and-result-contracts.md).

Current capability-descriptor, shared-registry, and distributable coverage lives in `packages/cli/tests/playbook-packaging-capability.test.ts`. It covers descriptor invariant validation, the byte-parity of derived adapter declarations with the previous W18 R5 inline shapes, both registry capability questions including unregistered-id passthrough for the runtime record key, one-Playbook-one-skill projection with collision-only persona qualification, implied-agentics derivation from the parsed model, richest-container selection per profile (including Pi's extension), declared degradation versus fail-closed stops under both policies, event-bound hook lowering on harnesses with and without hook support, and the distributable and degradation lines in plan provenance and dry-run output.

### D10 Verification Suite

Since W18 R8 Phase 5, `packages/cli/tests/playbook-packaging-verification.test.ts` is the audit layer over the per-phase suites above. Its header carries the two things to read before changing packaging behavior or its tests: the prominent R-TEST-5 `EVIDENCE BOUNDARY` block, and the coverage-matrix comment that maps every Phase 5 task (t1 through t9) to R-TEST-1 through R-TEST-5 and names the owning test in the owning file — the first place to look when deciding where new packaging coverage belongs.

The D10 audit filled the gaps the per-phase suites left implicit:

- The R-TEST-1 assertion is now encoded explicitly in the compiler suite: the payload root is asserted to be a directory tree, every emitted file carries a labeled assertion that it is not a Make Docs descriptor payload, and the comment names the deleted `renderPackageContent` defect so the "fails against the descriptor-era writer, passes against the Phase 2 compiler" acceptance is readable in the test itself.
- A writer-level unsupported-surface proof snapshots the full fixture filesystem before and after the write attempt and asserts the trees identical, so the no-write claim is proven at the filesystem, not inferred from the stop.
- The dependency-materialization coverage now exercises all ten R-DEPMAT-1 kinds in one fixture, with a completeness gate keyed to `PLAYBOOK_DEPENDENCY_KINDS`: if the W18 R6 vocabulary grows, this test fails until the new kind gains a fixture row and an expected disposition.
- Writer-level fail-before-write proofs cover unresolved semantic proposals and unresolved plan decisions, and the ownership-conflict stop in `playbook-packaging.test.ts` now proves the locally modified generated file survives byte-for-byte.
- The t9 sweep iterates every first-party adapter and descriptor asserting verification statuses stay within `provisional`/`verified`, proves every planner-built support claim is `provisional` with its exact tuple recorded and the evidence-owned dimensions `null`, and proves `validated` requires both a verified contract and a fully bound tuple — no support status advances on the strength of the suite (R-PROV-3, R-ADAPT-1).

The R-TEST-5 boundary is a maintainer rail, not just prose. An enforcing test reads the header of every `packages/cli/tests/playbook-packaging*.test.ts` file (the content before its first `describe(`) and fails the suite unless the header states the R-TEST-5 boundary, names recognition evidence, and references the W18 R9 conformance owner. A new packaging test file therefore must carry the evidence-boundary header or the suite fails, and the boundary cannot silently disappear from an existing file; Phase 5 added the headers to the three packaging test files that lacked them.

Since W18 R9 Phase 3, the same headers carry a second machine-enforced declaration: every packaging suite names its test layer with a `Test layer:` marker (PRD 37 R-LAYER-1), checked by the W18 R9 meta-verification suite the same way the evidence-boundary rail works. All eight `playbook-packaging*.test.ts` suites declare `integration` — a recorded judgment call, because they exercise the packaging rails through the manifest and exposure plumbing per the R-LAYER-1 layer definition — and the classification changes nothing about what a pass means: integration tests are automated repository tests whose passing is never evidence that a harness recognizes or can use the output (R-LAYER-2, the R-TEST-5 boundary restated). The layer vocabulary, marker mechanics, and meta-verification checks are documented in [Conformance Lab Scenario and Result Contracts](./conformance-lab-scenario-and-result-contracts.md) under Test Layers and Meta-Verification.

## Future Coverage

The former bullet on the W18 R12 backlog Phase 2 probe rebuild is resolved: Dependency Materialization above now documents the probe-only rule, the per-kind probe consumption, the updated `cli`/`package-manager` table rows, and the F1 regression fixtures, and register item D-015 is closed.

- Blocked by: W18 R9 conformance evidence. Update when: real-harness recognition, installation, invocation, and uninstall runs are recorded in the tuple registry for the claimed tuples, when recorded evidence binds the open tuple dimensions (`scenario`, `modelOrProvider`, `runtime`), and when the Claude Code and Pi contract reviews move their verification statuses past `provisional`. Guide change: replace the tuple-bound provisional-support caveats with the recorded support statuses, document the tuple promotion path as exercised, fold the review outcomes into the verification status table, and revisit the registration seam's `auto-registration-unshipped-pending-conformance` withhold reason once the evidence bar allows an actual opt-in install path to ship.

## Related Resources

- [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md)
- [Conformance Lab Scenario and Result Contracts](./conformance-lab-scenario-and-result-contracts.md)
- [Packaging Shareable Playbook Workflows](../user/playbooks-packaging-shareable-agent-workflows.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [Playbook Packaging Compiler and Harness Adapters](../../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [40 Revise Playbook Authoring Contract v2](../../../prd/40-revise-playbook-authoring-contract-v2.md)
- [41 Revise CLI Human Experience and Package Grammar](../../../prd/41-revise-cli-human-experience-and-package-grammar.md)
- [W18 R5 Work Backlog](../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md)
- [W18 R8 Work Backlog](../../../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md)
