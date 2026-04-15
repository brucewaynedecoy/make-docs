# @starter-docs/template

The shippable documentation template for `starter-docs`. Consumers receive this tree in their project root (via the `starter-docs` CLI or a manual copy); every file here ends up on a consumer's machine.

## Package Layout

```
packages/docs/
├── package.json       # this package's metadata (private)
├── README.md          # you are here
└── template/          # the tree that ships to consumers
    ├── AGENTS.md      # consumer's ./AGENTS.md (root agent instructions)
    ├── CLAUDE.md      # consumer's ./CLAUDE.md (mirror)
    └── docs/          # consumer's ./docs/
        ├── AGENTS.md + CLAUDE.md     # docs router
        ├── .archive/                 # consolidated archive (v2)
        ├── .prompts/                 # reusable prompt starters
        ├── .references/              # authoritative rules and workflows
        ├── .templates/               # structural starters for generated docs
        ├── designs/                  # architectural decisions (ADRs)
        ├── guides/                   # user, developer, and agent session guides
        ├── plans/                    # approach + rationale (always directories in v2)
        ├── prd/                      # product requirements
        └── work/                     # work backlogs (always directories in v2)
```

## How Consumers Receive This

The CLI at `packages/cli/` bundles this template at publish time:

1. `prepack` runs `scripts/copy-template-to-cli.mjs`, which copies `packages/docs/template/` into `packages/cli/template/`.
2. `npm publish` ships `packages/cli/` including the bundled `template/`.
3. On the consumer's machine, `npx starter-docs init` copies the template into the consumer's project root.

In dev, the CLI reads directly from `packages/docs/template/` via a sibling-first resolver in `packages/cli/src/utils.ts`. Edit this package's `template/` directly; no manual sync is needed.

## Key Conventions

Consumers should start at `template/docs/AGENTS.md` (or `CLAUDE.md`) and read per-directory routers as they go. For the authoritative rules and output contract, see the `template/docs/.references/` files — especially:

- `wave-model.md` — Wave/Revision/Phase (W/R/P) encoding authority
- `output-contract.md` — required paths, section contracts, lifecycle rules
- `design-contract.md`, `planning-workflow.md`, `execution-workflow.md` — per-artifact authority
- `agent-guide-contract.md` — agent session summary contract

## Editing the Template

Edit files under `template/` directly — this package is the source of truth. Run the full validation chain from the repo root after changes:

```bash
just test                          # CLI tests
just check-instruction-routers     # AGENTS.md/CLAUDE.md pair integrity + line budgets
just smoke-pack                    # end-to-end pack + install
```

Every `AGENTS.md` under `template/docs/` has a byte-identical `CLAUDE.md` sibling. Keep both in sync; the router check enforces it.

## Publishing

This package is currently `private: true`. It is not published to npm standalone — consumers get the template through the `starter-docs` CLI. If we decide to publish it independently later, see `starter-docs-v2-publish.md` at the repo root.
