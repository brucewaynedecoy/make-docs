# CLI Skills Command - Skills-Only Lifecycle Surface

## Purpose

Define a dedicated `make-docs skills` command for applying, updating, and removing CLI-managed skills without running the normal docs install/update path.

This design replaces the earlier `make-docs --skills` mode idea with a command-shaped lifecycle surface. Skills are operationally distinct from the generated docs scaffold: they are resolved from hosted skill sources, installed into harness-specific skill directories, and often need to be refreshed or removed without changing templates, prompts, references, root instructions, or other docs assets.

## Context

The current CLI already supports skill installation as part of the default apply and `reconfigure` flows. It uses the same `InstallSelections` shape that controls capabilities, harnesses, prompts, templates, references, skill scope, and optional skill selection.

The shipped skill model is remote-registry driven:

- the published CLI ships `packages/cli/skill-registry.json` and its schema
- registry entries point at hosted skill roots such as `packages/skills/archive-docs`
- the CLI resolves skill entrypoints and declared assets at install time
- skills are installed as directory units under `.claude/skills/<skill>/`, `.agents/skills/<skill>/`, or the equivalent home-directory roots

The current planner combines docs assets and skill assets into one desired-file graph. That is correct for full apply/reconfigure, but it is too broad for a skills-only operation. A user who wants to refresh `archive-docs`, add `decompose-codebase`, change skill scope, or remove managed skills should not also trigger generation, pruning, conflict staging, or review output for unrelated docs, prompt, template, reference, or root instruction files.

The CLI also has an established lifecycle-command pattern through `backup` and `uninstall`, plus an established Clack UX pattern through the install wizard. A skills-only feature should follow those patterns: command-specific help, scoped validation, concise review screens, and no redundant information on any screen.

## Decision

### 1. Add `make-docs skills` as a top-level command

Add `skills` as a top-level command beside `reconfigure`, `backup`, and `uninstall`.

Canonical usage:

```sh
make-docs skills
make-docs skills --yes
make-docs skills --dry-run
make-docs skills --remove --yes
make-docs skills --target ~/Projects/example --skill-scope global --optional-skills decompose-codebase
```

Do not add or document a root-level `--skills` flag. `skills` is a command because it represents a separate lifecycle operation, not another content selection inside the default apply path.

`make-docs skills --help` should describe only the skills command. Top-level help should list `skills` as a command and should not advertise `--skills` as a root flag.

### 2. Keep remote skill source behavior unchanged

The skills command must reuse the existing skill registry and resolver behavior. It should not bundle skill payloads into the CLI package and should not introduce a second local source of truth for skill content.

The command resolves the selected required and optional skills from the registry, fetches their current hosted content, and writes the resolved entrypoint and declared support files into the selected harness skill directories.

Registry semantics remain unchanged:

- required skills install automatically whenever skills are being synced
- optional skills are selected explicitly
- `--optional-skills` accepts only optional skill ids
- hosted source resolution remains the source of truth for installed skill content

### 3. Scope the interactive flow to skills only

Interactive `make-docs skills` should use Clack screens that are specific to skill management. The flow should not show document type, prompt, template, reference, or general install screens.

The interactive flow should include:

1. Action: sync/update skills or remove managed skills.
2. Platform: select Claude Code, Codex, or both.
3. Scope: choose project or global skill installation.
4. Skills: show required skills as automatic and allow optional skill selection.
5. Review: summarize only the selected action, platforms, scope, selected optional skills, target, and planned skill file operations.

The review screen should avoid duplicating information already shown in the prior screens. Required skills should be named once in the skill selection/review context, not repeatedly across every screen.

### 4. Define command flags and validation

Accepted `make-docs skills` flags:

| Flag | Meaning |
| --- | --- |
| `--target <dir>` | Operate on a different project directory. |
| `--dry-run` | Show planned skill changes without writing files. |
| `--yes` | Skip interactive prompts and apply the command from flags/defaults. |
| `--remove` | Remove managed skill files instead of syncing selected skills. |
| `--no-codex` | Do not manage Codex skills for this run. |
| `--no-claude-code` | Do not manage Claude Code skills for this run. |
| `--skill-scope project\|global` | Choose the skill install location. |
| `--optional-skills <csv\|none>` | Replace the optional skill selection for sync runs. |

`make-docs skills` should reject normal content-selection flags because they do not apply to a skills-only command:

- `--no-designs`
- `--no-plans`
- `--no-prd`
- `--no-work`
- `--no-prompts`
- `--templates`
- `--references`

`--remove` should also reject `--optional-skills`, because removal is based on managed skill ownership rather than desired optional skill selection. `--remove` may still accept harness and scope flags if implementation uses them to narrow the managed skill removal set; otherwise the design should prefer removing all manifest-tracked skill files for the selected target.

### 5. Seed headless sync from manifest or safe defaults

`make-docs skills --yes` should support non-interactive sync.

When a manifest exists, the command should seed from saved selections, then apply any skills-command flags. This preserves the user's existing harnesses, skill scope, and optional skill choices unless flags override them.

When no manifest exists, the command should seed from skills-only defaults:

- Claude Code enabled
- Codex enabled
- skill scope `project`
- required skills only
- no optional skills

This allows a first-time skills-only install without requiring the full docs scaffold.

### 6. Write minimal tracking state for first-time skills-only installs

A first-time `make-docs skills` run may create the manifest/config state needed to track future skill updates and removals. It must not install the normal docs scaffold just to create tracking state.

For a skills-only first install, the manifest should record:

- package metadata and profile identity
- selections sufficient to reconstruct the skill state
- `files` as empty, unless a future implementation has a specific non-skill config file it intentionally manages
- `skillFiles` populated with the installed skill entrypoints and declared support files

This keeps future `make-docs skills`, `backup`, and `uninstall` behavior ownership-aware while honoring the promise that the command manages skills and nothing else.

### 7. Add a skills-only planning path

The implementation should not call the broad docs asset planner and then filter its result. It should add a skills-only planning path that computes desired skill assets, compares them against existing files and manifest skill ownership, and produces actions only for skill files.

The skills-only planner must:

- create or update desired skill files for the selected harnesses and scope
- remove stale managed skill files when a harness, scope, or optional skill selection changes
- remove manifest-tracked skill files for `--remove`
- preserve every non-skill managed file in the manifest
- preserve docs, prompts, templates, references, root instructions, conflict artifacts, and unrelated user files
- update `skillFiles` and relevant skill selections in the manifest after apply

Scope or harness changes require stale skill cleanup. For example, switching from project scope to global scope should install the selected skills globally and remove prior project-scoped managed skill files when they are still owned by the manifest and safe to remove.

### 8. Keep terminal output skill-focused

Plan and completion output should use the same Clack style as the rest of the CLI, but the labels should be skill-specific.

The plan summary should include:

- target directory
- command action: sync or remove
- skill scope
- selected platforms
- optional skill selection
- managed skill files evaluated
- creates, updates, removals, noops, and conflicts

The command should not show package-wide install/reconfigure language such as "document types", "templates", or "references". Completion messages should say that skills were synced, installed, updated, or removed.

## Alternatives Considered

**Root-level `make-docs --skills`.** Rejected because it makes skills look like a selection flag on the default apply path. The feature is a lifecycle command with its own UX, help, validation, and planner boundaries.

**Nested `make-docs skills remove`.** Rejected for the first implementation because the current parser is oriented around top-level commands with flags. `make-docs skills --remove` is clear enough and avoids introducing nested command parsing solely for this feature.

**Reuse `make-docs reconfigure` with fewer screens.** Rejected because `reconfigure` still represents the full managed docs footprint. The skills command needs to avoid docs capability decisions entirely and must not plan unrelated docs assets.

**Bundle skill payloads with the CLI.** Rejected for the same reason as the shipped R2 skill model: the CLI should ship registry metadata, while hosted skill folders remain the source of truth.

**Install skills without manifest tracking.** Rejected because update and removal safety depends on knowing which skill files are CLI-managed, especially when skills can install into both project and home-directory locations.

## Consequences

### Benefits

- Users get a focused way to refresh or remove skills without changing docs scaffolding.
- The CLI help surface becomes clearer because skills are represented as a command, not a hidden mode flag.
- First-time skills-only installs become possible without forcing docs template adoption.
- Manifest-backed ownership continues to protect user files during updates and removals.
- The Clack UX can stay clean because each screen only contains skills-relevant choices.

### Costs and constraints

- The CLI needs a dedicated command parser branch, help screen, and validation rules for `skills`.
- The planner needs a skills-only path that updates manifest skill ownership without pruning unrelated managed files.
- First-time minimal manifests must remain compatible with later full `make-docs`, `reconfigure`, `backup`, and `uninstall` flows.
- Global skill installs require the same care as existing skill management because managed files may live outside the target project tree.

### Follow-on implications

Planning should treat this as an incremental change to the shipped remote skill model. The main implementation risk is accidentally reusing full apply/reconfigure machinery in a way that modifies non-skill files. Tests should focus on proving that skills-only sync and removal touch only skill files and manifest tracking state.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-16-cli-skill-installation-r2.md](2026-04-16-cli-skill-installation-r2.md)
- Reason: this design extends the shipped remote-registry skill model with a dedicated lifecycle command. It does not replace the R2 skill installation model; it adds a narrower command surface for operating that model after or outside a full docs install.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)
- Why: this is an additive CLI enhancement against the existing skill installation behavior, so downstream work should plan a focused change rather than regenerate the baseline docs installation design.
