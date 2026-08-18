---
date: "2026-05-05"
client: "Codex Desktop"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Reinforced developer and user guide generation through shared contracts, templates, prompts, routers, and closeout workflow guidance."
---

# Guide Generation Consistency

## Changes

Reinforced guide-generation behavior at the shared contract layer so direct guide requests, reusable prompts, generated routers, shipped templates, and the `closeout-phase` skill all route agents through the same audience, coverage, update-vs-create, and future-coverage decisions before drafting developer or user guides.

```text
make-docs/
├── docs/assets/references/guide-contract.md
├── docs/assets/templates/guide-*.md
├── docs/assets/prompts/work-to-guides.prompt.md
├── docs/guides/AGENTS.md
├── packages/docs/template/docs/
├── packages/cli/src/
├── packages/cli/tests/
├── packages/skills/closeout-phase/
├── .agents/skills/closeout-phase/
└── .claude/skills/closeout-phase/
```

| Area | Summary |
| --- | --- |
| Guide contract | Added developer and user audience definitions, a guide coverage decision rubric, partial-coverage guidance, and `## Future Coverage` handling without adding frontmatter fields. |
| Templates and routers | Updated dogfood and shipped guide templates plus generated router instructions so agents inspect existing guides, choose the correct audience outcome, and avoid creating design docs or risk items solely for future guide work. |
| Reusable prompt | Added `work-to-guides.prompt.md` as an optional starter for turning completed work into current-state developer and user guides. |
| Closeout skill | Updated `closeout-phase` package and mirrors to evaluate developer and user guide coverage, inspect existing guides first, and record both no-guide outcomes. |
| Tests | Added guide contract, router, prompt-install, dogfood/template parity, and mirror-parity coverage; adjusted backup lifecycle fixtures for the additional managed prompt. |

### Gap Decisions

No novel gaps were found. The active risk register already tracks dogfood freshness in [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md); this change mitigates that existing gap for the guide contract/template/prompt/router slice by adding focused dogfood-to-template parity checks rather than creating a new register item.

### Validation

Validation commands run:

```text
npm run validate:defaults -w make-docs
npm test -w make-docs
git diff --check
```

Post-edit index refreshes:

```text
jdocmunch index_local docs/
jcodemunch index_folder .
```

Commit-message drafting used [docs/assets/references/commit-message-convention.md](../../../../.make-docs/contracts/system/commit-message-convention.md) and the aligned shipped-template copy at [packages/docs/template/.make-docs/contracts/system/commit-message-convention.md](../../../../packages/docs/template/.make-docs/contracts/system/commit-message-convention.md). No W/R/P coordinate applies because this was contract and workflow maintenance rather than a single work backlog phase.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/references/guide-contract.md](../../../../.make-docs/contracts/system/guide-contract.md) | Shared guide-generation contract with audience, coverage, and future-coverage rules. |
| [docs/assets/templates/guide-developer.md](../../../../.make-docs/templates/system/guide-developer.md) | Developer guide template updated for contributor, maintainer, validation, and future-coverage use. |
| [docs/assets/templates/guide-user.md](../../../../.make-docs/templates/system/guide-user.md) | User guide template updated for novice orientation, task workflows, advanced usage, and future coverage. |
| [docs/assets/prompts/work-to-guides.prompt.md](../../../../.make-docs/system/prompts/work-to-guides.prompt.md) | Reusable prompt starter for completed-work-to-guides generation. |
| [docs/guides/AGENTS.md](../../library/AGENTS.md) | Dogfood guide router updated with audience decisions, update-first routing, and future-coverage handling. |
| [packages/docs/template/docs](../../../../packages/docs/template/docs) | Shipped template copies aligned with the dogfood guide contracts and routers. |
| packages/cli/src/renderers.ts | Generated docs and guide router output updated for guide-generation consistency. |
| [packages/cli/src/rules.ts](../../../../packages/cli/src/rules.ts) | Prompt registry updated to include `work-to-guides.prompt.md` for work-enabled installs. |
| packages/skills/closeout-phase (historical path: `../../../../packages/skills/closeout-phase`) | Closeout workflow updated to handle developer and user guides. |
| [packages/cli/tests](../../../../packages/cli/tests) | Regression tests added or updated for guide routing, parity, prompt install, and backup lifecycle counts. |
| [docs/assets/history/2026-05-05-guide-generation-consistency.md](./2026-05-05-guide-generation-consistency.md) | Closeout breadcrumb for this guide-generation consistency work. |

### Developer

None this session.

### User

None this session.
