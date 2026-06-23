# Generated Metadata Schema

## Purpose

Define the schema that future generated make-docs documents should carry in YAML frontmatter.

## Common Fields

Every generated make-docs document has:

```yaml
title: "{{TITLE}}"
kind: "{{KIND}}"
status: "{{STATUS}}"
```

`kind` is one of:

- `design`
- `plan`
- `prd`
- `work`
- `history`
- `guide`
- `playbook`

`status` is a shared field name whose allowed values are narrowed by the owning contract. Initial v2 work should preserve existing status meanings, including guide `draft`, `published`, and `deprecated`, history `completed`, and planning-stage `draft`, `active`, `accepted`, `superseded`, or `deprecated` where applicable.

## Conditional Fields

Generated documents add fields when the condition applies:

- `coordinate`: required when W/R/P lineage is known or when the document is the authority for a downstream coordinate handoff.
- `persona`: required for persona-scoped guides and playbooks; the value is the configured persona slug from PRD 22.
- `source`: required when the document derives from an explicit source other than the immediately prior lifecycle artifact.
- `lifecycle`: required when a generation step skips, reorders, revisits, or straddles the default lifecycle.
- `follow_on`: required for generated documents that contain an `## Intended Follow-On` body section.

Unknown coordinate levels are omitted, not filled with placeholders.

## Source Metadata

```yaml
source:
  type: "{{SOURCE_TYPE}}"
  path: "{{REPO_RELATIVE_PATH}}"
```

Initial `source.type` values are:

- `design`
- `plan`
- `prd`
- `work`
- `history`
- `artifact-roadmap`
- `artifact-seed`
- `implementation-closeout`
- `manual-request`

Provider/cache provenance for tool resources belongs in `.make-docs/**` resource/manifest contracts rather than reader-facing document metadata.

## Configuration Boundary

Configuration overlays may change presentation labels in generated prose, but they must not rename canonical frontmatter fields, `kind` values, `persona`, route identifiers, prompt paths, or lifecycle departure slugs unless a later accepted design supersedes PRD 23.
