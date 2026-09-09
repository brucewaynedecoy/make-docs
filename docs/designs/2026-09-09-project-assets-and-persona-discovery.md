---
title: "Project Assets and Persona Discovery"
kind: "design"
status: "accepted"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "Correct the existing asset, Persona, configuration, and migration authorities before implementation."
  coordinate_handoff: "Continue W19 recovery at W19 R4 after W19 R3 closes."
---

# Project Assets and Persona Discovery

## Purpose

Give people and agents one clear place for shared project material and one clear place for audience assets. Make the effective audiences easy to discover before an asset directory exists in an initialized or cloned Make Docs project. Finish the old directory transitions through a permanent CLI path with reviewed destinations and verified completion.

The owner accepted this package and authorized implementation after package commit `532b29cf`. W19 R4 implementation started on 2026-09-09. The owner accepted the corrected implementation later that day and requested closeout and commit. The work backlog and central evidence report record the completed phase and preserved review limits.

## Context

W19 R3 closed at commit `dabd0b36`. It moved installation and migration state into the global Make Docs Store. This revision builds on that boundary. [W20 R0](../work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md) and [W21 R0](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md) remain paused during this interrupt.

Current asset authority still makes `docs/assets/` an unconditional router root. Persona authority still defines three primitives and supplies `agent`, `developer`, and `user` defaults. Some installed instructions still name older archive and artifact paths. The result is a file tree and audience model that can send a new agent to the wrong place.

The reviewed inventory distinguishes empty remnants from real content. The old `.make-docs/contracts/system/` and `.make-docs/templates/system/` directories are empty. Upstream `docs/assets/archive/`, `library/`, and `playbooks/` directories are empty. The corresponding dogfood trees contain 540 archive files, 24 Library files, and three Playbooks. Those counts describe the review snapshot. Implementation must refresh the exact inventory before it proposes a move.

The current archive target is `.make-docs/archive/**`. Historical contracts which selected `docs/assets/archive/**` explain lineage. They do not create a second active target.

## Human Experience Intent

Impact: `direct`

Affected humans: Project users and maintainers who read assets, configure audiences, review file moves, or recover interrupted work.

Human goal or effect: Find the right material and move old material with confidence that every file has a known destination.

Experience promises:

- EP1: A new reader or agent in an initialized or cloned project can find the two default audiences and shared-material path from its bootstrap routers, without an assets directory or working CLI.
- EP2: A fresh project has no empty asset families or Persona child directories. CLI surface creation adds only the needed root and configured routers; ordinary asset authoring adds only its needed content path.
- EP3: A migration preview shows the exact source, destination, link changes, and blockers before any file moves.
- EP4: Completion means all reviewed destinations and links were checked. An interrupted or conflicting move has a clear next step and preserves user content.
- EP5: Local configuration stays readable project knowledge. Missing CLI or Store access does not prevent ordinary asset authoring.

Complexity kept out of the human path:

- Store tables, lock files, recovery payload references, and schema versions.
- Package source paths and development-only execution commands.
- Long testing procedures in the short assets router.

Evidence required:

- A fresh-context agent discovery check, with no task-history hints, both with and without the CLI.
- Full filesystem inventories for the source template, packed package, fresh install, upgrade, repeat, and dogfood. Inventories include empty directories and check both the build copier and packed tar entries.
- A reviewed migration map, before/after byte and link checks, and injected interruption/conflict cases.
- A per-promise review that states the observed result and reviewer limits.

## Decision

### 1. Asset and archive paths

- `docs/assets/project/**` holds shared, non-authoritative project material. `project` is a reserved path segment, not a Persona.
- `docs/assets/<persona-slug>/**` holds assets for a configured audience. Existing testing evidence remains under that audience's `testing/` subtree and retains its owning scenario and evidence contracts.
- `.make-docs/archive/**` holds adopted Make Docs historical and provenance records. Retired Playbooks are retained there as historical material and never become active workflows.
- `docs/artifacts/**` and `docs/assets/artifacts/**` become legacy inputs to `docs/assets/project/**`. No new Library, Playbook, Protocol, or artifact family is introduced.
- Asset placement does not turn project material into current PRD authority. Directory names alone do not prove ownership, Persona association, or historical provenance.

### 2. Two fixed built-in audiences

The only primitives and built-in slugs are `user` and `maintainer`. Either audience role can be filled by a human or an agent. Being an agent is an execution property, not a third audience primitive.

| Slug | Default label | Default description | Fixed primitive |
| --- | --- | --- | --- |
| `user` | User | People or agents that use the project. | `user` |
| `maintainer` | Maintainer | People or agents that build, operate, maintain, or extend the project. | `maintainer` |

Every entry retains `slug`, `label`, `description`, and `primitive`. Labels and descriptions can be changed. Built-in slugs and their primitive mappings cannot be removed or changed. Custom entries supply all four fields, extend the effective set, and must map to one of the two primitives. A built-in override may supply only its slug and changed display fields; omitted display fields inherit their defaults, and any supplied primitive must match its fixed mapping. Slugs must be unique, safe lowercase kebab-case; `project` is forbidden as a Persona slug. As a concrete proposed detail for package review, also reserve the retired structural names `archive`, `artifacts`, `library`, and `playbooks`. An existing configured entry with one of these slugs needs an explicit reviewed rename and retained-content mapping; it is never silently removed. This keeps audience discovery and legacy-directory checks consistent.

This change does not qualify an agent or maintainer as an independent human tester. Audience, execution actor, affected humans, and tester qualification remain separate concepts. Preserve the applicable Human Experience and Unassisted Goal Testing boundaries.

### 3. Configuration and discovery

`.make-docs/config.yaml` remains project-owned declarative configuration. Resolve shipped defaults first, then merge configured entries by slug. An absent, empty, or comment-only config, an absent `personas` field, or an empty `personas` list retains both defaults. Explicit YAML null, wrong-type config/personas values, and malformed YAML produce clear diagnostics; they are not treated as empty configuration. Custom entries extend the defaults. Invalid entries, duplicate slugs, reserved slugs, and attempted built-in primitive changes produce clear errors without rewriting the file.

The shared resolver exposes effective Persona entries and whether each entry uses shipped or configured display fields. `make-docs project persona list` reads this result without opening or requiring the Store. It does not create directories or write config.

Always-present documentation routing states the two defaults, the `docs/assets/project/` destination, and the config override location. This small rule remains usable when `docs/assets/` is absent and the CLI is unavailable. The documentation router also carries an explicit `Asset router files:` declaration listing only the filenames selected by the reviewed harness configuration, such as `AGENTS.md, CLAUDE.md`. Setup and reconfigure project this declaration from the chosen harnesses. It is routing guidance, not evidence of applied installation ownership. A no-CLI agent uses this declaration and the short shared asset rules to create exactly those root instruction files. It must not infer harnesses from its own actor identity or read raw Store records. An absent or invalid declaration requires an explicit project choice before router creation; ordinary content authoring can continue.

The assets root router stays short. It points to system resources for detailed testing and migration rules instead of copying those rules into the router.

This fallback applies to an initialized or cloned project with Make Docs bootstrap routers. It makes no discovery promise for a never-initialized project with no instructions.

Ordinary project-owned asset authoring remains possible without the CLI. Agents use the discoverable defaults and local config, and create the needed content path. They report unavailable optional state capture rather than writing a substitute plan, receipt, lock, or checkpoint in the project. This permission does not authorize blind cleanup of legacy trees or a claim that a manually created path has managed installation ownership. A later explicit `project surface ensure assets` can verify or adopt these manually created root routers under the normal Store-backed rules.

### 4. On-demand root and routers

Fresh setup does not create `docs/assets/` or its children. The existing `project.surface.ensure assets` operation creates or safely adopts the assets root and its configured-harness routers when needed. It creates no `project`, Persona, or `testing` child until actual content needs that child. Existing projects retain their real content and configured router behavior.

The retained `project surface ensure artifacts` selector is a compatibility alias. It ensures only the assets root and configured routers, and reports `docs/assets/project/` as the shared-content destination. It creates neither that empty child nor the old `docs/artifacts/` path. Its result and help distinguish the ensured root from the destination that does not yet exist.

Only the root has managed assets routers. Child directories do not receive managed routers. Setup, reconfigure, package copy, and repeat operations must not restore removed empty legacy families. Upstream source, generated package projection, and dogfood must agree on this directory contract, including directories that Git does not track.

### 5. One permanent layout migration path

Use shared TypeScript operations through the existing registry. Reuse the R3 Store journal, checkout binding, lock, and recovery contract. Do not add a separate migration engine or a project-local plan cache.

| Command | Contract |
| --- | --- |
| `make-docs project persona list [--target-root <path>] [--json]` | Read effective audiences; no Store dependency or writes. |
| `make-docs project layout preview [--map <source>=<destination>] [--target-root <path>] [--json]` | Read a complete source inventory and proposed destinations; return a content-bound review digest; no writes. |
| `make-docs project layout prepare --review <digest> --mode cli\|manual [--map <source>=<destination>] [--target-root <path>] [--json]` | Recompute the reviewed inventory/map, stop on drift, and save the exact operation intent and required recovery evidence in the Store. Return its operation ID. |
| `make-docs project layout apply <operation-id> [--target-root <path>] [--json]` | Apply a prepared CLI-mode operation through verified journaled changes and check the final bytes and links before completion. |
| `make-docs project layout verify <operation-id> [--target-root <path>] [--json]` | Check a prepared manual-mode operation's sources, destinations, and link repairs, then record completion in the Store only when all checks pass. |

The registry identifiers are `project.persona.list` and `project.layout.preview`, `.prepare`, `.apply`, and `.verify`. Preview and discovery are read-only. Preparation, application, and completion recording use the normal write permission boundary. The repeated `--map` option names explicit project-relative source-to-destination choices; it cannot escape the project or bypass the allowed destination and ownership rules. The review digest binds the source inventory, destinations, config-derived audience mapping, and planned link changes. No completion record is inferred from destination names.

Preparation is an explicit state-writing step, not a dry run. It saves the full reviewed plan and byte identities in the Store, releases its live process lock before exit, and leaves a pending operation that blocks conflicting managed writes. Required Store failure stops it before project mutation. Manual users receive the exact reviewed instructions only after preparation succeeds. They can move and repair files themselves or through an agent, then run verification. Missing or mismatched bytes, unresolved links, new source files, or unexpected leftovers keep the operation pending. Existing `project state status` and `project state recover` expose pending work and safe recovery; a complete saved plan is required for resume, and changed content blocks destructive replay.

### 6. Finite migration dispositions

Each inventory entry has an explicit action, source kind, source digest or verified empty-directory observation, ownership/provenance evidence, destination, and expected result. Preview includes preservation and conflict decisions as well as moves.

| Source cohort | Default reviewed destination or action |
| --- | --- |
| Empty `.make-docs/{contracts,prompts,references,templates,scripts}/system/` remnants and empty obsolete parents | Remove only the exact inventoried empty directories after rechecking them; never remove a nonempty parent. |
| Nonempty old system resource paths | Move only proven supported resources to `.make-docs/system/<type>/`; require explicit disposition for modified, mixed, unknown, or conflicting content. |
| Empty upstream `docs/assets/{archive,library,playbooks,artifacts}/` remnants | Remove from upstream/package directory construction; prove the actual packed and installed trees do not restore them. |
| `docs/artifacts/**` and `docs/assets/artifacts/**` | `docs/assets/project/**`, preserving relative content paths; collisions require explicit reviewed mappings. |
| Adopted `docs/assets/archive/**` and other proved legacy archive/history facets | `.make-docs/archive/**`, preserving archive structure and provenance. |
| `docs/assets/library/user/**` with verified audience | `docs/assets/user/**`, preserving the relative content path. |
| `docs/assets/library/developer/**` proved to use the former shipped default | `docs/assets/maintainer/**`, with explicit metadata and live-link repairs. A custom `developer` Persona does not meet this proof. |
| Other Library audiences or custom/default conflicts | Explicit reviewed configured-audience destination. Never map `agent` to `maintainer` from the slug alone. |
| Retired `docs/assets/playbooks/**` | `.make-docs/archive/legacy-playbooks/**`, preserving the old relative tree as retained historical material. No active Playbook support is implied. |

An identical destination requires byte and provenance verification before any duplicate source is removed. A differing destination blocks until the reviewed map resolves it. Preserve historical statements and substantive history bytes. Mechanical link repairs are allowed only when the operation records old/new links and verifies their targets; they must not rewrite past outcomes into current claims.

Completion requires no unexplained leftovers in the reviewed scope. Explicit historical/archive/backup exclusions must be named and shown to be non-active provenance. Retained-content exceptions cannot leave an active legacy directory in place and still claim completion. Known historical and backup byte copies are distinct non-active exceptions. A generic ignored-path list, a directory-name match, or a successful exit code does not prove completion.

### 7. Delivery and evidence

Author shipped resources in `packages/docs/template/`, build the package projection, then refresh the installed CLI before using the normal CLI recipe for dogfood. Routine setup and migration instructions use `make-docs` commands, not direct `node dist` entry points. Local runtime state remains in the Store throughout.

Use one implementation phase with a finite acceptance matrix. Verify effective defaults/config errors, fresh-context discovery, full directory trees, explicit manual and CLI migration, conflicts and drift, interruption/recovery, link repair, repeat behavior, and the real dogfood disposition. Do not repeatedly run broad suites after the agreed checks pass without a new failure or change.

## Alternatives Considered

- Keep three audience primitives: rejected because actor technology does not define whether the audience uses or maintains the project.
- Replace defaults with a configured list: rejected because empty config could remove the only discoverable audiences.
- Keep asset families eagerly created: rejected because empty legacy paths mislead readers and agents.
- Use a one-time shell cleanup or local migration receipt: rejected because future projects need the same reviewed migration path and Store ownership.
- Leave all legacy material in place with a warning: rejected because unexplained leftovers keep old instructions and paths active.

## Consequences

This changes the fresh-install directory tree, the effective Persona defaults, and the migration destinations. Existing project content must receive an explicit disposition. Setup cannot silently reinterpret custom audiences or delete historical material. The preparation/read-back contract makes manual moves reviewable while keeping CLI-owned state out of the project.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [W19 recovery](2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md), [W9 asset hard move](2026-06-25-v2-documentation-asset-ia-hard-move.md), [W9 Library/archive correction](2026-06-25-v2-library-and-archive-history-ia-correction.md), and [R3 Store ownership](2026-09-09-store-owned-installation-and-migration-state.md).
- Reason: W19 R4 finishes asset recovery and replaces the earlier audience and unconditional assets-root decisions. It preserves prior designs as historical lineage and retains R3's completed state boundary.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md), also available as `make-docs://system/prompt/designs-to-plan-change.prompt.md`.
- Why: Existing PRDs already own every changed capability. Maintain them surgically, then derive the one-phase work backlog.
- Coordinate Handoff: Continue W19 at R4 after closed R3 commit `dabd0b36`. The [plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md) carries the same coordinate. The package and implementation gates are complete. W20 R0 and W21 R0 remain paused pending separate instructions.
