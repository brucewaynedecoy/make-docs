# Phase 3: Delta Backlog and Validation

## Scope

Generate the W18 R8 delta work backlog from PRD 36 and the still-constraining baselines, then run the closing validation pass over everything this change wrote.

## Inputs

- `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md` as the effective requirement, with former PRD 33 (now incorporated in [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)), [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md), [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md), [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md), and [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) as still-constraining baselines.
- The Phase 2 scope decisions and the D10 test requirements.
- `.make-docs/templates/system/work-index.md` and `.make-docs/templates/system/work-phase.md`.

## Outputs

- `docs/work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/` with `00-index.md` (coordinate `W18 R8`) and dependency-ordered phase files (coordinate `W18 R8 P<N>`), following the arc: capability descriptor and distributable model, compiler output-writer correction and dependency materialization, verified adapter contracts for Codex, Claude Code, and Pi plus the fixture adapter's fail-closed paths, marketplace and registration seam plus provenance and lifecycle binding, and the D10 test suite including the R-TEST-2 Codex shape assertions and the R-TEST-5 rule that unit tests are not harness-recognition evidence.
- Every phase cites `../../prd/36-playbook-packaging-compiler-and-harness-adapters.md` plus the still-constraining baselines under `## Source PRD Docs`, writes `### Tasks` as `- [ ] tN: ...` items incrementing across the whole file, writes `### Acceptance criteria` as plain bullets derived from the design MUSTs, and lists `### Dependencies`.
- The backlog records the cross-design sequencing explicitly: the compiler depends on the W18 R6 Playbook model with rich steps, typed dependencies, and activation; real-harness recognition, installation, and invocation evidence is owned by the conformance design planned next as W18 R9 and is referenced, not redefined; and the R-MKT-2 opt-in seam depends on the global store owned by the Runtime and Global Store lineage.

## Validation

- Every new change doc uses the revision template and change type; the impacted baseline carries the required backlinks; `docs/prd/00-index.md` reflects doc 36's status and lineage; the delta backlog traces to PRD 36 and the constraining baselines; no existing PRD doc was renumbered or silently rewritten.
- All links resolve relatively, all paths are repo-relative with no absolute checkout paths, paragraphs use no semantic line breaks, and `git diff --check` is clean.
- The backlog leaves D9's implementer freedoms open and encodes D9's non-negotiables — the harness-native multi-file distributable, verified adapter contracts and the verified Codex/Claude Code/Pi shapes, the capability descriptor as the single home of harness packaging knowledge, the two-granularities model and profile interpretation of `outputKind`, fail-before-write on unresolved review, and generate-but-do-not-auto-register as the default — as acceptance criteria.
