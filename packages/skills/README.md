# Document Skills

This workspace is the sole authoring source for the seven optional first-party Skills: `archive-docs`, `cleanup-docs`, `decompose-codebase`, `preflight`, `software-factory`, `human-experience`, and `naive-uat` (Unassisted Goal Testing). The CLI build reads each file declared in `packages/cli/skill-registry.json` and embeds its bytes in `dist/`. It creates no separate Skill payload tree under `packages/cli` or `packages/docs`. First-party installs read only those embedded bytes, without network or checkout fallback.

The installed path authority is the scope and harness matrix in [PRD 28](../../docs/prd/28-shared-agentics-installation-and-harness-exposure.md#shared-agentics-store). Standard agent directories hold installed Skill files. The global Make Docs Store holds installation state. Never create an active `.make-docs/agentics` Skill root. Earlier proof of that private layout is superseded and is not authoring guidance.

## Adding a Skill

1. Create `packages/skills/<skill-slug>/SKILL.md` with skill frontmatter and
   concise operating instructions.
2. Add `agents/openai.yaml` for Codex-facing display metadata.
3. Put detailed workflows in `references/` and deterministic helpers in
   `scripts/` only when they materially reduce repeated agent work.
4. Add the skill to `packages/cli/skill-registry.json`, including every
   reference, script, and metadata file that installed skills must receive.
5. Build and test the package. Use the public CLI to install selected Skills at standard locations: project Claude-only `.claude/skills`, project Codex-only `.agents/skills`, project both `.agents/skills` plus Claude access, and global `~/.agents/skills` plus selected access. Never add a private `.make-docs` Skill layer; install state belongs in the global Store. Use reviewed `setup skills --adopt-existing` for existing unmanaged copies; do not copy files or write ownership records by hand.
6. Update tests for registry declarations, standalone references, exact embedded and installed bytes, source refusal, and native exposure. Preserve the three explicit-use policies in their native metadata.

## Validation

Run focused helper tests for any changed skill scripts, then run:

```bash
npm test -w packages/cli -- embedded-skills skill-catalog skill-registry
```

For release-facing changes, also run:

```bash
npm run build -w packages/cli
npm run smoke:pack
```
