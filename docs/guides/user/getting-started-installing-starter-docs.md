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

Starter-docs is a drop-in documentation structure that gives your project organized templates, capability directories, AI agent instructions, and optional installable skills out of the box. This guide walks you through every way to install it -- from a single npx command to building from source -- and covers syncing existing installs, reconfiguring selections, previewing changes, and troubleshooting.

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
2. **Harness selection** -- Choose whether to configure Claude Code, Codex, or both. Harness selection determines which router files and skill directories are managed.
3. **Options and skills** -- Choose prompt/template/reference scope, decide whether to install skills, pick project or global skill scope, and select any optional skills.
4. **Confirmation** -- Review your selections before anything is written to disk.

To skip the wizard and accept all defaults:

```bash
npx starter-docs --yes
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
node packages/cli/dist/index.js --target /path/to/your/project
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
npx starter-docs --yes
```

You can combine `--yes` with selection flags to tailor the install in a single command. A few examples:

Install everything except the work capability:

```bash
npx starter-docs --yes --no-work
```

Install without designs or prd:

```bash
npx starter-docs --yes --no-designs --no-prd
```

Install only required templates (skip optional ones):

```bash
npx starter-docs --yes --templates required
```

Install only required references:

```bash
npx starter-docs --yes --references required
```

Install only the Claude Code harness:

```bash
npx starter-docs --yes --no-codex
```

Skip skill installation entirely:

```bash
npx starter-docs --yes --no-skills
```

Enable the optional `decompose-codebase` skill:

```bash
npx starter-docs --yes --optional-skills decompose-codebase
```

Install skills globally instead of in the current project:

```bash
npx starter-docs --yes --skill-scope global
```

Install into a specific directory:

```bash
npx starter-docs --yes --target ./my-project
```

## Previewing Changes

Use `--dry-run` to see exactly what would be written without actually writing anything:

```bash
npx starter-docs --dry-run
```

Dry-run works with any combination of flags:

```bash
npx starter-docs --dry-run --no-work --templates required
```

This is especially useful before an apply/sync run to verify which files will change.

## Syncing an Existing Installation

After you have already installed starter-docs, run the same bare command again to bring your installation in line with the current package version and your saved manifest selections:

```bash
npx starter-docs
```

### How apply/sync works

Apply/sync runs are **non-destructive**. The installer compares each managed file against the version recorded in your manifest:

| Scenario | What happens |
|---|---|
| Managed file unchanged locally | Updated in place to the new version |
| Managed file modified locally | Skipped -- your changes are preserved |
| Unmanaged file conflicts with a new file | Never overwritten; the proposed replacement is staged under `docs/.starter-docs/conflicts/<run-id>/` for you to review |

You can preview a sync before applying it:

```bash
npx starter-docs --dry-run
```

### Targeting a specific directory

```bash
npx starter-docs --target ./my-project
```

### Accepting all sync defaults

```bash
npx starter-docs --yes
```

### Changing your capability selections

If you originally skipped a capability and now want it, run the interactive reconfigure command and enable it in the wizard:

```bash
npx starter-docs reconfigure
```

If you want a non-interactive selection change, combine `reconfigure --yes` with at least one selection flag:

```bash
npx starter-docs reconfigure --yes --no-designs
```

You can also change harness or skill settings during reconfigure:

```bash
npx starter-docs reconfigure --yes --no-codex --skill-scope global --optional-skills decompose-codebase
```

## What Gets Installed

After a default installation, your project will contain the following structure:

```
your-project/
  AGENTS.md                         # Root agent instruction router
  CLAUDE.md                         # Root Claude instruction router
  .agents/
    skills/
      archive-docs/
        SKILL.md
  .claude/
    skills/
      archive-docs/
        SKILL.md
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

Skill installation depends on your selections:

- `archive-docs` is installed automatically whenever skills are enabled.
- `decompose-codebase` is installed only if you select it.
- Project scope installs skills under the current repo (`.claude/skills/`, `.agents/skills/`).
- Global scope installs skills under your home directory (`~/.claude/skills/`, `~/.agents/skills/`).

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
| `starter-docs` | Install into a new target, or sync an existing install using saved manifest selections |
| `starter-docs reconfigure` | Change saved selections for an existing install |
| `starter-docs backup` | Back up managed files |
| `starter-docs uninstall` | Remove managed files, with optional backup first |

### Flags

| Flag | Applies To | Description |
|---|---|---|
| `--target <dir>` | `starter-docs`, `reconfigure`, `backup`, `uninstall` | Set the target project directory (defaults to current directory) |
| `--dry-run` | `starter-docs`, `reconfigure` | Preview changes without writing any files |
| `--yes` | `starter-docs`, `reconfigure`, `backup`, `uninstall` | Skip prompts where safe; `reconfigure --yes` requires at least one selection flag |
| `--backup` | `uninstall` | Create a backup before removing managed files |
| `--no-designs` | `starter-docs`, `reconfigure` | Exclude the designs capability |
| `--no-plans` | `starter-docs`, `reconfigure` | Exclude the plans capability (also excludes prd and work) |
| `--no-prd` | `starter-docs`, `reconfigure` | Exclude the prd capability (also excludes work) |
| `--no-work` | `starter-docs`, `reconfigure` | Exclude the work capability |
| `--no-prompts` | `starter-docs`, `reconfigure` | Skip installing prompt starters |
| `--templates required\|all` | `starter-docs`, `reconfigure` | Install only required templates or the full set |
| `--references required\|all` | `starter-docs`, `reconfigure` | Install only required references or the full set |
| `--no-claude-code` | `starter-docs`, `reconfigure` | Skip the Claude Code harness (deprecated alias: `--no-claude`) |
| `--no-codex` | `starter-docs`, `reconfigure` | Skip the Codex harness (deprecated alias: `--no-agents`) |
| `--no-skills` | `starter-docs`, `reconfigure` | Skip skill installation |
| `--skill-scope project\|global` | `starter-docs`, `reconfigure` | Install skills in the project or in your home directory |
| `--optional-skills <csv\|none>` | `starter-docs`, `reconfigure` | Replace the selected optional skills; use `none` to clear them |

## Troubleshooting

### "No starter-docs manifest found"

This means you are running `reconfigure`, `backup`, or `uninstall` in a directory that does not have an existing starter-docs installation. Run the bare installer first:

```bash
npx starter-docs
```

### Conflict files appearing in `.starter-docs/conflicts/`

During apply/sync, if a file that starter-docs wants to create already exists but is not tracked in the manifest, the proposed file is staged under `docs/.starter-docs/conflicts/<run-id>/` instead of overwriting yours. To resolve:

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
