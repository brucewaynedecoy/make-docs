---
title: "Conformance Dependency Probe"
kind: "playbook"
persona: "agent"
status: "accepted"
stack: "run"
summary: "Dependency fixture set for the W18 R9 dependency-check conformance scenario, exercising probe-based checks in both directions."
schema: "make-docs.playbook.v2"
workflowSchema: "make-docs.workflow.v1"
---

# Conformance Dependency Probe

This fixture is maintainer-only conformance input (W18 R9 P2, PRD 37 R-SCEN-1; PRD 40 R-DEP-3, R-FIX-1). Its dependency registry is the point: the entries are chosen so generated dependency checks can be proven to probe each entry's resolved `probe` — the declared value or the `id` default — and never its `source` prose.

## Purpose

Give the `codex-dependency-check-both-directions` scenario a fixture set covering both directions and the probe-versus-source distinction: dependencies that are present and must pass, one dependency that is deliberately absent and must be surfaced as missing, and one present dependency whose `source` prose does not begin with its binary name — a `Source`-derived check would probe the wrong token and fail, while the contract-correct probe-based check passes.

## When To Use

Only inside a W18 R9 conformance scenario run, in a disposable fixture workspace. Never install this Playbook into a real project.

## Inputs

Authority order for a probe run: explicit scenario spec direction first, then this document. The workflow consumes only the workspace's own toolchain; no repo state, user artifacts, or archived history.

## Dependencies

```playbook
dependencies:
  - id: git
    kind: cli
    requirement: required
    source: git from the platform toolchain; expected present in every fixture workspace
    used_by: [report-present-tools]
    fallback: stop; a workspace without git is not the environment under test
  - id: rg
    kind: cli
    requirement: required
    probe: rg
    source: ripgrep from your package manager — the source prose deliberately does not begin with the binary name, so a Source-derived check would probe the wrong token (PRD 40 R-FIX-1)
    used_by: [report-present-tools]
    fallback: stop with install guidance naming the rg binary
  - id: npm
    kind: package-manager
    requirement: required
    source: npm, distributed with Node.js
    used_by: [report-present-tools]
    fallback: stop with Node.js install guidance
  - id: absent-tool
    kind: cli
    requirement: required
    probe: make-docs-conformance-absent-probe
    source: a deliberately nonexistent binary; the missing-direction fixture that generated dependency checks must surface, never silently pass
    used_by: [report-missing-tools]
    fallback: report the missing probe target and stop — this is the expected path in the scenario's missing direction
```

## Workflow

```playbook
workflow:
  id: conformance-dependency-probe
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: report-present-tools
    title: Report the present-direction results
    executor: agent
    role: check
    activation: sequential
    mode: delegated
    uses: [git, rg, npm]
    instructions: Run the generated dependency checks for git, rg, and npm and report each probe target and outcome; all three must pass in the fixture workspace, including rg whose source prose names ripgrep.

  - id: report-missing-tools
    title: Report the missing-direction results
    executor: agent
    role: check
    activation: sequential
    mode: delegated
    uses: [absent-tool]
    instructions: Run the generated dependency check for the absent-tool entry and report that it surfaces make-docs-conformance-absent-probe as missing by its probe target, not by its source prose.
```

## Step Guidance

`report-present-tools` proves the passing direction and the probe-versus-source distinction: the `rg` check must succeed via the declared `rg` probe even though its provenance prose begins with "ripgrep". `report-missing-tools` proves the missing direction: the check must name the absent probe target explicitly rather than passing or failing vaguely.

## Gates

None. Both directions must be checkable unattended inside the scenario.

## Outputs

A transcript reporting, per dependency, the probe target checked and its outcome. The scenario's invoke assertions consume these reports as evidence; nothing is written to disk.

## Validation

The fixture is valid when `playbook.validate` reports zero errors, every generated check targets the entry's resolved probe (declared `probe` or `id` default), and the scenario observes both directions behave as declared.

## Packaging Notes

Packaged only by conformance scenarios, into disposable fixture workspaces, via the `plan`/`preview`/`write`/`ship` grammar. This fixture must stay out of the shipped template, the packaged copy, and npm tarballs with the rest of the repo-root `conformance/` family (R-KEEP-1, R-TEST-3).
