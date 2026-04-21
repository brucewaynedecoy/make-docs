# @make-docs/template

The shippable documentation template for `make-docs`. Consumers receive this tree in their project root (via the `make-docs` CLI or a manual copy); every file here ends up on a consumer's machine.

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
        ├── .assets/                  # operational assets
        │   ├── history/              # session history records
        │   └── config/            # CLI manifest and conflict staging
        ├── designs/                  # architectural decisions (ADRs)
        ├── guides/                   # user and developer guides
        ├── plans/                    # approach + rationale (always directories in v2)
        ├── prd/                      # product requirements
        └── work/                     # work backlogs (always directories in v2)
```

## How Consumers Receive This

The CLI at `packages/cli/` bundles this template at publish time:

1. `prepack` runs `scripts/copy-template-to-cli.mjs`, which copies `packages/docs/template/` into `packages/cli/template/`.
2. `npm publish` ships `packages/cli/` including the bundled `template/`.
3. On the consumer's machine, `npx make-docs` copies the template into the consumer's project root on first install.

In dev, the CLI reads directly from `packages/docs/template/` via a sibling-first resolver in `packages/cli/src/utils.ts`. Edit this package's `template/` directly; no manual sync is needed.

## Key Conventions

Consumers should start at `template/docs/AGENTS.md` (or `CLAUDE.md`) and read per-directory routers as they go. For the authoritative rules and output contract, see the `template/docs/.references/` files — especially:

- `wave-model.md` — Wave/Revision/Phase (W/R/P) encoding authority
- `output-contract.md` — required paths, section contracts, lifecycle rules
- `design-contract.md`, `planning-workflow.md`, `execution-workflow.md` — per-artifact authority
- `history-record-contract.md` — session history record contract for `docs/.assets/history/`

## Editing the Template

Edit files under `template/` directly — this package is the source of truth. Run the full validation chain from the repo root after changes:

```bash
just test                          # CLI tests
just check-instruction-routers     # AGENTS.md/CLAUDE.md pair integrity + line budgets
just smoke-pack                    # end-to-end pack + install
```

Every `AGENTS.md` under `template/docs/` has a byte-identical `CLAUDE.md` sibling. Keep both in sync; the router check enforces it.

## Dogfooding and Re-seeding

This project uses its own template to manage its internal documentation. The repo-root `docs/` directory is a **dogfood instance** of `packages/docs/template/` — it uses the same conventions, contracts, routers, and templates that consumers receive.

When you edit files in the template package, the repo-root `docs/` may become stale. **Re-seeding** is the process of copying updated template files back into `docs/` so the dogfood surface stays in sync.

### What gets re-seeded

Only template-owned files are re-seeded — never project-specific content:

- **Router files** — `AGENTS.md` / `CLAUDE.md` in `docs/`, `docs/guides/`, `docs/.assets/`, `docs/.assets/history/`, `docs/.assets/config/`, `docs/.templates/`, `docs/.prompts/`, `docs/.references/`, `docs/.archive/`, and capability directories
- **Reference files** — `docs/.references/*.md` (contracts, workflows, wave model)
- **Template files** — `docs/.templates/*.md` (structural starters)

Project-specific content in `docs/` (designs, plans, work backlogs, guides, PRDs) is **never overwritten** by re-seeding — those are authored artifacts, not template deliverables.

### When to re-seed

Re-seed after any change to template-owned files:

- Adding or updating a reference file (e.g., `guide-contract.md`)
- Adding or updating a template file (e.g., `guide-developer.md`)
- Changing router content (e.g., updating `docs/guides/AGENTS.md` to reference a new contract)

### How to re-seed

Copy the changed files from `packages/docs/template/` to `docs/`:

```bash
# Example: re-seed a new reference and updated routers
cp packages/docs/template/docs/.references/guide-contract.md docs/.references/guide-contract.md
cp packages/docs/template/docs/guides/AGENTS.md docs/guides/AGENTS.md
cp packages/docs/template/docs/guides/CLAUDE.md docs/guides/CLAUDE.md
```

Verify the copies match:

```bash
diff packages/docs/template/docs/.references/guide-contract.md docs/.references/guide-contract.md
```

There is no automated re-seed script — it is intentionally manual so contributors review what they are propagating. If the set of changed files is large, a bulk copy with verification works:

```bash
# Bulk re-seed all routers and references (use with care)
for f in $(find packages/docs/template/docs -name 'AGENTS.md' -o -name 'CLAUDE.md'); do
  target="docs/${f#packages/docs/template/docs/}"
  cp "$f" "$target"
done
cp packages/docs/template/docs/.references/*.md docs/.references/
cp packages/docs/template/docs/.templates/*.md docs/.templates/
```

### Why not automate it?

The re-seed is manual because:

1. **Reviewability** — contributors should see exactly which dogfood files change and confirm the propagation is correct before committing.
2. **Selective updates** — sometimes only a subset of template changes should propagate (e.g., a router wording tweak vs. a structural contract change).
3. **Conflict awareness** — if a dogfood router was temporarily customized beyond the template, a manual copy surfaces that divergence rather than silently overwriting it.

## Publishing

This package is currently `private: true`. It is not published to npm standalone — consumers get the template through the `make-docs` CLI. If we decide to publish it independently later, see `make-docs-v2-publish.md` at the repo root.
