# Phase 5 — Agent Configuration and Dogfood Validation

## Objective

Create agent configuration files for the archive-docs plugin (Codex and Claude Code), register all skills at the project level, establish the `.agents/` convention, and validate the entire plugin against the dogfood doc tree.

## Depends On

- **Phase 2** — Archive router updates must be in place so validation can confirm guide sub-directory mappings.
- **Phase 3** — The core `archive` SKILL.md must exist for registration and workflow validation.
- **Phase 4** — The `staleness-check`, `deprecate`, and `archive-impact` SKILL.md files must exist for registration and workflow validation.

## Files to Create/Modify

| # | File | Action | Role |
|---|------|--------|------|
| 1 | `packages/skills/archive-docs/agents/openai.yaml` | Create | Codex agent config covering the full plugin |
| 2 | `.claude/settings.json` | Create or modify | Project-level skill registration for Claude Code (committed) |
| 3 | `.agents/README.md` | Create | Convention doc for Codex agent discovery at the repo root |

## Detailed Changes

### 1. `packages/skills/archive-docs/agents/openai.yaml`

Model after `packages/skills/decompose-codebase/agents/openai.yaml`. Fields:

```yaml
interface:
  display_name: "Archive Docs"
  short_description: "Relationship-aware document archival, staleness detection, deprecation, and impact analysis"
  default_prompt: "Use $archive-docs to manage document lifecycle — archive, detect staleness, deprecate, or assess archival impact for documents under docs/."
policy:
  allow_implicit_invocation: true
```

The `display_name` covers the plugin as a whole. Individual skills (archive, staleness-check, deprecate, archive-impact) are exposed through their SKILL.md files but share this single Codex agent entry point.

### 2. `.claude/settings.json`

This is the project-level settings file (committed to the repo). It must NOT duplicate the user-local `.claude/settings.local.json` content. If the file does not exist, create it with only a `skills` key. If it already exists, merge the new skill registrations into the existing content.

Register each skill pointing to its SKILL.md path relative to the repo root:

```json
{
  "skills": [
    "packages/skills/decompose-codebase/SKILL.md",
    "packages/skills/archive-docs/skills/archive/SKILL.md",
    "packages/skills/archive-docs/skills/staleness-check/SKILL.md",
    "packages/skills/archive-docs/skills/deprecate/SKILL.md",
    "packages/skills/archive-docs/skills/archive-impact/SKILL.md"
  ]
}
```

Notes:
- Include the existing `decompose-codebase` skill so the project-level file is the single source of truth for all skill registrations.
- The `permissions` key belongs in `.claude/settings.local.json` (user-local, not committed) and must NOT appear here.
- If `.claude/settings.json` already exists with other keys, preserve them and add/merge the `skills` array.

### 3. `.agents/` directory

Create `.agents/` at the repo root as the Codex agent discovery directory. Add a `README.md` explaining the convention:

- Each plugin under `packages/skills/` that ships an `agents/openai.yaml` is discoverable by Codex.
- The README lists the current registrations with relative paths to each `openai.yaml`.
- Future plugins follow the same pattern: add an `agents/openai.yaml` inside the plugin directory and reference it here.

Contents of `.agents/README.md`:

```markdown
# Codex Agent Registry

This directory is the Codex agent discovery root. Each plugin under
`packages/skills/` ships its own `agents/openai.yaml`.

## Registered Agents

| Plugin | Config Path |
|--------|-------------|
| decompose-codebase | `packages/skills/decompose-codebase/agents/openai.yaml` |
| archive-docs | `packages/skills/archive-docs/agents/openai.yaml` |

To register a new plugin, add an `agents/openai.yaml` inside the plugin
directory and add a row to the table above.
```

## Dogfood Validation

Execute these validation tasks in order. All must pass before the phase is complete.

### V1. Relationship tracer against the dogfood doc tree

Run `python packages/skills/archive-docs/scripts/trace_relationships.py` against `docs/`. Verify:

- The script exits 0.
- The output includes a valid relationship graph covering the existing doc tree: at least 8 design docs, 2+ plan directories, 2+ work backlog directories, and agent guide artifacts.
- No parsing errors or unhandled file types in the output.

### V2. Relationship chain correctness

Inspect the tracer output and verify it correctly identifies design-plan-work chains. Specifically:

- The `guide-structure-contract` chain: a design doc links to a plan, which links to a work backlog.
- The `design-naming-simplification` chain: a design doc links to a plan, which links to a work backlog.
- Upstream and downstream edges are correctly directional (design -> plan -> work, not reversed).
- Lateral relationships (guides referencing plans/work via `related` frontmatter) are detected.

### V3. Manual skill invocation

For each of the four skills, read its SKILL.md and mentally walk through the workflow against the dogfood docs:

1. **archive**: Pick an existing design (e.g., an older design doc). Verify the SKILL.md instructions would correctly identify its downstream plan and work, present the interview, and execute the archive to `docs/.archive/designs/`.
2. **staleness-check**: Verify the SKILL.md instructions would scan `docs/` and identify any completed chains as archival candidates.
3. **deprecate**: Verify the SKILL.md instructions would correctly mark a design as deprecated in place without moving it.
4. **archive-impact**: Verify the SKILL.md instructions would produce a dry-run report showing what links would break if a specific artifact were archived.

Document any gaps or contradictions between the SKILL.md instructions and the actual doc tree structure.

### V4. Full validation suite

Run `just validate`. Verify:

- All tests pass.
- No router drift detected.
- Wave numbering checks pass.
- The new files do not break any existing validation rules.

### V5. Router check

Run `bash scripts/check-instruction-routers.sh`. Verify:

- Exit code 0.
- No drift between template and dogfood instruction routers.
- The Phase 2 guide sub-directory additions are intact and byte-identical across all four router files.

## Acceptance Criteria

1. `packages/skills/archive-docs/agents/openai.yaml` exists with `interface` and `policy` sections matching the decompose-codebase pattern.
2. `.claude/settings.json` exists at the repo root, contains a `skills` array listing all five SKILL.md paths (1 decompose-codebase + 4 archive-docs), and contains NO `permissions` key.
3. `.agents/README.md` exists and documents the Codex agent discovery convention with a table of registered plugins.
4. `trace_relationships.py` runs successfully against `docs/` and produces a relationship graph covering designs, plans, work backlogs, and guides (V1).
5. The relationship tracer correctly identifies at least two design-plan-work chains with correct directionality (V2).
6. Manual skill walkthrough reveals no blocking gaps or contradictions in any of the four SKILL.md files (V3).
7. `just validate` passes (V4).
8. `bash scripts/check-instruction-routers.sh` passes with exit code 0 (V5).
9. No files outside the scope of this phase are modified.
