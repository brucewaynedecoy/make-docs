# CLI Skill Installation — Closing the Skill Delivery Gap

> Filename: `2026-04-16-cli-skill-installation.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Add skill installation support to the `starter-docs` CLI so that skills shipped in `packages/skills/` are installed into the correct harness-specific directories in consumer projects during `init` and `update`. This closes a gap discovered during the Wave 5 archive-docs plugin implementation: the plugin was built, validated, and registered — but consumers (including this project) have no way to actually receive the skills through the CLI. The manual registration attempted in Wave 5 Phase 5 (`.claude/settings.json` with a `skills` array, `.agents/README.md`) was invalid — neither Claude Code nor Codex recognizes those conventions.

## Context

### The gap

The CLI's asset pipeline (`catalog.ts`, `rules.ts`, `install.ts`) manages docs-template files exclusively. It has no concept of skills:

- `getDesiredAssets()` collects references, templates, prompts, and instruction files — no skills
- `InstallSelections` has capabilities, prompts, templatesMode, referencesMode, instructionKinds — no skills toggle
- `planInstall()` and `applyInstallPlan()` operate on the docs template tree — they don't touch `.claude/` or any harness-specific directory
- The `prepack` script copies `packages/docs/template/` into the CLI package — `packages/skills/` is not bundled

There are 5 SKILL.md files across 2 plugins (`decompose-codebase` and `archive-docs`) that exist in the repo but have never been installable.

### How harnesses discover skills

**Claude Code**: Skills are markdown files in `.claude/skills/` at the project root. Each `.md` file in that directory is automatically discovered and available as a skill. There is no `settings.json` registration mechanism for skills.

**Codex (OpenAI)**: Agent configurations use YAML files. The discovery convention is still evolving, but the agent config must be in a location Codex scans (typically `.agents/` or project-level configuration).

**Other harnesses** (Cursor, Windsurf, etc.): Generally do not have a skills concept. Instructions are injected via rules files (`.cursorrules`, `.windsurfrules`). Skills could be appended to these files as instruction blocks, but this is a future adapter concern.

### What Wave 5 Phase 5 got wrong

The phase attempted to register skills by:
1. Creating `.claude/settings.json` with a `skills` array — Claude Code doesn't read this key for skill discovery
2. Creating `.agents/README.md` as a discovery index — Codex doesn't scan README files for agent registration

Both files should be cleaned up as part of this fix.

### Relationship to Wave 5

This design is a bug fix / completion of the archive-docs plugin (Wave 5). The plugin's skills exist but aren't deliverable. The downstream plan should be a **revision** of Wave 5 (`w5-r1`) since it fixes an incomplete phase, not a new initiative.

## Decision

### 1. Bundle skills in the CLI package

Add `packages/skills/` to the CLI's `prepack` pipeline alongside the docs template:

- The existing `scripts/copy-template-to-cli.mjs` copies `packages/docs/template/` → `packages/cli/template/`
- Extend it (or add a sibling script) to also copy `packages/skills/` → `packages/cli/skills/`
- Update `packages/cli/package.json` `files` array to include `skills/`

This makes skills available in the published CLI package. At runtime, the CLI resolves skills from its bundled `skills/` directory (parallel to how it resolves the template from `template/`).

### 2. Add a skills selection to InstallSelections

Extend the install profile to include a skills toggle:

```ts
export interface InstallSelections {
  capabilities: Record<Capability, boolean>;
  prompts: boolean;
  templatesMode: TemplatesMode;
  referencesMode: ReferencesMode;
  instructionKinds: Record<InstructionKind, boolean>;
  skills: boolean;  // NEW — whether to install skills
}
```

Default: `true` (skills are installed by default). The `--no-skills` CLI flag opts out.

### 3. Install skills into `.claude/skills/` for Claude Code

When `skills` is enabled, the CLI:

1. Discovers all SKILL.md files in the bundled `skills/` directory
2. Creates `.claude/skills/` in the target directory if it doesn't exist
3. Copies each SKILL.md into `.claude/skills/<plugin>-<skill-name>.md`
   - `decompose-codebase/SKILL.md` → `.claude/skills/decompose-codebase.md`
   - `archive-docs/skills/archive/SKILL.md` → `.claude/skills/archive-docs-archive.md`
   - `archive-docs/skills/staleness-check/SKILL.md` → `.claude/skills/archive-docs-staleness-check.md`
   - etc.
4. Tracks installed skill files in the manifest (`docs/.starter-docs/manifest.json`) so `update` can detect changes

The flat naming convention (`<plugin>-<skill-name>.md`) avoids nested directories in `.claude/skills/` while maintaining traceability.

### 4. Install plugin references and scripts alongside skills

Skills reference shared assets (e.g., `archive-workflow.md`, `trace_relationships.py`). These must also be installed. Two options:

- **Option A**: Install references/scripts into `.claude/skills/<plugin>/` as a directory rather than a flat file. This keeps shared assets co-located with the skills that use them. But it changes the Claude Code discovery model (which expects flat `.md` files, not directories).
- **Option B**: Inline the reference content into each SKILL.md at install time, or resolve relative references to absolute paths. This keeps `.claude/skills/` flat but loses the shared-asset model.
- **Option C**: Install skills into `.claude/skills/` and install supporting assets (references, scripts) into a parallel `.claude/skill-assets/<plugin>/` directory. Skills reference assets via relative paths.

**Recommend Option C** — it preserves Claude Code's flat skill discovery while keeping shared assets available. The SKILL.md files would need their relative reference paths updated at install time (e.g., `references/archive-workflow.md` → `../skill-assets/archive-docs/references/archive-workflow.md`).

### 5. Wizard integration

Add a skills step to the interactive wizard (after the instruction-kinds step):

```
? Install agent skills? (Y/n)
```

Non-interactive: `--no-skills` flag.

### 6. Clean up invalid Wave 5 Phase 5 artifacts

Remove the files that don't serve a real purpose:
- Delete `.claude/settings.json` (the `skills` array is not a valid Claude Code key; if we need project-level settings in the future, we'll create it with valid keys)
- Delete `.agents/README.md` (replace with actual Codex agent configs once that convention is understood)

### 7. Codex support (deferred)

Codex agent configuration is still evolving. Rather than guess at the convention, defer Codex skill installation to a follow-up once the Codex discovery mechanism is confirmed. The `openai.yaml` files in `packages/skills/*/agents/` remain as source assets for when Codex support is implemented.

### 8. Manifest tracking

Installed skill files are tracked in `docs/.starter-docs/manifest.json` under a `skillFiles` key (parallel to the existing `files` key for docs-template assets). This enables:
- `update` to detect changed skills and re-install them
- `update --reconfigure` to add/remove skills
- The manifest to serve as the single source of truth for what's installed

## Alternatives Considered

**Install skills as part of the docs template (put SKILL.md files in `packages/docs/template/`).** This would make skills install through the existing asset pipeline without any CLI changes. Rejected because: skills are not documentation — they're agent instructions. Mixing them into the docs template blurs the boundary between "what consumers' docs look like" and "what agents can do." The skills package exists precisely to keep this separation.

**Symlink skills instead of copying.** The CLI could create symlinks from `.claude/skills/` to the installed skill source. Rejected because: symlinks are fragile across platforms (Windows), don't survive `npm pack`, and break if the source is moved. Copying is more robust.

**Don't install skills through the CLI — require manual setup.** Document the manual process ("copy SKILL.md to `.claude/skills/`") and defer CLI integration. Rejected because: the whole point of `starter-docs` is that installation is automated. Manual skill setup contradicts the project's value proposition and, as Wave 5 demonstrated, is error-prone.

**Register skills in `.claude/settings.json`.** The Wave 5 Phase 5 approach. Rejected because: Claude Code doesn't support a `skills` key in settings.json. Skill discovery is directory-based (`.claude/skills/`), not config-based.

## Consequences

**What improves:**
- Skills are installable via the CLI — `npx starter-docs` installs both docs and skills in one step.
- The archive-docs plugin (and decompose-codebase) become immediately usable by consumers.
- The dogfood project can test skills through the same CLI that consumers use.
- The manifest tracks skills, enabling update/reconfigure for the skill set.

**What shifts:**
- `packages/cli/package.json` `files` array gains `skills/`.
- The `prepack` script copies `packages/skills/` into the CLI package.
- `types.ts` gains a `skills` boolean in `InstallSelections`.
- `catalog.ts` gains skill discovery and path-rewriting logic.
- `install.ts` / `planner.ts` gain skill installation actions.
- `wizard.ts` gains a skills step.
- `cli.ts` gains a `--no-skills` flag.
- The manifest schema gains a `skillFiles` key.
- Tests need updating for the new selection and installed files.

**Risks:**
- **Path rewriting for shared assets (Option C):** Rewriting relative paths in SKILL.md at install time adds complexity. If a SKILL.md references `../../references/archive-workflow.md` and the installed path is `.claude/skills/archive-docs-archive.md`, the reference needs to resolve to `.claude/skill-assets/archive-docs/references/archive-workflow.md`. Mitigation: the rewriting logic is deterministic and testable; the install plan can verify all references resolve.
- **Claude Code discovery changes:** If Claude Code changes how it discovers skills, the installation target may need updating. Mitigation: the target directory is a single constant in the CLI — easy to change.

**Deferred:**
- Codex agent installation (pending convention clarity)
- Skill selection per-skill (currently all-or-nothing; per-skill selection deferred to the module/registry system)
- Harness adapter framework (Cursor, Windsurf support)

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-archive-docs-skill.md](2026-04-16-archive-docs-skill.md)
- Reason: This design fixes the skill delivery gap discovered during Phase 5 of the archive-docs plugin implementation. The plugin was built and validated but could not be installed because the CLI has no skill installation capability. This design adds that capability, completing the archive-docs delivery pipeline.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: This is a bug fix / completion of Wave 5 work. The downstream plan should be a **revision of Wave 5** (`w5-r1`) since it fixes an incomplete delivery phase rather than starting a new initiative. The plan should include cleanup of the invalid `.claude/settings.json` and `.agents/README.md` created in Wave 5 Phase 5, plus the CLI changes (prepack, types, catalog, install, wizard, cli, tests), followed by a dogfood validation that confirms skills are actually discoverable by Claude Code.
