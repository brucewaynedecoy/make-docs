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
    ├── .make-docs/    # system machinery: contracts, references, scripts, templates
    └── docs/          # consumer's ./docs/
        ├── AGENTS.md + CLAUDE.md     # docs router
        ├── assets/                   # managed project document assets
        │   ├── archive/              # consolidated archive (v2)
        │   ├── artifacts/            # optional pre-design input material
        │   ├── library/              # persona-based guide documentation
        │   ├── playbooks/            # persona-based procedural docs
        ├── designs/                  # architectural decisions (ADRs)
        ├── plans/                    # approach + rationale (always directories in v2)
        ├── prd/                      # product requirements
        └── work/                     # work backlogs (always directories in v2)
```

## How Consumers Receive This

The CLI at `packages/cli/` bundles this template at publish time:

1. `prepack` runs `scripts/copy-template-to-cli.mjs`, which copies `packages/docs/template/` into `packages/cli/template/`.
2. `npm publish` ships `packages/cli/` including the bundled `template/`.
3. On the consumer's machine, `npx @brucewaynedecoy/make-docs@next` copies the template into the consumer's project root on first install.

In dev, the CLI reads directly from `packages/docs/template/` via a sibling-first resolver in `packages/cli/src/utils.ts`. Edit this package's `template/` directly; no manual sync is needed.

## Key Conventions

Consumers should start at `template/docs/AGENTS.md` (or `CLAUDE.md`) and read per-directory routers as they go. For the authoritative rules and output contract, see the `template/.make-docs/` system files — especially:

- `wave-model.md` — Wave/Revision/Phase (W/R/P) encoding authority
- `output-contract.md` — required paths, section contracts, lifecycle rules
- `design-contract.md`, `planning-workflow.md`, `execution-workflow.md` — per-artifact authority
- `history-record-contract.md` — session history record contract for `docs/assets/archive/history/`

CLI runtime state is intentionally not part of this template package. The installer creates root `.make-docs/manifest.json` and `.make-docs/conflicts/` in the target project when needed.

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

- **Router files** — `AGENTS.md` / `CLAUDE.md` in `docs/`, `docs/assets/`, `docs/assets/archive/`, `docs/assets/artifacts/`, `docs/assets/library/`, `docs/assets/playbooks/`, and capability directories
- **System reference files** — `.make-docs/system/contracts/*.md` and `.make-docs/system/references/*.md` (contracts, workflows, wave model)
- **System template files** — `.make-docs/system/templates/*.md` (structural starters)
- **System helper scripts** — selected files under `.make-docs/scripts/**`

Project-specific content in `docs/` is **never overwritten** by re-seeding — those are authored artifacts, not template deliverables. That exclusion includes generated designs, plans, PRDs, work backlogs, local library guide bodies, local playbooks, archive history records, artifact review material, overlays, and project config unless a later accepted plan deliberately promotes a specific file into starter content.

### When to re-seed

Re-seed after any change to template-owned files:

- Adding or updating a reference file (e.g., `guide-contract.md`)
- Adding or updating a template file (e.g., `guide-developer.md`)
- Changing router content (e.g., updating `docs/assets/library/AGENTS.md` to reference a new contract)

### How to re-seed

Copy the changed files from `packages/docs/template/` to `docs/`:

```bash
# Example: re-seed a new contract and updated routers
cp packages/docs/template/.make-docs/system/contracts/guide-contract.md .make-docs/system/contracts/guide-contract.md
cp packages/docs/template/docs/assets/library/AGENTS.md docs/assets/library/AGENTS.md
cp packages/docs/template/docs/assets/library/CLAUDE.md docs/assets/library/CLAUDE.md
```

Verify the copies match:

```bash
diff packages/docs/template/.make-docs/system/contracts/guide-contract.md .make-docs/system/contracts/guide-contract.md
```

There is no automated re-seed script — it is intentionally manual so contributors review what they are propagating. Do not run a blind recursive copy from `packages/docs/template/docs/` into repo-root `docs/`; that would overwrite project-authored dogfood records. If the set of changed files is large, a bulk copy with verification works only when it stays limited to the template-owned surfaces below:

```bash
# Bulk re-seed all routers and system resources (use with care)
for f in $(find packages/docs/template/docs -name 'AGENTS.md' -o -name 'CLAUDE.md'); do
  target="docs/${f#packages/docs/template/docs/}"
  cp "$f" "$target"
done
cp packages/docs/template/.make-docs/system/contracts/*.md .make-docs/system/contracts/
cp packages/docs/template/.make-docs/system/references/*.md .make-docs/system/references/
cp packages/docs/template/.make-docs/system/templates/*.md .make-docs/system/templates/
cp packages/docs/template/.make-docs/scripts/*.py .make-docs/scripts/
```

### Why not automate it?

The re-seed is manual because:

1. **Reviewability** — contributors should see exactly which dogfood files change and confirm the propagation is correct before committing.
2. **Selective updates** — sometimes only a subset of template changes should propagate (e.g., a router wording tweak vs. a structural contract change).
3. **Conflict awareness** — if a dogfood router was temporarily customized beyond the template, a manual copy surfaces that divergence rather than silently overwriting it.

## Publishing

This package is currently `private: true`. It is not published to npm standalone — consumers get the template through the `make-docs` CLI. If we decide to publish it independently later, see `make-docs-v2-publish.md` at the repo root.
