---
title: "W22 R2 Phase 1 Evidence and Boundaries"
kind: "plan"
status: "active"
coordinate: "W22 R2 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-13-portable-checkout-adoption.md"
---

# Phase 1: Evidence and Boundaries

## Purpose

Test the reported second-machine state before changing current product requirements.

## Scope

Use a committed Store A project and a fresh clone with a configured Store B. Capture both Stores and the target path before setup. Run status and checkout registration preview before setup and after the reported blocked command. Record whether a checkout row exists without an installation ledger. Keep project bytes and git status under comparison. Reserve the after-adoption check for the implementation backlog.

Check the package source and hashes for the three named resources when their machine A bytes are available. If they are not available, record `unknown` and preserve them in the design and backlog. Compare the installed 2.0.6 command behavior with current checkout source before treating a source reading as package proof.

## Decision Gate

If the report reproduces, update D-050 from `Confirming` to `Open` with the exact evidence. If a reported detail differs, update the design and D-050 before PRD maintenance. Do not infer the cause of a differing resource from its filename. No live Store repair or project-file change belongs to this phase.

## Human Experience Evidence

Capture the exact human status, preview, dry-run, and blocked-apply messages. Record whether each names a usable next action. This is observation, not a claim about a person's lived experience.

## Output

Keep a bounded evidence note in the W22 R2 work package when it exists, or in D-050 until then. Carry unresolved facts into the PRD update as explicit limits.
