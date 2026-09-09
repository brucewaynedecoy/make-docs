---
title: "Project Assets and Persona Discovery"
kind: "plan"
status: "draft"
coordinate: "W19 R4"
source:
  type: "design"
  path: "docs/designs/2026-09-09-project-assets-and-persona-discovery.md"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "Make the existing product owners state the accepted asset, Persona, and migration contract before backlog generation."
  coordinate_handoff: "Carry W19 R4 into the delta backlog; W20 R0 and W21 R0 remain paused."
---

# Project Assets and Persona Discovery

## Purpose

Turn the [design](../../designs/2026-09-09-project-assets-and-persona-discovery.md) into surgical current PRD updates and one implementation phase. The owner approved package drafting. This plan and its downstream backlog remain for owner review; neither authorizes implementation.

## Objective

Make `docs/assets/project/` the shared non-authoritative material home and `docs/assets/<persona-slug>/` the audience asset home. Provide two discoverable defaults, `user` and `maintainer`, merged with local declarative config. Make assets creation on demand. Finish legacy moves through one permanent reviewed CLI/manual workflow with Store-owned intent and verified results.

## Coordinate Decision

- Coordinate: `W19 R4`.
- Classification: `revision`.
- Evidence: This corrects and finishes the W19 R1 asset/Persona recovery boundary. W19 R3 is closed at `dabd0b36`; its Store state contract is the prerequisite. R4 was unused when this package was opened.
- Pause: [W20 R0](../../work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md) and [W21 R0](../2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md) remain paused through the interrupt.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-assets-and-persona-cutover.md](01-assets-and-persona-cutover.md) | One implementation phase with ordered schema/discovery, migration, and verification stages. |

## Governing Invariant

Current PRDs state product requirements inline. This plan owns sequencing, candidate dispositions, and validation scope. The work backlog will cite the updated PRDs. History preserves prior outcomes. The final review scans all active PRDs for conflicting current paths, defaults, and ownership claims, including secondary owners outside the primary table. No new editorial PRD, full-set archive, runtime edit, template edit, or dogfood move is part of package drafting.

## Maintenance Inputs

| Input | Location | Use |
| --- | --- | --- |
| Approved direction | [Design](../../designs/2026-09-09-project-assets-and-persona-discovery.md) | Asset paths, audiences, one-phase scope, permanent migration, acceptance promises. |
| Closed prerequisite | [R3 backlog](../../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-index.md), commit `dabd0b36` | Store-before-mutation, checkout identity, pending operations, verified recovery. |
| Current owners | PRDs 22, 24, 47 and the owner table below | Existing authority to maintain. |
| Reviewed filesystem findings | Design Context | Empty old system/template directories versus real dogfood content. Refresh exact bytes before implementation. |
| Historical lineage | Design Lineage | Explain prior consolidation choices without reactivating them. |

## Candidate Decision Matrix

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Shared versus audience asset homes, on-demand asset root | `update-existing` | 22; 02, 05, 06, 15, 17, 21 | Existing asset and bootstrap authorities contain the old tree. |
| Two built-in audiences, fixed mappings, custom extension | `update-existing` | 47, 24 | Existing Persona/config owners define the schema and default resolution. |
| Discovery without CLI or Store | `update-existing` | 24, 25, 39; 15/17 for bootstrap text; 07 for command navigation | Add one effective resolver/query and a small always-local routing rule. |
| Reviewed layout preview, preparation, apply and manual verification | `update-existing` | 18, 22, 25, 39 | Extend existing migration and operation contracts; reuse the Store journal. |
| Store state and recovery | `link-only` where R3 is sufficient | 38 | R3 already owns installation/migration state. No second state engine. |
| Metadata, audience actor, human/tester separation | `update-existing` | 23, 46, 47, 49 | Remove the third primitive without weakening independent boundaries. |
| Package, directory and dogfood proof | `update-existing` | 06, 09, 10, 22 | File-only checks missed empty obsolete trees. |
| Navigation, glossary and known gaps | `update-existing` | 00, 03, 04 | Keep the current authority and accepted targets clear. |
| New product PRD or UAT scenario framework | `none` | Existing owners | No ownerless capability or new testing framework is required. |

## Existing PRDs To Update

| Existing owner | Owning sections | Current normative update |
| --- | --- | --- |
| [22 Asset Model](../../prd/22-project-documentation-asset-model.md) | Managed Project Asset Namespace; Canonical and Legacy Path Rules; new Shared Project Inputs and Persona Assets; Reviewed Layout Migration; Acceptance Criteria | Shared and audience paths, on-demand root, exact disposition rules, no unexplained leftovers. |
| [24 Configuration](../../prd/24-project-configuration-and-convention-overlay.md) | Persona Configuration; new Effective Persona Discovery; Canonical Structure; Validation | Merge by slug, retain defaults for empty/absent config, fixed mappings, safe custom extension, no Store for read-only resolution. |
| [47 Persona](../../prd/47-persona-model.md) | Persona Schema; Frontmatter Authority; Testing and UAT Boundary; Affected-Human boundary | Only user/maintainer primitives, four fields, human or agent actors, explicit migration of old aliases. |
| [18 Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md) | Requirements; Ordered Migration; Existing-Project Adoption Boundaries | Reviewed source/map digest; explicit preparation; journaled CLI apply or manual read-back; source/target/link verification and recovery. |
| [39 Command Registry](../../prd/39-cli-command-model-and-operation-registry.md) | Persona and Layout Commands | Exact five-command contract below, common JSON/target-root conventions and shared registry. |
| [25 Runtime Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Asset and Config Boundaries; required/current MCP surface | One shared resolver and migration implementation; explicit read/write permission classes. |
| [23 Metadata](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md) | Conditional Fields; Configuration Boundary | Keep Persona metadata where owned; record reviewed alias and link repairs without inventing provenance. |
| [46 Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md), [49 Human Experience](../../prd/49-human-experience-standard-and-intent.md) | Audience/executor and Persona boundary sections | Remove obsolete primitive language; keep qualification and human-effect review independent. |
| [02 Architecture](../../prd/02-architecture-overview.md), [05 Installation](../../prd/05-installation-profile-and-manifest-lifecycle.md), [06 Template Assets](../../prd/06-template-contracts-and-generated-assets.md), [15 Routers](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), [17 Materialization](../../prd/17-system-asset-materialization-and-local-bootstrap.md), [21 Tool Directory](../../prd/21-project-tool-directory-and-resource-tiers.md) | Current topology, bootstrap, routing and asset boundaries | Remove unconditional assets-root creation; root routers follow configured harnesses when ensured; no empty children or old system aliases. |
| [09 Dogfood](../../prd/09-dogfood-and-maintainer-operations.md), [10 Packaging](../../prd/10-packaging-validation-and-release-reference.md) | Delivery and validation sections | Build copier, tar entries and full filesystem checks; refresh installed CLI before normal dogfood CLI recipe. |
| [01 Product Overview](../../prd/01-product-overview.md), [07 CLI Surface](../../prd/07-cli-command-surface-and-lifecycle.md), [14 Lifecycle](../../prd/14-lifecycle-workflow-and-coverage-passes.md), [16 Package Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md), [45 Obligation Governance](../../prd/45-deferred-obligation-governance.md) | Audited current summaries, command/discovery, asset/evidence paths and package boundaries | Repair current contradictions without changing these owners' unrelated behavior or creating new testing obligations. |

Preserve unrelated text, document identities, anchors, and numbering. Retain substantive historical records. Mechanical links may be repaired only with a recorded before/after map and target checks.

## Genuinely New Product PRDs

None. Every requirement has an existing owner.

## Shared Command and Result Contract

All five commands accept `--target-root <path>` and `--json` using current CLI conventions. Their registry identifiers are identical to their dotted command paths.

| Command | Effect and required result |
| --- | --- |
| `project persona list` | Read effective entries and default/config display provenance without the Store. |
| `project layout preview [--map <source>=<destination>]` | Read complete source inventory, exact proposed destinations/link repairs, blockers, and a review digest. No writes. |
| `project layout prepare --review <digest> --mode cli\|manual [--map <source>=<destination>]` | Recompute and compare the reviewed facts, then persist full operation intent and byte identities in the Store. Release the live process lock before exit. Return operation ID and exact next command. |
| `project layout apply <operation-id>` | Apply only a prepared CLI-mode operation. Verify source/target/link expectations before Store completion. |
| `project layout verify <operation-id>` | Verify a prepared manual-mode operation after human/agent moves. Record completion only from the saved expectations and actual bytes/links. |

The retained `project surface ensure artifacts` compatibility selector ensures only the assets root/configured routers and reports `docs/assets/project/` as a not-yet-created destination. It creates no empty project child or old artifacts path. Help and result fields state these facts separately.

Pending operations block conflicting managed writes. Reuse `project state status` and `project state recover` for pending work and safe resume/rollback. Preparation is distinct from read-only preview. A required unavailable Store blocks preparation/application/completion recording. No local machine plan, receipt, or fallback state is written. Ordinary project asset work without the CLI stays available and cannot claim managed installation ownership.

The always-present documentation router explicitly projects the selected asset-router filenames from reviewed harness choices. The no-CLI author uses that declaration, never actor identity or raw Store state. Missing/invalid declarations need an explicit project choice before router creation. Partial built-in display overrides inherit defaults; custom Persona entries require all four fields.

The design's finite disposition table is the default map. Preparation rejects changed inputs, unsupported mappings, escaping paths, unresolved collisions, and unproved audience aliases. Retired Playbooks go to the managed archive as retained history. Non-active archive/backup copies may be explicit exclusions; they cannot excuse active legacy directories.

## Requirement History Entries

Add one coherent `2026-09-09 — W19 R4` entry to each owner whose current contract materially changes. Each entry names the affected section, previous contract, replacement contract, rationale, and links to this design/plan. Preserve R3's completed Store ownership as a prerequisite, not a new revision of that implementation. Index and risk changes use their own navigation/item contracts.

## Affected Links, Risks, Plans, And Work

- Update the PRD index and glossary for the new effective defaults, on-demand assets, and shared project home.
- Maintain Q-009/Q-019, R-011/R-013, and D-030 where their existing subject owns the change; record any distinct confirmed gap in the same risk register without renumbering.
- Keep archived decisions non-normative. Fix active instructions which still name `docs/assets/archive/`, `docs/assets/artifacts/`, `docs/artifacts/`, or old system-tier aliases as new-write targets.
- Keep R3 closed and W20/W21 paused. Do not mark R4 implemented when only its package is drafted.
- Derive the backlog only after current PRD updates are complete and validated. Record this package's drafting/review status in the normal history surface if the assembly scope needs it; no new state file is created.

## Output Contract

One design, this plan directory with exactly one phase file, surgical PRD maintenance, and `docs/work/2026-09-09-w19-r4-project-assets-and-persona-discovery/` with `00-index.md` and `01-assets-and-persona-cutover.md`. Use draft status. No runtime, template, installed router, package, or dogfood mutation is authorized by this package.

## Worker Ownership

| Workstream | Write scope | Dependency |
| --- | --- | --- |
| Design and sequencing | This design/plan and later backlog | R3 closeout and owner-approved direction. |
| Asset/Persona authority | PRDs 22–25, 39, 46, 47, 49 | Design and command contract. |
| Installation/routing authority | PRDs 01, 02, 05, 06, 07, 09, 10, 14, 15, 16, 17, 18, 21, 38, 45 as needed | Same design and command contract. |
| Assembly and review | PRD index/risk/glossary, source links, validation fixes | Disjoint owner updates complete. |

Backlog authoring waits for owner updates. During later implementation, source changes precede package projection, installed CLI refresh, then CLI-driven dogfood. No workstream may overwrite another's edits.

## MCP Strategy

Use jdocmunch for project authority and jcodemunch for implementation anchors. An initial jdocmunch refresh failed with an index JSON error; required current contracts were read directly after that failure. Later workers may use a successfully refreshed explicit existing index. Do not treat a stale index as absence proof.

## Dependencies

- R3 commit `dabd0b36` and its Store-before-mutation/recovery contract.
- Current PRD maintenance and authority validation before backlog derivation.
- Owner review and acceptance of the backlog before implementation.
- Existing Persona, router, resource, operation-registry and Store implementations; no new general-purpose engines.

## Validation

Use the finite matrix in [Phase 1](01-assets-and-persona-cutover.md#acceptance-matrix). Map EP1–EP5 to their owning requirements and observed results. Package review checks headings, frontmatter, links, one-phase shape, exact command consistency, and current PRD authority. Implementation later checks actual directory trees, byte/link preservation, Store journaling, and fresh-context discovery. Do not claim those future checks already passed.

The additional reserved Persona slugs `archive`, `artifacts`, `library`, and `playbooks` are a proposed implementation detail for owner review. `project` is already reserved by the approved direction. Existing conflicting custom audiences require an explicit retained-content rename map, not deletion.

## Intended Follow-On

- Route: `prd-generation`
- Next step: Finish current-owner PRD maintenance, then derive the one-phase work backlog.
- Why: The backlog must consume current product requirements rather than use a plan as substitute authority.
- Coordinate Handoff: Carry W19 R4 into its backlog and later P1 evidence. W20 R0 and W21 R0 remain paused. Stop after the draft package for owner review; implementation has not been authorized.
