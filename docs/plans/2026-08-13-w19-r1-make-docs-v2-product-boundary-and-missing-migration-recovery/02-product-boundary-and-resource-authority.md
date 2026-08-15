---
title: "W19 R1 Phase 2: Product Boundary And Resource Authority"
kind: "plan"
status: "draft"
coordinate: "W19 R1 P2"
source:
  type: "design"
  path: "docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md"
---

# Phase 2: Product Boundary And Resource Authority

## Purpose

Make the future PRD reconciliation decision-complete for the reduced product boundary, first-class system resources, provider resolution, CLI/MCP availability, optional local projection, routers, and upstream/package/dogfood authority.

## Product Boundary Outcome

Current PRD authority must state:

- Make Docs owns neither Playbooks nor Protocols as product capabilities.
- Historical Playbook plans, work, evidence, and legacy Store rows remain provenance; they are not active product authority.
- Make Docs retains deterministic resource, lifecycle, evidence, UAT, Persona, Skill-distribution, operation-registry, and project-state capabilities where separately owned.
- No standalone Playbooks interoperability, dependency, wrapper, shim, or support promise is implied.
- Plugin, hook, extension, harness-adapter, and packaging-conformance surfaces survive only when a traced non-Playbook purpose and existing authority justify them.

## System-Resource Contract

Contracts, prompts, references, and templates are peer system-resource types:

| Type | Canonical role | Optional project projection |
| --- | --- | --- |
| `contracts` | Normative reusable behavior and validation contracts | `.make-docs/system/contracts/` |
| `prompts` | First-class reusable workflow and agent instructions | `.make-docs/system/prompts/` |
| `references` | Explanatory system guidance and workflow references | `.make-docs/system/references/` |
| `templates` | Reusable authored output shapes | `.make-docs/system/templates/` |

All use `make-docs://system/<type>/<path>` identity. Prompts are not hidden inside references, Skills, CLI code, or harness packages.

## Resource Resolution And Provenance

PRD authority must distinguish:

1. project-local managed or project-owned projection when present;
2. the installed machine/provider resource source;
3. the immutable package/template source that produced the provider content; and
4. typed absence, conflict, or provenance failure.

Local-first means a valid project-local override wins and its untrusted provenance is visible. It does not mean an ambiguous file is claimed as managed. Hash identity proves bytes, not trust. Resource content is returned as data and is never evaluated, followed, or executed by `resource read`.

Each resolved item reports enough identity to distinguish type, logical path, provider, immutable reference or package version, local path when applicable, ownership class, and content digest where available.

## CLI And MCP Surface

The operation registry owns typed resource operations. The later PRD authority must require at least:

- list resources by type and optional prefix;
- read one resource by stable URI or type/path identity;
- ensure an explicitly selected resource into optional local projection;
- report source, ownership, and resolution;
- return typed not-found, conflict, invalid-path, and provider-unavailable outcomes.

CLI and MCP are projections of the same operations:

- installed CLI is the default resource list/read provider;
- native MCP resources expose the same system-resource identities and content where supported;
- MCP tools may provide typed ensure or lifecycle mutations, but native MCP resource reads must not be replaced by prompt text copied into tool descriptions;
- optional local projection is not required for CLI/MCP availability; and
- offline behavior is explicit and bounded by installed immutable content rather than hidden network fetches.

## Setup, Reconfiguration, And Router Authority

Setup and reconfiguration select:

- desired resource projection policy;
- installed routers;
- optional Skills/agentics;
- ownership and conflict disposition; and
- provider/package identity.

The focused implementation trace currently proves only:

- `AGENTS.md -> codex`
- `CLAUDE.md -> claude-code`

PRDs must not claim additional router filenames or harness support without later evidence. Routers use resource identity and CLI/MCP availability; a missing local projection triggers an explicit ensure/list/read route or typed failure, never a hidden fallback mutation.

## Upstream And Projection Authority

Reusable Make Docs system resources are authored upstream in `packages/docs/template/`. Later implementation follows:

1. author contracts, prompts, references, and templates upstream;
2. validate their logical asset identity and links;
3. project the package build input;
4. validate packaged CLI/provider behavior;
5. dogfood into this repository’s installed `.make-docs/` and `docs/` surfaces;
6. validate a representative installed project.

`packages/cli/` has no hand-maintained template. Root dogfood is never the upstream source.

## Exact PRD Maintenance

| PRD | Owning sections | Required current-authority change |
| --- | --- | --- |
| 01 | Purpose, Scope, Capabilities, Non-Goals | State reduced product boundary and retained resource/UAT capabilities. |
| 02 | Runtime zones, component map, data flow, integrations | Define template, provider, operation registry, CLI/MCP, project projection, Store, and dogfood boundaries. |
| 04 | Relevant glossary terms | Define resource types, URI, provider, projection, ownership, Playbook/Protocol non-capability. |
| 06 | Selected/generated assets and template authority | Add prompts as peers; define upstream and projection invariants. |
| 07 | Public command model; Lifecycle commands | Add resource list/read/ensure and explicit setup/reconfigure behavior. |
| 09 | Dogfood inventory and maintainer operations | Make root dogfood downstream of packaged upstream authority. |
| 10 | Packaging validation and release reference | Require package/provider parity and block release on mismatched resources. |
| 16 | Repository validation and test organization | Assign focused resource, package, and dogfood checks to the correct layers. |
| 17 | Scope; Requirements; Contracts and Data | Own resource materialization, bootstrap, identity, provenance, projection, and local-first resolution. |
| 21 | Scope; Requirements; Contracts and Data | Own `.make-docs/system` tiers and optional project projection. |
| 23 | Metadata and lifecycle handoff sections | Remove Playbook/Protocol kinds and add only accepted resource metadata. |
| 24 | Configuration/convention overlay | Define resource/router/selection keys and precedence without creating hidden product behavior. |
| 25 | TypeScript Runtime Ownership; Required MCP Surface; Current MCP Surface; No-Scripts Migration Dependency; Operation-First Migration Sequence; Managed Removal and MCP Safety | Own typed resource operations, native MCP parity, provider behavior, and safe replacement ordering. |
| 39 | R-REG/R-CORE/R-SURF; R-SEQ; R-SCOPE/R-KEEP | Admit resource operations and remove Playbook/Protocol registry surface. |
| 34-36 | Exact sections named in the overview | State no Playbook/Protocol authoring, run-state, packaging, or harness-adapter capability. |

## Requirement-History Needs

- PRDs 34-36 record the previous Playbook authority and unexecuted Protocol proposal only after their current no-capability boundary is correct.
- PRDs 17/21/25/39 record the transition from incomplete resource handling to peer resource types, stable URI, provider resolution, and CLI/MCP parity.
- PRDs 06/09/10/16 record any material prior ordering that permitted dogfood or package copies to appear authoritative.

## Later Build Handoff

After reconciled PRDs are accepted and a backlog is separately authorized, the product/resource implementation stream should be shaped as:

1. upstream resource schema and logical identity;
2. TypeScript resolver/provider and operation-registry contracts;
3. CLI list/read/ensure projection;
4. native MCP resource parity and typed mutation tools where applicable;
5. manifest selections and evidence-backed routers;
6. optional local projection;
7. package projection, root dogfood, and installed-project validation.

This is dependency sequencing, not a work-backlog checklist.

## Dependencies And Merge Order

- PRDs 17 and 21 settle resource identity and projection before PRDs 07, 25, and 39 finalize public surfaces.
- PRDs 06 and 17 settle upstream authority before PRDs 09, 10, and 16 finalize package/dogfood validation.
- PRDs 34-36 settle the removed product boundary before operation and conformance inventories are assembled.
- Phase 3 supplies provenance and migration safety; Phase 4 supplies the Naive-UAT workflow content that consumes system resources.

## Evidence Budget

- One later targeted resource/operation inventory refresh if the current revision differs materially.
- One PRD authoring pass, one materially distinct correction, one confirmation review.
- Deterministic schema and fixture evidence only at the PRD gate; no full implementation suite.
- Reuse unchanged provider/router/package fingerprints.

## Acceptance Gate

This phase is ready for assembly when current PRD proposals:

- make prompts a peer resource type;
- preserve CLI/MCP availability without mandatory local projection;
- distinguish URI, provider, projection, provenance, ownership, and trust;
- name only evidence-backed routers;
- remove Playbook/Protocol authority without deleting provenance;
- preserve upstream-first package/dogfood ordering; and
- introduce no new PRD or unauthorized implementation.
