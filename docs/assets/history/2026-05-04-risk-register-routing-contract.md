---
date: "2026-05-04"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
summary: "Clarified risk-register routing and migrated the active register to item-level state tracking."
---

# Risk Register Routing Contract

## Changes

Clarified the docs and PRD routing contract so discovered gaps, drift, unresolved questions, risks, decisions, and closeout findings route to `docs/prd/03-open-questions-and-risk-register.md` when an active PRD namespace exists, then migrated the active register to item-level headings with `Status`, `Decision`, and `Follow-Up` state tables while preserving its existing categories and evidence.

```text
make-docs/
├── packages/cli/src/renderers.ts
├── docs/
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── prd/
│   └── assets/
├── packages/docs/template/docs/
├── packages/skills/
├── .agents/skills/
└── .claude/skills/
```

| Area | Summary |
| --- | --- |
| Router guidance | Added explicit gap-capture and anti-proliferation routing to generated docs routers and PRD routers. |
| Risk-register contract | Updated output, PRD-change, and risk-register template contracts to describe the living register and item-level state schema. |
| Active register | Converted the make-docs active risk register from section tables into per-item headings with state tables, issue/question bodies, recommendations, and close criteria. |
| Skill assets | Updated closeout and decompose-codebase skill references/templates, then mirrored the dogfood `.agents` and `.claude` skill copies. |
| Reference input | Used `example-gaps-doc-from-other-project.md` only as a temporary comparison input; it remains untracked and is not part of the project contract. |

### Gap Decisions

This change fills the routing gap that allowed agents to create standalone questions, decisions, risks, gaps, or architecture-decision files even when an active PRD risk register exists. No `docs/architecture/` convention was introduced.

### Validation

Validation commands run:

```text
npm test -w make-docs -- consistency renderers install skill-catalog skill-registry
npm run build -w make-docs
scripts/check-instruction-routers.sh
git diff --check
```

Post-edit index refreshes:

```text
jdocmunch index_local docs/
jdocmunch index_local packages/docs/template/docs/
jdocmunch index_local packages/skills/
jdocmunch index_local .agents/skills/
jdocmunch index_local .claude/skills/
jcodemunch index_folder .
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/AGENTS.md](../../AGENTS.md) | Dogfood docs router with the canonical gap-capture route. |
| [docs/prd/AGENTS.md](../../prd/AGENTS.md) | PRD router with living-register and anti-proliferation guidance. |
| [docs/prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) | Active risk register migrated to item-level state tracking. |
| [docs/assets/references/output-contract.md](../references/output-contract.md) | Output contract updated for living risk-register behavior and item schema. |
| [docs/assets/references/prd-change-management.md](../references/prd-change-management.md) | Active-set evolution rules updated for direct risk-register updates. |
| [docs/assets/templates/prd-risk-register.md](../templates/prd-risk-register.md) | Template updated with item-level state table and closeout fields. |
| [packages/docs/template/docs](../../../packages/docs/template/docs) | Shipped template copies aligned with the dogfood contract. |
| [packages/skills](../../../packages/skills) | Closeout and decompose-codebase skill assets updated for the living-register contract. |
| [packages/cli/tests](../../../packages/cli/tests) | Focused tests updated for router and risk-register contract expectations. |

### Developer

None this session.

### User

None this session.
