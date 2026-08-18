# Package and Deployment Boundaries

## Purpose

Define the v2 package, executable, release-channel, and deployment ownership boundaries for Make Docs before the batch moves into asset materialization, compatibility migration, and template ownership decisions.

This design intentionally resolves the user-facing product boundary first. Later v2 designs can then decide where assets live, how compatibility audits and migrations behave, and how dogfood/package validation is split without reopening package identity or deployment ownership.

## Context

The v2 roadmap makes this the first design in "Batch 1 - Packaging, Compatibility, and Ownership" because package boundaries are a dependency for the rest of the batch. The roadmap also records an intentional lifecycle departure: these v2 designs are being generated from artifact roadmap inputs before returning to the normal design -> plan -> PRD -> work -> implementation flow.

The current accepted npm publishing design, [2026-04-15-cli-publishing.md](2026-04-15-cli-publishing.md), defines the first public package as `@brucewaynedecoy/make-docs`, with an installed `make-docs` binary, a package rooted at `packages/cli`, and a release flow that publishes release candidates on npm's `next` dist-tag before promotion to `latest`. That design also keeps the public tarball scoped to the built CLI, bundled template, skill registry files, and README, while excluding root workspace files, docs, scripts, and scratch planning material.

An archived identity design, [2026-04-21-make-docs-rename.md](../assets/archive/designs/2026-04-21-make-docs-rename.md), is relevant only as lineage. It proposed a wider rename and rejected compatibility aliases. The v2 roadmap supersedes that rename direction by fixing the product naming decision as `make-docs`, `MakeDocs`, and `Make Docs`.

The current TypeScript CLI already owns install-time behavior for the npm package. Its surfaces include the `make-docs` command, install/reconfigure/skills/backup/uninstall subcommands, template resolution from the package root, `.make-docs/manifest.json`, conflict records, audit snapshots, backup and uninstall safety, and skill registry/resolution behavior. Those surfaces are the current implementation authority until a later plan introduces Rust implementation parity.

The PRD and risk-register entries to reference, without mutating them in this design step, include D-005, D-006, Q-001, Q-007, Q-008, Q-012, R-003, R-006, and R-014 in [03-open-questions-and-risk-register.md](../prd/03-open-questions-and-risk-register.md). They cover skill delivery, package README/tarball drift, remote-source integrity, stale rename questions, shared skill/plugin install questions, template/package divergence, audit snapshot safety, and no-scripts migration risk.

## Decision

The product name remains stable across v2:

- `make-docs` is the CLI/package identifier and primary executable spelling.
- `Make Docs` is the prose display name.
- `MakeDocs` is the compact identifier for contexts that cannot use spaces or hyphens.

No broad product rename is part of v2. Existing private workspace package names may remain in place until a specific package-ownership design changes them. The root workspace remains private and is not a deployment package.

The TypeScript npm package remains the canonical npm and `npx` entry point. It owns:

- project installation and reconfiguration through `npx @brucewaynedecoy/make-docs@...` and the installed `make-docs` binary;
- npm release channels, with `next` for release candidates and `latest` for stable releases;
- npm package contents, including the built CLI, bundled template, skill registry files, and package README;
- the current manifest, audit, backup, uninstall, conflict, and skills-selection safety behavior until another accepted design and implementation plan moves part of that ownership.

The standalone Rust CLI is a separate deployment artifact for Homebrew and Crates. Its primary binary name is also `make-docs`. Distribution package names should use `make-docs` when available; if a registry, tap, or ownership constraint blocks that package name, the package lookup name may be owner-qualified, but the installed command remains `make-docs`.

The same binary name is intentional. It keeps the product surface coherent across npm, Homebrew, and Crates. If users install multiple distributions, PATH order chooses which implementation runs; both implementations must identify their runtime and version in help/version output once both exist. This design does not create secondary command aliases such as `makedocs`, `make-docs-js`, or `make-docs-rs`.

Compatibility aliases are not part of v2 by default. The roadmap's stable naming decision removes the need for user-facing command aliases, and aliases would expand the compatibility matrix before the compatibility/audit/migration design has narrowed it. A future design may add a constrained package lookup alias only if a registry constraint requires it, but that alias must not add another primary command name.

Long-term MCP startup ownership belongs to the Rust CLI. The TypeScript npm package may continue to bootstrap, configure, or bridge MCP-related setup during transition, but it should not become the long-term MCP runtime owner. The Rust CLI must not bypass existing manifest, audit, backup, or uninstall safety expectations when it takes ownership.

The TypeScript and Rust implementations must share durable contracts rather than fork them. The `.make-docs/manifest.json` schema, package metadata needed for installed-project provenance, and user-visible command semantics are shared product contracts. Until a Rust implementation plan lands, the TypeScript CLI remains the implementation source of truth for those contracts.

## Alternatives Considered

Keep only the TypeScript npm CLI. This would preserve the current package boundary but would not satisfy the v2 roadmap's standalone Homebrew/Crates direction or the no-scripts migration work that depends on a durable non-npm tool.

Replace the npm CLI with Rust immediately. This would simplify long-term runtime ownership but would break the current working npm/`npx` installer path, increase release risk, and force packaging, compatibility, and asset materialization changes into one step.

Use separate executable names for TypeScript and Rust. This would avoid PATH collisions for users who install both distributions, but it would split the primary command surface and make documentation, support, and migration behavior harder to reason about. The better tradeoff is one logical command with runtime/version disclosure.

Add compatibility aliases now. This was rejected because v2 is not performing a product rename, and aliases would create extra surfaces for package validation, migration, and support before the compatibility design has defined its scope.

Let the TypeScript npm package own MCP startup permanently. This would keep all current behavior in one implementation, but it would make the standalone CLI dependent on the npm deployment boundary and weaken the reason for a separate Rust tool.

Publish standalone template, skills, or content packages as part of this boundary decision. That is deferred. This design names the deployment owners; the asset materialization and template/package/dogfood designs decide which artifacts become packages and how they are validated.

## Consequences

Batch 1 can proceed with a stable package boundary. The asset materialization design can decide whether assets are embedded, generated, fetched, or packaged without reopening which deployment owns npm install or Rust runtime behavior. The compatibility/audit/migration design can define one product contract across both implementations. The template/package/dogfood design can validate the npm package and future Rust package against the same user-facing command boundary.

The npm package remains responsible for not regressing current install behavior while Rust catches up. In particular, bare installs must keep the current no-default-skills behavior, and explicit skills installs must remain opt-in through the skills selection flow until a later accepted design changes that contract.

Using `make-docs` for both implementations creates a real PATH-order consideration for users who install npm and Rust distributions side by side. That is acceptable only if future implementation work makes runtime/version output clear and package documentation states that the distributions are alternatives, not two commands that should normally be chained together.

The archived rename question Q-008 becomes stale relative to this design's decision, but this design does not mutate the PRD or risk register. A later plan or closeout step should reconcile that register entry according to the repo's normal PRD/risk workflow.

Q-001, Q-007, and Q-012 remain open. This design does not choose remote versus bundled skills delivery, remote-source integrity mechanics, or shared plugin/skill install behavior. It only constrains which deployment surface owns the user-facing command and long-term MCP runtime.

R-003, R-006, and R-014 remain active implementation risks. Future package validation must prove that packed artifacts match development templates, that backup/uninstall behavior uses one reviewed audit snapshot, and that no-scripts migration does not strand users between TS and Rust ownership.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [2026-04-15-cli-publishing.md](2026-04-15-cli-publishing.md), [2026-04-21-make-docs-rename.md](../assets/archive/designs/2026-04-21-make-docs-rename.md)

Reason: This design extends the accepted npm publishing boundary for the current public package and adds the cross-distribution boundary needed for Rust, Homebrew, Crates, MCP startup ownership, and compatibility planning. It also supersedes the archived package-identity direction only where that design conflicts with the v2 roadmap's fixed naming decision; it does not restore the archived rename plan or introduce compatibility aliases.

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)

Why: This design changes and extends an existing package publishing and installer surface rather than establishing a fresh baseline. It also constrains later active PRD/risk reconciliation and downstream Batch 1 designs.

Coordinate Handoff: Prior coordinate W10 R0 P1 and the accepted npm publishing design are the nearest lineage anchors; recommended downstream W/R coordinate unresolved; planner must resolve before writing.
