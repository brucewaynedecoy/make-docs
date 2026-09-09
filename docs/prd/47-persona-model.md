# 47 Persona Model

## Purpose

This document defines the current Persona schema, configuration, and metadata semantics used by contracts that explicitly identify a Persona. A Persona is a documentation audience model, not a testing qualification boundary.

## Scope

Persona can identify affected humans for Human Experience Intent. Persona does not own the human goal, effect, promises, hidden complexity, or evidence.

This authority owns Persona primitives, configured Persona entries, execution eligibility and defaulting, and `persona` frontmatter semantics only where a current contract explicitly defines an artifact as Persona-bearing. [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) treats Library paths as bounded migration inputs and owns the Persona-specific UAT evidence path; directory grouping does not establish Persona authority.

## Component and Capability Map

- Persona provides the `for whom` axis. [PRD 49](49-human-experience-standard-and-intent.md) provides the `to what end and with what experience` axis.

- Persona primitives classify the broad audience relationship.
- Configured personas provide stable slugs and project-facing labels.
- When a current Persona-bearing contract uses YAML frontmatter, `persona` identifies the configured primary-audience slug.
- Directory placement is non-authoritative; where an applicable contract provides both a Persona-bearing path and `persona` frontmatter, validation reports disagreement instead of inferring or rewriting authority from the path.
- Naive-UAT execution resolves one eligible configured Persona and uses its actual slug for the canonical testing-evidence path.

## Requirements

### R-PERSONA-TEST Human Testing Roles and Qualification Boundary

1. Persona identifies the intended audience, language, assumptions, and evidence path. It does not prove that a person is qualified for an Unassisted Goal Test.
2. The owner, maintainer, or developer is the normal participant for Guided Progress Review. This role does not imply unassisted-test qualification.
3. Unassisted Goal Testing can use one eligible configured `user`- or `maintainer`-primitive Persona for audience framing and evidence routing, with canonical `user` as the no-input default when Persona resolution is needed.
4. Qualification remains separate and must account for private knowledge, prior coaching, implementation involvement, environment condition, and evidence integrity under PRD 46.
5. Human Experience Intent can name an affected human without creating a Persona or selecting a test executor.

### Persona Schema

Personas have two layers:

- Primitive: either `user` or `maintainer`.
- Persona: an audience entry with `slug`, `label`, `description`, and `primitive`.

A human or an agent can fill either audience role. Actor technology is not an audience primitive. The only built-in entries are:

```yaml
personas:
  - slug: user
    label: User
    description: "People or agents that use the project or its documented workflows."
    primitive: user
  - slug: maintainer
    label: Maintainer
    description: "People or agents that build, operate, maintain, or extend the project."
    primitive: maintainer
```

The effective set starts with both built-ins. An absent or empty/comment-only config, an absent `personas` key, and an empty `personas` list retain both entries. Explicit null, wrong-type, or malformed config and Persona values produce diagnostics instead of an invented effective set. Configured entries merge by slug. Custom entries extend the set and require all four fields. A built-in override may change `label` and `description`; omitted display fields inherit their defaults. A supplied built-in `primitive` must equal its fixed mapping. Built-in slugs and mappings cannot be removed, renamed, or reclassified.

Every slug must be unique lowercase kebab-case. Slugs must be safe single path segments: no separators, traversal, absolute paths, drive prefixes, or encoded path escapes. `project` is reserved for shared assets and cannot be a Persona slug. A custom primitive must be `user` or `maintainer`. An unknown primitive, duplicate slug, malformed entry, or attempted built-in change fails with a clear error and leaves config untouched.

There is no built-in `agent` or `developer` slug. A custom `agent` or `developer` entry is possible only with an explicit valid audience mapping. Migration must not infer that mapping from its name. Only verified use of the former shipped `developer` default can support a reviewed move to `maintainer`.

Canonical `user` remains the no-input UAT audience. Generated `persona` frontmatter stores the resolved slug, not its label. The resolver and validators in `packages/cli/src/config.ts` and the shared Persona operation must apply this one contract.

### Frontmatter Authority

The `persona` YAML frontmatter field records the configured primary-audience slug where an owning contract defines a Persona-bearing artifact. Audience assets under `docs/assets/<persona-slug>/**` follow the metadata contract in [PRD 23](23-generated-document-metadata-and-lifecycle-handoffs.md). Shared inputs under `docs/assets/project/**` are not assigned a Persona merely because they are project material.

Directory placement helps discovery; it never overrides explicit metadata. Validators report unknown slugs and path/metadata disagreement instead of inferring or rewriting a Persona. The `project` segment is not a valid frontmatter Persona.

Former `docs/assets/library/**` paths are finite migration inputs under [PRD 22](22-project-documentation-asset-model.md). Reviewed moves repair active Persona metadata and live links together. Historical statements retain the audience and outcomes they recorded; migration must not rewrite those facts as current claims.

### Affected-Human and Experience Boundary

- Persona answers `for whom`. Human Experience Intent answers `to what end and with what experience`.
- For `direct` and `indirect` impact, `Affected humans` can use configured Persona slugs, clear human roles, or both.
- Use a configured Persona when the project already has a suitable one. Do not invent a Persona only to complete Human Experience Intent.
- An audience role filled by an agent does not prove a human effect or lived human experience. Agent-facing work can still affect people who author, review, operate, maintain, recover, or rely on the result.
- The Human Experience capability does not change the Persona schema, eligibility rules, frontmatter authority, evidence-path routing, canonical `user` default, or independent tester boundary.
- See [PRD 49](49-human-experience-standard-and-intent.md) for the impact and intent model.

### Configuration and Metadata Boundary

The configuration overlay may relabel presentation vocabulary but must not rename the canonical paths, field names, primitive names, or schema keys defined here. Any such change requires authoritative maintenance of this PRD and the applicable asset/configuration owners before implementation.

[23-generated-document-metadata-and-lifecycle-handoffs.md](23-generated-document-metadata-and-lifecycle-handoffs.md) may define additional relationship fields only where an owning current contract explicitly identifies an artifact as Persona-bearing. Within that contract, `persona` remains the canonical target field and directory placement remains non-authoritative; this boundary must not recreate Library as a managed target.

### Testing and UAT Boundary

Unassisted Goal Testing remains a distinct testing decision. When Persona resolution applies, an activated execution resolves exactly one effective Persona. Explicit input must name an entry mapped to `user` or `maintainer`; omitted input resolves to canonical `user`. Unknown or invalid input fails closed. The actual selected slug controls `docs/assets/<persona-slug>/testing/**` routing.

The execution actor is a separate field of the test evidence. A human or agent filling the selected audience role does not establish tester qualification. [PRD 46](46-naive-end-user-acceptance-testing.md#r-nuat-scope-qualified-tester-and-installed-product) retains its isolation, prior-knowledge, public-path, environment, and evidence checks. An agent may execute only where that contract permits and with its required isolation proof. Selecting `maintainer` never permits private source access or coaching.

Persona selection cannot certify lived human understanding, satisfaction, or a Human Experience Review. The applicable human-review evidence and reviewer limits remain required.

## Contracts and Data

Persona entries use `slug`, `label`, `description`, and `primitive`. Where an owning current contract explicitly defines an artifact as Persona-bearing, its `persona` frontmatter value must resolve to a configured Persona slug; this does not create a Persona-scoped Library family.

Unassisted Goal Test Persona resolution returns the actual configured slug plus its `user` or `maintainer` primitive, records whether selection was explicit or defaulted, and fails closed for ineligible input. The selected slug is the only valid `<persona-slug>` for `docs/assets/<persona-slug>/testing/**`; those testing assets bind to PRD-owned canonical `NUAT-###` scenarios and do not become Persona or scenario authority.

## Integrations

- [PRD 49](49-human-experience-standard-and-intent.md) can use configured Persona slugs or clear human roles as affected humans. It does not change Persona schema, primitives, frontmatter, testing paths, or tester qualification.

- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) treats Library paths as bounded migration inputs and owns `docs/assets/<persona-slug>/testing/**` as the project evidence namespace; PRD47 supplies configured-slug semantics without making directory grouping authoritative.
- [23 Generated Document Metadata and Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md) preserves `persona` only for artifacts whose current owning contract explicitly defines them as Persona-bearing while adding relationship metadata.
- [24 Project Configuration and Convention Overlay](24-project-configuration-and-convention-overlay.md) may add personas or relabel presentation text without changing canonical schema keys or primitive values.
- [46 Unassisted Goal Testing](46-naive-end-user-acceptance-testing.md) owns qualified-human isolation, scenarios, public goals, anti-coaching, evidence, findings, and gate effects while consuming eligible Persona resolution and the canonical `user` default from this PRD.
- [50 Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md) owns Guided Progress Review, Unassisted Goal Test selection, human testing experience, and shared gate effects.

## Rebuild Notes

Preserve stable Persona slugs, primitive values, and `persona` frontmatter authority only where a current Persona-bearing contract applies. Treat Library paths as migration inputs rather than targets or publication grouping, and never infer Persona authority from a directory. Preserve canonical `user` as the no-input UAT default, accept only configured `user`- or `maintainer`-primitive execution Personas, route evidence by the actual selected slug, and do not model a naive tester as a configured Persona.

## Requirement History

### 2026-08-08 — W9 R3

- Affected requirement or section: `Persona authority`
- Previous contract: Persona requirements were embedded in an editorial PRD that also owned the project documentation asset namespace.
- Replacement contract: Persona schema and metadata authority are owned here; project asset paths remain in PRD 22.
- Rationale: Persona modeling is a coherent capability with a distinct ownership boundary, while active PRDs must be named for product subjects rather than editorial operations.
- Source: [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Persona Schema`, `Frontmatter Authority`, `Configuration and Metadata Boundary`, `Testing and UAT Boundary`, `Contracts and Data`, and `Integrations`
- Previous contract: Testing/UAT was described as non-persona, Persona authority assumed Playbook delivery and persona-scoped Library publication/grouping, and no canonical eligible execution-Persona/default or testing-evidence path contract existed.
- Replacement contract: Every activated Naive-UAT execution resolves one configured `user`- or `maintainer`-primitive Persona, defaults to canonical `user`, fails closed for ineligible input, keeps tester isolation independent, and routes Persona-specific evidence by the actual selected slug under `docs/assets/<persona-slug>/testing/**`; Library paths are migration inputs rather than targets, and `persona` frontmatter is canonical only where a current owning contract explicitly defines a Persona-bearing artifact.
- Rationale: W19 R1 makes PRDs 46 and 47 one acceptance unit so Persona selection cannot diverge from UAT qualification, evidence routing, or anti-coaching, while aligning Persona metadata with PRD22's migration boundary and retiring Playbook and Library delivery assumptions.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W20 R0

- Affected requirement or section: scope, requirements, contracts, integrations, and `Affected-Human and Experience Boundary`.
- Previous contract: Persona identified an audience and supported UAT selection, but it did not state its boundary with Human Experience Intent.
- Replacement contract: Persona remains the `for whom` axis. Human Experience Intent owns the goal, effect, promises, hidden complexity, and evidence axis without a Persona schema change.
- Rationale: Audience identity and intended experience are related but different. Combining them would overload Persona and weaken both authorities.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, integrations, and human testing roles.
- Previous contract: Persona selected the audience and evidence path for activated naive UAT, but it did not name the Guided Progress Review participant or the full boundary between intended audience and unassisted-test qualification.
- Replacement contract: Persona supports audience framing for human testing; the owner, maintainer, or developer can join Guided Progress Review; and PRD 46 independently proves Unassisted Goal Test qualification.
- Rationale: Guided and unassisted activities need different human roles, and Persona must not silently certify independence.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

### 2026-09-09 — W19 R4

- Date: 2026-09-09
- Coordinate: W19 R4
- Affected requirement or section: Persona Schema; Frontmatter Authority; Testing and UAT Boundary.
- Previous contract: Three primitives and agent/developer/user defaults separated actor technology from human audience roles. Only user was retained as a mandatory built-in.
- Replacement contract: Two primitives and fixed user/maintainer built-ins describe audience roles. Config extends defaults by safe slug; metadata and reviewed migration preserve audience meaning. Tester qualification remains independent.
- Rationale: Make audience roles useful for humans and agents without adding a false human-review claim.
- Source: [Project Assets and Persona Discovery](../designs/2026-09-09-project-assets-and-persona-discovery.md), [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md). Delivery is tracked by the single-phase R4 backlog; runtime implementation has not started.

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)
- [Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md)

- [Documentation assets and persona design](../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [Generated metadata design](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [Configuration overlay design](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md)
- [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
