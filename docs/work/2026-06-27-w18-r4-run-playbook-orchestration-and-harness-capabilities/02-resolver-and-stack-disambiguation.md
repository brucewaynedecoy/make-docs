# Phase 2: Resolver and Stack Disambiguation

## Purpose

Make playbook selection deterministic before any runner executes a valid playbook.

## Overview

Implement resolver and catalog requirements that keep `persona/slug` as the identity and `stack` as the metadata discriminator.

## Source PRD Docs

- [29 Revise Playbook Contract Run Playbook](../../prd/35-run-playbook-state-machine-and-portability.md#requirements)
- [23 Revise Generated Metadata Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)

## Stage 1 - Resolver Contract

### Tasks

- [x] t1: Keep playbook filesystem paths at `docs/assets/playbooks/<persona>/<slug>.md`.
- [x] t2: Resolve explicit paths before catalog refs.
- [x] t3: Resolve `persona/slug` as the canonical catalog identity.
- [x] t4: Allow bare slug or title only when it maps to exactly one candidate.
- [x] t5: Require requested-stack validation before execution.

### Acceptance criteria

- Bare ambiguous refs fail closed with a persona/stack disambiguation message.
- Stack mismatch fails before authority loading or procedure execution.
- Catalog output includes persona, slug, stack, title, and summary.

### Dependencies

- Phase 1 PRD reconciliation.
