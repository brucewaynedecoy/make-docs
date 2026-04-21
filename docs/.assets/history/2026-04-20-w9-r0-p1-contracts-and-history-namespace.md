---
date: "2026-04-20"
coordinate: "W9 R0 P1"
---

# Docs Assets, State, and History - Phase 1: Contracts and History Namespace

## Changes

This session completed Wave 9 Phase 1: contracts and history namespace setup. New agent history records are now defined as future `docs/.assets/history/` records, while this legacy guide remains in `docs/guides/agent/` until the migration is ready to dogfood.

| Area | Summary |
| --- | --- |
| History contract | Updated the repo and template copies of `agent-guide-contract.md` to require `docs/.assets/history/YYYY-MM-DD-<slug>.md`, add flexible YAML frontmatter, and move W/R/P/S/T details into one `coordinate` field. |
| Template and prompt | Added frontmatter scaffolding to the agent history template and rerouted the session-summary prompt to `docs/.assets/history/`, including instructions to omit unknown client/model/provider values. |
| Routers | Added `.assets`, `.assets/history`, and `.assets/make-docs` routers in both the repo docs and shippable template; docs/guides routers now focus on user and developer guides. |
| Legacy guides | Kept existing repo-side `docs/guides/agent/` records in place and changed their router to legacy-only. Removed the obsolete template-side `docs/guides/agent/` routers. |
| CLI asset generation | Updated the CLI asset catalog and renderer so generated installs include the new `.assets` router files and stop installing template-side legacy agent guide routers. |
| Validation | Updated installer/renderer/consistency tests, marked Phase 1 work acceptance complete, and ran the full test/build/default-validation checks. |

Validation commands run:

```text
npm test -w make-docs
npm run build -w make-docs
npm run validate:defaults -w make-docs
git diff --check
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-20-w9-r0-docs-assets-state-and-history/01-contracts-and-history-namespace.md](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/01-contracts-and-history-namespace.md) | Phase 1 work item with all acceptance criteria marked complete. |
| [docs/.references/history-record-contract.md](../../.references/history-record-contract.md) | Updated history record contract for the future `.assets/history` namespace. |
| [docs/.templates/history-record.md](../../.templates/history-record.md) | Added the flexible frontmatter scaffold for history records. |
| [docs/.prompts/session-to-history-record.prompt.md](../../.prompts/session-to-history-record.prompt.md) | Rerouted session summaries to `docs/.assets/history/`. |
| [docs/.assets/AGENTS.md](../../.assets/AGENTS.md) | New top-level operational assets router. |
| [docs/.assets/history/AGENTS.md](../../.assets/history/AGENTS.md) | New history-specific router. |
| [docs/.assets/make-docs/AGENTS.md](../../.assets/make-docs/AGENTS.md) | New make-docs CLI state router. |
| [packages/cli/src/catalog.ts](../../../packages/cli/src/catalog.ts) | Added `.assets` instruction router files to generated installs. |
| [packages/cli/src/renderers.ts](../../../packages/cli/src/renderers.ts) | Added buildable renderers for `.assets` routers and updated docs/guides routing output. |
| [packages/cli/tests/consistency.test.ts](../../../packages/cli/tests/consistency.test.ts) | Updated default-template coverage for the new buildable router files. |
| [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Updated install expectations for `.assets` routers and guide routing. |
| [packages/cli/tests/renderers.test.ts](../../../packages/cli/tests/renderers.test.ts) | Added assertions that generated docs routers point to `.assets/history` and not `docs/guides/agent`. |
| [docs/guides/agent/2026-04-20-w9-r0-p1-contracts-and-history-namespace.md](2026-04-20-w9-r0-p1-contracts-and-history-namespace.md) | Legacy session guide for this Phase 1 implementation. |

### Developer

None this session.

### User

None this session.
