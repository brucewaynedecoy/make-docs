---
title: "W19 R2 Phase 5: Packaging, Validation, and Delta Handoff"
kind: "plan"
status: "draft"
coordinate: "W19 R2 P5"
---

# W19 R2 Phase 5: Packaging, Validation, and Delta Handoff

## Purpose

Assemble the authorized W19 R2 outputs, prove upstream/package/dogfood integrity, run proportional validation, and close with an explicit owner gate. This phase does not publish, release, deploy, execute product benchmarks, or promote support claims.

## Inputs

- Current validated PRD authority from Phase 1.
- Upstream resources and routers from Phase 2.
- Lifecycle, evidence, compatibility, and state integrations from Phase 3.
- Either the accepted optional validator output or an explicit `not-authorized`/`deferred` disposition from Phase 4.
- The owner-approved W19 R2 delta backlog, generated only after PRD maintenance.

## Package And Dogfood Proof

Validate the accepted mutation order:

`packages/docs/template/ -> generated packages/cli/template/ -> selected root dogfood -> installed-project proof`

Confirm:

- the four resource URIs resolve to the intended upstream bytes;
- package projection is generated rather than hand-edited;
- optional project-local snapshots and machine-installed fallback follow the W19 R1 precedence contract;
- prompt, contract, reference, and template remain peer types;
- router pairs are byte-consistent where required and contain only thin progressive-disclosure guidance;
- project-authored PRDs, results, work, and evidence do not enter shipped defaults; and
- performance results are not treated as package, release, conformance, or support authority.

## Focused Validation Matrix

Run only checks proportional to authorized changed surfaces:

| Surface | Proof |
| --- | --- |
| PRDs | PRD-authority validation, required headings/frontmatter, exact owner links, no duplicated target authority. |
| Resources | Contract/template/prompt/reference schema, URI/path coverage, link and anchor checks. |
| Routers | Pairing, managed blocks, line budgets, progressive-disclosure targets. |
| Lifecycle fixtures | Candidate dispositions, profile classes, finite budgets, outcomes, expiry/requalification, gates, and cross-mode separation. |
| Compatibility fixtures | Existing/modified/ambiguous content, no retroactive failure, no fabricated evidence. |
| Optional validator | Focused operation and CLI/MCP parity tests only when separately authorized. |
| Package/dogfood | Generated copy parity and selected installed-resource resolution. |
| Repository hygiene | Path hygiene, whitespace, diff allowlist, and no unexpected files. |

Do not run a full platform/environment benchmark matrix. Run broader package or implementation suites only when the later authorized code/resource changes require them.

## Finite Closeout Rules

- Each implementation phase declares its own finite correction and review limits in the backlog.
- Reuse unchanged validation evidence when inputs and fingerprints are materially unchanged.
- Retry only failed affected checks after a material change.
- Stop and escalate on exhausted budgets, diminishing returns, unsafe resource growth, or conflicting authority.
- Never retry benchmarks or package checks merely to obtain a favorable result.

## Delta Backlog Contract

The later work-generation stage creates exactly one directory, resolving the date to the actual date that work generation executes while preserving `W19 R2`:

`docs/work/<actual-execution-date>-w19-r2-performance-evidence-governance/`

Each phase cites current PRD 48 and exact consumer PRDs. The backlog preserves the plan's phase order, disjoint write scopes, optional validator gate, finite budgets, and acceptance criteria. It does not copy product targets from PRDs or silently promote engineering guardrails.

## Closeout Package

Present the owner with:

- branch, HEAD, worktree, and dirty state;
- exact changed files and generated copies;
- PRD decisions and history entries;
- resource identifiers and projection evidence;
- validation commands/results and any bounded waivers;
- unresolved findings, obligations, risks, and optional-validator disposition;
- proof that no benchmarks, support claims, publication, or deployment occurred; and
- the exact next lifecycle gate requested.

## Acceptance

- All authorized phases are complete or explicitly deferred/blocked with owner-visible reasons.
- Current PRDs remain the product authority.
- Shipped governance resources originate upstream and resolve through the accepted resource model.
- Evidence budgets, unchanged checks, expiry/requalification, outcomes, and non-sacrificable constraints are represented coherently.
- Package and dogfood proof does not promote a performance or support claim.
- The worktree contains only authorized changes and passes focused hygiene validation.

## Handoff

Stop at the owner implementation-acceptance gate. Commit, integration, push, publication, release, deployment, benchmark execution, and support-claim promotion each require separate authorization.
