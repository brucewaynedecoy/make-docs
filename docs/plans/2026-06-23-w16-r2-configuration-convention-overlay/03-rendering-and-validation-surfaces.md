# Rendering and Validation Surfaces

## CLI and Wizard Rendering

- CLI summaries may render configured lifecycle, document-kind, coordinate, audience, and handoff labels.
- Wizard and skills UI labels may use config display labels only after canonical selections are resolved.
- `make-docs reconfigure` remains install/profile configuration until a later design chooses the user-facing command for convention overlay configuration.

## Generated Docs

- Generated prose may use configured labels.
- YAML frontmatter must keep canonical field names and values.
- Body sections required by existing contracts must remain present even if labels change in prose elsewhere.
- Validators must detect config-driven prose that conflicts with canonical frontmatter or required handoff sections.

## Personas

- Persona-scoped guide and playbook frontmatter stores the persona slug.
- Directory placement remains discovery structure, not the authority for persona identity.
- Validation must cover default personas, valid custom personas, invalid primitive values, duplicate slugs, unknown frontmatter persona slugs, and path/frontmatter drift.

## Package and Dogfood

- Any shipped default config template starts in `packages/docs/template/`.
- Package preparation copies template-owned config artifacts through the accepted source-first path.
- Repo-root dogfood uses copied template output only through planned dogfood reseeding.
- Smoke-pack and dry-run validation must prove package parity and local config preservation.

## Agentic Surfaces

- MCP, plugin, skill, and harness surfaces may display configured labels.
- Routing, prompt selection, contract selection, scenario identifiers, and generated metadata remain canonical.
- Shared validation should prevent a plugin or skill from treating configured labels as schema authority.
