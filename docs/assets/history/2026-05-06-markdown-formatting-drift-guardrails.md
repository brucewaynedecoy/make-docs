---
date: "2026-05-06"
summary: "Added Markdown formatting drift guardrails, cleanup-docs, and report-only checker coverage."
---

# Markdown Formatting Drift Guardrails

## Changes

Added Markdown formatting drift guardrails across the project and packaged template, introduced the `cleanup-docs` skill with Codex and Claude Code mirrors, and registered the skill with focused installer, catalog, registry, and checker validation.

| Area | Summary |
| --- | --- |
| Contracts | Added source-formatting guidance that discourages hard-wrapped prose and requires blank separation between lists and following paragraphs. |
| Skills | Added the packaged `cleanup-docs` skill with project mirrors for Codex and Claude Code. |
| Validation | Added a report-first Markdown style checker with focused tests for hard-wrap, list-spacing, ignored Markdown structures, JSON output, and conservative fix mode. |
| CLI | Registered `cleanup-docs` in the packaged skill registry and updated installer/catalog tests for default skill selection and legacy manifest behavior. |

No novel gaps were found. The active PRD risk register already tracks broader skill-authoring guidance under `docs/prd/03-open-questions-and-risk-register.md#d-010-skills-authoring-and-release-guidance-is-thin-relative-to-runtime-dependence`; this change adds one concrete skill and validation surface without closing that broader follow-up.

Validation passed with focused CLI tests, Python checker tests, mirror parity checks, the new checker against touched docs, and `git diff --check`. Commit message drafting used `docs/assets/references/commit-message-convention.md` and this history record as the source.

## Documentation

### Project

| Path | Description |
| --- | --- |
| `docs/AGENTS.md` / `docs/CLAUDE.md` | Added the router-level Markdown source-formatting rule. |
| `docs/assets/references/output-contract.md` | Added the canonical Markdown source-formatting contract. |
| `packages/docs/template/docs/**` | Updated installed template router and output-contract surfaces to carry the same formatting rule. |
| `packages/skills/cleanup-docs/SKILL.md` | Added the new cleanup workflow skill. |

### Developer

None this session.

### User

None this session.
