---
title: "Pre-W18 PRD Conformance Audit"
kind: "history"
status: "completed"
date: "2026-07-04"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Ran the bounded read-only conformance audit of PRDs 19–33 that D-019 called for: one live user-facing break (shipped lifecycle skills invoke the removed operations surface), one unwired subsystem cluster (plugin substrate, metadata drift validator, guide persona validation), ten PRDs substantially evidenced, and the register updated with D-020 and D-021."
---

# Pre-W18 PRD Conformance Audit

## Changes

This session executed the bounded pre-W18 PRD conformance audit that [D-019](../../../prd/03-open-questions-and-risk-register.md) called for: a read-only sweep of the PRD 19–33 MUST requirements against implementation evidence in the current tree. No code, contract, or template files were changed; the deliverables are this record and two new register items. The audit's motivating premise held: unimplemented mandates from the pre-W18 implementing-agent era cluster, and every pre-W18 backlog claims 100% completion — including the three lineages with proven gaps below — so era checkbox state is not acceptance evidence; code is.

**Method.** For each of PRDs 19–33, the MUST-level requirements were enumerated and checked against the shipped surfaces: the CLI parser and operation registry, the MCP tool derivations, the template package, the skills package and registry, the installed dogfood instance, and the focused test suites. Where a PRD carried embedded closeout evidence (PRDs 25, 27, 28, 29, 32, 33), that evidence was spot-checked against the tree rather than re-derived. Import graphs were used to distinguish "landed and consumed" from "landed and unwired."

### Findings

**F1 (high, user-facing, live — register item D-020).** All four shipped lifecycle skills (`packages/skills/{closeout-commit,closeout-phase,work-on-wave,work-on-phase}/` — `SKILL.md` plus workflow references) instruct agents to run ten distinct `make-docs operations ...` subcommands, across 43 invocation lines, on a command surface W18 R11 removed: `packages/cli/src/cli.ts` parses only `setup`/`run`/`mcp`/`update`/`uninstall`, and the registry assembles only `playbook.*`, `package.*`, and `work.*` operations. The backing closeout/lifecycle functions (`probeCloseout`, `checkpointPhase`, `gatePhase`, `guardPhaseScope`) remain exported from `packages/cli/src/operations/index.ts` with no importer outside `operations/` — dead code. W18 R11's disposition said this logic is rebuilt as Playbooks, but `docs/assets/playbooks/` ships only `agent/make-docs-lifecycle`. This violates PRD 26's own acceptance bar (no selected first-party skill requires a missing script or a missing CLI replacement at any acceptance checkpoint) and realizes the R-014 break window as current shipped behavior. Side evidence: `packages/skills/*/scripts/*.py` remain in-tree though the registry ships no script assets. Fix direction pending: pull the four skills from the shipped registry, rewrite them against current surfaces, or land the promised playbook replacements.

**F2 (medium, internal — register item D-021).** The PRD 30 plugin substrate (`packages/cli/src/plugin-substrate/` — catalog, validation, workflow bundles, types) has zero production importers; only its three test files touch it, and `selectedPlugins` is always empty across manifest, profile, and audit. PRD 30 defers the selection flow, so the missing install UX conforms — but full unwiring means the PRD 28/32/33 inheritance legs (generated plugin and skills-bundle outputs installed through selected agentics sharing ownership and lifecycle) have no executable path: W18 R8 compiles the distributables and nothing can install them through the agentics store. The W18 R2 backlog claims 33/33 complete.

**F3 (medium, internal — register item D-021).** PRD 23's document-metadata drift validation (`packages/cli/src/document-metadata.ts`: `parseDocumentMetadata`, `extractIntendedFollowOn`, `validateGeneratedDocumentMetadata`) is consumed only by its own test — no operation, command, or MCP tool wires it, so the YAML/body handoff-drift acceptance criterion can never trigger in a real workflow. No disposition records whether the W18 R11 NORTHSTAR filter intends this as future Playbook territory.

**F4 (low, docs tooling — register item D-021).** PRD 22 mandates persona path/frontmatter drift validation for guide and playbook documents alike; it exists for playbooks only (persona inferred from the directory in `packages/cli/src/playbook/detection.ts`), and no equivalent covers `docs/assets/library/**` guides.

### Per-PRD verdicts

| PRD | Verdict |
| --- | --- |
| [historical closeout](2026-06-25-w10-r4-p4-validation-and-closeout.md) (retired action-PRD: `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`) | Substantially evidenced. |
| [historical closeout](2026-06-25-w10-r5-p4-validation-and-closeout.md) (retired action-PRD: `docs/prd/20-revise-agent-harness-model-conformance-lab.md`) | Substantially evidenced; the PRD 20/37 conformance tuple registry is an unexecuted-by-design backlog correctly sequenced behind W18 R9, not drift. |
| [historical closeout](2026-06-24-w9-r2-p4-validation-closeout.md) (retired action-PRD: `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`) | Gap (custom tiers never created) — already tracked as D-019; no new drift beyond it. |
| [historical closeout](2026-06-24-w9-r3-p4-package-parity-closeout.md) (retired action-PRD: `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`) | Substantially evidenced, except F4: guide persona drift validation is missing. |
| [historical closeout](2026-06-25-w16-r1-p4-package-parity-and-closeout.md) (retired action-PRD: `docs/prd/23-revise-generated-metadata-lifecycle-handoffs.md`) | Gap — F3: drift validator built, never connected. |
| [historical closeout](2026-06-25-w16-r2-configuration-convention-overlay-wave-closeout.md) (retired action-PRD: `docs/prd/24-revise-configuration-convention-overlay.md`) | Substantially evidenced; the config documentation gap is already D-017/Q-018. |
| [historical closeout](2026-06-25-w10-r6-p4-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`) | Substantially evidenced (spot-checked against embedded closeout evidence). |
| [historical closeout](2026-06-26-w16-r3-no-scripts-migration-skill-refactor-closeout.md) (retired action-PRD: `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`) | Break — F1: the shipped skills fail its own acceptance bar; gaps beyond F1 already tracked as D-019. |
| [historical closeout](2026-06-26-w17-r1-p4-lifecycle-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md`) | Substantially evidenced (spot-checked against embedded closeout evidence). |
| [historical closeout](2026-06-27-w17-r2-p4-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`) | Substantially evidenced (spot-checked), except its plugin-inheritance leg is stranded by F2. |
| [historical closeout](2026-06-29-w18-r1-p4-template-package-lifecycle-closeout.md) (retired action-PRD: `docs/prd/29-revise-playbook-contract-run-playbook.md`) | Substantially evidenced (spot-checked against embedded closeout evidence). |
| [historical closeout](2026-06-29-w18-r2-wave-closeout-and-manual-test-coverage.md) (retired action-PRD: `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`) | Gap — F2: the substrate landed as unwired dead code; the deferred selection flow itself conforms. |
| [historical design](../designs/2026-05-28-coverage-pass-contract-and-skill-evolution.md) (retired action-PRD: `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md`) | Unexecuted-by-design backlog correctly sequenced, not drift. |
| [historical closeout](2026-06-27-w17-r4-lifecycle-backup-state-and-agentics-pruning.md) (retired action-PRD: `docs/prd/32-revise-lifecycle-backup-state-agentics-pruning.md`) | Substantially evidenced (spot-checked), except its plugin-inheritance leg is stranded by F2. |
| 33 (retired action-PRD: `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`) | Substantially evidenced (spot-checked), except its plugin-inheritance leg is stranded by F2. |

### Patterns

1. **Library without wiring is the era's signature failure.** Code plus focused tests land, checkboxes and suites go green, and no product surface consumes the module (F2, F3, and the F1 dead exports). Future verification must demand a reachable-surface proof — a named product surface that consumes the behavior — not just passing tests.
2. **Supersession cascades break consumers.** W18 R11 pruned the `operations` surface without the consumer sweep PRD 26 itself mandates; the four skills were rewritten once (W16 R3) and never re-swept, turning the R-014 risk into shipped behavior.
3. **Pre-W18 backlog completion state is unreliable.** Every era backlog claims 100% completion, including the three lineages with proven gaps; code is the evidence.

### Register disposition

| Area | Summary |
| --- | --- |
| Risk register | Added D-020 (F1: shipped lifecycle skills instruct the removed `make-docs operations` surface, with the pull/rewrite/playbook-replacement decision pending and the consumer-sweep rule) and D-021 (F2+F3+F4 as unwired or partially wired subsystems, with the wire-or-retire close bar); both carry the reachable-surface-proof verification rule in their Recommendation cells. Clean results and unexecuted-by-design verdicts are recorded here only, not as register items. |
| Implementation | None — deliberately. Read-only audit; no code, contract, or template files were changed this session. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Added D-020 and D-021 capturing the audit's live skill-surface break and the unwired-subsystem cluster, with cross-links to R-008, R-014, D-019, and PRDs 22/23/26/28/30/32/33/39. |

### Developer

None this session.

### User

None this session.
