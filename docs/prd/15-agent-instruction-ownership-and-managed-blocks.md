# 15 Agent Instruction Ownership and Managed Blocks

## Purpose

Accepted result: the owner accepted the implemented W19 R3 Store-state boundary on 2026-09-09. The [closed phase and evidence](../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) record package proof, reviewed live transfer, preservation checks, final fault checks, and installed CLI status. This acceptance does not close unrelated W19 R1 work.

This document defines the current product contract for agent-instruction ownership, managed blocks, and conflict-safe preservation. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns agent-instruction ownership, managed blocks, and conflict-safe preservation. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

- Managed routers provide a short discovery route to lifecycle and Human Experience authority. They do not become a second policy source. See [PRD 49](49-human-experience-standard-and-intent.md).

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Proportionate Testing Router Discovery

Managed agent instructions must expose one short universal testing rule and route agents to [PRD 50](50-proportionate-testing-and-human-centered-validation.md) resources. Routers must not copy the full testing standard, imply that every type is mandatory, turn advisory human work into a gate, or hide specialized PRD 46, PRD 48, and PRD 49 authority.

The normal pointer must help an agent find the current-decision questions, common body record, four-type taxonomy, human testing experience, and gate effects. Managed-block preservation and conflict rules remain unchanged.

make-docs must own its instruction content through a deterministically delimited
managed block, not the whole shared file:

- make-docs maintains only the text between explicit markers in any installed
  instruction file; content outside the markers is owned by the project or user
  and is never modified.
- The substance of make-docs's root routing lives directly in the managed block.
  The installed root `AGENTS.md` and `CLAUDE.md` blocks mirror each other unless
  a future route-specific requirement explicitly needs different behavior.
- The managed block must not load, point to, or depend on dedicated
  `.make-docs/AGENTS.md` or `.make-docs/CLAUDE.md` instruction files.
- Reconciliation is block-scoped: the manifest tracks the block hash; editing
  content outside the block never conflicts; an edited block is re-asserted or
  surfaced as a block-scoped decision, not a whole-file conflict.
- Static template content remains authoritative: instruction file bodies come
  from `packages/docs/template/`; the CLI selects paths and reconciles blocks,
  but does not dynamically assemble alternate router content.
- Existing installs migrate non-destructively; project-specific content (for make-docs's own repo, the template-first maintainer rules) lives outside the block and persists across reconfigure. Clean W17 dedicated instruction files are removed only when a frozen classification snapshot proves their manifest hashes and provenance still match.
- Non-instruction files use the same provenance-aware, file-scoped conflict review as the installation lifecycle; directory membership or an old manifest path alone never proves current managed ownership.

### Human Experience Router Discovery

- A managed `AGENTS.md`, `CLAUDE.md`, or equivalent router block points agents to lifecycle, the Human Experience Contract, and the Human Experience Reference when they create or materially update governed work.
- The router does not copy the full standard, impact rules, section form, principles, or evidence model.
- Human Experience discovery does not require a Skill. A Skill can remain an optional aid and cannot become a second authority.

### State Guidance

- R-ROUTER-STATE-1 (MUST): shipped routers and system guidance direct agents to the CLI for Make Docs installation, migration, locking, receipt, and recovery state in the global Store. They must not instruct agents to create or edit `.make-docs/state/`, a local operational manifest, or an equivalent local mirror. Project history and optional work tracking remain local knowledge. Upstream resources are changed before downstream dogfood copies.

### Initialization and Adoption Safety

- Setup and reconfigure classify an existing instruction surface before creating or adopting any block. Classification records the file owner, detected marker shape, managed snapshot and hash, project-owned bytes outside the block, router intent, manifest claim, provenance state, and any competing claims.
- A fresh project receives the configured-harness router foundation at the project root, `docs/`, `.make-docs/`, `.make-docs/system/`, and the four typed system directories. The resolved effective profile and its dependencies control capability-local routers at `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`. On-demand `docs/assets/` has configured-harness root routers and no managed routers below it. `.make-docs/archive/` and `docs/assets/` receive configured-harness root routers only when created. Persona testing remains on demand and is routed from the `docs/assets/` root. System resources remain machine-served by default, so initialization does not require eager resource-body materialization; an explicitly selected local projection is recorded separately with its own provenance.
- Adoption is explicit and file-scoped. A verified canonical block may be adopted as `managed-snapshot`; existing noncanonical content is `project-owned` unless the user reviews an export-and-replace or proven-managed overwrite plan. Successful adoption records a typed receipt, before/after snapshot identifiers, digests, bounded provenance, and content references in the Store-owned installation record. File and block bodies remain in verified provider, backup, or approved content-copy locations.
- Setup, reconfigure, update, migration, and uninstall acquire the Store-owned checkout lock before taking the classification snapshot and hold it through block transformation, manifest write, and validation. Missing, malformed, nested, duplicated, ambiguous, or contradictory markers or provenance fail closed before mutation.
- Instruction member paths held in the Store are normalized project-relative POSIX paths and resolved beneath the approved repository root. The operational manifest itself lives outside the repository in the Store. Traversal, absolute substitution, case-collision, or symlink escape is rejected on Windows, macOS, and Linux.

Code anchors:

- `packages/cli/src/managed-block.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/cli.ts`
## Tester Instruction and Coverage Boundaries

Managed agent instructions must route deferred-obligation and Unassisted Goal Testing work to the authoritative contracts without embedding project-specific conventions. [R-NUAT-GOAL](46-naive-end-user-acceptance-testing.md#r-nuat-goal-real-world-goals-and-anti-coaching) requires executor isolation and anti-coaching: no internal terminology, hidden steps, expected answers, architecture knowledge, or compensating instructions that conceal a discoverability defect.

The instructions must distinguish Guided Progress Review from the qualified unassisted executor role. [R-NUAT-COVERAGE](46-naive-end-user-acceptance-testing.md#r-nuat-coverage-coverage-pass-mechanics) forbids Persona selection from becoming qualification or a pass.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

- [PRD 49](49-human-experience-standard-and-intent.md) owns the policy that managed routers expose. Existing installation, block ownership, hashing, conflict review, and preservation rules govern its adoption.

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Managed Instruction Conflict Semantics

### Managed-Block Conflict Resolution

Managed instruction files are compared and resolved at the managed-block boundary. User-authored text outside the block is always preserved. A divergent block requires one explicit disposition: preserve it as project-owned, export it and replace with the selected managed snapshot, overwrite only when clean managed provenance is proven, skip the file, or stop the operation. Non-interactive execution must not guess, append-merge is not ownership evidence, and whole-file hashing or replacement is invalid for a file that Make Docs owns only by managed block. Uninstall removes only a verified clean managed block from the frozen reviewed snapshot; it preserves divergent, project-owned, ambiguous, contradictory, marker-damaged, and surrounding user content and prunes no shared instruction file.

### Discovery Without the CLI

R-ASSET-ROUTER-1 (MUST): always-present documentation routing names `user` and `maintainer`, explains that either audience can be human or agent, names shared `docs/assets/project/`, and points to `.make-docs/config.yaml` for display overrides and custom entries. It remains sufficient when config, assets, CLI, projected resource bodies, and prior task memory are absent. Detailed policy stays in the owning resources.

R-ASSET-ROUTER-2 (MUST): the documentation router declares `Asset router files: AGENTS.md, CLAUDE.md`, listing only the filenames selected by the reviewed harness configuration. Use template-owned static variants or selection. This declaration guides authoring; it does not prove installed ownership. Without the CLI, an agent may create short assets-root instructions for exactly those declared files when content needs the root. It must not infer harness selection from its own actor identity. Missing or malformed declarations require an explicit project choice before router creation, while ordinary content work remains possible.

R-ASSET-ROUTER-3 (MUST): root asset routers stay within the existing short-router budget and contain no repeated full testing or migration procedure. No managed child router or empty child directory is created by default.

## Requirement History

### 2026-08-08 — W17 R0

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current agent-instruction ownership, managed blocks, and conflict-safe preservation requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Agent instruction ownership design](../assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Requirements`, `Initialization and Adoption Safety`, and `Managed-Block Conflict Resolution`
- Previous contract: Existing instructions were reconciled primarily by block hash with overwrite or preservation, while initialization, provenance-aware adoption, lifecycle locking, typed adoption evidence, and fail-closed marker states were not fully specified.
- Replacement contract: Setup and reconfigure classify and lock instruction surfaces, install only the minimal selected router footprint, distinguish `managed-snapshot` from `project-owned` provenance, require explicit file-scoped conflict dispositions, record adoption receipts, reject unsafe paths, and let uninstall remove only verified clean managed blocks.
- Rationale: Recovery must preserve shared user-authored instruction files and make block ownership provable before any migration, update, or removal.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
### 2026-08-28 — W20 R0

- Affected requirement or section: managed-block ownership, initialization and adoption safety, integrations, and `Human Experience Router Discovery`.
- Previous contract: Managed agent routers preserved owned blocks but had no product requirement to expose Human Experience authority.
- Replacement contract: Managed routers now provide a short discovery route to lifecycle and Human Experience authority without copying the policy or requiring a Skill.
- Rationale: Agents need reliable discovery of the shared standard, while one source of truth must remain stable and project-owned router text must remain safe.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, integrations, and managed-router discovery.
- Previous contract: Managed routers exposed Human Experience and specialist testing authority without one common proportional testing route.
- Replacement contract: Routers point to the shared PRD 50 testing standard and then to specialized owners. They do not copy policy or activate all testing types.
- Rationale: A small universal route gives agents shared judgment without making agent instruction files dense or brittle.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

### 2026-09-02 — W19 R1 P4 Documentation Surface Recovery

- Affected requirement or section: `Initialization and Adoption Safety`
- Previous contract: A fresh project received an undefined minimal router footprint.
- Replacement contract: A fresh project receives the unconditional router foundation. The resolved effective profile and its dependencies control capability-local documentation routers. `docs/assets/` has one managed root router. Archive, artifact, and Persona testing surfaces remain on demand.
- Rationale: D-030 found that the P4 authority and closeout omitted required documentation surfaces.
- Source: [D-030](./03-open-questions-and-risk-register.md#d-030-w19-r1-documentation-surface-router-topology-was-omitted)

### 2026-09-09 — W19 R3

- Affected requirement or section: State Guidance; Initialization and Adoption Safety
- Previous contract: Adoption evidence went into a project manifest and local state guidance was not explicitly forbidden.
- Replacement contract: Adoption and locking use Store state. Shipped guidance directs agents to CLI state operations. At package acceptance on 2026-09-09, implementation had not started. The owner later accepted the delivered result recorded in the W19 R3 phase closeout.
- Rationale: Make Docs tool state needs one Store authority. Project knowledge remains local.
- Source: [Store-owned installation and migration state design](../designs/2026-09-09-store-owned-installation-and-migration-state.md) and [W19 R3 plan](../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-overview.md).

### 2026-09-09 — W19 R4 Asset and Persona Recovery

- Affected requirement or section: `Discovery Without the CLI` and current asset, bootstrap, migration, or storage statements in this owner.
- Previous contract: Configured documentation bootstrap always included docs/assets/ and did not define CLI-free default and harness discovery. Prior dated records retain their historical claims.
- Replacement contract: Shared material uses `docs/assets/project/`; audience assets use on-demand Persona children; archives remain `.make-docs/archive/`. Short routing exposes defaults and configured harness files without a CLI. Reviewed layout moves use the R3 Store service and verify content and links. Existing local-state prose is aligned with the completed R3 boundary.
- Rationale: Finish the missed consolidation requirement and remove active instructions that can restore legacy paths. This is the W19 R4 draft implementation target, not a runtime completion claim.
- Source: [asset and Persona design](../designs/2026-09-09-project-assets-and-persona-discovery.md); [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md).

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- `docs/assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md`
- `docs/assets/archive/plans/2026-06-18-w17-r0-agent-instruction-file-ownership/00-overview.md`
- `packages/cli/src/managed-block.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/planner.ts`
- `.make-docs/manifest.json`
