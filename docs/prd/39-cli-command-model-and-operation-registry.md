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

- R-SCOPE-1 (MUST NOT): this authority owns the top-level command structure, bare-command behavior, tool self-management, operation registry and shared core, resource, project, and `run` projections, compatibility handling, and registry cohesion. The operation inventory owns admission and exclusion dispositions; PRDs [20](20-agent-harness-conformance-and-support-claims.md), [43](43-conformance-scenario-model-and-execution-kits.md), and [44](44-conformance-lab-sessions-and-evidence.md) own conformance; and [38-global-store-and-project-state.md](38-global-store-and-project-state.md) owns Global Store and project-state schemas. Playbooks and Protocols own no admitted current command, registry, runtime, package, or rendering surface. The frozen P3 legacy set is a staged compatibility exception and does not create a current support claim.
- R-KEEP-1 (MUST): TypeScript is the v2 runtime authority; Rust is not a design target, distribution, or parity requirement. Remote execution through `npx`, `pnpm dlx`, and `bunx` is the primary posture, with an installed binary available where a package manager requires an entry point. The installer-first no-command posture remains valid and is not replaced by a mandatory command router. MCP tools delegate to the same deterministic operation contract as equivalent CLI commands with identical reads, configuration interpretation, provenance, audit, dry-run, and write permissions; native MCP resources use the same resolver as CLI resource list/read where supported. Deterministic logic lives in modular TypeScript operation domains behind thin dispatchers and is testable without CLI or MCP transport. Project `.make-docs/config.yaml` is a presentation overlay applied after canonical routing and is never routing authority.
- R-KEEP-2 (MUST): lifecycle Store mutations return the `LifecycleStoreMutationReceipt` owned by [PRD 38](38-global-store-and-project-state.md#general-lifecycle-runs-and-evidence-r-ps). CLI JSON and MCP tools serialize the same receipt fields without transport-only additions or renamed fields. Read-only, failed, conflicted, unavailable, and rolled-back lifecycle operations return no success receipt.

### Top-Level Structure (R-TOP)

- R-TOP-1 (MUST): the CLI has seven top-level commands: `setup`, `project`, `resource`, `run`, `mcp`, `update`, and `uninstall`. `setup` owns `setup`, `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove`. `project` owns project surface operations. `resource` owns canonical system-resource list, read, and ensure. `run` owns registry operations. `mcp` owns the MCP server. `update` and `uninstall` own tool and machine-level self-management.
- R-TOP-2 (MUST): `setup remove` is the project-removal command; top-level `uninstall` is reserved for machine-level removal.
- R-TOP-3 (MUST): multi-operation families use a subtree under a domain object mapping one-to-one to registry identifiers. Registry metadata explicitly maps an operation to its canonical CLI projection; no alias or second command grammar is inferred.

### Bare Command (R-BARE)

- R-BARE-1 (MUST): bare `make-docs` with no subcommand is context-aware — with no install detected in the working directory it starts a guided `setup` that asks before writing, and with an install present it shows status and help and does not auto-sync — preserving the installer-first no-command posture without forcing a command-router and without silently re-syncing an existing install.

### Tool Self-Management (R-SELF)

- R-SELF-1 (MUST): `uninstall` removes Make Docs' machine-level footprint — the global store at `~/.make-docs/` and the installed binary when one is present — and for a remote-execution user with no global install it removes the global store and reports that no binary is installed; this is a hard cutover to this meaning, project removal is only `setup remove`, and it must confirm before removing.
- R-SELF-2 (MUST): `update` updates a persistent global install where one exists as a detect-and-delegate wrapper over the install manager that prints the exact command when detection is ambiguous; for remote execution it reports that there is nothing persistent to update, since the runner fetches the requested version, and it applies any global-store schema migration.
- R-SELF-3 (MUST NOT): neither command may guess and then execute a destructive global change; when the install method or intent is ambiguous it prints the exact command and the affected store path rather than acting.

### The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF)

- R-REG-1 (MUST): a single operation registry is the source of truth for the admitted identifier inventory and each identifier's active or pending state. Identifiers follow a `domain.verb` or `domain.object.verb` convention, lowercase, dot-separated, with hyphenated multiword segments, and remain stable while admitted. A retired identifier is recorded in compatibility provenance and is never reassigned.
- R-REG-2 (MUST): canonical CLI projections and the MCP tool list derive from the registry and are conformance-checked in both directions. Native MCP resource discovery/read additionally derive from the same resource inventory and resolver as the `resource` CLI projection where the SDK supports them.
- R-REG-3 (MUST): a pending entry records `pendingLineage`, keeps its canonical CLI and MCP projections, and returns a typed pending result. It must not claim that its handler exists. Only an active entry has an executable handler.
- R-CORE-1 (MUST): deterministic logic lives in a shared operation core of modular, per-operation modules grouped by domain — never a monolith, because a single shared library does not mean a single shared file. Every active operation is a stable identifier, a typed input, a typed output, a mutation classification, and a handler that takes the input and an execution context. Surfaces adapt argv or MCP arguments into that input and adapt the output back. They contain no operation logic. Handlers return structured data and perform effects only through the injected context, which enforces dry-run, write permission, and approval uniformly across surfaces. Presentation belongs to the surface.
- R-CORE-2 (MUST): dependencies are one-way — surfaces depend on the core, the core never depends on a surface, and no surface imports another surface.
- R-SURF-1 (MUST): registry operations project to the canonical CLI `resource`, `project`, or `run` command and to MCP tools; read-only resource list/read also project to native MCP resources where supported. `setup`, `mcp`, `update`, and `uninstall` are CLI lifecycle commands, not registry operations. Optional skills or plugins call the same public operation contract and do not become registry surfaces.
- R-SURF-2 (MUST): the finite nonlegacy P3 inventory has 24 identifiers. Seven are active: `resource.list`, `resource.read`, `resource.ensure`, `prd.authority.validate`, `work.item.resolve`, `work.evidence.record`, and `work.evidence.read`. Seventeen are pending: `project.surface.ensure`; `lifecycle.start`, `lifecycle.show`, `lifecycle.list`, `lifecycle.checkpoint`, `lifecycle.pause`, `lifecycle.resume`, `lifecycle.attach-evidence`, `lifecycle.complete`, `lifecycle.fail`, and `lifecycle.abandon`; and `uat.scenario.validate`, `uat.persona.resolve`, `uat.target.validate`, `uat.evidence-reference.validate`, `uat.finding.validate`, and `uat.result.validate`.
- R-SURF-3 (MUST): `project.surface.ensure` has `pendingLineage: W19 R1 P4`. Each lifecycle identifier has `pendingLineage: W19 R1 P6`. Each UAT identifier has `pendingLineage: W19 R1 P7`.

- Existing Playbook and Protocol registry entries, implementations, CLI surfaces, and MCP surfaces form a frozen compatibility baseline outside the 24 admitted nonlegacy identifiers. P3 preserves that baseline unchanged and adds no legacy behavior or support claim. P5 is the quiescence stop barrier. P8 owns the fresh trace, backup, and removal.

### Current Run Surface (R-RUN)

- R-RUN-1 (MUST): the `run` surface exposes only registry operations. It contains active `run prd authority validate` and active `run work` commands for `item resolve`, `evidence record`, and `evidence read`. It contains pending `run lifecycle` commands for `start`, `show`, `list`, `checkpoint`, `pause`, `resume`, `attach-evidence`, `complete`, `fail`, and `abandon`. It also contains pending `run uat` commands for `scenario validate`, `persona resolve`, `target validate`, `evidence-reference validate`, `finding validate`, and `result validate`.
- R-RUN-2 (MUST NOT): wave-status, work-phase-state, phase-plan, phase-gate decision, scope-guard, closeout judgment, generation judgment, and other derivation-heavy workflow policy are not registry operations or `run` commands.
- The work domain remains bounded to one identity resolver and one evidence record-and-read pair keyed to the global-store Project State model. The PRD domain remains bounded to the read-only active-authority validator unless the owning PRDs are updated.

- `make-docs resource list [--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json]` is deterministic and URI-sorted. `make-docs resource read <make-docs://system/...> [--origin <effective|local|installed>] [--format raw|json]` emits only bytes in raw mode and the versioned metadata/content envelope in JSON mode. Both are read-only. `make-docs resource ensure <make-docs://system/...>` is a reviewed mutation for exactly one selected local projection. All three operations use one resolver and project to MCP tools. Only list and read also back native MCP resources.
- `make-docs project surface ensure <archive|artifacts|assets>` is the canonical pending projection of `project.surface.ensure`. P4 activates the handler that creates only the selected on-demand directory and configured harness routers through a reviewed plan.

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
- R-PRD-AUTH-5 (MUST): outside the sole managed-archive path exemption `.make-docs/archive/**`, JSON, JSONL, YAML, and YML authority/source/PRD fields are checked. After camel/snake/hyphen normalization, the controlled fields are `source(s)`, `sourcePath(s)`, `sourcePrd(s)`, `sourcePrdPath(s)`, `sourcePrdDoc(s)`, `authority/authorities`, `authorityPath(s)`, `authorityPrd(s)`, `prd(s)`, `prdPath(s)`, and `prdDoc(s)`, including nested `path(s)` under source, authority, or PRD containers. Standardized provenance containers matching R-PRD-AUTH-4 are exempt. Provenance never exempts an invalid active filename, H1, kind, retired heading, or document-level coordinate.
- R-PRD-AUTH-6 (MUST): invalid or unsafe roots fail closed before scanning. Interactive TTY output presents a human summary plus all diagnostics and remediations; `--json` and non-TTY output emit the complete structured report. Failed reports exit nonzero after printing the full result; passed reports exit zero.
- R-PRD-AUTH-7 (MUST): tests prove surgical in-place PRD updates, standardized Requirement History, and genuinely new capability PRDs pass; action filenames/H1s/kinds, retired headings, current-authority links to retired records, document-level coordinates, invalid roots, and internal or escaping scan-root symlinks fail. Positive fixtures cover legitimate leading product nouns such as Update, Replacement, and Migration.

### Command Compatibility and Upgrade Safety (R-MIG)

- R-MIG-1 (MUST): no compatibility aliases exist; noncurrent command spellings fail with guidance naming the accepted command.
- R-MIG-2 (MUST): `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration by its fingerprints and, when found, present a warning that itemizes the changes that could break on upgrade, followed by a choice between backing up and installing the latest version, which is recommended, and cancelling.
- R-MIG-3 (MUST): MCP tool names are derived from the registry identifiers, so the MCP renames follow the same registry as the CLI.

### Registry Cohesion and Operation Admission (R-SEQ)

- R-SEQ-1 (MUST): the operation core, registry, and command tree form one coherent release surface; every retained operation is behind the registry, and no parallel or half-routed dispatcher exists.
- R-SEQ-2 (SHOULD): internal modularization may be tracked independently, but the current operation-admission and exclusion inventory remains enforced throughout that work.
- R-SEQ-3 (MUST): derivation-heavy or judgment-shaped behavior does not belong in a CLI operation. The registry admits only a fact of record or a fiddly and genuinely reused canonical-identity or parse primitive; contracts, prompts, references, and templates carry durable guidance while agents apply judgment from those resources and project files. [NORTHSTAR](../assets/artifacts/NORTHSTAR.md) records provenance and examples for the product rule.
- R-SEQ-4 (MUST): pending projections route only to the typed pending result until their named owner phase activates a handler. They are not half-routed implementations.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that canonical CLI projections and the MCP tool list are both derived from or conformance-checked against the registry, with no admitted operation missing its required surface; resource tests additionally assert CLI/native-MCP URI, metadata, byte, and typed-error parity where native resources are supported.
- R-TEST-2 (MUST): a test asserts that surfaces contain no operation logic, by invoking an operation through the core without the CLI parser or MCP transport.
- R-TEST-3 (MUST): a test asserts that `run` exposes no `setup`, `mcp`, `update`, or `uninstall` operation and that optional agentics cannot invoke private tool lifecycle behavior.
- R-TEST-4 (MUST): a test asserts that pre-v2 detection triggers the warning-and-choice flow and that `uninstall` confirms and does not delete repository content. A P3 baseline test asserts that every existing Playbook and Protocol registry entry, implementation, CLI surface, and MCP surface remains unchanged. No new legacy surface may appear.
- R-TEST-5 (MUST): tests assert the exact 24-identifier nonlegacy inventory, the seven active and seventeen pending states, each pending lineage value, CLI-to-MCP parity in both directions, native MCP parity for resource list/read only, and typed pending refusal without a handler claim.
- R-TEST-6 (MUST): focused lifecycle tests assert exact CLI/MCP receipt parity for every successful Store mutation and assert that read-only, failed, conflicted, unavailable, and rolled-back operations emit no success receipt.

The seven-command structure, context-aware bare command, machine-footprint `uninstall`, remote-execution-honest self-management, registry-derived surfaces, modular shared core with one-way dependencies, canonical resource grammar, registry-only lifecycle surface, compatibility rejection, and pre-v2 detection are non-substitutable. Implementations may choose the pre-v2 fingerprint set and warning copy, install-manager detection matrix, and internal operation-core module layout without changing registered identities.

Code anchors:

- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/registry.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
<a id="human-experience-and-package-grammar"></a>
## Human Experience and Compatibility Grammar

### Human Rendering and Agent Invariance

- R-INV-1 (MUST): operation result objects, MCP tool output, and machine-readable CLI output share the canonical operation-result shape and remain byte-identical across equivalent invocations, except for explicitly additive fields and flags. Human rendering never changes MCP schemas or removes an agent-reachable machine behavior.

### Render Layer (R-RENDER)

- R-RENDER-1 (MUST): each CLI operation adapter applies a CLI-only render layer to the canonical operation result, keyed by `OperationRenderMode`. On a TTY, the default rendering is human text appropriate to the operation; lifecycle operations report what happened, the compact current state, and any exact next command. `--json` emits the full canonical operation result. When stdout is not a TTY, the default is the same full JSON, so scripts and agents receive the machine contract without a presentation-dependent transformation.
- R-RENDER-2 (MUST): lifecycle evidence references and run metadata are summarized rather than repeated in text mode; the full bounded run record stays available via `--json` and `show --json`.
- R-RENDER-3 (MUST): MCP tool output derives directly from the canonical operation result, while native resource responses derive directly from the canonical resource resolver; the human render layer is CLI-only.

<a id="package-grammar-and-ship-r-gram"></a>
### Retired Package Grammar Boundary (R-GRAM)

- R-GRAM-1 (MUST NOT): `run package`, `package.ship`, Playbook compilation, harness-adapter packaging, and generated workflow bundles are not current CLI or MCP surfaces.
- R-GRAM-2 (MUST): npm package construction and release proof remain package-maintainer behavior under PRDs 10 and 16; they do not reserve registry identifiers or public commands.
- R-GRAM-3 (MUST): noncurrent package-operation spellings fail with migration guidance and never dispatch hidden compatibility behavior.

### Run-Id and Flag Ergonomics (R-RUNID, R-FLAG)

- R-RUNID-1 (MUST): run identifiers keep their sortable internal form, but every `--run-id` acceptor resolves an unambiguous prefix, and a `--last` alias selects the most recent run for the resolved project; an ambiguous prefix fails listing the candidates.
- R-FLAG-1 (MUST): `--repo-root` defaults to the nearest ancestor of the working directory carrying `.make-docs/manifest.json`; `--store-root` defaults to the real global store; both flags remain as overrides.
- R-FLAG-2 (SHOULD): command convenience defaults may come from `.make-docs/config.yaml`, with explicit flags always overriding; config remains presentation and convenience, never resource, operation, lifecycle, or routing authority, consistent with [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).

### Noise (R-NOISE)

- R-NOISE-1 (MUST): the Node SQLite ExperimentalWarning is suppressed by a targeted process-warning filter at CLI entry that matches only that warning; never a blanket suppression.

### Hint Retirement (R-FIX)

- R-FIX-2 (MUST): CLI rendering derives resume guidance from the current bounded lifecycle run state. It never reconstructs state from evidence references, never renders guidance for a completed, failed, or abandoned run, and never interprets legacy `playbook_runs`; this PRD owns command and presentation projection while PRD 38 owns Store schemas.

### Conformance Compatibility (R-SEQ)

- R-SEQ-1 (MUST): conformance executes only against the current generated-package content and CLI grammar; no scenario invokes an incompatible package or command form.
- R-SEQ-2 (MUST): [43-conformance-scenario-model-and-execution-kits.md](43-conformance-scenario-model-and-execution-kits.md) uses current v2 dependency-block fixtures, canonical resource/lifecycle grammar, `probe`-based checks, and `--json` for every transcript consumed as machine evidence.

### Verification (R-TEST)

- R-TEST-3 (MUST): a paused lifecycle run carries only its current checkpoint guidance; a completed, failed, or abandoned run carries no resume hint; evidence references remain unchanged.
- R-TEST-4 (MUST): render invariance — `--json` output and non-TTY default output are byte-identical to canonical operation results modulo explicitly additive fields; MCP tool derivation parity holds.
- R-TEST-5 (MUST): resource grammar — list output is URI-sorted, raw read emits only bytes, JSON read returns the versioned envelope, origin selection is explicit, invalid identities fail without mutation, and native MCP parity holds where supported.
- R-TEST-6 (MUST): lifecycle grammar — start, show, list, checkpoint, pause, resume, attach-evidence, complete, fail, and abandon return typed results and successful mutation receipts; an unavailable Store returns typed `run-capture-unavailable`, proves no capture, and implies no retry, while the caller's external lifecycle workflow may continue unless its gate directly requires Store capture; Playbook/package identifiers remain absent.

Code anchors:

- `packages/cli/src/run/cli.ts`
- `packages/cli/src/operations/types.ts`
- `packages/cli/src/operations/registry.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
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

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Scope, Boundaries, and Runtime Invariants`, `Top-Level Structure`, `The Operation Registry and Shared Core`, `Current Run Surface`, `Registry Cohesion and Operation Admission`, `Verification and Testability`, `Human Experience and Compatibility Grammar`, and `Verification`
- Previous contract: The registry projected every operation through `run`, Playbook steps were a third surface, current grammar included Run Playbook and Playbook package compilation/ship operations, and the PRD authority validator exempted the old documentation archive path.
- Replacement contract: Canonical registry projections include top-level resource list/read, project surface ensure, and bounded lifecycle run operations; native MCP resource parity shares the resource resolver where supported; Playbook and Protocol operations/packages are absent; lifecycle mutations return typed Store receipts over general run/evidence records; and the validator's managed-archive exemption follows `.make-docs/archive/**`.
- Rationale: CLI and operation-registry authority must match the accepted smaller v2 product boundary while preserving deterministic human/agent parity.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-17 — W19 R1 P3

- Date: 2026-08-17
- Coordinate: W19 R1 P3
- Affected requirement or section: `R-SCOPE-1`, `R-TOP-1`, `R-REG-1` through `R-REG-3`, `R-SURF-2` through `R-SURF-3`, `R-RUN-1`, `R-SEQ-4`, and `R-TEST-4` through `R-TEST-5`
- Previous contract: The registry did not state the finite active and pending inventory. The target-state legacy absence rule also did not state the safe staged compatibility exception.
- Replacement contract: P3 owns a 24-identifier nonlegacy inventory with exact active and pending states. P3 also freezes the separate legacy baseline. P4, P6, and P7 activate their handlers. P5 and P8 own the legacy stop and removal sequence.
- Rationale: The approved decisions make adapter parity finite and prevent both false handler claims and partial legacy removal.
- Source: [W19 R1 P3](../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/03-operation-registry-cli-and-mcp.md)

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md)
- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)
- [../assets/artifacts/NORTHSTAR.md](../assets/artifacts/NORTHSTAR.md)
- [../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md](../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md)
- [../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md](../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [25 TypeScript Runtime CLI MCP Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [16 Package and Deployment Boundaries](16-package-runtime-and-deployment-boundaries.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [38 Global Store and Project State](38-global-store-and-project-state.md)
- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/registry.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/prd/authority.ts`
- `packages/cli/src/operations/prd/ops/authority-validate.ts`
- `packages/cli/tests/prd-authority.test.ts`
- `scripts/smoke-pack.mjs`
