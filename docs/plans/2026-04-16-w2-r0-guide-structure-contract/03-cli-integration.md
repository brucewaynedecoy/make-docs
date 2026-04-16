# Phase 3 — CLI Integration

## Objective

Wire the new guide-contract reference, guide templates, and guide router instruction files into the CLI's managed asset pipeline so they are included in every install profile — not just the full-default profile that reads the entire template directory.

## Depends On

- **Phase 1** (`01-authority-and-templates.md`) — the guide-contract reference file (`docs/.references/guide-contract.md`) and the guide templates (`docs/.templates/guide-developer.md`, `docs/.templates/guide-user.md`) must exist in the template package before the CLI can reference them.
- **Phase 2** (`02-router-updates.md`) — the updated guide routers (`docs/guides/AGENTS.md`, `docs/guides/CLAUDE.md`) must exist in the template package so the CLI can read them as static fallbacks and as the source of truth for full-default profiles.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/rules.ts` | Add `ALWAYS_REFERENCE_PATHS` and `GUIDE_TEMPLATE_PATHS` arrays; update `getReferencePaths` and `getTemplatePaths` to include them unconditionally. |
| `packages/cli/src/catalog.ts` | Add `docs/guides/` and `docs/guides/agent/` instruction asset paths in `addInstructionAssets`. |
| `packages/cli/src/renderers.ts` | Register guide router paths as buildable; add `renderGuidesRouter`; update `renderDocsRouter` and `renderTemplatesRouter` to emit guide-related lines. |

## Detailed Changes

### 1. `packages/cli/src/rules.ts`

#### 1a. Add `ALWAYS_REFERENCE_PATHS` (new constant)

Insert a new constant after the `REQUIRED_REFERENCE_PATHS` block (after line 87):

```ts
const ALWAYS_REFERENCE_PATHS = [
  "docs/.references/guide-contract.md",
];
```

This array holds reference paths that are installed regardless of which capabilities are selected. It is the correct home for any future capability-agnostic references.

#### 1b. Update `getReferencePaths` to include always-installed references

At the top of `getReferencePaths`, before the capability loop (currently line 138), add:

```ts
for (const referencePath of ALWAYS_REFERENCE_PATHS) {
  paths.add(referencePath);
}
```

This ensures `guide-contract.md` is in every profile's reference set. Because the `paths` Set is populated before the existing capability loop, `getReferenceDirInstalled` (which checks `getReferencePaths(profile).length > 0`) will also return `true` for profiles that have no capabilities selected — which is the correct behavior since the reference directory now always has at least one file.

#### 1c. Add `GUIDE_TEMPLATE_PATHS` (new constant)

Insert a new constant after the `WORK_TEMPLATE_PATHS` block (after line 68):

```ts
const GUIDE_TEMPLATE_PATHS = [
  "docs/.templates/guide-developer.md",
  "docs/.templates/guide-user.md",
];
```

#### 1d. Update `getTemplatePaths` to include guide templates unconditionally

At the top of `getTemplatePaths`, before the capability-gated blocks (currently line 110), add:

```ts
for (const templatePath of GUIDE_TEMPLATE_PATHS) {
  paths.add(templatePath);
}
```

This ensures both guide templates ship in every profile. As with references, this also means `getTemplateDirInstalled` returns `true` for all profiles.

### 2. `packages/cli/src/catalog.ts`

#### 2a. Add guide directory instruction assets

In `addInstructionAssets`, after the early return guard (line 29) and the unconditional root/docs adds (lines 32-33), add two new unconditional lines:

```ts
relativePaths.add(`docs/guides/${instructionKind}`);
relativePaths.add(`docs/guides/agent/${instructionKind}`);
```

These are placed after line 33 (`relativePaths.add(\`docs/${instructionKind}\`);`) and before the capability-gated blocks starting at line 35. They are NOT gated on any capability — guides are always relevant — but they ARE gated on the instruction kind being selected (the early return on line 28-30 handles that).

The resulting block should read:

```ts
relativePaths.add(instructionKind);
relativePaths.add(`docs/${instructionKind}`);
relativePaths.add(`docs/guides/${instructionKind}`);
relativePaths.add(`docs/guides/agent/${instructionKind}`);

if (profile.capabilityState.designs.effectiveSelection) {
  // ...existing code
```

### 3. `packages/cli/src/renderers.ts`

#### 3a. Register guide router paths as buildable (new constant)

Add a new constant after the existing `DESIGN_REFERENCE_RENDERERS` set (after line 20):

```ts
const GUIDES_ROUTER_INSTRUCTIONS = new Set([
  "docs/guides/AGENTS.md",
  "docs/guides/CLAUDE.md",
]);
```

#### 3b. Update `isBuildablePath`

Add `GUIDES_ROUTER_INSTRUCTIONS` to the check in `isBuildablePath`. Add the following to the return expression (after the `DESIGN_REFERENCE_RENDERERS.has(relativePath)` check on line 28):

```ts
GUIDES_ROUTER_INSTRUCTIONS.has(relativePath) ||
```

The full return statement becomes:

```ts
return (
  ROOT_INSTRUCTIONS.has(relativePath) ||
  DOCS_ROUTER_INSTRUCTIONS.has(relativePath) ||
  TEMPLATE_ROUTER_INSTRUCTIONS.has(relativePath) ||
  PROMPTS_ROUTER_INSTRUCTIONS.has(relativePath) ||
  DESIGN_REFERENCE_RENDERERS.has(relativePath) ||
  GUIDES_ROUTER_INSTRUCTIONS.has(relativePath)
);
```

#### 3c. Add dispatch cases in `renderBuildableAsset`

In the `switch` statement inside `renderBuildableAsset`, add two new cases before the `default` throw (before line 58):

```ts
case "docs/guides/AGENTS.md":
case "docs/guides/CLAUDE.md":
  return renderGuidesRouter(profile);
```

#### 3d. Add `renderGuidesRouter` function (new function)

Add a new function after `renderDocsRouter` (after line 113). This function dynamically builds the content for `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` when the profile is not full-default.

The function must:

1. Always reference `docs/.references/guide-contract.md` for developer and user guide structure.
2. Always reference `docs/.templates/guide-developer.md` and `docs/.templates/guide-user.md` as the templates.
3. Always reference `docs/.references/agent-guide-contract.md` for agent guides (this file exists in the template already; it is not being added in this plan — but the router should still point to it).
4. Preserve the instruction to create audience subdirectories on demand.

Implementation:

```ts
function renderGuidesRouter(profile: InstallProfile): string {
  return [
    "# Guides Router",
    "",
    "This directory holds guides organized by audience.",
    "",
    "## Developer and User Guides",
    "",
    "- Read `docs/.references/guide-contract.md` for naming, frontmatter, and structural rules.",
    "- Use `docs/.templates/guide-developer.md` or `docs/.templates/guide-user.md` as the starting template.",
    "- Place developer guides in `docs/guides/developer/` and user guides in `docs/guides/user/`.",
    "- Create audience subdirectories on demand; do not pre-create empty directories.",
    "",
    "## Agent Guides",
    "",
    "- Read `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md` before writing.",
    "- Place agent session summary breadcrumbs in `docs/guides/agent/`.",
    "",
  ].join("\n");
}
```

Note: `agent-guide-contract.md` and `agent-guide.md` are existing files not managed by this plan. The router references them for completeness but this plan does not add them to `ALWAYS_REFERENCE_PATHS` — that is a separate tracked gap per the overview.

#### 3e. Update `renderDocsRouter` to include a guides line

In `renderDocsRouter` (line 62), add a guides routing line that is always emitted (not capability-gated). Insert the following `lines.push` call after the designs block and before the plans block (after line 73), or at any stable position before the prompts block — the exact position should be consistent with the static template's ordering, which places guides after designs/plans/prd/work:

```ts
lines.push(
  "- For guides, continue in `docs/guides/`. Read `docs/.references/guide-contract.md` for developer and user guide structure. Agent session summary breadcrumbs live in `docs/guides/agent/` — read `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md` before writing.",
);
```

Place this push after the prd/work block and the change-management block, but before the prompts block. This mirrors the ordering in the static template's `docs/CLAUDE.md` where guides appear after designs/plans/prd/work and before prompts.

#### 3f. Update `renderTemplatesRouter` to list guide templates

In `renderTemplatesRouter` (line 115), add guide templates to the listed families. Guide templates are not capability-gated, so they should be added unconditionally.

After the line that builds `templateFamilies` for designs (line 119) and before the `wildcardFamilies` block (line 122), add:

```ts
templateFamilies.push("`guide-developer.md` and `guide-user.md` for guides");
```

This ensures the templates router mentions guide templates regardless of capability selections.

## Parallelism

Within this phase:

- **Changes 1a-1d** (`rules.ts`) are independent of changes 2a (`catalog.ts`) and can be done in parallel.
- **Change 2a** (`catalog.ts`) is independent of all other changes and can be done in parallel with everything.
- **Changes 3a-3c** (`renderers.ts` — registering buildable paths and dispatch) must be done before **3d** (the new function they dispatch to). In practice, doing 3a-3f together in one edit session is simplest.
- **Changes 3e-3f** (`renderDocsRouter` and `renderTemplatesRouter` updates) are independent of 3a-3d and can be done in any order.

Recommended execution: edit all three files in parallel, since each file's changes are self-contained.

## Acceptance Criteria

1. A reduced profile (e.g., `--no-work --no-prd --no-designs --no-plans`) still installs `docs/.references/guide-contract.md`.
2. A reduced profile still installs `docs/.templates/guide-developer.md` and `docs/.templates/guide-user.md`.
3. A reduced profile still installs `docs/guides/AGENTS.md` and/or `docs/guides/CLAUDE.md` (depending on selected instruction kinds).
4. A reduced profile still installs `docs/guides/agent/AGENTS.md` and/or `docs/guides/agent/CLAUDE.md`.
5. The dynamically rendered `docs/AGENTS.md` / `docs/CLAUDE.md` includes a guides routing line for all profiles.
6. The dynamically rendered `docs/.templates/AGENTS.md` / `docs/.templates/CLAUDE.md` mentions guide templates for all profiles.
7. The dynamically rendered `docs/guides/AGENTS.md` / `docs/guides/CLAUDE.md` references the guide-contract, guide templates, and agent-guide-contract.
8. Full-default profiles still short-circuit to the static template files (existing behavior preserved).
9. `npm test -w starter-docs` passes with no regressions.
10. `node scripts/smoke-pack.mjs` succeeds.
