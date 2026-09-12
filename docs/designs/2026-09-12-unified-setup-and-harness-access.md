---
title: "Unified Setup and Harness Access"
kind: "design"
status: "active"
coordinate: "W19 R6"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "Put the settled setup, access, and harness-adapter model into current product authority before implementation."
  coordinate_handoff: "Carry W19 R6 as the next revision of the W19 Store, setup, and managed-agentics line."
---

# Unified Setup and Harness Access

## Purpose

Define one clear Make Docs setup model for projects, agent harnesses, optional Skills, and optional local system resources. The model must let people configure Store-backed agent work without claiming that all Make Docs commands need special access.

## Context

Make Docs now keeps required installation and recovery state in the global Store. The shared Store session gate lets normal Make Docs processes use the Store at the same time. It does not grant a restricted agent process access to the Store path.

Codex and Claude Code can expose Make Docs through MCP or through native command permission rules. Pi does not have built-in MCP support. Pi uses extensions for native tool exposure. Future harnesses can use other native methods.

The current project wizard still starts with document-type selection. Most users select all four document families. The same wizard mixes project setup, harness selection, Skills, and local system-resource copies without explaining their different effects.

These are separate decisions:

- Project routers and instructions tell an agent how to use Make Docs in one project.
- A harness connection lets an agent use Store-backed operations from a restricted task.
- A Skill improves discovery or guides a workflow. It is not a permission grant.
- A local system-resource copy lets an agent read that resource as a project file. It does not solve a Store access problem.
- `make-docs resource list` and `make-docs resource read` do not need the Store. They can run as normal read-only CLI commands inside a project sandbox.

The setup experience must make these facts clear. It must also preserve existing partial installations and existing user trust choices.

## Human Experience Intent

Impact: `direct`

Affected humans: People who install Make Docs, people who add Make Docs to a project, and people who rely on agents that use Make Docs.

Human goal or effect: Configure Make Docs once, understand each access choice, and start agent work without repeated sandbox failures or hidden machine changes.

Experience promises:

- The setup flow explains which choices change the computer, which choices change the project, and which Make Docs operations need Store access.
- A person can configure a selected harness without leaving project setup and starting another command.
- Resource reads stay available without MCP, command rules, extensions, or Store access.
- New projects receive Designs, Plans, PRD, and Work without a document-type question. Existing partial projects do not expand without clear approval.
- Codex and Claude Code offer their supported native connection choices. A future harness appears only after its exact native method passes admission and conformance.
- A repeated setup shows current state, drift, and exact planned changes. It does not silently broaden machine trust or rewrite user-owned configuration.
- A system change that succeeds remains valid if later project initialization fails. The next setup safely continues from the verified state.

Complexity kept out of the human path:

- People do not need to understand SQLite files, Store sessions, receipt schemas, harness configuration syntax, or adapter internals.
- People do not need to choose document capability dependencies for a normal new project.
- People do not need to know whether a read-only resource came from a project copy or the installed provider unless they ask for exact provenance.

Evidence required:

- Review the installed terminal flow for fresh setup, existing setup, partial setup, skipped system setup, drift, failure, and repeat use.
- Prove exact before-and-after files for Codex MCP, Codex rules, Claude Code MCP, and Claude Code rules in isolated homes.
- Prove that Store-free operations do not open a Store session and still work when the Store is absent, locked, or unreadable.
- Prove that Store-backed operations work from real Codex and Claude Code tasks for each supported connection method before the product claims support.
- Prove that system and project changes use separate receipts and that a later project failure does not undo a valid system change.

## Decision

### One state-aware setup entry

`make-docs setup` is the main project setup entry. It detects whether the project is new, current, partial, or in recovery. It then opens the same state-aware flow for initialization or reconfiguration.

`make-docs setup system` is the direct entry for machine-level harness support. Project setup can open the same system component inline when a selected harness lacks the requested machine setup.

`make-docs setup reconfigure` remains supported in this revision. It opens the same state-aware setup flow with the existing project state already selected. This package does not perform the wider command cleanup that the owner has deferred.

`make-docs setup skills` remains a focused shortcut. It uses the same Skill selection and lifecycle services as the unified setup flow. `setup backup` and `setup remove` remain separate lifecycle commands and do not become wizard steps.

### Project initialization defaults

A fresh project always enables Designs, Plans, PRD, and Work. The wizard does not ask for document types.

An existing partial installation keeps its current document set. Ordinary setup does not expand it. If the person asks to adopt the current complete project shape, review shows every new directory and router before approval.

Harness detection helps the person. It does not limit the list. Setup labels each harness as detected, not detected, or configured. It never treats a generated file as proof that the harness recognized or used it.

### Operation access contract

Every admitted operation declares the access it needs:

```ts
access: {
  store: "none" | "read" | "write",
  project: "none" | "read" | "write",
  hostConfig: "none" | "write"
}
```

The operation core uses this declaration before it opens a Store session or asks for permission. The same declaration drives native tool exposure, command-rule generation, setup explanations, and conformance checks.

The access classes are:

| Class | Store | Typical use | Special harness setup |
| --- | --- | --- | --- |
| Resource and project-file read | none | `resource.list`, `resource.read`, local config and document reads | Not required |
| Store observation | read | installation state, lifecycle state, recorded evidence | Required in a restricted task |
| Managed project work | write | setup-owned changes, recovery, evidence records, managed projections | Required in a restricted task |
| System administration | host config write | harness setup, tool update, machine uninstall | Human-controlled CLI only |

Store access, Make Docs access, and harness integration method are not synonyms. Setup and help text must not say that all Make Docs commands need Store access.

### Harness adapter contract

Make Docs has a small first-party harness adapter registry. Each admitted adapter declares detection, supported scopes, project router files, Skill roots, native connection methods, config readers and writers, safe review data, verification, and removal behavior.

Each selected harness uses one Store-backed connection method per scope. `none` is always available.

| Harness | Current connection choices | First delivery boundary |
| --- | --- | --- |
| Codex | MCP server or verified command rules | Deliver only methods that pass real Codex conformance. |
| Claude Code | MCP server or native permission rules | Deliver only methods that pass real Claude Code conformance. |
| Pi | First-party Make Docs extension | Do not claim or show current support until the extension passes admission and real Pi conformance. |

MCP is one adapter method. It is not the product architecture. Rules and extensions must call the same public operations and return the same meaning.

Command rules use the resolved Make Docs executable and the smallest admitted command prefixes. They do not approve a shell wrapper, a package runner, setup-system commands, update, uninstall, backup, or removal. MCP exposes only admitted tools and keeps its existing explicit write gate.

### Configuration and authority

| Surface | Purpose | Authority limit |
| --- | --- | --- |
| `~/.make-docs/config.json` | User-approved machine defaults and maximum allowed method for each harness | Records intent. It does not replace live harness configuration. |
| Harness-native configuration | Actual MCP, rule, permission, extension, or plugin registration | This is the live permission authority for that harness. |
| Store receipt | Exact applied entries, executable identity, content fingerprints, verification result, and drift state | Operational evidence only. |
| `.make-docs/config.yaml` | Project harness selection and a narrower project choice | Can inherit, narrow, or disable machine trust. It cannot grant new machine trust. |

Project harness settings use a new integration field. They do not reuse the retired Playbook-oriented `harnessCapabilities` field. The more restrictive valid setting wins.

Setup reads live harness configuration before it plans changes. It preserves unknown and user-owned entries. It changes only reviewed Make Docs-owned entries. A changed or missing owned entry becomes visible drift. Setup offers repair, adopt where proof permits, or leave unchanged.

### Review, apply, and recovery

The final review has two groups:

- This computer: changes under the harness home, the Make Docs Store, and other machine-level configuration.
- This project: routers, Skills, `.make-docs/config.yaml`, optional resource copies, and document directories.

Every system-wide write needs explicit approval. Project approval does not imply system approval.

System setup and project initialization are separate durable operations. Setup applies and verifies the system operation first. It then applies the project operation. A project failure does not roll back a valid system configuration. A repeat run reads both receipts and resumes from the first incomplete or drifted part.

Setup never retries a user-visible project mutation callback. It can retry only safe admission and contention cases under the existing Store rules.

### System resource placement

Resource placement appears under project initialization after harness choices. It is not part of harness permission setup.

The screen offers:

- Use installed Make Docs resources. Agents can use `make-docs resource`. Store access is not needed.
- Copy all system resources into this project. Agents can read the files directly.
- Choose resource types to copy: contracts, prompts, references, or templates.

Local copies remain managed projections with source and digest data. The installed provider remains the source of truth. This choice reduces CLI dependence for resource retrieval. It does not grant or remove Store permission.

### Compatibility and scope

The shared Store session gate remains the concurrency baseline. This design does not add another Store lock, local Store, service process, project undo path, or database schema change solely for setup.

Old installations keep their selected document set, harnesses, Skills, and resource projections until a reviewed change. Existing global and harness files are inputs to classification. They are not automatic ownership proof.

This package does not perform general CLI command-tree cleanup. It does not move backup or removal. It does not add Pi support without its first-party extension and conformance evidence. It does not allow project config to grant machine permission.

## Alternatives Considered

### Require MCP for every harness

Rejected. Some harnesses do not support MCP. The product contract must fit native harness capabilities.

### Give agents direct Store path access

Rejected. Broad path access exposes more state than the operation requires. It also moves security policy away from the harness's native control.

### Generate one broad executable rule

Rejected. A rule for every Make Docs command would include human-only system and removal actions. Rules must cover only the smallest admitted prefixes for the selected Store-backed features.

### Treat local resources as the permission solution

Rejected. Resource reads do not need Store access. Local copies improve portability and direct file access, not Store permission.

### Keep document-type selection

Rejected for new projects. The choice adds thought without useful variation for the normal adoption base. Existing partial projects remain stable.

### Put system setup in a separate command only

Rejected as the only path. A direct system command is useful, but project setup must be able to complete a missing machine choice inline.

### Roll back system setup when project setup fails

Rejected. A verified machine configuration can serve other projects. Removing it would create a new cross-project undo risk.

## Consequences

- Setup becomes longer only when a person selects a harness and asks for Store-backed features. The normal path removes the document-type question.
- The implementation must maintain first-party adapters for each supported harness method.
- Real harness conformance becomes a release condition for each method shown as supported.
- Project config can make a project safer than the machine default. It cannot make it more permissive.
- Exact access metadata reduces accidental Store use and keeps resource reads independent.
- Separate system and project receipts make failure recovery clear without cross-scope rollback.
- Deferred command cleanup remains possible because all setup entries use one internal setup model.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Store-Owned Installation and Migration State](2026-09-09-store-owned-installation-and-migration-state.md), [First-Party Skills and Managed Adoption](2026-09-09-first-party-skills-and-managed-adoption.md), [Shared Agentics Native Harness Exposure Correction](2026-06-27-shared-agentics-native-harness-exposure-correction.md), and [CLI Command Reorganization and Operation Registry](2026-07-01-cli-command-reorganization-and-operation-registry.md)
- Reason: This design keeps their Store, operation, Skill, and native-path safety rules. It adds the missing user setup and harness permission model.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: Existing setup, configuration, operation, resource, Store, and harness PRDs already own this behavior and need surgical updates before implementation.
- Coordinate Handoff: Carry `W19 R6` as the next revision of the W19 R3 through R5 Store, setup, and managed-agentics line.
