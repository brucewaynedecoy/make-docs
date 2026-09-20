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

Accepted result: the owner accepted the implemented W19 R3 Store-state boundary on 2026-09-09. The [closed phase and evidence](../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) record package proof, reviewed live transfer, preservation checks, final fault checks, and installed CLI status. This acceptance does not close unrelated W19 R1 work.

This document defines the current product contract for the CLI command grammar, reusable operation registry, and human/agent rendering boundary. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns the CLI command grammar, reusable operation registry, and human/agent rendering boundary. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [CLI command and operation-registry design](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md), which is provenance rather than product authority.

### Scope, Boundaries, and Runtime Invariants (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this authority owns the top-level command structure, bare-command behavior, tool self-management, operation registry and shared core, resource, project, and `run` projections, compatibility handling, and registry cohesion. The operation inventory owns admission and exclusion dispositions; [PRD 28](28-shared-agentics-installation-and-harness-exposure.md) owns static harness adapters; [PRDs 10](10-packaging-validation-and-release-reference.md), [16](16-package-runtime-and-deployment-boundaries.md), and [50](50-proportionate-testing-and-human-centered-validation.md) own direct package, release, and installed-product proof; and [38-global-store-and-project-state.md](38-global-store-and-project-state.md) owns Global Store and project-state schemas. Playbooks and Protocols own no admitted current command, registry, runtime, package, or rendering surface. The frozen P3 legacy set is a staged compatibility exception and does not create a current support claim.
- R-KEEP-1 (MUST): TypeScript is the v2 runtime authority; Rust is not a design target, distribution, or parity requirement. Remote execution through `npx`, `pnpm dlx`, and `bunx` is the primary posture, with an installed binary available where a package manager requires an entry point. The installer-first no-command posture remains valid and is not replaced by a mandatory command router. MCP tools delegate to the same deterministic operation contract as equivalent CLI commands with identical reads, configuration interpretation, provenance, audit, dry-run, and write permissions; native MCP resources use the same resolver as CLI resource list/read where supported. Deterministic logic lives in modular TypeScript operation domains behind thin dispatchers and is testable without CLI or MCP transport. Project `.make-docs/config.yaml` provides declarative project intent and presentation only after canonical routing. It is never routing or machine-permission authority.
- R-KEEP-2 (MUST): lifecycle Store mutations return the `LifecycleStoreMutationReceipt` owned by [PRD 38](38-global-store-and-project-state.md#general-lifecycle-runs-and-evidence-r-ps). CLI JSON and MCP tools serialize the same receipt fields without transport-only additions or renamed fields. Read-only, failed, conflicted, unavailable, and rolled-back lifecycle operations return no success receipt.

### Top-Level Structure (R-TOP)

- R-TOP-1 (MUST): the CLI has seven top-level commands: `setup`, `project`, `resource`, `run`, `mcp`, `update`, and `uninstall`. `setup` owns `setup`, `setup system`, `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove`. `project` owns project surface operations. `resource` owns canonical system-resource list, read, and ensure. `run` owns registry operations. `mcp` owns the MCP server. `update` and `uninstall` own tool and machine-level self-management.
- R-TOP-2 (MUST): `setup remove` is the project-removal command; top-level `uninstall` is reserved for machine-level removal.
- R-TOP-3 (MUST): multi-operation families use a subtree under a domain object mapping one-to-one to registry identifiers. Registry metadata explicitly maps an operation to its canonical CLI projection; no alias or second command grammar is inferred.

### Bare Command (R-BARE)

- R-BARE-1 (MUST): bare `make-docs` with no subcommand is context-aware — with no install detected in the working directory it starts a guided `setup` that asks before writing, and with an install present it shows status and help and does not auto-sync — preserving the installer-first no-command posture without forcing a command-router and without silently re-syncing an existing install.

### Setup Command Contract (R-SETUP)

- R-SETUP-1 (MUST): `make-docs setup` is the state-aware project entry for a new, current, partial, drifted, or recoverable install. Fresh setup selects Designs, Plans, PRD, and Work without a document-type question. Existing partial projects remain partial until a reviewed expansion.
- R-SETUP-2 (MUST): `make-docs setup system` is the direct machine-level harness-support entry. Project setup can invoke the same planner inline when a selected method is missing. It must not implement a second native configuration path.
- R-SETUP-3 (MUST): the project flow orders project state, harness selection, per-harness support, missing machine setup, resource placement, and final review. Harness detection provides a hint and does not limit selection or prove support.
- R-SETUP-4 (MUST): review groups `This computer` and `This project`. Machine writes require their own approval. The machine operation applies and verifies first. The project operation starts only after that result is valid.
- R-SETUP-5 (MUST): `setup reconfigure` opens the same state model with existing project intent selected. `setup skills` opens the same Skill planning service. `setup backup` and `setup remove` remain separate lifecycle flows.
- R-SETUP-6 (MUST): repeat setup reads desired machine state, project intent, live harness configuration, Store receipts, and pending operations. It does not repeat a verified change. It reports the exact incomplete or drifted part and resumes only through the owning operation.
- R-SETUP-7 (MUST): resource placement offers installed-provider use, all local resource copies, or selected resource types. The text states that provider reads need no Store permission and that local copies do not grant harness or Store access.
- R-SETUP-8 (MUST): setup exposes only methods declared by the source-owned static adapters in PRD 28. Skipping a method is valid. The result explains which Store-backed agent operations remain unavailable without saying that Store-free resource reads are unavailable.
- R-SETUP-9 (MUST): `setup` and `setup system` accept `--codex-method <none|mcp|command-rules>` and `--claude-code-method <none|mcp|permission-rules>` as the canonical non-interactive method inputs. A method flag selects its harness. A selected harness with no method fails before writes in non-interactive mode. `--yes` approves an already complete plan. It never supplies a missing choice.
- R-SETUP-10 (MUST): `--dry-run` resolves the same static adapter declarations, native state, receipts, machine intent, project intent, and pending operations as apply. It prints the exact grouped plan and writes nothing. An unavailable method fails with its exact blocker and one useful setup action.
- R-SETUP-11 (MUST): interactive project setup orders project state, harness selection, one method-and-Skills screen for each selected harness, resource placement, grouped review, machine apply and verify, project apply and verify, and one final result. `setup system` starts at the per-harness method screens and performs no project initialization.
- R-SETUP-12 (MUST): production setup reads method support only from the source-owned static adapter declarations. It never loads a provider, model, runtime, scenario, tuple, result record, or support registry to decide method eligibility. Repeat setup reports `current`, `drifted`, `blocked`, `unsupported`, or `incomplete` and does not issue a generic rerun instruction unless the rerun follows a named changed condition.
- R-SETUP-13 (MUST): `setup`, `setup reconfigure`, and `setup skills` read pending installation state for the target checkout before the first editable question. A pending operation stops the new setup flow. Human output names the operation, saved-plan state, last safe stage, and one permitted next action. Non-interactive, JSON, and MCP results carry the same facts. The stopped flow writes nothing.
- R-SETUP-14 (MUST): grouped setup plans machine, project, Skills, and resource placement as independent reviewed subplans. Each subplan has its own state, blocker, changed condition, result, and next action. Machine apply and verify still runs first. A later subplan failure does not roll back, hide, or repeat an earlier verified result.
- R-SETUP-15 (MUST): method state is computed after every prerequisite used by its plan, including resolved package-bin identity. A method cannot appear as available and later block on an already known prerequisite in the same review. Executable failure output keeps a stable code, checked launch and resolved paths, failed rule, and one action that can change the result. It never reduces distinct faults to a reinstall loop.
- R-SETUP-16 (MUST): `setup` and `setup system` accept `--generic-mcp-client <label>` as the canonical non-interactive input for one bounded generic MCP profile. Interactive setup offers `Generic MCP client`. Machine setup records reviewed machine intent and prints the standard client-owned configuration object. Project setup records separate project intent for the same label. Make Docs does not edit unknown client files.
- R-SETUP-17 (MUST): an active agent task that receives `store-not-configured` can show the exact selected-harness or generic-client setup command, continue independent Store-free work, refresh access after setup, and retry only the affected Store-backed operation. `store-unavailable`, `store-unsafe`, and `store-denied` keep the same scoped-stop rule with their own exact action.
- R-SETUP-18 (MUST): Make Docs CLI and Store-access remediation does not require Store, MCP, a harness receipt, Store-backed lifecycle state, or successful setup in the maintainer checkout. Repository authority, direct package commands, temporary homes, and temporary Store roots remain sufficient. A missing Store is evidence, not a remediation blocker.

### Setup Coordination and Scoped Stops (R-SETUP-COMP)

- R-SETUP-COMP-1 (MUST): setup is a guided coordinator over registered shared operations. It holds a short-lived review plan in memory, then records only approved operation intent, progress, results, and recovery facts through the owning journals. It creates no separate durable setup session authority.
- R-SETUP-COMP-2 (MUST): machine, project, Skill, and resource subplans keep separate approval, dependency, status, blocker, result, and next-action fields. Independent approved subplans can proceed. Dependent subplans wait for the named verified result.
- R-SETUP-COMP-3 (MUST): status is read-only. Repair, resume, and rollback are explicit reviewed operations. No setup, status, update, stop, or recovery route can add an unreviewed selection, method, permission, capability, or ownership claim.
- R-SETUP-COMP-4 (MUST): direct machine setup and repair remain callable without the Store or MCP path they create or repair. A Store access error stops only the affected operation and preserves the current task and all independent Store-free operations.

### Tool Self-Management (R-SELF)

- R-SELF-1 (MUST): `uninstall` removes the installed CLI when one is present and preserves the global Store by default. Store removal requires the separate explicit `--remove-store` choice, reviewed scope, and the safeguards in [PRD 38 R-LIFE-1](38-global-store-and-project-state.md#backup-uninstall-and-upgrade-r-life). `--yes` alone never authorizes Store removal. A remote-execution user with no global install receives a clear no-binary result; the same separate Store choice applies. Removal requires confirmation unless already authorized through explicit flags. Project removal remains only `setup remove`; tool uninstall must not remove repository content.
- R-SELF-2 (MUST): `update` updates a persistent global install where one exists as a detect-and-delegate wrapper over the install manager that prints the exact command when detection is ambiguous; for remote execution it reports that there is nothing persistent to update, since the runner fetches the requested version, and it applies any global-store schema migration.
- R-SELF-3 (MUST NOT): neither command may guess and then execute a destructive global change; when the install method or intent is ambiguous it prints the exact command and the affected store path rather than acting.

### The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF)

- R-REG-1 (MUST): a single operation registry is the source of truth for the admitted identifier inventory and each identifier's active or pending state. Identifiers follow a `domain.verb` or `domain.object.verb` convention, lowercase, dot-separated, with hyphenated multiword segments, and remain stable while admitted. A retired identifier is recorded in compatibility provenance and is never reassigned.
- R-REG-2 (MUST): canonical CLI projections and the MCP tool list derive from the registry and are conformance-checked in both directions. Native MCP resource discovery/read additionally derive from the same resource inventory and resolver as the `resource` CLI projection where the SDK supports them.
- R-REG-3 (MUST): a pending entry records `pendingLineage`, keeps its canonical CLI and MCP projections, and returns a typed pending result. It must not claim that its handler exists. Only an active entry has an executable handler.
- R-REG-4 (MUST): every entry declares the Store, project, and host-config access metadata owned by PRD 25. Registry and adapter validation reject missing access data, a host-config read class, or a surface that grants more access than its admitted operation set.
- R-CORE-1 (MUST): deterministic logic lives in a shared operation core of modular, per-operation modules grouped by domain — never a monolith, because a single shared library does not mean a single shared file. Every active operation is a stable identifier, a typed input, a typed output, a mutation classification, and a handler that takes the input and an execution context. Surfaces adapt argv or MCP arguments into that input and adapt the output back. They contain no operation logic. Handlers return structured data and perform effects only through the injected context, which enforces dry-run, write permission, and approval uniformly across surfaces. Presentation belongs to the surface.
- R-CORE-2 (MUST): dependencies are one-way — surfaces depend on the core, the core never depends on a surface, and no surface imports another surface.
- R-SURF-1 (MUST): registry operations project to the canonical CLI `resource`, `project`, or `run` command and to MCP tools; read-only resource list/read also project to native MCP resources where supported. `setup`, `mcp`, `update`, and `uninstall` are CLI lifecycle commands, not registry operations. Optional skills or plugins call the same public operation contract and do not become registry surfaces.
- R-SURF-2 (MUST): the W19 R1 P3 inventory plus `performance.evidence.validate` contains 25 stable nonlegacy identifiers. All 25 are active. Later owner-admitted project-state, path-hygiene, Persona, and layout operations extend the overall registry without changing or reassigning this cohort.
- R-SURF-3 (MUST): delivery history remains explicit. W19 R1 P4 activated `project.surface.ensure`; W19 R1 P6 activated the lifecycle identifiers; W19 R1 P7 activated the UAT identifiers; and W19 R2 P4 activated `performance.evidence.validate` after the decision-only authority commit and separate implementation authority. No identifier in this cohort remains pending.

- Existing Playbook and Protocol registry entries, implementations, CLI surfaces, and MCP surfaces form a frozen compatibility baseline outside the 25 admitted nonlegacy identifiers. P3 preserves that baseline unchanged and adds no legacy behavior or support claim. P5 is the quiescence stop barrier. P8 owns the fresh trace, backup, and removal.

### Registry Evolution and Resource Operations (R-REG-EVOLVE)

- R-REG-EVOLVE-1 (MUST): registry membership can expand, contract, or consolidate through approved product authority and the normal implementation and compatibility gates. Stable admitted identifiers are never reassigned. Generic MCP admission remains per profile, method, and operation and is not a fixed feature list.
- R-REG-EVOLVE-2 (MUST): `resource.list` and `resource.read` are Store-free operations. `resource.ensure` changes one named resource and cannot broaden saved selection. Any future refresh or remove operation must use the same resolver and minimum last-applied ownership contract before admission.
- R-REG-EVOLVE-3 (MUST): an MCP tool, CLI command, or native MCP resource cannot create an operation by existing alone. Registry admission, access metadata, shared-core behavior, surface parity, and package proof are all required.

### Current Run Surface (R-RUN)

- R-RUN-1 (MUST): the `run` surface exposes only registry operations. It contains active `run prd authority validate`, active `run performance evidence validate`, active `run work` commands for `item resolve`, `evidence record`, and `evidence read`, active `run lifecycle` commands for `start`, `show`, `list`, `checkpoint`, `pause`, `resume`, `attach-evidence`, `complete`, `fail`, and `abandon`, and active `run uat` commands for `scenario validate`, `persona resolve`, `target validate`, `evidence-reference validate`, `finding validate`, and `result validate`.
- R-RUN-2 (MUST NOT): wave-status, work-phase-state, phase-plan, phase-gate decision, scope-guard, closeout judgment, generation judgment, and other derivation-heavy workflow policy are not registry operations or `run` commands.
- R-RUN-3 (MUST): lifecycle adapters preserve the PRD 38 transition matrix without transport-specific changes. `show` and `list` read every status. `checkpoint` accepts `active` and `paused`. `attach-evidence` accepts every status but cannot change status or reopen a terminal run. `pause` accepts `active`; `resume` accepts `paused`; `complete` accepts `active`; and `fail` and `abandon` accept `active` or `paused`. Terminal runs reject checkpoints and later status transitions. CLI and MCP adapters return the same typed invalid-transition outcome for the same input.
- The work domain remains bounded to one identity resolver and one evidence record-and-read pair keyed to the global-store Project State model. The PRD domain remains bounded to the read-only active-authority validator unless the owning PRDs are updated.
- The performance domain remains bounded to the active read-only evidence validator admitted by R-PERF-VALIDATE. It adds no benchmark runner, write operation, retry service, or product-decision command.

- `make-docs resource list [--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json]` is deterministic and URI-sorted. `make-docs resource read <make-docs://system/...> [--origin <effective|local|installed>] [--format raw|json]` emits only bytes in raw mode and the versioned metadata/content envelope in JSON mode. Both are read-only and have `store: none`; they do not open a Store session. `make-docs resource ensure <make-docs://system/...>` is a reviewed mutation for exactly one selected local projection. All three operations use one resolver and project to MCP tools. Only list and read also back native MCP resources.
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

### Performance Evidence Validation Twin (R-PERF-VALIDATE)

- R-PERF-VALIDATE-1 (MUST): `performance.evidence.validate` is an active read-only registry operation. Its canonical projections are `make-docs run performance evidence validate --target-root <project>` and the derived MCP tool `make_docs_performance_evidence_validate`. W19 R2 P4 activated the handler after decision-only authority commit `4b8b5956` and separate implementation authority.
- R-PERF-VALIDATE-2 (MUST): one TypeScript core inventories candidate performance language and validates only the structural and traceability facts admitted by [PRD 48](48-performance-evidence-governance.md). Missing, unreadable, unsafe, or escaping target roots fail closed. Human CLI and MCP output preserve the same complete structured result and stable diagnostics.
- R-PERF-VALIDATE-3 (MUST): the canonical Performance Evidence Governance contract carries an agentic validation method for projects where the CLI is absent or unavailable. The agent reads repository authority, reports exact evidence, observations, conclusions, limits, and next actions, and never claims that the deterministic operation ran.
- R-PERF-VALIDATE-4 (MUST): one stable rule catalog records for each rule a stable ID, fact-or-decision class, deterministic support state, agent instruction location, judgment requirement, diagnostic code, focused fixtures or tests, and parity mapping or an explicit one-sided reason.
- R-PERF-VALIDATE-5 (MUST): accepted validation evidence may record exactly one proof state: `validator-passed`, `agent-reviewed`, or `combined`. A failed, blocked, or refused deterministic result records its typed validation status and no favorable proof state. `combined` requires a passed deterministic result and a completed agent review, and it preserves both records separately. No state proves a performance outcome, certifies the other method, authorizes a run or retry, closes a finding or obligation, approves a waiver, or promotes supported scope.
- R-PERF-VALIDATE-6 (MUST NOT): either method runs a benchmark, writes or repairs project files, selects a target or remediation, makes product judgments, replenishes a budget, loops on results, or substitutes for Automated Implementation Testing, Guided Progress Review, Unassisted Goal Testing, Human Experience Review, installed-product proof, release proof, or support authority.
- R-PERF-VALIDATE-7 (MUST): repository records remain authoritative. The operation and agent method may report missing, invalid, expired, non-comparable, adjacent-mode, or unsupported evidence, but neither changes repository meaning or creates hidden state.

### Command Compatibility and Upgrade Safety (R-MIG)

- R-MIG-1 (MUST): no compatibility aliases exist; noncurrent command spellings fail with guidance naming the accepted command.
- R-MIG-2 (MUST): `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration by its fingerprints and, when found, present a warning that itemizes the changes that could break on upgrade, followed by a choice between backing up and installing the latest version, which is recommended, and cancelling.
- R-MIG-3 (MUST): MCP tool names are derived from the registry identifiers, so the MCP renames follow the same registry as the CLI.
- R-MIG-4 (MUST): setup classifies and bootstraps the external Store before project mutation. Schema changes and their journal commit in one transaction. All project-operation receipts and recovery progress remain in the Store. A required Store failure stops the affected operation and returns a typed result with safe next steps. There is no local receipt projection or retry path. Recovery never replaces the whole Store after commit.
- R-MIG-5 (MUST): fresh, v1, early-v2, partial, invalid-option, interrupted, and repeated setup each returns a reachable status and one safe next action. Input failure before mutation creates no blocking operation. Repeat setup preserves independent completed subplans and resumes only incomplete work.
- R-MIG-6 (MUST): Store access results use `store-not-configured`, `store-unavailable`, `store-unsafe`, or `store-denied`. A required Store failure stops only the affected operation. It does not state that Store-free operations or the wider agent task are unavailable.

### Installation State Commands (R-STATE)

- R-STATE-1 (MUST): `make-docs project state status [--target-root <path>] [--json]` is read-only. The shared operation id is `project.state.status`. It reports Store availability, project and checkout binding, installed-state trust, pending or failed operation ids, migration outcome, and safe next actions. It creates no database, lock, project file, import, or mutation receipt.
- R-STATE-2 (MUST): `make-docs project state recover <operation-id> --resume|--rollback [--target-root <path>] [--dry-run] [--json]` uses shared operation id `project.state.recover`. Exactly one recovery action is required. The operation must belong to the target checkout. Dry-run reports the exact proposed changes without writes. Apply uses the recorded plan, Store lock, and verified bytes; changed or unknown evidence stops mutation.
- R-STATE-3 (MUST): existing setup preview/apply owns the one-time transfer of local operational files. It shows Store records to import and exact files to remove. The status and recovery commands do not add an implicit migration or expand ownership.
- R-STATE-4 (MUST): human output names the current result, what changed, what remains, and the safe next action. JSON is a versioned typed result with the same facts. Typed failure distinguishes unavailable or unsafe Store, identity conflict, active writer, unsupported legacy input, changed content, and pending recovery. CLI and MCP derive from the same registered operation and input schema.
- R-STATE-5 (MUST): these two installation-state operations extend the historical P3 inventory. Existing identifiers and general lifecycle receipt meanings remain stable. New operation admission does not reactivate retired commands.
- R-STATE-6 (MUST): status, setup admission, and recovery use one action-selection function. A complete verified plan can offer resume and rollback. An incomplete plan cannot offer resume. A proved incomplete zero-step operation with equal ledgers and no active lock offers no-effect rollback. Ambiguous evidence names no destructive action as safe.
- R-STATE-7 (MUST): operation status output includes the stable failure code, safe summary, failed stage, and last safe next action when those facts exist. Older rows with no detail report `unknown`; they do not invent a cause. Human output leads with the problem and action. The versioned typed result preserves the same facts for CLI JSON and MCP.
- R-STATE-8 (MUST): status reports project access intent separately from Store health and policy. No intent is `store-not-configured`. Configured but unreachable state is `store-unavailable`. Unsafe Store evidence and policy denial keep their own results. Status does not bootstrap, create a receipt, or turn absence into a task-wide blocker.

### Checkout Path Update and Safety Stop (R-CHECKOUT)

- R-CHECKOUT-1 (MUST): a verified checkout move can change only current path lookup data and its verification time or evidence. It cannot change project id, checkout id, local ownership, or the one-checkout-per-clone and worktree rule.
- R-CHECKOUT-2 (MUST): device, inode, path, content match, receipt, or package evidence cannot by itself authorize an identity update. A move requires the old path to be absent, the project id and managed-content facts to match, no competing checkout claim, and no pending operation.
- R-CHECKOUT-3 (MUST): a safety stop blocks only the affected mutation and reports review facts and one safe next action. It cannot rewrite identity, merge checkouts, transfer ownership, delete Store state, or choose a repair. Any identity or ownership repair is a separate explicit reviewed operation.

### Persona and Layout Commands (R-LAYOUT)

- R-LAYOUT-1 (MUST): the registry admits `project.persona.list`, `project.layout.preview`, `project.layout.prepare`, `project.layout.apply`, and `project.layout.verify` with the canonical projections below. These remain within the existing `project` domain; no new top-level command is introduced.
- R-LAYOUT-2 (MUST): Persona list resolves shipped defaults plus declarative config without opening or requiring the Store. It reports effective entries and display-field origin without changing config, identity, or directories. Layout preview reads its full inventory and exact mapping without mutation.
- R-LAYOUT-3 (MUST): preparation recomputes and matches the review digest before saving the full operation intent and required recovery evidence in the Store. Its `cli` or `manual` mode is explicit. It returns a Store operation ID and releases the live process lock. The pending operation still blocks conflicting managed changes.
- R-LAYOUT-4 (MUST): apply accepts only a prepared CLI-mode operation. Verify accepts only a prepared manual-mode operation. Both check the recorded source, destination, bytes, config-derived audience mapping, and link expectations before completion. Missing bytes, changed inputs, unresolved links, or unexplained leftovers leave the work incomplete.
- R-LAYOUT-5 (MUST): repeated `--map` options contain project-relative `source=destination` pairs. Traversal, unsafe aliases, invalid audience destinations, and paths outside the allowed project scope fail closed. The digest binds the inventory, mapping, relevant config, and planned link edits. A caller cannot use map syntax to bypass provenance or ownership checks.
- R-LAYOUT-6 (MUST): preparation, apply, and verification obey the shared write-permission and Store requirements. `project state status` and `project state recover` expose the same pending operation. There is no local state fallback. Manual moves receive their exact reviewed instructions only after successful preparation.
- R-LAYOUT-7 (MUST): registry state reflects actual delivery. An admitted pending entry names its delivery lineage and returns a typed pending result until its handler and parity checks exist. Package drafting alone is not an active-handler claim.

| Registry identifier | Canonical CLI |
| --- | --- |
| `project.persona.list` | `make-docs project persona list [--target-root <path>] [--json]` |
| `project.layout.preview` | `make-docs project layout preview [--map <source>=<destination>] [--target-root <path>] [--json]` |
| `project.layout.prepare` | `make-docs project layout prepare --review <digest> --mode cli\|manual [--map <source>=<destination>] [--target-root <path>] [--json]` |
| `project.layout.apply` | `make-docs project layout apply <operation-id> [--target-root <path>] [--json]` |
| `project.layout.verify` | `make-docs project layout verify <operation-id> [--target-root <path>] [--json]` |

Persona, asset, config, and runtime semantics remain owned by PRDs [47](47-persona-model.md), [22](22-project-documentation-asset-model.md), [24](24-project-configuration-and-convention-overlay.md), and [25](25-typescript-runtime-cli-mcp-operation-boundaries.md). The existing `project.surface.ensure assets` operation creates only the on-demand assets root and configured-harness routers. It does not create empty children.

### Registry Cohesion and Operation Admission (R-SEQ)

- R-SEQ-1 (MUST): the operation core, registry, and command tree form one coherent release surface; every retained operation is behind the registry, and no parallel or half-routed dispatcher exists.
- R-SEQ-2 (SHOULD): internal modularization may be tracked independently, but the current operation-admission and exclusion inventory remains enforced throughout that work.
- R-SEQ-3 (MUST): derivation-heavy or judgment-shaped behavior does not belong in a CLI operation. The registry admits only a fact of record or a fiddly and genuinely reused canonical-identity or parse primitive; contracts, prompts, references, and templates carry durable guidance while agents apply judgment from those resources and project files. [NORTHSTAR](../assets/project/NORTHSTAR.md) records provenance and examples for the product rule.
- R-SEQ-4 (MUST): pending projections route only to the typed pending result until their named owner phase activates a handler. They are not half-routed implementations.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that canonical CLI projections and the MCP tool list are both derived from or conformance-checked against the registry, with no admitted operation missing its required surface; resource tests additionally assert CLI/native-MCP URI, metadata, byte, and typed-error parity where native resources are supported.
- R-TEST-2 (MUST): a test asserts that surfaces contain no operation logic, by invoking an operation through the core without the CLI parser or MCP transport.
- R-TEST-3 (MUST): a test asserts that `run` exposes no `setup`, `mcp`, `update`, or `uninstall` operation and that optional agentics cannot invoke private tool lifecycle behavior.
- R-TEST-4 (MUST): a test asserts that pre-v2 detection triggers the warning-and-choice flow and that `uninstall` confirms and does not delete repository content. A P3 baseline test asserts that every existing Playbook and Protocol registry entry, implementation, CLI surface, and MCP surface remains unchanged. No new legacy surface may appear.
- R-TEST-5 (MUST): tests assert the exact stable 25-identifier W19 R1 P3 and W19 R2 P4 cohort, all 25 active states, the complete extended registry inventory, no remaining pending entry, CLI-to-MCP parity in both directions, and native MCP parity for resource list/read only.
- R-TEST-6 (MUST): focused lifecycle tests assert exact CLI/MCP receipt parity for every successful Store mutation and assert that read-only, failed, conflicted, unavailable, and rolled-back operations emit no success receipt.
- R-TEST-7 (MUST): integrated and packed CLI tests cover Store bootstrap, legacy transfer, competing writers, interrupted operations, resume, rollback, unsafe Store roots, clone bindings, and repeat setup. CLI and MCP use one service and matching typed results. Assert no local operational manifest, state directory, receipt, or lock is created.
- R-TEST-8 (MUST): setup tests cover fresh, current, partial, skipped, drifted, failed, and repeated flows; separate machine and project approvals and receipts; exact native configuration preservation; Store-free resource reads; and the rule that a project failure does not roll back verified machine setup.
- R-TEST-9 (MUST): production-path tests cover both canonical method flags, missing-choice refusal, unsupported-method refusal, machine-only setup, project config writing, dry-run parity, central registry loading, repeat-state rendering, and useful blocker actions. A test-only reviewed plan cannot satisfy this requirement.
- R-TEST-10 (MUST): interactive tests compare full setup and `setup skills` frames and key results from the same state. Admission tests prove each setup entry stops before editable questions for pending work. Recovery tests prove incomplete zero-step and complete partial action selection, persisted failure detail after restart, and human/JSON/MCP parity through one extracted package.
- R-TEST-11 (MUST): persistent-install tests invoke the normal package-manager `make-docs` link and prove exact resolved package-bin identity, consistent method state, retained verifier detail, and rejection of broken, escaping, wrapper, runner, and mismatched launch paths.
- R-TEST-12 (MUST): setup tests fail each machine, project, Skills, and resource subplan in turn. An earlier verified subplan remains current and visible. Repeat setup asks only for missing or changed choices and never replays the completed result.
- R-TEST-13 (MUST): typed-access tests cover `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied` across human, JSON, MCP, and agent paths. Store-free work continues. An active-task case grants first-party or generic MCP access, refreshes state, retries one operation, and preserves prior task progress.
- R-TEST-14 (MUST): one exact installed package with the repository unavailable covers fresh, v1, early-v2, partial, invalid-option, interrupted, repeat, no-Store, configured-Store, first-party MCP, generic MCP, recovery, repair, and removal cases. Candidate construction and proof do not require live Store or MCP access in the maintainer checkout.
- R-TEST-15 (MUST): performance validation tests cover the shared deterministic core, CLI/MCP result parity, the installed agent method, rule-catalog mappings, explicit one-sided reasons, proof-state honesty, fail-closed paths, judgment non-capabilities, and the rule that a change to either twin requires review of the mapped twin.

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
- R-INV-2 (MUST): agent-facing results state whether failure affects one operation or the requested goal. A Store-backed operation refusal never implies that Store-free work or the whole task must stop. When access can be added, the result gives one exact setup action and supports a later scoped retry without repeating already valid choices.

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
- R-FLAG-1 (MUST): `--repo-root` resolves the target from explicit input or the nearest valid declarative project identity/config and Store binding. A legacy local manifest is a classification input only. `--store-root` defaults to the platform user Store and rejects project-contained roots or symlink aliases under PRD 38. Neither override permits a local state fallback.
- R-FLAG-2 (SHOULD): command convenience defaults may come from `.make-docs/config.yaml`, with explicit flags always overriding; config remains presentation and convenience, never resource, operation, lifecycle, or routing authority, consistent with [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md).

### Noise (R-NOISE)

- R-NOISE-1 (MUST): the Node SQLite ExperimentalWarning is suppressed by a targeted process-warning filter at CLI entry that matches only that warning; never a blanket suppression.

### Hint Retirement (R-FIX)

- R-FIX-2 (MUST): CLI rendering derives resume guidance from the current bounded lifecycle run state. It never reconstructs state from evidence references, never renders guidance for a completed, failed, or abandoned run, and never interprets legacy `playbook_runs`; this PRD owns command and presentation projection while PRD 38 owns Store schemas.

### Installed Harness Compatibility (R-SEQ)

- R-SEQ-1 (MUST): direct installed-harness checks execute only against current generated-package content and CLI grammar. No check invokes an incompatible package or command form.
- R-SEQ-2 (MUST): machine-read installed-harness evidence uses current v2 dependency-block fixtures, canonical resource and lifecycle grammar, `probe`-based checks, and `--json` output.

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

## Reviewed Skill Adoption Commands

- R-SKILL-ADOPT-CMD-1 (MUST): only `make-docs setup skills` accepts `--adopt-existing <csv>` and the associated `--review <digest>`. Every adoption name must identify a selected first-party Skill in the effective registry. Ordinary `setup` supports the bundled Skill choices but does not gain adoption flags. Unknown or unselected names, `--review` without adoption, and adoption combined with `--remove` are invalid.
- R-SKILL-ADOPT-CMD-2 (MUST): `setup skills --adopt-existing <csv> --dry-run` is read-only, including the Store. It shows the selected Skills, scope/tools, complete existing/desired file inventory, file/link identities, source/package identity, proposed replacements and backups, ownership changes, blockers, and review digest. It creates no backup, directory, receipt, or operation intent.
- R-SKILL-ADOPT-CMD-3 (MUST): non-interactive adoption apply requires the matching `--review <digest>`; `--yes` alone is insufficient. Interactive review and confirmation bind to the same plan and do not require a duplicate confirmation. Under the operation lock, apply rechecks scope, tools, source/input bytes, complete inventory, selections, package identity, and Store ownership before mutation. Stale or incomplete review fails safely.
- R-SKILL-ADOPT-CMD-4 (MUST): reviewed differences and missing files within the known declared file set may be reconciled with recoverable preservation of replaced bytes. Unknown extras, unsafe links, conflicting copies, or another owner block adoption. Output explains the material effect and safe next action; a matching name is not ownership proof.
- R-SKILL-ADOPT-CMD-5 (MUST): completion distinguishes file changes from ownership changes. Adoption with identical desired bytes still records ownership through the existing Store operation service. Required recording failure or incomplete verification must not return an adopted/successful claim.
- R-SKILL-ADOPT-CMD-6 (MUST): expose pending work and safe recovery through existing `project state status` and `project state recover` behavior. Reuse [PRD 28](28-shared-agentics-installation-and-harness-exposure.md) for file/exposure ownership and [PRD 38](38-global-store-and-project-state.md) for durable state. Do not add another command family or local operational fallback.

## Requirement History

### 2026-09-18 — W22 R0

- Affected requirement or section: `Setup Command Contract`, `Operation Registry and Shared Core`, `Installation State Commands`, `Setup Coordination and Scoped Stops`, `Registry Evolution and Resource Operations`, and `Checkout Path Update and Safety Stop`
- Previous contract: Setup, registry admission, resource operations, checkout updates, and safety stops had strong local rules but no single current rule that kept setup thin and prevented update or stop behavior from changing identity or ownership.
- Replacement contract: Setup coordinates shared operations; registry membership changes only through approved work; resource reads remain Store-free; path updates and safety stops cannot rewrite identity, ownership, or repair choices.
- Rationale: Public commands must enforce the accepted identity and authority model instead of becoming an alternate recovery writer.
- Source: [W22 recovery design](../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [W22 plan](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md)

### 2026-09-17 — W19 R2 P4 Implementation

- Affected requirement or section: `R-SURF`, `R-RUN`, `R-PERF-VALIDATE`, and `R-TEST`
- Previous contract: `performance.evidence.validate` was admitted but pending with no active handler.
- Replacement contract: `performance.evidence.validate` is active through one read-only TypeScript core, a canonical CLI command, a derived MCP tool, stable diagnostics, and the separate canonical agent method.
- Rationale: The owner supplied separate implementation authority after the decision-only admission commit.
- Source: [W19 R2 P4 work record](../work/2026-08-14-w19-r2-performance-evidence-governance/04-optional-validator-operation.md)

### 2026-09-17 — W19 R2 P4 Admission

- Affected requirement or section: `R-SURF`, `R-RUN`, `R-PERF-VALIDATE`, and `R-TEST`
- Previous contract: Performance evidence validation was outside the admitted registry inventory and had no CLI, MCP, agent-method, rule-catalog, or proof-state contract.
- Replacement contract: `performance.evidence.validate` is the twenty-fifth nonlegacy identifier and remains pending until W19 R2 P4 activates it. One deterministic core projects through CLI and MCP. Canonical installed instructions provide the agent method. Focused mapping and proof-state tests keep the two methods honest.
- Rationale: The product needs a repeatable low-cost structural check and a useful CLI-absent path without allowing either method to claim the other method ran or to make product decisions.
- Source: owner-approved W19 R2 P4 direction and the [active W19 R2 backlog](../work/2026-08-14-w19-r2-performance-evidence-governance/00-index.md)

### 2026-09-14 — W19 R6 P3

- Affected requirement or section: setup command model, method eligibility, and installed-harness compatibility.
- Previous contract: Production setup loaded dynamic support facts and could return a generic rerun action for an unavailable method.
- Replacement contract: Setup uses only PRD 28 static adapter declarations, reports exact current or blocked state, and keeps Store-free resource reads available without harness access.
- Rationale: The command model must give one executable next action and cannot depend on facts that normal setup cannot create.
- Source: [P3 design](../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md) and [P3 plan](../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/03-static-harness-adapters-and-conformance-retirement.md)

### 2026-09-15 — W19 R7

- Affected requirement or section: `Setup Command Contract`, `Installation State Commands`, and `Verification and Testability`
- Previous contract: Repeat setup reported pending work and recovery had resume and rollback modes, but setup could ask all questions before it found the pending operation and the error path could recommend resume without checking plan completeness.
- Replacement contract: All setup entries stop before questions when recovery owns the checkout. One shared action rule offers only proved actions. Safe failure detail appears in human, JSON, and MCP results, and package tests cover both recovery shapes and Skills interview parity.
- Rationale: The installed CLI collected a full interview and then gave a resume command that its own recovery service rejected.
- Source: [W19 R7 design](../designs/2026-09-15-setup-interview-and-recovery-correction.md) and [plan](../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-overview.md)

### 2026-09-12 — W19 R6

- Affected requirement or section: `Top-Level Structure`, `Setup Command Contract`, `The Operation Registry and Shared Core`, `Current Run Surface`, and `Verification and Testability`
- Previous contract: setup had no machine subcommand, fresh flow was capability-led, and operation metadata carried only a broad mutation class.
- Replacement contract: `setup system` owns machine harness support, the project flow is state-aware, and registry access metadata drives Store sessions and bounded harness exposure.
- Rationale: one clear setup experience needs an exact machine boundary and truthful permission behavior for each operation.
- Source: [Unified Setup and Harness Access](../designs/2026-09-12-unified-setup-and-harness-access.md) and [W19 R6 plan](../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/00-overview.md)

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 41.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


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

### 2026-08-30 — W19 R1 P6

- Affected requirement or section: `Current Run Surface (R-RUN)`
- Previous contract: the registry defined the lifecycle identifiers and transport projections, but it did not state the exact paused and terminal transition behavior that both transports must preserve.
- Replacement contract: the CLI and MCP adapters share the accepted PRD 38 lifecycle matrix and return the same typed invalid-transition result.
- Rationale: one transport-neutral rule prevents CLI and MCP behavior from drifting while P6 activates the ten lifecycle operations.
- Source: accepted owner decision `P6-TRANSITIONS` in W19 R1 P6.

### 2026-08-30 — W19 R1 P6 safety design

- Affected requirement or section: `Command Compatibility and Upgrade Safety (R-MIG)` and `Verification and Testability (R-TEST)`
- Previous contract: setup detected pre-v2 state, but registry authority did not define checkpoint-9 Store classification, its atomic journal boundary, or the result of repeated project receipt-projection failure.
- Replacement contract: setup stops on unsafe Store classifications; one SQLite transaction commits the checkpoint-9 schema, version, and internal journal row; the project receipt is a recoverable journal projection; two projection failures return a typed stop result; and no operation identifier changes.
- Rationale: CLI setup must expose a deterministic failure without weakening the shared registry and MCP identity contract.
- Source: accepted owner decision `P6-SAFETY-DESIGN` in W19 R1 P6.

### 2026-09-09 — W19 R3

- Affected requirement or section: R-MIG, R-STATE, R-FLAG, R-TEST
- Previous contract: Setup projected a local checkpoint-9 receipt and retried twice. Root discovery depended on a local operational manifest. No installation state status/recovery command was defined.
- Replacement contract: Setup uses Store-only operation records. Typed project state status and recovery share CLI/MCP behavior. Target resolution uses declarative identity and Store bindings. The owner accepted this target with the work backlog on 2026-09-09 and then authorized implementation.
- Rationale: Make Docs tool state needs one Store authority. Project knowledge remains local.
- Source: [Store-owned installation and migration state design](../designs/2026-09-09-store-owned-installation-and-migration-state.md) and [W19 R3 plan](../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-overview.md).

### 2026-09-09 — W19 R3 Store Cleanup Scope

- Affected requirement or section: R-SELF-1
- Previous contract: Tool uninstall removed the global Store with the CLI, including the remote-execution case without a persistent binary.
- Replacement contract: Tool uninstall preserves the Store by default. Store removal requires the separate explicit `--remove-store` choice and PRD 38's reviewed cleanup safeguards. `--yes` alone does not select Store removal.
- Rationale: CLI removal and Store deletion have separate authority. Retained installation, recovery, and legacy records must not be lost through a binary-only removal request.
- Source: [PRD 38 R-LIFE-1](38-global-store-and-project-state.md#backup-uninstall-and-upgrade-r-life), [accepted Store design](../designs/2026-09-09-store-owned-installation-and-migration-state.md), and [W19 R3 implementation evidence](../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md#implementation-evidence-running).

### 2026-09-09 — W19 R4

- Date: 2026-09-09
- Coordinate: W19 R4
- Affected requirement or section: Persona and Layout Commands (R-LAYOUT).
- Previous contract: Project commands did not define effective Persona discovery or a reviewed permanent layout change sequence.
- Replacement contract: The project domain defines Persona list and layout preview, prepare, apply, and verify with one registry contract and explicit Store-writing preparation.
- Rationale: Provide a repeatable public command path without local migration plans or ambiguous completion.
- Source: [Project Assets and Persona Discovery](../designs/2026-09-09-project-assets-and-persona-discovery.md), [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md). Delivery is tracked by the single-phase R4 backlog; runtime implementation has not started.

### 2026-09-09 — W19 R5

- Affected requirement or section: `Reviewed Skill Adoption Commands`
- Previous contract: Setup-skills selection and managed updates had no explicit review-bound adoption flags for existing unowned first-party copies.
- Replacement contract: Setup skills offers named selected-first-party adoption with a read-only digest review, bound apply, preservation/blockers, and Store-backed ownership/recovery.
- Rationale: Owners must review the combined file and ownership effect before local content becomes managed.
- Source: [First-Party Skills and Managed Adoption design](../designs/2026-09-09-first-party-skills-and-managed-adoption.md) and [W19 R5 plan](../plans/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-overview.md).

### 2026-09-14 — W19 R6 P2

- Affected requirement or section: `Setup Command Contract` and `Verification and Testability`
- Previous contract: P1 added `setup system` and internal method selection, but `--yes` and `--dry-run` could proceed without explicit method input and production setup did not consume the central registry.
- Replacement contract: canonical per-harness method flags, one exact screen order, machine-only scope, dry-run parity, central registry loading, project intent writing, repeat state, and actionable blockers are required.
- Rationale: automation and agents need the same complete choices and results as the interactive flow.
- Source: [corrected W19 R6 design](../designs/2026-09-12-unified-setup-and-harness-access.md) and [W19 R6 P2 plan](../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/02-corrective-production-path-and-acceptance.md)

### 2026-09-16 — W19 R8

- Affected requirement or section: `Setup Command Contract`, `Command Compatibility and Upgrade Safety`, `Installation State Commands`, `Verification and Testability`, and `Human Rendering and Agent Invariance`
- Previous contract: Setup ordered machine before project work and required useful blockers, but one late subplan refusal could stop the whole group, method availability could disagree with its own executable check, Store absence could broaden into a task stop, and unsupported MCP clients had no focused path.
- Replacement contract: Setup uses independent subplans, complete prerequisite classification, exact verifier detail, `--generic-mcp-client <label>`, four typed Store access results, scoped agent retry, repeat-safe upgrade, and a Store-independent remediation rule. One exact installed package proves the full path.
- Rationale: The observed setup, focused system setup, and agent task formed a closed loop with no valid exit.
- Source: [W19 R8 design](../designs/2026-09-16-store-access-bootstrap-and-remediation.md) and [plan](../plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-overview.md)

### 2026-09-18 — W19 R2 P5 Registry Reconciliation

- Affected requirement or section: `R-SURF-2`, `R-SURF-3`, `R-RUN-1`, and `R-TEST-5`
- Previous contract: Current requirements still described the original lifecycle, UAT, and project-surface operations as pending and retained obsolete active and pending counts after their owner phases activated them.
- Replacement contract: The original 24-operation cohort and `performance.evidence.validate` are all active. Later admitted operations extend the complete registry. Current tests must prove the stable cohort, the extended inventory, and no remaining pending entry.
- Rationale: Current PRD authority must match the admitted registry and its accepted implementation. Historical admission records remain unchanged.
- Source: owner-approved W19 R2 P5 final correction attempt and independent review task `01a0b4b4-1e12-7cd0-95ee-51f2305c398a`.

## Source Anchors

- [W19 R8 Store Access Bootstrap and Remediation](../designs/2026-09-16-store-access-bootstrap-and-remediation.md)
- [W19 R8 plan](../plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-overview.md)
- [W19 R7 setup interview and recovery correction](../designs/2026-09-15-setup-interview-and-recovery-correction.md)
- [W19 R7 plan](../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-overview.md)
- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md)
- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/project/cli-command-reorganization.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/project/migrated-operations-inventory.md)
- [../assets/artifacts/NORTHSTAR.md](../assets/project/NORTHSTAR.md)
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
