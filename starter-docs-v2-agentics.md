# starter-docs v2 — Agentics Ecosystem Concept

> Temporary brainstorming doc. Sibling to `starter-docs-v2-planning.md` and `starter-docs-v2-restructuring.md`. This is a concept sketch, not an implementation plan — it proposes an organizing model for an evolving ecosystem of skills, hooks, prompts, agent definitions, workflow definitions, and docs-maintenance automation that `starter-docs` can ship to consumers.

## The Core Tension

`starter-docs` v1 ships one thing: a `docs/` template. v2 wants to ship many things: skills, hooks, prompts, agent defs, workflow configs, docs-repo wiring, maintenance automation. Every addition is optional; few consumers will want all of it; every consumer will want a different subset.

The project needs a model for **configurability at scale** — so consumers can pick exactly what they want without being overwhelmed by a menu, and without the CLI devolving into a kitchen-sink installer.

Two things must hold:

1. The repo structure must make it easy to **add new optional units** without touching the core CLI or the core template.
2. Discovery and installation must follow the same **progressive disclosure** pattern that makes `docs/` work today — one entry point, narrow choices, descend only into what's relevant.

## Conceptual Model

Four terms. Everything downstream rides on these.

| Term | Definition |
|---|---|
| **Capability** | A single installable unit. Examples: a skill, a hook, a prompt file, an agent definition, a workflow YAML, a reference doc, a template. Each capability has a type, a name, a manifest entry, and installation rules. |
| **Module** | A named bundle of related capabilities, shipped together because they serve one purpose. Example: a `design-drafting` module bundles a skill, two prompts, and an agent definition. Modules are the user-facing unit. |
| **Role** | A consumer archetype — "solo dev", "product team", "docs repo admin", "maintainer of a starter-docs-adopting project". Roles map to recommended module sets so first-time installs don't require picking from every module. |
| **Registry** | Authoritative manifest of all capabilities and modules available in the repo. The CLI and the gateway skill both resolve installable units by querying the registry. |

The registry already exists in spirit — `src/catalog.ts`, `src/manifest.ts`, `src/rules.ts` are v1's proto-registry. v2 generalizes and expands it.

## Capability Types

Eight types, each with its own install target and lifecycle concerns. Not all need to ship in v2 — the model should accommodate adding types over time.

| Type | Lives in | Install target | Notes |
|---|---|---|---|
| **Template** | `packages/docs/template/` | Consumer `docs/` tree | The v1 deliverable. |
| **Reference** | Part of template package | `docs/.references/` | Authority files. |
| **Prompt** | Part of template package | `docs/.prompts/` | Optional kickoffs. |
| **Skill** | `packages/skills/<slug>/` | Consumer `.claude/skills/` (or plugin dir) | Agent skill with progressive disclosure. |
| **Hook** | `packages/hooks/<slug>/` | Consumer `.claude/settings.json` + hook script | Fires on tool-use events. |
| **Agent definition** | `packages/agents/<slug>/` | Consumer `.claude/agents/` (or plugin dir) | Named subagent config. |
| **Workflow config** | `packages/workflows/<slug>/` | Consumer workflow runner dir | Consumed by an external harness, not Claude Code directly. |
| **Doc-repo wiring** | `packages/wiring/<flavor>/` | Consumer repo root (git submodule, worktree, etc.) | See "Docs Tracked Elsewhere" below. |

## Package Layout Under the Monorepo

Building on the restructure plan:

```
packages/
├── cli/                     # installer + orchestrator
├── docs/                    # the template (deliverable)
├── content/                 # rendered fragments used by CLI renderers
├── registry/                # the capability/module manifest + loader (NEW)
├── skills/                  # one sub-dir per skill
│   ├── draft-design/
│   ├── draft-plan/
│   ├── plan-from-design/
│   ├── generate-prd/
│   ├── regenerate-prd/
│   ├── docs-healthcheck/
│   ├── cli-bridge/
│   └── mcp-installer-check/
├── hooks/                   # one sub-dir per hook
│   ├── on-design-save/
│   └── pre-prd-generate/
├── agents/                  # one sub-dir per agent definition
│   └── prd-author/
├── workflows/               # one sub-dir per workflow YAML
│   ├── design-to-work/
│   └── prd-refresh/
├── wiring/                  # doc-repo wiring flavors
│   ├── submodule/
│   ├── nested-repo/
│   └── sparse-worktree/
└── meta/                    # the gateway skill + project conventions (NEW)
    └── starter-docs-gateway/
```

Each sub-dir under `packages/<type>/` carries its own `manifest.json` (or frontmatter inside its primary file) so the registry can enumerate it without hardcoding.

## Gateway Skill (the Meta-Library)

One skill is the entry point: **`starter-docs`** (or `starter-docs-gateway`).

The gateway skill's job is **not** to do the work itself. Its job is to:

1. Inspect the consumer's project — is `docs/` installed? Is the wiring type detectable? Which modules are currently active?
2. Ask what the user wants to accomplish — draft a design, generate a PRD, run a healthcheck, install a new module, etc.
3. Progressive-disclose into the right specialized skill — load it, run it, hand control back.

This mirrors the docs router pattern: one minimal entry point, route to the next layer, resolve authority there.

Sketch of the gateway's internal logic:

```
User invokes /starter-docs
  ↓
Gateway asks: "What do you want to do?"
  ↓
Matches user intent to a registry entry:
  - "draft a design"           → route to `draft-design` skill
  - "generate a PRD"           → route to `generate-prd` skill
  - "check my docs are healthy"→ route to `docs-healthcheck` skill
  - "install a new module"     → route to CLI bridge skill
  - "set up a separate docs repo" → route to wiring flavor selector
  ↓
If the target skill isn't installed locally, offer to install it via the CLI.
  ↓
Load the target skill and hand off.
```

The gateway skill is the only piece a consumer has to remember. Everything else is discovered.

## CLI Integration

The v1 CLI already supports optional capabilities via `src/catalog.ts` and the wizard. v2 generalizes this:

- `starter-docs` (no args) — install the baseline template plus the gateway skill.
- `starter-docs add <module>` — add a module. Resolves via the registry.
- `starter-docs remove <module>` — remove cleanly, reversing all installation effects.
- `starter-docs list` — enumerate installed and available modules.
- `starter-docs doctor` — run healthcheck across installed modules (can also be invoked by the gateway skill).
- `starter-docs role <role>` — interactive wizard keyed off a role (e.g., "solo dev") that suggests a bundle of modules.

The CLI bridge skill lets an agent invoke the CLI invisibly — so a user can tell an agent "install the PRD module" and the agent runs `starter-docs add prd-module` under the hood, cleans up, and confirms.

## Docs Tracked Elsewhere (Wiring Flavors)

Consumers who want their `docs/` tree version-controlled in a separate repo get one of these flavors installed via `starter-docs add wiring:<flavor>`:

| Flavor | Mechanism | Trade-offs |
|---|---|---|
| `submodule` | `docs/` is a git submodule pointing at a docs-only repo | Familiar; submodules are painful for non-experts. |
| `nested-repo` | `docs/` has its own `.git`; parent `.gitignore` excludes `docs/` | Simple; no submodule pain; harder to discover. |
| `sparse-worktree` | A single "docs mono-repo" is checked out via git worktree into `docs/` | Good for orgs with one central docs repo for all projects. |
| `subtree` | `git subtree` push/pull between parent and docs repo | Preserves history in both places; operationally heavy. |

Each flavor is a wiring capability with:

- An installer script (configures git + writes helper docs into the consumer's repo root)
- A healthcheck (detects drift, detached head, etc.)
- A reversal path (uninstall returns the project to monolithic tracking)

The gateway skill helps a user pick a flavor by asking a few orientation questions (solo vs org? one project's docs or many? comfortable with submodules?).

## Hooks

Hooks are Claude Code hooks (`PreToolUse`, `PostToolUse`, `Stop`, etc.) installed into `.claude/settings.json` alongside a small script in `.claude/hooks/`.

Example hooks `starter-docs` could ship:

- `pre-design-write` — validates the target path matches the `designs/` naming convention before Write.
- `post-prd-generate` — runs `starter-docs doctor` after PRD files are written.
- `pre-archive` — blocks any move into `docs/.archive/` unless a sentinel flag is set, reinforcing the "never archive unless asked" rule.

Each hook is a capability that can be individually installed, listed, and removed by the CLI.

## Workflows

Workflows are YAML configs that chain agents for repeatable multi-step tasks with self-reflection. The user has flagged that the actual execution harness is a separate project; `starter-docs` ships the configs.

Shape (sketch):

```yaml
# packages/workflows/design-to-work/workflow.yml
name: design-to-work
description: Take a request through design, plan, and work backlog generation with review gates.
steps:
  - id: design
    skill: draft-design
    inputs: { request: "{{USER_REQUEST}}" }
  - id: plan
    skill: plan-from-design
    inputs: { design: "{{steps.design.output.path}}" }
    gate: user-approval
  - id: work
    skill: prd-to-work
    inputs: { plan: "{{steps.plan.output.path}}" }
```

The workflow harness is external. `starter-docs` guarantees only the config shape and the reference mapping to skills/agents in its registry. The gateway skill can optionally invoke workflows if a harness is detected.

## Registry Shape (Sketch)

A single file at `packages/registry/index.json` (or generated from per-package manifests at build time):

```json
{
  "capabilities": {
    "skill.draft-design": {
      "type": "skill",
      "path": "packages/skills/draft-design",
      "installTarget": ".claude/skills/draft-design",
      "dependsOn": ["template.core", "reference.design-contract"]
    },
    "hook.pre-archive": {
      "type": "hook",
      "path": "packages/hooks/pre-archive",
      "installTarget": ".claude/hooks/pre-archive.sh",
      "patches": [".claude/settings.json"]
    }
  },
  "modules": {
    "design-drafting": {
      "description": "Draft design docs from plain-text requests.",
      "capabilities": ["skill.draft-design", "prompt.request-to-design"]
    },
    "prd-pipeline": {
      "description": "Design → plan → PRD → work backlog pipeline.",
      "capabilities": ["skill.draft-design", "skill.plan-from-design", "skill.generate-prd", "skill.prd-to-work"]
    }
  },
  "roles": {
    "solo-dev": { "suggestedModules": ["design-drafting"] },
    "product-team": { "suggestedModules": ["design-drafting", "prd-pipeline", "hook.pre-archive"] }
  }
}
```

This is the single source of truth the CLI, the gateway skill, and the doctor all consult.

## Progressive Disclosure, Applied to Skills

The `docs/` model — minimal router, authority in references, shape in templates, kickoff in prompts — translates cleanly to skills:

| docs/ concept | agentics concept |
|---|---|
| Directory router (`AGENTS.md`/`CLAUDE.md`) | Gateway skill entry prompt |
| References (`docs/.references/`) | Per-skill authority files loaded on demand |
| Templates (`docs/.templates/`) | Scaffolding files used by skills at runtime |
| Prompts (`docs/.prompts/`) | Sub-prompts that skills embed or load |
| Naming conventions | Registry schema |

A skill doesn't restate rules — it reads the reference for the artifact it's producing. This keeps skills thin and keeps the reference layer authoritative.

## Initial v2 Module Inventory (proposed, not exhaustive)

| Module | Type | What it does |
|---|---|---|
| `core` | template | The baseline `docs/` tree (what v1 ships). |
| `gateway` | meta skill | Entry-point skill; progressive-disclose to others. |
| `design-drafting` | skill + prompt | Draft a design doc from a request. |
| `plan-from-design` | skill + prompt | Generate a plan from a design. |
| `prd-pipeline` | skill bundle | Full PRD lifecycle: generate, regenerate, validate. |
| `docs-healthcheck` | skill | Check `docs/` exists, correct naming, structure intact; optionally repair. |
| `cli-bridge` | skill | Let an agent invoke the CLI invisibly, with cleanup. |
| `mcp-check` | skill | Verify jcodemunch/jdocmunch MCP servers are installed; install if missing. |
| `wiring:submodule` | wiring | Track `docs/` in a separate repo via submodule. |
| `wiring:nested-repo` | wiring | Track `docs/` in a separate repo via nested `.git`. |
| `wiring:sparse-worktree` | wiring | Track `docs/` as a worktree of a central docs repo. |
| `hook.pre-archive` | hook | Block unintended archiving. |
| `workflow.design-to-work` | workflow | YAML for the external harness. |

## Open Questions

- **Registry generation**: hand-edited `index.json` vs build-time aggregation from per-package manifests? Recommend aggregation so adding a new skill means adding a file, not two files.
- **Skill distribution mechanism**: some consumers use Claude Code plugins, some use raw `.claude/skills/`, some use other harnesses (Cursor, etc.). Does `starter-docs` pick one target or normalize across?
- **Hook portability**: hooks are very Claude-Code-specific. Do we split them into a `claude-code-only` manifest so non-Claude-Code consumers get a clean install?
- **Gateway skill trigger**: should the gateway auto-load on every Claude Code session (intrusive) or only when the user invokes `/starter-docs` (discoverable but missable)?
- **Versioning across capabilities**: if a skill depends on a reference file, and the reference evolves, how do skills declare compatibility? Suggest semver per capability with a `dependsOn` range, but defer until we've seen churn patterns.
- **Config-driven vs code-driven modules**: can a module be declared purely in YAML/JSON, or does it need TypeScript? The registry should support both; some modules will need install logic that JSON can't express.
- **Uninstall fidelity**: every capability must be cleanly removable. How do we verify this in CI?
- **Meta-circular problem**: the gateway skill itself is a capability — does the CLI install it by default, or is it opt-in? Recommend default-install during `starter-docs` baseline so the ecosystem has an entry point from day one.
- **Workflow harness dependency**: if we ship workflow configs and no consumer has the harness yet, do we flag them as inert or hide them? Probably flag-and-explain.
- **Discoverability of modules**: `starter-docs list --available` needs to be browsable without drowning the user. A two-level list (roles → modules → capabilities) helps.

## What This Gets Us

- **Additive extension**: adding a skill means adding `packages/skills/<slug>/` and one registry entry. No CLI changes, no documentation rewrites.
- **Consistent discovery**: one gateway skill + one CLI. Users don't memorize a menu.
- **Clean separation**: template, skills, hooks, agents, workflows, wiring — each isolated in its own package with its own install target.
- **Forward-compat**: new capability types (think "evals", "dashboards", "datasets") slot in as new `packages/<type>/` directories and new registry entries.
- **Dogfoodable**: v2's design, plan, and work artifacts live in the repo-root `docs/` (per the restructuring plan), using the same conventions consumers get.

## Out of Scope for This Concept

- Which skills actually ship in the first v2 release (prioritize in a follow-up plan).
- The internal API of the workflow harness project.
- The exact naming of registry fields or the exact JSON schema.
- Pricing / licensing / distribution model.

## Next Steps

1. User review. Capture concept-level feedback in this doc or peel off to a proper design once the direction feels right.
2. Once the restructure (`packages/`) lands, write a v2 design doc in the new repo-root `docs/designs/` that formalizes the registry schema and gateway skill contract.
3. Implement the registry + the gateway skill first. Ship one new real skill (e.g., `docs-healthcheck`) to prove the pipeline end-to-end before adding the rest.
