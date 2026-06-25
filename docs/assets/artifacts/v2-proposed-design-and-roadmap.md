# v2 Proposed Design and Roadmap

Status: seed proposal
Date: 2026-06-19
Branch: `v2-planning`

This artifact is a recommendation for how to begin v2 planning. It is not a design, plan, PRD change, work backlog, guide, or history record. It should be treated the same way as the other files in `docs/assets/artifacts/`: useful input for downstream lifecycle work, not authority by itself.

## Source Review

Primary seed inputs:

- [evolution-direction.md](evolution-direction.md)
- [evolution-direction-structure.md](evolution-direction-structure.md)
- [lifecycle-and-coverage.md](lifecycle-and-coverage.md)
- [../../.backup/PLANNED_CHANGES.md](../../.backup/PLANNED_CHANGES.md)
- [../../.backup/PLANNED_PLUGINS.md](../../.backup/PLANNED_PLUGINS.md)
- [../../.backup/PLANNED_RESTRUCTURE.md](../../.backup/PLANNED_RESTRUCTURE.md)

Current project constraints:

- [../assets/references/lifecycle.md](../assets/references/lifecycle.md) says implementation normally derives from work, work derives from PRD, PRD derives from plan, and plan derives from design or another explicit source input. Departures are allowed, but must be surfaced.
- [../guides/developer/maintainer-dogfood-and-maintainer-operations.md](../guides/developer/maintainer-dogfood-and-maintainer-operations.md) defines the live ownership layers: `packages/docs/template/` is the shipped template source, root `docs/` is the dogfood copy, and `packages/cli/template/` is the package bundle.
- [../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md) records the template-first, dogfood-second rule.
- [../prd/03-open-questions-and-risk-register.md](../prd/03-open-questions-and-risk-register.md) contains v2-relevant constraints, especially `Q-009`, `Q-012`, and `R-014`.
- Current code still has harness-specific skill directories in [../../packages/cli/src/skill-catalog.ts](../../packages/cli/src/skill-catalog.ts) and [../../packages/cli/src/audit.ts](../../packages/cli/src/audit.ts); install planning and manifest logic live in [../../packages/cli/src/planner.ts](../../packages/cli/src/planner.ts) and [../../packages/cli/src/manifest.ts](../../packages/cli/src/manifest.ts); managed instruction blocks live in [../../packages/cli/src/managed-block.ts](../../packages/cli/src/managed-block.ts).
- Backup and audit behavior already have source surfaces in [../../packages/cli/src/backup.ts](../../packages/cli/src/backup.ts) and [../../packages/cli/src/audit.ts](../../packages/cli/src/audit.ts); v2 migration should build on those rather than inventing a separate destructive cleanup path.
- [../assets/references/harness-capability-matrix.md](../assets/references/harness-capability-matrix.md) is the current support-reference surface for harness behavior, but it is static; v2 needs a maintainer-only evidence loop before claiming support across harnesses and models.

New decisions to incorporate:

- The product will not be renamed. Use `make-docs`, `MakeDocs`, or `Make Docs` depending on context.
- The TypeScript installer remains the npm/`npx` runnable entry point. It should be able to run without a prior local install, and ideally without installing dependencies, though dependency-free execution remains an open implementation question.
- The proposed standalone CLI should be planned as a Rust tool distributed through Homebrew and Crates.
- The future user-facing resource directory currently called `docs/library/` should instead be `docs/assets/`. This is distinct from the current template-owned `docs/assets/**` content, which is planned to migrate mostly into the in-project tool directory. Whether archive content also belongs under the new `docs/assets/` remains open.
- System asset materialization is now a first-class v2 design question: repos must keep enough readable local make-docs instructions to be understandable without the CLI, but CLI-installed environments may not need every immutable system contract, reference, and template replicated into every project if a pinned provider or cache model preserves reproducibility.
- V2 migration should be scoped as classification plus safe disposition, not an obligation to cleanly migrate every unknown install. Clean v1/v2 shapes should migrate or sync; unsupported or malformed shapes should route to backup-and-reinstall or manual review.
- Skill installation should remain optional, but the installer should explore a purpose-led skill selection model where teams can supply an alternate skills manifest for preferred first-party, custom, or third-party skills by function.
- V2 should include a maintainer-only conformance lab that tests make-docs capabilities against agent harnesses and models, then feeds support claims and the harness capability matrix with evidence.

## Recommendation

V2 planning should not start by drafting the full design set in one pass. The safer route is to first lock the dependency order and review gates, then draft designs in batches where each batch settles the decisions the next batch depends on.

The critical ordering principle is:

1. Confirm package/deployment boundaries and migration invariants before moving paths.
2. Decide system asset delivery and materialization modes before committing to a per-repo tool-directory shape.
3. Lock template/package/dogfood ownership and provider/snapshot provenance before changing resource layout.
4. Define the current `docs/assets/**` migration and future `docs/assets/{guides,playbooks}/` model before adding overlays or generated metadata.
5. Define the TypeScript installer versus Rust CLI/MCP ownership boundary before moving deterministic script logic into it.
6. Define skill-purpose, config-aware install, and routing before shipping plugins.
7. Build maintainer-only conformance evidence before making public support claims for harnesses, models, skills, or plugins.

## Proposed Design Batches

### Batch 1 - Packaging, Compatibility, and Ownership

Goal: remove the biggest sources of future rework before any path migration or CLI split is designed.

Recommended design docs:

1. **Package and Deployment Boundaries**
   - Record the fixed product naming decision: `make-docs`, `MakeDocs`, or `Make Docs`.
   - Define the TypeScript installer as the npm/`npx` entry point.
   - Define the proposed standalone CLI as a Rust tool for Homebrew and Crates.
   - Decide executable names, package names, compatibility aliases, release channels, and which package owns MCP startup.

2. **System Asset Delivery and Materialization Contract**
   - Define the minimum local bootstrap that must exist even when the CLI is unavailable: project instructions, manifest/config, custom overlays, and a readable explanation of how system assets are resolved.
   - Define supported materialization modes: full per-repo snapshot, CLI/provider-backed resolution, and hybrid pinned cache.
   - Define manifest provenance for system assets: source package or provider, version, hash set, materialization mode, offline expectations, and when selected assets are materialized on demand.
   - Decide which immutable system contracts, references, templates, and helper surfaces can be resolved through the Rust CLI, MCP surface, global cache, npm installer bundle, or a later remote source.
   - Keep full local materialization available as the safe default until provider-backed mode is proven stable enough for CLI-installed environments.

3. **Compatibility, Audit, and Migration Disposition**
   - Define what v1 installs must continue to support while v2 is built.
   - Define upgrade, rollback, backup, and coexistence expectations for existing manifests and managed files.
   - Decide which compatibility rules apply to root dogfood, shipped template installs, npm installer runs, and standalone Rust CLI installs.
   - Classify source states explicitly: clean v1, clean v2, modified v1, partial install, malformed manifest, missing manifest with recognizable managed files, and unknown/non-make-docs shape.
   - Define safe dispositions such as `sync`, `migrate`, `migrate-with-review`, `backup-and-reinstall`, and `manual-review-required`.
   - Use backup-and-reinstall as the path for unsupported shapes rather than trying to migrate every possible hand-mutated install.

4. **Template, Package, and Dogfood Source-of-Truth Contract**
   - Make `packages/docs/template/` the explicit first mutation target for template-owned assets.
   - Define when root `docs/` is reseeded as dogfood validation.
   - Define when `packages/cli/template/` is refreshed and how smoke-pack or package validation proves the bundled copy.

Approval gate after Batch 1:

- Product naming is confirmed as stable, and package/deployment boundaries are settled enough to avoid designing installer and CLI responsibilities twice.
- System asset delivery is captured as a design contract, with local readability preserved and provider-backed mode treated as an explicit option rather than an accidental side effect of the CLI split.
- Migration is bounded by classification and disposition, including a backup-and-reinstall fallback for shapes that cannot be safely migrated.
- The template-first/dogfood-second invariant is written into the roadmap.
- No generated design docs, PRD updates, work backlogs, or code changes happen until the user approves moving to Batch 2.

### Parallel Track - Maintainer Conformance Infrastructure

Goal: create a maintainer-only evidence loop for support claims without shipping that machinery as part of make-docs installs.

This track is not part of Batch 1 and does not need to be included in the Batch 1 sign-off. Start it after the Batch 1 designs are accepted, or after the user explicitly treats the Batch 1 contracts as stable enough to define initial conformance scenarios. It can run before or alongside Batch 2, but it blocks public harness/model support claims rather than ordinary Batch 2 design drafting.

Recommended design docs:

5. **Agent Harness and Model Conformance Lab**
   - Define scenario specs for install, audit, backup, migration, lifecycle routing, design/plan/work generation, skills, plugins, provider-backed assets, and dogfood behavior.
   - Define harness adapters for Codex, Claude Code, OpenCode, and future agentic IDEs so the same scenario can be exercised across environments.
   - Record harness, model, model version when available, make-docs version, scenario id, date, produced files, diffs, transcripts/logs, and normalized verdicts.
   - Use verdicts such as `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`, each with evidence and reason.
   - Keep the lab in maintainer-only repo tooling and use its results to support, revise, or withhold public compatibility claims.

Approval gate for the conformance track:

- The lab is explicitly non-shipped maintainer infrastructure.
- The first scenario set is tied to accepted Batch 1 contracts, then grows as later design batches define more behavior.
- Published harness/model support claims must cite conformance evidence or remain conservative.

### Batch 2 - Canonical Information Architecture

Goal: define the stable document and tool resource model.

Recommended design docs:

6. **Tool Directory System and Custom Resource Tiers**
   - Use the Batch 1 materialization contract to decide which contracts, references, templates, and deterministic helper surfaces live locally in the tool directory and which may be resolved from a pinned provider or cache.
   - Keep the design explicit about shipped template source, dogfood copy, and package bundle surfaces.
   - Do not assume every read-only system asset must be permanently replicated per repo if provider-backed mode is accepted, and do not remove the local bootstrap required for no-CLI readability.
   - Decide how managed blocks and auxiliary routers behave in the new in-project tool directory.

7. **New Docs Assets, Playbooks, and Persona Model**
   - Move `docs/assets/guides/` into `docs/assets/guides/` after the current template-owned `docs/assets/**` content has a migration path into the tool directory.
   - Add `docs/assets/playbooks/`.
   - Decide whether `archive` belongs under the new `docs/assets/` surface or remains elsewhere.
   - Define default personas and custom persona schema in enough detail to close `Q-009` later.
   - Keep persona frontmatter canonical and directory placement secondary.

8. **Generated Metadata and Lifecycle Handoffs**
   - Define YAML frontmatter required for generated docs.
   - Define whether follow-on handoffs live in frontmatter, body sections, or both.
   - Preserve the lifecycle rule that departures from design -> plan -> PRD -> work must be surfaced, not silently skipped.

9. **Configuration and Convention Overlay**
   - Add config as a presentation overlay, not a structural rewrite.
   - Keep repo paths, frontmatter field names, skill names, and contract names canonical unless a later design explicitly changes that boundary.
   - Define how user-visible vocabulary, coordinate names, and prefix style map into generated prose and CLI output.

Approval gate after Batch 2:

- The canonical structure, persona schema, metadata, and overlay boundary are coherent as one model.
- Any remaining open questions are recorded as design follow-ons, not silently absorbed into implementation.

### Batch 3 - CLI, MCP, and Deterministic Automation

Goal: decide where deterministic behavior lives before scripts and skills are rewired.

Recommended design docs:

10. **CLI Separation and MCP Boundary**
   - Split installer/maintainer behavior from the standalone agent-facing CLI.
   - Define whether `npx` remains installer-first, command-router-first, or a compatibility entry point.
   - Define the initial MCP surface and its relationship to ordinary CLI commands.
   - Decide whether the CLI/MCP surface exposes system asset retrieval directly or only consumes the materialization contract defined in Batch 1.

11. **No-Scripts Migration and Skill Refactor**
   - Move deterministic script behavior into the CLI/MCP boundary defined by the previous design.
   - Keep system scripts as thin wrappers only after the CLI equivalent exists.
   - Plan skill rewrites in the same wave so `R-014` has no transitional break window.

12. **Skill Purpose Registry and Alternate Skills Manifest**
    - Keep skill installation optional while making the selection UI purpose-led instead of only name-led.
    - Define stable purpose ids such as codebase decomposition, plan creation, workflow management, migration support, or other first-class functions the project chooses to support.
    - Define the shape, schema version, provenance, validation, and failure modes for alternate skills manifests supplied by file path or URL.
    - Let teams map a purpose to first-party, custom, or third-party skills without making make-docs first-party skills mandatory.
    - Decide how the installer displays purpose, skill name, description, source, harness support, and trust/provenance information before selection.

13. **Shared Agentics Installation and Harness Redirection**
    - Decide whether shared skills/plugins are exposed by symlink, copy, generated harness stubs, CLI routing, or a platform-specific mix.
    - Define Windows, macOS, and Linux behavior explicitly.
    - Define how config overlays are read by installed skills/plugins.

Approval gate after Batch 3:

- CLI ownership is stable enough for script migration.
- Purpose-led skill selection preserves the no-default-skills contract while making team-specific alternatives possible.
- Shared-install design has a real cross-platform answer rather than "symlinks" as an unchecked assumption.
- Skill/plugin installation decisions are compatible with existing harness directories and manifests.

### Batch 4 - Playbooks and Plugins

Goal: build the invocation layer after the substrate exists.

Recommended design docs:

14. **Playbook Contract and Run Playbook**
    - Treat playbooks as persona-scoped content.
    - Define build-stack versus run-stack playbooks.
    - Define the generic Run Playbook execution model without making every playbook require a plugin.

15. **Harness Plugin Substrate and Workflow Bundles**
    - Define plugin packaging, install, update, and uninstall behavior for supported harnesses.
    - Separate the substrate from productized bundles like Idea/Brainstorm, Scaffold, Change Request, and Use/Run.
    - Make non-maintainer guardrails explicit: plugins are the sanctioned entry point, but maintainers can still use the raw lifecycle artifacts.

16. **Coverage-Pass Extensions and Adversarial Review**
    - Treat adversarial review as an optional coverage-pass extension, not a blocker for the rest of v2.
    - Define verdicts, persona targeting if applicable, history idempotency, and validation only if this becomes a real v2 deliverable.

Approval gate after Batch 4:

- Plugin behavior is grounded in the install/config model from Batch 3.
- Build-stack and run-stack playbooks are not conflated.
- Workflow bundles are scoped as products on top of the substrate, not as the substrate itself.
- Any public support claims for playbooks, plugins, or skills are backed by conformance-lab evidence or labeled as provisional.

## Dependency Order

Recommended design drafting order:

```text
Package/deployment boundaries
  -> System asset delivery/materialization
  -> Compatibility/audit/migration disposition
  -> Template/package/dogfood ownership
  -> Maintainer conformance lab
  -> Tool directory tiers
  -> New docs assets/personas
  -> Metadata/handoffs
  -> Config/convention overlay
  -> CLI/MCP boundary
  -> No-scripts migration
  -> Skill purpose registry
  -> Shared agentics install
  -> Playbook/Run Playbook
  -> Plugin substrate and bundles
  -> Coverage/adversarial extensions
```

Parallelism:

- Batch 1 should be mostly serial because package/deployment and source-of-truth decisions affect every later design.
- The conformance track can start after Batch 1 and continue in parallel, but it should block public support claims until evidence exists.
- Batch 2 can split after the materialization contract and tool directory design outline exist, but persona, metadata, and config need a reconciliation pass before approval.
- Batch 3 should be serial across CLI/MCP -> no-scripts -> skill purpose registry -> shared install.
- Batch 4 can split playbooks and plugin bundles once shared install and config routing are stable.

## Planning Workflow

1. Finish this artifact review pass.
2. Hold a short review gate to decide whether the batch structure above is the accepted v2 planning spine.
3. Draft only Batch 1 designs.
4. Review Batch 1 for packaging, materialization, migration, and ownership decisions.
5. Draft the maintainer conformance lab design once Batch 1 contracts are stable enough to define initial scenarios.
6. Draft Batch 2 designs using Batch 1 as authority.
7. Continue batch-by-batch through Batch 4, expanding conformance scenarios as each accepted batch creates testable behavior.
8. Only after the complete design set is accepted, generate the v2 plan bundle or bundles.
9. Only after plans are accepted, reconcile the PRD set and risk register.
10. Only after PRD acceptance, generate work backlogs.
11. Only after work backlogs are accepted, begin implementation.

This is a deliberate lifecycle departure only at the first step: the current artifacts are explicit source inputs for design drafting. After that, the default arc should resume: design -> plan -> PRD -> work -> implementation.

## Validation Expectations

For this artifact pass:

- Keep changes scoped to the active artifact files being edited.
- Run `git diff --check` against those two files.
- Manually verify changed-file links because repo-wide broken-link output has known baseline noise.

For later design drafting:

- Read `docs/designs/AGENTS.md`, the design workflow, the design contract, and the design template before writing.
- Do not mutate `../prd/03-open-questions-and-risk-register.md` until an actual design decision changes question or risk state.
- Do not backlink prior designs as superseded until the design authoring pass confirms the lineage.
- Re-check `jdocmunch` and `jcodemunch` indexes at the start of each batch.

For later implementation planning:

- Treat `packages/docs/template/` as the first implementation target for shipped template-owned resources.
- Treat root `docs/` migration as dogfood validation and as part of the design, not as the source of truth.
- Treat `packages/cli/template/` and smoke/package validation as separate proof that packaged installs receive the same assets.
- Do not replace local project readability with CLI-only hidden state; keep the approved bootstrap files local in every install mode.
- Pin system asset provider or snapshot provenance in the manifest before relying on provider-backed resolution.
- Treat backup-and-reinstall as the safe fallback for unsupported install shapes instead of broad destructive migration.
- Keep skills opt-in, and validate purpose-led or alternate-manifest installs separately from bare installs.
- Keep conformance-lab tooling out of shipped templates, installers, and packages unless a later design explicitly promotes a subset.

## Not In This Phase

- No v2 design docs are created by this artifact pass.
- No prior designs are edited or marked superseded.
- No PRD or risk-register state is changed.
- No work backlogs, plans, guides, history records, or source-code changes are created.
- No direct edits should be made to root dogfood resources as a substitute for template-owned changes.

## Open Decisions for User Review

- Whether the TypeScript npm installer and Rust standalone CLI share any package metadata, config schema, release automation, or generated docs.
- Whether the Rust CLI owns MCP startup directly or delegates that to the TypeScript installer/bootstrapper.
- Which read-only system assets must always be local bootstrap files, which can be full local snapshots, and which can be resolved by a provider in CLI-installed environments.
- Whether provider-backed assets come from the Rust CLI bundle, a global system cache, the npm installer bundle, a remote source, or a hybrid of those sources.
- Whether v2 initially ships provider-backed mode as opt-in while full local materialization remains the default.
- Which install shapes are guaranteed migratable, which are reviewable, and which should route directly to backup-and-reinstall or manual review.
- Whether backup-and-reinstall belongs inside ordinary install, a dedicated migrate command, or both.
- Which stable skill-purpose ids should exist, who owns their definitions, and whether they are part of config, package metadata, or the skill manifest schema.
- Whether alternate skills manifests can be loaded from URLs in v2, and if so what pinning, caching, trust, and confirmation rules apply.
- Whether shared install should prefer filesystem redirection, CLI routing, generated harness stubs, or a hybrid model.
- Which harnesses and models are eligible for initial conformance-lab coverage, and what evidence threshold is required before publishing support claims.
- Whether archive content belongs under the new `docs/assets/` directory or remains under a separate lifecycle/storage surface.
- Whether workflow plugins should be designed as one product suite or as separate design docs after the plugin substrate is locked.
