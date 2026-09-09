# Phase 05 — Artifacts Seed Directory

## Purpose

Sanction an optional `docs/artifacts/` directory: a zero-contract home for
free-form, pre-design inputs (ideas, notes and transcripts, back-of-napkin
designs, specs, diagrams, schema sketches, requirements) that hydrate the
downstream pipeline. This is how make-docs accommodates ideation and
architecture — as an *input surface*, not as contract-bound stages.

## What to build

- Reference and router mentions: the lifecycle anchor and the planning workflow
  cite `docs/artifacts/` as a *recommended input source* ("if present, read it
  to hydrate the design and plan"), never as a gate.
- A light `AGENTS.md`/`CLAUDE.md` router for the directory, used only if it is
  installed: free-form seed inputs; agents may read them to inform downstream
  docs; nothing here is authoritative or contract-bound.
- The planning workflow reads `docs/artifacts/`, generalizing the prior
  architecture-seed idea; "architecture" docs are one kind of artifact, not the
  directory's name.

## Key decisions

- Optional (it may be absent; nothing downstream depends on it).
- Zero contract on contents (no required headings, naming, or structure).
- The name `artifacts` is chosen for domain-neutral flexibility; "architecture"
  over-signals technical structure.

## Acceptance criteria

- Contracts and routers reference `docs/artifacts/` as an optional recommended
  input.
- A light router exists for the directory. No required-stage semantics are
  introduced. No placeholders remain.

## Dependencies

Referenced by the anchor (02) and the planning workflow.
