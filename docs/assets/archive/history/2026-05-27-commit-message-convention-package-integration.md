---
date: "2026-05-27"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Integrated the commit-message convention package so commit drafts require subject-plus-body output."
---

# Commit Message Convention Package Integration

## Changes

Integrated the commit-message convention package by updating the managed convention reference to require one fenced `text` block containing a subject line, one blank line, and one body paragraph; synced the shipped template copy, refreshed the managed manifest hash, and added a consistency test that guards the dogfood and packaged convention copies plus the required body-output rules.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../../.make-docs/contracts/system/commit-message-convention.md](../../../../.make-docs/contracts/system/commit-message-convention.md) | Requires full subject-plus-body commit-message drafts and documents fallback body generation from the actual diff. |
| [../../../../packages/docs/template/.make-docs/contracts/system/commit-message-convention.md](../../../../packages/docs/template/.make-docs/contracts/system/commit-message-convention.md) | Keeps the shipped docs template convention aligned with the dogfood reference. |
| [../../../../.make-docs/manifest.json](../../../../.make-docs/manifest.json) | Refreshes the managed hash for the updated convention while preserving the existing source ID. |
| [../../../../packages/cli/tests/consistency.test.ts](../../../../packages/cli/tests/consistency.test.ts) | Adds regression coverage for convention copy parity and required output-format rules. |

### Developer

None this session.

### User

None this session.
