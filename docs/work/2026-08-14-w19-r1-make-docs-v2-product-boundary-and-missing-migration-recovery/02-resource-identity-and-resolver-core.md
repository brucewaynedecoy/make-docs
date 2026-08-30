---
title: "Phase 2: Resource Identity and Resolver Core"
kind: "work"
status: "active"
coordinate: "W19 R1 P2"
source:
  type: "prd"
  path: "docs/prd/17-system-asset-materialization-and-local-bootstrap.md"
---

# Phase 2: Resource Identity and Resolver Core

## Purpose

Implement the shared typed core for peer system-resource identity, provider and project resolution, provenance, path safety, and deterministic list/read/ensure behavior.

## Overview

The resolver serves contracts, prompts, references, and templates through one stable URI model independent of installation path. Provider resources remain available without local projection; selected clean projections and explicit project-owned overrides are classified and reported rather than silently treated as provider authority. CLI and MCP projection wait for P3.

## Source PRD Docs

- [PRD 02 — Architecture Overview](../../prd/02-architecture-overview.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 17 — System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- This internal core phase has no canonical `NUAT-###` execution. User-observable CLI/MCP behavior is evaluated when its owning projection phase activates it.
- Findings and capability status remain `none` unless linked canonical records are created by their owning workflow.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1 closeout, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread the current normative bodies of every Source PRD plus PRD 03 and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-003, Q-017, Q-018, R-004, R-017, and R-021; treat Q-017's current per-project resource model as authority unless separately redesigned and add newly relevant live items.
- [x] t4: For every relevant `Open`, `Confirming`, `Deferred`, closed regression item, or new gap, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: Record an explicit no-blocker determination and finite correction/review budget before unlocking t8 when no blocker or gap remains.
- [x] t6: For any blocker or authority gap, stop before implementation and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; do not create a standalone decision file.
- [x] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; never infer closure from task completion.
- [x] t8: Record the Stage 1 outcome, authority digests, accepted P1 evidence, and implementation unlock or stop result.

### Acceptance criteria

- The live question/risk record is complete and Q-017 is not silently redesigned.
- No implementation task unlocks with a blocker, authority gap, or missing decision commit SHA.
- Prior-phase evidence and current authority digests are traceable.

### Dependencies

- Accepted and validated P1 upstream authority.
- Current PRD authority and separate P2 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): internal deterministic core; naive UAT remains deferred to a user-observable surface.
- Phase / capability status: Stage 1 is complete. P2 implementation was not authorized at Stage 1 closeout and remained locked at that checkpoint.

#### 2026-08-17 read-only baseline

- Worktree: repository root (`.`).
- Branch: `make-docs-v2`.
- HEAD: `aa6560b8ab89166a0a150838d749fb4fadcb29c6`.
- Starting worktree state: clean.
- Dirty-state allowlist: none.
- Available disk: `95,600,000 KiB`.
- Accepted P1 evidence: The [P1 work record](./01-upstream-documentation-authority.md) is accepted at the same `aa6560b8ab89166a0a150838d749fb4fadcb29c6` SHA.
- Authorization: The owner authorized Decision Package 1 documentation correction only. P2 implementation is not authorized and remains locked.

##### Safety recheck

- During validation, free disk fell from the baseline `95,600,000 KiB` to `78,400,000 KiB`. It later recovered.
- Read-only inspection found `41,682.44 MiB` of swap use and 310 Munch MCP processes across active apps.
- The owner could not restart Codex because another task was running.
- The owner approved Option B. Work continues without a restart.
- The current recheck has `88,000,000 KiB` free, `26,580.56 MiB` of `27,648 MiB` swap in use, and 126 Munch MCP processes.
- Safety disposition: Continue only through the separate documentation gate.
- Before any P2 implementation, recheck disk, swap, process count, exact worktree, branch, HEAD, and the dirty-state allowlist.
- P2 implementation remains locked.

#### Source authority digests

| Source | Revision | SHA-256 digest |
| --- | --- | --- |
| PRD 02 | `02002ba` | `9138f2332bc7a93a3f7dcc0d7376ecc7213cce1e37c4e04ed9018dca9612f645` |
| PRD 06 | `834aef` | `c9191e278fb07707db357995f42dd1f5270d5d75fae9a0a13bbd5c7851c1159d` |
| PRD 17 | `02002ba` | `4c640f9c8560005e759a3f0314e750df893f9dd923b9cc3020d8bf8211830374` |
| PRD 18 | `02002ba` | `180a3a89032f8577a7cef7f03fdb6cce9885c90e3f9cf959d4f42e868bd8a4ae` |
| PRD 21 | `02002ba` | `b044071a6829b7812cad23fc6ade12ab8d703cfb7af2c224f0aae1d928442cf3` |
| PRD 25 | `02002ba` | `7ae999e5221c09b5e3f40a9f60431f65784f537f602334031a1fd7ddd3e69b90` |
| PRD 39 | `02002ba` | `9e6267e35bb0e09e2cead9f169f558407ed5cc12c4436ecd8973ee6fabe3a155` |
| PRD 03 | `834aef` plus the Decision Package 1 working change | Pre-decision digest `35d772d3d0ba08705482f27b8a114ec0e3a7762ac5d05900ff3c0bce9ade8222`; post-correction digest `fe620aed0e149cb2297da3de308eb73877f0dbc3f9ea647ef2da0c960aa296d5` |

#### Decision Package 1 - Q-010 prompt resource root

- Gate classification before correction: Q-010 was a `blocking` `closed-regression-check` because its closed text placed prompts under the reference namespace. This conflicted with the [accepted design](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and the accepted [P1 work record](./01-upstream-documentation-authority.md).
- Owner disposition: On 2026-08-17, the owner approved Option A. Q-010 stays `Closed`. Prompts are first-class peer system resources at `.make-docs/prompts/system/`, authored upstream at `packages/docs/template/.make-docs/prompts/system/`, supplied by the installed provider without required local projection, and projected when selected to `.make-docs/system/prompts/`. Prompts do not live under references or `docs/assets/**`.
- Commit record: The separate decision-only commit is `72ee9b214967346a2e6b1b16531e214d6e2b7b72`. It was pushed to `origin/make-docs-v2`.
- Gate state: Decision Package 1 is settled. The independent audit below records Stage 1 completion. P2 implementation is not authorized and remains locked.

#### Independent Stage 1 audit

- Reviewed PRD 03 snapshot `PRD03-AUDIT`: HEAD `d077afe66e417ac731f639b997eb58888798acdc` with SHA-256 digest `fe620aed0e149cb2297da3de308eb73877f0dbc3f9ea647ef2da0c960aa296d5`. This is the traceable snapshot before this factual correction pass.
- Post-correction final PRD 03 digest: `d39703f532c2a60d71f0028b4f4659569faafebfd223d312ae110d02ee9f65ce`.
- Audit result: No owner decision remains after Q-010.

| ID | Live status | Authority revision or reviewed digest | Impact | Class | Disposition | Rationale |
| --- | --- | --- | --- | --- | --- | --- |
| Q-003 | Open | `PRD03-AUDIT` | Legacy install asset taxonomy | `impacted-nonblocking` | Preserve `static` and `scoped-static`. Use separate P2 system-resource types and URIs. | Both legacy values are live. Cleanup is later work. |
| Q-017 | Deferred | `PRD03-AUDIT` | Provider and projection boundary | `impacted-nonblocking` | Use the installed provider by default and optional local projection. Exclude the broader layout lineage. | The accepted W19 design and current PRDs separately redesign P2. |
| Q-018 | Open | `PRD03-AUDIT` | Configuration discovery | `impacted-nonblocking` | Make no configuration-layout change in P2. | The resolver core does not need the wider configuration design. |
| R-004 | Open | `PRD03-AUDIT` | Path and identity parity | `impacted-nonblocking` | Use focused consistency and parity proof for new resource paths. | P2 adds path-sensitive identity and provider surfaces. |
| R-017 | Open | `PRD03-AUDIT` | Resource authority | `impacted-nonblocking` | Keep contracts, prompts, references, and templates as the one authority. | Optional adapters must not copy policy. |
| R-006 | Open | `PRD03-AUDIT` | Lifecycle safety | `impacted-nonblocking` | Do not change backup or uninstall review semantics in P2. | Provider work must not weaken the one-snapshot safety model. |
| R-014 | Open | `PRD03-AUDIT` | Operation sequencing | `impacted-nonblocking` | Keep deterministic resource logic in the shared core before dependent surfaces. | P2 must not create a script or adapter break window. |
| D-019 | Open | `PRD03-AUDIT` | Custom tiers and script absorption | `impacted-nonblocking` | Do not implement custom tiers or script absorption in P2. | Those items belong to Q-017 or their later owners. |
| D-004 | Closed | `PRD03-AUDIT` | Legacy asset classes | `closed-regression-check` | Preserve both live legacy values. Use a separate P2 type and URI contract. | The prior drift was an incomplete catalog reading. |
| R-021 | Open | `PRD03-AUDIT` | Harness adapter evidence | `unrelated` | Take no P2 action. | Adapter recognition and support claims are outside the resource resolver core. |
| R-003 | Closed | `PRD03-AUDIT` | Development and packed provider parity | `closed-regression-check` | Preserve focused development-path and packed-path proof. | Provider resolution can differ after package preparation. |
| D-008 | Closed | `PRD03-AUDIT` | Current path routing | `closed-regression-check` | Use only the current `.make-docs/system/**` target paths. | Historical hidden-dot paths remain lineage or migration inputs only. |

#### No-blocker result and finite review budget

- No-blocker result: No blocking question, risk, drift item, or new authority gap remains for P2 after the Q-010 correction and this factual register pass.
- Decision-package result: All blocking decision packages are settled. Decision Package 1 commit `72ee9b214967346a2e6b1b16531e214d6e2b7b72` is pushed to `origin/make-docs-v2`.
- Correction budget: This factual PRD and register correction pass, one independent documentation review, and at most one correction pass for actionable findings.
- Focused validation: PRD authority validation, path hygiene, relative-link checks, and `git diff --check`.
- Evidence: The accepted P1 record and the Source authority digests above remain traceable inputs.
- Stage 1 result: Complete.
- Implementation gate: Stage 1 completion does not authorize P2 implementation. P2 still requires explicit new owner authorization and a fresh Option B safety preflight. P2 implementation remains locked.

#### 2026-08-17 implementation authorization and safety override

- The owner authorized W19 R1 P2 product implementation under the approved P8 documents and phase process.
- The required implementation safety preflight reported `32,110.69 MiB` of `32,768 MiB` swap in use, 162 Munch-related processes, and `79.6 GB` free disk. The repository was clean and synchronized at `f7d118674da5d457488bee5ed297a80867edba97`.
- The owner could not restart Codex or the Munch services.
- The owner explicitly directed the coordinator to skip the failed safety preflight and continue implementation.
- The worker used focused commands only. The worker did not start a background service or run the broad test suite.
- This owner override unlocks only the approved P2 scope. It does not authorize P3 projection, publication, deployment, or a phase commit.

## Stage 2 - Implement Stable Resource Identity And Types

### Tasks

- [x] t9: Define the closed peer type set `contracts`, `prompts`, `references`, and `templates` and the stable `make-docs://system/<type>/<posix-relative-path>` identity independent of provider or projection path.
- [x] t10: Implement canonical POSIX-relative normalization, case and separator handling, duplicate detection, and typed rejection for traversal, absolute paths, empty segments, encoded escapes, and invalid resource types.
- [x] t11: Implement provider identity and immutable provider-resource metadata, including source, version or digest, logical URI, and availability without project-local projection.
- [x] t12: Model selected managed projection, explicit project-owned override, missing resource, conflict, and provider-only states without allowing path location to imply ownership.

### Acceptance criteria

- Every valid resource has one stable logical URI across development, packed, and projected locations.
- All four types share one type-safe identity contract.
- Invalid or ambiguous identities fail closed with typed outcomes.
- Provider availability never depends on `.make-docs/system/**` existing.

### Dependencies

- Stage 1 unlock.
- P1 schemas and catalogs.

### Closeout Notes

- Testing-mode decision(s): deterministic type, URI, normalization, and metadata fixtures.
- Implementation: `packages/cli/src/operations/resource/types.ts`, `identity.ts`, and `provider.ts` define the peer type set, stable identity, typed errors, provider metadata, catalog inventory, exact content digests, and immutable inventory digest.
- Exact entry points: `createSystemResourceIdentity`, `parseSystemResourceUri`, `canonicalSystemResourcePath`, `loadSystemResourceProvider`, and `loadInstalledSystemResourceProvider`.
- Evidence: `packages/cli/tests/resource-identity-provider.test.ts` covers the current development provider, a packed-root fixture, all four peer types, invalid identity forms, duplicate catalog types, and provider symlinks.
- Phase / capability status: identity and provider layers are complete. Public CLI and MCP projection remains P3.

## Stage 3 - Implement Resolution, Provenance, And Typed Operations

### Tasks

- [x] t13: Implement the PRD-defined local-first resolution precedence while keeping project-owned overrides, clean managed projections, and provider resources distinguishable in the result.
- [x] t14: Enforce repository-root and approved provider-root path containment, symlink non-following rules, realpath checks, and cross-platform path safety before reads or writes.
- [x] t15: Implement deterministic typed list and read operations that return logical identity, resolved source, ownership, provenance, digest where available, and bounded not-found/conflict/error outcomes.
- [x] t16: Implement on-demand ensure as an explicitly mutating operation that can create only selected clean managed projection content through the lifecycle conflict/review contract; keep ordinary list/read read-only.
- [x] t17: Return provenance that identifies provider, managed projection, or explicit project override without converting an override into package authority or a projection into required runtime state.

### Acceptance criteria

- Resolution precedence is deterministic and provenance-preserving.
- Read-only operations never materialize files.
- Ensure cannot bypass selection, ownership, conflict review, or path safety.
- Symlink, traversal, and root-escape inputs fail closed.

### Dependencies

- Stage 2 types and identity.
- PRD 18 safety classifications for ambiguous states.

### Closeout Notes

- Testing-mode decision(s): provider, projection, override, conflict, missing, path, and symlink fixtures.
- Implementation: `packages/cli/src/operations/resource/resolver.ts` provides one local-first resolver and typed list, read, and ensure operations. `packages/cli/src/operations/resource/index.ts` is the bounded shared-core export.
- Exact entry points: `resolveSystemResource`, `listSystemResources`, `readSystemResource`, and `ensureSystemResource`.
- Exact result boundary: `SystemResourceResult<T>` returns either a typed value or a `SystemResourceError` code with recovery guidance. `ResolvedSystemResource` reports identity, state, source, media type, digest, bytes, provenance, and reusable digest evidence.
- Mutation boundary: list and read do not create files. Ensure requires selected managed-projection evidence. A write requires `writesAllowed` and the `resource-projection-write` approval. Dry-run returns a plan without a write. Existing valid content returns `reused`.
- Phase / capability status: shared core operations are complete. CLI command, MCP resource, registry, and manifest-schema projection remain outside P2.

## Stage 4 - Prove Resolver Correctness

### Tasks

- [x] t18: Add focused fixtures covering all four resource types across provider-only, clean projection, explicit override, conflict, missing, invalid, and cross-platform path cases.
- [x] t19: Prove that identical inputs and fingerprints produce identical typed results and that unchanged valid evidence is reused rather than rerun.
- [x] t20: Run focused core tests, type checks, path-hygiene checks, and changed-file whitespace validation without inventing performance thresholds or universal sample counts.
- [x] t21: Obtain independent review of identity, precedence, mutation boundaries, and provenance; correct only actionable defects within the finite budget.
- [x] t22: Record the exact typed interfaces, validation evidence, remaining nonblocking items, and P3 handoff.

### Acceptance criteria

- Focused tests cover success, conflict, path escape, symlink, and typed failure behavior for every resource type.
- List/read remain read-only and ensure remains explicitly mutating.
- Independent review finds no unresolved material resolver or provenance defect.
- P3 can project one shared operation core without reimplementing business logic.

### Dependencies

- Stages 2 and 3 complete.
- Finite evidence and correction budget.

### Closeout Notes

- Testing-mode decision(s): deterministic unit and fixture testing plus independent contract review.
- Focused tests: `./node_modules/.bin/vitest run packages/cli/tests/resource-identity-provider.test.ts packages/cli/tests/resource-resolver.test.ts` passed 2 files and 70 tests.
- Focused type check: the new source and test files passed strict `tsc --noEmit` with the repository's ESNext and Bundler settings.
- Build: `npm run build -w packages/cli` passed.
- Repository-wide type check: `./node_modules/.bin/tsc -p packages/cli/tsconfig.json --noEmit` still reports baseline diagnostics in existing files outside P2. It reports no diagnostic in a P2 source or test file.
- Path hygiene: `python3 .make-docs/scripts/check_path_hygiene.py` passed with 82 checked files and zero errors.
- t19 trust behavior: Caller evidence cannot seed trust. The first valid use runs SHA-256. It records a bounded internal proof that binds resource identity, canonical path, all project evidence, provider facts, file fingerprint, and digest. Exact later reuse runs no SHA-256 when the caller evidence matches the proof and the fingerprint is stable before and after the byte read. Changed facts cause a new hash or a typed failure. A process restart safely runs a new hash because the proof is process-local.
- First independent review: FAIL. Forged caller digest evidence could hide changed managed bytes and could report a digest that did not match the returned bytes. Provider inventory exposed a shared mutable `Uint8Array`. Selected and ownership evidence did not have full runtime checks. A case-only disk path could satisfy a different canonical URI on a case-insensitive file system. `localeCompare` could change URI and provider-reference order by locale.
- First correction: Provider readers now return byte copies. The resolver verifies provider snapshots. Malformed selected and ownership evidence now fails with `invalid-project-evidence`. Project paths now require exact disk case. Provider inventory and resolved lists now use fixed code-unit order. All five reproductions pass.
- Second independent review: FAIL for t19 only. The forged-evidence defect was fixed, but the resolver still ran SHA-256 before it reported `digestSource` as `reused`. The test checked only the label and did not prove that the hash did not run again.
- Second correction: The resolver now uses the bounded internal proof described above. A hash-call observer test proves that the first valid use hashes once, exact reuse adds zero hash calls, and changed facts rehash or fail closed.
- Final independent review: PASS. No P0, P1, or P2 issue remains. All five first-review reproductions pass. The t19 hash-call proof passes. Focused strict TypeScript, CLI build, path hygiene, diff and whitespace, export, and P2-scope checks pass. The full CLI TypeScript check still reports only existing errors outside P2.
- Public identity interfaces: `isSystemResourceType(value: unknown): value is SystemResourceType`, `createSystemResourceIdentity(type: unknown, resourcePath: unknown): SystemResourceResult<SystemResourceIdentity>`, `parseSystemResourceUri(uri: unknown): SystemResourceResult<SystemResourceIdentity>`, and `canonicalSystemResourcePath(value: unknown): SystemResourceResult<string>`.
- Public provider interfaces: `loadSystemResourceProvider(input: LoadSystemResourceProviderInput): SystemResourceResult<SystemResourceProviderInventory>` and `loadInstalledSystemResourceProvider(): SystemResourceResult<SystemResourceProviderInventory>`.
- Public operation interfaces: `resolveSystemResource(uri: string, provider: SystemResourceProviderInventory, project: SystemResourceProjectContext): SystemResourceResult<ResolvedSystemResource>`, `listSystemResources(provider: SystemResourceProviderInventory, project: SystemResourceProjectContext): SystemResourceResult<SystemResourceList>`, `readSystemResource(uri: string, provider: SystemResourceProviderInventory, project: SystemResourceProjectContext): SystemResourceResult<SystemResourceRead>`, and `ensureSystemResource(input: EnsureSystemResourceInput): SystemResourceResult<SystemResourceEnsure>`. The bounded `packages/cli/src/operations/resource/index.ts` export provides these functions and the public types and constants in `types.ts`.
- P3 handoff: P3 can project the shared core through CLI and MCP surfaces without new resolver business logic. P3 also owns its registry and manifest-schema projection. This handoff does not authorize P3 implementation.
- Remaining nonblocking work: Later manifest and setup phases own persisted selection and provenance integration. Remote providers, custom tiers, configuration layout, caches, and migration remain outside P2.
- Candidate checkpoint: The earlier no-commit note recorded the P2 candidate state before owner acceptance. It is not the current phase state.
- Owner closeout: The owner accepted P2. Commit `6bf85e59d0da488a053c242cca9509849e0ae8cd` contains the P2 implementation and is present on `origin/make-docs-v2`.
- Lifecycle departure: This closeout correction and the missing P2 history record were added during P5 preflight. The P2 implementation commit did not include final closeout documents. This late record correction does not reopen P2 implementation.
- Phase / capability status: P2 is complete and owner-accepted. P3 and P4 later used the accepted P2 interfaces.
