# Design Naming Simplification — Drop W/R from Design Filenames

> Filename: `2026-04-16-design-naming-simplification.md`. This design uses the simplified naming convention it proposes.

## Purpose

Remove the Wave/Revision (`w{W}-r{R}`) encoding from design document filenames, simplifying the naming pattern from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`. Designs become wave-agnostic decision records that feed into downstream plans and work backlogs without implying a 1:1 relationship with a specific iteration cycle.

## Context

The W/R/P encoding defined in `docs/.references/wave-model.md` was designed to track iteration flow: a wave is one end-to-end design → plan → work cycle. Plans and work backlogs use W/R to sequence initiative flow within their respective directories, and the resolution rules (scan the target directory, increment W for new initiatives) work well for those artifact types.

Designs, however, have been using the wave number differently — as a **project epoch marker** rather than an iteration counter. All seven current designs in `docs/designs/` are labeled `w2-r0`, which signals "decided during Wave 2 of the project" but says nothing about which downstream cycle they belong to. A `w2` design can produce a `w3` plan (because `w2` is already taken in `docs/plans/`), creating a visible wave-number mismatch that undermines the encoding's purpose.

The root cause is a semantic mismatch: W/R on plans and work means "this is the Nth initiative cycle." W/R on designs means "this was written during the Nth project era." These are different concepts sharing the same encoding, which creates confusion without adding traceability.

### Current state

- **Design naming**: `YYYY-MM-DD-w{W}-r{R}-<slug>.md` (per `design-contract.md` and `wave-model.md`)
- **Plan naming**: `YYYY-MM-DD-w{W}-r{R}-<slug>/` (per `wave-model.md`)
- **Work naming**: `YYYY-MM-DD-w{W}-r{R}-<slug>/` (per `wave-model.md`)
- **Existing designs**: 7 files, all `w2-r0`
- **Existing plans**: 1 directory, `w2-r0`
- **Existing work**: 1 directory, `w2-r0`
- **The `r{R}` revision mechanism** has never been used on designs — revisions have been handled by writing new designs with `## Design Lineage` linking back to prior docs

## Decision

### 1. Simplify design filename pattern

Change the required design filename from:

```
docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md
```

to:

```
docs/designs/YYYY-MM-DD-<slug>.md
```

The date prefix provides chronological ordering. The slug provides topical identity. Together they uniquely identify a decision record without binding it to a wave.

### 2. Plans and work retain W/R

No change to plan or work naming. The `YYYY-MM-DD-w{W}-r{R}-<slug>/` pattern remains correct for those artifact types, where W/R genuinely tracks initiative flow.

### 3. Design revisions use lineage, not R

The `r{R}` revision mechanism is dropped from design filenames. When a design is substantially revised or superseded:

- Write a new dated design with a different slug (or the same slug if the topic is identical).
- Use the existing `## Design Lineage` section to link back to the prior design with `Update Mode: new-doc-related` or `updated-existing`.
- The prior design remains in place as a historical record (or is archived if the user explicitly requests it).

This is already the de facto practice — no existing design has ever used `r1` or higher.

### 4. Wave model exempts designs

Update `docs/.references/wave-model.md` to:

- Remove designs from the naming patterns table (or mark them as exempt alongside PRDs).
- Add a "Design Exemption" section (parallel to the existing "PRD Exemption") explaining that designs use `YYYY-MM-DD-<slug>.md` and are wave-agnostic.

### 5. Users can optionally add wave markers

The contract does not prohibit users from manually including wave identifiers in design slugs (e.g., `2026-04-16-w3-auth-redesign.md`). However, the contract does not generate them, agents do not apply them by default, and the resolution rules in the wave model do not apply to designs.

### 6. Files to update

| File | Change |
| --- | --- |
| `packages/docs/template/docs/.references/wave-model.md` | Remove designs from the naming patterns table; add "Design Exemption" section. |
| `packages/docs/template/docs/.references/design-contract.md` | Update "Required Path" to `YYYY-MM-DD-<slug>.md`; remove the `wave-model.md` reference in the path section. |
| `packages/docs/template/docs/.references/design-workflow.md` | Update path references from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`. |
| `packages/docs/template/docs/.templates/design.md` | Update the filename blockquote to reflect the simplified pattern. |
| `packages/docs/template/docs/designs/AGENTS.md` | Update naming convention pattern and example. |
| `packages/docs/template/docs/designs/CLAUDE.md` | Mirror AGENTS.md changes. |
| `packages/cli/src/renderers.ts` | Update `renderDesignWorkflow`, `renderDesignContract`, and `renderDesignTemplate` to emit simplified path patterns. |
| `packages/cli/tests/*.ts` | Update any path-substring assertions that match `w{W}-r{R}` in design filenames. |
| `docs/` (dogfood) | Re-seed updated references, templates, and routers from the template. |

### 7. Existing designs are not renamed

The seven existing `w2-r0` designs in `docs/designs/` are not renamed. They were written under the prior convention and remain valid historical records. New designs going forward use the simplified pattern. This avoids churn and preserves git history.

## Alternatives Considered

**Keep W/R on designs but redefine the semantics.** Treat the wave number on designs as a project epoch rather than an iteration counter, and document that explicitly. Rejected because: it enshrines the semantic split — the same encoding meaning different things on different artifact types — which is the root cause of the confusion. Better to remove the encoding where it doesn't fit.

**Drop W but keep R on designs.** The revision mechanism could still be useful for tracking substantial rewrites of the same decision. Rejected because: `r{R}` has never been used on designs in practice, and the `## Design Lineage` section already handles this use case with richer context (mode, prior docs, reason). Keeping `r{R}` adds complexity for a mechanism that is redundant with existing contract features.

**Rename existing designs to drop W/R.** Migrate all seven `w2-r0` designs to the new pattern for consistency. Rejected because: the churn is high (7 renames, broken links in plans/work backlogs that reference them, git history disruption) and the benefit is purely cosmetic. Existing files are valid under the prior convention.

**Use frontmatter instead of filename for wave association.** Add an optional `wave` field to design frontmatter for projects that want epoch grouping. Considered but deferred — designs don't currently have YAML frontmatter (unlike the new guide contract), and adding it is a larger change. Can be revisited if demand emerges.

## Consequences

**What improves:**

- Design filenames are simpler and self-explanatory: date + topic.
- No more wave-number mismatches between designs and their downstream plans.
- The W/R encoding is reserved for artifact types where it genuinely tracks iteration flow (plans, work, agent guides).
- Consumers who don't use waves at all get a cleaner design naming convention out of the box.

**What shifts:**

- Six files in the template package need updating (wave-model, design-contract, design-workflow, design template, design routers).
- Three renderer functions in the CLI need path-pattern updates.
- Tests need assertion updates for the simplified path pattern.
- Dogfood docs need re-seeding.

**Risks:**

- Contributors familiar with the `w{W}-r{R}` pattern on designs may initially expect it. Mitigation: the design router (`docs/designs/AGENTS.md`) is the first thing agents and contributors read before writing a design, and it will carry the updated convention.
- Existing designs retain the old naming, creating a visible inconsistency in `ls` output. Mitigation: this is a cosmetic issue that diminishes over time as new designs use the simplified pattern. The old files serve as a historical record of the convention transition.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: The change touches template references, the design contract, the design workflow, renderers, and tests — a baseline plan should sequence the implementation work and identify parallelism opportunities.
