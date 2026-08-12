---
title: "W19 R0 Phase 5: Migration, Compatibility, and Validation"
kind: "plan"
status: "draft"
coordinate: "W19 R0"
---

# W19 R0 Phase 5: Migration, Compatibility, and Validation

## Purpose

Settle what happens to projects that already installed the Playbook-era Make Docs, classify the retirement under the repository's compatibility vocabulary, and prove the refactor landed cleanly across every surface class. This phase also generates the W19 R0 delta backlog and the phase history records.

## Who Is Affected

Three populations, with different exposure.

| Population | Exposure | Disposition |
| --- | --- | --- |
| This maintainer repository, as a dogfood instance | One default asset, the contract, the manifest entries, router blocks, and two historical run-state records under `.make-docs/runs/` | Handled by the phase-3 projection; historical run records are retained as provenance |
| Downstream projects with Make Docs installed but no authored Playbooks | Materialized system assets and manifest entries only | Handled by upgrade: retired asset IDs removed, protocol asset IDs added, no user content at risk |
| Downstream projects with authored Playbooks under `docs/assets/playbooks/<persona>/` | User-authored content in a namespace that is being renamed and a schema that is being narrowed | Needs explicit migration guidance; this is the population that determines the compatibility disposition |

The third population's size is unknown from inside this repository. Treat it as non-empty. The v2 contract shipped and was dogfooded, so assuming zero authored Playbooks is exactly the kind of assumption North Star principle 5 warns against.

## Compatibility Disposition

`docs/prd/18-compatibility-classification-and-migration-safety.md` owns the classification vocabulary and `packages/cli/src/compatibility.ts` implements it. The retirement must carry a named disposition from that vocabulary rather than an ad-hoc description. Two candidate shapes, to be decided against the existing classification set:

1. **Clean break.** The Protocol contract rejects Playbook documents outright with a pointed diagnostic naming the replacement, matching how the v1-to-v2 Playbook break was handled: v1 forms "never parse, and each fails validation with a pointed diagnostic naming its v2 replacement." This has precedent in this exact subsystem.
2. **Detect-and-direct.** Make Docs detects a `*.playbook.md` file or `kind: playbook` frontmatter, does not attempt to parse it, and emits a migration diagnostic pointing at the guidance below. The document is left untouched on disk.

Option 2 is recommended, and option 1 is the fallback if the detection cost is not justified. The difference matters most for the third population: a clean break gives them a parse failure with no path forward, while detect-and-direct gives them a named next step. Whichever is chosen, the decision is recorded in `docs/prd/03-open-questions-and-risk-register.md` and reflected in the phase-3 contract's migration form and in PRD 18.

Uninstall and backup behavior is verified for a Playbook-era install: retired materialized assets must be cleanly removed or backed up per existing lifecycle rules, and must not leave orphans under `docs/assets/playbooks/` or in the manifest.

## Migration Guidance

Guidance is authored as reader-facing content under `docs/assets/library/<persona-slug>/`, governed by `.make-docs/contracts/system/guide-contract.md` and reconciled through `.make-docs/contracts/system/coverage-pass-contract.md`. It is not a PRD, and it does not restate contract rules.

It covers:

- Moving a document from `docs/assets/playbooks/<persona>/<slug>.playbook.md` to `docs/assets/protocols/<persona>/<slug>.protocol.md`.
- Rewriting frontmatter: `kind: playbook` becomes `kind: protocol`; `workflowSchema`, `packagingHints`, and `schema: make-docs.playbook.v2` are replaced by the Protocol schema identifier; `stack` per the phase-4 decision.
- Reshaping the body: the `## Workflow` block's step titles and guidance become prose guardrails under the Protocol spine; `## Dependencies` becomes prose about what must be available before starting, with no registry, kinds, or probes; `## Gates` becomes checks to surface; `## Outputs` and `## Packaging Notes` are dropped or folded into narrative.
- What is not coming back: run state, resume, progression, gates as enforcement, dependency materialization, and package generation. Users who need deterministic workflow execution are pointed at the separate Playbooks CLI as an independent product, with an explicit statement that Make Docs does not wrap, vendor, or integrate with it in this wave.
- Validating the migrated document with the surviving validation entry point.

## Deferred Obligations

Any capability the owner wants preserved for a future wave rather than dropped is registered as a deferred obligation under `docs/prd/45-deferred-obligation-governance.md`, not left as an implicit intention in this plan. Candidates to evaluate explicitly: a future Protocol-to-Skill projection, a future interoperability seam with the external Playbooks CLI, and any traced load-bearing behavior from phase 2 that was removed rather than preserved. If the answer is that nothing is deferred, record that as the finding.

## Delta Backlog

Generate `docs/work/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/` from the maintained PRD authority, with `00-index.md` plus one `0N-<phase>.md` per phase of this plan. Backlog tasks cite the updated authoritative PRDs, not this plan and not the retired PRD text. Tasks use `- [ ] t1: ...` checkbox items numbered ordinally across each phase file, with acceptance criteria as plain bullets.

## Validation Matrix

| Surface class | Check | Evidence |
| --- | --- | --- |
| PRD authority | Every candidate has one applied decision; no renumbering; no editorial language; requirement history present | Phase-1 acceptance review |
| Code | Full test suite green with retired suites deleted, not skipped | `npm test` |
| Code | No symbol, type, or file remains for run state, progression, portability, compiler, adapters, descriptors, distributables, or the registration seam | `jcodemunch` `search_symbols` and `check_references` returning no implementation |
| Storage | No `playbook_runs` table; an existing store opens cleanly after the schema step | Store tests plus a manual upgrade check |
| Operations | Registry contains only the traced surviving operations; CLI and MCP derive from the same set | Registry and derivation-parity tests |
| Template authority | Upstream changed before downstream; `packages/cli/template/` matches a build from `packages/docs/template/` | Change record plus a clean build |
| Manifest | Protocol asset IDs present, playbook asset IDs absent, no orphans after upgrade | Install, upgrade, and uninstall checks |
| Dogfood | `.make-docs/` and `docs/` carry the projected content; no `docs/assets/playbooks/` remains | Filesystem check |
| Conformance | No scenario, tuple, or claim references a retired capability; withdrawn claims recorded | Conformance validation |
| Links | No broken internal links across `docs/`, `.make-docs/`, `packages/docs/template/`, `conformance/` | `jdocmunch` `get_broken_links` against a fresh index |
| Naming boundaries | No file under `docs/assets/archive/` modified; decompose-codebase colloquial usage unchanged; external Playbooks CLI still named Playbooks | Diff review against the phase-4 exclusion list |
| Scope discipline | No Persona or Naive UAT implementation file modified | Diff review |
| Honesty | No surviving Make Docs surface claims workflow execution, run state, gating, or distributable generation | Full-text sweep for the retired capability vocabulary across current-authority surfaces |

## Acceptance Criteria

- The compatibility disposition is named, recorded in PRD 18 and the risk register, and implemented consistently in the contract and the validator.
- Migration guidance exists, carries a coverage verdict, and does not restate contract rules.
- Deferred obligations are either registered or explicitly recorded as none.
- The delta backlog exists, cites maintained PRD authority, and follows the work-backlog conventions.
- Every row of the validation matrix has recorded evidence.
- One history record per executed phase exists at `docs/assets/archive/history/2026-08-11-w19-r0-p{P}-<slug>.md`, following `.make-docs/contracts/system/history-record-contract.md`, and each records the traced-removal evidence and any load-bearing exception found.
- Staging and committing follow `.make-docs/contracts/system/commit-message-convention.md`.

## Rollback Posture

The refactor is recoverable rather than reversible-by-design. Version history holds every removed file, so North Star principle 4 applies directly: if a removed behavior proves load-bearing in use, it is promoted back as a targeted operation with its own coordinate, not by reverting the wave. That posture is a deliberate consequence of choosing rebuild-as-discovery over prediction, and it is why phase 2 requires traced evidence for each removal — the trace is what makes a later targeted promotion cheap.

## Non-Goals For This Phase

- Archiving PRDs 35 and 36; that remains an open question requiring separate authorization.
- Deleting historical run records under `.make-docs/runs/` or anything under `docs/assets/archive/`.
- Building any interoperability with the external Playbooks CLI.
- Editing Persona or Naive UAT implementation files.
