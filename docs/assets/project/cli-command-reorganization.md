---
title: "CLI Command Reorganization"
date: "2026-06-30"
kind: "artifact"
status: "draft"
---

# CLI Command Reorganization

This artifact captures the in-progress reorganization of the Make Docs CLI command surface. It exists to preserve decisions and findings while the larger reorganization is thought through. It is a working document, not a design, PRD, plan, or implementation authority, and it will be converted into a dedicated design document when it is ready. It is a sibling to [playbook-architecture.md](playbook-architecture.md); the two intersect at the operation registry described there in Section 0.6.

## Motivation

The Make Docs CLI began as an installer and maintainer: it installed Make Docs into a project and managed that installation. Make Docs v2 added substantial new capability to the CLI, but the command tree was not reorganized to match. Today the install and installation-management commands sit at the top level alongside two large new top-level commands, `operations` and `mcp`, that each expose their own subcommands. The result is a flat top level that mixes three unrelated concerns: managing a project's installation, running operations, and exposing the tool over MCP. Separately, the CLI has evolved into an artifact that is itself installed, which means it now needs commands to update and remove the tool itself, which do not exist.

## Locked Decisions

| Topic | Decision |
| --- | --- |
| Project-install namespace | `setup`: `setup`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove` |
| Tool self-management | top-level `update` and `uninstall` act on the CLI itself; hard cutover on `uninstall`, so project removal is only `setup remove`; both are detect-and-delegate wrappers |
| Operations namespace | `run`, including the stateful `run playbook` subtree and `run package` as a peer object |
| MCP | top-level `mcp` (server and transport, not an operation) |
| Command style | subtree under a domain object for multi-operation families (`run closeout probe`); flat for standalone utilities (`run checkpoint`) |
| Bare command | context-aware: guided `setup` if no install is present; status and help if installed; never auto-sync |
| Migration and upgrade safety | no back-compatibility aliases; `update`, `setup`, and `setup reconfigure` detect pre-v2 configuration fingerprints and present a warning plus a backup-and-install or cancel choice |
| Organizing principle | self / project / run / serve separation |
| Operation reference field | Playbook steps reference operations via `operation:` (see playbook-architecture Section 0.6) |
| Logic ownership | deterministic logic belongs in a shared core operations library, surfaced by both CLI and MCP, not authored twice |

The decision to rename the existing project-level `uninstall` to `setup remove` is deliberate: it frees the top-level `uninstall` name to mean removal of the CLI tool itself.

## Current-State Inventory

The current surface, as built, is the following. This is the factual baseline the reorganization maps from. Exact counts are approximate pending a precise recount; the families are accurate.

Top-level commands (7): default install, `reconfigure`, `skills`, `backup`, `uninstall`, `operations`, `mcp`.

The `operations` command exposes roughly nineteen subcommands in four families:

- Work and lifecycle (5): `wave-resolve`, `wave-status`, `work-phase-state`, `phase-plan`, `phase-gate`.
- Closeout (3): `closeout-probe`, `closeout-validate`, `closeout-history`.
- Checkpoint and scope (2): `checkpoint`, `scope-guard`.
- Playbook (9): `playbook-catalog`, `playbook-resolve`, `playbook-capabilities`, `playbook-run-start`, `playbook-run-invoke`, `playbook-run-read`, `playbook-package-plan`, `playbook-package-surface-resolve`, `playbook-package-write`.

The `mcp` command launches a TypeScript MCP server over stdio. It exposes roughly twenty-two tools that mirror the CLI operations one to one, read-first and plan-first, with write operations gated behind an explicit allow-write flag.

Two findings shape the reorganization. First, the CLI operations and the MCP tools are already a one-to-one mirror, which means a formal operation registry mostly recognizes an existing pattern rather than introducing a new abstraction. Second, the closeout and checkpoint operations show markers of having been ported from former Python scripts, while the playbook operations are fresh TypeScript; the question of whether deterministic logic belongs in the CLI applies most directly to that migrated cluster.

## Proposed Command Tree

The proposed top level is: `setup`, `run`, `mcp`, `update`, `uninstall`.

### Tool Self-Management

- `make-docs update`: self-update the installed CLI. New; does not exist today.
- `make-docs uninstall`: remove the installed CLI itself. New meaning; the former project-level `uninstall` moves to `setup remove`.

### Project Installation Management

- `make-docs setup`: install or sync Make Docs into a project. Maps from the current default install.
- `make-docs setup reconfigure`: maps from `reconfigure`.
- `make-docs setup skills`: maps from `skills`.
- `make-docs setup backup`: maps from `backup`.
- `make-docs setup remove`: maps from the current project-level `uninstall`.

### Operations

The current `operations` subcommands map into `run` with object subtrees for stateful or multi-verb families.

| Current | Proposed |
| --- | --- |
| `operations wave-resolve` | `run wave resolve` |
| `operations wave-status` | `run wave status` |
| `operations work-phase-state` | `run work phase-state` |
| `operations phase-plan` | `run phase plan` |
| `operations phase-gate` | `run phase gate` |
| `operations closeout-probe` | `run closeout probe` |
| `operations closeout-validate` | `run closeout validate` |
| `operations closeout-history` | `run closeout history` |
| `operations checkpoint` | `run checkpoint` |
| `operations scope-guard` | `run scope-guard` |
| `operations playbook-catalog` | `run playbook catalog` |
| `operations playbook-resolve` | `run playbook resolve` |
| `operations playbook-capabilities` | `run playbook capabilities` |
| `operations playbook-run-start` | `run playbook start` |
| `operations playbook-run-invoke` | `run playbook invoke` |
| `operations playbook-run-read` | `run playbook status` |
| `operations playbook-package-plan` | `run package plan` |
| `operations playbook-package-surface-resolve` | `run package surface-resolve` |
| `operations playbook-package-write` | `run package write` |

The `run playbook` subtree must reserve homes for the run-progression verbs that do not yet exist and are required by the playbook architecture run-state machine: `run playbook next`, `run playbook advance`, `run playbook gate`, `run playbook resume`, and `run playbook close`.

### Serve

- `make-docs mcp`: unchanged in intent. Kept as a top-level command because exposing the tool over MCP is a transport and server concern, not an operation.

## Logic Ownership and the Operation Core

The deterministic logic for every operation lives in a shared operation core that the CLI, the MCP server, and the Playbook runner all depend on. The following are the locked properties of that core.

- Modular code, not a monolith. The operation registry may be a single declarative index that maps operation identifiers to handlers and metadata. The operation logic itself must not be. Each operation's implementation lives in its own module, grouped by domain, following normal good practice for compartmentalized, modular, compact code. A single shared library does not mean a single shared file, and the design must state this in imperative terms so it is not implemented as a god-file.
- Uniform operation contract. Every operation is defined by a stable identifier, a typed input, a typed output, a mutation classification, and a handler that takes the input and an execution context. Surfaces adapt argv, MCP tool arguments, or Playbook step inputs into that input and adapt the output back. Surfaces contain no operation logic.
- Structured results, no presentation in handlers. Handlers return structured data and perform side effects only through the injected context. Presentation belongs to the surface: the CLI renders, the MCP server returns JSON, and the Playbook runner records the result as run evidence. One handler serves all three, and operations are unit-testable without a CLI.
- Uniform safety gating. Each operation declares whether it mutates. The execution context enforces dry-run, write-permission, and approval uniformly across every surface, replacing per-surface write gating such as the current MCP allow-write flag.
- One-way dependencies. Surfaces depend on the core. The core never depends on a surface, and no surface depends on another surface; the MCP server must not import CLI handlers, and the reverse must not happen either. Whether the core is a separate package or an internal module is a design-doc detail, but the dependency direction is fixed.
- Stable, append-only identifiers. Operation identifiers follow a `domain.verb` or `domain.object.verb` convention, lowercase, dot-separated, with hyphenated multiword segments. Identifiers are stable and append-only. While the reference surface is small, a rename may be applied directly; once Playbooks, MCP tools, and scripts reference them widely, a rename ships an alias rather than breaking those references.
- Surfaces derived from the registry. The registry is the single source of truth for which operations exist. The CLI command tree and the MCP tool list are generated from, or at minimum conformance-checked against, the registry, so the two surfaces cannot silently drift out of parity as they do today.

## Resolved Decisions

The following were resolved in review and are no longer open:

- Command style: subtree under a domain object for multi-operation families, such as `run closeout probe` and `run wave status`, and flat for standalone utilities, such as `run checkpoint` and `run scope-guard`. Subtrees map one-to-one to operation identifiers.
- Packaging placement: `run package <verb>`, a peer to `run playbook`. A distributable most often forms organically from a top-level Playbook that chains child Playbooks, but packaging can also bundle unrelated Playbooks, so packaging is its own object rather than nested under a single Playbook.
- Run-state read naming: `run playbook status <run-id>`.
- Bare invocation: context-aware. With no install in the working directory, bare `make-docs` starts a guided `setup` that asks before writing; with an install present, it shows status and help and does not auto-sync.
- Migration and upgrade safety: no back-compatibility aliases, because the current install base is small enough that aliases would add complexity without benefit. Instead, `update`, `setup`, and `setup reconfigure` detect pre-v2 configuration fingerprints and, when found, present a warning that itemizes changes that could break on upgrade, followed by a choice between backing up and installing the latest version, which is recommended, and cancelling.
- Tool self-management: top-level `update` and `uninstall` act on the CLI itself as detect-and-delegate wrappers over the install manager, printing the exact command when detection is ambiguous. `uninstall` is a hard cutover to tool removal; project removal is only `setup remove`, and `uninstall` confirms before removing.
- Refactor scope and sequencing: establish the operation core, the registry, and the reorganized command tree first, and move all existing operation logic behind the registry in the same wave to avoid a half-migrated state. The internal modularization of the messiest migrated logic, the ported closeout and checkpoint operations, may be a tracked follow-up.

Deferred to implementation planning: the exact pre-v2 fingerprint set and warning copy, the self-management install-manager detection matrix, and the internal module layout of the operation core.

## Relationship to the Operation Registry

The reorganization and the operation registry are mutually reinforcing. The registry makes the command tree safe to reorganize, because operation identifiers are stable even as command spellings change, and Playbook steps and MCP tools reference identifiers rather than command strings. The reorganization, in turn, is the moment to formalize the registry, because the CLI and MCP surfaces already mirror each other and would otherwise continue to drift as two hand-maintained lists. The playbook architecture artifact depends on the registry existing and being stable; it does not depend on the specific command tree proposed here.
