# Archive Docs — Relationship-Aware Document Archival Plugin

> Filename: `2026-04-16-archive-docs-skill.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Design an `archive-docs` plugin under `packages/skills/` that enables agents to perform intelligent, relationship-aware archival and lifecycle management of documents under `docs/`. The plugin bundles multiple focused skills — core archival, staleness detection, deprecation, and impact analysis — under a single installable unit, rather than shipping as a monolithic skill. This plugin goes beyond simple file moves: it understands the design → plan → work lifecycle, traces upstream and downstream relationships, interviews the user about related documents, handles replacement/deprecation scenarios, detects stale artifacts, rewrites broken links post-archive, and supports dry-run impact analysis.

## Context

### Current archival state

The `docs/.archive/` infrastructure is in place:

- `docs/.archive/AGENTS.md` defines the archive router, sub-directory mapping (`designs/`, `plans/`, `work/`, `prds/`), and the hard rule: never archive unless the user explicitly asks.
- `docs/.references/output-contract.md` defines archive rules for PRD full-set replacement.
- Individual artifact contracts (`design-contract.md`, etc.) each contain an "Archiving" section that defers to `docs/.archive/AGENTS.md`.
- The physical archive structure mirrors `docs/` — archived designs go to `docs/.archive/designs/`, etc.

### What's missing

No tooling or skill exists to help agents:

1. **Trace relationships** between artifacts when archiving. A work backlog was generated from a plan, which was generated from a design. Archiving the backlog without considering the upstream plan and design leaves orphaned artifacts — or worse, leaves active artifacts pointing at archived ones.
2. **Interview the user** about what else should move. The hard "never archive unless explicitly asked" rule is correct, but an agent should be able to *ask* whether related artifacts should also be archived when the user initiates archival of one.
3. **Handle indirect requests** like "archive all design docs related to this work backlog" or "archive the plan and work backlog for this design."
4. **Handle replacement** where a new document supersedes an old one (e.g., a new design replaces a prior design, or a new plan supersedes an earlier plan for the same initiative).
5. **Detect staleness** — identify artifacts that appear complete or superseded and surface them as archival candidates without auto-archiving.
6. **Assess impact before archiving** — show what would break (links, references) if an artifact were archived, before actually moving anything.
7. **Rewrite links** — update relative paths in surviving artifacts after archival, rather than just reporting broken links.
8. **Deprecate without archiving** — mark artifacts as superseded in place, deferring the physical move to a later decision.

### Artifact relationship model

The `make-docs` lifecycle creates a directed graph:

```
design → plan → work backlog
                    ↓
              agent guides (breadcrumbs per phase)
```

Additionally:
- Designs can have `## Design Lineage` linking to prior designs.
- Plans reference originating designs via `## Purpose` links.
- Work backlogs reference originating plans.
- Agent guides reference the active plan/work phase they were written under.
- Developer and user guides may reference designs, plans, or work via `related` frontmatter.
- PRDs exist in a separate namespace (change-managed, not wave-tracked) but can be referenced by plans and work.

The plugin needs to traverse these relationships in both directions:
- **Upstream**: from a work backlog, find its plan; from a plan, find its design(s).
- **Downstream**: from a design, find plans derived from it; from a plan, find work backlogs and agent guides.
- **Lateral**: from any artifact, find developer/user guides with `related` frontmatter pointing to it.

### Constraints

- The hard "never archive unless explicitly asked" rule remains. The plugin does NOT auto-archive anything — it interviews the user and executes only on explicit approval.
- The plugin must work with the existing `docs/.archive/` structure and not introduce a new archive scheme.
- Archived artifacts preserve their original filenames and directory structure (W/R naming for plans/work, date-slug for designs).
- The plugin must handle both the dogfood `docs/` and consumer projects using `make-docs`.

### Skill vs. plugin

This design packages the archive functionality as a **plugin** (a bundle of skills) rather than a single monolithic skill, for three reasons:

1. **Separation of concerns.** Core archival (move files, interview about related docs) is a different workflow from staleness detection (scan the tree, report candidates) and deprecation (mark in place without moving). Bundling them into one skill would overload the trigger surface and make the skill's prompt unwieldy.
2. **Progressive disclosure.** A plugin lets consumers install the full bundle but invoke individual skills by name. A user who just wants to deprecate a guide doesn't need to wade through archival interview logic.
3. **Future extensibility.** The follow-on design ([2026-04-16-archive-docs-extended.md](../../../designs/2026-04-16-archive-docs-extended.md)) proposes additional capabilities (archive search/recall, wave lifecycle, PRD rotation, archive provenance, completion hooks). These are natural new skills within the same plugin, not extensions of a single skill.

## Decision

### 1. Plugin structure

Create `packages/skills/archive-docs/` as a plugin with multiple skills:

```
packages/skills/archive-docs/
├── plugin.json                       # Plugin manifest (name, version, skills list)
├── skills/
│   ├── archive/
│   │   └── SKILL.md                  # Core archival skill (direct, related, replacement, project modes)
│   ├── staleness-check/
│   │   └── SKILL.md                  # Staleness detection and archival candidate reporting
│   ├── deprecate/
│   │   └── SKILL.md                  # Deprecation-in-place without archival
│   └── archive-impact/
│       └── SKILL.md                  # Dry-run impact analysis
├── agents/
│   └── openai.yaml                   # Codex agent config (covers the full plugin)
├── references/
│   └── archive-workflow.md           # Shared authority for the archival workflow
└── scripts/
    └── trace_relationships.py        # Relationship tracer (shared across skills)
```

The plugin is self-contained. It bundles its own reference file and tracing script, shared across all four skills. Each skill's `SKILL.md` references the shared `archive-workflow.md` for relationship tracing rules and archive structure.

### 2. Skill: `archive` — Core archival

The primary skill. Supports four archival modes, determined from the user's request:

| Mode | Trigger | Behavior |
| --- | --- | --- |
| **Direct archive** | "Archive this design / plan / work backlog" | Archive the named target. Trace relationships and interview the user about upstream, downstream, and lateral artifacts. |
| **Related archive** | "Archive all docs related to {target}" | Identify the target but do NOT archive it. Find and present all related artifacts for the user to select from. |
| **Replacement archive** | "This new design replaces the old one" / agent detects `## Design Lineage` with `updated-existing` | Archive the superseded artifact. Offer to rewrite links in downstream artifacts that pointed to the old one. |
| **Project archive** | "Archive everything for {initiative/slug}" | Trace the full design → plan → work → guides chain for the initiative. Present the complete set for user confirmation. |

Mode detection is intent-based: the skill infers the mode from the user's phrasing and confirms before proceeding.

#### User interview flow

1. **Identify the target(s)** — parse the user's request to determine which artifact(s) to archive.
2. **Trace relationships** — find upstream, downstream, and lateral artifacts related to each target.
3. **Present findings** — show the user a summary: "I found these related artifacts. Which would you also like to archive?"
   - Group by relationship type (upstream, downstream, lateral).
   - Mark each with a recommendation (e.g., "upstream design — recommend archiving since all downstream work is complete").
   - Clearly distinguish what the user explicitly asked to archive vs. what the skill is suggesting.
4. **Confirm** — wait for explicit user approval. The user can select all, some, or none of the suggested additions.
5. **Execute** — move approved artifacts to `docs/.archive/` following the existing sub-directory mapping.
6. **Post-archive link rewriting** — scan remaining active artifacts for links to newly archived files. Rewrite relative paths from their original location to the archive location (e.g., `../../plans/...` → `../../.archive/plans/...`). Present the rewrites for user confirmation before applying.

#### Replacement detection

The skill detects replacement scenarios from:

- **Explicit user statement**: "This new design replaces {old design}."
- **Design Lineage section**: A design with `Update Mode: new-doc-related` and `Prior Design Docs:` linking to an earlier design.
- **Guide frontmatter**: A guide with `status: deprecated` and `related:` pointing to a replacement.
- **Same-slug heuristic**: A new plan/work directory with the same slug as an existing one (different wave/date).

On detection, the skill offers to archive the superseded artifact and rewrite any downstream references.

### 3. Skill: `staleness-check` — Archival candidate detection

An advisory skill that scans the doc tree without archiving anything.

**Staleness signals:**

| Signal | Applies to | Detection |
| --- | --- | --- |
| All downstream phases complete | Work backlogs | Every acceptance criterion checkbox in phase files is checked (`- [x]`) |
| All downstream work complete | Plans | Every work backlog derived from the plan has all phases complete |
| All downstream plans and work complete | Designs | Every plan derived from the design has all work complete |
| Status is `deprecated` | Developer/user guides | Frontmatter `status: deprecated` |
| Superseded by a newer artifact | Designs, plans | A newer artifact with the same slug or a `## Design Lineage` link exists |
| No active references | Any artifact | No other active (non-archived) artifact links to this one |

**Output:** A grouped report of archival candidates with the staleness signal for each. The user can then invoke the `archive` skill on any candidates they approve.

**Invocation:** "Check for stale docs", "What's ready to archive?", "Run a staleness check."

### 4. Skill: `deprecate` — Mark as superseded without archiving

A lighter-weight alternative to archival for artifacts that are outdated but should remain discoverable in place.

**Behavior:**

1. Add a deprecation notice at the top of the artifact (after any frontmatter):
   ```markdown
   > **Deprecated:** This document has been superseded by [replacement](relative-link). It is retained for historical reference.
   ```
2. For guides with YAML frontmatter, set `status: deprecated`.
3. Optionally record what replaced the artifact (user provides or the skill detects via lineage/slug matching).
4. Do NOT move the file to `docs/.archive/`.

**Invocation:** "Deprecate this design", "Mark this plan as superseded by {new plan}", "Deprecate all guides tagged {topic}."

**Relationship to archival:** Deprecation is a precursor to archival. A deprecated artifact can later be archived via the `archive` skill. The `staleness-check` skill treats `deprecated` status as a staleness signal.

### 5. Skill: `archive-impact` — Dry-run impact analysis

A read-only skill that answers "what would happen if I archived this?" without modifying anything.

**Output:**

- List of files that would be moved and their archive destinations.
- List of active artifacts that link to the target(s) — these links would break.
- Proposed link rewrites (showing old path → new path for each broken link).
- Count of agent guides, developer guides, and user guides that reference the target.
- Whether the target has incomplete downstream work (a warning signal).

**Invocation:** "What would happen if I archived this plan?", "Show the impact of archiving wave 2", "Dry-run archive for {slug}."

The user can review the impact report and then invoke `archive` if they're comfortable with the consequences.

### 6. Relationship tracing (shared)

All four skills share the same relationship tracing logic, documented in `references/archive-workflow.md` and optionally automated by `scripts/trace_relationships.py`.

**Upstream tracing (from target, find ancestors):**
- Work backlog → scan `00-index.md` or phase files for links to `docs/plans/`
- Plan → scan `00-overview.md` for links to `docs/designs/`
- Agent guide → parse `w{W}-r{R}-p{P}` from filename, find matching plan/work directories with the same wave

**Downstream tracing (from target, find dependents):**
- Design → scan `docs/plans/` for overview files linking back to the design
- Plan → scan `docs/work/` for index files linking back to the plan
- Plan/Work → scan `docs/guides/agent/` for guides matching the same wave/revision

**Lateral tracing:**
- Any artifact → scan `docs/guides/developer/` and `docs/guides/user/` for guides with `related` frontmatter entries pointing to the artifact

**Slug-based heuristic:** When link-based tracing misses relationships (e.g., links were never added), fall back to slug matching — a plan with slug `guide-structure-contract` is likely related to a design with the same slug.

The `scripts/trace_relationships.py` script can automate this scanning for large doc trees, but all skills must also work without it (manual inspection by the agent).

### 7. Archive sub-directory mapping

The plugin follows the existing `docs/.archive/` structure and extends it for artifact types not yet mapped:

| Artifact type | Archive target |
| --- | --- |
| Design | `docs/.archive/designs/` |
| Plan directory | `docs/.archive/plans/` |
| Work directory | `docs/.archive/work/` |
| PRD set | `docs/.archive/prds/YYYY-MM-DD/` |
| Agent guide | `docs/.archive/guides/agent/` |
| Developer guide | `docs/.archive/guides/developer/` |
| User guide | `docs/.archive/guides/user/` |

Guide archive sub-directories are new — the current `docs/.archive/AGENTS.md` only maps `designs/`, `plans/`, `work/`, and `prds/`. The archive router will need updating to include guide archive paths.

### 8. Archive workflow reference

Create `packages/skills/archive-docs/references/archive-workflow.md` as the authority file shared by all four skills. This contains:

- The four archival modes with decision criteria.
- Staleness detection signals and thresholds.
- Deprecation rules (notice format, frontmatter updates).
- Relationship tracing rules (upstream, downstream, lateral, slug heuristic).
- Interview flow with question templates.
- Replacement detection rules.
- Link rewriting rules (path transformation patterns, confirmation requirements).
- Impact analysis output format.
- The relationship to `docs/.archive/AGENTS.md` (that file remains the authority for archive structure and the hard rule; this reference governs the *workflow* for getting there).

### 9. Dogfooding and project-level agent configuration

After the plugin is developed and tested, it must be made available at the project level for both Claude Code and Codex agents:

**Claude Code:**
- Register each skill in `.claude/settings.json` (project-level, committed to source control) pointing to the respective `SKILL.md` files.
- Alternatively, if the project adopts the plugin convention, register the plugin via `plugin.json`.

**Codex (OpenAI):**
- Create `packages/skills/archive-docs/agents/openai.yaml` with the Codex agent config (display name, description, default prompt, policy).
- Register the agent in the project's `.agents/` directory or equivalent Codex configuration.

**Dogfood validation:**
- Test each skill against the existing dogfood `docs/` tree (which has 8 designs, 2 plans, 2 work backlogs, and multiple agent guides).
- Verify relationship tracing correctly identifies the design → plan → work chains for both the guide-structure-contract and design-naming-simplification initiatives.
- Verify the interview flow correctly suggests upstream/downstream artifacts.
- Verify staleness detection identifies completed work backlogs.
- Verify deprecation adds the correct notice format.
- Verify impact analysis produces accurate link-breakage reports.

### 10. Archive router updates

The `docs/.archive/AGENTS.md` (both in template and dogfood) needs updating to include guide archive sub-directories:

```
- `docs/.archive/guides/agent/` — archived agent session guides.
- `docs/.archive/guides/developer/` — archived developer guides.
- `docs/.archive/guides/user/` — archived user guides.
```

This change should be made in the template package and re-seeded to the dogfood docs.

## Alternatives Considered

**Single monolithic skill instead of a plugin.** All archive capabilities (core archival, staleness, deprecation, impact analysis) could live in one `SKILL.md`. Rejected because: a single skill becomes overloaded — its trigger surface is too broad, its prompt too long, and consumers who want only one capability (e.g., staleness checks) must parse through all the others. A plugin with focused skills gives better progressive disclosure and keeps each skill's instructions concise.

**Automated archival without user interview.** The skill could detect when all downstream work is complete and auto-archive upstream artifacts. Rejected because: this violates the hard "never archive unless explicitly asked" rule. The interview flow preserves user control while reducing the cognitive burden of remembering what else to archive.

**Archive via git tags or branches instead of a directory.** Moving files to `docs/.archive/` could be replaced by tagging a commit and deleting the files, with retrieval via `git show`. Rejected because: it breaks the "archived artifacts are referenced in place via relative links" model that the existing contracts depend on. Files in `docs/.archive/` remain browsable and linkable.

**A CLI command (`make-docs archive`) instead of a plugin.** The archival logic could live in the CLI rather than as agent skills. Rejected because: the relationship tracing and user interview require conversational interaction that a CLI command can't provide. The plugin leverages the agent's ability to read files, follow links, and ask questions. A future CLI integration could invoke skills non-interactively for simple cases.

**No relationship tracing — archive only what the user names.** Simpler to implement but loses the core value proposition. The whole point is that users shouldn't need to remember the full dependency chain. Rejected in favor of tracing-with-interview.

**Embed archive logic in each artifact's contract.** Each contract (design, plan, work) could include archival workflow rules. Rejected because: archival is cross-cutting — it spans artifact types and relationships. A plugin with a shared workflow reference is cleaner than distributing the logic across 5+ contracts.

**Report broken links without offering to rewrite them.** The original design proposed detecting broken links post-archive and reporting them. Upgraded to link rewriting because: reporting without fixing creates a manual chore that users will defer. Offering to rewrite (with confirmation) closes the loop in one interaction.

## Consequences

**What improves:**
- Users can archive with confidence — the plugin surfaces the full dependency chain so nothing is orphaned.
- Replacement workflows become explicit — the plugin detects when a new asset supersedes an old one and handles the transition.
- The "never archive unless asked" rule is preserved while making archival less tedious — the plugin asks the right questions so the user doesn't have to remember what's related.
- Staleness detection flips the interaction model — instead of users remembering to archive, the plugin surfaces what's ready.
- Deprecation provides a lighter-weight alternative for artifacts that should stay discoverable but are clearly superseded.
- Impact analysis gives users a "measure twice" tool before committing to archival.
- Link rewriting keeps the doc tree internally consistent after archival without manual fixup.
- Both Claude Code and Codex agents can use the plugin via project-level configuration.

**What shifts:**
- `packages/skills/` gains a new `archive-docs/` directory structured as a plugin with four skills, a shared reference, an OpenAI agent config, and a tracing script.
- `docs/.archive/AGENTS.md` (template and dogfood) gains guide archive sub-directory mappings.
- `.claude/settings.json` gains skill registration entries.
- A `.agents/` directory may be created at the project root for Codex agent configuration.

**Risks:**
- **Relationship tracing accuracy**: Link-based tracing depends on artifacts actually containing links to their upstream/downstream counterparts. If links are missing, the slug heuristic is a fallback but may produce false positives. Mitigation: all skills present findings for user confirmation, never auto-archive or auto-rewrite.
- **Large doc trees**: Tracing across a large `docs/` with many artifacts could be slow without the script helper. Mitigation: the `trace_relationships.py` script can pre-compute the relationship graph; all skills work without it but recommend it for large trees.
- **Codex agent limitations**: Codex agents may not support the same interactive interview flow as Claude Code. Mitigation: the skill's interview flow degrades gracefully — if the agent can't ask follow-up questions, it presents the full relationship set and asks for a single confirmation.
- **Plugin convention maturity**: The plugin packaging model (per the agentics ecosystem design) is not yet implemented. This plugin may need to ship as a collection of standalone skills initially and be re-packaged as a plugin once the registry/gateway infrastructure lands.

**Deferred:**
- Archive manifest generation — deferred to the follow-on design ([2026-04-16-archive-docs-extended.md](../../../designs/2026-04-16-archive-docs-extended.md)).
- Undo/restore functionality — deferred to the follow-on design.
- Archive-on-completion hooks — deferred to the follow-on design.
- Archive search/recall — deferred to the follow-on design.
- Wave lifecycle management — deferred to the follow-on design.
- PRD active-set rotation — deferred to the follow-on design.
- Template-level distribution of the plugin — deferred to the follow-on design.
- Integration with the `make-docs` CLI for non-interactive archival — deferred to the follow-on design.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: The plugin requires implementing four SKILL.md files, a shared archive-workflow reference, a relationship tracing script, archive router updates, agent configuration, and dogfood validation — a baseline plan should sequence this work. The follow-on design ([2026-04-16-archive-docs-extended.md](../../../designs/2026-04-16-archive-docs-extended.md)) captures additional capabilities to be planned separately.
