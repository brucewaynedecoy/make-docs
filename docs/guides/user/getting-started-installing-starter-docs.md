---
title: Installing Starter Docs
path: getting-started
status: draft
order: 10
tags:
  - installation
  - setup
  - npx
applies-to:
  - cli
  - template
---

# Installing Starter Docs

Starter-docs is a drop-in documentation structure that gives your project organized templates, capability directories, and AI agent instructions out of the box. This guide walks you through every way to install it -- from a single npx command to building from source -- and covers updating, previewing changes, and troubleshooting.

## Prerequisites

| Requirement | Minimum Version | Needed For |
|---|---|---|
| Node.js | 18 or later | All install methods |
| npm | Bundled with Node.js | npx and CLI commands |
| git | Any recent version | Source-based installs only |

## Installing via npx (Recommended)

> **Note:** This method requires the `starter-docs` package to be published to npm. As of this writing, the package has not yet been published. See [Installing from Source](#installing-from-source) for methods that work today.

From your project root, run:

```bash
npx starter-docs
```

This launches an interactive wizard that walks you through setup:

1. **Capability selection** -- All four capabilities (designs, plans, prd, work) are selected by default. The wizard lets you opt *out* of any you don't need.
2. **Template and reference scope** -- Choose whether to install only the required templates and references or the full set.
3. **Agent instructions** -- AGENTS.md and CLAUDE.md router files are included by default; you can skip them if you prefer.
4. **Confirmation** -- Review your selections before anything is written to disk.

To skip the wizard and accept all defaults:

```bash
npx starter-docs init --yes
```

## Installing from Source

These methods work right now, before the npm package is published.

### Clone, build, and run

Clone the repository, build the CLI, run the installer against your project, then clean up:

```bash
git clone https://github.com/<owner>/starter-docs.git /tmp/starter-docs
cd /tmp/starter-docs
npm install
npm run build
node packages/cli/dist/index.js init --target /path/to/your/project
rm -rf /tmp/starter-docs
```

Replace `/path/to/your/project` with the absolute path to the project where you want docs installed.

### Manual rsync from the template directory

This copies the template files directly without running the CLI. You get the full default set of files but skip the interactive wizard:

```bash
tmp_dir="$(mktemp -d)"
git clone --depth 1 https://github.com/<owner>/starter-docs.git "$tmp_dir"
template="$tmp_dir/packages/docs/template"
mkdir -p ./docs
rsync -av "$template/docs/" ./docs/
rsync -av "$template/AGENTS.md" "$template/CLAUDE.md" ./
rm -rf "$tmp_dir"
```

Run this from your project root.

### Using degit

degit downloads the repository without its git history, which is faster for a one-time copy:

```bash
npx degit <owner>/starter-docs ./tmp-starter-docs
template=./tmp-starter-docs/packages/docs/template
mkdir -p ./docs
rsync -av "$template/docs/" ./docs/
rsync -av "$template/AGENTS.md" "$template/CLAUDE.md" ./
rm -rf ./tmp-starter-docs
```

Run this from your project root.

> **About the `<owner>` placeholder:** Replace `<owner>` in all GitHub URLs above with the GitHub username or organization that hosts the repository once it is public.

## Non-Interactive Installation

Pass `--yes` to accept every default without prompts:

```bash
npx starter-docs init --yes
```

You can combine `--yes` with selection flags to tailor the install in a single command. A few examples:

Install everything except the work capability:

```bash
npx starter-docs init --yes --no-work
```

Install without designs or prd:

```bash
npx starter-docs init --yes --no-designs --no-prd
```

Install only required templates (skip optional ones):

```bash
npx starter-docs init --yes --templates required
```

Install only required references:

```bash
npx starter-docs init --yes --references required
```

Skip agent instruction files:

```bash
npx starter-docs init --yes --no-agents --no-claude
```

Install into a specific directory:

```bash
npx starter-docs init --yes --target ./my-project
```

## Previewing Changes

Use `--dry-run` to see exactly what would be written without actually writing anything:

```bash
npx starter-docs init --dry-run
```

Dry-run works with any combination of flags:

```bash
npx starter-docs init --dry-run --no-work --templates required
```

This is especially useful before an update to verify which files will change.

## Updating an Existing Installation

After you have already run `init`, use `update` to bring your installation in line with a newer version of starter-docs:

```bash
npx starter-docs update
```

### How updates work

Updates are **non-destructive**. The updater compares each managed file against the version recorded in your manifest:

| Scenario | What happens |
|---|---|
| Managed file unchanged locally | Updated in place to the new version |
| Managed file modified locally | Skipped -- your changes are preserved |
| Unmanaged file conflicts with a new file | Never overwritten; the proposed replacement is staged under `docs/.starter-docs/conflicts/<run-id>/` for you to review |

You can preview an update before applying it:

```bash
npx starter-docs update --dry-run
```

### Targeting a specific directory

```bash
npx starter-docs update --target ./my-project
```

### Accepting all update defaults

```bash
npx starter-docs update --yes
```

### Changing your capability selections

If you originally skipped a capability and now want it (or vice versa), use `--reconfigure` with the appropriate selection flags:

```bash
npx starter-docs update --reconfigure --no-designs
```

## What Gets Installed

After a default installation, your project will contain the following structure:

```
your-project/
  AGENTS.md                         # Root agent instruction router
  CLAUDE.md                         # Root Claude instruction router
  docs/
    AGENTS.md                       # Docs-level agent router
    CLAUDE.md                       # Docs-level Claude router
    .references/                    # Reference documents for workflows and contracts
    .templates/                     # Document templates for designs, plans, PRDs, work items
    .prompts/                       # Optional prompt starters for AI-assisted workflows
    .starter-docs/
      manifest.json                 # Tracks every managed file, its hash, and version
    designs/                        # Design documents
      AGENTS.md
    plans/                          # Planning documents
      AGENTS.md
    prd/                            # Product requirements documents
      AGENTS.md
    work/                           # Work items (tasks, stories)
      AGENTS.md
```

**Manifest:** The file at `docs/.starter-docs/manifest.json` is how starter-docs tracks which files it manages. Do not delete this file -- it is required for updates and reconfiguration.

## Capability Reference

| Capability | Description | Dependencies |
|---|---|---|
| `designs` | Architecture and design documents for your project. | None |
| `plans` | High-level plans that guide implementation. | None |
| `prd` | Product requirements documents that formalize what to build. | Requires `plans` |
| `work` | Granular work items (tasks, stories) derived from PRDs. | Requires `plans` and `prd` |

All four capabilities are selected by default. You opt **out** of the ones you do not need using `--no-<capability>` flags.

Because `prd` depends on `plans`, opting out of `plans` will also remove `prd`. Similarly, because `work` depends on both `plans` and `prd`, opting out of either will also remove `work`.

## Command Reference

| Command | Description |
|---|---|
| `starter-docs` | Alias for `starter-docs init` -- launches the interactive wizard |
| `starter-docs init` | Install starter-docs into a project |
| `starter-docs update` | Update an existing installation to the latest version |
| `starter-docs update --reconfigure` | Change capability selections during an update |

### Flags

| Flag | Applies To | Description |
|---|---|---|
| `--target <dir>` | `init`, `update` | Set the target project directory (defaults to current directory) |
| `--dry-run` | `init`, `update` | Preview changes without writing any files |
| `--yes` | `init`, `update` | Accept all defaults without prompts |
| `--no-designs` | `init`, `reconfigure` | Exclude the designs capability |
| `--no-plans` | `init`, `reconfigure` | Exclude the plans capability (also excludes prd and work) |
| `--no-prd` | `init`, `reconfigure` | Exclude the prd capability (also excludes work) |
| `--no-work` | `init`, `reconfigure` | Exclude the work capability |
| `--no-prompts` | `init` | Skip installing prompt starters |
| `--templates required\|all` | `init` | Install only required templates or the full set |
| `--references required\|all` | `init` | Install only required references or the full set |
| `--no-agents` | `init` | Skip installing AGENTS.md router files |
| `--no-claude` | `init` | Skip installing CLAUDE.md router files |

## Troubleshooting

### "No starter-docs manifest found"

This means you are running `update` in a directory that does not have an existing starter-docs installation. Run `init` first:

```bash
npx starter-docs init
```

### Conflict files appearing in `.starter-docs/conflicts/`

During an update, if a file that starter-docs wants to create already exists but is not tracked in the manifest, the proposed file is staged under `docs/.starter-docs/conflicts/<run-id>/` instead of overwriting yours. To resolve:

1. Compare the staged file with your existing file.
2. Merge the changes you want to keep.
3. Delete the conflict directory once resolved.

### Permission errors when writing files

Make sure you have write access to the target directory. If you are installing into a directory owned by another user or protected by system permissions, you may need to adjust ownership or run with appropriate privileges.

### Node.js version too old

starter-docs requires Node.js 18 or later. Check your version:

```bash
node --version
```

If the reported version is below 18, update Node.js before retrying.

### The `npx starter-docs` command is not found

The npm package has not been published yet. Use one of the [source-based install methods](#installing-from-source) until the package is available on npm.
