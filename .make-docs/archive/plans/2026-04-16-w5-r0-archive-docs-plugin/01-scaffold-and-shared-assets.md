# Phase 1 — Scaffold and Shared Assets

## Objective

Create the `packages/skills/archive-docs/` plugin directory tree, the `plugin.json` manifest, the shared `archive-workflow.md` reference, and the `trace_relationships.py` relationship-tracing script. After this phase the full directory scaffold exists with empty skill directories ready for later phases, and the two shared assets that all four skills depend on are in place.

## Files to Create

| File | Purpose |
| ---- | ------- |
| `packages/skills/archive-docs/plugin.json` | Plugin manifest — name, version, description, skills list. |
| `packages/skills/archive-docs/references/archive-workflow.md` | Shared authority for the archival workflow, referenced by all four skills. |
| `packages/skills/archive-docs/scripts/trace_relationships.py` | Standalone relationship-tracing script for pre-computing the doc tree relationship graph. |

Empty directories to create (populated in later phases):

| Directory | Populated in |
| --------- | ------------ |
| `packages/skills/archive-docs/skills/archive/` | Phase 3 |
| `packages/skills/archive-docs/skills/staleness-check/` | Phase 4 |
| `packages/skills/archive-docs/skills/deprecate/` | Phase 4 |
| `packages/skills/archive-docs/skills/archive-impact/` | Phase 4 |
| `packages/skills/archive-docs/agents/` | Phase 5 |

## Detailed Specifications

### 1. Directory scaffold

Create the full directory tree in one pass:

```
packages/skills/archive-docs/
├── skills/
│   ├── archive/
│   ├── staleness-check/
│   ├── deprecate/
│   └── archive-impact/
├── agents/
├── references/
└── scripts/
```

All sub-directories under `skills/` and `agents/` are created empty — the SKILL.md files and openai.yaml land in later phases. Use `.gitkeep` in each empty directory if needed to ensure git tracks them.

### 2. plugin.json

Create `packages/skills/archive-docs/plugin.json` with the following structure:

```json
{
  "name": "archive-docs",
  "version": "0.1.0",
  "description": "Relationship-aware document archival, staleness detection, deprecation, and impact analysis for make-docs projects.",
  "skills": [
    {
      "name": "archive",
      "path": "skills/archive/SKILL.md",
      "description": "Core archival with 4 modes (direct, related, replacement, project), user interview flow, and post-archive link rewriting."
    },
    {
      "name": "staleness-check",
      "path": "skills/staleness-check/SKILL.md",
      "description": "Advisory scan of the doc tree for archival candidates based on completion, deprecation, supersession, and reference signals."
    },
    {
      "name": "deprecate",
      "path": "skills/deprecate/SKILL.md",
      "description": "Mark artifacts as superseded in place without moving them to the archive."
    },
    {
      "name": "archive-impact",
      "path": "skills/archive-impact/SKILL.md",
      "description": "Dry-run impact analysis showing files to move, broken links, proposed rewrites, and warnings."
    }
  ]
}
```

Keep the manifest minimal — no dependency declarations, no hook definitions, no configuration beyond what is shown. The `path` field for each skill is relative to the plugin root.

### 3. archive-workflow.md

Create `packages/skills/archive-docs/references/archive-workflow.md` as the shared authority file. This is the single reference that all four SKILL.md files will point to for detailed rules. It must cover every topic below, each as a top-level section.

#### 3a. Four archival modes

Define the four modes with a decision table:

| Mode | Trigger | Behavior |
| --- | --- | --- |
| **Direct archive** | "Archive this design / plan / work backlog" | Archive the named target. Trace relationships and interview the user about upstream, downstream, and lateral artifacts. |
| **Related archive** | "Archive all docs related to {target}" | Identify the target but do NOT archive it. Find and present all related artifacts for the user to select from. |
| **Replacement archive** | "This new design replaces the old one" / agent detects `## Design Lineage` with `updated-existing` | Archive the superseded artifact. Offer to rewrite links in downstream artifacts that pointed to the old one. |
| **Project archive** | "Archive everything for {initiative/slug}" | Trace the full design -> plan -> work -> guides chain for the initiative. Present the complete set for user confirmation. |

Include the rule: mode detection is intent-based — the skill infers the mode from the user's phrasing and confirms before proceeding.

#### 3b. Relationship tracing rules

Document all three tracing directions and the fallback:

**Upstream tracing (from target, find ancestors):**
- Work backlog: scan `00-index.md` or phase files for links to `docs/plans/`.
- Plan: scan `00-overview.md` for links to `docs/designs/`.
- Agent guide: parse `w{W}-r{R}-p{P}` from filename, find matching plan/work directories with the same wave.

**Downstream tracing (from target, find dependents):**
- Design: scan `docs/plans/` for overview files linking back to the design.
- Plan: scan `docs/work/` for index files linking back to the plan.
- Plan/Work: scan `docs/guides/agent/` for guides matching the same wave/revision.

**Lateral tracing:**
- Any artifact: scan `docs/guides/developer/` and `docs/guides/user/` for guides with `related` frontmatter entries pointing to the artifact.

**Slug-based heuristic fallback:**
- When link-based tracing misses relationships, fall back to slug matching — a plan with slug `guide-structure-contract` is likely related to a design with the same slug. Present heuristic matches with lower confidence than link-based matches.

#### 3c. Interview flow

Document the six-step interview flow with question templates:

1. **Identify the target(s)** — parse the user's request to determine which artifact(s) to archive.
2. **Trace relationships** — find upstream, downstream, and lateral artifacts related to each target.
3. **Present findings** — show the user a grouped summary. Question template: "I found these related artifacts. Which would you also like to archive?" Group by relationship type (upstream, downstream, lateral). Mark each with a recommendation. Clearly distinguish what the user explicitly asked to archive vs. what the skill is suggesting.
4. **Confirm** — wait for explicit user approval. The user can select all, some, or none.
5. **Execute** — move approved artifacts to `docs/.archive/` following the sub-directory mapping.
6. **Post-archive link rewriting** — scan remaining active artifacts for links to newly archived files. Rewrite relative paths. Present the rewrites for user confirmation before applying.

Include at least two example question templates:
- Recommendation template: "{artifact path} — upstream design. Recommend archiving since all downstream work is complete."
- Link rewrite template: "In {file}, rewrite `{old relative path}` to `{new archive-relative path}`?"

#### 3d. Replacement detection rules

Document four replacement signals:

1. **Explicit user statement**: "This new design replaces {old design}."
2. **Design Lineage section**: A design with `Update Mode: new-doc-related` and `Prior Design Docs:` linking to an earlier design.
3. **Guide frontmatter**: A guide with `status: deprecated` and `related:` pointing to a replacement.
4. **Same-slug heuristic**: A new plan/work directory with the same slug as an existing one (different wave/date prefix).

On detection, the skill offers to archive the superseded artifact and rewrite downstream references.

#### 3e. Link rewriting rules

Document the path transformation:
- When a file moves from `docs/{type}/{name}` to `docs/.archive/{type}/{name}`, all relative links in surviving artifacts that pointed to the original location must be updated to point to the archive location.
- Pattern: replace the relative path segment with the `.archive/` equivalent (e.g., `../../plans/2026-04-16-w2-r0-foo/` becomes `../../.archive/plans/2026-04-16-w2-r0-foo/`).
- All link rewrites require user confirmation before applying.
- The skill must present each rewrite showing the old path and new path side by side.

#### 3f. Staleness detection signals

Define the signal table:

| Signal | Applies to | Detection |
| --- | --- | --- |
| All downstream phases complete | Work backlogs | Every acceptance criterion checkbox in phase files is checked (`- [x]`) |
| All downstream work complete | Plans | Every work backlog derived from the plan has all phases complete |
| All downstream plans and work complete | Designs | Every plan derived from the design has all work complete |
| Status is `deprecated` | Developer/user guides | Frontmatter `status: deprecated` |
| Superseded by a newer artifact | Designs, plans | A newer artifact with the same slug or a `## Design Lineage` link exists |
| No active references | Any artifact | No other active (non-archived) artifact links to this one |

#### 3g. Deprecation rules

Document the deprecation mechanism:
- **Notice format**: A blockquote inserted after frontmatter:
  ```
  > **Deprecated:** This document has been superseded by [replacement](relative-link). It is retained for historical reference.
  ```
- **Frontmatter update**: For guides with YAML frontmatter, set `status: deprecated`.
- **Replacement recording**: Optionally record what replaced the artifact (user provides or the skill detects via lineage/slug matching).
- **No file move**: Deprecated files stay in their original location. They do NOT move to `docs/.archive/`.
- **Relationship to archival**: Deprecation is a precursor to archival. A deprecated artifact can later be archived via the `archive` skill. The `staleness-check` skill treats `deprecated` status as a staleness signal.

#### 3h. Impact analysis output format

Define the structured output for the `archive-impact` skill:

- **Files to move**: List of source paths and their archive destination paths.
- **Broken links**: List of active artifacts that link to the target(s), with the specific link text and line number.
- **Proposed rewrites**: For each broken link, the old relative path and the new archive-relative path.
- **Reference counts**: Count of agent guides, developer guides, and user guides that reference the target.
- **Warnings**: Whether the target has incomplete downstream work, unreplaced references, or other concerns.

#### 3i. Relationship to existing authorities

State the boundary clearly:
- `docs/.archive/AGENTS.md` remains the authority for archive directory structure and the hard rule "never archive unless the user explicitly asks."
- `docs/.references/output-contract.md` remains the authority for PRD full-set archive rules.
- This reference (`archive-workflow.md`) governs the *workflow* for getting to archival — modes, tracing, interview, replacement, link rewriting, staleness, deprecation, and impact analysis. It does not override or duplicate the structural rules in `AGENTS.md`.

### 4. trace_relationships.py

Create `packages/skills/archive-docs/scripts/trace_relationships.py` as a standalone Python script. It must:

**Arguments:**
- `--doc-root` (required): path to the `docs/` directory to scan (e.g., `docs/`).
- `--output` (optional): path to write the JSON report. Defaults to stdout.
- `--format` (optional): output format, `json` (default) or `text` for a human-readable summary.

**Scanning logic:**
1. Walk the doc root and identify artifact directories:
   - `designs/` — individual `.md` files.
   - `plans/` — directories containing `00-overview.md` and phase files.
   - `work/` — directories containing `00-index.md` and phase files.
   - `guides/agent/`, `guides/developer/`, `guides/user/` — individual `.md` files.
2. For each artifact, extract all relative markdown links (`[text](path)`) from its files.
3. Resolve relative links to absolute paths (relative to doc root).
4. Classify each link as upstream, downstream, or lateral based on the artifact type rules:
   - A link from a plan overview to a design is upstream.
   - A link from a work index to a plan is upstream.
   - A link from a design to a plan that references it back is downstream.
   - A link from a guide with `related` frontmatter is lateral.
5. Build the relationship graph: for each artifact, record its upstream, downstream, and lateral relationships.

**Slug-based fallback:**
- After link-based tracing, scan for artifacts with matching slugs that have no link-based relationship.
- A slug match is the portion of the directory/file name after the date-wave prefix (e.g., `guide-structure-contract` from `2026-04-16-w2-r0-guide-structure-contract`).
- Report slug matches separately with a `"source": "slug-heuristic"` marker.

**Output format (JSON):**
```json
{
  "doc_root": "docs/",
  "scanned_at": "2026-04-16T12:00:00Z",
  "artifacts": {
    "designs/2026-04-16-example.md": {
      "type": "design",
      "upstream": [],
      "downstream": [
        {
          "path": "plans/2026-04-16-w1-r0-example/",
          "source": "link",
          "link_location": "plans/2026-04-16-w1-r0-example/00-overview.md:5"
        }
      ],
      "lateral": []
    }
  }
}
```

**Requirements:**
- Python 3.9+ with no external dependencies (stdlib only: `argparse`, `pathlib`, `re`, `json`, `os`, `datetime`).
- Runs standalone: `python scripts/trace_relationships.py --doc-root docs/`
- Exit code 0 on success, non-zero on errors (missing doc root, parse failures).
- Graceful handling of broken links (report them but don't crash).
- Skip the `.archive/` directory when scanning for active artifacts.

## Parallelism

Once the directory scaffold exists, the three asset files can be created in parallel:
- `plugin.json` — no dependencies on other assets.
- `archive-workflow.md` — no dependencies on other assets.
- `trace_relationships.py` — no dependencies on other assets.

The directory scaffold must be created first since all three files live inside it.

## Acceptance Criteria

- [ ] The full directory tree under `packages/skills/archive-docs/` exists, matching the structure in the design.
- [ ] Empty skill directories (`archive/`, `staleness-check/`, `deprecate/`, `archive-impact/`) and `agents/` are tracked by git (via `.gitkeep` or equivalent).
- [ ] `plugin.json` is valid JSON, contains `name: "archive-docs"`, `version: "0.1.0"`, and lists all four skills with correct relative paths.
- [ ] `archive-workflow.md` covers all nine topics: archival modes, relationship tracing, interview flow, replacement detection, link rewriting, staleness signals, deprecation rules, impact analysis format, and relationship to existing authorities.
- [ ] `trace_relationships.py` accepts `--doc-root`, scans designs/plans/work/guides, extracts markdown links, builds the upstream/downstream/lateral graph, falls back to slug matching, and outputs valid JSON.
- [ ] `python packages/skills/archive-docs/scripts/trace_relationships.py --doc-root docs/` runs without errors against the dogfood doc tree.
- [ ] The script skips `docs/.archive/` when scanning.
- [ ] The script uses only Python stdlib (no `pip install` required).
