___
name: Work to Guides
description: Instructs the agent to create or update developer and user guides from completed work backlog phases.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please review the completed work below and create or update the appropriate developer and/or user guides.

Before writing anything, read `.make-docs/contracts/system/coverage-pass-contract.md`, `.make-docs/contracts/system/guide-contract.md`, the matching guide template in `.make-docs/templates/system/`, and the router in `docs/assets/library/`. Treat those files as the authority for coverage-pass mechanics, audience intent, frontmatter, slug rules, guide coverage decisions, and future coverage handling.

Start by inspecting existing guides under `docs/assets/library/developer/` and `docs/assets/library/user/`. Decide whether each completed capability should result in `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`.

When this prompt is used as a coverage pass, apply the history idempotency rule and validation checklist in `coverage-pass-contract.md`, and record a verdict and reason for every candidate, including `none`.

Write guides as current-state documentation, not as phase summaries. Developer guides should help contributors and maintainers navigate the project, codebase, contracts, validation, extension points, and safe-change workflows so they can reach a useful first PR or maintenance action quickly. User guides should help users understand and use what the project ships, with novice-friendly orientation and clear paths into advanced capabilities.

If current confirmed behavior is useful now, document it now. If downstream capabilities are needed to complete or enrich the guide later, add a `## Future Coverage` section with `Blocked by`, `Update when`, and `Guide change` items. Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.

Here is the completed work context:

{{WORK_CONTEXT}}
