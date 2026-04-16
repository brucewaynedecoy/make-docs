# Agentics Ecosystem — Capability Registry, Modules, and Gateway Skill

> Filename: `2026-04-15-w2-r0-agentics-ecosystem.md`. See [../.references/wave-model.md](../.references/wave-model.md) for W/R semantics.

## Purpose

This design captures the conceptual model for evolving `starter-docs` from a single-template installer into a multi-capability ecosystem. The ecosystem ships skills, hooks, prompts, agent definitions, workflow configs, reference docs, templates, and docs-repo wiring — all as optional, independently installable units — reached through a single gateway skill and a capability registry. The goal is a coherent way to grow the catalog additively without overwhelming consumers or bloating the CLI.

## Context

`starter-docs` v1 ships one artifact: a `docs/` template. v2 needs to ship many artifacts, each optional, each with a different audience. No consumer will want the full set; every consumer will want a different subset. Without an organizing model, the repo drifts toward a kitchen-sink installer and the CLI toward an ever-growing switch statement.

Two forces constrain the solution:

1. The repo must make it easy to add new optional units without touching the core CLI or the core template.
2. Discovery and installation must follow the same progressive-disclosure pattern that makes `docs/` work today — one entry point, narrow choices, descend only into what is relevant.

The v1 proto-registry (`src/catalog.ts`, `src/manifest.ts`, `src/rules.ts`) already hints at the direction. v2 formalizes and generalizes it, and pairs it with a gateway skill so a consumer never has to memorize a menu.

## Decision

### Four Core Terms

The ecosystem rides on four definitions.

| Term | Definition |
|---|---|
| **Capability** | A single installable unit. Examples: a skill, a hook, a prompt file, an agent definition, a workflow YAML, a reference doc, a template. Each capability has a type, a name, a manifest entry, and installation rules. |
| **Module** | A named bundle of related capabilities, shipped together because they serve one purpose. Example: a `design-drafting` module bundles a skill, two prompts, and an agent definition. Modules are the user-facing unit. |
| **Role** | A consumer archetype — "solo dev", "product team", "docs repo admin", "maintainer of a starter-docs-adopting project". Roles map to recommended module sets so first-time installs do not require picking from every module. |
| **Registry** | Authoritative manifest of all capabilities and modules available in the repo. The CLI and the gateway skill both resolve installable units by querying the registry. |

### Eight Capability Types

Each type has its own lives-in directory, install target, and lifecycle concerns. Not all types must ship in the first v2 release; the model must accommodate adding types over time.

| Type | Lives in | Install target | Notes |
|---|---|---|---|
| **Template** | `packages/docs/template/` | Consumer `docs/` tree | The v1 deliverable. |
| **Reference** | Part of template package | `docs/.references/` | Authority files. |
| **Prompt** | Part of template package | `docs/.prompts/` | Optional kickoffs. |
| **Skill** | `packages/skills/<slug>/` | Consumer `.claude/skills/` (or plugin dir) | Agent skill with progressive disclosure. |
| **Hook** | `packages/hooks/<slug>/` | Consumer `.claude/settings.json` + hook script | Fires on tool-use events. |
| **Agent definition** | `packages/agents/<slug>/` | Consumer `.claude/agents/` (or plugin dir) | Named subagent config. |
| **Workflow config** | `packages/workflows/<slug>/` | Consumer workflow runner dir | Consumed by an external harness, not Claude Code directly. |
| **Doc-repo wiring** | `packages/wiring/<flavor>/` | Consumer repo root (git submodule, worktree, etc.) | See wiring flavors below. |

### Package Layout

The ecosystem lives under the monorepo `packages/` tree:

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

Each sub-directory under `packages/<type>/` carries its own `manifest.json` (or frontmatter inside its primary file) so the registry can enumerate it without hardcoding.

### Gateway Skill

A single skill — `starter-docs` (alias `starter-docs-gateway`) — is the user-facing entry point. Its job is not to do the work; its job is to route. The gateway:

1. Inspects the consumer's project — is `docs/` installed, which wiring flavor is detectable, which modules are currently active.
2. Asks what the user wants to accomplish — draft a design, generate a PRD, run a healthcheck, install a new module.
3. Progressive-discloses into the right specialized skill — loads it, runs it, hands control back.

The gateway's internal logic sketches as:

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

The gateway mirrors the `docs/` router pattern: one minimal entry point, route to the next layer, resolve authority there. It is the only piece a consumer must remember; everything else is discovered.

### CLI Integration

The v1 CLI already supports optional capabilities via `src/catalog.ts` and the install wizard. v2 generalizes the surface:

- `starter-docs` (no args) — install the baseline template plus the gateway skill.
- `starter-docs add <module>` — add a module. Resolves via the registry.
- `starter-docs remove <module>` — remove cleanly, reversing all installation effects.
- `starter-docs list` — enumerate installed and available modules.
- `starter-docs doctor` — run healthcheck across installed modules; the gateway skill can invoke this as well.
- `starter-docs role <role>` — interactive wizard keyed off a role ("solo dev", etc.) that suggests a bundled module set.

The `cli-bridge` skill lets an agent drive the CLI invisibly — a user tells an agent "install the PRD module" and the agent runs `starter-docs add prd-module`, cleans up, and confirms.

### Wiring Flavors

Consumers who version-control `docs/` in a separate repo install one of four flavors via `starter-docs add wiring:<flavor>`:

| Flavor | Mechanism | Trade-offs |
|---|---|---|
| `submodule` | `docs/` is a git submodule pointing at a docs-only repo | Familiar; submodules are painful for non-experts. |
| `nested-repo` | `docs/` has its own `.git`; parent `.gitignore` excludes `docs/` | Simple; no submodule pain; harder to discover. |
| `sparse-worktree` | A single "docs mono-repo" is checked out via git worktree into `docs/` | Good for orgs with one central docs repo for all projects. |
| `subtree` | `git subtree` push/pull between parent and docs repo | Preserves history in both places; operationally heavy. |

Every wiring capability ships three pieces: an installer (configures git and drops helper docs into the consumer's repo root), a healthcheck (detects drift, detached head, and related failure modes), and a reversal path (uninstall returns the project to monolithic tracking). The gateway skill helps a user pick a flavor by asking a few orientation questions.

### Hooks

Hooks are Claude Code hooks (`PreToolUse`, `PostToolUse`, `Stop`) installed into `.claude/settings.json` alongside a small script in `.claude/hooks/`. Representative hooks the ecosystem can ship:

- `pre-design-write` — validates the target path matches the `designs/` naming convention before Write.
- `post-prd-generate` — runs `starter-docs doctor` after PRD files are written.
- `pre-archive` — blocks moves into `docs/.archive/` unless a sentinel flag is set, reinforcing the "never archive unless asked" rule.

Each hook is an independently installable, listable, and removable capability.

### Workflows

Workflows are YAML configs that chain skills into repeatable multi-step tasks with self-reflection and optional review gates. The execution harness is a separate project; `starter-docs` ships only the configs. Sketch shape:

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

`starter-docs` guarantees only the config shape and the reference mapping into its registry. The gateway skill can optionally invoke workflows when a harness is detected.

### Registry Shape

The registry is a single file at `packages/registry/index.json` (generated from per-package manifests at build time or hand-edited):

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

The registry is the single source of truth that the CLI, the gateway skill, and the doctor all consult.

### Progressive Disclosure Applied to Skills

The `docs/` model — minimal router, authority in references, shape in templates, kickoff in prompts — maps cleanly onto the skill layer:

| docs/ concept | agentics concept |
|---|---|
| Directory router (`AGENTS.md`/`CLAUDE.md`) | Gateway skill entry prompt |
| References (`docs/.references/`) | Per-skill authority files loaded on demand |
| Templates (`docs/.templates/`) | Scaffolding files used by skills at runtime |
| Prompts (`docs/.prompts/`) | Sub-prompts that skills embed or load |
| Naming conventions | Registry schema |

A skill does not restate rules — it reads the reference for the artifact it is producing. Skills stay thin and the reference layer stays authoritative.

### Initial v2 Module Inventory

The first-wave catalog (not exhaustive, not a release commitment — sequencing belongs in the plan):

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

## Alternatives Considered

- **Hand-edited `index.json` vs build-time aggregation.** A single hand-edited registry file is simpler to read but doubles the change surface for every new capability. Build-time aggregation from per-package manifests is preferred: adding a skill means adding one directory with one manifest, not editing a second central file.
- **One skill-distribution target vs normalized across targets.** Picking a single target (Claude Code plugin, raw `.claude/skills/`, Cursor, etc.) minimizes install surface and maintenance but excludes consumers on other harnesses. Normalizing across multiple targets preserves reach at the cost of more installer code and per-target testing. The registry is designed to express install targets per capability so either path — or a hybrid — remains viable.
- **Claude-Code-only manifest split for hooks.** Hooks are intrinsically Claude-Code-specific (`PreToolUse`/`PostToolUse`/`Stop` and `.claude/settings.json`). Splitting a `claude-code-only` slice of the manifest lets non-Claude-Code consumers install cleanly. Rejected as the default shape because it prematurely fragments the registry; instead, hooks carry a portability field and non-matching consumers skip them.
- **Gateway auto-load vs `/starter-docs` invocation.** Auto-loading the gateway on every Claude Code session maximizes discoverability but is intrusive and noisy. Requiring `/starter-docs` invocation is quiet but missable. Invocation-based is chosen; the CLI surfaces the `/starter-docs` entry point during install so users learn it.
- **Semver per capability vs deferred versioning.** Per-capability semver with `dependsOn` ranges is the long-term target, but without churn data the version boundaries are speculative. Versioning is deferred until real churn appears; the registry schema will admit version fields later.
- **YAML-only modules vs TS-required modules.** Declaring every module in pure YAML/JSON simplifies authoring but cannot express modules that need imperative install logic. Requiring TypeScript guarantees power but raises the floor. The registry supports both: YAML for declarative modules, TypeScript for modules that need executable install hooks.
- **Default-install gateway vs opt-in.** If the gateway is opt-in, a fresh install has no entry point and the ecosystem is invisible. Default-installing the gateway during `starter-docs` baseline means every consumer has one command from day one; the cost is one additional file in the consumer project.

## Consequences

Positive outcomes:

- **Additive extension.** Adding a new skill means adding `packages/skills/<slug>/` with one manifest and letting aggregation pick it up. No CLI changes, no documentation rewrites.
- **Consistent discovery.** One gateway skill plus one CLI. Users do not memorize a menu.
- **Clean separation.** Template, skills, hooks, agents, workflows, wiring — each isolated in its own package with its own install target and its own reversal path.
- **Forward-compat.** New capability types (evals, dashboards, datasets) slot in as new `packages/<type>/` directories and new registry entries without disturbing existing ones.
- **Dogfoodable.** v2's own design, plan, and work artifacts live in the repo-root `docs/`, using the same conventions consumers get.

Risks and trade-offs:

- **Meta-circularity.** The gateway skill is itself a capability registered in the same registry it routes through. Bootstrapping and self-reference need care — in particular, the gateway must degrade gracefully when the registry is absent or corrupt.
- **Uninstall fidelity.** Every capability must remove cleanly, including patches to `.claude/settings.json`, hook scripts, and wiring-induced git state. This must be verified in CI for every capability, not just the template.
- **External-harness dependency.** Workflow configs are inert without a separate execution harness. Shipped workflows must be flagged and explained, not hidden, or they become silent dead weight.

Out of scope for this design:

- Which skills actually ship in the first v2 release — belongs in the downstream plan.
- The internal API of the workflow harness project.
- The exact naming of registry fields and the precise JSON schema.
- Pricing, licensing, and distribution model.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: None of this is implemented yet; the design should flow into a baseline plan that sequences the registry and gateway skill first, then proves the pipeline end-to-end with a single real skill such as `docs-healthcheck` before expanding the catalog.
