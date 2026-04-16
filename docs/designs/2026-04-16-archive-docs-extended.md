# Archive Docs Extended — Lifecycle Automation, Search, and Distribution

> Filename: `2026-04-16-archive-docs-extended.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Extend the `archive-docs` plugin (designed in [2026-04-16-archive-docs-skill.md](2026-04-16-archive-docs-skill.md)) with lifecycle automation, archive search/recall, wave-scoped archival, PRD active-set rotation, provenance tracking, and template-level distribution. These capabilities build on the core archival, staleness detection, deprecation, and impact analysis skills already designed, and are scoped as separate skills or enhancements within the same plugin.

## Context

The base `archive-docs` plugin provides four skills: core archival (with relationship tracing and user interview), staleness detection, deprecation-in-place, and dry-run impact analysis. Those skills cover the interactive, user-initiated archival workflow.

This follow-on design addresses the capabilities that were deferred from the base design because they either require additional infrastructure (hooks, search indexing), operate at a higher abstraction level (wave lifecycle, PRD rotation), or involve distribution decisions (template-level shipping) that depend on the agentics ecosystem roadmap.

### Relationship to the agentics ecosystem

The [agentics ecosystem design](2026-04-15-w2-r0-agentics-ecosystem.md) proposes a registry, gateway skill, and module system for distributing skills, hooks, agents, and workflows as installable units. Several capabilities in this design — particularly completion hooks, template-level distribution, and workflow integration — depend on that infrastructure. Where dependencies exist, this design notes them and proposes interim solutions that work without the full ecosystem.

## Decision

### 1. Skill: `archive-on-completion` — Completion-triggered archive suggestions

A hook-aware skill that triggers the archive interview flow when an initiative appears complete.

**Trigger conditions:**
- An agent marks the last acceptance criterion in a work backlog phase (detected via a PostToolUse hook on Write when the target is a work phase file and the edit checks the last `- [ ]` box).
- A user states "this initiative is done" or "we're finished with {slug}."
- The `staleness-check` skill reports that all downstream work for a design is complete.

**Behavior:**
- Present a summary: "This work backlog appears complete. Its upstream plan and design may also be ready to archive."
- Invoke the core `archive` skill's interview flow with the completed work backlog as the entry point.
- If the user declines, do nothing — the suggestion is advisory only.

**Hook integration:**
- Requires a PostToolUse hook that fires when a work phase file is written. The hook inspects the diff to detect whether the last unchecked acceptance criterion was just checked.
- If hooks are not supported by the harness, the skill degrades to manual invocation: the user says "check if anything is ready to archive" after completing work.

**Plugin structure addition:**
```
packages/skills/archive-docs/
├── skills/
│   └── archive-on-completion/
│       └── SKILL.md
└── hooks/
    └── on-work-complete.sh        # PostToolUse hook for completion detection
```

### 2. Skill: `archive-search` — Search and recall from the archive

A read-only skill that makes `docs/.archive/` queryable.

**Capabilities:**
- **Keyword search**: "What was the design for the auth redesign?" → searches archived designs by slug, title, and content.
- **Timeline search**: "What did we archive in March?" → searches by archive date (derived from file modification time or archive manifest if available).
- **Relationship search**: "What was archived alongside this plan?" → uses the same relationship tracing to find co-archived artifacts.
- **Context retrieval**: Returns the archived artifact's content with metadata about when it was archived, what replaced it (if known), and what wave/initiative it belonged to.

**Integration with MCP:**
- If `jdocmunch` is available, the skill indexes `docs/.archive/` and uses section search for efficient retrieval.
- If `jcodemunch` is available, the skill uses text search for content-level queries.
- Without MCP, the skill falls back to filesystem scanning.

**Plugin structure addition:**
```
packages/skills/archive-docs/
└── skills/
    └── archive-search/
        └── SKILL.md
```

### 3. Skill: `archive-wave` — Wave lifecycle management

A specialized archival mode that operates at the wave level rather than the individual artifact level.

**Behavior:**
- "Archive wave 2" → find all designs, plans, work backlogs, and agent guides with `w2` in their filename or associated with wave 2 via relationship tracing. Present the complete set for confirmation.
- "Archive all completed waves" → run staleness detection across all waves, identify waves where every artifact in the chain is complete, present as archival candidates.
- Handles the edge case where a wave spans multiple slugs (e.g., wave 2 has `guide-structure-contract`, `design-naming-simplification`, and `asset-pipeline-completeness` — all are wave 2 artifacts).

**Note on design naming simplification:** Designs no longer carry wave numbers in their filenames (per the design naming simplification). The skill traces designs into waves via their downstream plans and work backlogs, which do carry wave numbers. A design is considered "part of wave N" if any plan derived from it is wave N.

**Plugin structure addition:**
```
packages/skills/archive-docs/
└── skills/
    └── archive-wave/
        └── SKILL.md
```

### 4. Skill: `rotate-prd-set` — PRD active-set rotation

Formalizes the PRD archival workflow already described in `output-contract.md` as a first-class skill.

**Behavior:**
1. Inspect `docs/prd/` for active root entries.
2. Present the current active set: "These are the current active PRDs. Rotating will archive them under `docs/.archive/prds/YYYY-MM-DD/`."
3. On approval, move the active set to `docs/.archive/prds/YYYY-MM-DD/` (or `YYYY-MM-DD-XX/` if the date is already taken).
4. Verify `docs/prd/` is empty and ready for a fresh set.
5. Optionally invoke the `decompose-codebase` skill or prompt the user to generate a new PRD set.

**Relationship to existing contracts:**
- The output contract already defines this workflow in prose. This skill makes it executable without the user needing to remember the archival path format, date-increment rules, or manual steps.
- The skill defers to `docs/.archive/AGENTS.md` for structure and to `output-contract.md` for the rotation rules.

**Plugin structure addition:**
```
packages/skills/archive-docs/
└── skills/
    └── rotate-prd-set/
        └── SKILL.md
```

### 5. Archive provenance and manifest

Add provenance tracking to all archival operations.

**Manifest file:** `docs/.archive/MANIFEST.md` — a running log of archival events.

**Entry format:**
```markdown
## YYYY-MM-DD — {description}

| Artifact | Archive target | Reason | Replaced by | Session |
| --- | --- | --- | --- | --- |
| `docs/designs/2026-04-15-w2-r0-monorepo-restructuring.md` | `docs/.archive/designs/` | Initiative complete | — | `w2-r0-p1-summary` |
```

**Fields:**
- **Artifact**: original path.
- **Archive target**: destination sub-directory.
- **Reason**: why it was archived (user-provided or inferred — "initiative complete", "superseded by {new artifact}", "deprecated", "PRD rotation").
- **Replaced by**: link to the replacement artifact, if any. `—` if none.
- **Session**: link to the agent guide that documents the session where the archival happened.

**Behavior:**
- Every archival operation (from any skill in the plugin) appends an entry to `MANIFEST.md`.
- The manifest is append-only. Entries are never removed (even if an artifact is later restored).
- If `MANIFEST.md` doesn't exist, the skill creates it with a header.
- The `archive-search` skill can query the manifest for timeline and reason-based searches.

### 6. Template-level distribution

Once the agentics ecosystem infrastructure (registry, gateway, module system) is in place, the `archive-docs` plugin should ship as part of the template — consumers who install `starter-docs` get the archive skills automatically.

**Interim approach (before the ecosystem lands):**
- The plugin lives in `packages/skills/archive-docs/` and is registered at the project level via `.claude/settings.json` and `.agents/`.
- Consumers who clone or install `starter-docs` can manually register the skills.
- The `starter-docs` CLI does not yet know about skills (it ships only the docs template).

**Future approach (after the ecosystem lands):**
- The plugin is registered in `packages/registry/index.json` as a module.
- `starter-docs add archive-docs` installs the skills, hooks, and agent configs into the consumer's project.
- The gateway skill can invoke archive skills by name.
- The `starter-docs doctor` command can verify archive skill registration.

**Dependency:** This capability depends on the agentics ecosystem design being implemented. It should not block the initial plugin release.

### 7. Complete plugin structure (all skills)

After both the base and extended designs are implemented:

```
packages/skills/archive-docs/
├── plugin.json
├── skills/
│   ├── archive/                     # Core archival (base design)
│   │   └── SKILL.md
│   ├── staleness-check/             # Staleness detection (base design)
│   │   └── SKILL.md
│   ├── deprecate/                   # Deprecation-in-place (base design)
│   │   └── SKILL.md
│   ├── archive-impact/              # Dry-run impact analysis (base design)
│   │   └── SKILL.md
│   ├── archive-on-completion/       # Completion-triggered suggestions (this design)
│   │   └── SKILL.md
│   ├── archive-search/              # Archive search and recall (this design)
│   │   └── SKILL.md
│   ├── archive-wave/                # Wave lifecycle management (this design)
│   │   └── SKILL.md
│   └── rotate-prd-set/              # PRD active-set rotation (this design)
│       └── SKILL.md
├── agents/
│   └── openai.yaml
├── hooks/
│   └── on-work-complete.sh          # PostToolUse hook (this design)
├── references/
│   └── archive-workflow.md
└── scripts/
    └── trace_relationships.py
```

## Alternatives Considered

**Ship extended capabilities as a separate plugin.** The lifecycle automation skills (completion hooks, wave archival, PRD rotation) could be a different plugin from the core archive skills. Rejected because: they share the same relationship tracing infrastructure, the same archive-workflow reference, and the same tracing script. Splitting them would duplicate shared assets and force consumers to install two plugins for complete archive coverage.

**Archive provenance via git commit messages instead of a manifest.** Each archival `git mv` could carry a structured commit message with the reason and replacement info. Rejected because: commit messages aren't queryable by the archive-search skill without git log parsing, and they're invisible to non-git-aware agents. A manifest file is browsable, linkable, and searchable.

**Build archive-search as a standalone skill outside the plugin.** Search/recall could be a general-purpose "docs search" skill that happens to cover the archive. Rejected because: archive-specific search needs provenance awareness (when was it archived? what replaced it?) that a general search skill wouldn't carry. It belongs in the archive plugin where it can read the manifest.

**Implement all extended capabilities immediately in the base design.** Fold everything into one design and one plan. Rejected because: the base plugin (core archival, staleness, deprecation, impact analysis) is independently valuable and can ship sooner. The extended capabilities depend on additional infrastructure (hooks, MCP integration, agentics ecosystem) that may not be ready. Phasing the work lets the base plugin prove the model before investing in the extensions.

## Consequences

**What improves:**
- Completion hooks close the gap between finishing work and archiving — the moment you're most likely to forget is the moment the system reminds you.
- Archive search turns `docs/.archive/` from a graveyard into a queryable knowledge base.
- Wave lifecycle management lets users think in terms of initiatives rather than individual files.
- PRD rotation becomes a one-command operation instead of a manual, error-prone process.
- Provenance tracking creates an audit trail that makes the archive self-documenting.
- Template-level distribution (once the ecosystem lands) means consumers get archive capabilities out of the box.

**What shifts:**
- The plugin grows from 4 skills to 8, plus a hook and a manifest file.
- The archive-workflow reference needs additional sections for completion detection, wave scoping, PRD rotation rules, and manifest format.
- The tracing script may need MCP integration for archive-search.

**Risks:**
- **Hook portability**: The completion hook is Claude Code-specific. Other harnesses may not support PostToolUse hooks. Mitigation: the skill degrades gracefully to manual invocation.
- **Manifest drift**: If archival happens outside the plugin (manual `git mv`), the manifest becomes stale. Mitigation: the `staleness-check` skill can detect archived files not in the manifest and offer to backfill entries.
- **Ecosystem dependency**: Template-level distribution and gateway integration depend on infrastructure that doesn't exist yet. Mitigation: the plugin works standalone via project-level registration; ecosystem integration is additive, not blocking.

**Deferred:**
- Undo/restore functionality (reversing an archive operation).
- Integration with the `starter-docs` CLI for non-interactive archival.
- Archive retention policies (auto-prune archives older than N days/waves).

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-archive-docs-skill.md](2026-04-16-archive-docs-skill.md)
- Reason: This design extends the base archive plugin with lifecycle automation, search, wave management, PRD rotation, provenance, and distribution capabilities that were explicitly deferred from the base design.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: The extended capabilities should be planned after the base plugin is implemented and validated. The plan should sequence the skills by dependency (provenance first since other skills write to it, then search, then wave/PRD/completion in any order, then template distribution last since it depends on the agentics ecosystem).
