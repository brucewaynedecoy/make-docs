# Make Docs

Install a structured documentation system into any project with a single CLI command. `make-docs` creates a documentation tree for PRDs, plans, design records, work backlogs, reusable templates, prompt starters, and AI agent instruction routers.

## Quick Start

From the root of the project you want to equip:

```bash
npx @brucewaynedecoy/make-docs@next
```

Bare `make-docs` is context-aware: with no install present it starts a guided setup, and with an install present it shows status and help without syncing. For a non-interactive install with the default profile:

```bash
npx @brucewaynedecoy/make-docs@next setup --yes
```

The installer writes a profile-aware documentation system and records managed files in `.make-docs/manifest.json` so later runs can update generated files without overwriting local edits.

## Common Commands

```bash
# Install the default documentation system
npx @brucewaynedecoy/make-docs@next setup --yes

# Preview changes without writing files
npx @brucewaynedecoy/make-docs@next setup --dry-run

# Reconfigure an existing installation
npx @brucewaynedecoy/make-docs@next setup reconfigure

# Back up a managed installation
npx @brucewaynedecoy/make-docs@next setup backup

# Remove this project's managed make-docs files while preserving unmanaged files
npx @brucewaynedecoy/make-docs@next setup remove

# Manage installable skill packs
npx @brucewaynedecoy/make-docs@next setup skills

# Run deterministic registry operations
npx @brucewaynedecoy/make-docs@next run playbook catalog

# Run the MCP stdio server
npx @brucewaynedecoy/make-docs@next mcp
```

Use the scoped npm package name for package-runner lookup and installation. The executable exposed by that package is `make-docs`; install, maintenance, deterministic operation, and MCP behavior all live in the TypeScript package.

The current npm package ships a read-first MCP stdio surface through `make-docs mcp`. The shipped MCP tools inspect installed state, read manifest/config state, classify compatibility, build dry-run plans, and delegate deterministic operations to the same operation registry and core used by `make-docs run`. Mutation-oriented MCP behavior remains gated by explicit approval or outside the first shipped surface.

## Package Contents

All seven optional first-party Skills are embedded in the compiled `dist/` output. Selecting a first-party Skill needs no network fetch or source checkout. A missing or corrupt embedded payload stops safely; it does not fall back to a remote copy. `preflight`, `software-factory`, and `human-experience` activate only on explicit request. `naive-uat` keeps the Unassisted Goal Testing workflow and CLI interface.

The published npm tarball contains npm metadata and license files, this README, built CLI output under `dist/`, the bundled `template/`, `skill-registry.json`, and `skill-registry.schema.json`. Repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source workspaces, scripts, and scratch planning material are not shipped as tarball-root package contents.

## What Gets Installed

The selected setup manages root and lifecycle instruction routers for `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`. System resources resolve through the installed CLI; local `.make-docs/system/` bodies are optional selected projections.

Project assets are created on demand under `docs/assets/project/` or `docs/assets/<persona>/`. The default audiences are `user` and `maintainer`. Archive and history content lives under `.make-docs/archive/`. Empty asset children are not scaffolded.

Selected Skills use standard agent locations. Project Claude-only installs directly under `.claude/skills/<name>`; Codex-only installs directly under `.agents/skills/<name>`; both use `.agents/skills` plus Claude links or supported native copies. Global scope uses `~/.agents/skills` plus selected harness access. Do not create unselected project Skill roots or an active `.make-docs/agentics` layer. Skills are optional: bare setup and `--selected-skills none` install no Skill files. `--selected-skills all` selects the effective registry. Existing unmanaged copies need the reviewed `setup skills --adopt-existing` path before the CLI may own them.

The global Make Docs Store owns installation, upgrade, backup metadata, migration, and recovery state. `.make-docs/config.yaml` may retain project identity and configuration. Local backup payload copies may live under `.make-docs/backup/`; they do not replace Store records. Required recording failure stops a managed write safely. Ordinary document work can continue without the CLI or optional lifecycle capture.

Clean managed files can update in place. Local edits and unmanaged conflicts remain protected. Review the CLI's conflict and recovery output before an affected apply.

## Capability Profile

The default install includes `designs`, `plans`, `prd`, and `work`. You can opt out of capability families during the interactive wizard or with flags:

```bash
npx @brucewaynedecoy/make-docs@next setup --yes --no-work
npx @brucewaynedecoy/make-docs@next setup --yes --no-prd
npx @brucewaynedecoy/make-docs@next setup --yes --no-plans
npx @brucewaynedecoy/make-docs@next setup --yes --no-designs
```

The capability graph is dependency-aware:

- `designs` is independent
- `plans` is independent
- `prd` requires `plans`
- `work` requires both `plans` and `prd`

If you disable a prerequisite, downstream capabilities stay selected for later but are disabled until the prerequisite is enabled again.

## Requirements

- Node.js 18 or newer
- npm with `npx` / `npm exec`

## Repository

Source, issues, and maintainer documentation live at [github.com/brucewaynedecoy/make-docs](https://github.com/brucewaynedecoy/make-docs).

## License

Apache-2.0
