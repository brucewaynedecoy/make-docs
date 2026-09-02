# 10 Packaging, Validation, and Release Reference

## Purpose

This reference doc captures the current publishable surface for `make-docs`, the validation commands that guard it, and the maintainer release procedure encoded in the repository today. It stays separate from subsystem narrative docs because the package allowlist in `packages/cli/package.json`, the prepack copy step in `scripts/copy-template-to-cli.mjs`, and the smoke-pack assertions in `scripts/smoke-pack.mjs` are operational facts rather than product-behavior descriptions.

## Reference

### Packaging Surface

| Topic | Current behavior | Primary anchors |
| --- | --- | --- |
| Publishable npm package | The only publishable workspace is `@brucewaynedecoy/make-docs` under `packages/cli/`; the monorepo root is `private: true` and only delegates scripts to that workspace. The package exposes the `make-docs` binary. | `package.json:2-19`; `packages/cli/package.json` (`name`, `version`, `license`, `repository`, `bin`) |
| CLI allowlist | The current shipped file allowlist is `dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, and `README.md`. Root `docs/`, root `AGENTS.md`, and root `CLAUDE.md` are not in the allowlist. | `packages/cli/package.json` (`files`) |
| Template packaging | `prepack` runs `node ../../scripts/copy-template-to-cli.mjs && npm run build`, and that script replaces `packages/cli/template` with `packages/docs/template` before pack/publish. | `packages/cli/package.json` (`scripts.prepack`), `scripts/copy-template-to-cli.mjs:24-32` |
| Performance governance resources | The contract, prompt, reference, and profile template are peer resources authored under `packages/docs/template/.make-docs/system/`, generated into `packages/cli/template/` through prepack, and deliberately dogfooded only for selected resources and routers. Package and dogfood proof must cover all four resource identities and intended bytes. | [PRD 48](./48-performance-evidence-governance.md); [W19 R2 plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md) |
| Dev vs packed template resolution | Local development reads `packages/docs/template/` first through `resolveTemplateRoot`, then falls back to the bundled `packages/cli/template/` in packed contexts. | `packages/cli/src/utils.ts:33-55`, `packages/docs/README.md:31-37` |
| Docs/template workspace status | `packages/docs` is `private` and exists to hold the source-of-truth template consumed by the CLI at build/publish time. It is not independently published today. | `packages/docs/package.json:2-5`, `packages/docs/README.md:123-125` |
| Skills workspace status | `packages/skills` is also `private`; current packaged distribution exposes registry metadata rather than publishing the workspace itself as an npm package. | `packages/skills/package.json:2-5`, `packages/cli/package.json` (`files`), `scripts/copy-template-to-cli.mjs:29-32` |

Current package mechanics therefore split into two modes: local development works from `packages/docs/template/` (`packages/cli/src/utils.ts:33-55`), while packed artifacts work from `packages/cli/template` after `prepack` (`scripts/copy-template-to-cli.mjs:24-32`). Any release checklist that ignores that distinction will miss a class of template drift bugs.

### Prepack and Smoke-Pack Flow

| Step | What happens | Primary anchors |
| --- | --- | --- |
| Prepack entry | `npm run prepack` runs inside `packages/cli`, copies the template, validates `packages/cli/skill-registry.json`, then builds `dist/index.js`. | `packages/cli/package.json` (`scripts.prepack`), `scripts/copy-template-to-cli.mjs:24-47` |
| Tarball creation | The smoke script executes `npm pack --json --ignore-scripts` only after running `prepack`, so the tarball reflects the already-bundled template and built output. | `scripts/smoke-pack.mjs` (`packResult`) |
| Bin validation | After unpacking, the script reads the packed `package.json` and asserts the package exposes only the `make-docs` bin before invoking it. | `scripts/smoke-pack.mjs` (`packedPackageJson`, `packedMakeDocs`) |
| Package-runner validation | Smoke-pack invokes the packed tarball through `npx --package`, `pnpm dlx`, and `bun x --package` into isolated temp working directories, targets, `HOME`, and package-manager cache roots. | `scripts/smoke-pack.mjs` |
| Skills validation | Smoke-pack rewrites the packed skill registry to a repo-backed fixture server, runs `make-docs setup skills --dry-run`, installs the base package, verifies shared skill payloads plus native harness exposure, and asserts stale generated stubs, legacy duplicated payloads, or unsafe fallback artifacts are absent. | `scripts/smoke-pack.mjs` |
| Installer validation | The same smoke run verifies `.make-docs/manifest.json`, `docs/AGENTS.md`, a second idempotent `setup --yes` run with no staged conflicts, and the later project-removal and machine-uninstall boundaries. | `scripts/smoke-pack.mjs` |
| Project backup and removal validation | Smoke-pack creates unmanaged project files, runs `setup backup`, then `setup remove`, and confirms managed project files and the manifest are removed while unmanaged files survive and new backup state lands under `.make-docs/backup/**`; legacy root `.backup/**` remains protected when present. | `scripts/smoke-pack.mjs` (`setup backup`, `setup remove`) |
| Machine uninstall validation | In a sandboxed machine environment, smoke-pack proves that top-level `uninstall` refuses without confirmation and that `uninstall --yes` removes the Global Store without modifying repository content. | `scripts/smoke-pack.mjs` (`uninstallRefusal`, `uninstallOutput`) |

The smoke script is therefore more than a tarball smoke test. It is the encoded proof that prepack bundling, remote package-runner execution, packaged installation, skill distribution, backup, and uninstall still agree on the same release surface (`scripts/smoke-pack.mjs`).

### Validation Matrix

| Command | Scope | What it proves | Primary anchors |
| --- | --- | --- | --- |
| `npm test` or `npm test -w packages/cli` | Full CLI Vitest suite | Covers profile logic, CLI flows, installer integration, skills behavior, and lifecycle commands. | `package.json:16`, `packages/cli/package.json` (`scripts.test`), `packages/cli/src/README.md:152-177` |
| `npm run validate:defaults` | Default-asset consistency | Runs `packages/cli/tests/consistency.test.ts`, which checks that desired scaffold assets match packaged template bytes, every template file is covered by the static asset pipeline, and every instruction router has managed-block markers. | `package.json:17`, `packages/cli/package.json` (`scripts.validate:defaults`), `packages/cli/tests/consistency.test.ts` |
| `bash scripts/check-instruction-routers.sh` | Router integrity | Enforces `AGENTS.md`/`CLAUDE.md` pairing, byte identity, per-directory line budgets, and banned headings. | `scripts/check-instruction-routers.sh:1-58`, `packages/cli/src/README.md:165-176` |
| `bash scripts/check-wave-numbering.sh` | Docs/work namespace hygiene | Warns on duplicate `wN-rN` coordinates across both repo-root docs and `packages/docs/template/docs`. | `scripts/check-wave-numbering.sh:15-58`, `docs/assets/archive/work/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md` |
| `node scripts/smoke-pack.mjs` | Packaged end-to-end validation | Exercises prepack, tarball creation, `npx` / `pnpm dlx` / Bun package-runner install, packaged CLI install, skills, backup, and uninstall in isolated temp directories. | `package.json:18`, `scripts/smoke-pack.mjs` |
| Package-runner spot checks | Manual packaged run | Use only when diagnosing runner-specific behavior beyond smoke-pack. The maintained automated proof is the tarball smoke run, not a persistent local CLI install. | `scripts/smoke-pack.mjs` |

For Performance Evidence Governance changes, the validation matrix also requires focused proof that the four stable resource URIs resolve to the intended upstream bytes, the packaged projection is generated rather than hand-edited, selected root dogfood matches upstream where parity is required, router pairs remain thin and byte-consistent where required, and installed-project resolution preserves the selected local-projection and machine-installed fallback precedence. This is resource-delivery proof, not benchmark execution or a new validator operation.

### Maintainer Release Procedure

The current maintainer runbook is spread across `packages/cli/src/README.md:179-204`, the repo-root workspace scripts in `package.json:13-18`, and the first-publish design in `docs/designs/2026-04-15-cli-publishing.md`. The current procedural baseline is:

1. Run the validation chain from the repo root: `npm test`, `npm run validate:defaults`, `npm run build`, `node scripts/smoke-pack.mjs`, and the router/wave checks when docs assets or W/R folders changed (`package.json:13-18`, `packages/cli/src/README.md:165-176`, `scripts/check-instruction-routers.sh:1-58`, `scripts/check-wave-numbering.sh:48-58`).
2. Create and inspect a tarball with `npm pack --json` or `npm pack --dry-run -w packages/cli` before publish (`packages/cli/src/README.md:183-201`, `designs/2026-04-15-cli-publishing.md`).
3. Treat `node scripts/smoke-pack.mjs` as the maintained package-runner proof for packaging-sensitive changes because it runs the packed tarball through `npx`, `pnpm dlx`, and Bun in isolated temp environments.
4. Publish from the CLI workspace with `npm publish --access public --tag next -w packages/cli`, not from `packages/docs` or `packages/skills`, because those workspaces remain `private` (`packages/cli/package.json`, `packages/docs/package.json:2-5`, `packages/skills/package.json:2-5`).

The current prerelease state uses Apache-2.0 licensing, scoped package identity, repository metadata, version `2.0.0-rc`, and the `next` dist-tag strategy (`docs/designs/2026-04-15-cli-publishing.md`, `packages/cli/package.json` (`name`, `version`, `license`, `repository`, `publishConfig`)).

### Current Drift and Risk-Register Candidates

| Item | Evidence | Why it matters |
| --- | --- | --- |
| Scoped package name is now required | The unscoped `make-docs` publish was blocked by npm's similarity guard; package metadata now uses `@brucewaynedecoy/make-docs` while preserving the `make-docs` binary. | Public docs and generated guidance must use scoped `npx @brucewaynedecoy/make-docs@next` until a future unscoped name strategy exists. |
| Retired unused content-package placeholder | The owner approved removal of `packages/content/`. Rendered JSON content fragments are a current non-goal and have no release surface. | Packaging checks must prove that no live workspace, lockfile, code, or active authority claim remains. Future content-fragment work requires new design and PRD authority. |

- The TypeScript package owns npm `next` and `latest`, the npm allowlist, packed-package validation, dry-run release checks, first-class `npx`, `pnpm dlx`, and `bunx` package-runner validation, and TypeScript-owned runtime/version reporting. Publish actions remain out of scope unless separately authorized.
- Smoke-pack and template parity checks must prove the machine-served default and explicit optional local resource bodies independently while retaining the always-local router skeleton. Validation covers installed-provider absence, invalid or stale hashes, selected projection conflicts, deterministic URI resolution, offline diagnostics, and CLI/MCP parity; it must not treat an eager full project snapshot as the default.
- Release-sensitive changes add fixtures across the [compatibility](./18-compatibility-classification-and-migration-safety.md) source-state and disposition matrix, including clean v1, clean v2 full-snapshot, provider-backed v2 with unavailable provider, stale hybrid cache, modified v1, malformed manifest/block, missing canonical files, ambiguous missing-manifest installs, and unknown shapes.
- Packed npm validation exercises `packages/cli/template/` after copy/prepack, and package README, tarball allowlist wording, maintainer docs, and smoke-pack expectations agree with the template-first source-of-truth order in [06-template-contracts-and-generated-assets.md](./06-template-contracts-and-generated-assets.md).
- Package validation commands may be lab scenario steps, but a green package validation run is not a public harness/model support claim without reviewed result records under [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md).
- Package copy, smoke-pack, and dry-run checks prove the `.make-docs/**` tool resources owned by [21-project-tool-directory-and-resource-tiers.md](./21-project-tool-directory-and-resource-tiers.md) without moving runtime state into `docs/assets/**`.
- [22-project-documentation-asset-model.md](./22-project-documentation-asset-model.md) owns package proof of managed project paths, while [47-persona-model.md](./47-persona-model.md) owns persona-fixture semantics. Packed validation covers `.make-docs/system/{contracts,prompts,references,templates}/**`, `.make-docs/archive/**`, `docs/artifacts/**`, and `docs/assets/<persona-slug>/testing/**`, proves on-demand paths are not emitted as empty placeholders, and treats legacy guide, Library, Playbook, Protocol, archive, history, breadcrumb, and former resource paths as migration inputs rather than shipped v2 targets.
- Packed validation proves copied templates preserve required frontmatter and YAML/body handoff consistency under [23-generated-document-metadata-and-lifecycle-handoffs.md](./23-generated-document-metadata-and-lifecycle-handoffs.md).
- Packed validation proves every default config template follows source-first copy rules and install/reconfigure flows preserve local `.make-docs/config.yaml` under [24-project-configuration-and-convention-overlay.md](./24-project-configuration-and-convention-overlay.md).
- Packed npm validation keeps the public command taxonomy aligned with TypeScript behavior and proves remote package-runner behavior, TypeScript-owned runtime/version disclosure, required MCP availability, and CLI/MCP operation-contract parity before MCP surfaces are implementation-ready under [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md).
- Package validation proves migrated CLI/shared-core operations, selected-skill install/update/remove behavior, managed old-script and wrapper classification, source-first template/dogfood/package copy, and smoke-pack coverage when shipped helper or skill assets change.
- Package validation ships the registry schema with the built-in manifest, proves bare installs write no skill files, proves explicit first-party and alternate file-manifest installs, and rejects unpinned remote manifests or skill payloads before installation under [08-skills-catalog-and-distribution.md](./08-skills-catalog-and-distribution.md).
- Packed validation proves explicit selected skills write one canonical shared payload per scope, expose selected harnesses through native skill directories, preserve skill-free bare installs, classify migrated duplicate payloads and legacy stubs, and cover symlink-preferred plus copy-mirror fallback behavior under [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md).
- Packed validation proves Make Docs v2 ships no current Playbook or Protocol discovery/execution surface and does not include legacy `playbook_runs` in current run listings. Representative legacy assets remain migration fixtures whose bytes and Store rows are preserved unless a separately authorized disposition applies.
- Packed validation proves no-default plugin behavior, explicit selected-plugin payload and native exposure or plugin-specific adapter behavior, plugin asset inclusion/exclusion rules, and exclusion of conformance-lab records, generated local run artifacts, and unreviewed plugin outputs from shipped template/package surfaces under [30-plugin-substrate-and-workflow-bundles.md](./30-plugin-substrate-and-workflow-bundles.md).
- Packed validation covers adversarial prompts, references, plugins, CLI/MCP affordances, or conformance records only when a downstream plan explicitly selects that surface. Package proof preserves template-first authoring, no-default exposure, prompt-rule coverage, plugin validation, and evidence-bound support claims under [14-lifecycle-workflow-and-coverage-passes.md](./14-lifecycle-workflow-and-coverage-passes.md).
- Packed validation proves new backup writes use `.make-docs/backup/**`, fresh installs do not create root `.backup/**`, legacy root `.backup/**` is protected, and selected-agentics uninstall prunes empty managed `.make-docs/agentics/**` directories safely under [38-global-store-and-project-state.md](./38-global-store-and-project-state.md).
- Packed validation proves generated plugin and skills-bundle outputs are included only when a reviewed package plan selects them as shipped assets, while local generated outputs, export-only artifacts, run state, and conformance records stay out of templates and tarballs by default under [36-playbook-packaging-compiler-and-harness-adapters.md](./36-playbook-packaging-compiler-and-harness-adapters.md).
- Packaged runner and CLI/MCP validation covers general lifecycle `runs`, bounded `run_evidence`, typed Store receipts, repository authority, and `run-capture-unavailable`; it proves no run state is written under `.make-docs/runs/**`, no document/evidence bodies or secrets enter the Store, and no operational state ships in templates or tarballs.

## Package Projection Proof

- Local CLI development may resolve sibling `packages/docs/template/`, but tarball and publish validation exercise the generated `packages/cli/template/` after copy/prepack. `npm run smoke:pack` and package dry-run are the required packaged-path proof surfaces.
- Package validation verifies the complete managed template set, including mixed-directory routers and starter structure, while proving project-authored dogfood content, local records, run evidence, and maintainer-only conformance assets are excluded unless explicitly selected for shipping.
- If packaged-template drift appears, the fix starts in `packages/docs/template/` or the copy/package pipeline and regenerates `packages/cli/template/`; the bundled copy is never repaired by hand.
- Package validation remains dry-run unless publication is separately authorized, and dogfood freshness requires targeted exact-parity evidence for files expected to match.
- Performance governance package proof covers the four peer contract/prompt/reference/template resources and their selected router projections across `packages/docs/template/`, generated `packages/cli/template/`, root dogfood, and installed-project resolution. Project-authored profiles, results, work, benchmark outputs, and evidence remain excluded from shipped defaults.
- A performance `pass`, `waived` outcome, characterization result, profile presence, or packaged evidence link does not by itself authorize publication, release recommendation, conformance, a supported tuple, or any broader support claim. Those decisions remain with their existing release and support authorities.
- Release recommendation is blocked until the final recovery gate validates the fixed sequence of upstream template authority, generated package projection, root dogfood parity, and installed-project behavior for a fresh install plus representative legacy migrations across source states, dispositions, and selected facets. The same gate covers fail-closed classification, quiescence, backup/rollback, update/uninstall preservation, path traversal and symlink rejection, privacy-safe Store behavior, and Windows, macOS, and Linux fixtures.

### No-Scripts Package Proof

- Every migrated deterministic domain has focused operation tests and shared CLI/MCP semantics; operation logic is testable without the full parser or transport.
- Selected-skill install, update, removal, and stale-footprint tests cover rewritten skills plus removed or wrapper script assets. Audit, backup, uninstall, and migration fixtures distinguish managed old scripts, managed wrappers, locally modified managed files, and custom scripts.
- When shipped helper or skill assets change, validation proves source-first edits, scoped dogfood reseeding, bundled-template refresh, packed npm behavior, and that no selected first-party skill depends on a missing script or missing replacement.

Release validation must prove that the packed CLI receives its managed template payload from `packages/docs/template/`, that the dogfood projection is intentionally synchronized where applicable, and that generated package copies are non-authoritative build artifacts.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 19, 26.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

## Source Anchors

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- [Accepted Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 Performance Evidence Governance plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [PRD 48 — Performance Evidence Governance](./48-performance-evidence-governance.md)
- `package.json`
- `README.md`
- `packages/cli/package.json`
- `packages/cli/README.md`
- `packages/cli/src/README.md`
- `packages/cli/src/utils.ts`
- `packages/docs/package.json`
- `packages/docs/README.md`
- `packages/skills/package.json`
- `packages/cli/tests/consistency.test.ts`
- `scripts/check-instruction-routers.sh`
- `scripts/check-wave-numbering.sh`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`
- `docs/designs/2026-04-15-cli-publishing.md`
- `docs/assets/archive/work/2026-04-16-w5-r2-cli-skill-installation/07-tests-and-validation.md`
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md`
- `docs/prd/24-project-configuration-and-convention-overlay.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/34-playbook-authoring-contract-and-model.md`
- `docs/prd/30-plugin-substrate-and-workflow-bundles.md`
- `docs/prd/14-lifecycle-workflow-and-coverage-passes.md`
- `docs/prd/38-global-store-and-project-state.md`
- `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`
- `docs/designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md`
- `docs/plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`
- `docs/plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
