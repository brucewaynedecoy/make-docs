# References Directory

This directory contains normative references that govern how agents design, plan, execute, and validate document generation workflows.

## Purpose

Reference documents define **rules and workflows** — they are not templates and not outputs. Agents should consult these files before and during design creation, plan creation, PRD generation, and work backlog generation to ensure consistent, contract-compliant results.

## Files

- `design-workflow.md` — Step-by-step workflow for turning a request into one or more design docs.
- `design-contract.md` — Required structure and handoff contract for generated design docs.
- `output-contract.md` — Required paths, naming rules, section contracts, and structural constraints for all generated plan, PRD, and work documents.
- `planning-workflow.md` — Step-by-step workflow for producing a reviewable plan before execution begins.
- `execution-workflow.md` — Step-by-step workflow for generating an approved PRD set and work backlog.
- `prd-change-management.md` — Rules for additive PRD changes, revisions, removals, and non-destructive baseline annotations.
- `harness-capability-matrix.md` — Environment capability detection and safe defaults for MCP access and agent delegation.

## Agent Instructions

- Read `design-workflow.md` and `design-contract.md` when the user wants to turn a request into a design doc or update an existing design doc.
- Read `output-contract.md` before generating or validating any document to confirm required paths, headings, and structural rules.
- Read the relevant workflow (`planning-workflow.md` or `execution-workflow.md`) before starting that phase.
- Read `prd-change-management.md` when the user wants to add capabilities or revise, deprecate, or remove established requirements in the active PRD namespace.
- Consult `harness-capability-matrix.md` when determining delegation tier or MCP availability.
- Do not modify files in this directory unless explicitly asked to update a reference.
