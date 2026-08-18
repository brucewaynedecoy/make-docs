# Make Docs

Drop-in documentation structure, templates, and AI agent instructions for any project. Install the system with `npx @brucewaynedecoy/make-docs@next` to get a ready-made setup for generating PRDs, implementation backlogs, architectural designs, and plans with consistent naming conventions and enforced section contracts.

## Repository Layout

This repo is a pseudo-monorepo organized under `packages/`:

```
packages/
  cli/           # The publishable installer CLI (npm package: @brucewaynedecoy/make-docs; bin: make-docs)
  docs/          # The shippable documentation template
    template/    # The template tree that gets copied into consumer projects
  content/       # Reserved for CLI-rendered content fragments
  skills/        # Agent skills shipped alongside the template
docs/            # This repo's own dogfood docs (design, planning, work tracking for make-docs itself)
scripts/         # Repo-level orchestration (template sync, smoke-pack, router checks)
```

The publishable CLI reads the template from `packages/docs/template/` in dev and from its own `template/` directory once packed. The repo-root `docs/` directory is a **dogfood instance** of the template — this project uses its own conventions to design and plan its own evolution. When template-owned files change in `packages/docs/template/`, maintainers manually re-seed only the affected routers, system resources, prompt starters, templates, and selected helper scripts into the dogfood tree. See the [Dogfooding and Re-seeding](packages/docs/README.md#dogfooding-and-re-seeding) section in the docs package README for the full workflow.

The npm package boundary is narrower than the repository layout. The packed `@brucewaynedecoy/make-docs` tarball contains npm metadata and license files, the package README, built CLI output under `dist/`, the bundled `template/`, and the skill registry/schema files. Repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source packages, scripts, and scratch planning material are not shipped as tarball-root package contents.

## What's Included

Consumers of `make-docs` receive the following structure in their project root:

```
.make-docs/           # System machinery plus runtime state
  contracts/system/   # Normative contracts used by agents and workflows
  references/system/  # Workflow references and reusable prompt starters
  templates/system/   # Structural starters for generated docs
  scripts/            # Packaged helper scripts when selected
docs/
  assets/             # People-and-agent-managed project documentation assets
    archive/          # Explicitly archived docs artifacts
      history/        # Session history records, created on demand
    artifacts/        # Optional pre-design input material
    library/          # Persona-based guide documentation
    playbooks/        # Persona-based procedural docs
  designs/            # Architectural decisions and design rationale (ADRs)
  plans/              # Approach and strategy documents (created before execution)
  prd/                # Product requirement documents (descriptive: what the product is)
  work/               # Work backlogs and task lists (prescriptive: what to do)
CLAUDE.md             # Root agent instructions
AGENTS.md             # Root agent instructions (multi-agent compatible)
```

Each directory includes its own `CLAUDE.md` and `AGENTS.md` files with context-specific instructions for AI agents generating documentation within that directory.

The `docs/assets/` namespace contains project documentation assets only: archive records, optional pre-design artifacts, persona library guides, and playbooks. Make Docs system machinery lives under `.make-docs/{contracts,references,templates}/system/**` and `.make-docs/scripts/**`. Reusable prompts are first-class provider resources with stable `make-docs://system/prompt/<posix-relative-path>` identities. Read them with `make-docs resource read`; a project-local projection is optional. Mutable CLI runtime state also lives outside `docs/` under root `.make-docs/`, especially `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.

## Guide Discovery

If you are using or maintaining `make-docs`, start with the guide that matches the job at hand:

- Onboarding: [Installing Make Docs](docs/assets/library/user/getting-started-installing-make-docs.md) for first install and initial profile choices, then [Managing Installations with the Make Docs CLI](docs/assets/library/user/cli-lifecycle-managing-installations.md) for apply or sync, reconfigure, backup, removal, and recovery.
- Workflows and concepts: [How Make Docs Stages Fit Together](docs/assets/library/user/workflows-how-make-docs-stages-fit-together.md), [Understanding W/R/P Coordinates](docs/assets/library/user/concepts-wave-revision-phase-coordinates.md), [Choosing the Right Route for Your Project](docs/assets/library/user/workflows-choosing-the-right-route-for-your-project.md), and the developer workflow companions in [`docs/assets/library/developer/`](docs/assets/library/developer/).
- Lifecycle playbook: [Make Docs Lifecycle Playbook](docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md) for agent phase routing from inputs through retrospective.
- CLI and skills: [Installing and Managing Skills](docs/assets/library/user/skills-installing-and-managing-skills.md), [Decomposing an Existing Codebase](docs/assets/library/user/skills-decomposing-an-existing-codebase.md), [Skills Catalog and Distribution Model](docs/assets/library/developer/skills-catalog-and-distribution-model.md), and [Building and Installing the CLI Locally](docs/assets/library/developer/cli-development-local-build-and-install.md).
- Maintainer and release operations: [Guide Contracts and Authoring for make-docs](docs/assets/library/developer/template-contracts-guide-authoring.md), [Template Assets and Generated Routers](docs/assets/library/developer/template-assets-and-generated-routers.md), [Docs Assets and Runtime State Boundaries](docs/assets/library/developer/maintainer-docs-assets-and-runtime-state-boundaries.md), [Dogfood and Maintainer Operations](docs/assets/library/developer/maintainer-dogfood-and-maintainer-operations.md), and [Packaging, Validation, and Release Reference](docs/assets/library/developer/release-packaging-validation-and-release-reference.md).

## Quick Start

### Install with `npx` (recommended)

From your project root:

```bash
npx @brucewaynedecoy/make-docs@next
```

Use the scoped npm package name for `npx` lookup and installation. The executable exposed by that package is `make-docs`, and the same TypeScript package owns install, maintenance, deterministic operation, and MCP behavior.

The current `npx` package ships the TypeScript installer-maintainer CLI plus a read-first MCP stdio server available through `make-docs mcp`. MCP tools inspect installed state, read manifest/config state, classify compatibility, build dry-run plans, and delegate deterministic operations to the same operation registry used by `make-docs run`.

Bare `make-docs` is context-aware: with no install present it starts a guided setup, and with an install present it shows status and help without syncing. Install and sync live under `make-docs setup`.

The installer starts in full-install mode:

- all capabilities are selected by default: `designs`, `plans`, `prd`, and `work`
- optional assets are selected by default: prompt starters, all valid templates, all valid references, and both `AGENTS.md` and `CLAUDE.md`
- you opt out of anything you do not want

The capability graph is dependency-aware:

- `designs` is independent
- `plans` is independent
- `prd` requires `plans`
- `work` requires both `plans` and `prd`

If you opt out of a prerequisite, downstream capabilities stay selected for later but become disabled until the prerequisite is turned back on.

Useful non-interactive forms:

```bash
# Install everything with defaults
npx @brucewaynedecoy/make-docs@next setup --yes

# Full install except work docs
npx @brucewaynedecoy/make-docs@next setup --yes --no-work

# Sync an existing install using its saved manifest selections
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
- `.make-docs/manifest.json`, which records the installed profile and managed file hashes for later apply/sync runs

Apply/sync behavior is intentionally non-destructive:

- unchanged managed files are updated in place
- locally modified managed files are skipped
- unmanaged conflicting files are never overwritten
- proposed replacements are staged under `.make-docs/conflicts/<run-id>/`

### Copy the drop-in docs files manually

If you do not want to use the installer, you can still copy the drop-in files directly. The commands below copy only:

- `docs/`
- `AGENTS.md`
- `CLAUDE.md`

Using `curl` + `tar` (no clone required):

```bash
# From your project root
tmp_dir="$(mktemp -d)"
curl -sL https://github.com/<owner>/make-docs/archive/refs/heads/main.tar.gz \
  | tar -xz -C "$tmp_dir" --strip-components=1
template="$tmp_dir/packages/docs/template"
mkdir -p ./docs
rsync -av "$template/docs/" ./docs/
rsync -av "$template/AGENTS.md" "$template/CLAUDE.md" ./
rm -rf "$tmp_dir"
```

Using `git clone` + `rsync`:

```bash
# Clone into a temporary directory, copy only the drop-in files, clean up
git clone --depth 1 https://github.com/<owner>/make-docs.git /tmp/make-docs
template=/tmp/make-docs/packages/docs/template
mkdir -p ./docs
rsync -av "$template/docs/" ./docs/
rsync -av "$template/AGENTS.md" "$template/CLAUDE.md" ./
rm -rf /tmp/make-docs
```

Using `degit` (if installed):

```bash
npx degit <owner>/make-docs ./tmp-make-docs
template=./tmp-make-docs/packages/docs/template
mkdir -p ./docs
rsync -av "$template/docs/" ./docs/
rsync -av "$template/AGENTS.md" "$template/CLAUDE.md" ./
rm -rf ./tmp-make-docs
```

> **Note:** Replace `<owner>` with the GitHub username or organization once the repo is public.

### What you'll get

After installing or copying, your project will have:

- **`docs/`** -- A structured documentation directory with templates and agent instructions ready to use.
- **`CLAUDE.md` / `AGENTS.md`** -- Root-level agent instructions that point AI agents to the documentation system. The installer can generate these to match the selected capability profile and will not overwrite conflicting files automatically.
- **`.make-docs/manifest.json`** -- Present when you use the CLI installer. Tracks the selected profile and managed file hashes so future apply/sync runs stay narrow and safe.
- **`docs/assets/library/`** -- Persona-based guides and related project documentation.
- **`docs/assets/archive/history/`** -- Session history records for point-in-time work breadcrumbs, created on demand.

The copy commands above scope to `packages/docs/template/`, which intentionally excludes the CLI source, repo-level scripts, and this repo's own dogfood `docs/`.

## How It Works

This system supports two primary workflows, both driven by AI agents:

1. **Planning** -- Settle the document tree shape, determine which PRD sections are needed, and produce a reviewable plan before any documents are written.
2. **Execution** -- Generate a full PRD set and linked work backlog from an approved plan, with support for single-agent or delegated multi-agent execution.

### Document Types

| Directory | Purpose | Naming Convention |
|-----------|---------|-------------------|
| `prd/` | Describe what the product is and how it works | `NN-<slug>.md` (e.g., `01-product-overview.md`) |
| `work/` | Prescribe what to build, in what order | `YYYY-MM-DD-<slug>.md` |
| `plans/` | Capture approach and rationale before execution | `YYYY-MM-DD-<slug>.md` |
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
- **Templates** (`.make-docs/templates/system/`) -- Modify these to change the structure of generated documents.
- **Contracts and references** (`.make-docs/contracts/system/` and `.make-docs/references/system/`) -- Adjust naming conventions, required sections, lifecycle rules, and structural guidance.
- **Library and playbooks** (`docs/assets/library/` and `docs/assets/playbooks/`) -- Maintain persona-scoped reader-facing guides and procedural docs.
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
