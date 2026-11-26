---
title: "W33 R0 P4 Shipped Text and Skills"
kind: "plan"
status: "draft"
coordinate: "W33 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-22-command-tree-and-tool-names.md"
---

# W33 R0 P4 Shipped Text and Skills

## Purpose

Move every shipped text and this repository's instructions to the new names.

## Outcome

No shipped Skill, router, reference, prompt, guide, or PRD names an old command, except migration tables that list old names on purpose.

## Scope

- Change upstream in `packages/docs/template/` first: routers, contracts, references, prompts, and templates. Then reseed this repository's `.make-docs/` and `docs/` copy and refresh the bundled template.
- Change every first-party Skill under `packages/skills/` and its installed copy under `.agents/skills/`.
- Change guides under `docs/assets/` and the package README files.
- Change PRD text that names a command in passing.
- Rename the planned commands and tools in the W29 R0 and W30 R0 backlogs, with Change History entries.
- Add a test that fails when shipped text names a command that the registry does not have.

## Exclusions

- History records, archives, and closed evidence keep the names they recorded.

## Acceptance

- A search of shipped text finds no old command name outside migration tables.
- Template and dogfood bytes match, and the template validation suite and router check pass.

## Dependencies

- P2. It can run beside P3.
