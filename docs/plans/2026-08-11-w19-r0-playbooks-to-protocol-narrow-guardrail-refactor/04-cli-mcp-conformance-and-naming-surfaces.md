---
title: "W19 R0 Phase 4: CLI, MCP, Conformance, and Naming Surfaces"
kind: "plan"
status: "draft"
coordinate: "W19 R0"
---

# W19 R0 Phase 4: CLI, MCP, Conformance, and Naming Surfaces

## Purpose

Narrow the public command and tool surface to what Protocol actually needs, reconcile conformance scenarios and support claims against the retired capabilities, and perform the Playbook-to-Protocol rename across the surfaces that survive — with explicit boundaries so the rename does not spill into unrelated senses of the word or into immutable provenance.

## Surviving Operations

Fourteen `playbook.*` operations exist today. Eleven are removed in phase 2. Three are candidates to survive, and each must earn its slot under North Star principle 2, which grants a CLI or MCP slot only to a fact-of-record or to a canonical-identity or parse primitive that is both fiddly enough that agent variance is a real correctness risk and genuinely reused.

| Candidate | Test | Expected verdict |
| --- | --- | --- |
| `protocol.validate` | Shape validation is a parse primitive; agent variance in checking a frontmatter and heading contract is a real correctness risk, and it is reused on every authoring pass | Survives |
| `protocol.catalog` | Enumerating persona-scoped documents in a fixed namespace is re-derivable by an agent from the filesystem; it is convenience, not identity | Retire unless a traced consumer proves otherwise |
| `protocol.resolve` | Canonical reference resolution (`persona/slug` to a path) is an identity primitive, but with the run and packaging consumers gone it may have no remaining caller | Trace; retire if the only surviving caller is `protocol.validate`, which can resolve internally |

The trace decides. Record the verdict and the evidence for each; do not preserve an operation because it exists. The same test applies to the four `package.*` operations traced in phase 2.

## CLI Grammar

- The `make-docs run playbook ...` subtree is removed. Help text at `packages/cli/src/cli.ts` lines near 1626, 1627, and 1725 carries examples that go with it.
- Surviving operations project as `make-docs run protocol <op>` under the existing registry derivation in `packages/cli/src/operations/registry.ts`, which maps `playbook.catalog` to `playbook catalog` today.
- If only `protocol.validate` survives, evaluate whether it belongs in the `run` tree at all or as a bare command alongside the other validation entry points. Follow whatever `docs/prd/39-cli-command-model-and-operation-registry.md` states as current authority after phase 1; do not invent a new grammar here.

## MCP Derivation

`packages/cli/src/mcp/tools.ts` derives tool names from operation IDs — `playbook.catalog` becomes `make_docs_playbook_catalog`. The derivation rule is preserved unchanged; only the input set changes. Every `make_docs_playbook_*` tool disappears with its operation, and surviving operations derive `make_docs_protocol_*`. The derivation-parity test is retained and retargeted so CLI and MCP surfaces cannot drift.

## Conformance

| Surface | Action |
| --- | --- |
| `conformance/tuple-registry.json` | Remove the eight evidence entries pointing at `playbook-packaging-*` test files and the export-only `.make-docs/exports/playbook-packages/{packageId}` note; withdraw the support claims those tuples backed |
| `conformance/scenarios/packaging/dependency-check-both-directions.json` | Retire — dependency probes no longer exist |
| `conformance/scenarios/packaging/skills-bundle-discovery-invocation.json` | Retire — no Skill generation |
| `conformance/scenarios/packaging/plugin-marketplace-install.json` | Retire — no registration seam |
| `conformance/scenarios/packaging/uninstall-backup-cleanliness.json` | Trace — retire if it only covers generated packages; retain and re-scope if it also covers the materialized system assets phase 3 changes |
| `conformance/fixtures/agent/conformance-dependency-probe.playbook.md` | Remove |
| `conformance/fixtures/agent/conformance-skill-probe.playbook.md` | Remove |
| `conformance/AGENTS.md`, `conformance/CLAUDE.md`, `conformance/README.md` | Update references |

Support-claim withdrawal follows `docs/prd/20-agent-harness-conformance-and-support-claims.md` governance: a claim without surviving evidence is withdrawn, not quietly retained. The reduced claim set is stated honestly in the release reference rather than being backfilled with weaker evidence.

## Rename Boundaries

The rename applies to identifiers, paths, document kinds, contract names, namespace names, diagnostics prefixes, test filenames, and current-authority prose in surviving surfaces. Four boundaries constrain it.

### In scope

- TypeScript identifiers under `packages/cli/src/` that survive phase 2, including type, interface, constant, and function names built on `Playbook`.
- Operation IDs, CLI grammar tokens, and derived MCP tool names.
- File and directory names: `packages/cli/src/playbook/` becomes `packages/cli/src/protocol/`, `*.playbook.md` becomes `*.protocol.md`, `docs/assets/playbooks/` becomes `docs/assets/protocols/`, `packages/cli/tests/playbook-*.test.ts` becomes `protocol-*.test.ts`, and `packages/cli/tests/fixtures/playbooks/` becomes `fixtures/protocols/`.
- Diagnostic code prefix: whether `PB-` becomes `PR-` or another prefix is a phase-3 contract decision; phase 4 applies it consistently across code, fixtures, and tests.
- Document kind `playbook` becomes `protocol` in generated metadata.
- Current-authority prose in `docs/prd/`, `.make-docs/`, `packages/docs/template/`, `conformance/`, and `docs/assets/library/`.

### Explicitly out of scope

- **Immutable provenance.** `docs/assets/archive/designs/`, `docs/assets/archive/plans/`, `docs/assets/archive/work/`, `docs/assets/archive/history/`, and `docs/assets/archive/prds/` keep their Playbook terminology. Roughly 119 files under `docs/assets/` reference the term, and the archived ones record what was true when written. Rewriting them would falsify the record.
- **Superseded designs, plans, and work.** `docs/designs/`, `docs/plans/`, and `docs/work/` entries that predate this wave are historical artifacts of their own coordinates. They are not rewritten; this plan and its delta backlog are the current record. Where a superseded artifact is still linked as current authority, the fix is to correct the link in the current surface, not to edit the historical artifact.
- **Unrelated colloquial usage.** `packages/skills/decompose-codebase/references/mcp-playbook.md` and its two referring files (`packages/skills/decompose-codebase/SKILL.md`, `packages/skills/decompose-codebase/assets/README.md`) use "playbook" to mean an MCP usage walkthrough. Renaming them would create a false association with the Protocol mechanism.
- **The external Playbooks CLI.** Any reference to `/Users/tylerkneisly/Developer/Source/Lemme/playbooks` or to the separate Playbooks product keeps that name, because that is its name. The glossary disambiguation added in phase 1 makes the distinction explicit.

### Mechanics

A blind global find-and-replace is prohibited. The rename runs surface class by surface class, each with its own verification:

1. Code identifiers, using `jcodemunch` `check_rename_safe` and `find_references` per symbol.
2. Paths and filenames, with importer updates verified by `find_importers`.
3. Contract, template, and manifest content, which phase 3 already authored under the new names.
4. Conformance data files.
5. Current-authority prose, verified against the exclusion list above.

After each class, run the link checker over the affected tree. `jdocmunch` `get_broken_links` catches the cross-document breakage that a path rename causes; run it against a fresh index rather than a stale one.

## Acceptance

- Every surviving operation has a recorded trace justifying its slot under North Star principle 2; every retired one is absent from the registry and both projections.
- CLI and MCP surfaces are derived from the same operation set, verified by the retained parity test.
- No conformance scenario, tuple entry, or support claim references a retired capability.
- No file under `docs/assets/archive/` was modified.
- The decompose-codebase skill's colloquial usage is unchanged.
- No broken internal links remain in `docs/`, `.make-docs/`, `packages/docs/template/`, or `conformance/`.
- The `stack` frontmatter question raised in phase 1 is resolved with recorded evidence.

## Non-Goals For This Phase

- Removing behavior. Phase 2 owns removal; this phase renames what survives and reconciles evidence.
- Authoring contract text. Phase 3 owns it.
- Editing Persona or Naive UAT implementation files.
