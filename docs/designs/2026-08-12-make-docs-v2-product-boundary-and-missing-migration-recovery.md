---
title: "Make Docs v2 Product Boundary and Missing Migration Recovery"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design removes active product capabilities and revises existing v2 resource, project-state, information-architecture, migration, and agentics decisions."
  coordinate_handoff: "unresolved; planner must resolve before writing."
source:
  type: "manual-request"
  baseline: "8dd9a6e209fed76a785fca4cceba8a12c8793d30"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "revisit-design-before-plan"
  reason: "The unexecuted W19 R0 plan targets Protocols, but the approved product boundary removes both Playbooks and Protocols; this design must supersede that prospective direction before any replacement plan is authorized."
---

# Make Docs v2 Product Boundary and Missing Migration Recovery

## Purpose

This design establishes the owner-review draft for the Make Docs v2 product boundary and the recovery of migrations that the current repository authority and runtime do not yet complete. It removes Playbooks and Protocols from current Make Docs authority and behavior, defines the machine-served and optionally project-local system-resource model, corrects project documentation information architecture, preserves user and historical data non-destructively, rehomes naive end-user UAT without Playbooks, and defines lightweight Global Store run capture and optional agentics boundaries.

This is a design-only authority candidate grounded in repository baseline `8dd9a6e209fed76a785fca4cceba8a12c8793d30` and the Stage 0 findings. It does not update PRDs, replace the superseded W19 plan, generate work, migrate a manifest, run setup, change runtime behavior, or authorize implementation.

## Context

### Baseline and authority status

The inspected checkout is tracked-clean at exact baseline `8dd9a6e209fed76a785fca4cceba8a12c8793d30`, with only this draft design present as an untracked file. Repository designs, current PRDs, implementation, tests, and manifests are canonical evidence for the present state. The Bear proposals named by the recovery brief informed this design but remain proposal input rather than repository authority.

The lifecycle normally proceeds design -> plan -> PRD -> work -> implementation. This recovery deliberately revisits design before planning because the unexecuted [W19 R0 Playbooks to Protocol Narrow Guardrail Refactor](../plans/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/00-overview.md) preserves a Protocol target that the owner has now rejected. W19 R0 remains historical and investigative provenance; it is superseded only as prospective direction and is not deleted, rewritten, or treated as executed work.

### Present-state audit

The current product tree and runtime diverge from the approved v2 boundary in several connected ways:

- The current manifest records 83 assets and 46 recorded-hash mismatches, with no recorded files missing. This is stale ownership and package metadata evidence, not permission to run setup or rewrite the manifest.
- Default materialization remains a full project snapshot. Provider and cache concepts exist in internal types, compatibility checks, and manifest evidence, but the machine-installed CLI does not yet expose a canonical system-resource list/read interface.
- The MCP server registers tools derived from the operation registry and a small hand-defined tool set. It does not register native MCP `resources/list` or `resources/read` surfaces.
- System resources still materialize directly under `.make-docs/contracts/`, `.make-docs/references/`, `.make-docs/templates/`, and `.make-docs/scripts/`. Prompts still share the reference namespace instead of being a top-level system-resource type.
- The first-party Python helper `.make-docs/scripts/check_path_hygiene.py` is still shipped, recorded in the manifest, and asserted by install and consistency tests.
- Global Store schema v1 creates `projects`, `playbook_runs`, and `work_evidence`. It has no general lightweight run record or evidence-reference model independent of Playbooks.
- Current PRDs make Playbooks a deep product dependency. PRDs [34](../prd/34-playbook-authoring-contract-and-model.md), [35](../prd/35-run-playbook-state-machine-and-portability.md), and [36](../prd/36-playbook-packaging-compiler-and-harness-adapters.md) directly own Playbook authoring, execution, persistence, portability, packaging, compiler, and harness-adapter behavior, while other active PRDs and register items depend on those owners.
- The active register contains Playbook-shaped obligations and questions including O-002, Q-015, Q-020, R-016, R-017, R-020, and R-027. Those entries need later disposition through the PRD authority workflow rather than silent deletion from this design.
- [Naive End-User Acceptance Testing](../prd/46-naive-end-user-acceptance-testing.md) remains valid product authority, but its current facilitator, tester, scenario, lifecycle, and evidence surfaces intersect Playbook-shaped resources that cannot ship under this boundary.
- Compatibility classification already recognizes clean, modified, partial, malformed, missing-manifest, and unknown shapes, together with full-snapshot, provider-backed, and hybrid cache evidence. It does not yet encode the final prompt, resource-root, archive, artifact, persona-asset, Python-script, Playbook-removal, or general-run-capture migrations in this design.

This is not a naming cleanup. The repository contains Playbook parsers and validators, run progression operations, Store persistence, packaging compilers, harness capability descriptors, MCP-derived operations, conformance fixtures, installed assets, routers, tests, and documentation authority. Removal therefore requires traced consumers, explicit preservation rules, and ordered migration rather than global search-and-replace.

### Forces and constraints

Make Docs is both a maintained product and a dogfood consumer. Shipped resources are authored first in `packages/docs/template/`; package build flow projects them into the installed package; root `.make-docs/` and `docs/` validate the product as dogfood while also containing project-authored designs, plans, PRDs, work, history, and evidence. Project content must never be inferred to be product-owned merely because it resembles a current or former Make Docs asset.

Projects must remain understandable without loading every system contract into context. Progressive disclosure requires small local routers, stable resource identifiers, deterministic machine-level list/read behavior, and optional local projection for offline or portable use. Optional agentics may accelerate those seams but cannot be required for correctness.

Migration is safety-sensitive because current manifests are not sufficient proof for every existing file. Hash-matching managed assets may be transformed or removed automatically within a reviewed migration, while modified, project-authored, mixed, or ambiguous content must be preserved, exported, conflict-routed, or stopped for review.

## Decision

### 1. Product boundary

Make Docs v2 ships neither Playbooks nor Protocols in current product authority or behavior.

In scope for removal are Playbook or Protocol document kinds, asset families, selection and dependency models, parser and validator behavior, workflow execution and progression, gates and resume behavior, Playbook-specific Store APIs, packaging and compiler output, harness adapters whose only consumer is Playbooks, generated workflow bundles, CLI and MCP operations, conformance scenarios, support claims, and default procedural assets.

Historical designs, plans, work backlogs, history records, archives, validation evidence, and completed implementation records remain intact as provenance. Current normative authorities may later receive requirement-history and supersession notes so historical work cannot be mistaken for current product behavior, but this design does not perform that reconciliation.

The standalone Playbooks product is independent and optional. Make Docs does not depend on it, bundle it, discover it, assume it is installed, or claim compatibility or interoperability. A future integration or a reconsidered Protocol capability requires a new owner-approved design and PRD classification after v2.

Naive end-user UAT remains in scope as a Make Docs capability. Generic plugin and agentics infrastructure remains only when a traced non-Playbook consumer exists. General machine-served resources, project routers, migration safety, Global Store project identity, work evidence that is not Playbook-specific, and deterministic operation-registry infrastructure remain in scope.

Out of scope are implementation, PRD edits, a replacement W19 plan, manifest migration, setup or reconfiguration execution, dogfood regeneration, package publication, a standalone Playbooks integration, performance target invention, and deletion of legacy Store data.

All first-party deterministic logic, including path hygiene, belongs in the TypeScript CLI and operation registry. Fresh and migrated projects do not receive installed Python scripts or another project-local helper-runtime replacement.

### 2. Canonical boundaries

| Boundary | Canonical responsibility | Must not become |
| --- | --- | --- |
| `packages/docs/template/` | First mutation target for shipped routers, system resources, templates, and default project structure | A place for root-project designs, plans, PRDs, work, or other dogfood-only content |
| Package build projection | Bundled bytes used by the installed Make Docs CLI | An independently hand-maintained template authority |
| Machine-installed Make Docs CLI | Canonical provider, identifier resolver, deterministic operation registry, and default system-resource list/read interface | A hidden dependency on project-local snapshots or agentics |
| Project `.make-docs/manifest.json` | Project identity, selections, managed ownership, provenance, hashes, and migration evidence | Product requirements or an excuse to overwrite ambiguous files |
| Project `.make-docs/system/` | Always-local configured-harness routers and typed directories, plus optional selected managed resource bodies and explicit project-authored overrides | A mandatory full copy of every installed resource body |
| Project routers | Small, harness-appropriate progressive-disclosure entry points | Full duplicated contracts or opaque links to unavailable state |
| Root `.make-docs/` and `docs/` in this repository | Dogfood projection plus project-authored repository authority | The upstream source for shipped defaults |
| Machine Global Store | Local project registry, general run state, and evidence references | Repository product authority, document storage, or a cloud telemetry system |

The package and dogfood order remains upstream source -> package projection -> root dogfood -> installed-project validation. Generated package projections are not edited by hand. Project-authored documents continue to be edited in place under root `docs/`.

### 3. System-resource identity and resolution

The system-resource types are `contract`, `prompt`, `reference`, and `template`. Prompts are peers of the other three types and never live beneath the reference namespace in the target model.

Every shipped resource has one stable URI of the form `make-docs://system/<type>/<posix-relative-path>`. The singular `<type>` is one of the four values above. Paths are normalized, case-sensitive identifiers using `/`, contain no `.` or `..` segments, and never expose an installation path. The resource payload includes the URI, type, media type, content hash, package identity and version, provenance, and content.

Resolution uses this precedence:

1. A present project-local resource at `.make-docs/system/<plural-type>/<relative-path>` whose manifest ownership and hash evidence are trustworthy.
2. The matching machine-installed resource provided by the current Make Docs CLI.
3. A typed not-found or provenance error with recovery guidance.

Project-local precedence applies to both explicit project-owned overrides and clean installed managed snapshots, but the manifest reports which class supplied the result. A locally changed managed snapshot does not silently become an override. It enters conflict state until the user explicitly preserves it as project-owned, replaces it with a managed version, or skips the update.

There is no implicit network fallback. A provider or cache may be an internal packaging or installation source only when its immutable identity and hashes are verified, but agents resolve resources through the CLI or local files. If the CLI is unavailable and the selected resource is not local, routers say that the resource is unavailable; they do not pretend the project is portable.

### 4. CLI list/read UX and MCP parity

The canonical human and agent commands are:

```text
make-docs resource list [--type <contract|prompt|reference|template>] [--prefix <path>] [--origin <effective|local|installed>] [--format table|json]
make-docs resource read <make-docs://system/...> [--origin <effective|local|installed>] [--format raw|json]
```

`list` is deterministic and sorted by URI. The default origin is `effective`, which applies local-first resolution and reports `project-override`, `managed-snapshot`, or `installed-machine` for each result. JSON output is versioned and includes resource metadata without embedding content. `read --format raw` writes only bytes to standard output; `read --format json` returns the metadata envelope and content. Missing resources, invalid identifiers, hash mismatches, ambiguous ownership, and unavailable installed providers use distinct nonzero diagnostics and do not mutate the project.

These commands are first-party operations in the TypeScript operation registry. The registry owns normalization, lookup, provenance, hashing, diagnostics, and result schemas so CLI and MCP do not reimplement logic.

Where the MCP SDK supports native resources, the Make Docs MCP server exposes the same URI set through `resources/list` and `resources/read`. Native MCP resource parity means identical effective resolution, metadata, bytes, and errors for the same URI; it does not require MCP-specific write operations. Tool wrappers may remain for operation discovery, but tool presence alone is not evidence of native resource parity. Unsupported MCP clients fall back to the CLI commands described by project routers.

### 5. Initialization and reconfiguration selection model

Every initialized or reconfigured project receives:

- `.make-docs/manifest.json` with stable project identity and the resource, router, and optional-agentics selections;
- an unconditional configured-harness router foundation at the project root, `docs/`, and `docs/assets/`;
- configured-harness routers at `.make-docs/`, `.make-docs/system/`, and `.make-docs/system/{contracts,prompts,references,templates}/`;
- capability-local configured-harness routers at `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` only when the resolved effective profile enables the matching document type and its dependencies;
- discoverability for `.make-docs/archive/`, `docs/artifacts/`, and `docs/assets/<persona-slug>/testing/` even while those on-demand directories are absent.

The default resource selection is machine-served with no project-local resource bodies. The always-local router skeleton and typed directories remain present for each configured harness. Interactive setup and reconfiguration offer `none`, individual resource types, or `all` for local resource-body projection, explain portability and maintenance trade-offs, and show the resulting file plan before writing. Non-interactive operation requires explicit flags or saved manifest selections; it never broadens a prior resource-body selection silently.

Router selection is driven by configured harnesses, not by the presence of optional agentics. An unrecognized harness cannot receive an invented router contract. The CLI either uses a generic router explicitly supported by repository authority or reports that no router is available.

Reconfiguration reads and classifies the current manifest and filesystem before planning. It reuses saved selections by default, permits additions or removals explicitly, and computes one reviewed plan. A bare setup or reconfigure command may recommend migration but cannot silently execute an ambiguous or destructive legacy migration.

### 6. Local manifest, ownership, and provenance

The next manifest schema revision must represent each project-local resource and router with these concepts. Router ownership is separate from resource-body projection selection and ownership:

- stable resource URI and local path;
- resource type and selection trigger;
- ownership class: `managed-snapshot` or `project-owned`;
- provenance: source package, source version, immutable source ref when applicable, and materialization mode;
- provenance state: `verified`, `incomplete`, `ambiguous`, or `contradictory`, with every competing source claim and its evidence references retained when the state is `ambiguous`;
- hash algorithm, expected source hash, installed hash, and last verified time;
- configured harness and router kind for router files;
- lifecycle disposition such as active, preserved-export, superseded-managed, or conflict;
- explicit adoption receipt when a user converts a modified managed file into project-owned content.

Ownership is never inferred solely from path or filename. Make Docs may update or remove a file automatically only when the manifest records `verified` Make Docs ownership and the current bytes match the last trusted managed hash or managed block. An `incomplete`, `ambiguous`, or `contradictory` provenance state, or a missing, stale, or malformed record, fails closed for that resource: the current bytes are preserved, no ownership is selected or minted, and transformation waits for an explicit review or adoption receipt.

Project-owned overrides are outside automatic update and removal. A local file that collides with a desired resource but has no trustworthy ownership record is ambiguous user work and must be preserved. Managed snapshots and project-owned overrides may share the same target namespace because resolution is path-based, but their manifest ownership and lifecycle rules remain distinct.

### 7. Setup skip, conflict, backup, update, and uninstall safety

Migration extends the existing single-audit safety model. One classification snapshot produces the proposed backup, preserve, export, transform, remove, install, and skip sets. User approval applies to that exact snapshot; the destructive phase does not re-audit and silently change scope between approval and execution.

Conflict choices are file-scoped and explicit: preserve as project-owned, export then replace, overwrite a proven managed file, skip, or stop. Append-merge is not an ownership model. A conflict record includes both hashes, provenance, the proposed target, and recovery guidance.

Before any destructive migration, Make Docs creates a dated backup with a machine-readable manifest. Rollback restores from that backup rather than attempting an implicit inverse migration. Backup and rollback preserve relative paths, ownership metadata, and hashes. Failure before commit leaves the project unchanged; failure after mutation reports the completed journal steps and exact restore action.

Uninstall removes only proven clean managed assets and managed router blocks. It preserves project-owned resources, modified managed resources, ambiguous content, archives, project documents, legacy Playbook data, and Global Store data unless an independently authorized option names those targets. Empty managed directories may be pruned only after confirming they contain no preserved descendants.

### 8. Target information architecture and always-local routers

The target project shape is:

```text
.make-docs/
  manifest.json
  <configured harness routers>
  system/
    <configured harness routers>
    contracts/
      <configured harness routers>
    prompts/
      <configured harness routers>
    references/
      <configured harness routers>
    templates/
      <configured harness routers>
  archive/
    <Make Docs-managed archival and provenance records>
docs/
  <always-present configured harness routers>
  designs/
    <configured harness routers when designs are effective>
  plans/
    <configured harness routers when plans are effective>
  prd/
    <configured harness routers when PRDs are effective>
  work/
    <configured harness routers when work is effective>
  artifacts/
    <non-authoritative source and analysis inputs>
  assets/
    <configured harness routers at this root only>
    <persona-slug>/
      <reader guide or asset>
      testing/
        <naive-UAT scenarios, outcomes, findings, and evidence>
```

The unconditional router foundation for each configured harness is the project root, `docs/`, `docs/assets/`, `.make-docs/`, `.make-docs/system/`, and `.make-docs/system/{contracts,prompts,references,templates}/`. The resolved effective profile and its dependencies control the capability-local routers: `docs/designs/` for designs, `docs/plans/` for plans, `docs/prd/` for PRDs, and `docs/work/` for work. An all-four effective profile therefore has 13 router surfaces per harness. Two configured harnesses produce 26 router files. Resource projection controls the resource bodies inside the four typed system directories only. `docs/assets/` has one managed router at its root. Make Docs does not install managed routers below that root, including legacy `docs/assets/{archive,artifacts,library,playbooks}/` paths or Persona subdirectories. `.make-docs/archive/`, `docs/artifacts/`, and `docs/assets/<persona-slug>/testing/` are created only when first needed. Empty placeholders for those on-demand surfaces do not ship. Library, Playbook, and Protocol paths are not target families.

The TypeScript operation registry owns one deterministic `project.surface.ensure` operation, exposed as `make-docs project surface ensure <archive|artifacts|assets>`. The `archive` and `artifacts` targets create their on-demand directory and harness-appropriate local routers in one reviewed plan, record managed router ownership in the manifest, and leave pre-existing content untouched. The `assets` target remains supported even though `docs/assets/` is part of the unconditional foundation. It is idempotent when the root and configured-harness routers are current. When the root surface or its routers are missing, it may create or safely repair only that root surface under the normal ownership, managed-block, conflict, and review rules. It never creates Persona or testing children. Persona testing directories remain on demand and are routed by the one `docs/assets/` root router. Direct manual creation remains possible, but Make Docs cannot then claim ownership without an explicit adoption flow.

Always-present `docs/` routers use the exact heading `# Documentation Router` and keep the approved documentation routing duties. They cover lifecycle, design, planning, PRD, work, risk, artifact, Persona, UAT, coverage, history, link, and formatting rules. They also describe all three possible downstream surfaces even while absent. They distinguish authority: `.make-docs/archive/` holds Make Docs-managed historical and provenance records; `docs/artifacts/` holds non-authoritative inputs; `docs/assets/<persona>/` holds persona-scoped reader-facing guides, assets, and testing evidence whose audience model comes from Persona authority. The `docs/assets/<persona>/testing/` subtree is created on demand for Naive UAT and is routed by `docs/assets/`; it does not receive a managed subtree router. Routers tell agents to use a valid local resource body first and to use `make-docs resource read <uri>` when that body is absent. They point to installed system resources instead of copying reusable policy into router text. They do not infer Skills, plugins, Playbooks, Protocols, or unavailable policy.

The authorized change-plan preflight must inventory current harness router filenames, generic fallback behavior, and the evidence supporting each claimed router contract. Only evidence-backed router shapes enter the plan; an absent or unsupported fallback is recorded as absent rather than invented.

### 9. Playbook and Protocol retirement and preservation

The authorized change-plan preflight must build a traced inventory from PRDs through operation registry entries, CLI and MCP surfaces, source modules, Store consumers, asset catalogs, manifests, routers, templates, tests, conformance claims, package contents, and guides. It must also identify every plugin, hook, skill, extension, registry primitive, and harness adapter with a current non-Playbook consumer. Removal proceeds from public authority and new-write prevention toward implementation retirement, not from deleting source directories first.

Automatic removal is limited to files proven to be clean Make Docs-managed Playbook assets by manifest ownership and hashes. Modified managed assets, project-authored Playbook-like documents, unknown assets, and files with mixed ownership are preserved. The migration offers an export report that records original path, hash, former classification, and preserved destination without claiming the content is supported by Make Docs v2.

Historical repository designs, plans, work, archives, and evidence retain their original terminology. Concise supersession notes may be added later to active navigation or authority surfaces, but history is not globally rewritten. The W19 R0 plan remains unexecuted provenance and its Protocol target is marked superseded during later authority reconciliation.

The existing `playbook_runs` table and rows remain opaque historical data. v2 stops creating or interpreting those rows after Playbook operations retire. No table drop, row deletion, semantic conversion, or retention-policy change occurs without a future owner-approved migration specifically covering that data.

Generic agentics, plugin, registry, and harness infrastructure survives only if a traced current non-Playbook consumer needs it. Shared primitives are narrowed to that consumer contract; Playbook-only adapters, support claims, and fixtures are removed. Absence of a traced consumer is evidence for retirement, not an invitation to preserve speculative infrastructure.

### 10. Naive end-user UAT rehoming

The current [Naive End-User Acceptance Testing PRD](../prd/46-naive-end-user-acceptance-testing.md) remains the capability authority until later controlled reconciliation, but its current `coverage_scope: non-persona` rule is superseded by this owner-approved direction once this design is accepted. Qualified-tester, installed-product, anti-coaching, scenario identity, observable outcome, evidence, reproducibility, finding routing, and phase-gate semantics survive.

Naive UAT is always executed as one configured persona. Make Docs v2 preserves `agent`, `maintainer`, and `user` as general Persona primitives, but only a configured persona mapped to `user` or `maintainer` is eligible as the selected UAT persona. An agent may be the isolated execution actor without becoming the selected UAT audience, and an `agent`-primitive persona is not eligible as that audience. The selected persona is recorded by slug. When no persona is supplied, execution defaults to the canonical `user` persona. Custom personas remain eligible when they map to `user` or `maintainer`. The Persona and Naive-UAT PRDs must be reconciled together so this rule has one current authority.

Playbook-shaped facilitator and tester assets do not survive as document kinds. The capability instead has two complementary delivery forms that share one contract:

- A system workflow, its governing contracts, prompts or references, and applicable templates define qualification, facilitator framing, scenario structure, activation, routing, evidence, and phase-gate consumption. The installed CLI is the default list/read provider, native MCP exposes the same system resources where supported, and projects may optionally materialize their bodies under `.make-docs/system/{contracts,prompts,references,templates}/`. The typed directories and configured-harness routers remain local even when the bodies are absent.
- A first-party Naive-UAT Skill packages concise routing plus thin shim scripts for harnesses that cannot directly issue shell commands or use MCP. Every shim delegates to the same typed Make Docs CLI operations and may adapt arguments or return receipts only; it contains no UAT policy, target selection, evidence semantics, state machine, or other business logic. The Skill is a supported optional access adapter, not a second workflow authority or a correctness prerequisite.

The TypeScript registry owns deterministic scenario identity, validation, persona resolution, evidence-reference, and lifecycle-run operations where current PRD authority requires them. Direct CLI, native MCP, system workflow, and Skill-assisted execution must resolve the same persona, operations, and typed results.

Canonical append-only `NUAT-###` scenario definitions, identities, and versions remain in the active PRD that owns the primary external user outcome. `docs/assets/<persona-slug>/testing/`, using the actual selected persona slug, holds persona-specific rendered tester packets, executions, outcomes, findings, and evidence bound to the exact canonical scenario version or content digest; it must not become a second scenario authority. Those testing assets never live under `.make-docs/archive/` or `docs/artifacts/`. The Global Store may record run progress and project-relative evidence references, but it does not replace the versioned project evidence. Migration moves only evidence with a proven persona mapping; evidence whose persona or ownership is ambiguous remains in place with a typed migration finding until reviewed.

### 11. General run capture and optional agentics

The Global Store gains a general lightweight run model alongside, not by mutating, legacy `playbook_runs`. The minimum model is:

- `runs`: project ID, run ID, run type, lifecycle stage, status, current checkpoint, optimistic version, start/update/finish timestamps, and bounded metadata;
- `run_evidence`: run ID, stable evidence ID, evidence kind, project-relative or sanitized external reference, optional digest, and recorded timestamp.

This is current state plus evidence references, not a full event-sourcing system. Supported statuses are `active`, `paused`, `completed`, `failed`, and `abandoned`. Deterministic registry operations cover start, show, list, checkpoint, pause, resume, attach evidence, complete, fail, and abandon. The v2 run-type registry is closed to the single `lifecycle` type; the separate lifecycle-stage field is limited to `design`, `plan`, `prd`, `work`, `implementation`, `release`, `archive`, and `retrospective`. Wave, phase, operation, UAT, and other local labels belong in bounded metadata and do not create hidden run types. Any additional product-level run type requires later design and schema authority.

Project identity comes from the local manifest. The CLI bootstraps the machine-local Store on first operation, applies ordered transactional migrations, uses platform-appropriate locking and SQLite busy handling, and never creates Store files inside the repository. Every successful Store mutation returns a typed receipt identifying the run, operation, schema version, resulting optimistic version, and commit time; the receipt proves only that Store mutation, not the underlying lifecycle outcome or phase gate. A failed Store mutation returns a typed `run-capture-unavailable` result, leaves repository authority untouched, and creates no implied queued or background retry. The workflow may proceed with that visible warning, but it cannot claim the run, checkpoint, or evidence reference was captured. A successful Store receipt is gate-required only when the gate's accepted scope directly tests Store migration or run-capture behavior; all other lifecycle gates treat run capture as nonblocking ancillary evidence.

Checkpoint 9 classifies the Store before any setup mutation and stops setup for corrupt, unknown, newer, or indeterminate state. Its schema DDL, `user_version`, and one internal checkpoint-journal row commit in one SQLite write transaction. That transaction is the Store rollback and cross-process serialization boundary. The journal stores only checkpoint and receipt-projection metadata. It stores no Store payload. The project-local checkpoint-9 migration receipt is an idempotent projection of the committed journal row. If receipt projection fails, setup retries it once. If both attempts fail, setup returns a typed checkpoint result and stops before later setup mutations. A later setup can use the committed journal row to recover the projection before it makes a new setup mutation. After the Store transaction commits, setup does not replace or restore the whole Store or its database. This rule protects writes from another process or project. It does not add or rename a CLI or MCP operation identifier.

Core routers and system references teach agents when to invoke the CLI operations. There is no background daemon and no hidden automatic mutation. “Automatic” means that a selected, evidence-backed skill, hook, plugin, or extension invokes the same deterministic operations and returns the same receipt.

Agentics are optional setup or reconfiguration selections. They may improve discovery, correct sequencing, and run capture, but core operation through routers, resources, and CLI is complete without them. The first-party Naive-UAT Skill is one such supported adapter: it must exist as a distributable capability, while local installation or harness exposure remains optional because the system workflow and CLI/MCP resource path are complete without it. Each harness integration requires a traced non-Playbook purpose, real capability evidence, an install and uninstall contract, and an honest support status. Unsupported hooks or extension APIs are not simulated. Agentics package layout and support matrix remain a separate follow-on design unless current repository authority already establishes them.

### 12. Cross-platform, path, privacy, and security requirements

All resource IDs and manifest paths use normalized repository-relative POSIX notation. Filesystem access resolves against explicit roots, rejects traversal and symlink escape, and compares platform-canonical paths without exposing real checkout paths in project documentation. Windows drive letters, UNC paths, macOS case behavior, Linux permissions, and path-length limits require fixtures proportional to changed path logic.

Machine installation and Store locations use platform APIs and sanitized documentation placeholders rather than hard-coded home directories. Atomic writes use same-filesystem temporary files, flush and rename where supported, and retain recovery receipts on partial failure. Concurrent reconfiguration and migration use an explicit project lock; concurrent Store writes use transactions, bounded busy retries, and typed failure rather than indefinite polling.

Resource content is data, not executable code. `resource read` never evaluates prompts or templates, follows embedded links, or runs scripts. Local overrides are untrusted project content and their provenance is shown to the caller. Hashes establish byte identity, not trust. Provider identities and immutable refs are verified before materialization.

The Global Store is local-only by default and may contain sensitive project roots, run labels, and evidence references. It stores no document bodies, prompt bodies, secrets, or evidence payloads by default. Export is explicit, redacts or relativizes machine paths by default, and never uploads data. Uninstall reports retained Store state and requires separate explicit authority to prune it.

### 13. Compatibility classification and migration order

The existing top-level source states remain: `clean-v1`, `clean-v2-full-snapshot`, `clean-v2-provider-backed`, `clean-v2-hybrid-pinned-cache`, `modified-v1`, `partial-install`, `malformed-manifest`, `missing-manifest-recognizable`, and `unknown-shape`. Existing dispositions remain `sync`, `migrate`, `migrate-with-review`, `backup-and-reinstall`, and `manual-review-required`.

To encode this target without an unmaintainable cross-product of state names, classification adds orthogonal migration facets for resource layout, prompt layout, archive layout, artifact layout, persona assets, Playbook and Protocol assets, path-hygiene scripts, router bootstrap, manifest ownership, Store schema, and optional agentics. Each filesystem facet reports `absent`, `managed-clean`, `managed-modified`, `project-owned`, `mixed`, or `unknown`; the manifest-provenance facet reports `absent`, `verified`, `incomplete`, `ambiguous`, or `contradictory`; Store facets report `absent`, `supported-current`, `supported-legacy`, `newer-unknown`, `corrupt`, `unknown`, or `indeterminate`.

The safety lattice is monotonic. A filesystem state of `unknown`, `mixed`, or `managed-modified`; manifest provenance that is `incomplete`, `ambiguous`, `contradictory`, or malformed; a Store state of `newer-unknown`, `corrupt`, `unknown`, or `indeterminate`; or contradictory ownership prevents an unattended migration for that facet. A lower-confidence facet cannot be overridden by a higher-confidence unrelated facet.

Migration order is:

Before Stage 1, the migration acquires the exclusive project migration lock and activates a durable quiescence barrier at every public Playbook and Protocol write and discovery boundary. The barrier must be verified under the lock before snapshot classification begins, must remain active through transformation and validation, and must fail closed if any writer or discovery path can bypass it. Quiescence neither deletes code nor changes legacy Store data; traced implementation retirement remains Stage 11.

1. Classify once and freeze the reviewed evidence snapshot.
2. Back up every path that may be transformed or removed and record preserved or exported user content.
3. Mint or upgrade manifest identity and provenance without claiming ambiguous ownership.
4. Install the manifest, the unconditional configured-router foundation, and only the capability-local documentation routers selected by the resolved effective profile and its dependencies.
5. Establish top-level prompt identity and the machine resource list/read operations before changing router fallbacks.
6. Install the always-local router skeleton under `.make-docs/system/`, then move or install only selected clean resource bodies under the typed directories.
7. Establish on-demand archive and artifact routers plus Persona-testing routing from the `docs/assets/` root, then transform only clean managed legacy paths.
8. Install TypeScript path-hygiene operations, update references, and remove only a hash-proven managed Python helper.
9. Add general Store run tables while leaving `playbook_runs` opaque and untouched.
10. Rehome naive-UAT system resources, add the thin first-party Skill adapter, reconcile `user` and `maintainer` persona execution with the `user` default, and establish `docs/assets/<persona-slug>/testing/` evidence routing.
11. Retire traced Playbook and Protocol runtime, packaging, tests, conformance, and support surfaces while preserving the quiescence barrier through validation.
12. Install only explicitly selected, evidence-backed optional agentics.
13. Validate fresh install, representative legacy migrations, package projection, and dogfood parity before any release recommendation.

Rollback restores the pre-migration backup and manifest receipt. It does not downgrade or delete independently advanced Global Store data; Store migrations therefore require their own transactional recovery and compatibility checks.

Legacy `.make-docs/<plural-type>/system/` content is migration input only. It is not a second current resource tree. Migration may move or remove a legacy file only when the accepted snapshot proves Make Docs ownership and the current bytes match trusted managed evidence. Unknown, modified, mixed, or conflicting content is preserved for explicit review.

### 14. Proportional proof and finite stop conditions

Later recovery planning must assign a finite, risk-proportional evidence budget to every investigation and phase. Each phase budget states exact maximum counts for characterization passes, materially distinct correction attempts, and review cycles, with the counts justified by blast radius, reversibility, data-loss or security exposure, cross-platform variance, novelty, and the cost of a false result. There is no universal numeric ceiling: a low-risk documentation phase and an irreversible migration phase may receive different finite budgets, but neither may begin with an unspecified or unbounded budget. Exhausting a phase budget produces an evidence-backed escalation or blocked decision, not an indefinite loop.

Every check records the relevant authority, code, fixture, input, configuration, and environment fingerprint. If that fingerprint is unchanged from the preceding result, the check stops without rerunning and the prior result is reused or the unresolved condition is escalated; an unchanged rerun never consumes another attempt merely to seek a different outcome. After a material fingerprint change, only affected checks may rerun and only within the remaining phase budget.

Structural contracts use deterministic fixtures and schema assertions. Cross-platform behavior uses the smallest representative platform matrix justified by affected code. Performance characterization is nonblocking unless an accepted, calibrated product requirement defines a target and measurement method. No phase may invent latency, throughput, memory, bundle-size, capacity, or availability thresholds; build a benchmark platform; weaken correctness for a metric; or demand theoretical completeness.

### 15. Acceptance and readiness for planning

This design is ready for the Design Approval Gate when owner review confirms all of the following:

- The reduced product boundary removes both Playbooks and Protocols without implying standalone Playbooks interoperability.
- Historical plans, work, and evidence remain provenance, and the unexecuted W19 Protocol direction is clearly superseded rather than deleted.
- Machine, package, project-local, dogfood, and Global Store authorities are unambiguous.
- System-resource URI, resolution precedence, CLI list/read UX, native MCP parity boundary, prompt type, offline behavior, and local ownership rules are acceptable.
- Initialization, reconfiguration, manifest provenance, conflicts, backup, rollback, update, uninstall, and on-demand router behavior are sufficiently decided for change planning.
- The target archive, artifacts, and persona-assets information architecture is accepted.
- Playbook retirement preserves ambiguous and user-authored content and retains legacy `playbook_runs` opaquely.
- Naive-UAT remains a capability with CLI/MCP-served system workflow resources, optional local system-resource projection, a thin first-party Skill adapter, `user` or `maintainer` persona execution with a `user` default, and evidence under `docs/assets/<persona-slug>/testing/`.
- General run capture is lightweight and core CLI-based, while agentics remain optional.
- Compatibility facets, migration order, security, privacy, cross-platform behavior, and finite proof budgets are acceptable.
- Every open question below is either resolved by the owner or explicitly delegated to a named later authority without blocking safe planning.

Passing this readiness list is not implementation evidence and does not authorize planning. The Design Approval Gate in `## Intended Follow-On` accepts only this design as design authority. Entering the change-plan stage requires a separate, later Planning Authorization Gate; neither gate authorizes PRD reconciliation, backlog generation, implementation, migration, setup, dogfood regeneration, commit, integration, publication, or deployment.

## Alternatives Considered

### Rename Playbooks to Protocols

Rejected. The current subsystem is comprehensive, so a rename would preserve most of the product surface the owner removed and would create a misleading claim that a narrow procedural contract exists.

### Keep a minimal Protocol placeholder or deferred obligation

Rejected. A placeholder would retain active authority and implied commitment without a designed capability. Future reconsideration begins from a new design after v2.

### Require the standalone Playbooks product

Rejected. It would replace one in-product dependency with an external one and create an interoperability and support contract that Make Docs has not designed or validated.

### Keep full project-local system snapshots as the default

Rejected. Full snapshots increase drift and conflict surface. Machine-served resources plus small routers are the default; explicit local selection provides portability and customization.

### Use MCP tools only for resource retrieval

Rejected. The CLI is the canonical machine interface and must work without MCP. Native MCP resources are parity surfaces where supported, not the sole retrieval mechanism.

### Treat modified managed files as automatic project overrides

Rejected. Silent ownership transfer would erase provenance and make later update or removal unsafe. Adoption must be explicit.

### Delete all Playbook paths and Store data during upgrade

Rejected. Paths are not proof of ownership, user-authored content must survive, historical evidence is valuable, and legacy `playbook_runs` deletion is separately gated.

### Make optional agentics responsible for correctness and run capture

Rejected. Harness capabilities vary and integrations can be absent or stale. The deterministic CLI and routers remain the correctness path.

### Preserve Python helpers for portability

Rejected. First-party deterministic logic belongs in the TypeScript CLI and operation registry. Installing multiple runtimes in projects expands support and migration burden.

### Build a general event-sourcing or telemetry platform

Rejected. General run capture needs current lifecycle state and evidence references, not an unbounded event log, analytics platform, or cloud service.

## Consequences

The v2 product becomes smaller and more coherent, but the recovery is a removal and migration program rather than a narrow refactor. PRD authority, operation registry entries, Store APIs, package contents, routers, templates, tests, and support claims must change together.

Projects become lighter by default because system resources are machine-served and documentation subtrees are created on demand. Portable projects must explicitly select the resource snapshots they need, and routers must tell the truth when the installed CLI is unavailable.

Manifest provenance becomes more important. Safe automation improves for clean managed files, while ambiguous and modified content deliberately requires more review. Backups and preserved-export reports add implementation work but are necessary to avoid destroying user assets.

The Global Store gains a general-purpose run seam while carrying legacy Playbook rows indefinitely unless separately authorized. This retains data safely but leaves some schema debt visible.

Naive-UAT retains its product value while losing specialized Playbook wrappers. Its guidance becomes discoverable through system resources and a thin Skill adapter, and its evidence becomes visibly associated with the persona whose workflow was tested. Later PRD reconciliation must preserve tester qualification and evidence rigor while replacing the current non-persona rule.

Optional agentics can be simpler because they call stable CLI operations. Conversely, any agentic integration without a non-Playbook consumer or real harness evidence must be removed or withheld.

The current manifest mismatches, old information architecture, and unexecuted W19 plan remain unchanged by this design. They become planned migration inputs only after design acceptance and separate planning authorization.

## Risks

- Broad Playbook dependencies may hide non-obvious consumers or change during classification. Mitigation: quiesce and lock public Playbook and Protocol writes and discovery before the Stage 1 snapshot, require a traced authority-to-runtime inventory, and retire implementations only later.
- A stale manifest may misclassify user content. Mitigation: represent incomplete, ambiguous, and contradictory provenance explicitly; fail closed; use conservative facets, hash and provenance proof, explicit adoption, single-snapshot review, and backup-first mutation.
- Local-first resolution may mask installed updates. Mitigation: report effective origin and version on every list/read result and surface stale managed snapshots without overwriting them.
- Router proliferation may duplicate contracts. Mitigation: keep routers small, generate only configured harness variants, and point to stable resource URIs.
- On-demand directories may be undiscoverable. Mitigation: always-present `docs/` routers list potential routes and the deterministic ensure operation.
- Native MCP behavior may drift from CLI behavior. Mitigation: derive both from the same operation and resource resolver and validate byte-for-byte parity.
- Legacy Store rows may be mistaken for supported runs. Mitigation: remove Playbook APIs, mark the table legacy in schema metadata, and exclude it from general run listings.
- Run capture may grow into a platform. Mitigation: limit schema to current state, checkpoints, and evidence references; require new design authority for analytics, orchestration, or telemetry.
- Removing Playbook-shaped UAT assets may weaken UAT or duplicate its authority between system resources and the Skill. Mitigation: reconcile every durable invariant into one system-workflow contract, keep Skill scripts as CLI-only shims, require identical CLI/MCP results, and preserve contracts, prompts, templates, lifecycle, and phase-gate routing before retiring old surfaces.
- Persona-scoped evidence may be written under the wrong audience or expose sensitive observations. Mitigation: resolve and record the persona slug before execution, allow only `user` or `maintainer` primitives, default explicitly to `user`, use consent-aware redaction, and make ambiguous migration evidence fail closed rather than placing it in archive.
- Cross-platform migration may overreach. Mitigation: use bounded representative fixtures and typed recovery, not invented benchmark or theoretical completeness gates.

## Open Questions

The following choice is not settled by the approved defaults and must remain visible:

1. What exact next W/R coordinate owns the change plan? Current repository authority establishes W19 R0 only for the superseded Protocol plan and does not establish a replacement coordinate.

The resource URI, CLI command shape, resolution precedence, target information architecture, manifest ownership and provenance states, migration safety rules, general run type, Store-receipt semantics, Naive-UAT system-workflow and Skill forms, persona rules, and `docs/assets/<persona-slug>/testing/` evidence boundary are decisions in this draft, not open questions. Non-Playbook consumer tracing and supported router inventory are evidence-gathering obligations for the authorized change-plan preflight, not owner questions.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md), [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md), [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md), [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md), [Shared Agentics Native Harness Exposure Correction](2026-06-27-shared-agentics-native-harness-exposure-correction.md), [Playbook Packaging and Harness Adapter Registry](2026-06-29-playbook-packaging-and-harness-adapter-registry.md), and [Global Store and Project State](2026-07-01-global-store-and-project-state.md)
- Historical Plan and Work Provenance: [W19 R0 Playbooks to Protocol Narrow Guardrail Refactor](../plans/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/00-overview.md) and its linked W18 designs, plans, work, and history remain evidence of prior intent and implementation, not current authority for the v2 target.
- Reason: The approved direction materially reverses prior Playbook and Protocol decisions and revises earlier system-resource layout, full-snapshot defaults, prompt placement, documentation asset paths, Store run-state assumptions, and agentics scope. A new related design preserves that lineage without rewriting historical artifacts.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: The accepted design will require coordinated removal and revision across active PRDs, existing implementation, migrations, system resources, package and dogfood projections, tests, and preserved historical authority rather than a fresh baseline plan.
- Coordinate Handoff: unresolved; planner must resolve before writing.
- Design Approval Gate: The owner accepts this design as design authority only by using the statement below. Review comments, acceptance of the draft file, subagent task completion, approval of individual decisions, or design acceptance itself do not authorize planning.
- Exact Owner Design-Acceptance Statement: `I approve the Make Docs v2 Product Boundary and Missing Migration Recovery design as accepted design authority. This approval authorizes design acceptance only; it does not authorize change-plan creation or any later lifecycle stage.`
- Planning Authorization Gate: After design acceptance, the owner must separately authorize the change-plan stage. That later authorization cannot be bundled into or inferred from the design-acceptance statement and authorizes plan creation only, not PRD reconciliation, backlog generation, implementation, manifest migration, setup or reconfiguration, dogfood regeneration, commit, integration, push, publication, deployment, or support-claim promotion.
- Exact Owner Planning-Authorization Statement: `I authorize creation of the Make Docs v2 Product Boundary and Missing Migration Recovery change plan from the accepted design. This authorization covers change-plan creation only and authorizes no later lifecycle stage.`
- Planning Preflight: Before drafting the authorized change plan, inventory all current non-Playbook consumers of plugin, hook, skill, extension, registry, and harness-adapter primitives; inventory evidence-backed harness router filenames and fallback behavior; trace the Naive-UAT system workflow, persona resolution, testing-evidence surface, Skill packaging, and every shim-to-CLI call; record other untraced primitives as removal candidates and unsupported router shapes as absent rather than inventing either contract.
