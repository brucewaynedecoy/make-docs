# Phase 2 - Template Assets and Renderers

## Objective

Teach the CLI asset pipeline to install and render the new `.assets` routers, keep checked-in template files synchronized with generated output, and stop creating `docs/guides/agent/` in new installs.

## Depends On

- Phase 1 contract and router source decisions.
- `packages/cli/src/catalog.ts`
- `packages/cli/src/renderers.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/install.test.ts`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/catalog.ts` | Replace `docs/guides/agent/${instructionKind}` with `.assets` router paths. |
| `packages/cli/src/renderers.ts` | Add renderers for `.assets`, `.assets/history`, and `.assets/starter-docs`; update docs and guides router text. |
| `packages/cli/src/rules.ts` | Ensure the existing history contract/template/prompt remain always installed; add no legacy `guides/agent` paths. |
| `packages/cli/tests/consistency.test.ts` | Add new buildable `.assets` router paths and remove `docs/guides/agent` expectations. |
| `packages/cli/tests/renderers.test.ts` | Update renderer output expectations for root/docs/guides/assets routers. |
| `packages/cli/tests/install.test.ts` | Update full-profile and reduced-profile install expectations for `.assets` routers. |
| `packages/docs/template/docs/.assets/**` | Ensure template source matches renderer output. |
| `packages/docs/template/docs/guides/agent/AGENTS.md` and `CLAUDE.md` | Remove from the template once the new history routers are managed. |

## Detailed Changes

### 1. Add managed router paths

In `addInstructionAssets`, install the selected instruction kind for:

```ts
relativePaths.add(`docs/.assets/${activeInstructionKind}`);
relativePaths.add(`docs/.assets/history/${activeInstructionKind}`);
relativePaths.add(`docs/.assets/starter-docs/${activeInstructionKind}`);
```

Remove:

```ts
relativePaths.add(`docs/guides/agent/${activeInstructionKind}`);
```

Keep `docs/guides/${activeInstructionKind}` because user and developer guide routers still belong there.

### 2. Render `.assets` routers

Add buildable-path support in `renderers.ts` for:

- `docs/.assets/AGENTS.md`
- `docs/.assets/CLAUDE.md`
- `docs/.assets/history/AGENTS.md`
- `docs/.assets/history/CLAUDE.md`
- `docs/.assets/starter-docs/AGENTS.md`
- `docs/.assets/starter-docs/CLAUDE.md`

Follow the existing renderer style: short deterministic strings, profile-aware instruction-kind wording, and no separate module unless the file becomes difficult to read.

### 3. Update existing router renderers

Update `renderDocsRouter()` so it routes:

- design, plan, PRD, work, guide, and prompt work as before,
- history records to `docs/.assets/history/`,
- operational assets to `docs/.assets/`.

Update `renderGuidesRouter()` so it only describes:

- `docs/guides/user/`
- `docs/guides/developer/`

It should no longer state that agent session summaries are guides or exempt from the guide structure contract.

### 4. Keep always-installed history support

Do not rename `agent-guide-contract.md`, `agent-guide.md`, or `session-to-agent-guide.prompt.md` in this phase. Confirm they remain included by:

- `ALWAYS_REFERENCE_PATHS`
- `ALWAYS_TEMPLATE_PATHS`
- `PROMPT_RULES`

Only their contents and destination instructions change.

### 5. Remove template `docs/guides/agent` routers

After `.assets/history` routers are added and managed, remove `packages/docs/template/docs/guides/agent/AGENTS.md` and `CLAUDE.md`. The template should not create `docs/guides/agent/` in fresh installs.

## Parallelism

Renderer changes and consistency-test updates can proceed in parallel after the managed path list is final. Template deletions should happen only after new `.assets` files are represented in the asset pipeline.

## Acceptance Criteria

- [ ] Fresh installs include `.assets`, `.assets/history`, and `.assets/starter-docs` routers.
- [ ] Fresh installs no longer include `docs/guides/agent/AGENTS.md` or `docs/guides/agent/CLAUDE.md`.
- [ ] `renderBuildableAsset()` output matches checked-in template files for every buildable path.
- [ ] `packages/cli/tests/consistency.test.ts` passes.
- [ ] `packages/cli/tests/renderers.test.ts` passes.
- [ ] Reduced-profile installs still include the history contract, history template, history prompt, and `.assets` routers.
- [ ] No active generated router text points new history records to `docs/guides/agent/`.
