---
title: "W19 R2 Phase 2: Governance Resources and Routing"
kind: "plan"
status: "draft"
coordinate: "W19 R2 P2"
---

# W19 R2 Phase 2: Governance Resources and Routing

## Purpose

Deliver the minimum documentation-first system-resource set that exposes PRD 48's accepted governance without duplicating policy across templates or routers. This phase authors upstream first and consumes the accepted [sibling resource boundary](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md).

## Preconditions

- Phase 1 PRD authority has passed review and validation.
- A separately authorized W19 R2 work backlog owns the exact changed files and validations.
- W19 R1 has landed or otherwise made the target system-resource layout authoritative.
- The worker verifies that no current old-path resource would become a duplicate authority.

## Resource Catalog

Create these logical resources at their upstream `packages/docs/template/.make-docs/system/` counterparts:

| Type | URI | Responsibility |
| --- | --- | --- |
| Contract | `make-docs://system/contract/performance-evidence-governance.md` | Governing applicability, authority, profile, evidence, budget, outcome, expiry, and escalation contract. |
| Prompt | `make-docs://system/prompt/performance-coverage.prompt.md` | Bounded candidate inventory and dual-disposition starter for design/plan/PRD/work/closeout coverage. |
| Reference | `make-docs://system/reference/performance-evidence.md` | Progressive explanatory reference for qualification, target classes, fingerprints, outcomes, and common failure modes. |
| Template | `make-docs://system/template/performance-evidence-profile.md` | Progressive `PERF-###` profile and result linkage shape. |

Prompts are peers of contracts, references, and templates. Do not place the prompt under a reference namespace. Optional local projections use `.make-docs/system/{contracts,prompts,references,templates}/`; machine-installed resolution remains valid when no project-local snapshot exists.

## Contract Content

The contract is the single reusable detailed policy source. It includes:

- applicability, maturity, and target-class decisions;
- canonical owner/location rules by class;
- profile versioning and supersession;
- measurement and comparability fields;
- non-sacrificable constraints;
- finite budgets, unchanged checks, diminishing returns, and evidence reuse;
- normalized outcomes and escalation;
- expiry, waiver, and one-execution requalification semantics;
- cross-mode boundaries; and
- repository/state authority limits.

It links to current PRDs rather than copying their separate UAT, conformance, obligation, support, or state contracts.

## Progressive Profile Template

The template begins with a short applicability gate. If disposition is `not-needed`, `reject-unsupported`, or a deferred `O-###` outcome, it does not expose executable profile fields. For executable candidates it captures all PRD 48 fields, but never supplies example numbers that could be mistaken for defaults.

The template distinguishes:

- PRD-owned hard profiles;
- approved plan/work engineering guardrails;
- bounded characterization or experiment profiles;
- product target source versus phase budget;
- raw evidence versus normalized result;
- current result versus expired history; and
- first qualification within a newly authorized requalification event versus prohibited unchanged repeats.

## Coverage Prompt

The prompt inventories quantitative and absolute performance candidates, then records both:

1. a base maintenance action: `create`, `update-existing`, `link-only`, or `none`; and
2. a performance applicability disposition from PRD 48.

It rejects naked numbers, copied benchmarks, unsupported absolute language, stricter work criteria than product authority, materially unchanged reruns, expired current-use claims, and silent correctness trade-offs. It asks only decision-relevant questions and stops when finite review limits are reached.

## Routers And Template Touchpoints

Routers remain thin. Relevant `AGENTS.md`/`CLAUDE.md` managed blocks point to the contract and load the prompt/template only when a performance candidate exists. Do not copy the detailed policy into:

- root or directory routers;
- design, plan, PRD, or work templates;
- lifecycle references;
- skills or optional agentics; or
- CLI/MCP help.

Lifecycle-facing templates add only an applicability question, a canonical profile link, finite budget/stop references, and outcome/evidence handoff fields. They do not prefill targets, universal counts, or statistical recipes.

## Upstream And Projection Order

1. Author the four resources and router links in `packages/docs/template/`.
2. Validate resource identifiers, path coverage, frontmatter, and managed-block pairing.
3. Update catalog/manifest expectations only if the authorized work backlog includes the accepted W19 R1 resource model.
4. Generate the package projection through the maintained copy/prepack path; never edit `packages/cli/template/` by hand.
5. Deliberately dogfood only the selected target resources and routers after review.
6. Prove optional-local and machine-installed resolution without requiring a full project-local snapshot.

## Acceptance

- Exactly one detailed contract exists.
- The four peer resource types use stable URIs and target paths.
- The template provides full fields only after applicability activation and contains no arbitrary defaults.
- Routers and lifecycle templates are concise, paired, and progressively disclose policy.
- Old-path resources do not remain as parallel current authority.
- Package projection and dogfood copies derive from upstream bytes.
- Focused documentation, router, path, link, and representative-fixture validation passes.

## Handoff

Phase 3 connects these resources to lifecycle execution, evidence, state, compatibility, and adjacent proof modes. Resource delivery alone does not authorize running a profile or claiming performance support.
