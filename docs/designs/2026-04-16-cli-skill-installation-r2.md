# CLI Skill Installation R2 — Registry-Based Skill Delivery

> Filename: `2026-04-16-cli-skill-installation-r2.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Replace the copy-based skill bundling approach (designed in R1, partially implemented, then reverted) with a registry-based model where the CLI fetches and installs skills from configured sources at install time rather than bundling them into the CLI package. This eliminates file duplication, supports skills from external repositories, and cleanly separates the CLI (the installer) from the skills (the installable content).

## Context

### What R1 got wrong

The R1 design (`2026-04-16-cli-skill-installation.md`) proposed bundling `packages/skills/` into the CLI package at publish time via the `prepack` script, then copying skill files from the bundle into `.claude/skills/` during install. This was implemented in Phase 1 (prepack extension + package.json files array) but revealed fundamental problems:

1. **File duplication.** The entire `packages/skills/` tree — including Python scripts, test files, `__pycache__`, agent YAML configs, and internal references — was copied into `packages/cli/skills/`. This bloats the CLI package with source assets that don't belong there.
2. **No external source support.** Bundling hardcodes the assumption that all skills live in this repo. The roadmap envisions skills from other repos, community contributions, and consumer-authored skills — none of which can be bundled.
3. **Wrong separation of concerns.** The CLI should know *where* to find skills, not *carry* them. The template package (`packages/docs/template/`) works because consumers receive docs structure — a static deliverable. Skills are different: they're agent instructions that may evolve independently, come from multiple sources, and should be installed on demand.

### What R1 got right

- The `skills: boolean` toggle in `InstallSelections` (Phase 2) is correct — it gates skill installation regardless of delivery mechanism.
- The `skillFiles?` field in `InstallManifest` is correct — it tracks installed skills for update/reconfigure.
- The `.claude/skills/` install target is correct — that's where Claude Code discovers skills.
- The concept of `.claude/skill-assets/<plugin>/` for supporting assets (references, scripts) is sound.

These Phase 2 changes are retained. Only the Phase 1 bundling approach is replaced.

### What was reverted

- `scripts/copy-template-to-cli.mjs` — skills copy step removed (the `syncDir` helper refactor was kept)
- `packages/cli/package.json` — `"skills"` removed from `files` array
- `packages/cli/skills/` — deleted (was created by the prepack run)

## Decision

### 1. Skill registry config

The CLI carries a **skill registry** — a configuration that lists available skills and where to find them. The registry is a JSON structure embedded in or loaded by the CLI, not a separate server.

```json
{
  "skills": [
    {
      "name": "decompose-codebase",
      "source": "local:packages/skills/decompose-codebase",
      "installTarget": ".claude/skills/decompose-codebase.md",
      "entryPoint": "SKILL.md",
      "required": false,
      "description": "Plan and reverse-engineer repos into structured PRDs."
    },
    {
      "name": "archive",
      "source": "local:packages/skills/archive-docs/skills/archive",
      "installTarget": ".claude/skills/archive-docs-archive.md",
      "entryPoint": "SKILL.md",
      "required": false,
      "description": "Relationship-aware archival with 4 modes.",
      "assets": [
        {
          "source": "local:packages/skills/archive-docs/references/archive-workflow.md",
          "installTarget": ".claude/skill-assets/archive-docs/references/archive-workflow.md"
        },
        {
          "source": "local:packages/skills/archive-docs/scripts/trace_relationships.py",
          "installTarget": ".claude/skill-assets/archive-docs/scripts/trace_relationships.py"
        }
      ]
    },
    {
      "name": "staleness-check",
      "source": "local:packages/skills/archive-docs/skills/staleness-check",
      "installTarget": ".claude/skills/archive-docs-staleness-check.md",
      "entryPoint": "SKILL.md",
      "required": false,
      "description": "Advisory scanning for archival candidates.",
      "assets": []
    },
    {
      "name": "deprecate",
      "source": "local:packages/skills/archive-docs/skills/deprecate",
      "installTarget": ".claude/skills/archive-docs-deprecate.md",
      "entryPoint": "SKILL.md",
      "required": false,
      "description": "Mark artifacts as superseded without archiving.",
      "assets": []
    },
    {
      "name": "archive-impact",
      "source": "local:packages/skills/archive-docs/skills/archive-impact",
      "installTarget": ".claude/skills/archive-docs-archive-impact.md",
      "entryPoint": "SKILL.md",
      "required": false,
      "description": "Dry-run impact analysis for archival.",
      "assets": []
    }
  ]
}
```

### 2. Source protocol

The `source` field uses a protocol prefix to indicate how the skill is fetched:

| Protocol | Format | Behavior |
| --- | --- | --- |
| `local:` | `local:<relative-path>` | Read from the local filesystem relative to the CLI package root. Used for skills that ship in the same repo. At dev time, resolves relative to the repo root. At published time, resolves relative to the CLI package root — meaning local skills still need to be bundled for the published package, BUT only the specific files listed in the registry (entry point + declared assets), not the entire directory tree. |
| `github:` | `github:<owner>/<repo>/<path>[@<ref>]` | Fetch from a GitHub repository via the GitHub API or raw content URL. Used for skills from other repos. Deferred to a future iteration. |
| `url:` | `url:<https://...>` | Fetch from an arbitrary HTTPS URL. Deferred to a future iteration. |

For the initial implementation, only `local:` is supported. `github:` and `url:` are defined in the schema but return a clear error ("remote skill sources are not yet supported") when encountered.

### 3. Install logic

When skills are enabled (`selections.skills === true`), the CLI:

1. Loads the skill registry (from the bundled config or an external config file).
2. Filters to skills that should be installed (all `required` skills + any selected by the user).
3. For each skill:
   a. Resolves the `source` using the protocol handler.
   b. Reads the `entryPoint` file (e.g., `SKILL.md`) from the resolved source.
   c. Rewrites relative references in the skill content so they point to the installed asset locations.
   d. Writes the rewritten content to `installTarget` (e.g., `.claude/skills/archive-docs-archive.md`).
4. For each declared `asset`:
   a. Reads the file from the resolved source.
   b. Copies it to the `installTarget` path.
5. Tracks all installed files in `manifest.skillFiles` for update/reconfigure.

### 4. Selective bundling for published CLI

For the published CLI package, local skills still need their entry points and declared assets to be accessible. Instead of copying the entire `packages/skills/` tree, the prepack script selectively copies only the files referenced by the registry:

- Each skill's `entryPoint` file
- Each skill's declared `assets`
- The `plugin.json` manifest (optional, for metadata)

This is a targeted copy, not a directory mirror. Python tests, `__pycache__`, agent YAMLs, and other non-installable files are excluded.

### 5. Registry location

Two options for where the registry lives:

- **Option A**: Embedded in the CLI source as a TypeScript constant (e.g., `src/skill-registry.ts`). Simple; registry changes require a CLI code change and rebuild.
- **Option B**: An external JSON file (e.g., `skill-registry.json` at the CLI package root) loaded at runtime. The file ships in the published package. Registry changes don't require a rebuild.

**Recommend Option B** — an external `skill-registry.json`. This makes it easy to inspect, edit, and extend without touching TypeScript. The CLI loads it at startup alongside the template root.

### 6. Wizard integration

The wizard's skills step (to be added in a follow-on phase) can read the registry to present available skills with descriptions. Skills marked `required: true` are installed automatically; others are opt-in via the wizard or `--skills` flag.

For the initial implementation, all registered skills are installed when `selections.skills === true`. Per-skill selection is deferred to the module/registry system on the roadmap.

### 7. Dogfood approach

For this project's own dogfood use:

1. The skill registry lists skills with `local:packages/skills/...` sources.
2. Running `npm run dev -w starter-docs -- init --yes --target .` installs skills from the local source into `.claude/skills/`.
3. This is the same mechanism consumers would use — the only difference is that consumers' published CLI resolves `local:` paths relative to the CLI package, while dev resolves them relative to the repo root.

### 8. What changes from R1

| Aspect | R1 (reverted) | R2 (this design) |
| --- | --- | --- |
| Skill source | Bundled in CLI package | Registry points to source locations |
| Prepack | Copies entire `packages/skills/` | Selectively copies only registered entry points + assets |
| External skills | Not supported | Supported via `github:` and `url:` protocols (future) |
| File duplication | Full directory mirror | Only installable files, only when published |
| Install logic | Copy from bundle to `.claude/skills/` | Fetch from source, rewrite paths, write to `.claude/skills/` |
| Registry | None | `skill-registry.json` listing available skills |

## Alternatives Considered

**Keep R1's bundling approach but filter out non-installable files.** Add a filter to the prepack copy that excludes `.py`, `.pyc`, `.yaml`, `__pycache__`, test files, etc. Rejected because: it's a deny-list that would need updating as new file types appear in skills. The registry's allow-list approach (only copy declared files) is inherently safer.

**Fetch all skills from GitHub at install time (no local source).** All skills, even first-party ones, would be fetched from the `starter-docs` GitHub repo. Rejected because: it adds a network dependency for basic installs, breaks offline use, and slows down the install flow. Local skills should be instant.

**npm package per skill.** Each skill could be its own npm package (e.g., `@starter-docs/skill-archive`). Consumers install skills as dependencies. Rejected because: the overhead of publishing and versioning individual skill packages is excessive at this stage. The registry model provides the same discoverability without the npm ceremony.

**Embed the registry in plugin.json files.** Each plugin's `plugin.json` could serve as its own registry entry, and the CLI could discover plugins by scanning `packages/skills/*/plugin.json`. Rejected for the CLI's immediate needs because: the CLI needs a single, ordered list of all installable skills — not a discovery mechanism that scans the filesystem. However, the `plugin.json` files remain useful as plugin metadata for future tooling.

## Consequences

**What improves:**
- No file duplication — skills exist in one place (`packages/skills/`) and are read from there.
- The published CLI package ships only the files consumers will actually receive, not entire skill source trees.
- External skill sources are architecturally supported (protocols defined, implementation deferred).
- The registry provides a single source of truth for what's installable, with descriptions and metadata.
- Dogfooding works the same way as consumer installation — `local:` protocol resolves the skill source.

**What shifts:**
- The CLI gains a `skill-registry.json` config file.
- The CLI gains source-protocol resolution logic (`local:` handler, future `github:`/`url:` handlers).
- The prepack script gains selective file copying based on registry entries (instead of the reverted full-directory copy).
- The path-rewriting logic from R1 is retained but operates on fetched content rather than bundled content.

**Risks:**
- **Registry maintenance:** Adding a new skill requires updating `skill-registry.json`. Mitigation: the registry is a simple JSON file; the `plugin.json` files could eventually be used to auto-generate it.
- **Selective prepack complexity:** The prepack script needs to parse the registry and copy individual files. More complex than a directory mirror, but more correct.
- **`local:` path resolution at dev vs. published time:** The same `local:packages/skills/...` path resolves differently depending on whether the CLI is running from source or from the published package. The resolver must handle both cases (similar to how `resolveTemplateRoot` handles sibling vs. bundled template).

**Deferred:**
- `github:` and `url:` protocol handlers
- Per-skill selection in the wizard (all-or-nothing for now)
- Auto-generation of `skill-registry.json` from `plugin.json` files

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation.md](2026-04-16-cli-skill-installation.md)
- Reason: R1's copy-based bundling approach was implemented, found to be fundamentally wrong (duplicates files, bundles non-installable assets, doesn't support external sources), and reverted. This design replaces it with a registry-based fetch model.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: This is the second revision of Wave 5 work. The downstream plan should be `w5-r2` and should cover: creating the registry JSON, implementing the `local:` protocol handler, updating the prepack for selective copying, integrating skill install into the plan/apply pipeline, wizard and CLI flag updates (carried from R1 Phase 4), tests, and dogfood validation.
