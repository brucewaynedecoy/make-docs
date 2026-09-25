# Make Docs

Make Docs helps teams plan, build, and keep project documentation current with AI agents. It provides routes for designs, plans, product requirements (PRDs), and work backlogs. Its TypeScript CLI and MCP server use the same set of operations and system resources. Project knowledge stays in the repository. A global Make Docs Store keeps managed install and recovery records.

> **Source and release status (2026-09-24):** This checkout declares version `2.0.2`. The public npm `next` and `latest` tags still point to `1.0.0-rc.1`. The features and commands below describe this checkout. Check `npm view @brucewaynedecoy/make-docs dist-tags --json` before using a public package for them.

## Quick Start from This Checkout

Managed setup needs Node.js 22.5 or newer with built-in SQLite, npm, and a target project directory. From this repository's root, replace `../your-project` with an existing project path:

```bash
npm install
npm run build -w packages/cli
node packages/cli/dist/index.js setup --target ../your-project --dry-run
node packages/cli/dist/index.js setup --target ../your-project
```

The dry run shows the proposed changes. The next command opens guided setup. Setup reviews changes to **this computer** and **this project** in separate groups when both have changes. It asks for approval before it applies each group.

A fresh setup selects all four document areas and project instructions for Codex and Claude Code. It installs no Skills unless you select them. System resource files can stay in the installed CLI; local copies are optional. You can select `none` for machine-level agent access and still use project instructions and resource reads.

Run bare `make-docs` to start guided setup in a project with no install. In an installed project, bare `make-docs` shows status and help. It does not sync files. Use `make-docs setup` to sync saved selections, `make-docs setup reconfigure` to change them, and `make-docs setup --dry-run` to preview a sync.

The public npm package currently provides the older release candidate. Use [Building and Installing the CLI Locally](docs/assets/maintainer/cli-development-local-build-and-install.md) to test this source checkout. Use [Installing Make Docs](docs/assets/user/getting-started-installing-make-docs.md) for the full setup choices and review steps.

## How Work Moves

The usual planning path is **design → plan → PRD → work backlog**. A team can start from a design, an existing codebase, or an active PRD set. An agent can create a full PRD set for a new product or update the owning PRDs and make a smaller backlog for a change. Implementation, review, release, and archive work then follow the approved backlog.

| Directory | Purpose | Common name |
| --- | --- | --- |
| `docs/designs/` | Record a decision and its reasons. | `YYYY-MM-DD-<slug>.md` |
| `docs/plans/` | Explain the approach before execution. | `YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| `docs/prd/` | Describe the current product. | `NN-<slug>.md` |
| `docs/work/` | Record what to do and in what order. | `YYYY-MM-DD-w{W}-r{R}-<slug>/` |

A new PRD set starts with `00-index.md`, `01-product-overview.md`, `02-architecture-overview.md`, `03-open-questions-and-risk-register.md`, and `04-glossary.md`. Add subsystem PRDs as needed. See [How Make Docs Stages Fit Together](docs/assets/user/workflows-how-make-docs-stages-fit-together.md) and [Understanding W/R/P Coordinates](docs/assets/user/concepts-wave-revision-phase-coordinates.md).

## What Setup Creates

Setup writes only the selected project files. The default profile enables `designs`, `plans`, `prd`, and `work`. The profile keeps dependencies in order: `prd` needs `plans`; `work` needs both `plans` and `prd`.

```text
.make-docs/
  config.yaml          # Project identity and portable settings
  system/              # Agent routes and optional local resource files
  archive/             # Project archives and history, created when needed
docs/
  designs/             # Design decisions
  plans/               # Plans
  prd/                 # Current product requirements
  work/                # Work backlogs
  assets/              # Shared and audience assets, created when needed
AGENTS.md              # Root Codex instructions when selected
CLAUDE.md              # Root Claude Code instructions when selected
```

The configured agent tools get short instruction files at the project root and in relevant directories. `docs/assets/` and archive folders are created only when needed. Built-in `user` and `maintainer` Personas describe the intended audience; `.make-docs/config.yaml` can set display fields and add custom Personas.

The global Make Docs Store records installed selections, file ownership, applied hashes, operation progress, and recovery state. It lives outside the project. The CLI does not create a current project-local manifest or state folder. Managed setup stops if it cannot record the required Store state. Ordinary document work can continue without the CLI or optional state capture.

Setup preserves local edits and unmanaged files. It asks for review when a managed file has changed or a path conflicts. Backup and conflict copies keep content local; the Store keeps their operation records.

## CLI and MCP

The CLI has seven top-level commands. Run `make-docs <command> --help` for exact options.

| Command | Main use |
| --- | --- |
| `setup` | Install, sync, reconfigure, manage Skills, back up, or remove project assets. `setup system` reviews machine-level agent access. |
| `project` | Inspect and manage project surfaces and settings. |
| `resource` | List, read, or ensure system resources. |
| `run` | Run admitted project and workflow operations. |
| `mcp` | Start the MCP server for agent tools. |
| `update` | Update the installed tool. |
| `uninstall` | Remove the machine-level tool footprint. |

The MCP server gives agents tools and resource reads from the same operation core as the CLI. System resources use stable `make-docs://system/<type>/<path>` names for contracts, prompts, references, and templates. MCP writes require an explicit write setting. Dry runs and named approvals follow the same rules as CLI operations.

## Optional Skills

The CLI package embeds these eight first-party Skills. A fresh setup selects none. Use `make-docs setup skills` to select or manage them.

| Skill | Use |
| --- | --- |
| `archive-docs` | Archive completed project documents. |
| `backlog-review` | Review the work backlog and explain current focus and attention. |
| `cleanup-docs` | Clean up project documentation. |
| `decompose-codebase` | Map an existing codebase into PRDs and a rebuild backlog. |
| `factory` | Coordinate implementation and review when requested. |
| `human-experience` | Review a human-facing result when requested. |
| `naive-uat` | Guide Unassisted Goal Testing. |
| `preflight` | Review readiness before execution when requested. |

Project Skills use standard Codex or Claude Code Skill paths for the selected tools. Global Skills use a shared home location with selected tool access. The built-in Skill files come from the CLI package, so installing one does not need a separate source download. See [Installing and Managing Skills](docs/assets/user/skills-installing-and-managing-skills.md).

## System Resources and Customization

`packages/docs/template/` is the upstream source for shipped system resources. The CLI serves their bytes even when it has not copied resource files into a project. Use `make-docs resource list` and `make-docs resource read <uri>` to find and read them.

A project can select local system-resource copies under `.make-docs/system/{contracts,prompts,references,templates}/`. Edit a project-owned local override only when the project needs different rules or text. Use `docs/assets/project/` for shared project knowledge and `docs/assets/<persona>/` for audience material. Use `make-docs setup reconfigure` when you change which document areas or resources the CLI manages.

Changes to Make Docs defaults belong upstream in `packages/docs/template/`. This repository is also a consumer of that template, so maintainers then apply the upstream changes to its root `.make-docs/` and `docs/` instance. See [Dogfood and Maintainer Operations](docs/assets/maintainer/maintainer-dogfood-and-maintainer-operations.md).

## Guides

- Start and manage an install: [Installing Make Docs](docs/assets/user/getting-started-installing-make-docs.md) and [Managing Installations](docs/assets/user/cli-lifecycle-managing-installations.md).
- Choose a work path: [How Stages Fit Together](docs/assets/user/workflows-how-make-docs-stages-fit-together.md) and [Choosing the Right Route](docs/assets/user/workflows-choosing-the-right-route-for-your-project.md).
- Use Skills: [Installing and Managing Skills](docs/assets/user/skills-installing-and-managing-skills.md) and [Decomposing an Existing Codebase](docs/assets/user/skills-decomposing-an-existing-codebase.md).
- Maintain the package: [Template Assets and Generated Routers](docs/assets/maintainer/template-assets-and-generated-routers.md), [Building the CLI Locally](docs/assets/maintainer/cli-development-local-build-and-install.md), and [Packaging and Release](docs/assets/maintainer/release-packaging-validation-and-release-reference.md).

## Repository Layout and Contributing

This repository uses npm workspaces:

```text
packages/
  cli/           # Publishable TypeScript CLI and MCP server
  docs/template/ # Upstream project template and system resources
  skills/        # Upstream first-party Skill files
docs/            # This repository's project documents and dogfood instance
scripts/         # Packaging, sync, and validation scripts
```

The CLI build uses `packages/docs/template/`. Package preparation copies that template into the CLI tarball and embeds declared first-party Skill files in the built CLI. The tarball does not include the repository root's dogfood docs, root agent instructions, or source packages.

Common maintainer checks from the repository root:

```bash
npm install
npm run build -w packages/cli
npm test -w packages/cli
npm run validate:defaults -w packages/cli
npm run smoke:pack
bash scripts/check-instruction-routers.sh
```

Read [Packaging, Validation, and Release Reference](docs/assets/maintainer/release-packaging-validation-and-release-reference.md) before release work. The instruction-router check keeps paired `AGENTS.md` and `CLAUDE.md` files aligned.

## License

Apache-2.0
