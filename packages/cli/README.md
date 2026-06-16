# Make Docs

Install a structured documentation system into any project with a single CLI command. `make-docs` creates a documentation tree for PRDs, plans, design records, work backlogs, reusable templates, prompt starters, and AI agent instruction routers.

## Quick Start

From the root of the project you want to equip:

```bash
npx @brucewaynedecoy/make-docs@next
```

For a non-interactive install with the default profile:

```bash
npx @brucewaynedecoy/make-docs@next --yes
```

The installer writes a profile-aware documentation system and records managed files in `.make-docs/manifest.json` so later runs can update generated files without overwriting local edits.

## Common Commands

```bash
# Install the default documentation system
npx @brucewaynedecoy/make-docs@next --yes

# Preview changes without writing files
npx @brucewaynedecoy/make-docs@next --dry-run

# Reconfigure an existing installation
npx @brucewaynedecoy/make-docs@next reconfigure

# Back up a managed installation
npx @brucewaynedecoy/make-docs@next backup

# Remove managed make-docs files while preserving unmanaged files
npx @brucewaynedecoy/make-docs@next uninstall

# Manage installable skill packs
npx @brucewaynedecoy/make-docs@next skills
```

## What Gets Installed

The default profile can create:

- `docs/designs/` for architectural decisions and design rationale
- `docs/plans/` for approach and strategy documents
- `docs/prd/` for product requirement documents
- `docs/work/` for implementation backlogs and task lists
- `docs/assets/` for prompts, templates, references, archive records, and history records
- root and per-directory `AGENTS.md` / `CLAUDE.md` instruction routers
- `.make-docs/manifest.json` runtime state for future sync, backup, and uninstall operations

The installer is intentionally conservative:

- unchanged managed files are updated in place
- locally modified managed files are skipped
- unmanaged conflicting files are not overwritten
- proposed replacements are staged under `.make-docs/conflicts/<run-id>/`

## Capability Profile

The default install includes `designs`, `plans`, `prd`, and `work`. You can opt out of capability families during the interactive wizard or with flags:

```bash
npx @brucewaynedecoy/make-docs@next --yes --no-work
npx @brucewaynedecoy/make-docs@next --yes --no-prd
npx @brucewaynedecoy/make-docs@next --yes --no-plans
npx @brucewaynedecoy/make-docs@next --yes --no-designs
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
