---
title: "Static Harness Adapters and Conformance Retirement"
kind: "design"
status: "active"
coordinate: "W19 R6 P3"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "Replace the retained Playbooks conformance model with the small static harness setup contract that the current product needs."
  coordinate_handoff: "Use W19 R6 P3 for the authority reset, product correction, and acceptance work."
---

# Static Harness Adapters and Conformance Retirement

## Purpose

Set the current product authority for harness setup.

Make Docs will use built-in, static adapters for known harnesses. It will not use the old Playbooks conformance engine to decide if a setup method is available.

This design also defines how P3 must keep useful P1 and P2 work while it removes work that exists only for the old engine.

## Context

The current user need is small. The CLI must find known harnesses. It must show the safe setup methods that Make Docs owns for each harness. It must then plan, write, verify, repair, or remove only the native entries that the person reviewed.

PRDs 20, 43, and 44 came from the removed Playbooks product. They defined dynamic conformance. Dynamic conformance means that a separate engine measured many facts and then promoted exact support claims.

P2 treated that old system as current setup authority. The implementation then required an exact tuple, a shipped result registry, a lab bootstrap, a provider or model value, a runtime value, and a matching harness version. Tests enforced those rules because the active PRDs and the accepted P2 plan required them.

Those tests were not random. They were correct tests for the wrong product contract.

The wrong contract caused a false product gap. Normal setup could not select a safe method unless it supplied facts that ordinary setup does not need. Adding discovery for those facts would make the old engine larger. It would not fix the authority error.

P3 corrects the authority first. It then reduces the product to the current need.

## Human Experience Intent

Impact: `direct`

Affected humans: People who set up Make Docs for Codex or Claude Code in new or existing projects.

Human goal or effect: Select a safe built-in harness method and understand its computer, project, and Store effects before approval.

Experience promises:

- Setup finds known Codex and Claude Code installs without asking for model, provider, runtime, scenario, or tuple facts.
- Setup shows only the built-in methods that Make Docs can safely own.
- The review names the files, entries, Store operations, and access limit for the selected method.
- MCP works for Codex and Claude Code. Narrow Codex command rules work when the harness can enforce them.
- Setup preserves user-owned native settings and gives one clear action for current, drifted, blocked, failed, and repeat states.
- Store-free resource reads work without a Store session, caller identity, MCP setup, or rule setup.

Complexity kept out of the human path:

- Dynamic capability discovery, result promotion, registries, tuples, lab sessions, provider facts, model facts, and runtime facts.
- Pi support, broad home access, per-harness Skill sets, and a new Store design.

Evidence required:

- Direct static adapter contract tests.
- Disposable Codex and Claude Code operation checks.
- The installed setup state matrix.
- A six-promise Human Experience Review by the owner or maintainer.

## Decision

### Reset active authority

PRDs 20, 43, and 44 will leave the active PRD set. They describe a removed product system. Git history will preserve their past meaning. P3 will not create an archive copy unless the owner gives separate archive approval.

Current setup and harness requirements will move to their existing owners:

- PRDs 07 and 39 own setup flow and command behavior.
- PRD 28 owns built-in harness adapters and native entries.
- PRD 25 owns Store access, caller identity, and shared operation behavior.
- PRD 24 owns project harness intent.
- PRD 50 owns proportionate test and review rules.
- PRDs 10 and 16 own package and release checks.

P3 will update PRD 00 for the active set. It will update D-033 to record the invalid retained authority and the new close proof.

### Use static harness adapters

Each supported harness has a product-owned adapter in source code. The adapter declares:

- a stable harness id and display name;
- executable and native configuration detection;
- native configuration paths;
- supported setup methods;
- the native entries that Make Docs owns;
- the allowed Store operations for each method;
- plan, apply, verify, repair, and remove behavior;
- safety blockers and one useful next action.

Detection answers local questions. It can report if the harness executable or native configuration exists. It can read a harness version when a native format needs a version check. A version check is a fixed adapter rule. It is not a dynamic support claim.

The adapter does not discover general harness capabilities. It does not select a scenario tuple. It does not use a provider, model, or runtime value to unlock setup. It does not promote a result into a registry.

The first supported adapters are Codex and Claude Code.

### Keep one unified setup service

One setup service must serve interactive project setup, `setup system`, dry-run, non-interactive use, JSON output, and the internal MCP-safe result projection.

The project flow keeps this order:

1. Project state.
2. Harness selection.
3. One method and Skills screen for each selected harness.
4. Resource placement.
5. Grouped computer and project review.
6. Machine apply and verification.
7. Project apply and verification.
8. One final result.

Skills stay one project-wide selection. `setup system` starts at the harness method screens. It must not change project files or project Skills.

The method flags remain:

- `--codex-method <none|mcp|command-rules>`
- `--claude-code-method <none|mcp|permission-rules>`
- `--json`

An explicit method selects that harness. `none` disables it for the project. `--yes` approves a complete plan. It does not choose a method. Dry-run and apply must resolve the same state and plan.

### Keep the access and safety rules

MCP must keep caller identity in the managed server entry.

Rule routes must prove a native harness launch fact. An executable path or environment value alone cannot grant Store access.

Codex rules must use the verified executable and the smallest allowed operation prefixes. The allowed command must leave the restricted sandbox. Other commands must not gain that access.

Claude Code permission rules and sandbox file access are separate checks. Permission rules stay unavailable when narrow Store access cannot pass.

No method may add broad home or `~/.make-docs` access.

Store-free `resource list` and `resource read` must not open a Store session. They must not require caller identity.

The Store session gate, retry limits, receipts, ownership rules, pending operations, and recovery rules remain in force.

### Preserve project intent safely

Setup must preserve YAML comments, key order, quoting, unknown keys, and unrelated values.

It changes only reviewed `harnessIntegrations` entries. A selected method writes `narrow`. An explicit `none` writes `disable`. An excluded harness keeps its current value.

The project write occurs after machine verification and project approval. A later project failure uses the current pending-operation and resume rules.

### Classify the P2 implementation before editing it

P3 must review the current P2 diff by file and by changed block.

Keep these parts when they meet current authority:

- the unified setup service;
- interactive and machine-only setup;
- method flags;
- JSON and non-TTY output;
- dry-run parity;
- the YAML-preserving config writer;
- `harnessIntegrations`;
- native config writers;
- receipts, ownership, pending state, and recovery;
- Store-free reads;
- MCP caller identity;
- bounded rule generation.

Rework these parts:

- `packages/cli/src/setup-system.ts`;
- `packages/cli/src/harness-access/contract.ts`;
- method availability labels and repeat-state results;
- tests that bind valid setup behavior to the old registry.

Trace and remove these parts when no current owner remains:

- the packaged tuple registry;
- provider, model, runtime, and scenario facts in setup;
- tuple match and result promotion logic;
- the setup support lab and provisional bootstrap;
- conformance kit and result ingestion commands;
- synthetic tuple tests and registry promotion evidence;
- `packages/cli/src/conformance/**`;
- conformance-only scripts and test fixtures;
- the root `conformance/**` product tree.

P3 must not delete a shared utility only because it is under a conformance path. It must first prove that no current non-Playbook owner uses it.

### Correct current documentation without rewriting history

P3 must classify every link to PRDs 20, 43, and 44.

Current PRDs, guides, setup docs, package docs, and active work must stop using them as authority. Historical plans, designs, and evidence may keep their original meaning. A broken historical link may point to a clear retirement record, but its old claim must not become current authority.

### Use proportionate acceptance

P3 replaces tuple promotion with direct product checks.

Automated tests must prove harness detection, explicit method choice, config preservation, safe native writes, repeat state, recovery, Store-free reads, and package behavior.

Disposable real-harness checks must prove Codex MCP, Claude Code MCP, Codex narrow rules, and direct resource reads. Claude Code permission rules pass only if the harness can enforce narrow Store access.

The installed setup matrix must cover fresh, current, partial, no-method, unsupported, drifted, blocked, failed, recovered, and repeat states.

Human Experience Review must record the observation, conclusion, limits, and next action for each promise. Automated checks cannot replace that review.

## Alternatives Considered

### Complete the dynamic conformance engine

Rejected. It solves a removed Playbooks need. It adds setup facts and proof stages that the current product does not need.

### Keep the registry behind static setup choices

Rejected. A hidden registry would still be a second support authority. It would still create release and drift work with no user value.

### Support MCP only

Rejected. Codex can use narrow command rules when the native sandbox contract is proved. The adapter must still keep that method small and safe.

### Give every rule route broad Store access

Rejected. This breaks the least-access rule and the W19 R3 Store boundary.

## Consequences

Setup becomes smaller. It no longer asks for provider, model, runtime, scenario, or evidence identity.

Support decisions become release-bound source code. A Make Docs release can add or change an adapter after direct tests and real-harness smoke checks pass.

The product loses dynamic claim promotion. This is intentional. Make Docs supports the methods that its shipped adapters implement and test.

Harness updates can still cause drift. Release work must test the current native format. A same-version harness change can still break a method. The adapter must then report blocked or drifted state with one next action.

Removing the old engine has a wide documentation effect. Many links are historical. P3 must not rewrite their past meaning.

The current P2 diff mixes valid and invalid work. P3 needs a careful keep, rework, or remove review. Broad file deletion is not safe.

## Design Lineage

This design supersedes the conformance parts of [Unified Setup and Harness Access](./2026-09-12-unified-setup-and-harness-access.md). It keeps that design's setup, access, safety, config, and recovery goals.

It keeps the Store boundary from [Store-Owned Installation and Migration State](./2026-09-09-store-owned-installation-and-migration-state.md).

It keeps the Skill ownership boundary from [First-Party Skills and Managed Adoption](./2026-09-09-first-party-skills-and-managed-adoption.md).

P1 remains an incomplete foundation attempt. P2 remains evidence of work performed under invalid retained authority. Neither phase is accepted feature delivery.

## Intended Follow-On

This handoff is advisory-default-but-overridable. The P3 plan and backlog define the next work. This design does not authorize that implementation.

- Route: `change-plan`
- Next Prompt: `make-docs://system/prompt/designs-to-plan-change.prompt.md`
- Why: Replace the retained Playbooks conformance model with the small static harness setup contract that the current product needs.
- Coordinate Handoff: Use W19 R6 P3 for the authority reset, product correction, and acceptance work.
