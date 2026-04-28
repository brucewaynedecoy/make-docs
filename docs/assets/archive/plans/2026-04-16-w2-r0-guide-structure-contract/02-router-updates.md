# Phase 2 — Router Updates

## Objective

Update the router/instruction files in the template package so that agents writing developer or user guides are directed to the new guide contract and guide templates before writing. Agent guides remain exempt, governed by their own contract.

## Files to Update

| File | Change Description |
| ---- | ------------------ |
| `packages/docs/template/docs/guides/AGENTS.md` | Add guide-contract and template references for developer/user guides; clarify agent guide exemption; trim quality paragraph. |
| `packages/docs/template/docs/guides/CLAUDE.md` | Identical changes as the AGENTS.md sibling. |
| `packages/docs/template/docs/AGENTS.md` | Update the guides routing line to include guide-contract and template references. |
| `packages/docs/template/docs/CLAUDE.md` | Identical changes as the AGENTS.md sibling. |
| `packages/docs/template/docs/.templates/AGENTS.md` | Add `guide-developer.md` and `guide-user.md` to the listed template files. |
| `packages/docs/template/docs/.templates/CLAUDE.md` | Identical changes as the AGENTS.md sibling. |

## Detailed Changes

### 1. `packages/docs/template/docs/guides/AGENTS.md` and `CLAUDE.md`

Both files are identical today and must remain identical after the edit.

**Current content (full file):**

```markdown
# Guides for Devs and Users

Use `docs/guides` only as a router. Do not create generated files directly in this directory.

- Documents and guides meant to help users and agents to use this project's product(s) are stored in `docs/guides/user`. This can include developer-styled user documentation for extending or integrating with this project's product(s).
- Documents and guides meant to help developers and agents who are maintaining this project's product(s) are stored in `docs/guides/developer`.
- Agent session summaries — point-in-time breadcrumbs written at the end of a work session — are stored in `docs/guides/agent`. Read the agent instructions in the `docs/guides/agent/` directory before writing.
- If the `docs/guides/user`, `docs/guides/developer`, or `docs/guides/agent` directories do not exist, create them ONLY when first writing a guide that belongs in the specific sub-folder.

ALL documentation must follow conventions and best-practices usually associated with creating a well-documented project or product, and those conventions should follow the kind of documentation being created (i.e., either user documentation or developer documentation). Documentation must be easy to understand, easy to use, and easy to follow, with links to supporting sections or documents where necessary and where possible.
```

**Replacement content (full file):**

```markdown
# Guides for Devs and Users

Use `docs/guides` only as a router. Do not create generated files directly in this directory.

- **User guides** are stored in `docs/guides/user/`. This can include developer-styled user documentation for extending or integrating with this project's product(s). Before writing, read `docs/.references/guide-contract.md` and copy the template from `docs/.templates/guide-user.md`.
- **Developer guides** are stored in `docs/guides/developer/`. Before writing, read `docs/.references/guide-contract.md` and copy the template from `docs/.templates/guide-developer.md`.
- **Agent session summaries** are stored in `docs/guides/agent/`. These follow a SEPARATE contract — read `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md` before writing. Agent guides are exempt from the guide structure contract.
- If the `docs/guides/user`, `docs/guides/developer`, or `docs/guides/agent` directories do not exist, create them ONLY when first writing a guide that belongs in the specific sub-folder.

Documentation must be easy to understand, easy to use, and easy to follow, with links to supporting sections or documents where necessary and where possible.
```

**Summary of changes:**

1. Bullet 1 (user guides): bold label, added instruction to read `guide-contract.md` and copy `guide-user.md`.
2. Bullet 2 (developer guides): bold label, added instruction to read `guide-contract.md` and copy `guide-developer.md`.
3. Bullet 3 (agent guides): bold label, explicitly states agent guides follow a SEPARATE contract and are exempt from the guide structure contract; directs to `agent-guide-contract.md` and `agent-guide.md`.
4. Bullet 4 (directory creation on demand): preserved unchanged.
5. Final paragraph: trimmed to a single sentence. The detailed structural conventions are now carried by the guide contract itself.

### 2. `packages/docs/template/docs/AGENTS.md` and `CLAUDE.md`

Both files are identical today and must remain identical after the edit. Only line 7 (the guides routing bullet) changes.

**Current line 7:**

```
- For guides, continue in `docs/guides/`. Agent session summary breadcrumbs live in `docs/guides/agent/` — read `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md` before writing. User-facing and developer-facing guides live in `docs/guides/user/` and `docs/guides/developer/` — read `docs/guides/AGENTS.md` for those.
```

**Replacement line 7:**

```
- For guides, continue in `docs/guides/`. Agent session summaries live in `docs/guides/agent/` — read `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md` before writing. User-facing and developer-facing guides live in `docs/guides/user/` and `docs/guides/developer/` — read `docs/.references/guide-contract.md` and the matching template (`docs/.templates/guide-developer.md` or `docs/.templates/guide-user.md`) before writing.
```

**Summary of changes:**

1. Shortened "Agent session summary breadcrumbs" to "Agent session summaries".
2. Replaced the trailing clause `read docs/guides/AGENTS.md for those` with an explicit directive to read `guide-contract.md` and the matching template before writing. The docs-level router now carries the same authority as the guide-level router for developer/user guides.

### 3. `packages/docs/template/docs/.templates/AGENTS.md` and `CLAUDE.md`

Both files are identical today and must remain identical after the edit. Only the third bullet changes.

**Current line 5:**

```
- Use `design.md` for design docs and the matching `plan-*`, `prd-*`, or `work-*` template for the target artifact.
```

**Replacement line 5:**

```
- Use `design.md` for design docs, `guide-developer.md` or `guide-user.md` for guides, and the matching `plan-*`, `prd-*`, or `work-*` template for the target artifact.
```

**Summary of changes:**

1. Inserted `guide-developer.md` and `guide-user.md` into the template listing, positioned between design and plan/prd/work families.

## Parallelism

All six files updated in this phase live in `packages/docs/template/` and are disjoint from the files created in Phase 1 (`guide-contract.md`, `guide-developer.md`, `guide-user.md` in the same template package). Phase 2 can run in parallel with Phase 1. Phase 3 (CLI integration) depends on both Phases 1 and 2 being complete.

## Acceptance Criteria

1. `packages/docs/template/docs/guides/AGENTS.md` and `CLAUDE.md` match the replacement content exactly and remain identical to each other.
2. `packages/docs/template/docs/AGENTS.md` and `CLAUDE.md` contain the updated guides routing line and remain identical to each other.
3. `packages/docs/template/docs/.templates/AGENTS.md` and `CLAUDE.md` list `guide-developer.md` and `guide-user.md` and remain identical to each other.
4. Each AGENTS.md/CLAUDE.md pair is byte-identical (verified by diff).
5. `bash scripts/check-instruction-routers.sh` passes (no broken references in the router files).
6. No other files in the template package are modified by this phase.
