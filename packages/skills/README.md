# Document Skills

This workspace is the authoring source for package-shipped agent skills. The
publishable CLI does not bundle this workspace directly; it ships
`packages/cli/skill-registry.json`, and that registry points at remote skill
roots under `packages/skills/`.

## Adding a Skill

1. Create `packages/skills/<skill-slug>/SKILL.md` with skill frontmatter and
   concise operating instructions.
2. Add `agents/openai.yaml` for Codex-facing display metadata.
3. Put detailed workflows in `references/` and deterministic helpers in
   `scripts/` only when they materially reduce repeated agent work.
4. Add the skill to `packages/cli/skill-registry.json`, including every
   reference, script, and metadata file that installed skills must receive.
5. Mirror the installable file set into `.agents/skills/<skill-slug>/` and
   `.claude/skills/<skill-slug>/`; do not edit mirrors independently.
6. Update CLI tests for registry asset declarations, install-time references,
   skill catalog selection, and mirror parity.

## Validation

Run focused helper tests for any changed skill scripts, then run:

```bash
npm test -w packages/cli -- consistency install skill-catalog skill-registry
```

For release-facing changes, also run:

```bash
npm run build -w packages/cli
npm run smoke:pack
```
