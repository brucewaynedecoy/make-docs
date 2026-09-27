# Make Docs

Make Docs helps teams plan, build, and keep project documentation current with AI agents. It provides a CLI, an MCP server, document templates, system resources, and optional agent Skills. Project knowledge stays in the project repository.

## Quick Start

Managed setup needs Node.js 22.5 or newer with built-in SQLite, npm, and a project directory. Run these commands from the project directory:

```bash
npx @brucewaynedecoy/make-docs@latest setup --dry-run
npx @brucewaynedecoy/make-docs@latest setup
```

The first command previews the changes. The second opens guided setup. Setup shows computer and project changes in separate groups and asks for approval before it applies each group. A fresh setup selects designs, plans, product requirements (PRDs), and work backlogs. It selects no optional Skills unless you choose them.

You can also run `npx @brucewaynedecoy/make-docs@latest` without a command. In a project with no Make Docs install, it starts guided setup. In a project with an install, it shows status and help without changing files. Run `setup` to sync saved choices.

## Main Commands

Run `npx @brucewaynedecoy/make-docs@latest <command> --help` for options.

| Command | Use |
| --- | --- |
| `setup` | Install, sync, reconfigure, manage Skills, back up, or remove project assets. |
| `project` | Inspect and manage project settings and surfaces. |
| `resource` | List, read, or ensure system resources. |
| `run` | Run available project and workflow operations. |
| `mcp` | Start the MCP server for agent tools. |
| `update` | Update a persistent tool install. |
| `uninstall` | Remove the machine-level tool install. |

The npm package exposes the `make-docs` executable. If you install it globally, you can use `make-docs` in place of the `npx` command. The MCP server and CLI use the same operation core. MCP writes require an explicit write setting and follow the CLI's dry-run and approval rules.

## What Setup Adds

Setup creates instruction routes and document areas under `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`. It creates project or audience assets only when needed. The installed CLI can serve system resources without copying them into the project; local copies are optional.

The global Make Docs Store holds managed install and recovery records. The project can keep its identity and choices in `.make-docs/config.yaml`. Managed writes stop if the Store cannot record them. Ordinary document work can continue without the CLI or Store.

## Optional Skills

The package includes eight first-party Skills: `archive-docs`, `backlog-review`, `cleanup-docs`, `decompose-codebase`, `factory`, `human-experience`, `naive-uat`, and `preflight`. A fresh setup installs none of them. Use `make-docs setup skills` to select or manage Skills. The built-in Skills need no separate source download.

## Package Contents

The npm package contains this README, the license, the built CLI in `dist/`, the documentation template, and the Skill registry files. Repository plans, work records, source workspaces, and local project assets are not part of the published package.

## More Help

- [Installing Make Docs](https://github.com/brucewaynedecoy/make-docs/blob/main/docs/assets/user/getting-started-installing-make-docs.md)
- [Managing Installations](https://github.com/brucewaynedecoy/make-docs/blob/main/docs/assets/user/cli-lifecycle-managing-installations.md)
- [Installing and Managing Skills](https://github.com/brucewaynedecoy/make-docs/blob/main/docs/assets/user/skills-installing-and-managing-skills.md)
- [Source code and issues](https://github.com/brucewaynedecoy/make-docs)

## License

MIT
