___
name: Work to Guides
description: Instructs the agent to create or update developer and user guides from completed work backlog phases.
___

Please review the completed work below and create or update the appropriate developer and/or user guides.

Before writing anything, read `docs/assets/references/guide-contract.md`, the matching guide template in `docs/assets/templates/`, and the router in `docs/guides/`. Treat those files as the authority for audience intent, frontmatter, slug rules, guide coverage decisions, and future coverage handling.

Start by inspecting existing guides under `docs/guides/developer/` and `docs/guides/user/`. Decide whether each completed capability should result in `developer`, `user`, `both`, `update-existing`, `link-only`, or `none`.

Write guides as current-state documentation, not as phase summaries. Developer guides should help contributors and maintainers navigate the project, codebase, contracts, validation, extension points, and safe-change workflows so they can reach a useful first PR or maintenance action quickly. User guides should help users understand and use what the project ships, with novice-friendly orientation and clear paths into advanced capabilities.

If current confirmed behavior is useful now, document it now. If downstream capabilities are needed to complete or enrich the guide later, add a `## Future Coverage` section with `Blocked by`, `Update when`, and `Guide change` items. Do not create design docs, architecture decisions, or PRD risk-register items solely to remember future guide work.

Here is the completed work context:

{{WORK_CONTEXT}}
