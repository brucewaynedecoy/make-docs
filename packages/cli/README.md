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

The published npm tarball contains npm metadata and license files, this README, built CLI output under `dist/`, the bundled `template/`, `skill-registry.json`, and `skill-registry.schema.json`. Repo-root `docs/`, root `AGENTS.md`, root `CLAUDE.md`, source workspaces, scripts, and scratch planning material are not shipped as tarball-root package contents.

## What Gets Installed

The default profile can create or manage:

- `docs/designs/` for architectural decisions and design rationale
- `docs/plans/` for approach and strategy documents
- `docs/prd/` for product requirement documents
- `docs/work/` for implementation backlogs and task lists
- `docs/assets/archive/`, `docs/assets/artifacts/`, `docs/assets/library/`, and `docs/assets/playbooks/` for people-and-agent-managed project documentation assets
- `.make-docs/contracts/system/`, `.make-docs/references/system/`, `.make-docs/templates/system/`, and `.make-docs/scripts/` for make-docs system resources
- root and per-directory `AGENTS.md` / `CLAUDE.md` instruction routers
- `.make-docs/manifest.json` runtime state for future sync, backup, and uninstall operations
- `.make-docs/conflicts/<run-id>/` review output when existing local files must not be overwritten

History records are created on demand under `docs/assets/archive/history/` by the documentation lifecycle. A blank install does not need preexisting history files.

The installer is intentionally conservative:

- unchanged managed files are updated in place
- locally modified managed files are skipped
- unmanaged conflicting files are not overwritten
- proposed replacements are staged under `.make-docs/conflicts/<run-id>/`

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
