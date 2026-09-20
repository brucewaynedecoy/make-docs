---
title: "W19 R0 Phase 3: Protocol Contract and Template Authority"
kind: "plan"
status: "draft"
coordinate: "W19 R0"
---

# W19 R0 Phase 3: Protocol Contract and Template Authority

## Purpose

Author the narrow Protocol contract and its default assets **upstream** in `packages/docs/template/`, then project them **downstream** into this repository's installed instance at `./.make-docs/` and `./docs/`. This phase defines what a Protocol is as a shipped Make Docs resource, and it is the phase where the upstream-first authority rule is most load-bearing, because it replaces materialized system assets that the manifest tracks by logical asset ID.

## Upstream-First Ordering

`packages/docs/template/` is the single upstream authority. `packages/cli/` maintains no template and pulls `packages/docs/template/` at build time only; `packages/cli/template/` is build output and is never hand-edited in this phase. Every change below is authored upstream first and only then projected. Reversing the order would make the dogfood instance the accidental source of truth for a resource the template package ships.

The full contract is `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`.

## The Protocol Contract

New upstream file: `packages/docs/template/.make-docs/contracts/system/protocol-contract.md`, replacing `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`.

The current Playbook contract is 300 lines and owns four areas: the document schema, the workflow contract and step model, the dependency registry, and the model with its parser, validator, and diagnostics. The Protocol contract owns **one**: the document schema, plus the shape validation that enforces it.

### What the Protocol contract states

- **Identity.** A Protocol is a persona-scoped guidance document at `docs/assets/protocols/<persona-slug>/`, named `<slug>.protocol.md`. The `persona` frontmatter value must match the containing folder. The canonical reference derives as `persona/slug`.
- **Purpose.** A Protocol constrains how an agent works: it names the authority and precedence order the agent honors, the constraints it must not violate, the checks it must surface, and the departures it must report. It is read, not executed.
- **Frontmatter.** `kind: protocol`, `title`, `summary`, `persona`, `status`, and a `schema` identifier. `workflowSchema`, `packagingHints`, and `stack` are not part of the Protocol schema; `stack` is retained only if phase 4's trace finds a surviving consumer, and the decision is recorded either way.
- **Heading spine.** A short required spine appropriate to guidance rather than execution: `## Purpose`, `## When To Use`, `## Authority And Precedence`, `## Guardrails`, `## Checks To Surface`, `## Departures And Escalation`. `## Inputs`, `## Dependencies`, `## Workflow`, `## Step Guidance`, `## Gates`, `## Outputs`, `## Validation`, and `## Packaging Notes` are not part of the Protocol spine. The exact spine is settled during authoring; the binding requirement is that no section carries machine meaning.
- **All content is narrative.** The contract states explicitly that a Protocol has no authoritative machine-readable region. There is no workflow block, no dependencies block, no step model, no gates, no events, no orchestration policy, and no packaging hints. Prose never carries machine meaning, and there is no second place for it to live.
- **Validation limits.** The validator checks frontmatter presence and types, the persona-folder match, the heading spine and order, non-empty required sections, and the file suffix. It does nothing else. The contract states this as a ceiling, not a floor: parity means the validator enforces every rule here and no rule this contract does not state.
- **Non-goals, stated in the contract itself.** No execution, no run state, no gating, no dependency resolution, no packaging, no Skill or plugin generation, no orchestration.
- **Diagnostics.** A reduced code set covering only the surviving rules.

### Migration form

The contract defines how a v2 Playbook document is recognized and reported. A file matching `*.playbook.md`, or carrying `kind: playbook`, fails validation with a pointed diagnostic naming its Protocol replacement and pointing at the phase-5 migration guidance. Whether the transitional detection ships or the break is clean is settled in phase 5 alongside the compatibility disposition; the contract carries whichever is chosen.

## Template Asset Changes

| Upstream path | Action |
| --- | --- |
| `packages/docs/template/.make-docs/contracts/system/protocol-contract.md` | Create |
| `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` | Remove |
| `packages/docs/template/docs/assets/protocols/AGENTS.md`, `CLAUDE.md` | Create |
| `packages/docs/template/docs/assets/protocols/agent/make-docs-lifecycle.protocol.md` | Create — rewrite of the 554-line default asset as guidance |
| `packages/docs/template/docs/assets/playbooks/` | Remove the directory and its three files |
| `packages/docs/template/.make-docs/AGENTS.md`, `CLAUDE.md` | Update routing lines |
| `packages/docs/template/.make-docs/contracts/system/AGENTS.md`, `CLAUDE.md` | Update contract index |
| `packages/docs/template/.make-docs/contracts/system/coverage-pass-contract.md` | Guide and protocol coverage; the future-content sentence points at the protocol contract |
| `packages/docs/template/.make-docs/references/system/lifecycle.md` | Coverage band wording |
| `packages/docs/template/.make-docs/references/system/path-and-link-hygiene.md` | Path examples |
| `packages/docs/template/docs/AGENTS.md`, `CLAUDE.md` | Router lines for the protocols namespace and the protocol contract |
| `packages/docs/template/docs/assets/AGENTS.md`, `CLAUDE.md` | Asset namespace listing |
| `packages/docs/template/docs/assets/library/AGENTS.md`, `CLAUDE.md` | Cross-references |

### Rewriting the default asset

The current `make-docs-lifecycle.playbook.md` already says in prose that it "is not automation, does not enforce stage order, and does not gate work," while its frontmatter and workflow block encode the automation contract. The rewrite resolves that contradiction in favor of the prose. The lifecycle stage narrative, the authority and precedence order, and the departure-reporting requirement are preserved as guidance. The workflow block, dependency block, step guidance keyed to steps, gates, and packaging notes are dropped. The result should be substantially shorter than 554 lines; length is an outcome, not a target.

## Manifest And Materialization

`.make-docs/manifest.json` tracks these as `materialized-system-asset` entries with logical asset IDs and local paths:

- `.make-docs/contracts/system/playbook-contract.md`
- `docs/assets/playbooks/AGENTS.md`
- `docs/assets/playbooks/CLAUDE.md`
- `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`

Each is retired and replaced by its protocol-namespace equivalent. Because logical asset IDs are identity, this is an asset replacement rather than a path edit: the retired IDs are removed and the new IDs are added, and the installer's uninstall and backup handling must be checked so a project upgrading from a Playbook-era install does not leave orphans. `packages/cli/src/catalog.ts` builds default paths from `getPlaybookDefaultPaths(profile)` and adds `docs/assets/playbooks/${activeInstructionKind}`; both are retargeted. `packages/cli/src/system-assets.ts` and the install, uninstall, and backup paths are traced for playbook-named entries.

## Dogfood Projection

After the upstream template is complete and validated, project downstream into this repository:

| Downstream path | Action |
| --- | --- |
| `.make-docs/contracts/system/protocol-contract.md` | Materialize |
| `.make-docs/contracts/system/playbook-contract.md` | Remove |
| `.make-docs/AGENTS.md`, `.make-docs/CLAUDE.md`, `.make-docs/contracts/system/AGENTS.md`, `.make-docs/contracts/system/CLAUDE.md`, `.make-docs/contracts/system/coverage-pass-contract.md`, `.make-docs/references/system/lifecycle.md`, `.make-docs/references/system/path-and-link-hygiene.md` | Project updated content |
| `.make-docs/manifest.json` | Regenerate entries |
| `docs/assets/protocols/AGENTS.md`, `CLAUDE.md`, `agent/make-docs-lifecycle.protocol.md` | Materialize |
| `docs/assets/playbooks/` | Remove |
| `docs/AGENTS.md`, `docs/CLAUDE.md`, `docs/assets/AGENTS.md`, `docs/assets/CLAUDE.md`, `docs/assets/library/AGENTS.md`, `docs/assets/library/CLAUDE.md` | Project updated router content |
| Root `AGENTS.md`, `CLAUDE.md` | Update only if a managed block references the retired contract |

The managed-block primitive governs the `<!-- make-docs:begin -->` regions in router files; projection edits those regions through the managed-block path rather than by hand, per `docs/prd/15-agent-instruction-ownership-and-managed-blocks.md`.

`packages/cli/template/` is regenerated by the build from `packages/docs/template/`, and is verified as a build output rather than edited.

## Reader-Facing Guides

Guides under `docs/assets/library/<persona-slug>/` that document Playbook authoring, running, or packaging are reconciled under `.make-docs/contracts/system/coverage-pass-contract.md` using the verdict spine `create`, `update-existing`, `link-only`, or `none`. Guides describing retired capabilities take `none` and are removed from current coverage; guides describing authoring take `update-existing` against the Protocol contract. A guide never adds, relaxes, or contradicts the contract.

## Acceptance

- The Protocol contract exists upstream, states its own non-goals, and defines no machine-readable region.
- Upstream changed before downstream in every case, verified by the change record.
- `packages/cli/template/` is byte-consistent with a build from `packages/docs/template/`.
- The manifest lists protocol assets and no playbook assets, and an upgrade from a Playbook-era install leaves no orphaned asset.
- No `docs/assets/playbooks/` directory remains in the template or in the dogfood instance.
- The default Protocol asset contains no frontmatter key and no section that implies execution.
- Guide coverage carries an explicit verdict for every affected guide.

## Non-Goals For This Phase

- Changing CLI, MCP, operation-registry, or conformance surfaces. Phase 4 owns those.
- Editing archived content under `docs/assets/archive/`.
- Editing Persona or Naive UAT implementation files.
