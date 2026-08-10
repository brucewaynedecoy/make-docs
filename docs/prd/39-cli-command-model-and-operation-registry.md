---
title: "39 CLI Command Model and Operation Registry"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-07-01-cli-command-reorganization-and-operation-registry.md"
---

# 39 CLI Command Model and Operation Registry

## Purpose

This document defines the current product contract for the CLI command grammar, reusable operation registry, and human/agent rendering boundary. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns the CLI command grammar, reusable operation registry, and human/agent rendering boundary. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [CLI command and operation-registry design](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md), which is provenance rather than product authority.

### Scope, Boundaries, and Runtime Invariants (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this authority owns the top-level command structure, bare-command behavior, tool self-management, operation registry and shared core, `run` surface, compatibility handling, and registry cohesion. The operation inventory owns admission and exclusion dispositions; [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) owns the Playbook model; [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md) owns runner semantics; [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) owns package-plan and compiler semantics; PRDs [20](20-agent-harness-conformance-and-support-claims.md), [43](43-conformance-scenario-model-and-execution-kits.md), and [44](44-conformance-lab-sessions-and-evidence.md) own conformance; and [38-global-store-and-project-state.md](38-global-store-and-project-state.md) owns global-store and project-state schemas. This authority does not redefine those contracts.
- R-KEEP-1 (MUST): TypeScript is the v2 runtime authority; Rust is not a design target, distribution, or parity requirement. Remote execution through `npx`, `pnpm dlx`, and `bunx` is the primary posture, with an installed binary available where a package manager requires an entry point. The installer-first no-command posture remains valid and is not replaced by a mandatory command router. MCP tools delegate to the same deterministic operation contract as equivalent CLI commands with identical reads, configuration interpretation, provenance, audit, dry-run, and write permissions. Deterministic logic lives in modular TypeScript operation domains behind thin dispatchers and is testable without CLI or MCP transport. Project `.make-docs/config.yaml` is a presentation overlay applied after canonical routing and is never routing authority.

### Top-Level Structure (R-TOP)

- R-TOP-1 (MUST): the CLI has five top-level commands, organized as self, project, run, and serve — `setup` for the project install lifecycle (`setup`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove`), `run` for the operation surface, `mcp` for the MCP server, and `update` and `uninstall` for tool and machine-level self-management.
- R-TOP-2 (MUST): `setup remove` is the project-removal command; top-level `uninstall` is reserved for machine-level removal.
- R-TOP-3 (MUST): multi-operation families under `run` use a subtree under a domain object mapping one-to-one to registry identifiers; standalone utilities are flat.

### Bare Command (R-BARE)

- R-BARE-1 (MUST): bare `make-docs` with no subcommand is context-aware — with no install detected in the working directory it starts a guided `setup` that asks before writing, and with an install present it shows status and help and does not auto-sync — preserving the installer-first no-command posture without forcing a command-router and without silently re-syncing an existing install.

### Tool Self-Management (R-SELF)

- R-SELF-1 (MUST): `uninstall` removes Make Docs' machine-level footprint — the global store at `~/.make-docs/` and the installed binary when one is present — and for a remote-execution user with no global install it removes the global store and reports that no binary is installed; this is a hard cutover to this meaning, project removal is only `setup remove`, and it must confirm before removing.
- R-SELF-2 (MUST): `update` updates a persistent global install where one exists as a detect-and-delegate wrapper over the install manager that prints the exact command when detection is ambiguous; for remote execution it reports that there is nothing persistent to update, since the runner fetches the requested version, and it applies any global-store schema migration.
- R-SELF-3 (MUST NOT): neither command may guess and then execute a destructive global change; when the install method or intent is ambiguous it prints the exact command and the affected store path rather than acting.

### The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF)

- R-REG-1 (MUST): a single operation registry is the source of truth for which deterministic operations exist; identifiers follow a `domain.verb` or `domain.object.verb` convention, lowercase, dot-separated, with hyphenated multiword segments, and are stable and append-only.
- R-REG-2 (MUST): the CLI `run` command tree and the MCP tool list derive from the registry and are conformance-checked in both directions, so an admitted operation cannot exist on only one surface.
- R-CORE-1 (MUST): deterministic logic lives in a shared operation core of modular, per-operation modules grouped by domain — never a monolith, because a single shared library does not mean a single shared file. Every operation is a stable identifier, a typed input, a typed output, a mutation classification, and a handler that takes the input and an execution context; surfaces adapt argv, MCP arguments, or Playbook step inputs into that input and adapt the output back and contain no operation logic; handlers return structured data and perform effects only through the injected context, which enforces dry-run, write-permission, and approval uniformly across surfaces; presentation belongs to the surface.
- R-CORE-2 (MUST): dependencies are one-way — surfaces depend on the core, the core never depends on a surface, and no surface imports another surface.
- R-SURF-1 (MUST): the three surfaces over the registry are the CLI `run` command, the MCP tools, and Playbook `operation:` steps; `setup`, `mcp`, `update`, and `uninstall` are CLI lifecycle commands, not registry operations, and a Playbook step must not install, serve, update, or uninstall the tool.

- The registry includes the append-only `package.ship` composite operation: a registered operation surfaced as `run package ship` and derived to MCP like every other operation. It executes plan → preview → write through the operation core and aborts at the first stop, unresolved proposal, or warning. The CLI builds its human rendering on R-CORE-1's presentation seam, keyed by `OperationRenderMode`, while `--json` and non-TTY output remain byte-identical to the operation result.

### Current Run Surface (R-RUN)

- R-RUN-1 (MUST): the `run` surface exposes only registry operations and contains `run playbook` (`validate`, `catalog`, `resolve`, `capabilities`, `start`, `invoke`, `status`, `next`, `advance`, `gate`, `resume`, `close`, `run export`, and `run import`); `run package` (`plan`, `surface-resolve`, `preview`, `write`, and `ship`); `run prd authority validate`; and `run work` (`item resolve`, `evidence record`, and `evidence read`).
- R-RUN-2 (MUST NOT): wave-status, work-phase-state, phase-plan, phase-gate decision, scope-guard, and closeout probe/validate/history judgment are Playbook behavior and are not registry operations or `run` commands.
- The work domain remains bounded to one identity resolver and one evidence record-and-read pair keyed to the global-store Project State model. The PRD domain remains bounded to the read-only active-authority validator unless the owning PRDs are updated.

- The `run package` CLI spellings are intent-named: `plan` accepts `--output`, `preview` runs the full dry-run pipeline, `write` performs writes, and `ship` invokes the `package.ship` composite. The `--write` flag is invalid and fails with guidance naming the current grammar. [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) owns the package plan, compiler, adapter, preview/write behavior, and fail-before-write stops; this PRD owns their CLI spelling and registry-derived exposure.

### PRD Authority Validator (R-PRD-AUTH)

- R-PRD-AUTH-1 (MUST): `prd.authority.validate` is a read-only registry operation exposed as `make-docs run prd authority validate --target-root <project>` and the derived MCP tool `make_docs_prd_authority_validate`. It scans active `docs/prd/**/*.md` plus live documentation links and structured authority fields before downstream work consumes the PRD set.
- R-PRD-AUTH-2 (MUST): active filenames and first-H1 subjects reject the case-insensitive stems `revise`, `revision`, `add`, `addition`, `enhance`, `enhancement`, `remove`, `removal`, `deprecate`, `deprecation`, `reconcile`, and `reconciliation`. Product subjects such as Update Delivery, Replacement Policy, and Migration Safety remain valid. Frontmatter and PRD-index editorial kinds reject those twelve stems plus `update`, `replace`, `replacement`, `migrate`, and `migration`.
- R-PRD-AUTH-3 (MUST): diagnostics have stable meanings:

  | Code | Failure |
  | --- | --- |
  | `PRD-AUTH-001` | Numbered active filename begins with a prohibited editorial stem. |
  | `PRD-AUTH-002` | First H1 subject begins with a prohibited editorial stem after an optional PRD number. |
  | `PRD-AUTH-003` | Active frontmatter or the PRD index's `Kind`, `Document Kind`, or `Type` cell uses a prohibited editorial kind. |
  | `PRD-AUTH-004` | Active PRD uses a retired editorial heading: `Change Type`, `Capability Addition or Enhancement`, `Affected Baseline Docs`, `Baseline Being Revised or Removed`, or `Required Baseline Annotations`. |
  | `PRD-AUTH-005` | A live authority-bearing Markdown link or structured authority field treats an action-prefixed PRD as current authority. |
  | `PRD-AUTH-006` | An active product PRD uses top-level `coordinate` frontmatter as document identity. |
  | `PRD-AUTH-007` | Requested target root is missing, unreadable, or not a directory. |
  | `PRD-AUTH-008` | `docs/` or `docs/prd/` is a symlink, escapes the target project, or is otherwise unsafe. |

- R-PRD-AUTH-4 (MUST): Markdown authority enforcement applies to the PRD index `Document Map` and sections named `Source PRD Docs`, `Source PRDs`, `Source PRD Documents`, `PRD Authority`, `Product Authority`, `Current PRD Authority`, `Authoritative PRDs`, `Authoritative PRD Docs`, `Source Authority`, `Authority Sources`, or `Active Authority Baseline`. `Requirement History`, `Provenance`, `Lineage`, `Source Anchors`, `Design Provenance`, `Migration Provenance`, `Migration History`, `Historical Provenance`, and `Archive Provenance` are provenance contexts, not current authority.
- R-PRD-AUTH-5 (MUST): outside the sole path exemption `docs/assets/archive/**`, JSON, JSONL, YAML, and YML authority/source/PRD fields are checked. After camel/snake/hyphen normalization, the controlled fields are `source(s)`, `sourcePath(s)`, `sourcePrd(s)`, `sourcePrdPath(s)`, `sourcePrdDoc(s)`, `authority/authorities`, `authorityPath(s)`, `authorityPrd(s)`, `prd(s)`, `prdPath(s)`, and `prdDoc(s)`, including nested `path(s)` under source, authority, or PRD containers. Standardized provenance containers matching R-PRD-AUTH-4 are exempt. Provenance never exempts an invalid active filename, H1, kind, retired heading, or document-level coordinate.
- R-PRD-AUTH-6 (MUST): invalid or unsafe roots fail closed before scanning. Interactive TTY output presents a human summary plus all diagnostics and remediations; `--json` and non-TTY output emit the complete structured report. Failed reports exit nonzero after printing the full result; passed reports exit zero.
- R-PRD-AUTH-7 (MUST): tests prove surgical in-place PRD updates, standardized Requirement History, and genuinely new capability PRDs pass; action filenames/H1s/kinds, retired headings, current-authority links to retired records, document-level coordinates, invalid roots, and internal or escaping scan-root symlinks fail. Positive fixtures cover legitimate leading product nouns such as Update, Replacement, and Migration.

### Command Compatibility and Upgrade Safety (R-MIG)

- R-MIG-1 (MUST): no compatibility aliases exist; noncurrent command spellings fail with guidance naming the accepted command.
- R-MIG-2 (MUST): `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration by its fingerprints and, when found, present a warning that itemizes the changes that could break on upgrade, followed by a choice between backing up and installing the latest version, which is recommended, and cancelling.
- R-MIG-3 (MUST): MCP tool names are derived from the registry identifiers, so the MCP renames follow the same registry as the CLI.

### Registry Cohesion and Operation Admission (R-SEQ)

- R-SEQ-1 (MUST): the operation core, registry, and command tree form one coherent release surface; every retained operation is behind the registry, and no parallel or half-routed dispatcher exists.
- R-SEQ-2 (SHOULD): internal modularization may be tracked independently, but the current operation-admission and exclusion inventory remains enforced throughout that work.
- R-SEQ-3 (MUST): derivation-heavy or judgment-shaped behavior belongs in a Playbook, not a CLI operation. The registry admits only a fact of record or a fiddly and genuinely reused canonical-identity or parse primitive; [NORTHSTAR](../assets/artifacts/NORTHSTAR.md) records the provenance and examples for that product rule.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that the CLI `run` tree and the MCP tool list are both derived from or conformance-checked against the registry, with no operation present in one surface and absent in the other.
- R-TEST-2 (MUST): a test asserts that surfaces contain no operation logic, by invoking an operation through the core without the CLI parser or MCP transport.
- R-TEST-3 (MUST): a test asserts that `run` exposes no `setup`, `mcp`, `update`, or `uninstall` operation, and that a Playbook step cannot invoke tool lifecycle.
- R-TEST-4 (MUST): a test asserts that pre-v2 detection triggers the warning-and-choice flow, that `uninstall` confirms and does not delete repository content, and that the pruned operations are absent from the `run` surface.

The five-command structure and self/project/run/serve organization, context-aware bare command, machine-footprint `uninstall`, remote-execution-honest self-management, registry-derived surfaces, modular shared core with one-way dependencies, registry-only `run` surface, compatibility rejection, and pre-v2 detection are non-substitutable. Implementations may choose the pre-v2 fingerprint set and warning copy, install-manager detection matrix, and internal operation-core module layout without changing the registered operation identities.

Code anchors:

- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
## Human Experience and Package Grammar

### Human Rendering and Agent Invariance

- R-INV-1 (MUST): operation result objects, MCP tool output, and machine-readable CLI output share the canonical operation-result shape and remain byte-identical across equivalent invocations, except for explicitly additive fields and flags. Human rendering never changes MCP schemas or removes an agent-reachable machine behavior.

### Render Layer (R-RENDER)

- R-RENDER-1 (MUST): the `run` dispatcher applies a CLI-only render layer to the canonical operation result, keyed by `OperationRenderMode`. On a TTY, the default rendering is human text per operation: what just happened (the execution report), where the run stands (a compact cursor/status line, not the full state echo), and what to do next (the next hint and the exact next command). `--json` emits the full canonical operation result. When stdout is not a TTY, the default is the same full JSON, so scripts and agents receive the machine contract without a presentation-dependent transformation.
- R-RENDER-2 (MUST): the evidence log and the capability snapshot are not repeated in text mode — the capability snapshot renders once at `start`, and later text renderings reference rather than restate it; the full record stays available via `--json` and `status --json`.
- R-RENDER-3 (MUST): MCP output derives directly from the canonical operation result; the human render layer is CLI-only.

### Package Grammar and Ship (R-GRAM)

- R-GRAM-1 (MUST): the packaging surface is intent-named and preserves every review rail and fail-before-write stop — `run package plan` is pure computation and review and accepts `--output <path>` for the plan artifact, `run package preview` executes the full write pipeline with no disk writes, and `run package write` performs accepted writes without a `--write` flag.
- R-GRAM-2 (MUST): these are CLI spellings over the shared package operations; dry-run inputs and MCP results follow R-INV-1. `write` is never a dry run, `--write` is invalid and fails with guidance naming the current grammar, and `write` fails closed before mutation whenever a PRD 36 stop applies.
- R-GRAM-3 (MUST): `package.ship` is a composite single-entry operation registered under the rule that every CLI path mirrors a registry identifier and no CLI-only composite exists. It is surfaced as `run package ship` and derived to MCP like every other operation. It executes plan → preview → write through the operation core, aborting at the first stop, unresolved proposal, or warning with guidance naming the granular command (`plan`, `preview`, or `write`) to continue with; it performs the classification write and preserves every fail-before-write rail. A plan with zero unresolved items proceeds end to end without human judgment; anything needing review stops.

### Run-Id and Flag Ergonomics (R-RUNID, R-FLAG)

- R-RUNID-1 (MUST): run identifiers keep their sortable internal form, but every `--run-id` acceptor resolves an unambiguous prefix, and a `--last` alias selects the most recent run for the resolved project; an ambiguous prefix fails listing the candidates.
- R-FLAG-1 (MUST): `--repo-root` defaults to the nearest ancestor of the working directory carrying `.make-docs/manifest.json`; `--store-root` defaults to the real global store; both flags remain as overrides.
- R-FLAG-2 (SHOULD): the packaging preconditions ceremony is absorbable into project config (for example a packaging preconditions block in `.make-docs/config.yaml`), with explicit flags always overriding; config remains convenience, never authority, consistent with the harness-capabilities precedent in [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).

### Noise (R-NOISE)

- R-NOISE-1 (MUST): the Node SQLite ExperimentalWarning is suppressed by a targeted process-warning filter at CLI entry that matches only that warning; never a blanket suppression.

### Hint Retirement (R-FIX)

- R-FIX-2 (MUST): CLI rendering and commands consume the current subject-scoped resume hints owned by [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md). They never render a hint that PRD 35 has retired, never reconstruct hints from the durable evidence log, and render no guidance hints for a closed run. PRD 35 owns hint subjects, retirement transitions, and run-state serialization; this PRD owns their command and presentation projection.

### Conformance Compatibility (R-SEQ)

- R-SEQ-1 (MUST): conformance executes only against the current generated-package content and CLI grammar; no scenario invokes an incompatible package or command form.
- R-SEQ-2 (MUST): [43-conformance-scenario-model-and-execution-kits.md](43-conformance-scenario-model-and-execution-kits.md) uses v2 dependency-block fixtures and `probe`-based checks, the `plan`/`preview`/`write`/`ship` grammar, and `--json` for every transcript consumed as machine evidence.

### Verification (R-TEST)

- R-TEST-3 (MUST): a run advanced past a delegated step no longer carries that step's waiting hint; a closed run carries no guidance hints; the evidence log is unchanged.
- R-TEST-4 (MUST): render invariance — `--json` output and non-TTY default output are byte-identical to the canonical operation results (modulo additive fields); MCP derivation parity holds.
- R-TEST-5 (MUST): grammar — `plan --output` writes the reviewable plan; `preview` writes nothing under any input; `write` preserves every existing stop; the invalid `--write` spelling fails with guidance naming the current grammar.
- R-TEST-6 (MUST): ship — `run package ship` on a plan with zero unresolved items completes plan → preview → write end-to-end with the classification write recorded; on the first stop, unresolved proposal, or warning it aborts before any disk write with guidance naming the granular command to continue with; `package.ship` is present in the operation registry and derives to MCP like every other operation.

Code anchors:

- `packages/cli/src/run/cli.ts`
- `packages/cli/src/operations/types.ts`
- `packages/cli/src/operations/playbook/progression.ts`
- `packages/cli/tests/mcp-derivation.test.ts`
- `packages/cli/tests/consistency.test.ts`

## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 41.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W18 R11

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current CLI command grammar, reusable operation registry, and human/agent rendering boundary inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [CLI command model design](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md)
## Source Anchors

- [../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md)
- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)
- [../assets/artifacts/NORTHSTAR.md](../assets/artifacts/NORTHSTAR.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md](../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md)
- [../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md](../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [25 TypeScript Runtime CLI MCP Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [16 Package and Deployment Boundaries](16-package-runtime-and-deployment-boundaries.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [35 Run Playbook State Machine](35-run-playbook-state-machine-and-portability.md)
- [36 Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md)
- [38 Global Store and Project State](38-global-store-and-project-state.md)
- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/prd/authority.ts`
- `packages/cli/src/operations/prd/ops/authority-validate.ts`
- `packages/cli/tests/prd-authority.test.ts`
- `scripts/smoke-pack.mjs`
