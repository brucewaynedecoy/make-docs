# Make Docs

Drop-in documentation structure, templates, and AI agent instructions for any project. Install the system with `npx @brucewaynedecoy/make-docs@next` to get a ready-made setup for generating PRDs, implementation backlogs, architectural designs, and plans with consistent naming conventions and enforced section contracts.

## Repository Layout

This repo is a pseudo-monorepo organized under `packages/`:

```
packages/
  cli/           # The publishable installer CLI (npm package: @brucewaynedecoy/make-docs; bin: make-docs)
  docs/          # The shippable documentation template
    template/    # The template tree that gets copied into consumer projects
  skills/        # Sole authoring source for the seven optional first-party Skills
docs/            # This repo's own dogfood docs (design, planning, work tracking for make-docs itself)
scripts/         # Repo-level orchestration (template sync, smoke-pack, router checks)
```

The CLI build reads system resources from `packages/docs/template/`. The packed CLI includes them in its generated `template/` directory. Skill files have a separate source: `packages/skills/<name>/`. The build embeds their declared bytes in compiled CLI output without creating Skill mirrors in the docs or CLI packages.

This repository is also a **dogfood instance**: Make Docs uses its own documentation system. Author system changes upstream in `packages/docs/template/`, rebuild and install the CLI with `just install-cli-pack`, then use the installed CLI's `make-docs setup --dry-run` and `make-docs setup` commands to review and apply them here. Edit project designs, plans, PRDs, work backlogs, and guides in place. See [Dogfood and Maintainer Operations](docs/assets/maintainer/maintainer-dogfood-and-maintainer-operations.md).

The npm package boundary is narrower than the repository layout. The packed `@brucewaynedecoy/make-docs` tarball contains npm metadata and license files, the package README, built CLI output under `dist/`, the bundled `template/`, and the skill registry/schema files. Repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source packages, scripts, and scratch planning material are not shipped as tarball-root package contents.

## What's Included

The selected setup creates the documentation and system instruction directories below. Resource bodies can stay in the installed CLI or be copied locally when selected. Assets and archives are created only when needed:

```
.make-docs/
  config.yaml         # Portable project settings, including Persona overrides
  system/             # System instructions and optional local resource bodies
    contracts/        # Rules for documents and workflows
    prompts/          # Reusable prompt starters
    references/       # Workflow and reference material
    templates/        # Document starters
  archive/            # Archived project content, created on demand
    history/          # Work history records, created on demand
docs/
  assets/             # Created on demand, with selected agent instruction files
    project/          # Shared project assets, only when needed
    user/             # End-user assets, only when needed
    maintainer/       # Maintainer assets, only when needed
    <persona>/        # Assets for a configured custom Persona, only when needed
  designs/            # Architectural decisions and design rationale (ADRs)
  plans/              # Approach and strategy documents (created before execution)
  prd/                # Product requirement documents (descriptive: what the product is)
  work/               # Work backlogs and task lists (prescriptive: what to do)
CLAUDE.md             # Root instructions when Claude Code is selected
AGENTS.md             # Root instructions when Codex is selected
```

Instruction files match the selected agent tools. The always-present docs instructions explain asset paths and Persona defaults. `user` and `maintainer` are built in; `.make-docs/config.yaml` can override their display fields and define custom Personas. Use `make-docs project persona list` to inspect the effective settings without Store access.

Setup does not create `docs/assets/`. When an asset is needed, `make-docs project surface ensure assets` creates only that root and its selected instruction files. Shared and Persona subdirectories are created only when content needs them; they do not receive managed instruction files.

Read system resources through stable `make-docs://system/<type>/<path>` identities with `make-docs resource read`. Local resource bodies belong under `.make-docs/system/`. Installation, upgrade, migration, ownership, and recovery state belong only in the global Make Docs Store. Local backup and conflict copies preserve content; their operation records stay in the Store.

### Optional Skills

The CLI includes `archive-docs`, `cleanup-docs`, `decompose-codebase`, `preflight`, `software-factory`, `human-experience`, and `naive-uat` (Unassisted Goal Testing). Skills are optional and install from embedded package bytes. The three promoted guidance Skills—`preflight`, `software-factory`, and `human-experience`—require an explicit request to run.

| Scope and selected tools | Skill files | Other access |
| --- | --- | --- |
| Project, Claude Code only | `.claude/skills/<name>/` | No `.agents/skills/` is created. |
| Project, Codex only | `.agents/skills/<name>/` | No `.claude/skills/` is created. |
| Project, both | `.agents/skills/<name>/` | Claude links or supported managed copies. |
| Global | `~/.agents/skills/<name>/` | Links or supported copies for selected tools: `CODEX_HOME/skills` (default `~/.codex/skills`) and `CLAUDE_CONFIG_DIR/skills` (default `~/.claude/skills`). |

Use `make-docs setup skills` to manage Skills. Existing unmanaged copies require the reviewed `--adopt-existing` flow. There is no private Make Docs Skill installation directory. See [Installing and Managing Skills](docs/assets/user/skills-installing-and-managing-skills.md).

## Guide Discovery

If you are using or maintaining `make-docs`, start with the guide that matches the job at hand:

- Onboarding: [Installing Make Docs](docs/assets/user/getting-started-installing-make-docs.md) for first install and initial profile choices, then [Managing Installations with the Make Docs CLI](docs/assets/user/cli-lifecycle-managing-installations.md) for apply or sync, reconfigure, backup, removal, and recovery.
- Workflows and concepts: [How Make Docs Stages Fit Together](docs/assets/user/workflows-how-make-docs-stages-fit-together.md), [Understanding W/R/P Coordinates](docs/assets/user/concepts-wave-revision-phase-coordinates.md), [Choosing the Right Route for Your Project](docs/assets/user/workflows-choosing-the-right-route-for-your-project.md), and [Development Workflows](docs/assets/maintainer/development-workflows-stage-model-and-artifact-relationships.md).
- CLI and skills: [Installing and Managing Skills](docs/assets/user/skills-installing-and-managing-skills.md), [Decomposing an Existing Codebase](docs/assets/user/skills-decomposing-an-existing-codebase.md), [Skills Catalog and Distribution Model](docs/assets/maintainer/skills-catalog-and-distribution-model.md), and [Building and Installing the CLI Locally](docs/assets/maintainer/cli-development-local-build-and-install.md).
- Maintainer and release operations: [Guide Contracts and Authoring for make-docs](docs/assets/maintainer/template-contracts-guide-authoring.md), [Template Assets and Generated Routers](docs/assets/maintainer/template-assets-and-generated-routers.md), [Docs Assets and Runtime State Boundaries](docs/assets/maintainer/maintainer-docs-assets-and-runtime-state-boundaries.md), [Dogfood and Maintainer Operations](docs/assets/maintainer/maintainer-dogfood-and-maintainer-operations.md), and [Packaging, Validation, and Release Reference](docs/assets/maintainer/release-packaging-validation-and-release-reference.md).

## Quick Start

### Install with `npx` (recommended)

From your project root:

```bash
npx @brucewaynedecoy/make-docs@next
```

Use the scoped npm package name for `npx` lookup and installation. The executable exposed by that package is `make-docs`, and the same TypeScript package owns install, maintenance, deterministic operation, and MCP behavior.

The current `npx` package ships the TypeScript installer-maintainer CLI plus a read-first MCP stdio server available through `make-docs mcp`. MCP tools inspect installed state, read Store installation records and declarative project config, classify compatibility, build dry-run plans, and delegate deterministic operations to the same operation registry used by `make-docs run`.

Bare `make-docs` is context-aware: with no install present it starts a guided setup, and with an install present it shows status and help without syncing. Install and sync live under `make-docs setup`.

The default documentation profile includes:

- all capabilities are selected by default: `designs`, `plans`, `prd`, and `work`
- instruction files for the selected tools, with both Codex and Claude Code selected by default
- optional local system resource bodies; project assets and archives remain on demand

Skills are a separate optional selection. A new default setup installs no Skills. Choose named Skills or `--selected-skills all` to include them. You can opt out of documentation capabilities and tools you do not need.

The capability graph is dependency-aware:

- `designs` is independent
- `plans` is independent
- `prd` requires `plans`
- `work` requires both `plans` and `prd`

If you opt out of a prerequisite, downstream capabilities stay selected for later but become disabled until the prerequisite is turned back on.

Useful non-interactive forms:

```bash
# Install the default documentation profile without Skills
npx @brucewaynedecoy/make-docs@next setup --yes

# Default documentation profile except work docs
npx @brucewaynedecoy/make-docs@next setup --yes --no-work

# Sync an existing install using its saved Store selections
npx @brucewaynedecoy/make-docs@next setup

# Reconfigure an existing install
npx @brucewaynedecoy/make-docs@next setup reconfigure

# Preview changes without writing files
npx @brucewaynedecoy/make-docs@next setup --dry-run
```

### What the installer writes

The installer writes only the files that match your selected profile:

- visible capability directories such as `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`
- only the prompt starters, templates, and reference files that are valid for that profile
- generated instruction routers and support files that avoid pointing agents at missing directories or prompt files
- `.make-docs/config.yaml`, which holds portable project identity and desired settings

The global Make Docs Store holds the installed profile, applied hashes, ownership, migration progress, locks, and recovery records. The CLI manages those records. It never creates a project-local operational manifest or state folder. Existing `.make-docs/manifest.json` and `.make-docs/state/` files are legacy transfer inputs; let the corrected CLI review and transfer them. Do not recreate or delete them by hand.

Project documents, history, work backlog updates, and approved backup file copies remain local. If the CLI is unavailable or optional lifecycle capture fails, ordinary project work can continue with a clear unavailable-capture notice. Do not use direct Store writes, queued writes, local fallback state, or false capture claims. CLI-managed installs, upgrades, and migrations still require durable Store records and stop safely when recording fails.

Apply/sync behavior is intentionally non-destructive:

- unchanged managed files are updated in place
- locally modified managed files are skipped
- unmanaged conflicting files are never overwritten
- proposed replacements are staged under `.make-docs/conflicts/<run-id>/`

### Working without the CLI

Ordinary document work can continue without the CLI. Follow the project's agent instructions and valid local system resources. Persona settings remain in `.make-docs/config.yaml`; when no Personas are configured, use the built-in `user` and `maintainer` defaults.

The files in `packages/docs/template/` are authoring sources. Copying them does not produce a profile-specific installation or establish managed ownership. Use the CLI for managed setup, upgrades, and migrations. If optional state capture is unavailable during document work, report that limit and continue without recording fallback state locally.

### What you'll get

After CLI setup, your project has the selected documentation and instructions. Asset and history folders remain on demand:

- **`docs/`** -- A structured documentation directory with templates and agent instructions ready to use.
- **`CLAUDE.md` / `AGENTS.md`** -- Root-level agent instructions that point AI agents to the documentation system. The installer can generate these to match the selected capability profile and will not overwrite conflicting files automatically.
- **Global Make Docs Store** -- Records the applied installation, ownership, managed file hashes, operation progress, and recovery state. Local `.make-docs/config.yaml` holds portable project identity and desired settings.
- **`docs/assets/project/` and `docs/assets/<persona>/`** -- Shared and audience-specific assets, created only when needed.
- **`.make-docs/archive/history/`** -- Work history records, created on demand.

## How It Works

This system supports two primary workflows, both driven by AI agents:

1. **Planning** -- Settle the document tree shape, determine which PRD sections are needed, and produce a reviewable plan before any documents are written.
2. **Execution** -- Generate a full PRD set and linked work backlog from an approved plan, with support for single-agent or delegated multi-agent execution.

### Document Types

| Directory | Purpose | Naming Convention |
|-----------|---------|-------------------|
| `prd/` | Describe what the product is and how it works | `NN-<slug>.md` (e.g., `01-product-overview.md`) |
| `work/` | Prescribe what to build, in what order | `YYYY-MM-DD-w{W}-r{R}-<slug>/` with `00-index.md` and phase files |
| `plans/` | Capture approach and rationale before execution | `YYYY-MM-DD-w{W}-r{R}-<slug>/` with `00-overview.md` and phase files |
| `designs/` | Record architectural decisions and trade-offs | `YYYY-MM-DD-<slug>.md` |

### PRD Structure

Every PRD set includes a fixed core:

| File | Purpose |
|------|---------|
| `00-index.md` | Table of contents and PRD overview |
| `01-product-overview.md` | What the product does and why |
| `02-architecture-overview.md` | System architecture and key components |
| `03-open-questions-and-risk-register.md` | Unknowns, risks, and mitigations |
| `04-glossary.md` | Domain-specific terminology |

Additional subsystem documents (`05-*` through `99-*`) are added as needed for features, services, or reference material.

## Customization

- **Prompt resources** (`make-docs://system/prompt/<posix-relative-path>`) -- Read installed prompt bytes with `make-docs resource read`. Select a local projection only when the project needs one.
- **Templates** (`.make-docs/system/templates/`) -- Modify these to change the structure of generated documents.
- **Contracts and references** (`.make-docs/system/contracts/` and `.make-docs/system/references/`) -- Adjust naming conventions, required sections, lifecycle rules, and structural guidance.
- **Project and Persona assets** (`docs/assets/project/` and `docs/assets/<persona>/`) -- Maintain shared material, guides, and procedures for the intended audience.
- **Agent instructions** (`CLAUDE.md`, `AGENTS.md`, and per-directory variants) -- Tailor agent behavior to your team's conventions.

If you used the installer, rerun `npx @brucewaynedecoy/make-docs@next setup reconfigure` after changing which capability families you want managed locally. The installer will regenerate profile-aware router files so they stay aligned with the directories you keep.

## Contributing

This repo uses npm workspaces. The publishable CLI is at `packages/cli/`; the shippable template is at `packages/docs/template/`. All repo-level orchestration scripts live at `scripts/`.

Common commands (from the repo root):

```bash
npm install                 # install all workspaces
just build                  # build the CLI
just test                   # run all CLI tests
just smoke-pack             # pack the CLI and exercise the installer end-to-end
just check-instruction-routers  # validate AGENTS.md / CLAUDE.md pairs across the repo
```

Fallbacks without `just`:

```bash
npm run build -w packages/cli
npm test -w packages/cli
node scripts/smoke-pack.mjs
bash scripts/check-instruction-routers.sh
```

The instruction-router check enforces that every `AGENTS.md` has an identical `CLAUDE.md` sibling, that both stay within the per-directory line budget, and that neither reintroduces heavy headings like `## Files` or `## Templates`. Run it after editing any router before committing.

Template changes propagate to the CLI tarball at publish time via the `prepack` script in `packages/cli/package.json`, which copies `packages/docs/template/` into `packages/cli/template/` before `npm pack` runs.

## License

Apache-2.0
